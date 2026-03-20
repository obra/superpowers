# 0200_02050_UNIVER_INTEGRATION_GUIDE.md - UNIVER Spreadsheet Integration Guide

## Overview

Univer is an **isomorphic full-stack framework** for creating and editing spreadsheets, documents, and presentations. Unlike PlantUML Server, **Univer does NOT need to be deployed** - it's a client-side library that you integrate directly into your React application.

## What is Univer?

- 📊 **Univer Sheets**: Full-featured spreadsheet editor (like Excel/Google Sheets)
- 📝 **Univer Docs**: Document editor (like Word/Google Docs)
- 📽️ **Univer Slides**: Presentation editor (like PowerPoint/Google Slides)
- 🔌 **Highly Extensible**: Plugin architecture for custom features
- ⚡ **High Performance**: Canvas-based rendering engine
- 🌐 **Collaborative**: Built-in support for real-time collaboration

## Key Features

### Spreadsheet Features
- Formulas (500+ functions)
- Conditional formatting
- Data validation
- Filtering and sorting
- Charts and sparklines
- Pivot tables
- Import/Export XLSX
- Collaborative editing
- Print support

### Document Features
- Rich text editing
- Lists and tables
- Headers and footers
- Comments
- Floating images
- Collaborative editing

## Integration Strategy

### ❌ Do NOT Deploy to Render

Univer is a **frontend library**, not a backend service. You don't need to deploy it anywhere - just install the npm packages and use them in your React components.

### ✅ Install as NPM Packages

Univer is distributed as multiple npm packages that you install directly in your project.

## Installation Guide

### Step 1: Install Core Packages

For a **spreadsheet editor**, install these packages:

```bash
cd /Users/_PropAI/construct_ai/client
npm install @univerjs/core @univerjs/design @univerjs/docs @univerjs/docs-ui @univerjs/engine-formula @univerjs/engine-render @univerjs/sheets @univerjs/sheets-ui @univerjs/ui @univerjs/facade
```

### Step 2: Install Additional Features (Optional)

Based on your needs:

```bash
# For formulas
npm install @univerjs/sheets-formula

# For conditional formatting
npm install @univerjs/sheets-conditional-formatting @univerjs/sheets-conditional-formatting-ui

# For data validation
npm install @univerjs/data-validation @univerjs/sheets-data-validation

# For filters
npm install @univerjs/sheets-filter @univerjs/sheets-filter-ui

# For charts
npm install @univerjs/sheets-chart @univerjs/sheets-chart-ui

# For collaborative editing
npm install @univerjs/collaboration @univerjs/collaboration-client

# For import/export
npm install @univerjs/sheets-zen-editor @univerjs/sheets-find-replace
```

### Step 3: Create a Univer Component

Create a new page component for Univer spreadsheets:

```javascript
// client/src/pages/02050-coding-templates/02050-univer-spreadsheet.js

import React, { useEffect, useRef } from 'react';
import { Univer } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverUIPlugin } from '@univerjs/ui';
import { FUniver } from '@univerjs/facade';

// Import styles
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';
// NOTE: @univerjs/sheets-formula does not include CSS - do not import

const UniverSpreadsheet = () => {
  const containerRef = useRef(null);
  const univerRef = useRef(null);

  useEffect(() => {
    console.log('[UNIVER_SPREADSHEET] useEffect started');
    console.log('[UNIVER_SPREADSHEET] containerRef.current:', containerRef.current);

    if (!containerRef.current) {
      console.error('[UNIVER_SPREADSHEET] ERROR: containerRef.current is null!');
      return;
    }

    let univer = null;
    let univerAPI = null;

    try {
      console.log('[UNIVER_SPREADSHEET] Step 1: Creating Univer instance...');
      // Create Univer instance
      univer = new Univer({
        theme: defaultTheme,
        locale: 'en-US',
      });
      console.log('[UNIVER_SPREADSHEET] Step 1: Univer instance created successfully');

      console.log('[UNIVER_SPREADSHEET] Step 2: Registering core plugins...');

      // Register core plugins first (in correct order)
      univer.registerPlugin(UniverRenderEnginePlugin);
      univer.registerPlugin(UniverFormulaEnginePlugin);

      // Register document plugins
      univer.registerPlugin(UniverDocsPlugin);
      univer.registerPlugin(UniverDocsUIPlugin);

      // Register sheet plugins
      univer.registerPlugin(UniverSheetsPlugin);
      univer.registerPlugin(UniverSheetsUIPlugin);
      univer.registerPlugin(UniverSheetsFormulaPlugin);

      console.log('[UNIVER_SPREADSHEET] Step 3: Registering main UI plugin...');

      // Register main UI plugin (must come after all other plugins)
      univer.registerPlugin(UniverUIPlugin, {
        container: containerRef.current,
      });

      console.log('[UNIVER_SPREADSHEET] Step 4: Creating initial workbook...');

      // Create initial workbook
      const workbookData = {
        name: 'New Spreadsheet',
        sheets: {
          sheet1: {
            id: 'sheet1',
            name: 'Sheet1',
            cellData: {
              0: {
                0: { v: 'Hello' },
                1: { v: 'Univer' },
              },
              1: {
                0: { v: 'Welcome to' },
                1: { v: 'ConstructAI' },
              },
            },
          },
        },
      };

      console.log('[UNIVER_SPREADSHEET] Workbook data prepared:', workbookData);

      // Create the unit
      univer.createUnit('univer.sheet', workbookData);
      console.log('[UNIVER_SPREADSHEET] Step 4: Workbook created successfully');

      console.log('[UNIVER_SPREADSHEET] Step 5: Initializing Facade API...');
      // Get Facade API for easier manipulation
      univerAPI = FUniver.newAPI(univer);
      console.log('[UNIVER_SPREADSHEET] Step 5: Facade API initialized successfully');

      // Store references
      univerRef.current = univerAPI;
      console.log('[UNIVER_SPREADSHEET] Univer initialization completed successfully!');

      // Cleanup on unmount
      return () => {
        console.log('[UNIVER_SPREADSHEET] Cleanup: Disposing Univer instance...');
        if (univerAPI) {
          // Dispose through Facade API if available
          try {
            univerAPI.dispose();
          } catch (e) {
            console.warn('[UNIVER_SPREADSHEET] Facade dispose failed, trying direct dispose...');
            univer?.dispose();
          }
        } else {
          univer?.dispose();
        }
        console.log('[UNIVER_SPREADSHEET] Cleanup: Univer instance disposed');
      };

    } catch (error) {
      console.error('[UNIVER_SPREADSHEET] FATAL ERROR during initialization:', error);
      console.error('[UNIVER_SPREADSHEET] Error stack:', error.stack);
      console.error('[UNIVER_SPREADSHEET] Error message:', error.message);

      // Log additional context
      console.error('[UNIVER_SPREADSHEET] Container ref:', containerRef.current);
      console.error('[UNIVER_SPREADSHEET] Window location:', window.location.href);
      console.error('[UNIVER_SPREADSHEET] React version:', React.version);

      // Cleanup on error
      try {
        if (univerAPI) {
          univerAPI.dispose();
        } else if (univer) {
          univer.dispose();
        }
      } catch (cleanupError) {
        console.warn('[UNIVER_SPREADSHEET] Cleanup failed during error:', cleanupError);
      }

      throw error;
    }
  }, []);

  console.log('[UNIVER_SPREADSHEET] Component rendering');

  return (
    <div className="univer-container" style={{ width: '100%', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default UniverSpreadsheet;
```

### Step 4: Add Route

Add the Univer page to your router:

```javascript
// client/src/RouterApp.js

import UniverSpreadsheet from './pages/02050-coding-templates/02050-univer-spreadsheet';

// In your routes array:
<Route path="/univer-spreadsheet" element={<UniverSpreadsheet />} />
```

### Step 5: Accordion Navigation Status

**Note**: The Spreadsheet Editor link was previously available in Information Technology > Developer settings subsection but has been removed from the accordion navigation as of November 2025. The Univer integration remains available and functional, but access is no longer provided through the main accordion menu.

## Current Implementation Status

### ✅ Working Components
- **Build Process**: Webpack compilation succeeds without CSS import errors
- **Package Installation**: All required @univerjs packages installed and compatible
- **Component Structure**: React component properly structured with error handling
- **Plugin Registration**: Core plugins register successfully

### 🔴 Known Issues
- **Runtime Initialization**: `TypeError: Cannot read properties of undefined (reading 'Symbol($$DEPENDENCIES)')` during workbook creation
- **Spreadsheet Rendering**: Component fails to display spreadsheet UI due to initialization error

### 📊 Package Versions (Current)
```json
{
  "@univerjs/core": "^0.9.0",
  "@univerjs/design": "^0.9.0",
  "@univerjs/docs": "^0.9.0",
  "@univerjs/docs-ui": "^0.9.0",
  "@univerjs/engine-formula": "^0.9.0",
  "@univerjs/engine-render": "^0.9.0",
  "@univerjs/facade": "^0.5.5",
  "@univerjs/sheets": "^0.9.0",
  "@univerjs/sheets-formula": "^0.9.4",
  "@univerjs/sheets-ui": "^0.9.0",
  "@univerjs/ui": "^0.9.0"
}
```

## Use Cases in ConstructAI

### 1. Budget Planning and Financial Analysis
- Create project budgets
- Track expenses
- Financial forecasting
- Cost estimations

### 2. Resource Allocation
- Staff scheduling
- Equipment tracking
- Material requirements planning

### 3. Data Analysis and Reporting
- Project metrics dashboard
- Performance tracking
- Custom reports with formulas and charts

### 4. Procurement Management
- Purchase order forms
- Supplier comparison tables
- Inventory tracking

### 5. Document Templates
- Pre-built spreadsheet templates
- Standardized forms
- Data collection sheets

## Advanced Features

### Collaborative Editing

To enable real-time collaboration, you'll need:

