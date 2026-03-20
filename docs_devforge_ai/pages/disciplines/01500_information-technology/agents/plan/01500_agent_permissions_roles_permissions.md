# 01300_00000 Agent Permissions Roles & Permissions

## Overview

This document defines the roles, permissions, and access control framework for AI agent permissions in the ConstructAI platform. Agent permissions control which roles can access which AI agents and AI-powered functionality within the application.

## Requirements

### Prerequisites
- Supabase project with authentication enabled
- Database administrator access
- Understanding of PostgreSQL and RLS policies
- Familiarity with JWT token structure and claims
- Access to authentication and role-permissions documentation

### Permission-Based Role Architecture
- **Agent Permissions Table**: `public.agent_permissions` stores role-based access to AI agents
- **Role-Based Access**: Each role has explicitly defined agent access permissions
- **JSONB Permission Checking**: RLS policies use role-based access control
- **Granular Control**: Agent-level permissions allow fine-tuned AI access management

## Database Schema

### Agent Permissions Table

```sql
CREATE TABLE IF NOT EXISTS public.agent_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  agent_id text NOT NULL,
  role_id uuid NOT NULL,
  has_access boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by text,
  updated_by text,
  CONSTRAINT agent_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT agent_permissions_unique UNIQUE (agent_id, role_id)
);
```

### Indexes and Constraints

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_permissions_agent_id ON public.agent_permissions USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_permissions_role_id ON public.agent_permissions USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_agent_permissions_access ON public.agent_permissions USING btree (has_access);

-- Enable Row Level Security
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
```

## Row Level Security Policies

### Core RLS Policies

```sql
-- Service role has full access for management
CREATE POLICY "service_role_full_access_agent_permissions" ON public.agent_permissions
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view agent permissions for roles they have access to
CREATE POLICY "users_can_view_agent_permissions" ON public.agent_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.role_id = agent_permissions.role_id
    )
  );

-- Department managers can manage agent permissions in their department
CREATE POLICY "department_managers_manage_agent_permissions" ON public.agent_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.level >= 3
      AND (
        ur.department_code IN ('02050', '01300') OR  -- IT and Governance can manage agents
        ur.level = 4  -- System admins can manage all
      )
    )
  );

-- System administrators have full access
CREATE POLICY "system_admin_full_access_agent_permissions" ON public.agent_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.level = 4
    )
  );
