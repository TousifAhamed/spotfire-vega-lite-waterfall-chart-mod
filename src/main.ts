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
        const xHierarchy = await dataView.hierarchy("X");
        if (!xHierarchy) {
            mod.controls.errorOverlay.show("Cannot find hierarchy in data view for axis 'X'.");
            return;
        }
        const xRoot = await xHierarchy.root();

        if (xRoot == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

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
            values: [
                {a: 'C', b: 2},
                {a: 'C', b: 7},
                {a: 'C', b: 4},
                {a: 'D', b: 1},
                {a: 'D', b: 2},
                {a: 'D', b: 6},
                {a: 'E', b: 8},
                {a: 'E', b: 4},
                {a: 'E', b: 7}
            ]
            },
            mark: 'bar',
            encoding: {
            y: {field: 'a', type: 'nominal', title: 'Category a'},
            x: {
                aggregate: 'average',
                field: 'b',
                type: 'quantitative',
                axis: {
                title: 'Average of b'
                }
            }
            }
        };
        
        var vgSpec = vl.compile(vlSpec).spec;

        var view = new vega.View(vega.parse(vgSpec), {
            renderer:  'svg',  // renderer (canvas or svg)
            container: '#vega-container'   // parent DOM container
          });
        view.run();
        
        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});
