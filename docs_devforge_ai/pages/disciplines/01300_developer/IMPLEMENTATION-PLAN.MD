# Implementation Plan: Fix UI Compliance Page Type Determination Logic

## Overview
The current UI compliance analysis script incorrectly determines page types by reading from the index-pages.md file and attempting to reverse-engineer from actual code implementation. This leads to inaccurate categorization and compliance reporting. The script must be modified to use the Page Implementation Procedure's direct categorization logic by querying the pages table's new page_type field, which stores the authoritative page type for each page.

## Types
The Page Implementation Procedure defines 10 page types across 2 categories:

### Category A: Pages WITH Background Images (2 types)
- **landing_pages**: Welcome/marketing pages, no interactive buttons (0 pages currently)
- **discipline_pages**: Functional discipline interfaces with buttons (currently ~27 pages)

### Category B: Pages WITHOUT Background Images (8 types)
- **data_management**: CRUD operations, data tables, search/filter
- **workflow_processing**: Process automation, multi-step workflows, approval chains
- **data_collection**: Data collection forms, user onboarding, multi-step forms
- **document_processing**: File/document handling, uploads, downloads, document management
- **time_tracking**: Time management, scheduling, calendar integration
- **scheduling_tools**: Project scheduling, resource allocation, progress tracking
- **reporting_dashboards**: Analytics, reporting, data visualization, KPIs
- **utility_configuration**: Settings, configuration, system administration, maintenance

## Files

### Modified Files
- `.cline/skills/ui-compliance-skill/scripts/analyze.py`: Replace complex mapping logic with database query to get page_type from pages table
- `docs/schema/current-full-schema.sql`: Add page_type field to pages table
- `docs/schema/index-pages.md`: Add clarification note about categorization accuracy
- `reports/ui-compliance-report.md`: Update to reflect corrected categorization

### Database Schema Changes
- **pages table**: Add `page_type` TEXT field to store procedure-defined page type (landing_pages, discipline_pages, data_management, etc.)
- **Migration script**: Create and run SQL migration to add page_type column and populate existing pages

### New Files
- `sql/migrations/add_page_type_to_pages.sql`: Migration script to add page_type field

## Functions

### Modified Functions
- `determine_page_type(page_url: str) -> str`: Replace complex index-reading logic with database query to get page_type from pages table
- `load_page_index() -> Dict[str, Any]`: Remove - no longer needed
- `check_background_policy(page_url: str, expected_type: str)`: Update to use procedure-based categorization

### New Functions
- `get_page_type_from_db(page_url: str) -> str`: Query pages table for page_type based on page_slug or page_id
- `validate_page_type_consistency()`: Ensure page_type field matches procedure definitions

## Classes
No class modifications required - all changes are to standalone functions.

## Dependencies
No new dependencies required - all changes use existing Python standard library and project imports.

## Testing

### Test Cases
- Verify database queries return correct page_type for known pages
- Ensure background image violations are properly flagged for Category B pages
- Confirm compliance scores reflect procedure adherence, not implementation artifacts
- Test edge cases for pages not found in database

### Validation Steps
1. Run analysis on known pages with confirmed correct categorization
2. Verify violation reports match procedure expectations
3. Check that counts match procedure definitions
4. Ensure no false positives/negatives in compliance reporting
5. Validate database migration populated page_type correctly

## Implementation Order

1. **Create database migration** to add page_type field to pages table
2. **Run migration** to populate existing pages with correct page_type values
3. **Update analyze.py determine_page_type function** to query database instead of using complex mappings
4. **Remove load_page_index() function calls** and related index-reading logic
5. **Update background policy checks** to use procedure-based categories
6. **Test categorization accuracy** with known page examples
7. **Update documentation** to reflect corrected logic
8. **Regenerate reports** and verify compliance scores are accurate
9. **Add validation function** to prevent future categorization drift