```

## Permission Definitions

### Agent Access Permissions

| Permission Type | Description | Applies To |
|----------------|-------------|------------|
| `agent:access` | Basic access to AI agents | All authenticated users with role access |
| `agent:advanced` | Access to advanced AI features | Contributors and above |
| `agent:admin` | Administrative access to agent settings | Managers and administrators |
| `agent:configure` | Configuration access to agents | System administrators only |

### Role-Based Agent Access Matrix

#### Analysis Agents
- **Drawing Analysis Agent**: Civil Engineers, Project Managers, IT Support
- **Document Processing Agent**: All department users, Document Controllers
- **Template Generation Agent**: Template Designers, Content Managers

#### Communication Agents
- **Correspondence Agent**: Legal, Procurement, Contract Managers
- **Email Management Agent**: Administrative staff, Communication officers

#### Specialized Agents
- **Safety Analysis Agent**: HSE Officers, Safety Managers
- **Procurement Analysis Agent**: Procurement Officers, Procurement Managers
- **Quality Control Agent**: Quality Assurance, Project Managers

## Implementation

### API Endpoints

#### Agent Permissions Management
```javascript
// GET /api/agent-permissions - List all agent permissions
// POST /api/agent-permissions - Update agent permission
// GET /api/agent-permissions/agents/list - Get available agents
```

#### Permission Checking
```javascript
// Check if user has access to a specific agent
const hasAgentAccess = async (userId, agentId) => {
  const { data, error } = await supabase
    .from('agent_permissions')
    .select('has_access')
    .eq('agent_id', agentId)
    .eq('role_id', userRoleId)
    .single();

  return data?.has_access || false;
};
```

### Client-Side Integration

#### Permission Checking Hook
```javascript
// useAgentPermissions.js
export const useAgentPermissions = () => {
  const checkAgentAccess = async (agentId) => {
    try {
      const response = await fetch(`/api/agent-permissions/check/${agentId}`);
      const { hasAccess } = await response.json();
      return hasAccess;
    } catch (error) {
      console.error('Agent permission check failed:', error);
      return false;
    }
  };

  return { checkAgentAccess };
};
```

#### Protected Agent Component
```javascript
// ProtectedAgent.js
export const ProtectedAgent = ({ agentId, children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { checkAgentAccess } = useAgentPermissions();

  useEffect(() => {
    const verifyAccess = async () => {
      const access = await checkAgentAccess(agentId);
      setHasAccess(access);
      setLoading(false);
    };

    verifyAccess();
  }, [agentId]);

  if (loading) return <div>Loading agent...</div>;
  if (!hasAccess) return <div>Agent access denied</div>;

  return children;
};
```

## Role-Based Access Matrix

### Agent Categories and Access Levels

#### Basic Analysis Agents (All Department Users)
- Document processing and basic analysis
- Template assistance
- Standard reporting

#### Advanced Analysis Agents (Specialized Users)
- Drawing analysis and interpretation
- Complex document analysis
- Predictive analytics

#### Communication Agents (Communication Roles)
- Email and correspondence management
- Contract analysis and review
- Stakeholder communication

#### Administrative Agents (Management Roles)
- System monitoring and alerts
- Performance analytics
- Compliance checking

## Security Considerations

### Access Control Principles
1. **AI Safety**: Prevent unauthorized access to powerful AI capabilities
2. **Data Privacy**: Ensure agents only access appropriate data based on roles
3. **Usage Monitoring**: Track AI agent usage for security and compliance
4. **Contextual Access**: Agent access may vary based on project and department context

### Security Best Practices
- Regular agent permission audits
- Role-based data access controls
- AI usage logging and monitoring
- Clear separation between agent types and access levels

## Agent Types and Capabilities

### Analysis Agents
- **Purpose**: Data analysis, document processing, insights generation
- **Access Level**: Department users and above
- **Security Requirements**: Input validation, output sanitization

### Communication Agents
- **Purpose**: Email processing, correspondence analysis, stakeholder management
- **Access Level**: Communication roles and managers
- **Security Requirements**: Privacy protection, confidentiality maintenance

### Administrative Agents
- **Purpose**: System monitoring, compliance checking, performance analytics
- **Access Level**: Management and administrative roles only
- **Security Requirements**: Audit logging, access restrictions

## Testing and Validation

### Permission Testing Scenarios

#### Basic Access Tests
```javascript
describe('Agent Permissions', () => {
  test('User can access permitted agents', async () => {
    const hasAccess = await checkAgentAccess('user123', 'drawing-analysis');
    expect(hasAccess).toBe(true);
  });

  test('User cannot access restricted agents', async () => {
    const hasAccess = await checkAgentAccess('user123', 'system-admin');
    expect(hasAccess).toBe(false);
  });
});
```

#### Integration Tests
```javascript
describe('Agent Permission Integration', () => {
  test('Permission changes reflect immediately', async () => {
    // Update permission
    await updateAgentPermission('drawing-analysis', 'role123', true);

    // Verify access
    const hasAccess = await checkAgentAccess('user123', 'drawing-analysis');
    expect(hasAccess).toBe(true);
  });
});
```

## Documentation and Maintenance

### Related Documentation
- [User Roles Implementation Procedure](../procedures/01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md)
- [Master Roles & Permissions Index](01300_00000_MASTER_ROLES_PERMISSIONS_INDEX.md)
- [Page Permissions](01300_00000_PAGE_PERMISSIONS_ROLES_PERMISSIONS.md)
- [Authentication Overview](../authentication/0020_AUTHENTICATION_OVERVIEW.md)

### Maintenance Procedures
- Monthly agent permission audit
- Quarterly AI usage review
- Annual AI security assessment
- Regular agent capability updates

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
- [x] Unit tests for agent permission functions
- [x] Integration tests for API endpoints
- [x] RLS policy validation tests
- [x] Client-side agent permission checking tests
- [ ] Performance load testing
- [ ] AI security penetration testing
- [ ] End-to-end agent workflow testing

---

**Document Version:** v1.0 (2025-12-11)
**Last Updated:** 2025-12-11
**Review Cycle:** Quarterly
**Next Review:** 2026-03-11
