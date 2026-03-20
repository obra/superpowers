# Multi-Organization Accordion System - Complete Implementation

## Overview

Successfully implemented a **comprehensive multi-organization accordion system** that allows pages to be shared across multiple organizations with full customization capabilities. This system supports organization-specific branding, selective page visibility, project/phase filtering, and dynamic content management.

## Architecture Evolution

### 🔄 **From Single-Org to Multi-Org**

**Before**: Pages were tied to a single organization through `organization_id` foreign key
**After**: Many-to-many relationships allowing pages to be shared across organizations with customizations

### 🏗️ **New Database Schema**

#### **Core Tables**

1. **`sections`** - Define accordion sections (Home, Administration, etc.)
2. **`section_organization_mapping`** - Which sections appear for which organizations
3. **`page_organization_mapping`** - Many-to-many pages ↔ organizations with customizations
4. **`section_page_organization_mapping`** - Complete flexibility for page placement in sections
5. **`projects`** - Project definitions for filtering
6. **`phases`** - Project phases for granular control
7. **`user_context`** - Store user's current selection context

#### **Key Features**

- **Many-to-Many Relationships**: Pages can belong to multiple organizations
- **Organization-Specific Customization**: Custom page names, descriptions, visibility
- **Project/Phase Filtering**: Granular control over page availability
- **Hierarchical Structure**: Sections → Pages → Subsections
- **Dynamic Views**: Pre-built queries for easy data access

## Implementation Benefits

### ✅ **Multi-Tenant Flexibility**
- **Shared Pages**: Common pages (Home, Settings) available to all organizations
- **Selective Pages**: Specialized pages only for relevant organizations
- **Custom Branding**: Organization-specific page names and descriptions
- **Visibility Control**: Hide/show pages per organization

### ✅ **Project-Based Filtering**
- **Project-Specific Pages**: Pages that only appear for certain projects
- **Phase-Based Access**: Different pages for different project phases
- **Dynamic Context**: User's current project/phase determines visible content

### ✅ **Scalable Architecture**
- **Easy Organization Addition**: New organizations inherit appropriate pages
- **No Code Changes**: All configuration through database
- **Performance Optimized**: Indexed queries and materialized views

## Database Schema Details

### **Page Organization Mapping**
```sql
page_organization_mapping (
    page_id UUID → pages(id),
    organization_id UUID → organizations(id),
    project_id UUID → projects(id),        -- Optional filtering
    phase_id UUID → phases(id),            -- Optional filtering
    is_visible BOOLEAN,                     -- Show/hide per org
    display_order INTEGER,                  -- Custom ordering
    custom_page_name VARCHAR(255),          -- Org-specific name
    custom_description TEXT                 -- Org-specific description
)
```

### **Section Page Organization Mapping**
```sql
section_page_organization_mapping (
    section_id UUID → sections(id),
    page_id UUID → pages(id),
    organization_id UUID → organizations(id),
    project_id UUID → projects(id),        -- Optional filtering
    phase_id UUID → phases(id),            -- Optional filtering
    display_order INTEGER,                  -- Position in section
    is_subsection BOOLEAN,                  -- Main item vs sub-item
    parent_page_id UUID → pages(id),       -- Hierarchical structure
    custom_page_name VARCHAR(255),          -- Section-specific override
    is_visible BOOLEAN                      -- Section-specific visibility
)
```

## Usage Scenarios

### **Scenario 1: Universal Pages**
```sql
-- Home page available to all organizations
INSERT INTO page_organization_mapping (page_id, organization_id, is_visible, display_order)
VALUES 
    (home_page_id, epcm_org_id, true, 1),
    (home_page_id, mining_org_id, true, 1),
    (home_page_id, construction_org_id, true, 1);
```

### **Scenario 2: Organization-Specific Customization**
```sql
-- Administration page with custom names per organization
INSERT INTO page_organization_mapping (page_id, organization_id, custom_page_name, custom_description)
VALUES 
    (admin_page_id, epcm_org_id, 'EPCM Administration', 'EPCM-specific admin functions'),
    (admin_page_id, mining_org_id, 'Mining Operations Admin', 'Mining admin functions'),
    (admin_page_id, construction_org_id, 'Construction Admin', 'Construction admin functions');
```

### **Scenario 3: Selective Availability**
```sql
-- Construction page only for relevant organizations
INSERT INTO page_organization_mapping (page_id, organization_id, is_visible)
VALUES 
    (construction_page_id, epcm_org_id, true),
    (construction_page_id, construction_org_id, true);
    -- Note: Not available to mining organization
```

### **Scenario 4: Project-Specific Pages**
```sql
-- Contract pages for specific projects
INSERT INTO page_organization_mapping (page_id, organization_id, project_id, custom_page_name)
VALUES 
    (contracts_page_id, epcm_org_id, siop_project_id, 'SIOP Contracts'),
    (contracts_page_id, epcm_org_id, infra_project_id, 'Infrastructure Contracts');
```

## API Integration

### **Updated Endpoint**: `/api/organizations/:id/sections`

**Query Parameters**:
- `project` - Filter by project ID
- `phase` - Filter by phase ID

**Response Structure**:
```json
{
  "success": true,
  "organization_id": "uuid",
  "project_id": "uuid",
  "phase_id": "uuid",
  "sections": [
    {
      "id": "accordion-home",
      "title": "Home",
      "description": "Main dashboard",
      "icon": "🏠",
      "links": ["00100-home.html"],
      "subsections": [
        {
          "id": "accordion-dashboard",
          "title": "Dashboard",
          "links": ["00100-dashboard.html"],
          "order": 1
        }
      ],
      "order": 1
    }
  ]
}
```

