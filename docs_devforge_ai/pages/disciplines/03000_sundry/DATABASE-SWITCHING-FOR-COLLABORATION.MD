# Database Switching for Collaboration Across Accordions/Pages

## Overview

The database switching mechanism enables collaboration across different accordions and pages by allowing users to switch between different organizational contexts. This feature works through a template-based approach where different organizations are assigned specific UI templates rather than dynamically fetching different database environments.

## Current Implementation Status

### ✅ Completed Components

1. **Template-Based Organization Management**
   - Master template system with variations for different organization types
   - Organization-to-template mappings for automatic template selection
   - Client-side configuration management for active organizations

2. **API Endpoint for Template Selection**
   - `/api/accordion-sections` endpoint that determines templates based on organization context
   - Automatic template inheritance and selection based on organization properties

3. **Client-Side Configuration Management**
   - Sector configuration management (`00200-sector-config.js`)
   - Organization configuration management (`00200-organization-config.js`)
   - Automatic context passing through HTTP headers

## Architecture

### Template-Based Approach

The system uses a template-based approach rather than dynamically switching database environments. Different organizations are assigned specific templates that define their UI structure and available features.

#### Master Template Structure

The master template (`MASTER_TEMPLATE` in `accordion-sections-routes.js`) defines the complete UI structure for EPCM organizations, including:
- Home section with standard links
- Construction management sections
- Design discipline sections (Architectural, Chemical Engineering, Civil Engineering, etc.)
- Developer sections (Sales, Sundry)
- Directors sections (Board of Directors, Construction, Contracts, Engineering, etc.)
- Document Control section
- Environmental, Ethics, Finance, Governance, Health, Human Resources sections
- Local Content, Logistics, Operations, Other Parties, Procurement sections
- Project Controls sections (Quantity Surveying, Scheduling)
- Information Technology sections
- Inspection, Public Relations, Quality Assurance, Quality Control sections
- Safety and Security sections
- Landscaping section

#### Template Variations

Different organization types use variations of the master template:
- **Minimal Template**: Basic structure with Home and Document Control sections
- **Contractor Template**: Focused on Construction, Document Control, Logistics, Procurement, and Safety sections
- **Judicial Template**: Emphasis on Ethics, Governance, and Document Control sections

### Organization Template Mappings

Organizations are mapped to specific templates:
- **Organizations - EPCM**: Uses the master template
- **Organizations - Shared**: Uses the minimal template
- **Organizations - Contractors**: Uses the contractor template
- **Organizations - Judicial**: Uses the judicial template

### API Endpoint Implementation

The `/api/accordion-sections` endpoint in `server/src/routes/accordion-sections-routes.js` handles template selection:

```javascript
router.get('/', async (req, res) => {
  // Get organization info from query params or headers
  const orgId = organization_id || req.headers['x-organization-id'];
  const orgName = organization_name || req.headers['x-organization-name'];
  
  // Get appropriate template for organization
  const templateName = getOrganizationTemplate(orgId, orgName);
  
  // Get sections for template
  const templateSections = getTemplateSections(templateName);
  
  // Return template-based sections
  res.json({
    success: true,
    sections: templateSections,
    template_used: templateName,
    organization: {
      id: orgId,
      name: orgName
    }
  });
});
```

### Client-Side Implementation

#### Organization Configuration Management

The client-side organization configuration (`client/src/common/js/config/00200-organization-config.js`) manages active organizations:

```javascript
class OrganizationConfig {
  async initialize() {
    // Fetch organizations from backend API
    const response = await fetch("/api/organizations");
    const apiData = await response.json();
    const organizationsData = apiData.data || [];
    
    // Set active organization with fallback to EPCM + Shared
    const epcmOrg = this.organizations.find(
      (org) => org.organization_name === "Organizations - EPCM"
    );
    const sharedOrg = this.organizations.find(
      (org) => org.organization_name === "Organizations - Shared"
    );
    
    if (epcmOrg && sharedOrg) {
      this.activeOrganization = [epcmOrg, sharedOrg];
    } else if (epcmOrg) {
      this.activeOrganization = [epcmOrg];
    }
  }
  
  getActiveOrganization() {
    return this.activeOrganization;
  }
}
```

#### Sector Configuration Management

The sector configuration (`client/src/common/js/config/00200-sector-config.js`) manages active sectors:

