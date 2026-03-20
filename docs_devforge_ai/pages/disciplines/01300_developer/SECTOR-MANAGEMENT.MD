# Sector Management System

## Overview

The Sector Management System provides a way to group pages into different business sectors (e.g., Construction, Legal, Information Technology, Banking, Property, etc.). This system allows for better organization of the application's navigation and content based on business domains.

## Current Implementation Status

### ✅ Completed Components

1.  **Database Schema**
    *   `sectors` table with sector definitions
    *   `pages` table for dynamic page metadata (prefix, name, slug, sector_id, organization_id)
    *   Foreign key relationships in `chatbots` and `modal_configurations` tables
    *   SQL migration scripts created and executed

2.  **Frontend Configuration**
    *   Sector configuration management (`00200-sector-config.js`) now fetches real sector data from the backend API on application startup.
    *   Organization configuration management (`00200-organization-config.js`) now fetches real organization data from the backend API on application startup, ensuring consistent array format for active organization.
    *   UI display mappings (`00200-ui-display-mappings.js`) include `sector` and `allowedOrganizations` properties for comprehensive filtering.
    *   Settings manager integration (`00200-ui-display-settings.js`) for sector and organization filtering is fully implemented, including fetching and integrating dynamic page data from the `pages` table and special handling for the "Templates - All" sector/organization.
    *   Dynamic background image implementation for `00100-HomePage.js` and `00102-administration-page.js` is in place.

3.  **User Interface**
    *   Sector selector dropdown in main layout.
    *   Sector management page (`02050-information-technology/sector-management`) for administrative functions.
    *   Modal for generating new sector code (`02050-GenerateSectorCodeModal.js`).
    *   `AddPagesToSectorModal` now correctly resets state and closes after operation, and triggers UI re-render.

4.  **Core Architecture**
    *   Dynamic page loading based on active sector and organization.
    *   Accordion filtering by sector ranges and organization permissions, including dynamically loaded pages.
    *   Real-time re-rendering of components based on sector and organization changes.

### ✅ Completed Components (Backend)

1.  **Backend API Integration**
    *   CRUD API endpoints for sectors (`/api/sectors`) are implemented.
    *   API endpoints for generating sector code (`/api/generate-sector-code`) and applying database migrations (`/api/sectors/migrate`, `/api/pages/migrate`) are implemented.
    *   New API endpoint `/api/pages` to fetch all page metadata from the database.
    *   `addPagesToExistingSector` function now inserts page metadata into the `public.pages` table.
    *   Chatbot and Modal configurations now support optional `sector` filtering in their API endpoints.

2.  **Database Migration Execution**
    *   SQL migration scripts (`add_sector_management_tables.sql`, `add_sector_column_to_tables.sql`, `populate_sectors_table.sql`, `add_pages_table.sql`) are present and have been executed. Initial sector data, including the new "Templates - All" sector, is populated.

### ✅ All Work Completed

All previously identified "Partially Implemented" and "Outstanding Work" items have been addressed and completed. The system is fully functional as per the Sector Management Refinement Plan.

## Architecture

### Database Schema

```sql
-- Sectors table
CREATE TABLE public.sectors (
    sector_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_name VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    page_number_prefix_start INTEGER NOT NULL,
    page_number_prefix_end INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Pages table (NEW)
CREATE TABLE public.pages (
    page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_prefix VARCHAR(5) UNIQUE NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_slug VARCHAR(255) NOT NULL,
    sector_id UUID REFERENCES public.sectors(sector_id) ON DELETE SET NULL,
    organization_id VARCHAR(255), -- Stores the organization ID string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Foreign key relationships
ALTER TABLE public.chatbots ADD COLUMN sector_id UUID;
ALTER TABLE public.modal_configurations ADD COLUMN sector_id UUID;
```

### Sector Definitions

The system currently defines the following sectors:

