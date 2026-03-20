# Sector Management Refinement Plan

## Overview
This document outlines the stepped process for refining the Sector Management System, focusing on minimizing build times during the development cycle. It incorporates updated sector page number ranges and includes mechanisms for both sector and organization-based page filtering. The plan is designed to be incremental to manage complexity and reduce development cycle impact.

## Updated Sector Page Number Ranges

The following page number prefix ranges are used for sector assignment, as defined in the backend and initial data:

*   **Templates - All**: `00000-99999` (New administrative sector to view all pages)
*   **Global**: `00000-00199`
*   **Engineering Procurement Construction Management (EPCM)**: `00200-09999`
*   **Engineering Procurement Construction**: `10000-19999`
*   **Contractor**: `20000-29999`
*   **Judicial**: `30000-39999`

## Backend API Endpoints for Sector Management

The `server/src/routes/sector-management-routes.js` module provides the following API endpoints for managing sectors:

*   **GET `/api/sectors`**: Retrieves a list of all active sectors from the database.
*   **POST `/api/sectors`**: Creates a new sector with a name, start and end page number prefixes, and an active status.
*   **PUT `/api/sectors/:id`**: Updates an existing sector identified by its `sector_id`.
*   **DELETE `/api/sectors/:id`**: Deletes a sector identified by its `sector_id`.
*   **POST `/api/sectors/migrate`**: Executes the database migration script (`sql/add_sector_management_tables.sql`) to create the `sectors` table and inserts initial sector data. This endpoint primarily uses Supabase RPC for execution.
*   **POST `/api/generate-sector-code`**: Generates SQL statements for inserting a new sector into the database and provides frontend configuration updates for `client/src/common/js/config/0200-sector-config.js` and `client/src/common/js/ui/0200-ui-display-mappings.js`. This endpoint also handles the generation of new pages and dummy background images for new or existing sectors.
*   **POST `/api/generate-accordion-config-from-text`**: Generates a basic accordion configuration object from a provided text input, useful for quickly structuring new sections in the UI.
*   **Organizations API Endpoints (`server/src/routes/organizations.js`):**
    *   **POST `/api/organizations`**: Creates a new organization.
    *   **GET `/api/organizations`**: Retrieves a list of all organizations.
    *   **PUT `/api/organizations/:id`**: Updates an existing organization.
    *   **DELETE `/api/organizations/:id`**: Deletes an organization.

**Note on Database Initialization**: The backend uses lazy initialization for both Supabase and PostgreSQL database clients, ensuring connections are established only when needed. Supabase is the preferred method for database operations, including migrations.

## Stepped Process for Sector Management Refinement

**Note**: All steps outlined below have been successfully implemented and completed. This document now serves as a record of the completed development plan.

### Phase 1: Core Data & Sector Management UI Refinement (COMPLETE)

1.  **Implement Robust Frontend Sector Data Initialization (COMPLETE):**
    *   **Goal**: Modify `client/src/common/js/config/00200-sector-config.js` to fetch sector data from the backend API (`/api/sectors`) on application startup rather than only when the sector management page is loaded. This ensures sector data is globally available early for the UI.
    *   **Status**: ✅ COMPLETE - Updated `00200-sector-config.js` with proper API integration and initialization methods.
    *   **Rationale for Build Time**: This involves targeted changes to a few JavaScript files, resulting in minimal recompilation.

2.  **Implement Real Organization Data Fetching and Active Organization Management (COMPLETE):**
    *   **Goal**: Replace dummy data in `client/src/common/js/config/00200-organization-config.js` with actual API calls to fetch organization data. Additionally, implement a mechanism to set and retrieve the currently active organization, as this will be used for accordion filtering.
    *   **Status**: ✅ COMPLETE - Updated `00200-organization-config.js` with API integration to `/api/companies` endpoint and active organization management.
    *   **Rationale for Build Time**: Targeted changes to one JavaScript file, leading to minimal recompilation.

3.  **Implement Database Migration and Initial Data Insertion (COMPLETE):**
    *   **Goal**: Ensure the `sectors` table is correctly created and populated with initial data.
    *   **Status**: ✅ COMPLETE - Database migration completed and sectors table populated with initial data including Global (0-199) and EPCM (200-9999) sectors.

4.  **Refine Sector Management Page UI (`client/src/pages/02050-information-technology/sector-management/components/02050-sector-management-page.js`) (COMPLETE):**
    *   **Goal**: Enhance the administrative interface for managing sectors, ensuring its features (generate new sector code, text-to-accordion conversion, SQL generation) are refined and user-friendly. This includes ensuring it correctly interacts with the initialized sector data.
    *   **Status**: ✅ COMPLETE - Created comprehensive UI with sector overview, organization management, GenerateSectorCodeModal integration, and text-to-accordion functionality. The modal now supports creating new sectors or adding pages to existing ones, including input for page descriptions.

### Phase 2: Accordion Structure & Page Assignment (COMPLETE)

5.  **Audit `client/src/common/js/ui/00200-ui-display-mappings.js` for Page Prefix Alignment and Organization Association (COMPLETE):**
    *   **Goal**: Verify that all existing pages listed in `sectionMappings` have prefixes that logically align with their intended sectors (using the *new* ranges). Additionally, determine how to associate pages with organizations (e.g., a new property like `allowedOrganizations` array or `isGlobal` boolean that can be toggled). Pages designated as templates will be associated with a "Template-EPCM" organization.
    *   **Status**: ✅ COMPLETE - Comprehensive section mappings with proper sector assignments and organization associations already implemented. All sections have `sector` and `allowedOrganizations` properties correctly configured.

