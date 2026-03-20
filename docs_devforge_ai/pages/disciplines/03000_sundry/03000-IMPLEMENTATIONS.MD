# Page Implementations

This document provides detailed documentation for common implementation patterns and standards across all pages. The application is currently transitioning to a webpack-based structure, with files being progressively moved from `client/public/` to `client/src/`.

For a comprehensive list of all pages, their sector associations, organization access permissions, and accordion structure, see [Page List Documentation](./1300_0000_PAGE_LIST.md).

For page-specific implementation details, refer to:

- [1300_00100_LOGIN_PAGE.md](1300_00100_LOGIN_PAGE.md) - Login page implementation (Migrated)
- [1300_00102_ADMINISTRATION_PAGE.md](1300_00102_ADMINISTRATION_PAGE.md) - Administration page implementation (Migrated)
- [1300_00150_USER_SIGNUP_PAGE.md](1300_00150_USER_SIGNUP_PAGE.md) - User Signup page implementation (Migrated)
- [1300_00165_DEBUG_PANEL_PAGE.md](1300_00165_DEBUG_PANEL_PAGE.md) - Debug Panel page implementation (Migrated)
- [1300_00165_SETTINGS_PAGE.md](1300_00165_SETTINGS_PAGE.md) - Settings page implementation (Migrated)
- [1300_00165_UI_SETTINGS_PAGE.md](1300_00165_UI_SETTINGS_PAGE.md) - UI Settings page implementation (Migrated)
- [1300_00175_AUTH_CALLBACK_PAGE.md](1300_00175_AUTH_CALLBACK_PAGE.md) - Auth Callback page implementation (Migrated)
- [1300_00200_COMMERCIAL_PAGE.md](1300_00200_COMMERCIAL_PAGE.md) - Commercial page implementation (Migrated)
- [1300_00100_HOME_PAGE.md](1300_00100_HOME_PAGE.md) - Home page implementation (Migrated)
- [1300_00300_CONSTRUCTION_PAGE.md](1300_00300_CONSTRUCTION_PAGE.md) - Construction page implementation (Migrated)
- [1300_00425_CONTRACTS_PRE_AWARD_PAGE.md](1300_00425_CONTRACTS_PRE_AWARD_PAGE.md) - Contracts Pre-Award page implementation (Migrated)
- [1300_00435_CONTRACTS_POST_AWARD_PAGE.md](archive/1300_00435_CONTRACTS_POST_AWARD_PAGE.md) - Contracts Post-Award page implementation (Migrated)
- [1300_00835_CHEMICAL_ENGINEERING_PAGE.md](1300_00835_CHEMICAL_ENGINEERING_PAGE.md) - Chemical Engineering page implementation (Migrated)
- [1300_00850_CIVIL_ENGINEERING_PAGE.md](1300_00850_CIVIL_ENGINEERING_PAGE.md) - Civil Engineering page implementation (Migrated)
- [1300_00860_ELECTRICAL_ENGINEERING_PAGE.md](1300_00860_ELECTRICAL_ENGINEERING_PAGE.md) - Electrical Engineering page implementation (Migrated)
- [1300_00870_MECHANICAL_ENGINEERING_PAGE.md](1300_00870_MECHANICAL_ENGINEERING_PAGE.md) - Mechanical Engineering page implementation (Migrated)
- [1300_00872_DEVELOPER_PAGE.md](1300_00872_DEVELOPER_PAGE.md) - Developer page implementation (Migrated)
- [1300_00880_BOARD_OF_DIRECTORS_PAGE.md](1300_00880_BOARD_OF_DIRECTORS_PAGE.md) - Board of Directors page implementation (Migrated)
- [1300_00882_DIRECTOR_CONSTRUCTION_PAGE.md](1300_00882_DIRECTOR_CONSTRUCTION_PAGE.md) - Director Construction page implementation (Migrated)
- [1300_00883_DIRECTOR_CONTRACTS_PAGE.md](1300_00883_DIRECTOR_CONTRACTS_PAGE.md) - Director Contracts page implementation (Migrated)
- [1300_00884_DIRECTOR_ENGINEERING_PAGE.md](1300_00884_DIRECTOR_ENGINEERING_PAGE.md) - Director Engineering page implementation (Migrated)
- [1300_00884-1_DIRECTOR_FINANCE_PAGE.md](1300_00884-1_DIRECTOR_FINANCE_PAGE.md) - Director Finance page implementation (Migrated)
- [1300_00885_DIRECTOR_HSE_PAGE.md](1300_00885_DIRECTOR_HSE_PAGE.md) - Director HSE page implementation (Migrated)
- [1300_00886_DIRECTOR_LOGISTICS_PAGE.md](1300_00886_DIRECTOR_LOGISTICS_PAGE.md) - Director Logistics page implementation (Migrated)
- **Note on UI Fixes for Director Pages:** For detailed troubleshooting and resolution of UI rendering issues (e.g., missing buttons/titles) encountered across Director pages (0880, 0882, 0883, 0884, 0884-1, 0885, 0886), refer to [Audit: Page Implementation Standardization Progress - Audit Step 11: Director Pages UI Fixes](./1300_0000_PAGE_IMPLEMENTATIONS_AUDIT.md#audit-step-11-director-pages-ui-fixes-0880-0882-0883-0884-0884-1-0885-0886).
- [1300_00888_DIRECTOR_PROCUREMENT_PAGE.md](1300_00888_DIRECTOR_PROCUREMENT_PAGE.md) - Director Procurement page implementation (Migrated)
- [1300_00890_DIRECTOR_PROJECTS_PAGE.md](1300_00890_DIRECTOR_PROJECTS_PAGE.md) - Director Projects page implementation (Migrated)
- [1300_00900_DOCUMENT_CONTROL_PAGE.md](1300_00900_DOCUMENT_CONTROL_PAGE.md) - Document Control page implementation (Migrated)
- [1300_01000_ENVIRONMENTAL_PAGE.md](1300_01000_ENVIRONMENTAL_PAGE.md) - Environmental page implementation (Migrated)
- [1300_01100_ETHICS_PAGE.md](1300_01100_ETHICS_PAGE.md) - Ethics page implementation (Migrated)
- [1300_01200_FINANCE_PAGE.md](1300_01200_FINANCE_PAGE.md) - Finance page implementation (Migrated)
- [1300_01300_GOVERNANCE_PAGE.md](1300_01300_GOVERNANCE_PAGE.md) - Governance page implementation (Migrated)
- [1300_01400_HEALTH_PAGE.md](1300_01400_HEALTH_PAGE.md) - Health page implementation (Migrated)
- [1300_01500_HUMAN_RESOURCES_PAGE.md](1300_01500_HUMAN_RESOURCES_PAGE.md) - Human Resources page implementation (Migrated)
- [1300_01600_LOCAL_CONTENT_PAGE.md](1300_01600_LOCAL_CONTENT_PAGE.md) - Local Content page implementation (Migrated)
- [1300_01700_LOGISTICS_PAGE.md](1300_01700_LOGISTICS_PAGE.md) - Logistics page implementation (Migrated)
- [1300_01800_OPERATIONS_PAGE.md](1300_01800_OPERATIONS_PAGE.md) - Operations page implementation (Migrated)
- [1300_01850_OTHER_PARTIES_PAGE.md](1300_01850_OTHER_PARTIES_PAGE.md) - Other Parties page implementation (Migrated)
- [1300_01900_PROCUREMENT_PAGE.md](1300_01900_PROCUREMENT_PAGE.md) - Procurement page implementation (Migrated)
- [1300_02025_QUANTITY_SURVEYING_PAGE.md](1300_02025_QUANTITY_SURVEYING_PAGE.md) - Quantity Surveying page implementation (Migrated)
- [1300_02035_SCHEDULING_PAGE.md](1300_02035_SCHEDULING_PAGE.md) - Scheduling page implementation (Migrated)
- [1300_02050_INFORMATION_TECHNOLOGY_PAGE.md](1300_02050_INFORMATION_TECHNOLOGY_PAGE.md) - Information Technology page implementation (Migrated)
- [1300_02075_INSPECTION_PAGE.md](1300_02075_INSPECTION_PAGE.md) - Inspection page implementation (Migrated)
- [1300_02100_PUBLIC_RELATIONS_PAGE.md](1300_02100_PUBLIC_RELATIONS_PAGE.md) - Public Relations page implementation (Migrated)
- [1300_02200_LOGISTICS_PAGE.md](1300_02200_LOGISTICS_PAGE.md) - Logistics page implementation (Migrated)
- [1300_02200_QUALITY_ASSURANCE_PAGE.md](1300_02200_QUALITY_ASSURANCE_PAGE.md) - Quality Assurance page implementation (Migrated)
- [1300_02250_QUALITY_CONTROL_PAGE.md](1300_02250_QUALITY_CONTROL_PAGE.md) - Quality Control page implementation (Migrated)
- [1300_02400_SAFETY_PAGE.md](1300_02400_SAFETY_PAGE.md) - Safety page implementation (Migrated)
- [1300_02500_SECURITY_PAGE.md](1300_02500_SECURITY_PAGE.md) - Security page implementation (Migrated)
- [1300_3000_LANDSCAPING_PAGE.md](1300_3000_LANDSCAPING_PAGE.md) - Landscaping page implementation (Migrated)
- [1300_03010_EMAIL_MANAGEMENT.md](1300_03010_EMAIL_MANAGEMENT.md) - Complete Email Management System Documentation
- [1360_FLOWISE_DOCUMENT_STORE_IMPLEMENTATION_PLAN.md](1360_FLOWISE_DOCUMENT_STORE_IMPLEMENTATION_PLAN.md) - Flowise Document Store Implementation Plan
- [1361_FLOWISE_DOCUMENT_STORE_DEPLOYMENT_GUIDE.md](1361_FLOWISE_DOCUMENT_STORE_DEPLOYMENT_GUIDE.md) - Flowise Document Store Deployment Guide

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Webpack Configuration](#webpack-configuration)
3. [HTML and JavaScript Organization](#html-and-javascript-organization)
4. [Path Resolution](#path-resolution)
5. [Common Components](#common-components)
6. [RTL Support](#rtl-support)
7. [Responsive Design](#responsive-design)
8. [Z-Index Hierarchy](#z-index-hierarchy)
9. [Background Image Implementation](#background-image-implementation)
10. [Page Migration Process (Webpack/React)](#page-migration-process-webpackreact)
11. [Page Management Features](#page-management-features)

## Directory Structure

### Obsolete Structure (Removed)

The `client/public/pages/` directory and its subdirectories containing static HTML, CSS, and JavaScript files have been removed. All pages are now implemented as React components within `client/src/pages/`.

### Current Webpack Structure

```
client/src/
├── index.js                # Main entry point
├── App.js                 # Root React component
├── common/               # Shared resources
│   ├── assets/          # Static assets
│   ├── css/            # Stylesheets
│   └── js/             # Common JavaScript
├── components/          # Reusable components
├── modules/            # Feature modules
│   ├── accordion/      # Accordion module
│   └── [other modules]/ # Other feature modules
├── pages/              # Page components
│   ├── 00100-user-login/  # Login page (migrated)
│   ├── 00200-home/       # Home page (migrated)
│   ├── 02700-safety/     # Safety page (migrated)
│   └── [other pages]/   # Other migrated pages
└── services/          # Application services

client/config/
└── webpack.config.js    # Webpack configuration
```

## Webpack Configuration

The application uses webpack for module bundling and asset management:

```javascript
// Entry Points
entry: {
  main: "./src/index.js",
  login: "./src/pages/00100-user-login/index.js",
  home: "./src/pages/00200-home/index.js",
  safety: "./src/pages/02700-safety/index.js"
}

// Module Resolution
resolve: {
  alias: {
    '@common': '../src/common',
    '@components': '../src/components',
    '@pages': '../src/pages',
    '@modules': '../src/modules'
  }
}

## Documentation Standards

#### File Naming

##### Documentation Files (.md)

- Use 5-digit prefixes in hundreds (e.g., 00100\_)
- Use uppercase for file names
- Use underscores to separate words
- Place files in the `docs/` directory

Example:

```
docs/
├── 0000_DOCUMENTATION_GUIDE.md
├── 0100_GETTING_STARTED.md
└── 1300_00100_LOGIN_PAGE.md
```

##### JavaScript Files (.js)

- Use 5-digit prefixes in hundreds (e.g., 00200\*)
- Use lowercase for file names
- Use hyphens to separate words
- Place files in appropriate directories based on functionality:
  - React components: components/ directory
  - Context providers: context/ directory
  - Custom hooks: hooks/ directory
  - Utility functions: utils/ directory
  - Common code: common/ directory

Example:

```
client/src/modules/accordion/
├── 00200-accordion-manager.js
├── 00200-accordion-component.js
├── context/
│   └── 00200-accordion-context.js
└── hooks/
    ├── 00200-accordion-state.js
    └── 00200-accordion-cache.js
```

### Component Documentation

Components should be documented directly in their source files using JSDoc comments for JavaScript/React files and structured HTML comments for template files.

#### React Component Documentation

```javascript
/**
 * @component ComponentName
 * @description Brief description of the component's purpose
 *
 * @prop {Type} propName - Description of the prop
 * @prop {Type} anotherProp - Description of another prop
 *
 * @example
 * import { ComponentName } from '@components/ComponentName';
 *
 * <ComponentName prop="value" />
 */
```

#### Context Provider Documentation

```javascript
/**
 * @context ContextName
 * @description Purpose of this context
 *
 * @property {Type} value - Description of context value
 * @property {Function} action - Description of context action
 *
 * @example
 * import { useContext } from '@context/ContextName';
 */
```

#### Custom Hook Documentation

```javascript
/**
 * @hook useHookName
 * @description Purpose of this hook
 *
 * @param {Type} param - Description of parameter
 * @returns {Type} Description of return value
 *
 * @example
 * import { useHookName } from '@hooks/useHookName';
 */
```

## Background Image Implementation

### Home Page Background Image Fix (December 2025)

The Home page (00100) background image implementation was successfully resolved after addressing webpack dev server configuration and CSS specificity issues:

**Issue**: The background image (`00100.png`) was not displaying despite correct file paths and CSS rules.

**Root Causes**:
1. **Webpack Dev Server Configuration**: The dev server was only serving static files from `client/dist` directory during development, but assets needed to be served from `client/public` directory as well.
2. **CSS Specificity Conflicts**: Global CSS background properties were being overridden by other styles in the application.

**Solution**:
1. **Updated Webpack Configuration**: Modified `client/config/webpack.config.js` to serve static files from both directories:
   ```javascript
   devServer: {
     static: [
       {
         directory: path.resolve(__dirname, "../../client/dist"),
         publicPath: "/",
       },
       {
         directory: path.resolve(__dirname, "../../client/public"),
         publicPath: "/",
       }
     ],
     // ... other config
   }
   ```

2. **Inline Styles Implementation**: Applied background image via inline styles in the HomePage component for maximum CSS specificity:
   ```jsx
   <div
     className="page-container"
     style={{
       backgroundImage: 'url("/assets/default/00100.png")',
       backgroundSize: 'cover',
       backgroundPosition: 'center',
       backgroundRepeat: 'no-repeat',
       backgroundAttachment: 'fixed',
       minHeight: '100vh',
       width: '100%'
     }}
   >
   ```

**Best Practices for Background Images**:
- Use inline styles for critical background images to ensure maximum CSS specificity
- Configure webpack dev server to serve static assets from both build and source directories
- Verify asset accessibility during development by testing direct URLs
- Clean up conflicting global CSS rules when implementing component-level styling

## Accordion Navigation State Management

### Navigation State Reset Issue (December 2025)

A critical issue was resolved where accordion navigation between pages (Finance, Ethics, etc.) was not properly updating page titles and resetting state buttons. While background images would change correctly, the page titles remained static and state buttons retained their previous state.

**Root Cause**: React Router was reusing component instances when navigating between similar sector pages through the `DynamicSectorPageLoader`, preventing essential `useEffect` hooks from running.

**Solution**: Enhanced the dynamic component loading system in `client/src/App.js` by adding a `key={pageName}` prop to force component remounting:

```jsx
return (
  <Suspense fallback={<div>Loading page...</div>}>
    <LazyComponent 
      key={pageName} // Force component remounting when pageName changes
      activeOrganizationId={activeOrganizationId} 
    />
  </Suspense>
);
```

**Page Component Enhancements**: Updated page components to properly reset state on mount:

```jsx
// Effect to set page title and reset state on mount
useEffect(() => {
  console.log("[PageComponent] Component mounting - setting title and resetting state");
  document.title = "Page Title";
  
  // Reset state when component mounts (ensures clean state on navigation)
  setCurrentState(null);
  setIsButtonContainerVisible(false);
  
  // Cleanup function to reset title when component unmounts
  return () => {
    console.log("[PageComponent] Component unmounting");
  };
}, []); // Empty dependency array ensures this runs only on mount/unmount
```

**Best Practices for Navigation State Management**:
- Use `key` props based on route parameters to force component remounting when needed
- Implement explicit state reset in component mount effects
- Handle document title updates in component lifecycle hooks with proper cleanup
- Add console logging for debugging component mounting/unmounting behavior
- Ensure predictable initial state across navigation

## Version History

### Current Version: 1.5.0

- Added accordion navigation state management documentation
- Enhanced component lifecycle management patterns
- Updated React Router integration best practices
- Added navigation state reset implementation guide
- Documented component remounting strategies

### Version 1.4.0

- Added React component documentation standards
- Updated webpack alias documentation
- Enhanced JavaScript file organization guidelines
- Added component structure documentation
- Updated page implementations with React patterns