| Sector | ID | Title | Prefix Range | Description |
|--------|----|----|--------------|-------------|
| **Templates - All** | `templates-all` | Templates - All | 00000-99999 | Administrative sector to view all pages across all sectors. |
| Global | `global` | Global | 00000-00199 | Shared/cross-sector pages visible to all organizations. |
| Engineering Procurement Construction Management | `epcm` | Engineering Procurement Construction Management | 00200-09999 | Core construction management and related business functions. |
| Engineering Procurement Construction | `epc` | Engineering Procurement Construction | 10000-19999 | Reserved for future Engineering, Procurement, and Construction-specific pages. |
| Contractor | `contractor` | Contractor | 20000-29999 | Pages relevant to contractor operations. |
| Judicial | `judicial` | Judicial | 30000-39999 | Legal, compliance, and governance-related pages. |

### Page Number Prefix System

Pages are organized using a 5-digit numerical prefix system, aligning with the defined sector ranges. The following table provides a comprehensive overview of sectors, their page ranges, associated organizations, and all currently defined pages with their 5-digit numbers.

| Sector | Page Range | Associated Organizations | Page Title | Page Number | Notes |
|---|---|---|---|---|---|
| **Templates - All** | 00000-99999 | Templates - All | *All pages are visible in this sector* | *All page numbers* | This sector provides an administrative view, displaying all static pages and all dynamically added pages from the `public.pages` table, regardless of their original sector or organization assignment. |
| **Global** | 00000-00199 | Organisations - EPCM, Templates - All | Home | 00100 | Static page. |
| | | | Administration | 00102 | Static page. |
| | | | All Documents | 0200 | Static page. |
| | | | Email Management | 03010 | Static page. |
| | | | Chatbots | 02050 | Static page. |
| | | | Modal Management | 00170 | Static page. |
| | | | Image Theme Settings | 02050 | Static page. |
| | | | Sector Management | information-technology/sector-management | Static page. |
| | | | UI Settings | 00165 | Static page. |
| | | | Password Reset | 00175 | Static page. |
| | | | User Management | 00155 | Static page. |
| | | | User Signup | 00150 | Static page. |
| **Engineering Procurement Construction Management (EPCM)** | 00200-09999 | Organisations - EPCM, Templates - All | Commercial | 00200 | Static page. |
| | | | Construction mgmt | 00300 | Static page. |
| | | | Contracts: Pre-award | 00425 | Static page. |
| | | | Contracts: Post-award | 00435 | Static page. |
| | | | Contracts Documents | 00595 | Static page. |
| | | | Contracts Team Chat | 00597 | Static page. |
| | | | Design: Architectural | 00825 | Static page. |
| | | | Design: Chemical engineering | 00835 | Static page. |
| | | | Design: Civil engineering | 00850 | Static page. |
| | | | Design: Electrical engineering | 00860 | Static page. |
| | | | Design: Mechanical engineering | 00870 | Static page. |
| | | | Developer | 00872 | Static page. |
| | | | Sales | 00875 | Static page. |
| | | | Directors: Board of Directors | 00880 | Static page. |
| | | | Directors: Construction | 00882 | Static page. |
| | | | Directors: Contracts | 00883 | Static page. |
| | | | Directors: Engineering | 00884 | Static page. |
| | | | Directors: Finance | 00884-1 | Static page. |
| | | | Directors: HSE | 00885 | Static page. |
| | | | Directors: Logistics | 00886 | Static page. |
| | | | Directors: Procurement | 00888 | Static page. |
| | | | Directors: Projects | 00890 | Static page. |
| | | | Directors: Project | 00895 | Static page. |
| | | | Document control | 00900 | Static page. |
| | | | Environmental | 01000 | Static page. |
| | | | Ethics | 01100 | Static page. |
| | | | Finance | 01200 | Static page. |
| | | | Governance | 01300 | Static page. |
| | | | Health | 01400 | Static page. |
| | | | Human Resources | 01500 | Static page. |
| | | | Local content | 01600 | Static page. |
| | | | Logistics | 01700 | Static page. |
| | | | Legal | 01750 | Static page. |
| | | | Operations | 01800 | Static page. |
| | | | Other parties | 01850 | Static page. |
| | | | Procurement | 01900 | Static page. |
| | | | Project controls: Quantity Surveying | 02025 | Static page. |
| | | | Project controls: Scheduling | 02035 | Static page. |
| | | | Information Technology | 02050 | Static page. |
| | | | Inspection | 02075 | Static page. |
| | | | Public relations | 02100 | Static page. |
| | | | Quality Assurance | 02200 | Static page. |
| | | | Quality Control | 02250 | Static page. |
| | | | Safety | 02400 | Static page. |
| | | | Security | 02500 | Static page. |
| **Judicial** | 30000-39999 | Templates - All | Landscaping | 03000 | Static page. |
| **Contractor** | 20000-29999 | Templates - All | *Dynamically added pages* | *20000-29999* | This sector will primarily contain pages dynamically added via the "Add Pages to Existing Sector" functionality, with their metadata stored in the `public.pages` table. |
| **Engineering Procurement Construction (EPC)** | 10000-19999 | Templates - All | *Future EPC-specific pages* | *10000-19999* | This sector is reserved for future EPC-specific pages, which can be added dynamically. |

