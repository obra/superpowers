# Accordion Filtering Fixes

## Overview

This document outlines the fixes implemented to resolve accordion filtering issues where the accordion was not correctly filtering by sector and organization combinations.

## Issues Identified

Based on the provided images showing faulty accordion filtering for different sector/organization combinations, the following issues were identified:

### 1. Sector Name Mapping Mismatch
**Problem**: The sector mapping in `UIDisplaySettingsManager` used incorrect sector names that didn't match the actual sector names from the database.

**Original Code**:
```javascript
const sectorMapping = {
  'Organisations - All template': 'organisations-all',  // WRONG
  'Global': 'global',
  // ...
};
```

**Fixed Code**:
```javascript
const sectorMapping = {
  'Templates - All': 'organisations-all',  // CORRECT
  'Global': 'global',
  // ...
};
```

### 2. Organization Name Inconsistency
**Problem**: The `allowedOrganizations` arrays in section mappings used inconsistent organization names that didn't match the actual organization names used in the system.

**Fixed**: Updated all organization references to use the correct names:
- `"Organisations - All templates"` (note: "templates" plural)
- `"Organisations - EPCM template"`
- `"Organisations - Contractor template"`
- `"Organisations - Judicial template"`

### 3. Database Sector ID vs Name Confusion
**Problem**: The filtering logic tried to match database sector UUIDs directly with mapped sector names, causing filtering failures.

**Original Code**:
```javascript
// Convert DB sector_id to mapped sector name for filtering
const dbPageSectorName = Object.keys(sectorMapping).find(key => sectorMapping[key] === dbPage.sector_id);
const dbPageSectorId = sectorMapping[dbPageSectorName]; // This was wrong
```

**Fixed Code**:
```javascript
// Get the actual sector object from sectorConfig to match the database sector_id
const allSectors = sectorConfig.getAllSectors();
const dbPageSector = allSectors.find(sector => sector.sector_id === dbPage.sector_id);

if (!dbPageSector) {
  console.log(`⏭️ [Settings] Skipping DB page ${dbPage.page_name} - sector not found in sectorConfig`);
  return;
}

// Map the sector name to the internal sector ID used in mappings
const dbPageSectorId = sectorMapping[dbPageSector.sector_name];
```

### 4. Accordion Component Not Refreshing on Changes
**Problem**: The accordion component wasn't re-fetching database pages when sector/organization changes occurred.

**Fixed**: Added database refresh in the accordion component:
```javascript
accordionManager.initialize(navigate)
  .then(async () => {
    // Re-fetch pages from database to ensure we have latest data
    await settingsManager.fetchPagesFromDatabase();
    
    // Get the accordion sections from settings manager
    const sections = settingsManager.getAccordionSections();
    // ...
  })
```

## Files Modified

### 1. `client/src/common/js/ui/00200-ui-display-settings.js`
- Fixed sector name mapping from `'Organisations - All template'` to `'Templates - All'`
- Fixed database page filtering logic to properly match sector UUIDs with sector names
- Improved error handling and logging for debugging

### 2. `client/src/common/js/ui/00200-ui-display-mappings.js`
- Updated organization names in `allowedOrganizations` arrays to match actual system names
- Ensured consistency across all section mappings
- Added `"Organisations - All template"` to global sections for proper visibility

### 3. `client/src/modules/accordion/00200-accordion-component.js`
- Added database page refresh when sector/organization changes occur
- Improved accordion data reloading logic

## Expected Behavior After Fixes

### Contractor Sector + Organizations - Contractor Template
- Should show: Global sections + Contractor-specific sections + pages from database with contractor sector and matching organization

### Global Sector + Organizations - All Templates
- Should show: All sections from all sectors (administrative view)

### Engineering Procurement Construction Management + Organizations - EPCM Template
- Should show: Global sections + EPCM-specific sections + pages from database with EPCM sector and matching organization

## Testing Recommendations

1. **Clear Browser Cache**: Clear localStorage and browser cache to ensure fresh configuration loading
2. **Check Console Logs**: Monitor browser console for detailed filtering debug logs
3. **Verify Database Data**: Ensure the `public.pages` table has correct sector_id and organization_id values
4. **Test Sector Switching**: Test switching between different sector/organization combinations
5. **Verify API Endpoints**: Ensure `/api/sectors`, `/api/companies`, and `/api/pages` endpoints are working correctly

## Debug Information

The fixes include extensive console logging to help debug filtering issues:

- `[Settings DEBUG]` logs show the filtering process step by step
- Sector and organization matching logic is logged for each section
- Database page processing includes detailed logging for troubleshooting

## Related Documentation

- [Accordion Management](0950_ACCORDION_MANAGEMENT.md)
- [Sector Management](0950_SECTOR_MANAGEMENT.md)
- [Pages Table Schema](0301_PAGES_TABLE_SCHEMA.md)

## Conclusion

These fixes address the core issues with accordion filtering by:
1. Correcting sector name mappings
2. Standardizing organization names
3. Fixing database sector ID resolution
4. Ensuring accordion refreshes on configuration changes

The accordion should now properly filter content based on the selected sector and organization combinations as shown in the provided images.
