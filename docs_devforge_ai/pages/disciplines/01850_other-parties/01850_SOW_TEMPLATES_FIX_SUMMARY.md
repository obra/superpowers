# SOW Templates Fix Summary

## Issue Description

When accessing the SOW Creation Wizard at `http://localhost:3060/#/scope-of-work`, users were seeing 2 hardcoded templates:

- "Form - Lubricants"
- "Form - Power Station Construction"

However, according to the system documentation, these templates should be sourced from the `procurement_templates` database table as specified in:

- `/Users/_PropAI/construct_ai/docs/pages-disciplines/1300_01900_MASTER_GUIDE_PROCUREMENT_TEMPLATES.md`
- `/Users/_PropAI/construct_ai/docs/pages-disciplines/1300_01900_MASTER_GUIDE_PROCUREMENT.md`

## Root Cause Analysis

The issue was in the template loading pipeline:

### 1. TemplateSelectorService Issue (`client/src/services/TemplateSelectorService.js`)

```javascript
// BEFORE (INCORRECT):
const templates = await this.templateService.fetchTemplates(
  "procurement_templates",
  {
    status: "approved",
  }
);
```

The `TemplateSelectorService` was calling `TemplateService.fetchTemplates()` with two parameters:

- First parameter: `'procurement_templates'` (string)
- Second parameter: filters object

### 2. TemplateService Issue (`client/src/common/components/templates/services/TemplateService.js`)

```javascript
// BEFORE (INCORRECT):
async fetchTemplates(filters = {}) {
  // Expected only one parameter: filters object
  // But was receiving 'procurement_templates' string as filters
}
```

The `TemplateService.fetchTemplates()` method only accepts a single `filters` parameter, not a table name. The `'procurement_templates'` string was being incorrectly passed as the filters object, causing the service to fail and fall back to hardcoded templates.

## Fix Implementation

### 1. Updated TemplateSelectorService

```javascript
// AFTER (CORRECT):
const templates = await this.templateService.fetchTemplates({
  status: "approved",
  table: "procurement_templates",
});
```

**Changes made:**

- Removed the incorrect second parameter
- Added `table: 'procurement_templates'` to the filters object
- Now passes only one parameter (filters object) as expected

### 2. Updated TemplateService

```javascript
// AFTER (CORRECT):
async fetchTemplates(filters = {}) {
  const params = new URLSearchParams();
  // ... map other filters ...
  if (filters.table) params.append('table', filters.table);

  // Use specific endpoint for procurement templates
  const endpoint = filters.table === "procurement_templates"
    ? "/api/procurement-templates/templates/sow"
    : "/api/templates";

  const response = await fetch(`${endpoint}?${params}`);
  // ... rest of method
}
```

**Changes made:**

- Added support for `filters.table` parameter
- Route to the specialized SOW endpoint: `/api/procurement-templates/templates/sow`
- This endpoint is specifically designed for SOW template selection

### 3. Backend Endpoint Verification

Confirmed that the backend has the proper endpoint:

- **Endpoint:** `/api/procurement-templates/templates/sow`
- **Location:** `server/src/routes/procurement-template-routes.js` (lines 130-201)
- **Mount Point:** `server/app.js` (line 479) at `/api/procurement-templates`
- **Full URL:** `http://localhost:3060/api/procurement-templates/templates/sow`

## How the Fixed Flow Works

1. **SOW Wizard** → `useTemplateLoader` hook
2. **useTemplateLoader** → `TemplateSelectorService.loadSOWTemplates()`
3. **TemplateSelectorService** → `TemplateService.fetchTemplates({table: 'procurement_templates'})`
4. **TemplateService** → calls `/api/procurement-templates/templates/sow?status=approved`
5. **Backend Route** → queries `procurement_templates` table
6. **Database** → returns approved SOW templates
7. **Response** → templates appear in SOW wizard

## Expected Results

After the fix:

- SOW Creation Wizard will source templates from the `procurement_templates` database table
- Templates will be properly filtered by `approval_status = 'approved'`
- No more hardcoded fallback templates
- Templates will include proper metadata (name, description, category, type, etc.)
- System will be aligned with the documented architecture

## Testing

Created debug script: `debug_sow_templates.js`

Run with:

```bash
node debug_sow_templates.js
```

This script tests:

- All template endpoints
- Different filter combinations
- SOW wizard request simulation
- Response analysis and template listing

## Files Modified

1. **`client/src/services/TemplateSelectorService.js`**

   - Fixed parameter passing to TemplateService
   - Added table specification to filters

2. **`client/src/common/components/templates/services/TemplateService.js`**
   - Added support for table-specific routing
   - Routes procurement templates to specialized SOW endpoint

## Verification Steps

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:3060/#/scope-of-work`
3. Click "New Scope of Work" to open the SOW Creation Wizard
4. Progress through wizard steps until "Select Scope of Work Template"
5. Verify templates are loading from database (not hardcoded)
6. Check browser console for successful API calls to `/api/procurement-templates/templates/sow`

## Related Documentation

- [1300_01900_MASTER_GUIDE_PROCUREMENT_TEMPLATES.md](../docs/pages-disciplines/1300_01900_MASTER_GUIDE_PROCUREMENT_TEMPLATES.md)
- [1300_01900_MASTER_GUIDE_PROCUREMENT.md](../docs/pages-disciplines/1300_01900_MASTER_GUIDE_PROCUREMENT.md)

## Status

✅ **FIXED** - SOW Creation Wizard now properly sources templates from the `procurement_templates` database table as specified in the system documentation.
