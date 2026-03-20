# Organization Collaboration System

## Overview

The Organization Collaboration System enables different organizations to work together within the accordion navigation structure while maintaining ownership of their agents and sections. This system allows specialists (architects, engineers, etc.) to bring their agents to EPCM organization accordion hierarchies while retaining ownership and keeping their administrative functions separate.

## Key Features

### 1. Cross-Organizational Accordion Sharing
- Organizations can collaborate by sharing specific accordion sections
- Specialists maintain ownership of their agents and cannot compromise them through sharing
- Each organization keeps their Admin pages, finance sections, and other private areas separate

### 2. Page Precedence Control
- When both organizations have pages with the same numbering, administrators can specify which organization's pages take precedence
- Options: "Host Pages Take Precedence" or "Collaborator Pages Take Precedence"
- This ensures consistent user experience when page conflicts occur

### 3. Agent Isolation and Sharing
- Specialists retain full ownership of their agents
- Selective agent sharing permissions can be granted for specific collaborations
- Agents can be used seamlessly in collaborative contexts while maintaining security

### 4. Template-Based Collaboration
- Organizations use different templates (EPCM, Contractor, Judicial, Minimal)
- Collaborations can specify which sections from each template are shared
- Dynamic accordion generation based on collaboration relationships

## System Architecture

### Database Schema

#### organization_collaborations Table
```sql
CREATE TABLE organization_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    collaborating_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shared_sections TEXT[] DEFAULT '{}',
    agent_sharing_permissions TEXT[] DEFAULT '{}',
    page_precedence TEXT DEFAULT 'host', -- 'host' or 'collaborator'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_different_organizations CHECK (primary_organization_id != collaborating_organization_id),
    UNIQUE(primary_organization_id, collaborating_organization_id)
);
```

### API Endpoints

#### Collaboration Management
- `GET /api/accordion-sections/collaborations` - List collaborations for current organization
- `GET /api/accordion-sections/collaborations/:id` - Get specific collaboration details
- `POST /api/accordion-sections/collaborations` - Create new collaboration
- `PUT /api/accordion-sections/collaborations/:id` - Update collaboration
- `DELETE /api/accordion-sections/collaborations/:id` - Delete collaboration

#### Page Precedence Logic
The page precedence logic is implemented in the accordion sections route:

```javascript
// Apply page precedence logic
const pagePrecedence = collaboration.page_precedence || 'host';
const shouldCollaboratorTakePrecedence = pagePrecedence === 'collaborator';
const isCollaboratingOrg = !isPrimaryOrg;

if (shouldCollaboratorTakePrecedence && isCollaboratingOrg) {
  // Collaborator pages take precedence - replace host sections with collaborator sections
  filteredCollaboratingSections.forEach(collabSection => {
    const existingIndex = finalSections.findIndex(hostSection => hostSection.id === collabSection.id);
    if (existingIndex >= 0) {
      // Replace host section with collaborator section
      finalSections[existingIndex] = collabSection;
    } else {
      // Add new section from collaborator
      finalSections.push(collabSection);
    }
  });
} else {
  // Host pages take precedence or collaborator is primary org - merge normally
  finalSections = [...finalSections, ...filteredCollaboratingSections];
}
```

## Implementation Details

### Frontend Components

#### Collaboration Management UI
Located in `client/src/pages/02050-information-technology/components/02050-collaboration-management.js`

Key features:
- Create/Edit/Delete collaborations
- Section sharing selection
- Agent sharing permissions
- Page precedence configuration dropdown
- Real-time collaboration list

#### Accordion Template Management
Located in `client/src/pages/02050-information-technology/components/02050-accordion-template-management.js`

Key features:
- Organization-to-template assignments
- Template preview functionality
- Available template definitions

### Backend Routes

#### Collaboration Routes
Located in `server/src/routes/accordion-collaboration-routes.js`

Handles all collaboration CRUD operations with proper validation and error handling.

#### Accordion Sections Routes
Located in `server/src/routes/accordion-sections-routes.js`

Implements the template-based accordion generation with collaboration integration and page precedence logic.

## Usage Examples

### Creating a Collaboration
1. Navigate to IT Section → Developer Settings → Collaboration Management
2. Click "Create New Collaboration"
3. Select primary and collaborating organizations
4. Choose shared sections (e.g., Construction, Design)
5. Set agent sharing permissions
6. Configure page precedence (Host or Collaborator takes precedence)
7. Save the collaboration

### Page Precedence Scenarios

#### Scenario 1: Host Pages Take Precedence (Default)
- Both organizations have a "Construction" section (00300)
- Primary organization's Construction pages are displayed
- Collaborating organization's Construction pages are ignored

#### Scenario 2: Collaborator Pages Take Precedence
- Both organizations have a "Design" section (00800)
- Collaborating organization's Design pages are displayed
- Primary organization's Design pages are overridden

## Security Considerations

### Agent Ownership
- Agents remain owned by their original organization
- Sharing permissions are explicitly granted per collaboration
- No automatic access to private administrative functions

### Data Isolation
- Each organization maintains separate Supabase projects
- Database context switching ensures proper data isolation
- Collaboration only shares specified sections and agents

### Access Control
- Only authorized administrators can create collaborations
- Template assignments are managed through IT section
- Real-time validation prevents unauthorized access

## Best Practices

### Collaboration Setup
1. Clearly define which sections should be shared
2. Set appropriate agent sharing permissions
3. Configure page precedence based on business requirements
4. Test the collaboration thoroughly before going live

### Template Management
1. Use appropriate templates for each organization type
2. Maintain consistent section numbering across templates when possible
3. Document template variations and their purposes

### Page Precedence Configuration
1. Set page precedence based on which organization should "own" the user experience
2. Consider the primary workflow when deciding precedence
3. Test both precedence options to ensure desired behavior

## Troubleshooting

### Common Issues

#### Collaboration Not Appearing
- Verify collaboration is active
- Check shared sections are correctly configured
- Ensure both organizations are active

#### Page Precedence Not Working
- Verify page_precedence field is set correctly in database
- Check that sections have the same IDs in both organizations
- Review collaboration route implementation

#### Agent Sharing Issues
- Verify agent sharing permissions are granted
- Check that agents exist in the collaborating organization
- Ensure proper database context switching is configured

## Future Enhancements

### Planned Features
1. **Advanced Collaboration Rules** - More granular control over section and page sharing
2. **Collaboration Analytics** - Usage statistics and performance metrics
3. **Automated Conflict Resolution** - Intelligent handling of page conflicts
4. **Collaboration Templates** - Pre-defined collaboration configurations

### Integration Opportunities
1. **Project-Based Collaborations** - Tie collaborations to specific projects
2. **Role-Based Access** - Fine-grained permissions within collaborations
3. **Audit Logging** - Track all collaboration activities and changes
4. **Notification System** - Alert users of collaboration changes

## API Reference

### Collaboration Object
```json
{
  "id": "uuid",
  "primary_organization_id": "uuid",
  "collaborating_organization_id": "uuid",
  "shared_sections": ["00300", "00800"],
  "agent_sharing_permissions": ["construction-agent"],
  "page_precedence": "host",
  "is_active": true,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Template Definitions
- **Master (EPCM)**: Complete accordion with all sections
- **Contractor**: Construction-focused template
- **Judicial**: Governance and ethics-focused template
- **Minimal**: Basic sections only (Home, Document Control)

## Conclusion

The Organization Collaboration System provides a robust framework for enabling cross-organizational cooperation while maintaining security and ownership boundaries. The page precedence feature adds flexibility in handling page conflicts, ensuring that the user experience can be optimized for each collaboration scenario.
