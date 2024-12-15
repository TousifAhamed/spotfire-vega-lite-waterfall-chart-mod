import { DataViewRow } from "@spotfire/mods-api/visualization-mods/api";
import * as vega from "vega";
import * as vl from "vega-lite";

Spotfire.initialize(async (mod: Spotfire.Mod) => {

    // Create the read function.
    const reader = mod.createReader(mod.visualization.data(), mod.windowSize(), mod.property("myProperty"));

    // Store the context.
    const context = mod.getRenderContext();

    // Initiate the read loop
    reader.subscribe(render);


    async function render(dataView: Spotfire.DataView, windowSize: Spotfire.Size, prop: Spotfire.ModProperty<string>) {

        // Check the data view for errors
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            // Showing an error overlay will hide the mod iframe.
            // Clear the mod content here to avoid flickering effect of
            // an old configuration when next valid data view is received.
            mod.controls.errorOverlay.show(errors);
            return;
        }
        mod.controls.errorOverlay.hide();


        // Get rows from dataView
        const rows = await dataView.allRows();
        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }


        // Get colors and fonts
        var font = mod.getRenderContext().styling.general.font;
		var backgroundColor = mod.getRenderContext().styling.general.backgroundColor;


        // Get axis name
        var axisCategory = dataView.categoricalAxis("Category");
        var axisValue = dataView.continuousAxis("Value");


        // Create data values object for Vega Lite
        var datavalues = rows.map( (row, index) => ({
            a: row.categorical("Category").formattedValue(),
            b: row.continuous("Value").value(),
            color: row.color().hexCode,
            rowid: row.elementId()
        }));


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
        

        // Render chart
        var vgSpec = vl.compile(vlSpec).spec;
        var view = new vega.View(vega.parse(vgSpec), {
            renderer:  'svg',
            container: '#mod-container'
        });


        // Marking
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
        

        // Signal that the mod is ready for export.
        context.signalRenderComplete();

    }
});
