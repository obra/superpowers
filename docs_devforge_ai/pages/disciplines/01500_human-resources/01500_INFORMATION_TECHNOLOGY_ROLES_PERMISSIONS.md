# 02050_INFORMATION_TECHNOLOGY_ROLES_PERMISSIONS.md

## Information Technology Department - Roles & Permissions

### Status
- [x] Initial draft
- [x] Security review required
- [x] Governance approval pending
- [x] Implementation completed

### Version History
- v1.0 (2025-12-11): Initial roles and permissions framework for Information Technology department

---

## Overview

This document defines the roles, permissions, and access control framework for the Information Technology (02050) department. The department handles all IT infrastructure, system administration, cybersecurity, database management, and technical support across the ConstructAI platform.

### Integration with Existing Security Infrastructure

The Information Technology department integrates with the existing security framework:

- **RLS Security Dashboard**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`
- **Schema Dashboard**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`
- **User Roles Table**: `public.user_roles` with department_code = '02050'
- **System Administration**: Full platform access for IT operations

---

## Core Roles & Permissions Matrix

### 1. IT Leadership Roles (Level 4)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **IT Director** | 02050 | 4 | `it:*`, `system:admin`, `security:*`, `infrastructure:*` | Executive IT leadership and strategic oversight |
| **Chief Information Security Officer** | 02050 | 4 | `security:*`, `compliance:*`, `audit:*`, `risk:*` | Cybersecurity and compliance leadership |

### 2. IT Administration Roles (Level 3-4)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **System Administrator** | 02050 | 4 | `system:*`, `server:*`, `infrastructure:*`, `deployment:*` | System and infrastructure administration |
| **Database Administrator** | 02050 | 3 | `database:*`, `backup:*`, `performance:*`, `schema:*` | Database management and optimization |
| **Network Administrator** | 02050 | 3 | `network:*`, `connectivity:*`, `firewall:*`, `monitoring:*` | Network infrastructure and security |
| **Security Administrator** | 02050 | 3 | `security:manage`, `access:*`, `audit:*`, `incident:*` | Security operations and access control |

### 3. IT Operations Roles (Level 2-3)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **IT Operations Manager** | 02050 | 3 | `operations:*`, `monitoring:*`, `incident:manage`, `reporting:*` | IT operations management |
| **DevOps Engineer** | 02050 | 2 | `deployment:*`, `automation:*`, `ci_cd:*`, `monitoring:*` | Development operations and automation |
| **Cloud Administrator** | 02050 | 2 | `cloud:*`, `infrastructure:cloud`, `scaling:*`, `cost:*` | Cloud infrastructure management |
| **Systems Engineer** | 02050 | 2 | `systems:*`, `virtualization:*`, `storage:*`, `performance:*` | Systems engineering and optimization |

### 4. IT Support Roles (Level 1-2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **IT Support Specialist** | 02050 | 2 | `support:*`, `helpdesk:*`, `user:*`, `troubleshooting:*` | Technical support and user assistance |
| **Help Desk Technician** | 02050 | 1 | `helpdesk:basic`, `user:assist`, `ticket:*`, `documentation:*` | Basic help desk support |
| **Desktop Support Technician** | 02050 | 1 | `desktop:*`, `hardware:*`, `software:*`, `user:support` | Desktop and endpoint support |

### 5. IT Security Roles (Level 2-3)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Security Analyst** | 02050 | 2 | `security:analyze`, `monitoring:*`, `threat:*`, `incident:respond` | Security monitoring and analysis |
| **Compliance Officer** | 02050 | 2 | `compliance:*`, `audit:*`, `policy:*`, `reporting:*` | IT compliance and policy management |
| **Penetration Tester** | 02050 | 2 | `testing:*`, `vulnerability:*`, `assessment:*`, `reporting:*` | Security testing and vulnerability assessment |

---

## Permission Definitions

### IT Core Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `it:manage` | Full IT department management | IT Directors, Managers |
| `it:coordinate` | IT operational coordination | IT Operations Managers |
| `it:view` | View IT information | All IT roles |
| `it:report` | Generate IT reports | IT Managers, Analysts |

