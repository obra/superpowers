/Users/_PropAI/construct_ai/docs/role-permissions/01300_00000_MASTER_ROLES_PERMISSIONS_INDEX.md# 00000_MASTER_ROLES_PERMISSIONS_INDEX.md

## Master Roles & Permissions Documentation Index

### Status
- [x] Initial draft
- [x] Security review required
- [ ] Governance approval pending
- [ ] Implementation completed

### Version History
- v1.0 (2025-12-11): Initial master index for roles and permissions documentation

---

## Overview

This master document serves as the central index for all roles, permissions, and access control documentation across the ConstructAI platform. It provides a comprehensive overview of the security architecture and links to detailed documentation for each system component.

### Security Architecture Overview

The ConstructAI platform implements a multi-layered security approach:

1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: Role-Based Access Control (RBAC) with Row Level Security (RLS)
3. **Data Isolation**: Organization-based and user-based data segregation
4. **Audit Logging**: Comprehensive activity tracking
5. **Access Control**: Department-specific and project-specific permissions

---

## Core Security Infrastructure

### 1. Authentication & User Management

| Document | Scope | Status | Description |
|----------|-------|--------|-------------|
| [`02050-information-technology/components/RLSSecurityDashboard.jsx`](../02050-information-technology/components/RLSSecurityDashboard.jsx) | System-wide | ✅ Active | RLS Security Dashboard for managing access controls |
| [`02050-information-technology/components/SchemaDashboard.jsx`](../02050-information-technology/components/SchemaDashboard.jsx) | Database | ✅ Active | Database schema and security management |
| [`docs/0500_SUPABASE.md`](../docs/0500_SUPABASE.md) | Infrastructure | ✅ Active | Supabase authentication and RLS implementation |

### 2. Core Permissions Tables

| Table | Purpose | Access Level | Current Status | Documentation |
|-------|---------|--------------|---------------|---------------|
| `user_roles` | User role assignments | System-wide | ✅ **ACTIVE** | [User Roles Schema](./database/schemas/user_roles.sql) |
| `user_organization_access` | Organization membership | Organization | ⚠️ **LEGACY** | [Organization Access](./database/schemas/user_organization_access.sql) |
| `user_department_access` | Department permissions | Department | ⚠️ **LEGACY** | [Department Access](./database/schemas/user_department_access.sql) |
| `user_role_assignments` | Detailed role mappings | Granular | ❌ **DEPRECATED** | [Role Assignments](./database/schemas/user_role_assignments.sql) |

---

## Page-Specific Roles & Permissions

### Governance & Administration (1300)

| Page/Document | Primary Users | Key Permissions | Status |
|---------------|---------------|-----------------|--------|
| [**1300_01300_GOVERNANCE.md**](./pages-disciplines/1300_01300_GOVERNANCE.md) | Governance Team | Form management, template approval | ✅ Active |
| [**01300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md**](./role-permissions/01300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md) | Template Creators/Managers | Template lifecycle management | ✅ Active |
| [**01300_00000_PAGE_PERMISSIONS_ROLES_PERMISSIONS.md**](./role-permissions/01300_00000_PAGE_PERMISSIONS_ROLES_PERMISSIONS.md) | All Users | Page access control, UI permissions | ✅ Active |
| [**01301_00000_PROJECT_PERMISSIONS_ROLES_PERMISSIONS.md**](./role-permissions/01301_00000_PROJECT_PERMISSIONS_ROLES_PERMISSIONS.md) | Project Users | Project access control, phase-based permissions | ✅ Active |
| [**01300_00000_AGENT_PERMISSIONS_ROLES_PERMISSIONS.md**](./role-permissions/01300_00000_AGENT_PERMISSIONS_ROLES_PERMISSIONS.md) | Department Users | AI agent access control | ✅ Active |
| [`01300-template-management-page.js`](../client/src/pages/01300-governance/components/01300-template-management-page.js) | Discipline Experts | Template creation/editing | ✅ Active |

### Safety & HSE (02400)

| Page/Document | Primary Users | Key Permissions | Status |
|---------------|---------------|-----------------|--------|
| [**01300_02400_SAFETY_HSE_ROLES_PERMISSIONS.md**](./role-permissions/01300_02400_SAFETY_HSE_ROLES_PERMISSIONS.md) | HSE Professionals | Contractor vetting, incident management, QA | ✅ Active |
| [**02400-contractor-vetting/README.md**](../client/src/pages/02400-safety/02400-contractor-vetting/README.md) | Safety Officers | Contractor evaluation, risk assessment | ✅ Active |
| [**1300_02400_HSSE_QUESTIONNAIRE_FORM.html**](./pages-disciplines/1300_02400_HSSE_QUESTIONNAIRE_FORM.html) | HSE Teams | Questionnaire generation, compliance | ✅ Active |
| [**1300_02400_HSE_MASTER_GUIDE.md**](./pages-disciplines/1300_02400_HSE_MASTER_GUIDE.md) | HSE Managers | Master HSE documentation | ✅ Active |

