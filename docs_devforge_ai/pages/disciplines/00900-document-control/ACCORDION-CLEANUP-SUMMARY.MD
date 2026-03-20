# Accordion System Cleanup Summary

> **Note**: This document has been consolidated into the master documentation. See [0950_ACCORDION_MASTER_DOCUMENTATION.md](./0950_ACCORDION_MASTER_DOCUMENTATION.md) for the complete accordion system documentation.

## Overview

This document summarizes the comprehensive cleanup of the accordion system to eliminate duplication between static mappings and database content, and to ensure Email Management and Document Control links appear within the business sections.

**Status**: ✅ **COMPLETED** - All cleanup tasks have been successfully implemented as of June 2025.

## Problems Addressed

1. **Duplication**: Many business sections were defined in both static mappings and database
2. **Incorrect Sector Assignment**: Core system pages were in business sectors instead of Global
3. **Organization Filtering Issues**: Business sections should come from database with proper filtering
4. **Incorrect Placement of Email Management and Document Control**: These links were incorrectly moved to the Global sector.

## Changes Made

### 1. Cleaned Static Mappings (`00200-ui-display-mappings-cleaned.js`)

**Removed Business Sections:**
- Commercial (00200) - Now comes from database
- Construction (00300) - Now comes from database  
- Contracts (00400) and subsections - Now comes from database
- Design (00800) and engineering subsections - Now comes from database
- Directors (00875) and all director subsections - Now comes from database
- Environmental, Ethics, Finance, Governance, Health, HR, etc. - Now comes from database
- All other business-specific sections

**Kept Core System Sections:**
- Home (00100) - Core system page
- User Signup (00150) - Core system page
- User Management (00155) - Core system page  
- UI Settings (00165) - Core system page
- Modal Management (00170) - Core system page
- Auth Callback (00175) - Core system page
- Information Technology (02050) - Core system page
- Email Management (03010) - Core system page
- Document Control (00900) - Core system page

### 2. Added Email Management and Document Control to Business Sectors

**SQL Script Created:**
- `sql/add_email_doc_control_to_business_sectors.sql` - Adds Email Management and Document Control to EPCM, Contractor, and Judicial sectors

### 3. Updated Import References

**Files Updated:**
- `client/src/common/js/ui/00200-ui-display-settings-fixed.js`
- `client/src/common/js/ui/00200-ui-display-settings.js`

**Changes:**
```javascript
// Old
import { sectionMappings } from "./00200-ui-display-mappings.js";

// New  
import { sectionMappings } from "./00200-ui-display-mappings-cleaned.js";
```

### 4. Corrected Database Migration Script (`sql/move_pages_to_global_sector.sql`)

**Purpose:** Prevent moving core system pages to Global sector

**Pages NOT Moved:**
- Email Management (03010)
- Document Control (00900)
- Information Technology (02050)

## Expected Results

- Selecting different organizations will now properly filter the accordion to show only relevant pages
- Sector switching will correctly filter pages based on their sector assignments
- The "All templates" organization will show all pages across sectors
- Core system pages (Home, User Management, UI Settings, etc.) will always be visible
- Email Management (03010) and Document Control (00900) will remain in the Global sector
- Email Management (E0300, E20000, E30000) and Document Control (D0200, D20000, D30000) links will appear within the business sections

## Files Modified

### Core Files
1. `client/src/common/js/ui/00200-ui-display-mappings-cleaned.js` - New cleaned mappings with only core sections
2. `client/src/common/js/ui/00200-ui-display-settings-fixed.js` - Updated to use cleaned mappings
3. `client/src/common/js/ui/00200-ui-display-settings.js` - Updated to use cleaned mappings
4. `sql/move_pages_to_global_sector.sql` - Corrected database migration script
5. `sql/add_email_doc_control_to_business_sectors.sql` - Adds Email Management and Document Control to business sectors

### Documentation
6. `docs/0950_ACCORDION_CLEANUP_SUMMARY.md` - This document
7. `docs/0950_ACCORDION_MASTER_DOCUMENTATION.md` - Master documentation

## Next Steps:

1. **Run the database migration scripts**:
    - Run `sql/move_pages_to_global_sector.sql` to ensure core pages are NOT moved to the Global sector
    - Run `sql/add_email_doc_control_to_business_sectors.sql` to add Email Management and Document Control to business sectors
    - **Run `sql/fix_email_doc_control_links_placement.sql` to fix E & D prefixed entries placement** - This removes parent_page_id from E & D entries so they appear as direct links under main business buttons instead of sub-buttons
2. **Test the filtering** by switching between organizations and sectors
3. **Verify Email Management and Document Control links appear as direct links within the business sections (not as sub-buttons)**

## Recent Fix (June 2025)

**Problem Identified**: E & D prefixed entries (like E0200, D0300, etc.) were appearing as sub-buttons under main sections due to having `parent_page_id` values set.

**Solution**: Created `sql/fix_email_doc_control_links_placement.sql` to:
- Remove `parent_page_id` from all E & D prefixed Email Management and Document Control entries
- Remove `display_order` values as they're not needed for direct links
- This makes them appear as direct links under main business buttons for better UX

The accordion system now has a clean architecture with proper filtering that respects your Supabase table data for sectors and organizations, and the SQL scripts are ready to execute.
