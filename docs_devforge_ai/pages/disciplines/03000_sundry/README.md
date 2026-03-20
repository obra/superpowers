# 01900 Procurement Templates

This folder contains the unified templates system sample data and documentation for the Procurement discipline (01900).

## 📁 Folder Structure

```
01900_procurement_templates/
├── README.md                    # This documentation file
└── sql/
    └── procurement_templates_data.sql  # Complete procurement templates dataset
```

## 🎯 Purpose

This dataset was created to fix the "No templates found in unified templates table" error that was occurring in the SOW (Scope of Work) workflow for procurement documents.

### The Problem
- SOW workflow users couldn't select templates because none were found
- Error: `TemplateSelectorService.js:289 [TemplateSelectorService] No templates found in unified templates table`
- Root cause: Discipline code conversion failure (Procurement ↔ 01900 lookup failed)

### The Solution
- **Frontend Fix**: Modified `TemplateSelectorService.js` to send discipline names directly
- **Backend Fix**: Modified `unified-templates-routes.js` to handle discipline names directly
- **Data Fix**: Ensured templates exist with correct `discipline = 'Procurement'` and `suitable_for_document_types`

## 📊 Template Coverage

### Document Types Supported
- **Purchase Orders** (`purchase_order`): 5 templates available
- **Work Orders** (`work_order`): 3 templates available
- **Service Orders** (`service_order`): 3 templates available

### Templates Included

| Template Name | Type | Document Types | Description |
|---------------|------|----------------|-------------|
| Standard Purchase Order Template | purchase_order | purchase_order | Basic procurement PO template |
| Construction Materials Template | purchase_order | purchase_order | Construction supplies procurement |
| IT Equipment Procurement Template | scope_of_work | purchase_order | IT equipment SOW template |
| Universal SOW Template | scope_of_work | purchase_order, work_order, service_order | Multi-purpose SOW template |
| Procurement SOW Template | scope_of_work | purchase_order, work_order, service_order | General procurement SOW |
| Construction Work Order Template | work_order | work_order | Construction work orders |
| Service Agreement Template | service_order | service_order | Service contracts |
| Consulting Services SOW | service_order | service_order | Consulting agreements |

## 🚀 Installation

1. **Apply Code Fixes First** (required):
   ```bash
   # Frontend fix already applied to TemplateSelectorService.js
   # Backend fix already applied to unified-templates-routes.js
   ```

2. **Run the SQL Data**:
   ```bash
   psql -d your_database -f docs/pages-forms-templates/01900_procurement_templates/sql/procurement_templates_data.sql
   ```

3. **Verify Installation**:
   ```sql
   SELECT
     name, type, document_type, suitable_for_document_types
   FROM templates
   WHERE discipline = 'Procurement'
     AND is_active = true
     AND 'purchase_order' = ANY(suitable_for_document_types)
   ORDER BY name;
   ```
   Expected: 5 rows returned

## 🧪 Testing

After installation, test the SOW workflow:

1. Navigate to Procurement page (`/01900`)
2. Open SOW Creation Wizard
3. Select a category and document type
4. Verify templates load in the templates selection step
5. No more "No templates found" errors

## 📝 Technical Details

### Database Schema
All templates use the unified `templates` table with these key fields:
- `discipline`: Set to 'Procurement'
- `suitable_for_document_types`: Array of compatible document types
- `is_active`: Must be true for templates to load
- `processing_status`: Must be 'published'

### API Flow
```
SOW Modal → useTemplateLoader → TemplateSelectorService → TemplateService
    ↓
unified-templates API → Filter by discipline + document_type → Return templates
```

### Error Prevention
- Templates use `ON CONFLICT DO NOTHING` for safe re-running
- Discipline filtering simplified to avoid code lookup failures
- Document type compatibility checked via array contains operations

## 🔗 Related Files

- **Frontend**: `client/src/services/TemplateSelectorService.js`
- **Backend**: `server/src/routes/unified-templates-routes.js`
- **Modal**: `client/src/pages/01900-procurement/components/modals/01900-ScopeOfWorkModal.js`
- **Hook**: `client/src/hooks/useTemplateLoader.js`

## 📚 Documentation

- [Unified Templates Implementation Plan](../../pages-disciplines/1300_UNIFIED_TEMPLATES_IMPLEMENTATION_PLAN.md)
- [Procurement Master Guide](../../pages-disciplines/1300_01900_MASTER_GUIDE_PROCUREMENT.md)
- [Template Management Guide](../../pages-disciplines/1300_01300_MASTER_GUIDE_TEMPLATE_MANAGEMENT.md)

## ✅ Status

- ✅ **Issue Identified**: Discipline code conversion failure
- ✅ **Root Cause Fixed**: Direct discipline name handling
- ✅ **Data Complete**: 8 procurement templates with full coverage
- ✅ **Testing Verified**: Templates load correctly in SOW workflow
- ✅ **Documentation**: Complete setup and troubleshooting guide

**Result**: SOW workflow templates now load successfully without errors.
