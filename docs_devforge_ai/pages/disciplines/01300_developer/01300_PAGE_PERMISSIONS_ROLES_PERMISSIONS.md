# 01300_00000 Page Permissions Roles & Permissions

## Overview

This document defines the roles, permissions, and access control framework for page-level permissions in the ConstructAI platform. Page permissions control which roles can access which pages and UI elements within the application.

## Requirements

### Prerequisites
- Supabase project with authentication enabled
- Database administrator access
- Understanding of PostgreSQL and RLS policies
- Familiarity with JWT token structure and claims
- Access to authentication and role-permissions documentation

### Permission-Based Role Architecture
- **Page Permissions Table**: `public.page_permissions` stores role-based access to pages
- **Role-Based Access**: Each role has explicitly defined page access permissions
- **JSONB Permission Checking**: RLS policies use role-based access control
- **Granular Control**: Page-level permissions allow fine-tuned access management

## Database Schema

### Page Permissions Table

```sql
CREATE TABLE IF NOT EXISTS public.page_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  page_path text NOT NULL,
  role_id uuid NOT NULL,
  has_access boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by text,
  updated_by text,
  CONSTRAINT page_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT page_permissions_unique UNIQUE (page_path, role_id)
);
```

### Indexes and Constraints

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_permissions_page_path ON public.page_permissions USING btree (page_path);
CREATE INDEX IF NOT EXISTS idx_page_permissions_role_id ON public.page_permissions USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_page_permissions_access ON public.page_permissions USING btree (has_access);

-- Enable Row Level Security
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;
```

## Row Level Security Policies

### Core RLS Policies

```sql
-- Service role has full access for management
CREATE POLICY "service_role_full_access_page_permissions" ON public.page_permissions
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view page permissions for roles they have access to
CREATE POLICY "users_can_view_page_permissions" ON public.page_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.role_id = page_permissions.role_id
    )
  );

-- Department managers can manage page permissions in their department
CREATE POLICY "department_managers_manage_page_permissions" ON public.page_permissions
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
CREATE POLICY "system_admin_full_access_page_permissions" ON public.page_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.level = 4
    )
  );
```

## Permission Definitions

### Page Access Permissions

| Permission Type | Description | Applies To |
|----------------|-------------|------------|
| `page:view` | View access to specific pages | All authenticated users with role access |
| `page:edit` | Edit access to page content | Contributors and above |
| `page:admin` | Administrative access to page settings | Managers and administrators |
| `page:delete` | Delete access to pages | System administrators only |

### Role-Based Page Access Matrix

#### System Administration Pages (02050)
- **IT System Dashboard**: IT Directors, System Administrators
- **Security Dashboard**: IT Directors, Security Administrators, CISO
- **User Management**: System Administrators, IT Directors

#### Governance Pages (01300)
- **Template Management**: Template Managers, Governance Officers
- **Approval Workflows**: Template Managers, Department Managers
- **Document Control**: All authenticated users (role-based)

#### Department-Specific Pages
- **Procurement (01900)**: Procurement Managers, Procurement Officers
- **Safety (02400)**: Safety Managers, HSE Officers
- **Civil Engineering (00850)**: Engineering Managers, Civil Engineers

## Implementation

### API Endpoints

#### Page Permissions Management
```javascript
// GET /api/page-permissions - List all page permissions
// POST /api/page-permissions - Update page permission
// GET /api/page-permissions/roles - Get available roles
// GET /api/page-permissions/list - Get available pages
```

#### Permission Checking
```javascript
// Check if user has access to a specific page
const hasPageAccess = async (userId, pagePath) => {
  const { data, error } = await supabase
    .from('page_permissions')
    .select('has_access')
    .eq('page_path', pagePath)
    .eq('role_id', userRoleId)
    .single();

  return data?.has_access || false;
};
```

### Client-Side Integration

#### Permission Checking Hook
```javascript
// usePermissions.js
export const usePermissions = () => {
  const checkPageAccess = async (pagePath) => {
    try {
      const response = await fetch(`/api/page-permissions/check/${pagePath}`);
      const { hasAccess } = await response.json();
      return hasAccess;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  return { checkPageAccess };
};
```

#### Protected Route Component
```javascript
// ProtectedPage.js
export const ProtectedPage = ({ pagePath, children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { checkPageAccess } = usePermissions();

  useEffect(() => {
    const verifyAccess = async () => {
      const access = await checkPageAccess(pagePath);
      setHasAccess(access);
      setLoading(false);
    };

    verifyAccess();
  }, [pagePath]);

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access Denied</div>;

  return children;
};
```

## Role-Based Access Matrix

### Page Categories and Access Levels

#### Public Pages (All Authenticated Users)
- Dashboard/Home pages
- Profile settings
- Basic navigation

#### Department Pages (Department Users)
- Department-specific tools and forms
- Department document libraries
- Department reporting

#### Management Pages (Managers and Above)
- Approval workflows
- Team management
- Department administration

#### Administrative Pages (Administrators Only)
- System configuration
- User role management
- Security settings

## Security Considerations

### Access Control Principles
1. **Least Privilege**: Users get minimum necessary access
2. **Role-Based**: Access determined by user roles, not individual permissions
3. **Context-Aware**: Access may vary based on department and organizational context
4. **Audit Trail**: All permission changes are logged

### Security Best Practices
- Regular permission audits
- Role cleanup for departed users
- Principle of least privilege enforcement
- Clear separation between page access and functional permissions

## Testing and Validation

### Permission Testing Scenarios

#### Basic Access Tests
```javascript
describe('Page Permissions', () => {
  test('User can access permitted pages', async () => {
    const hasAccess = await checkPageAccess('user123', '/dashboard');
    expect(hasAccess).toBe(true);
  });

  test('User cannot access restricted pages', async () => {
    const hasAccess = await checkPageAccess('user123', '/admin/users');
    expect(hasAccess).toBe(false);
  });
});
```

#### Integration Tests
```javascript
describe('Page Permission Integration', () => {
  test('Permission changes reflect immediately', async () => {
    // Update permission
    await updatePagePermission('/dashboard', 'role123', true);

    // Verify access
    const hasAccess = await checkPageAccess('user123', '/dashboard');
    expect(hasAccess).toBe(true);
  });
});
```

## Documentation and Maintenance

### Related Documentation
- [User Roles Implementation Procedure](../procedures/01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md)
- [Master Roles & Permissions Index](01300_00000_MASTER_ROLES_PERMISSIONS_INDEX.md)
- [Authentication Overview](../authentication/0020_AUTHENTICATION_OVERVIEW.md)

### Maintenance Procedures
- Monthly permission audit
- Quarterly role review
- Annual security assessment
- Regular backup and recovery testing

---

## Status Tracking

### Implementation Status
- [x] Database schema created
- [x] RLS policies implemented
- [x] API endpoints developed
- [x] Client-side integration completed
- [x] Testing suite created
- [x] Documentation completed
- [ ] Production deployment completed
- [ ] User acceptance testing finished

### Testing Status
- [x] Unit tests for permission functions
- [x] Integration tests for API endpoints
- [x] RLS policy validation tests
- [x] Client-side permission checking tests
- [ ] Performance load testing
- [ ] Security penetration testing
- [ ] End-to-end user workflow testing

---

**Document Version:** v1.0 (2025-12-11)
**Last Updated:** 2025-12-11
**Review Cycle:** Quarterly
**Next Review:** 2026-03-11
