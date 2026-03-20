# Client Application Architecture

## Directory Structure and Organization

The application is currently transitioning to a webpack-based build system, with files being progressively moved from `client/public/` to `client/src/`. This transition will improve bundling, optimization, and code organization.

### Current Directory Structure

```
client/
├── src/                     # New webpack-managed source directory
│   ├── index.js            # Main application entry point
│   ├── App.js              # Root React component
│   ├── common/             # Shared resources
│   │   ├── assets/        # Static assets
│   │   ├── css/          # Stylesheets
│   │   └── js/           # Common JavaScript modules
│   ├── components/        # Reusable components
│   ├── pages/            # Migrated page components
│   │   └── 0100-user-login/  # Example migrated page
│   └── services/         # Application services
│
├── public/                  # Legacy directory (being migrated)
│   └── pages/             # Pages pending migration
│       ├── 0150-user-signup/
│       ├── 0200-home/
│       └── [other pages]/
```

### Migration Status

- **Migrated to src/**: Core components, login page, and common utilities
- **Pending Migration**: Remaining pages in public/pages/
- **Migration Strategy**: Pages are being moved incrementally to maintain stability

### Directory Organization

1. **Source Directory (`src/`)**
   - Entry points and core application files
   - Webpack-managed assets and modules
   - Modern component architecture
   - Optimized bundling and code splitting

2. **Public Directory (`public/`)**
   - Backup storage for legacy files
   - Not used in production builds
   - Reference for migration process
   - No files copied to dist2/ during build

3. **Component Organization**
   - Reusable components in `src/components/`
   - Page-specific components in `src/pages/`
   - Common utilities in `src/common/`
   - Service layer in `src/services/`

### File Naming Conventions

1. **Numerical Prefix System**
   - 4-digit prefix indicates module/section (e.g., '2700-' for safety)
   - Additional numbers for subcategories
   - Descriptive suffix indicates purpose

   Example:

   ```
   2700-02-001-modal-upsert-files-handler.js
   │  │  │   └─ Purpose (handler)
   │  │  └───── Feature (upsert files)
   │  └──────── Subsection (02-001)
   └─────────── Section (2700 safety)
   ```

2. **Directory Structure Matching**
   - Directory names match numerical prefixes
   - Consistent naming across HTML, JS, and CSS
   - Clear relationship between related files

## Webpack Configuration

The application uses Webpack for module bundling and asset management. The configuration is defined in `client/config/webpack.config.js`.

### Key Features

1. **Entry Points**

   ```javascript
   entry: {
     main: "./src/index.js",
     logger: "./src/common/js/utils/0200-logger.js",
     login: "./src/pages/0100-user-login/index.js"
   }
   ```

2. **Module Resolution**
   - Alias configuration for clean imports:

   ```javascript
   alias: {
     "@common": "../src/common",
     "@components": "../src/components",
     "@pages": "../src/pages",
     "@assets": "../src/common/assets"
   }
   ```

3. **Loaders and Processing**
   - Babel for modern JavaScript (ES6+)
   - CSS Modules support
   - Asset handling for images and resources
   - Node polyfills for browser compatibility

4. **Asset Management**
   - HTML templates from src/pages/ generate output files
   - Static assets copied from src/common/assets to dist2/assets
   - CSS files copied from src/common/css to dist2/css
   - Legacy files in public/ not included in build
   - Babel loader exclusions for non-transpiled code

5. **Development Server**
   - Hot Module Replacement
   - Multi-directory static serving
   - WebSocket communication
   - CORS and security headers

### Build Modes

1. **Development**

   ```javascript
   devServer: {
     static: [
       { directory: "../dist2", publicPath: "/" },
       { directory: "../src/common/assets", publicPath: "/assets" }
     ],
     historyApiFallback: true,
     hot: false,
     liveReload: true,
     port: 3000
   }
   ```

2. **Production** (Coming Soon)
   - Optimization and minification
   - Code splitting
   - Cache management
   - Source maps configuration

### Usage

1. **Development**

   ```bash
   npm run dev    # Starts development server
   ```

2. **Build**

   ```bash
   npm run build  # Creates production build
   ```

3. **Configuration**
   - Environment variables in `.env`
   - Webpack config in `config/webpack.config.js`
   - Babel config in `.babelrc`

### Best Practices

1. **File Organization**
   - Place new components in `src/components/`
   - Keep page-specific code in `src/pages/`
   - Use aliases for clean imports
   - Maintain clear separation of concerns

2. **Migration Guidelines**
   - Move files incrementally to `src/`
   - Update imports to use aliases
   - Convert to modern ES modules
   - Implement proper code splitting

3. **Development Workflow**
   - Use Hot Module Replacement
   - Leverage webpack dev server
   - Follow component-based architecture
   - Maintain backwards compatibility

4. **Common Pitfalls**
   - Mixing old and new import styles
   - Incorrect alias usage
   - Missing module exports
   - Improper asset paths

[Rest of original content follows...]