## Client-Side Integration

### **Dynamic Loading**
```javascript
// Fetch sections for current organization/project/phase
const sections = await uiDisplaySettingsManager.getAccordionSections();

// Set project filter
uiDisplaySettingsManager.setProject('project-uuid');

// Set phase filter  
uiDisplaySettingsManager.setPhase('phase-uuid');

// Refresh when context changes
await uiDisplaySettingsManager.refreshSections();
```

### **Event-Driven Updates**
```javascript
// Listen for organization changes
window.addEventListener('organizationChanged', async (event) => {
  await uiDisplaySettingsManager.refreshSections();
});

// Listen for section changes
window.addEventListener('sectionsChanged', (event) => {
  const { sections } = event.detail;
  // Update UI with new sections
});
```

## Migration Strategy

### **Phase 1: Schema Creation**
1. Run `create-accordion-sections-schema.sql`
2. Run `update-schema-for-multi-org-pages.sql`

### **Phase 2: Data Migration**
1. Existing page-organization relationships automatically migrated
2. Run `populate-multi-org-page-examples.sql` for examples

### **Phase 3: API Updates**
1. Server routes updated to use new schema
2. Client-side code updated for dynamic loading

## Management Interface

### **Page Availability View**
```sql
-- See which pages are available to which organizations
SELECT * FROM page_organization_availability 
WHERE total_organizations > 1;
```

### **Organization Structure View**
```sql
-- See complete accordion structure for an organization
SELECT * FROM accordion_structure 
WHERE organization_id = 'epcm-uuid'
ORDER BY section_display_order, page_display_order;
```

### **Customization Report**
```sql
-- See all organization-specific customizations
SELECT 
    organization_name,
    page_name,
    custom_page_name,
    custom_description,
    visibility
FROM page_organization_availability
WHERE custom_page_name IS NOT NULL;
```

## Performance Considerations

### **Optimized Queries**
- Indexed foreign keys for fast lookups
- Materialized views for complex joins
- Efficient filtering on organization/project/phase

### **Caching Strategy**
- Client-side caching of section data
- Cache invalidation on organization change
- Background refresh for updated content

## Security & Access Control

### **Row-Level Security**
- Users only see pages for their assigned organizations
- Project/phase access controlled by user permissions
- Audit trail for all configuration changes

### **Data Isolation**
- Organization data properly isolated
- No cross-organization data leakage
- Secure API endpoints with proper validation

## Future Enhancements

### **Planned Features**
1. **Visual Page Builder**: Drag-and-drop interface for page organization
2. **Template System**: Pre-built page templates for common scenarios
3. **Analytics Integration**: Track page usage across organizations
4. **A/B Testing**: Test different page configurations
5. **Workflow Management**: Approval process for page changes
6. **Organization Collaboration**: Cross-organization collaboration system (see [ORGANIZATION_COLLABORATION_SYSTEM.md](./0975_ORGANIZATION_COLLABORATION_SYSTEM.md))

### **Advanced Customization**
1. **CSS Theming**: Organization-specific styling
2. **Component Overrides**: Custom components per organization
3. **Localization**: Multi-language support per organization
4. **Dynamic Content**: Real-time content updates

## Files Created/Modified

### **Database Scripts**
1. `create-accordion-sections-schema.sql` - Core schema
2. `update-schema-for-multi-org-pages.sql` - Multi-org support
3. `populate-multi-org-page-examples.sql` - Example data
4. `populate-epcm-accordion-data.sql` - EPCM-specific data

### **Server Code**
1. `server/src/routes/organizations.js` - Updated API endpoints
2. New views and helper functions for data processing

### **Client Code**
1. `client/src/common/js/config/00200-ui-display-settings.js` - Dynamic loading
2. Event-driven updates and caching

### **Documentation**
1. `DYNAMIC_ACCORDION_IMPLEMENTATION_SUMMARY.md` - Initial implementation
2. `MULTI_ORGANIZATION_ACCORDION_SYSTEM_COMPLETE.md` - Complete system (this file)

## Testing & Verification

### **Database Testing**
```bash
# Run schema creation
psql -f create-accordion-sections-schema.sql

# Run multi-org updates  
psql -f update-schema-for-multi-org-pages.sql

# Populate example data
psql -f populate-multi-org-page-examples.sql
```

### **API Testing**
```bash
# Test EPCM sections
curl "http://localhost:3003/api/organizations/epcm-uuid/sections"

# Test with project filtering
curl "http://localhost:3003/api/organizations/epcm-uuid/sections?project=siop-uuid"

# Test with phase filtering
curl "http://localhost:3003/api/organizations/epcm-uuid/sections?project=siop-uuid&phase=construction-uuid"
```

### **Client Testing**
1. Start development server: `npm run dev`
2. Navigate to different organization ports
3. Verify dynamic section loading
4. Test project/phase filtering
5. Confirm customizations appear correctly

## Conclusion

The multi-organization accordion system provides a robust, scalable solution for managing dynamic content across multiple organizations. With support for customization, filtering, and real-time updates, it addresses all the requirements for a modern multi-tenant application while maintaining performance and security.

The system is now ready for production use and can easily accommodate new organizations, projects, and pages without requiring code changes.