### System Administration Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `system:admin` | Full system administration | System Administrators |
| `system:configure` | System configuration | System Administrators, DevOps |
| `system:monitor` | System monitoring | Operations, DevOps |
| `system:troubleshoot` | System troubleshooting | System Administrators, Engineers |

### Database Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `database:admin` | Database administration | Database Administrators |
| `database:backup` | Database backup and recovery | Database Administrators |
| `database:performance` | Database performance tuning | Database Administrators, Engineers |
| `database:schema` | Schema management | Database Administrators |

### Network Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `network:admin` | Network administration | Network Administrators |
| `network:configure` | Network configuration | Network Administrators |
| `network:monitor` | Network monitoring | Network Administrators, Operations |
| `network:security` | Network security | Security Administrators, Network Admins |

### Security Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `security:admin` | Security administration | Security Administrators, CISO |
| `security:monitor` | Security monitoring | Security Analysts, Administrators |
| `security:incident` | Security incident response | Security Team |
| `security:audit` | Security auditing | Compliance Officers, Security Admins |

### Cloud & Infrastructure Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `cloud:admin` | Cloud administration | Cloud Administrators |
| `cloud:provision` | Cloud resource provisioning | Cloud Administrators, DevOps |
| `infrastructure:manage` | Infrastructure management | System Administrators |
| `infrastructure:monitor` | Infrastructure monitoring | Operations, DevOps |

### Support Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `support:admin` | Support administration | IT Support Specialists |
| `support:ticket` | Ticket management | Support Specialists, Technicians |
| `helpdesk:manage` | Help desk management | Support Specialists |
| `user:assist` | User assistance | All Support roles |

---

## IT Workflow Permissions

### System Administration Process

```
SYSTEM REQUEST ────► APPROVAL ────► IMPLEMENTATION ────► TESTING ────► DEPLOYMENT
      ↓                 ↓              ↓                  ↓            ↓
  Change Request   Manager Review   System Admin       QA Testing   Production
  (Any User)       (IT Manager)     Implementation     (DevOps)     (Operations)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Change Request** | `change:request` | All authenticated users |
| **Approval** | `change:approve`, `risk:assess` | IT Managers, System Admins |
| **Implementation** | `system:configure`, `deployment:*` | System Administrators, DevOps |
| **Testing** | `testing:*`, `validation:*` | DevOps Engineers, QA |
| **Deployment** | `deployment:*`, `monitoring:*` | DevOps, Operations |

### Security Incident Response Process

```
INCIDENT DETECT ────► ASSESSMENT ────► CONTAINMENT ────► ERADICATION ────► RECOVERY
      ↓                  ↓               ↓                ↓               ↓
  Alert Trigger     Severity Analysis  Isolation        Root Cause     System Restore
  (Monitoring)      (Security Analyst) (Security Admin) (Security Team) (Operations)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Detection** | `monitoring:*`, `alert:*` | Monitoring Systems, Analysts |
| **Assessment** | `incident:assess`, `severity:classify` | Security Analysts |
| **Containment** | `incident:contain`, `isolation:*` | Security Administrators |
| **Eradication** | `incident:eradicate`, `forensic:*` | Security Team |
| **Recovery** | `recovery:*`, `validation:*` | Operations, DevOps |

---

## Database Schema Integration

### IT-Specific Tables

```sql
-- IT system inventory
CREATE TABLE public.it_system_inventory (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  system_name text NOT NULL,
  system_type text NOT NULL,
  environment text DEFAULT 'production',
  owner_id text NOT NULL,
  technical_contact text,
  business_criticality text,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT it_system_inventory_pkey PRIMARY KEY (id)
);

-- IT change requests
CREATE TABLE public.it_change_requests (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  description text,
  requester_id text NOT NULL,
  approver_id text,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  scheduled_date timestamp with time zone,
  completed_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT it_change_requests_pkey PRIMARY KEY (id)
);

-- IT security incidents
CREATE TABLE public.it_security_incidents (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  incident_type text NOT NULL,
  severity text,
  reported_by text NOT NULL,
  assigned_to text,
  description text,
  status text DEFAULT 'open',
  resolution text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT it_security_incidents_pkey PRIMARY KEY (id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on IT tables
ALTER TABLE it_system_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_security_incidents ENABLE ROW LEVEL SECURITY;

-- IT department access policy
CREATE POLICY "it_department_access" ON it_system_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '02050'
    )
  );

-- Change request policies
CREATE POLICY "change_request_create" ON it_change_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "change_request_view" ON it_change_requests
  FOR SELECT USING (
    requester_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '02050'
      AND level >= 2
    )
  );

-- Security incident policies (restricted access)
CREATE POLICY "security_incident_access" ON it_security_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '02050'
      AND level >= 2
    )
  );
```

