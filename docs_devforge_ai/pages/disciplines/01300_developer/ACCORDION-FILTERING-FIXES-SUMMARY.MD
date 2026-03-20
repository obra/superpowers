# Accordion Filtering Fixes Summary

## Problem Identified

The accordion menu was not properly filtering pages based on sector and organization selections. The main issues were:

1. **Organization ID Mismatches**: The client-side filtering logic was using different organization IDs than what was stored in the database
2. **Sector UUID Mismatches**: The client code was using string mappings while the database used UUIDs
3. **Incomplete Filtering Logic**: The filtering logic was not properly matching database records with active selections

## Root Cause Analysis

### Organization ID Mismatch
- **Database (CSV)**: Used IDs like `org-organisations-epcm-uuid`
- **Client Code**: Expected IDs like `org-28-uuid` or different variations
- **Impact**: Pages were never matched to active organizations

### Sector UUID Mismatch  
- **Database (CSV)**: Used UUIDs like `d823e44c-844b-4a2e-9b10-9356d497dc2b`
- **Client Code**: Used string mappings like `'epcm'`
- **Impact**: Sector filtering was not working correctly

### Filtering Logic Issues
- The accordion filtering was not properly translating between client-side organization/sector selections and database identifiers
- Missing proper mapping between organization names and database IDs
- Incomplete sector UUID to name mapping

## Solutions Implemented

### 1. Fixed Organization Configuration (`00200-organization-config.js`)

**Changes Made:**
- Updated organization IDs to match CSV data exactly:
  - `org-organisations-all-uuid` for "Organisations - All templates"
  - `org-organisations-epcm-uuid` for "Organisations - EPCM template"  
  - `org-organisations-contractor-uuid` for "Organisations - Contractor template"
  - `org-organisations-judicial-uuid` for "Organisations - Judicial template"
- Updated sector IDs to use actual UUIDs from CSV data
- Fixed fallback data to use correct identifiers

### 2. Fixed Sector Configuration (`00200-sector-config.js`)

**Changes Made:**
- Added fallback sector data with correct UUIDs from CSV:
  - Global: `02477804-5d5b-416f-9068-33db504807b9`
  - EPCM: `d823e44c-844b-4a2e-9b10-9356d497dc2b`
  - EPC: `1bf36038-31d9-4fe9-87c7-03a9843acc9a`
  - Contractor: `8965e2e0-47b3-47c4-b6a4-1157508430e1`
  - Judicial: `02477804-5d5b-416f-9068-33db504807b8`
- Improved error handling with proper fallback data
- Set default active sector to EPCM instead of undefined

### 3. Created Fixed UI Display Settings (`00200-ui-display-settings-fixed.js`)

**Key Improvements:**
- **Proper Organization Mapping**: Created bidirectional mapping between organization names and database IDs
- **Sector UUID Mapping**: Added mapping from sector names to actual UUIDs from database
- **Enhanced Filtering Logic**: 
  - Filter pages by organization ID first
  - Then filter by sector UUID
  - Handle "All templates" organization to show all pages
- **Improved Debugging**: Added extensive logging to track filtering decisions
- **Hierarchical Support**: Maintained support for parent-child page relationships

**New Mapping Logic:**
```javascript
// Organization ID mapping from CSV data
const orgIdToNameMapping = {
  'org-organisations-all-uuid': 'Organisations - All templates',
  'org-organisations-epcm-uuid': 'Organisations - EPCM template', 
  'org-organisations-contractor-uuid': 'Organisations - Contractor template',
  'org-organisations-judicial-uuid': 'Organisations - Judicial template'
};

// Sector UUID mapping from CSV data
const sectorNameToUuidMapping = {
  'Global': '02477804-5d5b-416f-9068-33db504807b9',
  'Engineering Procurement Construction Management': 'd823e44c-844b-4a2e-9b10-9356d497dc2b',
  'Engineering Procurement Construction': '1bf36038-31d9-4fe9-87c7-03a9843acc9a',
  'Contractor': '8965e2e0-47b3-47c4-b6a4-1157508430e1',
  'Judicial': '02477804-5d5b-416f-9068-33db504807b8'
};
```

### 4. Updated Main UI Display Settings (`00200-ui-display-settings.js`)

**Changes Made:**
- Imported the fixed version
- Delegated `getAccordionSections()` method to the fixed implementation
- Delegated `fetchPagesFromDatabase()` method to the fixed implementation
- Maintained backward compatibility with existing API

## Expected Results

After implementing these fixes:

1. **Organization Filtering**: 
   - Selecting "Organisations - EPCM template" will show only EPCM pages
   - Selecting "Organisations - Contractor template" will show only Contractor pages
   - Selecting "Organisations - All templates" will show all pages

2. **Sector Filtering**:
   - Switching sectors will properly filter pages based on sector UUIDs
   - Pages will only appear if they belong to the active sector

3. **Combined Filtering**:
   - Pages must match both the active organization AND active sector to appear
   - Hierarchical relationships (parent-child pages) are preserved

4. **Debugging**:
   - Extensive console logging shows filtering decisions
   - Easy to trace why pages are included or excluded

## Testing Instructions

1. **Open Browser Console**: Check for detailed filtering logs
2. **Switch Organizations**: 
   - Select different organizations from dropdown
   - Verify accordion shows only relevant pages
3. **Switch Sectors**:
   - Change active sector
   - Verify pages filter correctly
4. **Check Combinations**:
   - Try different organization + sector combinations
   - Verify filtering works as expected

## Files Modified

1. `client/src/common/js/config/00200-organization-config.js` - Fixed organization IDs and sector UUIDs
2. `client/src/common/js/config/00200-sector-config.js` - Added proper fallback data with correct UUIDs
3. `client/src/common/js/ui/00200-ui-display-settings-fixed.js` - New fixed implementation
4. `client/src/common/js/ui/00200-ui-display-settings.js` - Updated to delegate to fixed version

## Data Mapping Reference

### Organization IDs (from CSV)
- `org-organisations-all-uuid` → "Organisations - All templates"
- `org-organisations-epcm-uuid` → "Organisations - EPCM template"
- `org-organisations-contractor-uuid` → "Organisations - Contractor template"  
- `org-organisations-judicial-uuid` → "Organisations - Judicial template"

### Sector UUIDs (from CSV)
- `02477804-5d5b-416f-9068-33db504807b9` → "Global"
- `d823e44c-844b-4a2e-9b10-9356d497dc2b` → "Engineering Procurement Construction Management"
- `1bf36038-31d9-4fe9-87c7-03a9843acc9a` → "Engineering Procurement Construction"
- `8965e2e0-47b3-47c4-b6a4-1157508430e1` → "Contractor"
- `02477804-5d5b-416f-9068-33db504807b8` → "Judicial"

## Backward Compatibility

- All existing functionality is preserved
- Static section mappings continue to work
- Hierarchical accordion structure is maintained
- No breaking changes to the public API

## Future Improvements

1. **Database Sync**: Ensure organization and sector data in database matches these mappings
2. **Admin Interface**: Create UI to manage organization/sector mappings
3. **Validation**: Add validation to ensure data consistency
4. **Performance**: Consider caching filtered results for better performance