### Procurement (01900)

| Page/Document | Primary Users | Key Permissions | Status |
|---------------|---------------|-----------------|--------|
| [**01300_01900_PROCUREMENT_ROLES_PERMISSIONS.md**](./role-permissions/01300_01900_PROCUREMENT_ROLES_PERMISSIONS.md) | Procurement Professionals | Vendor management, contract administration | ✅ Active |
| [**procurement_templates_schema.sql**](../sql/procurement_templates_schema.sql) | Procurement Team | Template management, approval workflows | ✅ Active |
| [**amended_technical_documents_prompt.md**](./amended_technical_documents_prompt.md) | Procurement Managers | Document processing, RLS policies | ✅ Active |

### Civil Engineering (00850)

| Page/Document | Primary Users | Key Permissions | Status |
|---------------|---------------|-----------------|--------|
| [**01300_00850_CIVIL_ENGINEERING_ROLES_PERMISSIONS.md**](./role-permissions/01300_00850_CIVIL_ENGINEERING_ROLES_PERMISSIONS.md) | Civil Engineers | Design approval, construction supervision, QA | ✅ Active |
| [**create_project_engineering_templates_table.sql**](../sql/create_project_engineering_templates_table.sql) | Civil Engineering Team | Template management, project templates | ✅ Active |

### Information Technology (02050)

| Page/Document | Primary Users | Key Permissions | Status |
|---------------|---------------|-----------------|--------|
| [**RLSSecurityDashboard.jsx**](../client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx) | IT Administrators | System-wide security management | ✅ Active |
| [**SchemaDashboard.jsx**](../client/src/pages/02050-information-technology/components/SchemaDashboard.jsx) | Database Admins | Schema management, RLS policies | ✅ Active |

### Finance (01200)

| Page/Document | Primary Users | Key Permissions | Status |
|---------------|---------------|-----------------|--------|
| [**finance_templates_schema.sql**](../sql/finance_templates_schema.sql) | Finance Team | Financial template management | ✅ Active |

### Human Resources (01500)

| Page/Document | Primary Users | Key Permissions | Status |
|---------------|---------------|-----------------|--------|
| [**hr_templates_schema.sql**](../sql/hr_templates_schema.sql) | HR Team | HR template management | ✅ Active |

---

## Role Categories & Hierarchy

### 1. System Administrators (Level 4)

| Role | Department | Permissions | Scope |
|------|------------|-------------|-------|
| **System Administrator** | IT (02050) | Full system access, user management | Global |
| **Security Administrator** | IT (02050) | Security policy management | Global |
| **Database Administrator** | IT (02050) | Database management, RLS policies | Global |

### 2. Department Managers (Level 3)

| Role | Department | Permissions | Scope |
|------|------------|-------------|-------|
| **Template Manager** | Governance (01300) | Template approval, publishing | Organization |
| **Safety Manager** | Safety (02400) | HSE compliance, contractor approval | Department |
| **Procurement Manager** | Procurement (01900) | Procurement workflows, approvals | Department |
| **Finance Manager** | Finance (01200) | Financial controls, approvals | Department |
| **HR Manager** | HR (01500) | HR policies, employee management | Department |

### 3. Department Contributors (Level 2)

| Role | Department | Permissions | Scope |
|------|------------|-------------|-------|
| **Template Designer** | Various | Template creation, editing | Department |
| **Safety Officer** | Safety (02400) | Risk assessments, inspections | Department |
| **Procurement Officer** | Procurement (01900) | Purchase requests, vendor management | Department |
| **Finance Officer** | Finance (01200) | Budget management, reporting | Department |
| **HR Officer** | HR (01500) | Recruitment, employee relations | Department |

### 4. General Users (Level 1)

| Role | Department | Permissions | Scope |
|------|------------|-------------|-------|
| **Project User** | Project-based | View published templates, form submission | Project |
| **Department User** | Department | Department resources, basic forms | Department |
| **Organization User** | Organization | Public resources, general access | Organization |

---

## Permission Matrix

### Template Management Permissions