## File Structure

### Core Configuration Files

```
client/src/common/js/
├── config/
│   ├── 00200-sector-config.js          # Sector configuration management
│   └── 00200-organization-config.js    # Organization-sector relationships
├── ui/
│   ├── 00200-ui-display-settings.js    # Settings manager with sector filtering
│   └── 00200-ui-display-mappings.js    # Section mappings with sector properties
```

### Sector Management UI

```
client/src/pages/02050-information-technology/
└── sector-management/
    └── components/
        └── 02050-sector-management-page.js  # Administrative interface

client/src/components/modal/specific-modals/
└── 02050-GenerateSectorCodeModal.js     # Code generation modal
```

### Database Migration Scripts

```
sql/
├── add_sector_management_tables.sql    # Create sectors table and relationships
├── add_sector_column_to_tables.sql     # Add sector columns to existing tables
└── add_pages_table.sql                 # Create the new 'pages' table for dynamic page metadata
```

## Implementation Details

### Sector Configuration (`00200-sector-config.js`)

Manages active sectors and their properties, now fetching data from the backend:

```javascript
class SectorConfig {
  async initialize() {
    // Fetches real sector data from backend API
    const response = await fetch('/api/sectors');
    const data = await response.json();
    this.sectors = data.sectors || [];
    // Sets active sector, e.g., 'Templates - All' or 'Engineering Procurement Construction Management'
    this.activeSector = this.sectors.find(s => s.sector_name === 'Templates - All') || this.sectors[0];
  }

  setActiveSector(sectorName) {
    // Sets the active sector for filtering
  }

  getActiveSector() {
    // Returns the currently active sector
  }
}
```

### Organization Configuration (`00200-organization-config.js`)

Manages active organizations and their properties, fetching data from the backend. Ensures the `activeOrganization` is consistently an array for uniform handling across the application.

```javascript
class OrganizationConfig {
  async initialize(force = false) {
    // Fetches real company/organization data from backend API
    const response = await fetch('/api/companies');
    const apiData = await response.json();
    this.organizations = apiData.data || [];
    // Ensures activeOrganization is always an array, even for single selection
    this.activeOrganization = [this.organizations.find(org => org.organization_name === 'Organisations - All template') || this.organizations[0]].filter(Boolean);
  }

  setActiveOrganization(organizationNames) {
    // Sets the active organization(s) for filtering
    // Ensures this.activeOrganization is always an array
  }

  getActiveOrganization() {
    // Returns the currently active organization(s) as an array
  }
}
```

### UI Display Settings Integration

The settings manager filters accordion sections based on the active sector and organization:

```javascript
getAccordionSections() {
  const activeSector = sectorConfig.getActiveSector();
  const activeOrganization = organizationConfig.getActiveOrganization();

  // Filtering logic now accounts for 'Templates - All' sector/organization
  // 'Templates - All' sector/organization sees all sections.
  // Other sectors/organizations see global sections + their specific sector sections.
}
```

### Section Mappings with Sector and Organization Properties

The `sectionMappings` in `client/src/common/js/ui/00200-ui-display-mappings.js` now include `sector` and `allowedOrganizations` properties for each section, enabling granular control over visibility.

Example of `sectionMappings` structure:

```javascript
export const sectionMappings = {
  "accordion-settings": {
    title: "Settings",
    optionId: 165,
    order: 2900,
    links: [],
    subsections: { /* ... */ },
    sector: "global", // Example: Global section
    allowedOrganizations: ["Organisations - EPCM", "Templates - All"]
  },
  "accordion-information-technology": {
    title: "Information Technology",
    optionId: 1500,
    order: 1500,
    links: [
      '02050-information-technology.html',
      '0200-all-documents.html',
      '03010-email-management.html'
    ],
    sector: "epcm", // Example: EPCM specific section
    allowedOrganizations: ["Organisations - EPCM", "Templates - All"]
  },
  // ... other sections
};
```

### Dynamic Page Loading

The `App.js` implements dynamic sector-specific page loading, now also considering organization. Crucially, the `UIDisplaySettingsManager` now fetches page metadata from the `public.pages` database table and dynamically integrates these pages into the accordion navigation.

```javascript
const getSectorPrefixedPageNumber = (basePageNumber, activeSector) => {
  // Logic to determine page number based on active sector's prefix range
};
```

### Page Data Management (`public.pages` table)

New pages added via the "Add Pages to Existing Sector" modal are now stored in the `public.pages` database table. This table holds essential metadata for each page, including its `page_prefix`, `page_name`, `page_slug`, `sector_id`, and `organization_id`. This allows for dynamic retrieval and filtering of pages in the UI.

**API Endpoints for Pages:**
- `GET /api/pages`: Retrieves all page metadata from the `public.pages` table.
- `POST /api/pages/migrate`: Executes the SQL migration script (`sql/add_pages_table.sql`) to create or update the `public.pages` table.

## User Interface

The Sector Management UI has been redesigned for improved usability and a more minimalistic approach.

#### Sector Management Page (`02050-information-technology/sector-management`)

The administrative interface for managing sectors has been restructured to provide a clearer, more organized user experience.

**Key Features and Layout:**
-   **Header Section**: Contains the page title and prominent action buttons for `Generate New Sector` and `Text-to-Accordion Tool`.
-   **Current Active Configuration Card**: A compact card displaying the currently active sector and organization, with dropdowns to switch between them.
-   **All Sectors Overview (Collapsible)**: A section that is collapsed by default, providing a detailed list of all available sectors. This reduces initial visual clutter while keeping the information accessible.

#### Code Generation Modal (`02050-GenerateSectorCodeModal.js`)

The modal for creating new sectors or adding pages to existing ones has been enhanced with a multi-step wizard approach for a more guided and less overwhelming user experience.

**Key Improvements:**
-   **Multi-step Flow**: Guides the user through the process step-by-step (e.g., Step 1: Sector Selection/Creation, Step 2: Page Configuration, Step 3: Advanced Options).
-   **Progress Bar**: Provides visual feedback on the user's progress through the steps.
-   **Clear Field Grouping**: Fields are logically grouped within each step, reducing cognitive load.
-   **Improved Validation**: Basic client-side validation ensures required fields are filled and ranges are correct before proceeding.

#### Text-to-Accordion Configuration Tool (`02050-TextToAccordionModal.js`)

The text-to-accordion functionality has been moved into its own dedicated modal for better organization and a focused user experience.

