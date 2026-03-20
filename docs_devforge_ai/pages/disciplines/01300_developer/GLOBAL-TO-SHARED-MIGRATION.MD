# Global to Shared Migration

## Overview
This document outlines the migration from "Global" to "Shared" terminology to better reflect the purpose of cross-sector shared resources.

## Background
The "Global" organization and sector were causing confusion because:
- Users weren't clear if "Global" meant "all sectors" or "shared resources"
- The filtering logic was ambiguous when "Global" was selected
- The term "Global" didn't clearly communicate that these are shared/common pages

## Solution
Renamed "Global" to "Shared" throughout the system to clearly indicate these are shared resources that complement other sectors.

## Changes Made

### 1. Code Updates

#### Organization Config (`client/src/common/js/config/00200-organization-config.js`)
- ✅ Removed `getPageContentForOrganization` placeholder method
- ✅ Added comprehensive TODO documentation for future implementation
- ✅ Updated fallback data: `'Organisations - Global'` → `'Organisations - Shared'`
- ✅ Updated default organization references

#### Sector Config (`client/src/common/js/config/00200-sector-config.js`)
- ✅ Updated fallback data: `'Global'` → `'Shared'`
- ✅ Updated both API fallback and error fallback data

#### UI Display Settings (`client/src/common/js/ui/00200-ui-display-settings-fixed.js`)
- ✅ Updated legacy organization mappings: `'Organisations - Global'` → `'Organisations - Shared'`

#### Sector Management Page (`client/src/pages/02050-information-technology/sector-management/components/02050-sector-management-page.js`)
- ✅ Updated UI text: "Global sector" → "Shared sector"
- ✅ Updated badge logic: `sector.sector_name === 'Global'` → `sector.sector_name === 'Shared'`

### 2. Database Migration Script

Created `sql/migrate_global_to_shared.sql` to update:
- ✅ Companies table: `'Organisations - Global'` → `'Organisations - Shared'`
- ✅ Sectors table: `'Global'` → `'Shared'`
- ✅ Pages table: Both organization and sector name references
- ✅ Includes verification queries to confirm changes

## Database Migration Instructions

1. **Backup your database** before running the migration
2. Run the migration script:
   ```sql
   \i sql/migrate_global_to_shared.sql
   ```
3. Verify the results using the verification queries in the script

## Expected Behavior After Migration

### Shared Organization + Shared Sector
- Shows only pages that belong to the Shared sector and Shared organization
- These are foundation/common pages that complement other sectors
- Clear indication that these are shared resources

### Other Organizations
- Continue to work as before with their respective sectors
- No change in filtering behavior for non-shared organizations

## Benefits

1. **Clearer Intent**: "Shared" immediately communicates cross-sector resources
2. **Reduced Confusion**: Eliminates ambiguity about what "Global" means
3. **Better UX**: Users understand they're selecting shared/common resources
4. **Consistent Filtering**: All organization-sector combinations follow the same logic

## Files Modified

### Frontend Code
- `client/src/common/js/config/00200-organization-config.js`
- `client/src/common/js/config/00200-sector-config.js`
- `client/src/common/js/ui/00200-ui-display-settings-fixed.js`
- `client/src/pages/02050-information-technology/sector-management/components/02050-sector-management-page.js`

### Database Migration
- `sql/migrate_global_to_shared.sql`

### Documentation
- `docs/096_GLOBAL_TO_SHARED_MIGRATION.md` (this file)

## Testing Checklist

After migration, verify:
- [ ] Database migration completed successfully
- [ ] "Shared" appears in sector dropdown instead of "Global"
- [ ] "Organisations - Shared" appears in organization dropdown
- [ ] Selecting Shared sector + Shared organization shows only shared pages
- [ ] Other sector-organization combinations work correctly
- [ ] No references to "Global" remain in the UI
- [ ] Console logs show "Shared" instead of "Global"

## Rollback Plan

If needed, the migration can be reversed by:
1. Running the reverse SQL commands:
   ```sql
   UPDATE companies SET name = 'Organisations - Global' WHERE name = 'Organisations - Shared';
   UPDATE sectors SET sector_name = 'Global' WHERE sector_name = 'Shared';
   UPDATE pages SET organisation_name = 'Organisations - Global' WHERE organisation_name = 'Organisations - Shared';
   UPDATE pages SET sector_name = 'Global' WHERE sector_name = 'Shared';
   ```
2. Reverting the code changes in the modified files

## Future Considerations

1. **Organization-Specific Content**: The removed `getPageContentForOrganization` method can be implemented later when requirements are clearer
2. **Additional Shared Resources**: The "Shared" concept can be extended to other types of cross-sector resources
3. **UI Enhancements**: Consider adding visual indicators for shared vs. organization-specific content
