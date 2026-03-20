# 00435_CONTRACTS_POST_AWARD_IMAGE_DEBUGGING.md

## Status
- [x] Initial draft
- [ ] Tech review completed
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-08): Initial version

## Overview
This document details the debugging process for resolving the background image display issue on the 00435 Contracts Post-Award page.

## Problem Description
The 00435 Contracts Post-Award page was not displaying its background image correctly in the production environment. The page was attempting to load an image from a path based on the sector ID, but the image was not found.

## Root Cause Analysis
Through comprehensive logging and debugging, we identified the following issues:

1. **Sector ID Mismatch**: The page with prefix '00435' has:
   - `sector_id`: `d823e44c-844b-4a2e-9b10-9356d497dc2b` (Engineering Procurement Construction Management)
   - `sector_name`: "Commercial"
   
   This mismatch indicates a data inconsistency in the database.

2. **Asset Path Generation**: The image path was being generated using the sector ID as the folder name:
   `/assets/d823e44c-844b-4a2e-9b10-9356d497dc2b/00435.png`
   
   However, the asset folders are named after organization types, not UUIDs:
   - `/assets/civils/`
   - `/assets/commercial/`
   - `/assets/default/`
   - `/assets/industrial/`
   - `/assets/legal/`

3. **Missing Organization Name**: The API response for page hierarchy was not including the `organisation_name` field, which would be needed to map to the correct asset folder.

## Solution Approach
The solution requires addressing the data inconsistency and implementing proper mapping between sector/organization identifiers and asset folder names.

## Implementation Steps
1. Fix the data inconsistency in the database to ensure sector IDs match sector names
2. Modify the image path generation logic to use organization names or types instead of sector IDs
3. Update the API to include organization names in the page hierarchy response
4. Implement a mapping between organization names and asset folder names

## Related Files
- `client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`
- `client/src/common/js/ui/00210-image-theme-helper.js`
- `sql/populate_pages_table.sql`
- `sql/create-organizations-table.sql`

## References
- [Documentation Guide](./0000_DOCUMENTATION_GUIDE.md)