---

## Role Assignment Guidelines

### Automatic Role Assignment

1. **Department-Based Assignment**
   - Users in department 02050 automatically get base IT permissions
   - Level 1: Help Desk Technician or Desktop Support roles
   - Level 2: IT Support Specialist or Security Analyst roles
   - Level 3+: System Administrator or Database Administrator roles

2. **Specialization-Based Assignment**
   - **Infrastructure focus**: System Administrator, Network Administrator roles
   - **Security focus**: Security Administrator, CISO roles
   - **Database focus**: Database Administrator roles
   - **Support focus**: IT Support Specialist, Help Desk roles

3. **Project-Based Permissions**
   - Project IT coordinators get additional project-specific permissions
   - Emergency response team members get specialized incident response permissions

### Manual Role Assignment

- **IT Director** assigns specialized roles (System Administrator, Database Administrator)
- **Department Heads** can request IT role elevations for their team members
- **Governance Team** approves all IT role assignment requests

---

## IT-Specific Security Requirements

### Data Classification

| Data Type | Classification | Access Requirements |
|-----------|----------------|-------------------|
| **System Credentials** | Restricted | IT Administrators only |
| **Security Incident Reports** | Confidential | IT Security team + management |
| **Change Request Details** | Internal | IT department + requesters |
| **System Inventory** | Internal | IT department |
| **Audit Logs** | Restricted | IT Security + compliance |

### Audit Logging Requirements

All IT operations must be logged:

```sql
CREATE TABLE public.it_audit_log (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id text NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now()
);
```

### Compliance Monitoring

- **Monthly security reports** to IT Director
- **Quarterly system audits** of infrastructure
- **Annual penetration testing** of systems
- **Real-time monitoring** of critical IT systems

---

## Implementation Checklist

### Phase 1: Core IT Permissions
- [x] Create IT-specific user roles in user_roles table
- [x] Implement department-based automatic role assignment
- [x] Add RLS policies to IT tables
- [x] Create IT audit logging system

### Phase 2: Infrastructure Integration
- [x] Integrate system administration permissions
- [x] Implement change management workflows
- [x] Add security incident response permissions
- [x] Create monitoring and alerting system

### Phase 3: Advanced Features
- [x] Implement DevOps and automation permissions
- [x] Add cloud infrastructure management access controls
- [x] Create compliance reporting dashboards
- [x] Develop IT service management system

---

## Related Documentation

- [RLSSecurityDashboard.jsx](../client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx) - Security management UI
- [SchemaDashboard.jsx](../client/src/pages/02050-information-technology/components/SchemaDashboard.jsx) - Database schema management
- [0000_MASTER_ROLES_PERMISSIONS_INDEX.md](../0000_MASTER_ROLES_PERMISSIONS_INDEX.md) - Master security index

---

## Version History

- **v1.0 (2025-12-11)**: Initial IT roles and permissions framework
  - Defined comprehensive IT role hierarchy
  - Integrated system administration and security permissions
  - Added RLS policies for IT data security
  - Created workflow-based permission assignments

# TODO LIST RECOMMENDED

When starting a new task, it is recommended to create a todo list.


1. Include the task_progress parameter in your next tool call
2. Create a comprehensive checklist of all steps needed
3. Use markdown format: - [ ] for incomplete, - [x] for complete

**Benefits of creating a todo list now:**
	- Clear roadmap for implementation
	- Progress tracking throughout the task
	- Nothing gets forgotten or missed
	- Users can see, monitor, and edit the plan

**Example structure:**```
- [ ] Analyze requirements
- [ ] Set up necessary files
- [ ] Implement main functionality
- [ ] Handle edge cases
- [ ] Test the implementation
- [ ] Verify results```

Keeping the todo list updated helps track progress and ensures nothing is missed.