| Permission | Admin | Manager | Contributor | User |
|------------|-------|---------|-------------|------|
| `template:create` | ✅ | ✅ | ✅ | ❌ |
| `template:edit_all` | ✅ | ✅ | ❌ | ❌ |
| `template:edit_own` | ✅ | ✅ | ✅ | ❌ |
| `template:approve` | ✅ | ✅ | ❌ | ❌ |
| `template:publish` | ✅ | ✅ | ❌ | ❌ |
| `template:archive` | ✅ | ✅ | ❌ | ❌ |
| `template:delete` | ✅ | ❌ | ❌ | ❌ |
| `template:view_all` | ✅ | ✅ | ❌ | ❌ |
| `template:view_published` | ✅ | ✅ | ✅ | ✅ |
| `template:use` | ✅ | ✅ | ✅ | ✅ |

### Administrative Permissions

| Permission | Admin | Manager | Contributor | User |
|------------|-------|---------|-------------|------|
| `user:manage_roles` | ✅ | ❌ | ❌ | ❌ |
| `system:configure` | ✅ | ❌ | ❌ | ❌ |
| `audit:view` | ✅ | ✅ | ❌ | ❌ |
| `reports:view` | ✅ | ✅ | ✅ | ❌ |
| `department:manage` | ✅ | ✅ | ❌ | ❌ |

---

## Security Implementation Patterns

### Row Level Security (RLS) Patterns

#### Pattern A: System Administration Tables
```sql
-- Development access
CREATE POLICY "dev_mode_full_access" ON {table} FOR ALL USING (is_dev_mode());

-- Service role access
CREATE POLICY "service_role_full_access" ON {table} FOR ALL USING (auth.role() = 'service_role');

-- Authenticated user access
CREATE POLICY "authenticated_view_access" ON {table} FOR SELECT USING (auth.role() = 'authenticated');
```

#### Pattern B: Organization-Scoped Tables
```sql
-- Organization-based access
CREATE POLICY "organization_view_access" ON {table} FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_organization_access
          WHERE user_id = auth.uid()::text AND organization_id = {table}.organization_id)
);
```

#### Pattern C: User-Owned Tables
```sql
-- Owner-only access
CREATE POLICY "owner_only_access" ON {table} FOR ALL USING (created_by = auth.uid());
```

### Security Best Practices

1. **Avoid Circular Dependencies**: Never reference secured tables in RLS policies
2. **Use JWT Claims**: Prefer JWT-based role checks over database lookups
3. **Principle of Least Privilege**: Grant minimum required permissions
4. **Audit Everything**: Log all security-related operations
5. **Regular Reviews**: Quarterly security policy reviews

---

## Implementation Status

### ✅ Completed Implementations

| Component | Status | Documentation | Notes |
|-----------|--------|---------------|-------|
| Unified Templates Table | ✅ **LIVE & SECURED** | [`clean_consistent_rls_policies.sql`](../docs/sql/clean_consistent_rls_policies.sql) | 15 clean RLS policies, 3 tables secured |
| Template Management RLS | ✅ **LIVE & CLEAN** | [`clean_consistent_rls_policies.sql`](../sql/clean_consistent_rls_policies.sql) | Schema-verified enterprise security (2025-11-22) |
| User Roles Table | ✅ Live | [user_roles.sql](./database/schemas/user_roles.sql) | Core authentication infrastructure |
| RLS Security Dashboard | ✅ Live | [RLSSecurityDashboard.jsx](../client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx) | Security management UI |
| Templates Forms Management Page | ✅ **WORKING & SECURED** | [BuildTemplateModal.js](../client/src/pages/01300-governance/modals/BuildTemplateModal.js) | All modals save data, persist in database |

### ⚠️ DISCIPLINE-LEVEL ROLE STATUS: **REALISTIC ASSESSMENT**

Status: **Previously claimed "FULLY IMPLEMENTED" but actually disconnected from reality**
Issue: Documentation shows "✅ FULLY IMPLEMENTED" but user_roles table **appears empty in current database**
Problem: SQL implementations exist as files but **are not actually deployed/live**
Impact: Policies refer to empty tables, causing template access failures

### 📋 Discipline Roles & Permissions Implementation Tracking

**Status Legend:**
- ✅ **FULLY IMPLEMENTED**: Completed via [User Roles Implementation Procedure](../procedures/01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md)
- 📝 **DOCUMENTED**: Roles documented but not yet implemented via procedure
- 📋 **PLANNED**: Not yet documented or implemented

