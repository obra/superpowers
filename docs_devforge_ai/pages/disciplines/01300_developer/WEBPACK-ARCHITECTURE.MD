# Webpack Architecture

This document describes the webpack configuration and best practices used in this project.

## Overview

Webpack is a module bundler that takes modules with dependencies and generates static assets representing those modules. It is used to bundle JavaScript, CSS, and other assets in this project. The application has transitioned to a Single-Page Application (SPA) architecture.

## Best Practices

### Entry Point and HTML Template

The application now has a single entry point and a single HTML file:

1.  **Single Entry Point**: The main entry point is `client/src/index.js`.
2.  **Single HTML File**: `client/public/index.html` serves as the main shell for the React application.
3.  **Dynamic Content**: All page content and routing are handled dynamically by React components.

Example configuration for the main entry:

```javascript
entry: {
  main: "./client/src/index.js"
},
plugins: [
  new HtmlWebpackPlugin({
    template: './client/public/index.html',
    filename: 'index.html',
    chunks: ['main']
  })
]
```

### Development Server Access

To access the application in development:

1. Start the dev server: `npm run dev`
2. Access the application at: `http://localhost:3000/` (or the port specified in your environment)

### Asset Organization

Project structure follows this organization:

- Source files (`client/src/`):
  - Pages: `client/src/pages/[feature]/components/`
  - Modals: `client/src/components/modal/` (centralized modal components)
  - Services: `client/src/services/`
  - Utils: `client/src/utils/`

- Public files (`client/public/`):
  - Main HTML template: `client/public/index.html`
  - Static assets: `client/public/assets/` (images, fonts, etc.)

- Output files (`client/dist2/`):
  - Bundled JavaScript: `client/dist2/js/`
  - Compiled CSS: `client/dist2/css/`
  - Copied assets: `client/dist2/assets/`

## Configuration

The webpack configuration file is located at `client/config/webpack.config.js`. Following best practices, it defines:

- **`context`**: The base directory for resolving entry points and loaders.
- **`entry`**: The single entry point for the application.
- **`output`**: The output directory and filename for the bundled assets.
- **`module`**: The rules for processing different types of files.
- **`plugins`**: An array of webpack plugins that are used to perform various tasks, such as generating the HTML file, extracting CSS, and copying assets.
- **`resolve`**: Options for resolving module requests.
- **`devServer`**: Configuration options for the webpack development server.
- **`optimization`**: Options for optimizing the bundled assets.
- **`performance`**: Options for controlling webpack's performance hints.
- **`stats`**: Options for controlling the output of webpack's statistics.
- **`devtool`**: The type of source map to generate.

## Entry Point

The `entry` object defines the single entry point for the application.

Entry points should follow these best practices:

1. Use a descriptive name (e.g., `main`)
2. Point to the root of your React application

Currently defined entry point:

- `main`: Entry point for the entire Single-Page Application
    - Source: `client/src/index.js`
    - Template: `client/public/index.html`
    - Output: `client/dist2/index.html`

## Loaders

The `module` object defines the rules for processing different types of files.

The following loaders are currently used:

- `babel-loader`: Used to transpile JavaScript and JSX files. Configured with `type: 'javascript/auto'` to ensure correct parsing of ES module syntax, even in a CommonJS project.
- `css-loader`: Used to process CSS files.
- `mini-css-extract-plugin.loader`: Used to extract CSS into separate files.
- `asset/resource`: Used to handle images and other assets.

## Plugins

The `plugins` array contains webpack plugins configured according to best practices:

- `webpack.DefinePlugin`:

  - Defines global constants
  - Environment-specific configuration
  - Enables conditional code paths

- `HtmlWebpackPlugin`:

  - Generates HTML files for each entry point
  - Injects bundled assets automatically
  - Supports template customization
  - Manages multiple output pages

- `MiniCssExtractPlugin`:

  - Extracts CSS into separate files
  - Enables CSS optimization
  - Supports source maps
  - Handles CSS modules

- `CopyWebpackPlugin`:

  - Copies static assets from `public/` to `dist2/`
  - Preserves file structure
  - Handles images, fonts, etc.
  - Supports transform functions

- `webpack.ContextReplacementPlugin`:
  - Explicitly defines contexts for dynamic imports, particularly for aliases like `@pages`.
  - Helps Webpack to better analyze and bundle dynamically imported modules, resolving "Module not found" errors and "Critical dependency" warnings.
  - Example: Used to provide context for dynamic imports from `@pages` alias in `App.js` and `modalRegistry.js`.

## Aliases

The `resolve.alias` object defines clean import paths following best practices:

- `@modules`: Points to `src/modules`

  - Reusable module code
  - Shared business logic
  - Common utilities

- `@common`: Points to `src/common`

  - Shared components
  - Common styles
  - Global assets

- `@components`: Points to `src/components`

  - Reusable UI components
  - Component-specific styles
  - Component tests

- `@pages`: Points to `src/pages`
  - Page-specific components
  - Page layouts
  - Route definitions

Best practices for aliases:

1. Use meaningful prefixes (@)
2. Keep paths short and descriptive
3. Document usage patterns
4. Maintain consistent structure

This documentation provides a high-level overview of the webpack architecture used in this project. For more detailed information, please refer to the webpack documentation: <https://webpack.js.org/>
