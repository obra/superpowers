# ACCORDION SECTIONS FIX SUMMARY

## Problem Analysis

The current accordion was only showing 8 sections instead of the expected 30+ sections for EPCM organization:

**Current Accordion (8 sections):**
- Construction
- Contracts  
- Directors
- Document Control
- Home
- Information Technology
- Other
- Settings

**Database Analysis Results:**
- Total sections in database: 53
- Sections that should show for EPCM: 30 (global + epcm sectors)
- Missing sections: 13 key sections
- Issue: Frontend couldn't fetch accordion sections from database

## Root Cause

The frontend `UIDisplaySettingsManager` was trying to fetch accordion sections from `/api/accordion-sections` endpoint, but this API endpoint **did not exist** on the server.

## Solution Implemented

### 1. Created Missing API Endpoint
**File:** `server/src/routes/accordion-sections-routes.js`
- `GET /api/accordion-sections` - Get all sections with filtering
- `GET /api/accordion-sections/for-organization/:organizationId` - Organization-specific filtering
- `GET /api/accordion-sections/:sectionKey` - Get specific section

**Key Features:**
- Proper organization-based filtering (EPCM gets global + epcm sectors)
- Comprehensive logging for debugging
- Unique reference generation for filtering
- Error handling and validation

### 2. Registered API Route
**File:** `server/app.js`
- Added import for accordion sections router
- Registered route: `app.use('/api/accordion-sections', accordionSectionsRouter)`

### 3. Updated Frontend Logic
**File:** `client/src/common/js/ui/00200-ui-display-settings.js`
- Modified `buildSectionsFromPages()` to use organization-specific endpoint
- Enhanced logging and debugging
- Improved error handling

## Expected Results

After this fix, the EPCM organization should see **30 accordion sections** instead of 8:

### Sections That Should Now Appear:
1. **Currently Missing (13 sections):**
   - Administration (global)
   - Commercial (epcm)
   - Pre-award (epcm) 
   - Post-award (epcm)
   - Design (epcm)
   - Architectural (epcm)
   - Chemical engineering (epcm)
   - Civil engineering (epcm)
   - Electrical engineering (epcm)
   - Mechanical engineering (epcm)
   - Developer (epcm)
   - Sales (epcm)

2. **Already Showing (17 sections):**
   - Home, Construction, Contracts, Directors, Document Control, etc.

### Unique Reference System
Each page now gets a unique reference for filtering and debugging:
```
Format: ACCORDION_FILTER_{page_prefix}_{page_slug}_{org_id_short}
Example: ACCORDION_FILTER_00425_contracts-pre-award_90cd635a
```

## Organization-Specific Filtering

The API now properly filters sections by organization:

- **EPCM (90cd635a-380f-4586-a3b7-a09103b6df94):** global + epcm sectors
- **Shared (02477804-5d5b-416f-9068-33db504807b9):** global sectors only  
- **Contractors (8965e2e0-47b3-47c4-b6a4-1157508430e1):** global + contractor sectors
- **Judicial (02477804-5d5b-416f-9068-33db504807b8):** global + judicial sectors

## Testing

To verify the fix works:

1. **Check API Endpoint:**
   ```bash
   curl "http://localhost:3060/api/accordion-sections/for-organization/90cd635a-380f-4586-a3b7-a09103b6df94"
   ```

2. **Check Frontend:**
   - Open browser developer tools
   - Look for `[ACCORDION_DEBUG]` logs
   - Verify 30 sections are loaded instead of 8

3. **Visual Verification:**
   - Open accordion menu
   - Count visible sections
   - Should see sections like "Administration", "Commercial", "Pre-award", etc.

## Files Modified

1. **NEW:** `server/src/routes/accordion-sections-routes.js` - API endpoint
2. **MODIFIED:** `server/app.js` - Route registration  
3. **MODIFIED:** `client/src/common/js/ui/00200-ui-display-settings.js` - Frontend logic

## Analysis Reference

**Unique Analysis Reference:** `ACCORDION_ANALYSIS_1753349512288`

This fix addresses the core issue where the accordion system had all the data in the database but couldn't access it due to a missing API endpoint. The solution provides proper organization-based filtering and comprehensive logging for future debugging.
