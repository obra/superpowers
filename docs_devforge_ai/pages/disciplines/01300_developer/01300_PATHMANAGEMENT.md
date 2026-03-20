# Path Management System

## Overview

The application uses a webpack-based path management system with module resolution and aliases for all components and pages, fully supporting the Single-Page Application (SPA) architecture.

## Core Components

### 1. Webpack Path Resolution

The webpack configuration provides path resolution through aliases, which are defined as absolute paths to their respective directories:

```javascript
// webpack.config.js
resolve: {
  alias: {
    '@common': path.resolve(__dirname, '../src/common'),
    '@components': path.resolve(__dirname, '../src/components'),
    '@pages': path.resolve(__dirname, '../src/pages'), // Defined as an absolute path
    '@assets': path.resolve(__dirname, '../src/common/assets'),
    '@modules': path.resolve(__dirname, '../src/modules')
  }
}
```

Usage in components:

```javascript
// Import using aliases
import { Button } from '@components/Button';
import { useAuth } from '@common/hooks/useAuth';
import homePageStyles from '@pages/00100-home/css/00100-pages-style.css';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
```

### 2. Core Features

1. **Webpack Features**

```javascript
// Module Resolution
resolve: {
  extensions: ['.js', '.jsx', '.css', '.json'],
  modules: ['node_modules', 'src']
}

// Note on JavaScript/JSX file parsing and dynamic imports:
// To ensure correct parsing of ES module syntax (import/export) in a CommonJS project,
// the webpack rule for .js/.jsx files includes `type: 'javascript/auto'`.
// Additionally, for dynamically generated files like `client/src/generated/modalRegistry.js`,
// a specific rule forces its `type` to `javascript/esm` to ensure proper resolution of dynamic `import()` statements.

// Asset Handling
module: {
  rules: [
    {
      test: /\.(png|svg|jpg)$/,
      type: 'asset/resource',
      generator: {
        filename: 'assets/[name][ext]'
      }
    }
  ]
}

// Environment Variables
plugins: [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.BASE_PATH': JSON.stringify(process.env.NODE_ENV === 'development' ? '' : '/')
  })
]
```

## Best Practices

### 1. Webpack Usage

```javascript
// Use aliases for clean imports
import { Button } from '@components/Button';
import styles from './styles.module.css';
import logo from '@assets/images/logo.svg';

// Dynamic imports
const MyComponent = React.lazy(() => import('@components/MyComponent'));
// Note: For dynamic imports using aliases, `webpack.ContextReplacementPlugin` is used
// in `webpack.config.js` to provide explicit context for Webpack's static analysis,
// helping to resolve "Module not found" errors and optimize bundling.

// CSS Modules
import styles from './styles.module.css';
const className = styles.container;
```

### 2. Directory Structure

```
client/
├── src/                    # Webpack-managed source
│   ├── common/            # Common resources
│   ├── components/        # React components
│   ├── modules/          # Feature modules
│   └── pages/            # Page components
│
└── config/               # Configuration
    └── webpack.config.js # Webpack setup
```

### 3. Error Handling

```javascript
// Always handle potential errors
try {
  const path = window.resolvePath('/path/to/resource');
  element.src = path;
} catch (error) {
  console.error('[Paths] Failed to set resource path:', error);
  element.src = '/path/to/fallback';
}
```

## Webpack Development Server Configuration

```javascript
// webpack.config.js
devServer: {
  static: [
    {
      directory: path.resolve(__dirname, '../dist2'),
      publicPath: '/'
    },
    {
      directory: path.resolve(__dirname, '../src/common/assets'),
      publicPath: '/assets'
    },
    {
      directory: path.resolve(__dirname, '../src/modules'),
      publicPath: '/modules'
    }
  ],
  historyApiFallback: true,
  hot: false,
  liveReload: true,
  port: 3000,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Security-Policy": "default-src 'self' ws: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: http: https:;"
  }
}
```

## Debugging

### 1. Debug Mode

```javascript
// Enable debug logging
window.__DEBUG = true;

// Debug logs will show:
// - Path resolution steps
// - Environment detection
// - Cache hits/misses
// - Error details
```

### 2. Common Issues

1. **Webpack Alias Issues**
   - Verify alias paths in webpack config
   - Check import statements
   - Ensure module resolution order is correct
   - **Note on Dynamic Imports:** Resolving aliases for dynamic `import()` statements, especially in a CommonJS environment, can be complex. Issues like "path doubling" (where the project root is prepended twice to an already absolute alias path) were resolved by explicitly setting `type: 'javascript/auto'` for relevant rules and using `webpack.ContextReplacementPlugin` to provide explicit context for Webpack's static analysis.

## Related Documentation

- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Client JS Architecture](0800_CLIENT_JS.md)
- [Page Implementations](1300_0000_PAGE_IMPLEMENTATIONS.md)
