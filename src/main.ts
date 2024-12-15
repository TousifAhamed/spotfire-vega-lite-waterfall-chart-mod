import { DataViewRow } from "@spotfire/mods-api/visualization-mods/api";
import * as vega from "vega";
import * as vl from "vega-lite";

Spotfire.initialize(async (mod: Spotfire.Mod) => {
    /**
     * Create the read function.
     */
    const reader = mod.createReader(mod.visualization.data(), mod.windowSize(), mod.property("myProperty"));

    /**
     * Store the context.
     */
    const context = mod.getRenderContext();

    /**
     * Initiate the read loop
     */
    reader.subscribe(render);

    async function render(dataView: Spotfire.DataView, windowSize: Spotfire.Size, prop: Spotfire.ModProperty<string>) {
        /**
         * Check the data view for errors
         */
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            // Showing an error overlay will hide the mod iframe.
            // Clear the mod content here to avoid flickering effect of
            // an old configuration when next valid data view is received.
            mod.controls.errorOverlay.show(errors);
            return;
        }
        mod.controls.errorOverlay.hide();

        /**
         * Get the hierarchy of the categorical X-axis.
         */
        const xHierarchy = await dataView.hierarchy("Category");
        if (!xHierarchy) {
            mod.controls.errorOverlay.show("Cannot find hierarchy in data view for axis 'Category'.");
            return;
        }
        const xRoot = await xHierarchy.root();

        if (xRoot == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }



        // Get rows from dataView
        const rows = await dataView.allRows();
        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

        // Create data values object for Vega Lite
        var datavalues = rows.map( (row, index) => ({
            a: row.categorical("Category").formattedValue(),
            b: row.continuous("Value").value(),
            color: row.color().hexCode,
            rowid: row.elementId()
        }));


        // Get colors and fonts
        var font = mod.getRenderContext().styling.general.font;
		var backgroundColor = mod.getRenderContext().styling.general.backgroundColor;


        /**
         * Print out to document
         */
        const container = document.querySelector("#mod-container");
        if (!container) {
            mod.controls.errorOverlay.show(
                "Failed to find the DOM node with id #mod-container which should contain the visualization."
            );
            return;
        }

        container.textContent = `windowSize: ${windowSize.width}x${windowSize.height}\r\n`;
        container.textContent += `should render: ${xRoot.rows().length} rows\r\n`;
        container.textContent += `${prop.name}: ${prop.value()}\r\n`;
        container.textContent += `Vega: ${vega.Info}`;

        // Assign the specification to a local variable vlSpec.
        var vlSpec : vl.TopLevelSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: {
                values: datavalues
            },
            width: windowSize.width,
            mark: 'bar',
            encoding: {
                y: {
                    field: 'a', 
                    type: 'nominal',
                    title: null, 
                    sort: "-x" // https://vega.github.io/vega-lite/docs/sort.html
                },
                x: {
                    aggregate: 'sum',
                    field: 'b',
                    type: 'quantitative',
                    title: null
                },
                color: {
                    field: 'color',
                    legend: null, 
                    scale: null
                },
                key: {
                    field: 'rowid'
                },
                tooltip: [
                    {field: "a", type: "nominal", title: "Category"},
                    {field: "b", type: "quantitative", aggregate: "sum", title: "Value"}
                ]
            },
            config: {
                font: font.fontFamily,
                background: backgroundColor,
                view: {
                    stroke: null
                },
                axis: {
                    labelColor: font.color,
                    labelFontSize: font.fontSize,
                    grid: false
                }
            }
        };
        
        var vgSpec = vl.compile(vlSpec).spec;

        var view = new vega.View(vega.parse(vgSpec), {
            renderer:  'svg',  // renderer (canvas or svg)
            container: '#vega-container'   // parent DOM container
        });

        view.addEventListener('click', function(event, item) {
            
            var elementId = item?.datum?.rowid;
		    var rowclicked  = rows.find( obj => { return obj.elementId() === elementId });

            if ( rowclicked){
                if (event.shiftKey) {
                    dataView.mark(new Array<DataViewRow>(rowclicked),"Add");
                }
                else {
                    dataView.mark(new Array<DataViewRow>(rowclicked),"Replace");
                }
            }

        });

        view.run();
        
        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});
