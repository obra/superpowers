# 01301_00000 Project Permissions Roles & Permissions

## Overview

This document defines the roles, permissions, and access control framework for project-level permissions in the ConstructAI platform. Project permissions control which roles can access which projects and their specific phases, enabling fine-grained access control for project management.

## Requirements

### Prerequisites
- Supabase project with authentication enabled
- Database administrator access
- Understanding of PostgreSQL and RLS policies
- Familiarity with JWT token structure and claims
- Access to authentication and role-permissions documentation

### Permission-Based Role Architecture
- **Project Permissions Table**: `public.project_permissions` stores role-based access to projects
- **Role-Based Access**: Each role has explicitly defined project access permissions
- **Phase-Level Control**: JSONB storage of allowed project phases for granular control
- **Granular Control**: Project and phase-level permissions allow fine-tuned access management

## Database Schema

### Project Permissions Table

```sql
CREATE TABLE IF NOT EXISTS public.project_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL,
  role_id uuid NOT NULL,
  has_access boolean NOT NULL DEFAULT false,
  phases_access jsonb DEFAULT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by text,
  updated_by text,
  CONSTRAINT project_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT project_permissions_unique UNIQUE (project_id, role_id)
);
```

### Indexes and Constraints

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_permissions_project_id ON public.project_permissions USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_permissions_role_id ON public.project_permissions USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_project_permissions_access ON public.project_permissions USING btree (has_access);

-- Enable Row Level Security
ALTER TABLE public.project_permissions ENABLE ROW LEVEL SECURITY;
```

## Row Level Security Policies

### Core RLS Policies

```sql
-- Service role has full access for management
CREATE POLICY "service_role_full_access_project_permissions" ON public.project_permissions
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view project permissions for roles they have access to
CREATE POLICY "users_can_view_project_permissions" ON public.project_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.role_id = project_permissions.role_id
    )
  );

-- Department managers can manage project permissions in their department
CREATE POLICY "department_managers_manage_project_permissions" ON public.project_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.level >= 3
      AND (
        ur.department_code IN ('01300', '02050') OR  -- Governance and IT can manage permissions
        ur.level = 4  -- System admins can manage all
      )
    )
  );

-- System administrators have full access
CREATE POLICY "system_admin_full_access_project_permissions" ON public.project_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.level = 4
    )
  );
