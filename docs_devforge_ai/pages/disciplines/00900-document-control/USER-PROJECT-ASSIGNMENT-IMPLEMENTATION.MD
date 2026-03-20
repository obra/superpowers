# 0300 User Project Assignment Implementation

## Master Implementation Guide: User Project Assignment Control

**Status**: Design Complete | Implementation Pending

---

## Overview

This document outlines the implementation plan for converting ConstructAI from organization-based project access to individual user-project assignments. This enables finer-grained access control where users can be selectively assigned to specific projects and their phases within an organization.

**Key Changes:**
- Replace automatic project access with explicit user-project assignments
- Add project-phase level control (3 levels: Project → Phase → User)
- Integrate assignment management into enhanced user management page
- Maintain organization-based access as fallback for migration

---

## 1. Current System Analysis

**Existing Access Model:**
```javascript
fetchUserAssignedProjects = async () => {
  // ALL projects in user's organization
  const projects = await supabase
    .from("construction_projects")
    .select("*")
    .eq("organization_id", activeOrganization.id)
    .eq("workflow_status", "active");
  return projects; // Returns ALL org projects
};
```

**Problems:**
- No selective project access
- All organization users see all projects
- No project-phase granularity
- Cannot restrict access to sensitive projects

---

## 2. Proposed System Architecture

### Data Model

```sql
-- New project assignment table
CREATE TABLE user_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES construction_projects(id),
  assigned_role TEXT NOT NULL DEFAULT 'contributor',
  phases_access JSONB DEFAULT NULL,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, project_id)
);

-- Enhanced project phase relationships
CREATE TABLE project_phase_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES construction_projects(id),
  phase_name TEXT NOT NULL,
  phase_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Access Control Logic

**New Assignment-First Query:**
```javascript
fetchUserAssignedProjects = async () => {
  // Check for explicit assignments first
  const directAssignments = await supabase
    .from("user_project_assignments")
    .select("*, construction_projects(*)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (directAssignments.data?.length > 0) {
    return directAssignments.data; // Return explicit assignments
  }

  // Fallback: Organization auto-assignment for new users
  if (user.isNewOrganizationMember) {
    await autoAssignUserToAllActiveProjects(user.id);
  }

  return organizationProjects; // Fallback to org-based access
};
```

### Assignment Types

1. **Explicit Assignment**: Admin manually assigns user to specific projects
2. **Auto Assignment**: New org users get all active projects automatically
3. **Inherited Organization**: Legacy behavior for existing users during migration

---

## 3. Database Schema Implementation

### Migration Step 1: Create Tables

```sql
-- File: sql/create_user_project_assignments.cjs
const tableDefinition = {
  user_project_assignments: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID NOT NULL REFERENCES users(id)",
    project_id: "UUID NOT NULL REFERENCES construction_projects(id)",
    assigned_role: "TEXT NOT NULL DEFAULT 'contributor'",
    phases_access: "JSONB DEFAULT NULL",
    assigned_by: "UUID REFERENCES users(id)",
    assigned_at: "TIMESTAMP DEFAULT NOW()",
    expires_at: "TIMESTAMP NULL",
    is_active: "BOOLEAN DEFAULT TRUE",
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()"
  }
};

const constraints = [
  "UNIQUE(user_id, project_id)",
  "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
  "FOREIGN KEY (project_id) REFERENCES construction_projects(id) ON DELETE CASCADE"
];

const indexes = [
  "CREATE INDEX idx_user_project_assignments_user ON user_project_assignments(user_id)",
  "CREATE INDEX idx_user_project_assignments_project ON user_project_assignments(project_id)",
  "CREATE INDEX idx_user_project_assignments_active ON user_project_assignments(is_active)",
];
```

### Migration Step 2: Row Level Security

```sql
-- Enable RLS
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;