6.  **Introduce `sector` and `organization` Properties to `sectionMappings` (COMPLETE):**
    *   **Goal**: Enhance `client/src/common/js/ui/00200-ui-display-mappings.js` by adding a `sector` property to each section mapping for explicit association, and a mechanism (e.g., `allowedOrganizations` array or `isGlobal` boolean) to control page visibility based on the active organization.
    *   **Status**: ✅ COMPLETE - All sections in the mappings file already include `sector` and `allowedOrganizations` properties with proper configuration for Global (0-199), EPCM (200-9999), EPC (10000-19999), Contractor (20000-29999), and Judicial (30000-39999) sectors.

7.  **Update `getAccordionSections` to Filter by Sector and Organization (COMPLETE):**
    *   **Goal**: Modify `client/src/common/js/ui/00200-ui-display-settings.js` to filter accordion sections based on both the active sector *and* the active organization. This includes ensuring that the "Templates - All" sector/organization can view all pages, while other sectors/organizations adhere strictly to their assigned page ranges.
    *   **Status**: ✅ COMPLETE - Advanced filtering logic implemented in `getAccordionSections()` method. The "Templates - All" sector/organization now correctly displays all sections, while other sectors/organizations filter content based on their assigned ranges and allowed organizations.

8.  **Verify Page Number Prefix Alignment and Prepare for Future Sector Expansion (COMPLETE):**
    *   **Goal**: Verify that all existing pages are correctly aligned with their intended sectors and prepare the system for future expansion to other sectors (Contractor, EPC, Judicial).
    *   **Status**: ✅ COMPLETE - All existing pages are correctly positioned within their designated sectors:
        - Global sector (00000-00199): Home, Administration, User Management, Settings, etc.
        - EPCM sector (00200-09999): All business function pages including Commercial, Construction, Contracts, Engineering, Directors, Environmental, Finance, IT, etc.
    *   **Note**: The UI display mappings already include placeholder entries for future Contractor (20000-29999), EPC (10000-19999), and Judicial (30000-39999) sectors. New pages for these sectors can be created when needed using the existing sector management tools.

### Phase 3: Comprehensive Integration & Testing (COMPLETE)

9.  **Ensure Consistent Frontend Integration & Re-rendering (COMPLETE):**
    *   **Goal**: Verify that all frontend components (accordion filtering, dynamic page loading, etc.) consistently use the active sector and re-render correctly.
    *   **Status**: ✅ COMPLETE - Verified and enhanced frontend integration:
        - HomePage component properly initializes and monitors sector/organization changes
        - Administration page component properly initializes and monitors sector/organization changes  
        - AccordionComponent enhanced to monitor sector/organization changes and reload accordion data when configurations change
        - All components use proper React `useEffect` hooks to react to sector and organization changes
        - Periodic monitoring (1-second intervals) ensures real-time updates when sector/organization changes occur

10. **Thorough Testing and Validation (COMPLETE):**
    *   **Goal**: Conduct end-to-end testing for all sector management functionalities, including the "Contractor" sector and organization-based page visibility.
    *   **Status**: ✅ COMPLETE - Comprehensive end-to-end testing completed successfully:
        - Application builds and runs without errors.
        - Homepage loads correctly with proper sector/organization initialization.
        - Accordion menu displays sections with correct filtering based on active sector and organization:
            - When "Engineering Procurement Construction Management" (EPCM) is the active sector and "Template - EPCM" is the active organization, only Global (00000-00199) and EPCM (00200-09999) sections are displayed.
            - When "Templates - All" is the active sector and "Templates - All" is the active organization, all sections from all sectors (Global, EPCM, EPC, Contractor, Judicial) are displayed.
        - Sector Management page loads and displays correctly at `/information-technology/sector-management`.
        - Active sector and organization information displays correctly, including multi-select display.
        - Backend API endpoints (`/api/sectors` and `/api/organizations`) return correct data.
        - Real-time sector/organization changes are detected and trigger accordion re-rendering.
        - All frontend components properly integrate with the sector and organization management system.
        - Database contains correct sector data with proper page number ranges, including the new "Templates - All" sector.
        - All Phase 1, 2, and 3 objectives have been successfully implemented and tested.

## Key Risks and Mitigation Strategies

1.  **Risk: File System Operations (Page Renaming and Copying)**
    *   **Description**: High risk of broken links, imports, and build issues due to incorrect renames or missed internal reference updates.
    *   **Mitigation**: Controlled batches, automated assistance (scripts/tools), immediate testing after each batch, and frequent version control commits.

2.  **Risk: Complexity of Accordion Filtering Logic**
    *   **Description**: Moderate risk in correctly implementing combined sector and organization-based visibility, potentially leading to incorrect page display.
    *   **Mitigation**: Clear property definition for organization association, thorough unit testing of filtering logic, and comprehensive manual testing across various sector/organization combinations.

3.  **Risk: Backend API Readiness for Organization Data**
    *   **Description**: Low to Moderate risk. Dependence on stable and complete backend endpoints for organization data.
    *   **Mitigation**: Early communication with backend team, robust frontend error handling, and temporary use of mock data if needed.

4.  **Risk: Unforeseen Dependencies and Ripple Effects**
    *   **Description**: Moderate risk when modifying core configuration files, potentially causing unintended side effects.
    *   **Mitigation**: Incremental changes, code review, and regression testing after significant modifications.
