# 1300_00200 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_00200 group.

## Files in this Group

- [1300_00200_COMMERCIALPAGE.md](1300_00200_COMMERCIALPAGE.md)
- [1300_00200_EMAIL_TEST_DATAREADME.md](1300_00200_EMAIL_TEST_DATAREADME.md)
- [1300_00200_MASTERGUIDE.md](1300_00200_MASTERGUIDE.md)
- [1300_00200_PATHMANAGEMENT.md](1300_00200_PATHMANAGEMENT.md)
- [1300_00200_MASTER_GUIDE_UNKNOWN.md](1300_00200_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_00200_COMMERCIALPAGE.md

# Commercial Page (00200) Documentation (Migrated to Webpack/React)

## Overview

The Commercial page provides functionality related to commercial aspects of the project, such as tendering, cost control, and variations. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing. It utilizes the common `AccordionComponent` for navigation.

## Background Image

The Commercial page uses a background image defined via the `.page-background` CSS class. The image is located at:
`client/public/assets/default/00200.png`

This image is loaded with reduced opacity (15%) to provide a subtle visual context while maintaining readability of the content. See [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation) for the standard implementation pattern.

## File Structure (Post-Migration)

```
client/src/pages/00200-commercial/
└── components/                       # React components specific to this page
    └── 00200-commercial-page.js       # Main page React component

client/src/common/css/pages/00200-commercial/
└── 00200-pages-style.css              # Page-specific styles
```

## UI Layout

The Commercial page utilizes a consistent layout structure with fixed-position elements overlaying a background image. The layout is managed by React components and CSS.

## Features

### Tendering

- Manage tender documents (via modal)
- Track tender submissions (via modal)

### Cost Control

- Monitor project costs (via modal)
- Manage budgets (via modal)

### Variations

- Record and track project variations (via modal)

## State Management

State is primarily managed within the `CommercialPageComponent` (`client/src/pages/00200-commercial/components/00200-commercial-page.js`) using React hooks (`useState`, `useEffect`). This includes:

- `currentState`: Tracks the active view (e.g., 'agents', 'upsert', 'workspace').
- `isSettingsInitialized`: Tracks whether the `settingsManager` has loaded data for the accordion.
- State for managing modals.

## Modal System

The page utilizes a centralized React-based modal system for actions related to commercial activities.

## Development

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Related Documentation

- [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation)
- [Accordion Management](./0950_ACCORDION_MANAGEMENT.md)
- [UI Settings](./0700_UI_SETTINGS.md)

## Migration Notes

The Commercial page has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Implement detailed tendering workflow.
2. Integrate with financial systems for real-time cost tracking.
3. Develop variation approval process.


---

### 1300_00200_EMAIL_TEST_DATAREADME.md

# Email Test Data

## Final Working Script

**File:** `populate-comprehensive-email-test-data-corrected.sql`

This is the final, tested, and working email test data script that successfully populates the email management system with comprehensive test data.

### What it creates:

- **17 total emails** with proper categorization
- **📥 Inbox**: 5 emails (unread, incoming emails)
- **📤 Sent**: 5 emails (sent by current user)
- **📝 Drafts**: 2 emails (draft emails by current user)
- **🗄️ Archived**: 2 emails (archived emails)
- **💬 Threads**: 5 emails (2 conversation threads with proper threading)

### Features:

✅ **Proper foreign key relationships** - All thread IDs correctly reference email_threads table
✅ **Correct user mapping** - Uses actual user ID from user_management table
✅ **Proper boolean flags** - Correct is_sent, is_draft, is_archived flags
✅ **AI processing data** - Includes sample AI results for testing AI tools
✅ **Thread support** - Creates proper email threads with conversation flow
✅ **All email states** - Covers all possible email statuses and priorities

### How to use:

```bash
psql -f populate-comprehensive-email-test-data-corrected.sql
```

### User Information:

- **User ID**: `22564dd8-9bcb-41c3-acc5-569e87551fd1`
- **Email**: `alistair.tennant@constructai.biz`
- **Account ID**: `3405f81f-21a3-44eb-9c25-6877959ea9f9`

### Cleanup:

All other email test files have been removed to avoid confusion. This is the single source of truth for email test data.

---

**Note:** The `populate-email-docs-test-data.cjs` file is for document testing, not email testing, so it remains.


---

### 1300_00200_MASTERGUIDE.md

# 1300_00200_MASTER_GUIDE.md - Commercial Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Commercial Guide

## Overview
Commercial operations and business management dashboard.

## Page Structure
**File Location:** `client/src/pages/00200-commercial`
```javascript
export default function CommercialPage() {
  return (
    <CommercialLayout>
      <RevenueTracker />
      <CostAnalysis />
      <ProfitMargins />
      <BusinessMetrics />
    </CommercialLayout>
  );
}
```

## Requirements
1. Use 00200-series commercial components (00200-00299)
2. Implement financial data visualization
3. Support revenue tracking and analysis
4. Maintain business metric monitoring

## Implementation
```bash
node scripts/commercial/setup.js --dashboard-config
```

## Related Documentation
- [0600_FINANCIAL_MODEL.md](../docs/0600_FINANCIAL_MODEL.md)
- [0800_BUSINESS_INTELLIGENCE.md](../docs/0800_BUSINESS_INTELLIGENCE.md)

## Status
- [x] Core commercial framework
- [ ] Revenue tracking
- [ ] Cost analysis
- [ ] Profit margins

## Version History
- v1.0 (2025-08-27): Initial commercial structure


---

### 1300_00200_MASTER_GUIDE_UNKNOWN.md

# 1300_00200 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_00200 group.

## Files in this Group

- [1300_00200_COMMERCIALPAGE.md](1300_00200_COMMERCIALPAGE.md)
- [1300_00200_EMAIL_TEST_DATAREADME.md](1300_00200_EMAIL_TEST_DATAREADME.md)
- [1300_00200_MASTERGUIDE.md](1300_00200_MASTERGUIDE.md)
- [1300_00200_PATHMANAGEMENT.md](1300_00200_PATHMANAGEMENT.md)
- [1300_00200_MASTER_GUIDE_UNKNOWN.md](1300_00200_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_00200_COMMERCIALPAGE.md

# Commercial Page (00200) Documentation (Migrated to Webpack/React)

## Overview

The Commercial page provides functionality related to commercial aspects of the project, such as tendering, cost control, and variations. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing. It utilizes the common `AccordionComponent` for navigation.

## Background Image

The Commercial page uses a background image defined via the `.page-background` CSS class. The image is located at:
`client/public/assets/default/00200.png`

This image is loaded with reduced opacity (15%) to provide a subtle visual context while maintaining readability of the content. See [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation) for the standard implementation pattern.

## File Structure (Post-Migration)

```
client/src/pages/00200-commercial/
└── components/                       # React components specific to this page
    └── 00200-commercial-page.js       # Main page React component

client/src/common/css/pages/00200-commercial/
└── 00200-pages-style.css              # Page-specific styles
```

## UI Layout

The Commercial page utilizes a consistent layout structure with fixed-position elements overlaying a background image. The layout is managed by React components and CSS.

## Features

### Tendering

- Manage tender documents (via modal)
- Track tender submissions (via modal)

### Cost Control

- Monitor project costs (via modal)
- Manage budgets (via modal)

### Variations

- Record and track project variations (via modal)

## State Management

State is primarily managed within the `CommercialPageComponent` (`client/src/pages/00200-commercial/components/00200-commercial-page.js`) using React hooks (`useState`, `useEffect`). This includes:

- `currentState`: Tracks the active view (e.g., 'agents', 'upsert', 'workspace').
- `isSettingsInitialized`: Tracks whether the `settingsManager` has loaded data for the accordion.
- State for managing modals.

## Modal System

The page utilizes a centralized React-based modal system for actions related to commercial activities.

## Development

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Related Documentation

- [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation)
- [Accordion Management](./0950_ACCORDION_MANAGEMENT.md)
- [UI Settings](./0700_UI_SETTINGS.md)

## Migration Notes

The Commercial page has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Implement detailed tendering workflow.
2. Integrate with financial systems for real-time cost tracking.
3. Develop variation approval process.


---

### 1300_00200_EMAIL_TEST_DATAREADME.md

# Email Test Data

## Final Working Script

**File:** `populate-comprehensive-email-test-data-corrected.sql`

This is the final, tested, and working email test data script that successfully populates the email management system with comprehensive test data.

### What it creates:

- **17 total emails** with proper categorization
- **📥 Inbox**: 5 emails (unread, incoming emails)
- **📤 Sent**: 5 emails (sent by current user)
- **📝 Drafts**: 2 emails (draft emails by current user)
- **🗄️ Archived**: 2 emails (archived emails)
- **💬 Threads**: 5 emails (2 conversation threads with proper threading)

### Features:

✅ **Proper foreign key relationships** - All thread IDs correctly reference email_threads table
✅ **Correct user mapping** - Uses actual user ID from user_management table
✅ **Proper boolean flags** - Correct is_sent, is_draft, is_archived flags
✅ **AI processing data** - Includes sample AI results for testing AI tools
✅ **Thread support** - Creates proper email threads with conversation flow
✅ **All email states** - Covers all possible email statuses and priorities

### How to use:

```bash
psql -f populate-comprehensive-email-test-data-corrected.sql
```

### User Information:

- **User ID**: `22564dd8-9bcb-41c3-acc5-569e87551fd1`
- **Email**: `alistair.tennant@constructai.biz`
- **Account ID**: `3405f81f-21a3-44eb-9c25-6877959ea9f9`

### Cleanup:

All other email test files have been removed to avoid confusion. This is the single source of truth for email test data.

---

**Note:** The `populate-email-docs-test-data.cjs` file is for document testing, not email testing, so it remains.


---

### 1300_00200_MASTERGUIDE.md

# 1300_00200_MASTER_GUIDE.md - Commercial Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Commercial Guide

## Overview
Commercial operations and business management dashboard.

## Page Structure
**File Location:** `client/src/pages/00200-commercial`
```javascript
export default function CommercialPage() {
  return (
    <CommercialLayout>
      <RevenueTracker />
      <CostAnalysis />
      <ProfitMargins />
      <BusinessMetrics />
    </CommercialLayout>
  );
}
```

## Requirements
1. Use 00200-series commercial components (00200-00299)
2. Implement financial data visualization
3. Support revenue tracking and analysis
4. Maintain business metric monitoring

## Implementation
```bash
node scripts/commercial/setup.js --dashboard-config
```

## Related Documentation
- [0600_FINANCIAL_MODEL.md](../docs/0600_FINANCIAL_MODEL.md)
- [0800_BUSINESS_INTELLIGENCE.md](../docs/0800_BUSINESS_INTELLIGENCE.md)

## Status
- [x] Core commercial framework
- [ ] Revenue tracking
- [ ] Cost analysis
- [ ] Profit margins

## Version History
- v1.0 (2025-08-27): Initial commercial structure


---

### 1300_00200_PATHMANAGEMENT.md

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


---



---

### 1300_00200_PATHMANAGEMENT.md

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


---

