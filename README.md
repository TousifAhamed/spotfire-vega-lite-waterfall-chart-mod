# Spotfire Vega-Lite Visualization Mod

This Spotfire Visualization Mod allows users to create custom visualizations within Spotfire using the powerful [Vega-Lite](https://vega.github.io/vega-lite/) grammar of graphics. It provides a flexible way to define various chart types directly from Spotfire data.

This project is based on the original work found at: [https://github.com/hski-github/spotfire-vega-lite.git](https://github.com/hski-github/spotfire-vega-lite.git)

## Features

*   Renders visualizations defined using Vega-Lite specifications.
*   Integrates with Spotfire data views and axes.
*   Supports interactive features like tooltips and marking (selection).
*   Configurable options via a settings popout (e.g., showing connecting lines, bar labels).

## How to Use

1.  **Load the Mod:** Download the `.mod` file (if available) or build it from the source. Upload it to your Spotfire library.
2.  **Add to Analysis:** In your Spotfire analysis, add the "Vega-Lite Mod" visualization from the visualizations flyout.
3.  **Configure Axes:** Assign data columns to the X, Y, and Color axes as required by your desired Vega-Lite chart.
4.  **Customize (Optional):** Use the settings icon on the visualization to toggle options like connecting lines or labels.

## Libraries Used

*   [Spotfire Mods API](https://community.spotfire.com/s/article/Spotfire-Mods-Overview): For integration with the Spotfire platform.
*   [Vega-Lite](https://vega.github.io/vega-lite/): A high-level grammar for interactive graphics.
*   [Vega](https://vega.github.io/vega/): The underlying visualization kernel used by Vega-Lite.

## Development

To set up the development environment:

```sh
npm install # Install dependencies.
npm run build # Build the mod and generate types from the manifest.
npm run start # Start the development server and watch for changes.
```

*   Open Spotfire (e.g., from your cloud instance or local installation).
*   Enable Development mode (`Tools > Options > Application > Enable Development Menu`).
*   Connect to the local development server (`Tools > Development > Connect to Visualization Mod...` using the address provided by `npm run start`).

## Bugs
- Does not fit into mod container

## To Do
- Fit into mod container
- Scrollbar
- Use axis name in tooltip
- Spotfire tooltip
- Config sort by value
- Config show value
- Config show percentage
- Remove unnecessary code
- Rectangle selection, see https://vega.github.io/vega-lite/examples/interactive_area_brush.html

## Original Getting Started (Template Info - May need updates)

To develop you need to have [Node.js](https://nodejs.org/en) installed.
The recommended IDE for developing Spotfire mods is [Visual Studio Code](https://code.visualstudio.com/).

Before you can start developing run the following commands in this folder:

```sh
npm install # Install dependencies.
npm run build # Builds the mod and generates types from the manifest.
```

Open this folder in Visual Studio Code and run the default build task, either by pressing "Ctrl + Shift + B" or by running the "Start watchers" task.
This will launch three watchers:
- the [TypeScript](https://www.typescriptlang.org/) typechecker, which makes sure you are using the API in a type-safe manner.
- a build watcher, which automatically bundles the TypeScript file found in the `src/main.ts` folder into a JavaScript file which is put in the `build` folder.
- the mods development server, which serves the mod files and mod manifest to Spotfire during development.
Your mod will be rebuilt when any TypeScript file is changed or when the mod manifest changes.

To build outside of Visual Studio Code run:

```sh
npm run build # Builds a minimized version of the mod.
npm run build:dev # Starts a file watcher and builds an unminimized version of the mod, including source maps.
```

In this template you will find the following files and directories:

File/Directory Name | Explanation
---|---
index.html|The main entry point of the mod. Contains a static script to load the API. The HEAD tag should contain the required `script` and `style` elements.
main.css|Optional static styles.
src/|Contains all TypeScript source files.
build/|Contains the bundled result (and possibly source maps) for the TypeScript code. This is the file that should be refered to from the mod manifest file and index.html.
.vscode/|Contains files which make the development experience in Visual Studio Code seamless. This includes development tasks, debugging configuration, and IntelliSense support for the mods JSON schema.
mod-manifest.json|For more information on the manifest file see the documentation website.
package.json|Defines the npm dependencies of your project as well as a set of scripts used during development.
tsconfig.json|Contains the TypeScript configuration for this project.
