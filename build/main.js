"use strict";
(() => {
  // src/main.ts
  Spotfire.initialize(async (mod) => {
    const reader = mod.createReader(mod.visualization.data(), mod.windowSize(), mod.property("myProperty"));
    const context = mod.getRenderContext();
    reader.subscribe(render);
    async function render(dataView, windowSize, prop) {
      let errors = await dataView.getErrors();
      if (errors.length > 0) {
        mod.controls.errorOverlay.show(errors);
        return;
      }
      mod.controls.errorOverlay.hide();
      const xHierarchy = await dataView.hierarchy("X");
      if (!xHierarchy) {
        mod.controls.errorOverlay.show("Cannot find hierarchy in data view for axis 'X'.");
        return;
      }
      const xRoot = await xHierarchy.root();
      if (xRoot == null) {
        return;
      }
      const container = document.querySelector("#mod-container");
      if (!container) {
        mod.controls.errorOverlay.show(
          "Failed to find the DOM node with id #mod-container which should contain the visualization."
        );
        return;
      }
      container.textContent = `windowSize: ${windowSize.width}x${windowSize.height}\r
`;
      container.textContent += `should render: ${xRoot.rows().length} rows\r
`;
      container.textContent += `${prop.name}: ${prop.value()}`;
      context.signalRenderComplete();
    }
  });
})();
//# sourceMappingURL=main.js.map