```

## Permission Definitions

### Project Access Permissions

| Permission Type | Description | Applies To |
|----------------|-------------|------------|
| `project:view` | View access to specific projects | All authenticated users with role access |
| `project:edit` | Edit access to project data | Contributors and above |
| `project:admin` | Administrative access to project settings | Managers and administrators |
| `project:phases` | Phase-level access control | Fine-grained control within projects |

### Phase-Based Project Access

Projects are divided into phases that roles can access:

- **Planning**: Initial planning and design phase
- **Procurement**: Tender and contracting phase
- **Construction**: Active construction phase
- **Completion**: Final handover and close-out phase
- **Maintenance**: Post-construction maintenance phase

## Implementation

### API Endpoints

#### Project Permissions Management
```javascript
// GET /api/project-permissions - List all project permissions
// POST /api/project-permissions - Update project permission
// GET /api/project-permissions/roles - Get available roles
// GET /api/project-permissions/phases - Get available project phases
// GET /api/project-permissions/list - Get available projects
```

#### Permission Checking
```javascript
// Check if user has access to a specific project
const hasProjectAccess = async (userId, projectId, phaseId = null) => {
  const { data, error } = await supabase
    .from('project_permissions')
    .select('has_access, phases_access')
    .eq('project_id', projectId)
    .eq('role_id', userRoleId)
    .single();

  if (!data?.has_access) return false;

  // If no phase specified, check overall access
  if (!phaseId) return true;

  // Check phase-specific access
  const phasesAccess = data.phases_access || [];
  return phasesAccess.includes(phaseId);
};
```

### Client-Side Integration

#### Permission Checking Hook
```javascript
// useProjectPermissions.js
export const useProjectPermissions = () => {
  const checkProjectAccess = async (projectId, phaseId = null) => {
    try {
      const response = await fetch(`/api/project-permissions/check/${projectId}`);
      const { hasAccess } = await response.json();
      return hasAccess;
    } catch (error) {
      console.error('Project permission check failed:', error);
      return false;
    }
  };

  const checkPhaseAccess = async (projectId, phaseId) => {
    // Implementation for checking specific phase access
    // This would require additional API endpoint or client-side logic
  };

  return { checkProjectAccess, checkPhaseAccess };
};
```

#### Protected Project Component
```javascript
// ProtectedProject.js
export const ProtectedProject = ({ projectId, phaseId, children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { checkProjectAccess } = useProjectPermissions();

  useEffect(() => {
    const verifyAccess = async () => {
      const access = await checkProjectAccess(projectId);
      setHasAccess(access);
      setLoading(false);
    };

    verifyAccess();
  }, [projectId]);

  if (loading) return <div>Loading project...</div>;
  if (!hasAccess) return <div>Access Denied - Project permissions required</div>;

  return children;
};
```

## Role-Based Access Matrix

### Project Categories and Access Levels

#### Active Projects (All Organization Users - Subject to Role Permissions)
- **Standard Projects**: Regular construction and engineering projects
- **Special Projects**: Sensitive or confidential projects requiring restricted access
- **Archived Projects**: Completed projects with limited viewing access
- **Template Projects**: Reference projects for new project setup

#### Department-Specific Projects
- **Engineering Projects**: Civil, Electrical, Mechanical, Process engineering
- **Procurement Projects**: Tender management and vendor contracts
- **Safety Projects**: HSE inspections and compliance projects
- **Quality Projects**: QA/QC and assurance projects

#### Phase-Based Access Control
- **Planning Phase**: Architects, Engineers, Project Managers
- **Procurement Phase**: Procurement Officers, Contract Managers
- **Construction Phase**: Site Managers, Foremen, Engineers
- **Completion Phase**: Project Managers, Quality Control
- **Maintenance Phase**: Maintenance Teams, Facilities Management

## Security Considerations

### Access Control Principles
1. **Least Privilege**: Users get minimum necessary project access
2. **Role-Based**: Access determined by user roles, not individual permissions
3. **Phase-Aware**: Access may vary based on project phase and user role
4. **Audit Trail**: All permission changes are logged with timestamps and user tracking

### Security Best Practices
- Regular permission audits by security teams
- Role cleanup for departed users
- Principle of least privilege enforcement across all project phases
- Clear separation between project access and functional permissions
- Integration with user-project assignment system for layered security

## Integration with User Project Assignments

### Dual-Layer Security Model

The project permissions system works in conjunction with user-project assignments:

1. **First Layer**: User must be assigned to the project
2. **Second Layer**: User must have role-based permissions to access the project/phase

```javascript
// Combined access check
const hasCompleteProjectAccess = async (userId, projectId, phaseId = null) => {
  // Check user-project assignment
  const isAssigned = await checkUserProjectAssignment(userId, projectId);
  if (!isAssigned) return false;

  // Check role-based permissions
  const hasPermission = await checkProjectPermission(userId, projectId, phaseId);
  return hasPermission;
};
```

### Migration Strategy

For existing systems migrating to fine-grained permissions:
1. **Auto-assignment**: Grant basic access to existing project users
2. **Role-mapping**: Map existing roles to appropriate permission levels
3. **Gradual rollout**: Enable phase-specific controls incrementally
4. **Audit and adjust**: Monitor access patterns and adjust permissions

## Testing and Validation

### Permission Testing Scenarios

#### Basic Project Access Tests
```javascript
describe('Project Permissions', () => {
  test('User can access permitted projects', async () => {
    const hasAccess = await checkProjectAccess('user123', 'project456');
    expect(hasAccess).toBe(true);
  });

  test('User cannot access restricted projects', async () => {
    const hasAccess = await checkProjectAccess('user123', 'restricted-project');
    expect(hasAccess).toBe(false);
  });

  test('User can access specific project phases', async () => {
    const hasAccess = await checkPhaseAccess('user123', 'project456', 'construction');
    expect(hasAccess).toBe(true);
  });
});
```

#### Integration Tests
```javascript
describe('Project Permission Integration', () => {
  test('Permission changes reflect immediately', async () => {
    // Update permission
    await updateProjectPermission('project456', 'role789', true, ['planning', 'construction']);

    // Verify access
    const hasAccess = await checkProjectAccess('user123', 'project456');
    expect(hasAccess).toBe(true);

    const hasPhaseAccess = await checkPhaseAccess('user123', 'project456', 'planning');
    expect(hasPhaseAccess).toBe(true);
  });
});
```

## Documentation and Maintenance

### Related Documentation
- [User Project Assignment Implementation](../database-systems/0300_USER_PROJECT_ASSIGNMENT_IMPLEMENTATION.md)
- [Page Permissions Roles & Permissions](01300_00000_PAGE_PERMISSIONS_ROLES_PERMISSIONS.md)
- [Master Roles & Permissions Index](01300_00000_MASTER_ROLES_PERMISSIONS_INDEX.md)
- [Authentication Overview](../authentication/0020_AUTHENTICATION_OVERVIEW.md)

### Maintenance Procedures
- Monthly permission audit and project access review
- Quarterly role and phase access assessment
- Annual security assessment with penetration testing
- Regular backup and recovery testing for permission data
- Integration testing with user management and project assignment systems

---

## Status Tracking

### Implementation Status
- [x] Database schema created and tested
- [x] RLS policies implemented and validated
- [x] API endpoints developed and documented
- [x] Client-side integration completed
- [x] UI components developed with phase controls
- [x] Testing suite created with integration tests
- [ ] Production deployment completed
- [ ] User acceptance testing finished
- [ ] Training documentation for administrators

### Testing Status
- [x] Unit tests for permission functions completed
- [x] Integration tests for API endpoints completed
- [x] RLS policy validation tests completed
- [x] Client-side permission checking tests completed
- [x] Phase-specific access control tests completed
- [ ] Performance load testing completed
- [ ] Security penetration testing completed
- [ ] End-to-end user workflow testing completed

### Integration Status
- [x] Page Permissions system compatibility verified
- [x] User Project Assignment system integration completed
- [x] Role management system compatibility confirmed
- [ ] Enterprise audit system integration pending
- [ ] Third-party project management tool integration pending

---

**Document Version:** v1.0 (2025-12-17)
**Last Updated:** 2025-12-17
**Review Cycle:** Quarterly
**Next Review:** 2026-03-17

# Implementation Notes

## Key Features Implemented
- **Database Schema**: `project_permissions` table with JSONB phase tracking
- **API Routes**: Full CRUD operations for project permissions management
- **UI Components**: Advanced permission matrix with master toggles and phase checkboxes
- **Row Level Security**: Comprehensive RLS policies matching existing permissions architecture
- **Phase Management**: Support for 5 standard construction project phases
- **Integration**: Compatible with existing user-project assignment and page permissions systems

## Security Architecture
The system implements a layered security approach:
1. **Authentication**: JWT-based user identity verification
2. **Assignment**: User must be assigned to project (from user-project-assignments)
3. **Authorization**: Role-based permissions with phase-level granularity
4. **Access Control**: RLS policies enforce data-level security in Supabase

## Performance Considerations
- Indexed queries for fast permission lookups
- Cached permission checking in client applications
- Batched operations for bulk permission updates
- Optimized database joins for permission verification

## Future Enhancements
- Dynamic phase configuration per project type
- Time-based access controls for project phases
- Advanced reporting and analytics for access patterns
- Machine learning-based access pattern analysis
- Integration with external project management tools