-- Assignment creator and admins can manage
CREATE POLICY "assignment_management" ON user_project_assignments
FOR ALL USING (
  assigned_by = auth.uid() OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Users can view their own assignments
CREATE POLICY "assignment_view_own" ON user_project_assignments
FOR SELECT USING (user_id = auth.uid());
```

---

## 4. UI Integration: Enhanced User Management Page

### Tab Structure Enhancement

**File:** `client/src/pages/00155-user-management/components/00155-modern-user-management-page.js`

```jsx
// Enhanced component with new tab
const ModernUserManagementPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);

  return (
    <div className="user-management-modern">
      <Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <Tab eventKey="users" title="Users">
          {/* Existing user management UI */}
        </Tab>

        <Tab eventKey="projects" title="Project Assignments">
          {/* NEW: Project assignment interface */}
          <ProjectAssignmentPanel
            users={users}
            projects={projects}
            assignments={assignments}
            onAssignmentChange={handleAssignmentChange}
          />
        </Tab>

        <Tab eventKey="roles" title="Role Management">
          {/* Future: Enhanced role management */}
        </Tab>
      </Tabs>
    </div>
  );
};
```

### Project Assignment Component

```jsx
const ProjectAssignmentPanel = ({ users, projects, assignments, onAssignmentChange }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAssignments, setUserAssignments] = useState([]);

  const handleUserSelection = (user) => {
    setSelectedUser(user);
    // Load user's current assignments
    const current = assignments.filter(a => a.user_id === user.id);
    setUserAssignments(current);
  };

  const handleProjectToggle = (projectId) => {
    const isAssigned = userAssignments.some(a => a.project_id === projectId);
    if (isAssigned) {
      // Remove assignment
      const assignment = userAssignments.find(a => a.project_id === projectId);
      removeAssignment(assignment.id);
    } else {
      // Add assignment
      createAssignment({
        user_id: selectedUser.id,
        project_id: projectId,
        assigned_role: 'contributor',
        phases_access: null
      });
    }
  };

  return (
    <Row className="g-4">
      {/* Left Panel: User List */}
      <Col md={4}>
        <Card>
          <Card.Header>Users ({users.length})</Card.Header>
          <Card.Body style={{maxHeight: '400px', overflowY: 'auto'}}>
            {users.map(user => (
              <div
                key={user.id}
                className={`p-2 mb-2 border rounded cursor-pointer ${
                  selectedUser?.id === user.id ? 'border-primary bg-light' : 'border-secondary'
                }`}
                onClick={() => handleUserSelection(user)}
              >
                <div className="fw-bold">{user.email}</div>
                <small className="text-muted">
                  Assigned to {userAssignments.length} projects
                </small>
              </div>
            ))}
          </Card.Body>
        </Card>
      </Col>

      {/* Right Panel: Assignment Controls */}
      <Col md={8}>
        {selectedUser ? (
          <Card>
            <Card.Header>
              Project Assignments for {selectedUser.email}
            </Card.Header>
            <Card.Body>
              {projects.map(project => {
                const isAssigned = userAssignments.some(a => a.project_id === project.id);
                return (
                  <div key={project.id} className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id={`project-${project.id}`}
                      label={`${project.name} (${project.project_number || 'No Number'})`}
                      checked={isAssigned}
                      onChange={() => handleProjectToggle(project.id)}
                    />
                    {isAssigned && (
                      <div className="ms-4 mt-2">
                        <small className="text-muted">Assigned as: Contributor</small>
                        {/* Future: Role selector */}
                        {/* Future: Phase checkboxes */}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        ) : (
          <Card>
            <Card.Body className="text-center text-muted">
              Select a user to manage their project assignments
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
};
```

---

## 5. Backend API Implementation

### New Routes

**File:** `server/src/routes/user-project-assignments.js`

```javascript
router.get('/assignments/:userId', async (req, res) => {
  const { userId } = req.params;
  const assignments = await getUserProjectAssignments(userId);
  res.json(assignments);
});

router.post('/assignments', async (req, res) => {
  const assignment = await createUserProjectAssignment(req.body);
  res.json(assignment);
});

router.delete('/assignments/:assignmentId', async (req, res) => {
  await removeUserProjectAssignment(req.params.assignmentId);
  res.status(204).send();
});
```

### Service Layer

```javascript
// services/userProjectAssignmentService.js
const getUserProjectAssignments = async (userId) => {
  const { data, error } = await supabase
    .from('user_project_assignments')
    .select(`
      *,
      construction_projects (
        id, name, project_number, organization_id
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
};

const createUserProjectAssignment = async (assignmentData) => {
  const { data, error } = await supabase
    .from('user_project_assignments')
    .insert([assignmentData])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

---

## 6. Migration Strategy

### Phase 1: Parallel Implementation

1. **Create new tables** alongside existing system
2. **Auto-populate assignments** for existing users based on organization access
3. **Update queries** to check assignments first, fallback to organization access

```javascript
// Migration helper
const migrateUserToProjectAssignments = async (userId) => {
  const user = await getUserById(userId);
  const organizationProjects = await getOrganizationProjects(user.organization_id);

  // Create assignments for all current organization projects
  const assignments = organizationProjects.map(project => ({
    user_id: userId,
    project_id: project.id,
    assigned_role: 'contributor',
    phases_access: null, // All phases by default
    assigned_by: systemUserId,
    assigned_at: new Date(),
  }));

  await supabase
    .from('user_project_assignments')
    .insert(assignments);

  return assignments.length;
};
```

### Phase 2: Gradual Cutover

1. **New users**: Auto-assigned to all active projects
2. **Existing users**: Lazy migration when they access project features
3. **Admin override**: Can modify assignments regardless of organization

### Phase 3: Legacy Cleanup

1. **Remove organization-based queries** from codebase
2. **Update documentation** to reflect new assignment model
3. **Clean up unused code** and tables

---

## 7. Testing Strategy

### Unit Tests

```javascript
describe('Project Assignment Service', () => {
  test('should create assignment successfully', async () => {
    const assignment = {
      user_id: testUserId,
      project_id: testProjectId,
      assigned_role: 'contributor'
    };

    const result = await createUserProjectAssignment(assignment);
    expect(result.user_id).toBe(testUserId);
    expect(result.project_id).toBe(testProjectId);
  });

  test('should auto-assign new users to all projects', async () => {
    const newUser = await createUser(newUserData);

    // Trigger auto-assignment
    await processNewUserAssignments(newUser.id);

    const assignments = await getUserProjectAssignments(newUser.id);
    expect(assignments.length).toBe(testOrganizationProjects.length);
  });
});
```

### Integration Tests

```javascript
describe('Project Access Flow', () => {
  test('user with specific assignment should see only assigned projects', async () => {
    // Setup: User assigned to only 2 specific projects
    await createUserProjectAssignment({
      user_id: testUser.id,
      project_id: projectA.id,
      assigned_role: 'contributor'
    });
    await createUserProjectAssignment({
      user_id: testUser.id,
      project_id: projectB.id,
      assigned_role: 'contributor'
    });

    const accessibleProjects = await fetchUserAssignedProjects(testUser.id);

    expect(accessibleProjects.length).toBe(2);
    expect(accessibleProjects).toContain(projectA);
    expect(accessibleProjects).toContain(projectB);
    expect(accessibleProjects).not.toContain(projectC);
  });
});
```

---

## 8. Security Considerations

### Audit Trail

**Assignment Changes Logged:**
```javascript
const logAssignmentChange = async (action, assignmentId, oldData, newData) => {
  await supabase.from('audit_log').insert([{
    table_name: 'user_project_assignments',
    action: action,
    record_id: assignmentId,
    old_data: oldData,
    new_data: newData,
    changed_by: currentUser.id,
    changed_at: new Date()
  }]);
};
```

### Permission Controls

**Assignment Management Permissions:**
- Only admins can create/modify assignments
- Project managers can assign within their projects
- Users can view their own assignments only

### Data Validation

**Assignment Constraints:**
- Users cannot be assigned to projects outside their organization
- Expired assignments are automatically deactivated
- Circular assignments prevented (user can't assign themselves)

---

## 9. Performance Optimization

### Indexing Strategy

```sql
-- Performance indexes for common queries
CREATE INDEX idx_assignments_user_active ON user_project_assignments(user_id, is_active);
CREATE INDEX idx_assignments_project_active ON user_project_assignments(project_id, is_active);
CREATE INDEX idx_assignments_user_project ON user_project_assignments(user_id, project_id);
CREATE INDEX idx_assignments_assigned_by ON user_project_assignments(assigned_by);
```

### Caching Strategy

```javascript
// Redis/cache assignment lookups
const CACHE_KEY_USER_PROJECTS = (userId) => `user_projects:${userId}`;

const getCachedUserProjects = async (userId) => {
  const cacheKey = CACHE_KEY_USER_PROJECTS(userId);
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const projects = await fetchUserAssignedProjects(userId);
  await redis.set(cacheKey, JSON.stringify(projects), 'EX', 3600); // 1 hour

  return projects;
};
```

---

## 10. Rollback Plan

### Emergency Revert

**If issues arise:**
1. **Disable new assignment queries** → fall back to organization access
2. **Redirect to admin page** for manual assignment management
3. **Restore organization-based queries** temporarily

```javascript
// Feature flag for emergency rollback
const ENABLE_PROJECT_ASSIGNMENTS = process.env.ENABLE_PROJECT_ASSIGNMENTS === 'true';

const fetchUserAssignedProjects = async () => {
  if (ENABLE_PROJECT_ASSIGNMENTS) {
    return await getDirectProjectAssignments();
  } else {
    return await getOrganizationProjects(); // Legacy behavior
  }
};
```

### Graduated Rollback

1. **Phase rollback**: Disable for new features, keep for existing
2. **User rollback**: Admin tools to reset users to organization access
3. **Complete rollback**: Restore original codebase

---

## 11. Implementation Status

- [ ] Database schema created
- [ ] RLS policies implemented
- [ ] UI components developed
- [ ] Backend APIs implemented
- [ ] Migration scripts written
- [ ] Testing completed
- [ ] Documentation updated
- [ ] User training completed

---

## 12. Related Documentation

- [`0305_SQLITE_FIRST_WORKFLOW.md`](../0305_SQLITE_FIRST_WORKFLOW.md) - Development workflow
- [`0020_AUTHENTICATION_OVERVIEW.md`](../authentication/0020_AUTHENTICATION_OVERVIEW.md) - Security context
- [`01300_00000_MASTER_ROLES_PERMISSIONS_INDEX.md`](../role-permissions/01300_00000_MASTER_ROLES_PERMISSIONS_INDEX.md) - Role hierarchy

---

**Next Steps:**
1. Implement database schema
2. Update user management page with projects tab
3. Add phase-level controls
4. Test migration with existing data
5. Deploy with rollback capabilities
6. Train administrators on new assignment management