**Key Features:**
-   **Dedicated Interface**: Provides a clear space for entering text and generating accordion JSON.
-   **Sector Selection**: Allows users to select a target sector for the generated accordion configuration.
-   **Result Display**: Clearly displays the generated JSON and instructions.

## Testing Strategy

### Unit Tests
- Sector configuration management
- Page prefix calculations
- Accordion filtering logic

### Integration Tests
- API endpoint functionality
- Database relationships
- Frontend-backend communication

### User Acceptance Tests
- Sector switching functionality
- Page navigation accuracy
- Administrative operations

## Migration Guidelines

### Adding a New Sector

1.  **Database Update**
    ```sql
    INSERT INTO public.sectors (sector_name, page_number_prefix_start, page_number_prefix_end)
    VALUES ('Banking', 40000, 49999);
    ```

2.  **Frontend Configuration**
    - Add sector to `00200-sector-config.js`
    - Update `00200-ui-display-mappings.js` sectors definition
    - Assign `sector` and `allowedOrganizations` properties to relevant pages/sections

3.  **Page Creation**
    - Use prefix range 40000-49999 for Banking pages
    - Set sector property to "banking"
    - Update webpack configuration if needed

### Migrating Existing Pages

1.  **Identify Target Sector**
    - Determine appropriate sector based on content
    - Check prefix range availability

2.  **Update Page References**
    - Modify file names if needed
    - Update accordion mappings with `sector` and `allowedOrganizations` properties
    - Adjust webpack configuration

3.  **Test Navigation**
    - Verify accordion filtering
    - Check page accessibility
    - Validate sector switching

## Best Practices

### Sector Design
- Keep sector names descriptive and consistent
- Use non-overlapping prefix ranges
- Plan for future expansion

### Page Organization
- Group related functionality within sectors
- Maintain logical page hierarchies
- Use consistent naming conventions

### Performance Considerations
- Cache sector configurations
- Optimize accordion filtering
- Minimize API calls

## Troubleshooting

### Common Issues

1.  **Pages Not Appearing in Accordion**
    - Check `sector` and `allowedOrganizations` properties in mappings
    - Verify page prefix is within sector range
    - Ensure active sector and organization are set correctly

2.  **Sector Switching Not Working**
    - Verify sector configuration initialization
    - Check settings manager integration
    - Validate accordion re-rendering

3.  **Database Relationship Errors**
    - Ensure foreign key constraints are properly set
    - Check sector_id references
    - Verify table migrations completed

### Debug Tools

1.  **Console Logging**
    - Sector configuration status
    - Active sector information
    - Accordion filtering results

2.  **Browser Developer Tools**
    - Network requests for sector data
    - Component state inspection
    - Performance profiling

### Known Issues

All previously identified issues related to Sector Management have been successfully resolved.

1.  **Persistent Background Image Issue on Home Page (00100) (Resolved)**
    *   **Description**: The background image (`00100.png`) on the Home page (`00100-HomePage.js`) was not displaying, resulting in a white background.
    *   **Resolution**: This issue was resolved by adding crucial positioning and sizing CSS properties (`z-index`, `position`, `top`, `left`, `width`, `height`) to the `.page-background` class in `client/src/common/css/pages/00200-commercial/00200-pages-style.css` and removed a conflicting `z-index` from the `.commercial-page` class.
    *   **Status**: ✅ Resolved (June 2025)

2.  **Accordion Not Updating on Organization Change (Resolved)**
    *   **Description**: When the active organization was changed, the accordion navigation did not update to reflect pages associated with the newly selected organization. The "Active Organization" display also showed "Inactive".
    *   **Resolution**:
        *   Ensured `organizationConfig.activeOrganization` is consistently an array.
        *   Modified `UIDisplaySettingsManager` to fetch pages from the new `public.pages` database table.
        *   Updated `UIDisplaySettingsManager.getAccordionSections()` to dynamically include and filter pages from the `pages` table based on the active sector and organization.
        *   The `SectorManagementPage` now re-initializes both sector and organization configurations and re-applies UI settings after adding pages, ensuring the accordion re-renders with the latest data.
    *   **Status**: ✅ Resolved (June 2025)

