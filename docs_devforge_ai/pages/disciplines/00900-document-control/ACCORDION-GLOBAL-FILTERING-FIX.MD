# Accordion Global Filtering Fix

## Issue Description
The accordion filtering for sector = Global and Organisation = Organisations - Global was not functioning correctly. When users selected "Global" sector and "Organisations - Global" organization, the accordion was incorrectly showing all pages from all sectors instead of only the pages that belong to the Global sector and Global organization.

## Root Cause Analysis
The issue was in the filtering logic within `client/src/common/js/ui/00200-ui-display-settings-fixed.js`. The filtering had incorrect special case logic that treated "Organisations - Global" as a bypass for all filtering, when it should filter exactly like any other organization/sector combination.

According to the correct business logic:
- When "Organisations - Global" + "Global" sector is active, users should see ONLY pages that match both the Global organization ID AND Global sector ID
- When other organizations are active, pages should be filtered by both organization AND sector (same logic for all combinations)

## Data Analysis
From the pages table CSV data, we identified:

### Global Sector Pages
- Sector ID: `02477804-5d5b-416f-9068-33db504807b9`
- Organization ID: `08e53dd8-2a7f-470d-8d5f-9c97d24a53af`
- Organization Name: `Organisations - Global`
- Sample pages: Information Technology (02050), Administration (00102), Document Control (00900), etc.

### Other Sectors
- EPCM: `d823e44c-844b-4a2e-9b10-9356d497dc2b` / `3cb504bb-0699-44a7-b0f3-6771e7efab3a`
- Contractor: `8965e2e0-47b3-47c4-b6a4-1157508430e1` / `e46984e6-efd6-4478-865e-18c9c0c3233c`
- Judicial: `02477804-5d5b-416f-9068-33db504807b8` / `fd356354-a385-4e9d-9923-d002069af8d0`

## Fix Implementation

### Modified Files
1. `client/src/common/js/ui/00200-ui-display-settings-fixed.js`

### Changes Made
Updated the filtering logic in the `getAccordionSections()` method by REMOVING the special case logic:

```javascript
// Organization filtering - FIXED VERSION (no special Global case)
const orgFilteredPages = this.dbPages.filter(page => {
  // Check if page's organization_id matches any of our filter IDs
  const pageMatches = filterOrgId.includes(page.organization_id);
  console.log(`[Settings FIXED] Page ${page.page_name} (org: ${page.organization_id}) matches org filter: ${pageMatches}`);
  return pageMatches;
});

// Sector filtering - FIXED VERSION (no special Global case)
const sectorAndOrgFilteredPages = orgFilteredPages.filter(page => {
  // Check if page's sector_id matches any of our filter UUIDs
  const pageMatches = filterSectorUuids.includes(page.sector_id);
  console.log(`[Settings FIXED] Page ${page.page_name} (sector: ${page.sector_id}, org: ${page.organization_id}) matches sector filter: ${pageMatches}`);
  return pageMatches;
});
```

### Key Changes
1. **Removed Special Case Logic**: Eliminated the incorrect special case that treated "Organisations - Global" as a bypass for all filtering
2. **Standard Filtering**: Now applies the same organization AND sector filtering logic to all combinations, including Global
3. **Enhanced Logging**: Added detailed console logging to track filtering decisions

## Testing
Created `test-global-filtering-fix.js` to verify the fix:

### Test Results
- ✅ **Test 1**: Global organization + Global sector correctly shows only 3 Global pages (not all pages from all sectors)
- ✅ **Test 2**: EPCM organization correctly shows only 1 EPCM page (filtered by both org and sector)

## Expected Behavior After Fix

### When "Organisations - Global" + "Global" Sector is Active
- **Only Global pages** should be visible in the accordion
- This includes only pages with both Global sector ID (`02477804-5d5b-416f-9068-33db504807b9`) AND Global organization ID (`08e53dd8-2a7f-470d-8d5f-9c97d24a53af`)
- Examples: Information Technology (02050), Administration (00102), Document Control (00900), etc.

### When Other Organizations are Active
- Only pages matching **both** the organization ID and sector ID should be visible
- For example, "Organisations - EPCM" + "EPCM" sector = only EPCM pages
- For example, "Organisations - Contractors" + "Contractor" sector = only Contractor pages

## Verification Steps
1. Set active sector to "Global"
2. Set active organization to "Organisations - Global"
3. Open the accordion menu
4. Verify that ONLY Global pages are visible (not pages from other sectors)
5. Switch to a different organization (e.g., "Organisations - EPCM")
6. Verify that only pages from that specific organization/sector combination are visible

## Files Modified
- `client/src/common/js/ui/00200-ui-display-settings-fixed.js` - Main filtering logic fix
- `test-global-filtering-fix.js` - Test script to verify the fix

## Impact
This fix ensures that the "Global" organization + "Global" sector combination functions correctly by showing only the pages that specifically belong to the Global sector and Global organization, exactly as defined in the pages table. The filtering now works consistently for all organization/sector combinations without special cases.