```bash
npm install @univerjs/collaboration @univerjs/collaboration-client
```

Then set up a collaboration server (requires backend):

```javascript
import { UniverCollaborationPlugin } from '@univerjs/collaboration';
import { UniverCollaborationClientPlugin } from '@univerjs/collaboration-client';

univer.registerPlugin(UniverCollaborationPlugin);
univer.registerPlugin(UniverCollaborationClientPlugin, {
  serverUrl: 'ws://your-collaboration-server.com',
});
```

### Custom Plugins

Create custom plugins for ConstructAI-specific features:

```javascript
class ConstructAIPlugin {
  constructor(config) {
    this.config = config;
  }

  onStarting(injector) {
    // Plugin initialization
  }
}
```

### Formulas Integration

Access spreadsheet data programmatically:

```javascript
const activeSheet = univerAPI.getActiveSheet();
const value = activeSheet.getRange('A1').getValue();
activeSheet.getRange('B1').setValue(value * 2);
```

### Import/Export

```javascript
// Export to XLSX
const workbook = univerAPI.getActiveWorkbook();
const data = workbook.save();

// Import from XLSX
univerAPI.createUniverSheet(importedData);
```

## Architecture Considerations

### Client-Side Only
- All Univer functionality runs in the browser
- No server deployment needed
- Data stored locally or sent to your backend

### Integration with Supabase
Store spreadsheet data in Supabase:

```javascript
// Save spreadsheet data
const workbookData = workbook.save();
await supabase.from('spreadsheets').insert({
  user_id: userId,
  project_id: projectId,
  data: workbookData,
  name: 'Budget 2025'
});

// Load spreadsheet data
const { data } = await supabase
  .from('spreadsheets')
  .select('*')
  .eq('id', spreadsheetId)
  .single();

univerAPI.createUniverSheet(data.data);
```

### Performance Optimization
- Lazy load Univer packages
- Use code splitting
- Load only needed plugins

```javascript
// Lazy loading example
const UniverSpreadsheet = React.lazy(() =>
  import('./pages/02050-coding-templates/02050-univer-spreadsheet')
);

// In your route
<Route
  path="/univer-spreadsheet"
  element={
    <React.Suspense fallback={<div>Loading...</div>}>
      <UniverSpreadsheet />
    </React.Suspense>
  }
/>
```

## Bundle Size Considerations

Univer packages are comprehensive and can add significant bundle size:

- Core packages: ~500KB (minified + gzipped)
- With all features: ~1-2MB (minified + gzipped)

**Recommendation**:
- Use code splitting
- Load Univer pages on-demand
- Only import features you need

## Troubleshooting

### Build Issues
- **CSS Import Errors**: Only import CSS from packages that include stylesheets (`@univerjs/sheets-formula` does not have CSS)
- **Missing Dependencies**: Ensure all required Univer packages are installed
- **Version Conflicts**: Verify all @univerjs packages use compatible versions

### Runtime Issues
- **Plugin Registration Order**: Core plugins must be registered before UI plugins
- **Container Reference**: Ensure container div exists before plugin registration
- **Workbook Data Structure**: Validate workbook data matches Univer API expectations

### Error Reference
- See `docs/error-tracking/1300_02050_UNIVER_INTEGRATION_ERRORS.md` for detailed error tracking
- **FIX 23**: CSS import error (RESOLVED)
- **FIX 24**: Runtime initialization error (ACTIVE)

## Documentation and Resources

- **Error Tracking**: `docs/error-tracking/1300_02050_UNIVER_INTEGRATION_ERRORS.md`
- **Official Docs**: https://univer.ai/guides/sheet/getting-started/quickstart
- **Examples**: https://univer.ai/examples/sheets
- **API Reference**: https://univer.ai/typedoc/@univerjs/core
- **GitHub**: https://github.com/dream-num/univer
- **Playground**: https://univer.ai/playground

## Migration from Existing Solutions

If you're currently using other spreadsheet libraries:

### From Excel Online
- Export XLSX files
- Import into Univer using `@univerjs/sheets-exchange`

### From Google Sheets
- Download as XLSX
- Import into Univer

### From SheetJS/xlsx
- Univer provides more UI features
- Better formula support
- Native collaboration

## Summary

**Key Differences from PlantUML Server:**

| Aspect | PlantUML Server | Univer |
|--------|----------------|--------|
| Type | Backend Service | Frontend Library |
| Deployment | Deploy to Render | Install via npm |
| Integration | API calls | React components |
| Data Storage | External | Your backend |
| Performance | Server-side rendering | Client-side rendering |

**Current Status**: ✅ **SHORTCUT SERVICE ISSUE RESOLVED** - Manual service registration working. Page loads successfully without QuantityCheckError. See error tracking documentation for details.

**Next Steps:**

1. Resolve runtime initialization error (plugin dependency issues)
2. Test basic spreadsheet functionality
3. Integrate with Supabase for data persistence
4. Implement lazy loading for performance
5. Add collaborative features if needed

**No deployment to Render needed!** Just install the packages and start building.
