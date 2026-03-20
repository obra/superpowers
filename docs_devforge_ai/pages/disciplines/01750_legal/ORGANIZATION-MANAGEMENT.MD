# Organization Management System

## Overview

The Organization Management System provides a way to group pages and content by different organizations (e.g., EPCM, Judicial, Contractors). This system works in conjunction with the Sector Management System to enable fine-grained access control and content organization.

## Current Implementation Status

### ✅ Completed Components

1. **Database Schema**
   - `organizations` table with organization definitions
   - `pages` table with `organization_id` field
   - Foreign key relationships in relevant tables

2. **Frontend Configuration**
   - Organization configuration management (`00200-organization-config.js`)
   - UI display mappings with `allowedOrganizations` properties
   - Settings manager integration for organization filtering

3. **User Interface**
   - Organization selector in main layout
   - Organization management page for administrative functions

4. **Core Architecture**
   - Dynamic page loading based on active organization
   - Accordion filtering by organization permissions
   - Real-time re-rendering on organization changes

## Architecture

### Database Schema

```sql
-- Organizations table
CREATE TABLE public.organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    sector_id UUID REFERENCES public.sectors(sector_id),
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### Organization Definitions

The system currently defines the following organizations:

| Organization | ID | Sector | Description |
|--------------|----|--------|-------------|
| Organisations - Shared | `02477804-5d5b-416f-9068-33db504807b9` | Shared | Default organization for shared content |
| Organisations - EPCM | `d823e44c-844b-4a2e-9b10-9356d497dc2b` | EPCM | Engineering Procurement Construction Management |
| Organisations - Judicial | `02477804-5d5b-416f-9068-33db504807b8` | Judicial | Legal and compliance organization |
| Organisations - Contractors | `8965e2e0-47b3-47c4-b6a4-1157508430e1` | Contractor | Contractor operations organization |
| Organisations - All templates | `53E0021B-C89C-4DD7-B5A6-8A5B93972CFD` | Shared | Administrative organization to view all content |

## File Structure

### Core Configuration Files

```
client/src/common/js/
├── config/
│   └── 00200-organization-config.js    # Organization configuration management
```

### Organization Management UI

```
client/src/pages/02050-information-technology/
└── organization-management/
    └── components/
        └── 02050-organization-management-page.js  # Administrative interface
```

## Implementation Details

### Organization Configuration (`00200-organization-config.js`)

Manages active organizations and their properties:

```javascript
class OrganizationConfig {
  async initialize() {
    // Fetches organization data from backend API
    const response = await fetch('/api/organisations');
    const data = await response.json();
    this.organizations = data.organizations || [];
    this.activeOrganization = [this.organizations[0]]; // Default to first organization
  }

  setActiveOrganization(organizationName) {
    // Sets the active organization for filtering
  }

  getActiveOrganization() {
    // Returns the currently active organization
  }
}
```

## Best Practices

### Organization Design
- Keep organization names consistent with business units
- Maintain clear relationships with sectors
- Use template organizations for administrative views

### Access Control
- Assign organizations to users appropriately
- Use organization filtering for content visibility
- Combine with sector filtering for granular control

## Troubleshooting

### Common Issues

1. **Pages Not Visible for Organization**
   - Check `allowedOrganizations` in UI mappings
   - Verify organization assignments in database
   - Confirm active organization is set correctly

2. **Organization Switching Not Working**
   - Check organization config initialization
   - Verify settings manager integration
   - Validate accordion re-rendering

## Related Documentation

- [Sector Management](0915_SECTOR_MANAGEMENT.md)
- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Access Control](0400_SECURITY_MODEL.md)
