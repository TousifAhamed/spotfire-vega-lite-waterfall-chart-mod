import { DataViewRow, AxisPart } from "@spotfire/mods-api/visualization-mods/api";
import * as vega from "vega";
import * as vl from "vega-lite";
import manifest from "../mod-manifest.json";

// Use Spotfire from the global window object
const Spotfire = (window as any).Spotfire;

let manifestShown = false;
let currentShowLinesValue = false; // Store latest value
let currentShowLabelsValue = false; // Store latest value

Spotfire.initialize(async (mod: Spotfire.Mod) => {
    // Show manifest and port info only if running outside Spotfire (for local dev/testing)
    if (!manifestShown && window.parent === window) {
        const port = window.location.port || 'unknown';
        const infoDiv = document.createElement('div');
        infoDiv.className = 'manifest-info';
        infoDiv.innerHTML = `<b>mod-manifest.json</b> (running on port <b>${port}</b>):<br><pre>${JSON.stringify(manifest, null, 2)}</pre>`;
        const container = document.getElementById('mod-container');
        if (container) container.prepend(infoDiv);
        manifestShown = true;
    }

    // Use axis names from manifest
    const xAxisName = "X";
    const yAxisName = "Y";
    const colorAxisName = "Color"; // Add color axis name

    // Configuration properties
    const propShowLines = mod.property<boolean>("showConnectingLines"); // Let TS infer the type
    const propShowLabels = mod.property<boolean>("showBarLabels"); // Let TS infer the type

    const reader = mod.createReader(
        mod.visualization.data(),
        mod.visualization.axis(xAxisName),
        mod.visualization.axis(yAxisName),
        mod.visualization.axis(colorAxisName), // Read color axis
        mod.windowSize(),
        propShowLines, // Pass the property itself
        propShowLabels // Pass the property itself
    );

    const context = mod.getRenderContext();

    // Setup settings popout
    const settingsIcon = document.querySelector(".settings-icon");
    if (settingsIcon) {
        settingsIcon.addEventListener("click", (event) => {
            const mouseEvent = event as MouseEvent;
            const { checkbox } = mod.controls.popout.components;
            const { section } = mod.controls.popout;

            // Get current property values *before* showing the popout
            // Use the stored values from the last render call
            const currentShowLines = currentShowLinesValue;
            const currentShowLabels = currentShowLabelsValue;

            mod.controls.popout.show({
                x: mouseEvent.clientX,
                y: mouseEvent.clientY,
                autoClose: true,
                onChange: (e: { name: string; value: unknown }) => {
                    if (e.name === "showLinesCheckbox") {
                        propShowLines.set(e.value as boolean);
                    }
                    if (e.name === "showLabelsCheckbox") {
                        propShowLabels.set(e.value as boolean);
                    }
                }
            }, () => [
                section({
                    heading: "Chart Elements",
                    children: [
                        checkbox({
                            name: "showLinesCheckbox",
                            text: "Connecting Lines",
                            checked: currentShowLines, // Use stored value
                            enabled: true
                        }),
                        checkbox({
                            name: "showLabelsCheckbox",
                            text: "Bar Value Labels",
                            checked: currentShowLabels, // Use stored value
                            enabled: true
                        })
                    ]
                })
            ]);
        });
    }

    reader.subscribe(render);

    async function render(
        dataView: Spotfire.DataView,
        xAxis: Spotfire.Axis,
        yAxis: Spotfire.Axis,
        colorAxis: Spotfire.Axis, // Add back colorAxis to match reader.subscribe
        windowSize: Spotfire.Size,
        showLinesProp: Spotfire.ModProperty<boolean>, // Receive ModProperty
        showLabelsProp: Spotfire.ModProperty<boolean> // Receive ModProperty
    ) {
        // Update stored values from properties, providing default if null
        currentShowLinesValue = showLinesProp.value() ?? false;
        currentShowLabelsValue = showLabelsProp.value() ?? false;

        // Use the updated boolean values locally
        const showLines = currentShowLinesValue;
        const showLabels = currentShowLabelsValue;

        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            mod.controls.errorOverlay.show(errors);
            return;
        }
        mod.controls.errorOverlay.hide();

        const rows = await dataView.allRows();
        if (!rows) return;

        // Get axis display names
        const xAxisDisplayName = xAxis.parts.map((part: AxisPart) => part.displayName).join(" » ");
        const yAxisDisplayName = yAxis.parts.map((part: AxisPart) => part.displayName).join(" » ");

        // Map Spotfire data to Vega-Lite format (x = categorical, y = value)
        const datavalues = rows.map((row: DataViewRow) => ({
            x: xAxis.isCategorical
                ? row.categorical(xAxisName).value().map(node => node.formattedValue()).join(" » ") // Use axis name
                : row.continuous(xAxisName).value(),
            y: yAxis.isCategorical
                ? row.categorical(yAxisName).value().map(node => node.formattedValue()).join(" » ") // Use axis name
                : row.continuous(yAxisName).value(),
            color: row.color().hexCode,
            elementId: row.elementId()
        }));

        // Base Vega-Lite Layers
        const baseLayers: any[] = [
            {
                mark: { type: "bar", size: 45 },
                encoding: {
                    y: { field: "previous_sum", type: "quantitative", title: null }, // Remove y-axis title
                    y2: { field: "sum" },
                    color: {
                        field: "color", // Use the color field from data
                        type: "nominal", // Treat hex codes as nominal
                        scale: null // Use the raw hex values directly
                    },
                    key: { field: "elementId" },
                    tooltip: [
                        { field: "x", type: "nominal", title: xAxisDisplayName },
                        { field: "y", type: "quantitative", title: yAxisDisplayName },
                        { field: "amount", type: "quantitative", title: "Change" }, // Add change amount to tooltip
                        { field: "sum", type: "quantitative", title: "Cumulative Sum" } // Add cumulative sum to tooltip
                    ]
                }
            }
        ];

        // Conditionally add connecting lines layer
        if (showLines) { // Use the boolean value directly
            baseLayers.push({
                mark: {
                    type: "rule",
                    color: "#404040",
                    opacity: 1,
                    strokeWidth: 2,
                    xOffset: -22.5,
                    x2Offset: 22.5
                },
                encoding: {
                    x2: { field: "lead" },
                    y: { field: "sum", type: "quantitative" }
                }
            });
        }

        // Conditionally add text labels (sum and amount)
        if (showLabels) { // Use the boolean value directly
            baseLayers.push(
                {
                    mark: { type: "text", dy: { expr: "datum.amount >= 0 ? -4 : 4" }, baseline: { expr: "datum.amount >= 0 ? 'bottom' : 'top'" } },
                    encoding: {
                        y: { field: "sum", type: "quantitative" },
                        text: { field: "sum", type: "nominal" } // Label for cumulative sum
                    }
                },
                {
                    mark: { type: "text", fontWeight: "bold", baseline: "middle" },
                    encoding: {
                        y: { field: "center", type: "quantitative" },
                        text: { field: "text_amount", type: "nominal" }, // Label for change amount
                        color: {
                            condition: [
                                { test: "datum.x === 'Begin' || datum.x === 'End'", value: "#725a30" }
                            ],
                            value: "white"
                        }
                    }
                }
            );
        }

        // Vega-Lite Waterfall Chart Spec using Spotfire data
        const vlSpec: any = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: datavalues },
            // Use the full available space minus padding
            width: windowSize.width - 20, 
            height: windowSize.height - 20,
            autosize: {
                type: "fit",
                contains: "padding"
            },
            transform: [
                { window: [{ op: "sum", field: "y", as: "sum" }] },
                { window: [{ op: "lead", field: "x", as: "lead" }] },
                { calculate: "datum.lead === null ? datum.x : datum.lead", as: "lead" },
                { calculate: "datum.x === 'End' ? 0 : datum.sum - datum.y", as: "previous_sum" },
                { calculate: "datum.x === 'End' ? datum.sum : datum.y", as: "amount" },
                { calculate: "(datum.x !== 'Begin' && datum.x !== 'End' && datum.amount > 0 ? '+' : '') + datum.amount", as: "text_amount" },
                { calculate: "(datum.sum + datum.previous_sum) / 2", as: "center" }
            ],
            encoding: {
                x: {
                    field: "x",
                    type: xAxis.isCategorical ? "ordinal" : "quantitative",
                    sort: null,
                    axis: { labelAngle: 0, title: null } // Remove x-axis title
                }
            },
            layer: baseLayers, // Use the dynamically built layers array
            config: { text: { fontWeight: "bold", color: "#404040" } }
        };

        // Render chart
        const vgSpec = vl.compile(vlSpec).spec;
        
        // Clear previous chart before rendering a new one
        const container = document.getElementById('mod-container');
        if (container) {
            container.innerHTML = '';
        }
        
        const view = new vega.View(vega.parse(vgSpec), {
            renderer: 'svg',
            container: '#mod-container',
            hover: true
        });

        // Marking (selection)
        view.addEventListener('click', function(event: Event, item: any) { // Keep item as any for now due to Vega complexity, but use standard Event
            const mouseEvent = event as MouseEvent; // Cast to MouseEvent
            const elementId = item?.datum?.elementId;
            const rowclicked = rows.find((obj: DataViewRow) => obj.elementId() === elementId);
            if (rowclicked) {
                if (mouseEvent.shiftKey) { // Access shiftKey from MouseEvent
                    dataView.mark([rowclicked], "Add");
                } else {
                    dataView.mark([rowclicked], "Replace");
                }
            } else if (item) {
                dataView.clearMarking();
            }
        });

        view.run();
        context.signalRenderComplete();
    }
});