| Discipline | Document | Implementation Status | Procedure Status | Notes |
|------------|----------|----------------------|------------------|-------|
| **Governance (01300)** | [01300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md](./role-permissions/01300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | Template lifecycle management - implemented via JSONB permissions system<br/>**Implementation Details:**<br/>- ✅ `role_definitions` - 7 roles with explicit JSONB permissions implemented<br/>- ⏸️ `user_roles` - Commented out (table appears empty in current database)<br/>- ✅ RLS policies using `permissions ? 'permission_name'` for access control<br/>- ✅ **DISCIPLINE ISOLATION**: Only 01300 department roles (removed cross-discipline roles)<br/>- ✅ **JSONB PERMISSIONS**: Explicit permission arrays instead of level hierarchies |
| **Agent Permissions (System-wide)** | [01300_00000_AGENT_PERMISSIONS_ROLES_PERMISSIONS.md](./role-permissions/01300_00000_AGENT_PERMISSIONS_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | AI agent access control - implemented via role-based permissions system<br/>**Implementation Details:**<br/>- ✅ `agent_permissions` - Role-to-agent permission mappings implemented<br/>- ✅ `user_roles` - **ACTIVE**: Used for RLS policies and user authentication<br/>- ✅ `role_definitions` - Referenced for role validation and permissions<br/>- ✅ RLS policies joining `user_roles.role` → `role_definitions.role_name` → `agent_permissions.role_id`<br/>- ✅ **SYSTEM-WIDE**: Agent permissions apply across all departments |
| **Safety & HSE (02400)** | [01300_02400_SAFETY_HSE_ROLES_PERMISSIONS.md](./role-permissions/01300_02400_SAFETY_HSE_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | Contractor vetting, incident management, HSE compliance - implemented via User Roles Implementation Procedure<br/>**Implementation Details:**<br/>- ✅ `role_definitions` - 14 roles with 105 permissions implemented<br/>- ⏸️ `user_role_assignments` - Commented out (mock data intentionally disabled)<br/>- ⏸️ `user_roles` - Commented out (legacy table, not used in this implementation)<br/>- ✅ `audit_log` - Table created and ready for logging<br/>- ✅ SQL File: `02400_safety_hse_user_roles_implementation.sql` |
| **Procurement (01900)** | [01300_01900_PROCUREMENT_ROLES_PERMISSIONS.md](./role-permissions/01300_01900_PROCUREMENT_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | Vendor management, contract administration - implemented via User Roles Implementation Procedure<br/>**Implementation Details:**<br/>- ✅ `role_definitions` - 13 roles with 75 permissions implemented<br/>- ⏸️ `user_role_assignments` - Commented out (mock data intentionally disabled)<br/>- ⏸️ `user_roles` - Commented out (legacy table, not used in this implementation)<br/>- ✅ `audit_log` - Table created and ready for logging<br/>- ✅ SQL File: `01900_procurement_user_roles_implementation.sql` |
| **Civil Engineering (00850)** | [01300_00850_CIVIL_ENGINEERING_ROLES_PERMISSIONS.md](./role-permissions/01300_00850_CIVIL_ENGINEERING_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | Design approval, construction supervision, QA - implemented via User Roles Implementation Procedure<br/>**Implementation Details:**<br/>- ✅ `role_definitions` - 8 roles with 30 permissions implemented<br/>- ⏸️ `user_role_assignments` - Commented out (mock data intentionally disabled)<br/>- ⏸️ `user_roles` - Commented out (legacy table, not used in this implementation)<br/>- ✅ `audit_log` - Table created and ready for logging |
| **Information Technology (02050)** | [01300_02050_INFORMATION_TECHNOLOGY_ROLES_PERMISSIONS.md](./role-permissions/01300_02050_INFORMATION_TECHNOLOGY_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | System administration, database management, cybersecurity - implemented via User Roles Implementation Procedure<br/>**Implementation Details:**<br/>- ✅ `role_definitions` - 17 roles with 170 permissions implemented<br/>- ⏸️ `user_role_assignments` - Commented out (mock data intentionally disabled)<br/>- ⏸️ `user_roles` - Commented out (legacy table, not used in this implementation)<br/>- ✅ `audit_log` - Table created and ready for logging<br/>- ✅ SQL File: `02050_information_technology_user_roles_implementation.sql` |
| **Other Parties (01850)** | [01300_01850_OTHER_PARTIES_ROLES_PERMISSIONS.md](./role-permissions/01300_01850_OTHER_PARTIES_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | Third-party vendor management, subcontractor coordination, external party access - implemented via User Roles Implementation Procedure<br/>**Implementation Details:**<br/>- ✅ `role_definitions` - 18 roles with 180 permissions implemented (13 internal + 5 external)<br/>- ⏸️ `user_role_assignments` - Commented out (mock data intentionally disabled)<br/>- ⏸️ `user_roles` - Commented out (legacy table, not used in this implementation)<br/>- ✅ `audit_log` - Table created and ready for logging<br/>- ✅ SQL File: `01850_other_parties_user_roles_implementation.sql`<br/>- ✅ **EXTERNAL PARTY ROLES**: Contractors, Subcontractors, Consultants, Vendors, Service Providers with limited access |
| **Finance (01200)** | Finance Roles & Permissions | 📋 **PLANNED** | ❌ Not Started | Financial controls, budget management - needs documentation and implementation |
| **Human Resources (01500)** | [01300_01500_HUMAN_RESOURCES_ROLES_PERMISSIONS.md](./role-permissions/01300_01500_HUMAN_RESOURCES_ROLES_PERMISSIONS.md) | ✅ **FULLY IMPLEMENTED** | ✅ Completed | Employee management, recruitment, CV processing, AI analysis - implemented via User Roles Implementation Procedure<br/>**Implementation Details:**<br/>- ✅ `role_definitions` - 12 roles with 46 permissions implemented<br/>- ⏸️ `user_role_assignments` - Commented out (mock data intentionally disabled)<br/>- ⏸️ `user_roles` - Commented out (legacy table, not used in this implementation)<br/>- ✅ `audit_log` - Table created and ready for logging<br/>- ✅ `job_descriptions`, `cv_applications`, `cv_analyses` - Tables with RLS policies<br/>- ✅ SQL File: `01500_human_resources_user_roles_implementation.sql` |
| **Commercial (01700)** | Commercial Roles & Permissions | 📋 **PLANNED** | ❌ Not Started | Contract management, commercial negotiations - needs documentation and implementation |
| **Operations (01800)** | Operations Roles & Permissions | 📋 **PLANNED** | ❌ Not Started | Facility management, maintenance - needs documentation and implementation |
| **Quality (02200)** | Quality Roles & Permissions | 📋 **PLANNED** | ❌ Not Started | Quality assurance, auditing - needs documentation and implementation |

### 🔄 Implementation Priority Queue

**Next Disciplines for User Roles Implementation Procedure:**
1. **Governance (01300)** - Highest priority due to template management criticality
2. **Safety & HSE (02400)** - Critical for compliance and contractor management
3. **Procurement (01900)** - Important for vendor and contract workflows
4. **Civil Engineering (00850)** - Essential for design and construction oversight

### 🚧 In Progress

| Component | Status | Target Date | Notes |
|-----------|--------|-------------|-------|
| Enhanced Audit Logging | 🔄 Development | Q1 2026 | Comprehensive activity tracking |
| Advanced Permission Inheritance | 🔄 Design | Q1 2026 | Department → user role inheritance |
| Cross-Organization Access | 📋 Planning | Q2 2026 | Multi-organization collaboration |

### 📋 Planned

| Component | Priority | Notes |
|-----------|----------|-------|
| API Security Gateway | High | Centralized API access control |
| Real-time Security Monitoring | High | Live security event monitoring |
| Automated Policy Testing | Medium | RLS policy validation suite |
| Security Training Portal | Medium | User security awareness |

---

## Security Incident Response

### Critical Security Issues

1. **Immediate Actions**:
   - Isolate affected systems
   - Notify security team
   - Preserve evidence
   - Implement temporary restrictions

2. **Investigation Process**:
   - Review audit logs
   - Analyze access patterns
   - Identify root cause
   - Document findings

3. **Recovery Steps**:
   - Restore secure configurations
   - Update security policies
   - Communicate with stakeholders
   - Implement preventive measures

### Contact Information

- **Security Team**: security@constructai.com
- **IT Support**: it-support@constructai.com
- **Emergency**: +1-800-SECURITY

---

## Related Documentation

### Core Security Documents
- [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md) - Documentation standards
- [0500_SUPABASE.md](./0500_SUPABASE.md) - Authentication infrastructure
- [RLS Implementation Guide](./template_system_rls_implementation_guide.md) - RLS best practices

### Department-Specific Security
- [1300_01300_GOVERNANCE.md](./pages-disciplines/1300_01300_GOVERNANCE.md) - Governance security
- [02400 Safety Security](./pages-disciplines/02400-safety/security.md) - Safety department security
- [01900 Procurement Security](./pages-disciplines/01900-procurement/security.md) - Procurement security

### Technical Implementation
- [Database Schemas](./database/schemas/) - All security-related schemas
- [API Security](./api/security/) - API access control
- [Audit Logging](./audit/) - Activity monitoring

---

## Version History

- **v1.0 (2025-12-11)**: Initial master roles and permissions index
  - Comprehensive security documentation index
  - Role hierarchy and permission matrices
  - Implementation status tracking
  - Security incident response procedures