## Future Enhancements

### Planned Features
- Multi-tenant sector isolation
- Sector-based permissions
- Dynamic sector creation UI
- Sector import/export functionality

### Technical Improvements
- TypeScript integration
- Enhanced error handling
- Performance optimizations
- Automated testing suite

## Related Documentation

- [Accordion Management](0950_ACCORDION_MANAGEMENT.md)
- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Page Implementations](1300_0000_PAGE_IMPLEMENTATIONS.md)
- [Page List Documentation](1300_0000_PAGE_LIST.md)
- [Modal Management](0975_00_MODAL_MANAGEMENT.md)

## Changelog

### 2025-06-20
- **Dynamic Page Management**: Implemented `public.pages` database table for storing page metadata (prefix, name, slug, sector_id, organization_id).
- **Backend API for Pages**: Added `/api/pages` endpoint to retrieve page data and `POST /api/pages/migrate` for database migration.
- **Frontend Integration**: `UIDisplaySettingsManager` now fetches and dynamically filters pages from the `public.pages` table based on active sector and organization.
- **Organization Consistency**: Ensured `organizationConfig.activeOrganization` is consistently an array.
- **UI Refresh**: `SectorManagementPage` now triggers full configuration re-initialization and UI settings re-application after adding pages, ensuring accordion updates.
- Updated documentation to reflect new dynamic page management and organization filtering.

### 2025-06-18
- Updated implementation status to reflect completion of all phases of Sector Management Refinement Plan.
- Added "Templates - All" sector and organization for administrative viewing of all pages.
- Refined filtering logic to ensure correct sector and organization-based page visibility.
- Updated documentation to reflect current architecture and implementation details.

### 2025-06-09
- Initial documentation created
- Current implementation status assessed
- Outstanding work plan developed
- Migration guidelines established

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

<environment_details>
# VSCode Visible Files
docs/0950_SECTOR_MANAGEMENT.md

# VSCode Open Tabs
client/package.json
build_and_serve.sh
server/app.js
client/src/components/modal/specific-modals/02050-GenerateSectorCodeModal.js
client/src/components/modal/specific-modals/02050-TextToAccordionModal.js
client/src/components/modal/specific-modals/02050-AddOrganizationToSectorModal.js
client/src/components/modal/specific-modals/02050-DuplicatePagesModal.js
client/src/common/js/ui/00200-ui-display-settings.js
client/src/components/modal/specific-modals/02050-MultiSectorSelectModal.js
client/src/components/modal/specific-modals/02050-DeletePageModal.js
client/public/assets/default/IMG_4778.png
client/src/common/js/config/00200-organization-config.js
client/.babelrc
sql/setup_companies.sql
server/src/routes/delete-page.js
client/src/components/modal/specific-modals/02050-AddPagesToSectorModal.js
client/src/pages/02050-information-technology/sector-management/components/02050-sector-management-page.js
client/src/App.js
scripts/setup-companies-table.js
list-sectors.js
test-organization-creation.js
scripts/fix-companies-table.js
package.json
server/src/routes/sector-management-routes.js
client/src/common/js/config/00200-sector-config.js
docs/0950_DROPDOWN_MANAGEMENT.md
docs/0950_ACCORDION_MANAGEMENT.md
docs/0950_SECTOR_MANAGEMENT_PLAN.md
docs/1300_02050_INFORMATION_TECHNOLOGY_PAGE.md
client/src/common/js/ui/00200-ui-display-mappings.js
docs/0000_DOCUMENTATION_GUIDE.md
docs/0950_SECTOR_MANAGEMENT.md

# Current Time
20/06/2025, 5:51:05 am (Africa/Johannesburg, UTC+2:00)

# Context Window Usage
737,664 / 1,048.576K tokens used (70%)

# Current Mode
ACT MODE
</environment_details>