```javascript
class SectorConfig {
  async initialize() {
    // Fetch sectors from backend API
    const response = await fetch('/api/sectors');
    const data = await response.json();
    this.sectors = data.sectors || [];
    
    // Set active sector with fallback
    const lastActiveSectorNames = this.getLastActiveSectorFromStorage();
    if (lastActiveSectorNames && lastActiveSectorNames.length > 0) {
      const savedSectors = this.sectors.filter(s => lastActiveSectorNames.includes(s.sector_name));
      this.activeSector = savedSectors.length > 0 ? savedSectors : this.sectors;
    } else {
      this.activeSector = this.sectors;
    }
  }
  
  getActiveSector() {
    return this.activeSector;
  }
}
```

#### Accordion Component Integration

The accordion component (`client/src/modules/accordion/00200-accordion-component.js`) integrates with organization and sector configurations:

```javascript
const AccordionComponentInner = () => {
  // Load accordion data with organization and sector context
  const loadAccordionData = useCallback(async () => {
    // Ensure configurations are initialized
    if (!sectorConfig.isApiInitialized) {
      await sectorConfig.initialize();
    }
    if (!organizationConfig.isInitialized) {
      await organizationConfig.initialize();
    }

    // Get current sector and organization for filtering
    const currentSector = sectorConfig.getActiveSector();
    const currentOrg = organizationConfig.getActiveOrganization();
    
    const sectorName = currentSector?.[0]?.sector_name;
    const organizationId = currentOrg?.[0]?.organization_id;
    const organizationName = currentOrg?.[0]?.organization_name;

    // Use relative URL for API calls
    const apiUrl = new URL('/api/accordion-sections', window.location.origin);
    if (sectorName) apiUrl.searchParams.append('sector', sectorName);
    if (organizationId) apiUrl.searchParams.append('organization_id', organizationId);
    if (organizationName) apiUrl.searchParams.append('organization_name', organizationName);
    
    // Add organization context to headers
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-organization-id': organizationId || '',
        'x-organization-name': organizationName || ''
      }
    });
  }, [activeSector, activeOrganization]);
};
```

## How Database Switching Works

### Automatic Template Selection

1. **Context Detection**: The system automatically detects the active organization and sector context
2. **Template Mapping**: Organization ID/name is mapped to appropriate template type
3. **Template Inheritance**: Templates can inherit from base templates (e.g., contractor templates inherit from minimal templates)
4. **Section Generation**: Template sections are generated and returned to the client

### Context Passing

Organization context is passed through HTTP headers:
- `x-organization-id`: Organization ID
- `x-organization-name`: Organization name

The server uses these headers to determine which template to serve.

### Collaboration Mechanism

Collaboration across accordions/pages works by:
1. **Switching Organizations**: Users can switch between different organizations
2. **Template Switching**: Different organizations use different UI templates
3. **Context Preservation**: Organization context is preserved across navigation
4. **Real-time Updates**: UI updates automatically when organization context changes

## Best Practices

### Template Design
- Keep templates consistent with business unit requirements
- Maintain clear relationships between organizations and templates
- Use template inheritance for common functionality

### Access Control
- Assign organizations to users appropriately
- Use template-based filtering for content visibility
- Combine with sector filtering for granular control

## Troubleshooting

### Common Issues

1. **Templates Not Updating**
   - Check organization configuration initialization
   - Verify settings manager integration
   - Validate accordion re-rendering

2. **Organization Switching Not Working**
   - Check organization config initialization
   - Verify settings manager integration
   - Validate accordion re-rendering

### Debug Tools

1. **Console Logging**
   - Organization configuration status
   - Active organization information
   - Template selection results

2. **Browser Developer Tools**
   - Network requests for organization data
   - Component state inspection
   - Performance profiling

## Future Enhancements

### Planned Features
- Dynamic template generation from database configurations
- Real-time template updates based on organizational changes
- Advanced template customization options

### Technical Improvements
- Enhanced error handling for template selection
- Performance optimizations for template loading
- Automated testing suite for template variations

## Related Documentation

- [Organization Management](0950_ORGANIZATION_MANAGEMENT.md)
- [Sector Management](0915_SECTOR_MANAGEMENT.md)
- [Accordion Management](0950_ACCORDION_MANAGEMENT.md)
