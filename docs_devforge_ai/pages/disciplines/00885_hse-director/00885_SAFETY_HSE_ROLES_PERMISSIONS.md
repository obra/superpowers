# 02400_SAFETY_HSE_ROLES_PERMISSIONS.md

## Safety & HSE Department - Roles & Permissions

### Status
- [x] Initial draft
- [x] Security review required
- [x] Governance approval pending
- [x] Implementation completed

### Version History
- v1.0 (2025-12-11): Initial roles and permissions framework for Safety & HSE department

---

## Overview

This document defines the roles, permissions, and access control framework for the Safety & HSE (02400) department. The department handles health, safety, environmental, and security compliance across all construction projects, including contractor vetting, risk assessments, HSE questionnaires, and incident management.

### Integration with Existing Security Infrastructure

The Safety & HSE department integrates with the existing security framework:

- **RLS Security Dashboard**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`
- **Schema Dashboard**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`
- **User Roles Table**: `public.user_roles` with department_code = '02400'
- **Template Management**: HSE questionnaire templates managed through governance

---

## Core Roles & Permissions Matrix

### 1. HSE Leadership Roles (Level 3-4)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **HSE Director** | 02400 | 4 | `hse:*`, `contractor:approve_final`, `incident:investigate_critical`, `audit:conduct`, `report:executive` | Executive HSE leadership and oversight |
| **HSE Manager** | 02400 | 3 | `hse:manage`, `contractor:approve`, `incident:investigate`, `audit:supervise`, `report:departmental` | Department-level HSE management |
| **Safety Manager** | 02400 | 3 | `safety:*`, `inspection:schedule`, `training:approve`, `equipment:certify` | Safety program management |

### 2. HSE Operations Roles (Level 2-3)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **HSE Coordinator** | 02400 | 2 | `contractor:vet`, `inspection:conduct`, `training:deliver`, `incident:report` | Day-to-day HSE coordination |
| **Safety Officer** | 02400 | 2 | `safety:inspect`, `training:conduct`, `equipment:inspect`, `incident:investigate_minor` | Field safety inspections and training |
| **Environmental Officer** | 02400 | 2 | `environmental:monitor`, `permit:process`, `compliance:check`, `waste:supervise` | Environmental monitoring and compliance |
| **HSE Administrator** | 02400 | 2 | `document:manage`, `report:generate`, `database:update`, `audit:assist` | HSE documentation and administration |

### 3. HSE Specialist Roles (Level 2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Risk Assessor** | 02400 | 2 | `risk:assess`, `hazard:identify`, `mitigation:recommend`, `jha:create` | Risk assessment and hazard analysis |
| **Training Specialist** | 02400 | 2 | `training:develop`, `curriculum:design`, `certification:manage`, `compliance:training` | HSE training program development |
| **Emergency Response Coordinator** | 02400 | 2 | `emergency:plan`, `drill:coordinate`, `response:lead`, `equipment:emergency` | Emergency preparedness and response |
| **HSE Auditor** | 02400 | 2 | `audit:conduct`, `nonconformance:identify`, `corrective_action:track`, `compliance:verify` | Internal HSE auditing |

### 4. HSE Support Roles (Level 1-2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **HSE Assistant** | 02400 | 1 | `document:view`, `report:view`, `training:attend`, `incident:report_basic` | Administrative support for HSE activities |
| **Safety Observer** | 02400 | 1 | `observation:submit`, `near_miss:report`, `unsafe_condition:report` | Field safety observations and reporting |
| **Contractor HSE Liaison** | 02400 | 1 | `contractor:monitor`, `subcontractor:coordinate`, `compliance:verify_basic` | Contractor HSE coordination |

---

## Permission Definitions

### HSE Core Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `hse:manage` | Full HSE department management | HSE Managers, Directors |
| `hse:coordinate` | HSE operational coordination | HSE Coordinators |
| `hse:view` | View HSE information | All HSE roles |
| `hse:report` | Generate HSE reports | HSE Officers, Managers |

### Contractor Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `contractor:vet` | Conduct contractor HSE vetting | HSE Coordinators, Officers |
| `contractor:approve` | Approve contractor HSE qualifications | HSE Managers |
| `contractor:approve_final` | Final contractor approval authority | HSE Directors |
| `contractor:monitor` | Monitor contractor HSE compliance | HSE Coordinators, Liaisons |
| `contractor:blacklist` | Blacklist non-compliant contractors | HSE Managers |

### Safety & Inspection Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `safety:inspect` | Conduct safety inspections | Safety Officers |
| `safety:certify` | Issue safety certifications | Safety Managers |
| `inspection:schedule` | Schedule inspections | HSE Coordinators, Managers |
| `inspection:conduct` | Perform inspections | Safety Officers |
| `inspection:approve` | Approve inspection results | HSE Managers |

### Incident Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `incident:report` | Report incidents | All HSE roles |
| `incident:investigate` | Investigate incidents | HSE Officers, Coordinators |
| `incident:investigate_critical` | Investigate critical incidents | HSE Managers, Directors |
| `incident:close` | Close incident investigations | HSE Managers |

### Training & Certification Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `training:develop` | Develop training programs | Training Specialists |
| `training:deliver` | Deliver training sessions | HSE Coordinators, Officers |
| `training:approve` | Approve training programs | HSE Managers |
| `certification:manage` | Manage HSE certifications | Training Specialists |
| `certification:issue` | Issue HSE certifications | HSE Managers |

### Environmental Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `environmental:monitor` | Environmental monitoring | Environmental Officers |
| `environmental:assess` | Environmental impact assessment | Environmental Managers |
| `permit:process` | Process environmental permits | Environmental Officers |
| `permit:approve` | Approve environmental permits | Environmental Managers |
| `waste:manage` | Hazardous waste management | Environmental Officers |

### Audit & Compliance Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `audit:conduct` | Conduct HSE audits | HSE Auditors, Managers |
| `audit:supervise` | Supervise audit programs | HSE Managers |
| `compliance:monitor` | Monitor regulatory compliance | All HSE roles |
| `compliance:report` | Report compliance issues | HSE Officers, Managers |
| `nonconformance:identify` | Identify nonconformances | HSE Auditors |
| `corrective_action:track` | Track corrective actions | HSE Coordinators |

---

## HSE Workflow Permissions

### Contractor Vetting Process

```
CONTRACTOR APPLICATION ────► HSE VETTING ────► APPROVAL ────► ACTIVE STATUS
       ↓                           ↓              ↓              ↓
   Document Review            Safety Check   Manager Review   Ongoing Monitoring
   (HSE Assistant)           (Coordinator)   (Manager)       (Coordinator)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Application Review** | `contractor:review`, `document:verify` | HSE Assistants, Coordinators |
| **HSE Vetting** | `contractor:vet`, `safety:assess`, `environmental:check` | HSE Coordinators, Officers |
| **Technical Approval** | `contractor:approve`, `risk:assess` | HSE Managers |
| **Final Approval** | `contractor:approve_final` | HSE Directors |
| **Ongoing Monitoring** | `contractor:monitor`, `compliance:verify` | HSE Coordinators, Liaisons |

### Incident Management Process

```
INCIDENT REPORT ────► INITIAL ASSESSMENT ────► INVESTIGATION ────► RESOLUTION
      ↓                      ↓                      ↓                 ↓
  Immediate Report      Severity Classification   Root Cause       Corrective Actions
  (Any HSE Role)        (HSE Coordinator)        (Officer)         (Manager)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Incident Reporting** | `incident:report` | All HSE roles |
| **Initial Assessment** | `incident:assess`, `severity:classify` | HSE Coordinators |
| **Investigation** | `incident:investigate`, `evidence:collect` | HSE Officers, Coordinators |
| **Critical Investigation** | `incident:investigate_critical` | HSE Managers, Directors |
| **Resolution** | `incident:close`, `corrective_action:implement` | HSE Managers |

---

## Database Schema Integration

### HSE-Specific Tables

```sql
-- HSE contractor vetting records
CREATE TABLE public.hse_contractor_vetting (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  vetting_officer_id text NOT NULL,
  safety_score integer,
  environmental_score integer,
  training_score integer,
  overall_rating text,
  approval_status text DEFAULT 'pending',
  approved_by text,
  approved_at timestamp with time zone,
  valid_until date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hse_contractor_vetting_pkey PRIMARY KEY (id)
);

-- HSE inspection records
CREATE TABLE public.hse_inspections (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  inspection_type text NOT NULL,
  location text,
  inspector_id text NOT NULL,
  project_id uuid,
  findings jsonb,
  recommendations jsonb,
  severity_level text,
  due_date date,
  completion_date date,
  status text DEFAULT 'scheduled',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hse_inspections_pkey PRIMARY KEY (id)
);

-- HSE incident reports
CREATE TABLE public.hse_incidents (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  reported_by text NOT NULL,
  incident_date timestamp with time zone,
  location text,
  description text,
  severity text,
  investigation_status text DEFAULT 'pending',
  investigator_id text,
  root_cause text,
  corrective_actions jsonb,
  lessons_learned text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hse_incidents_pkey PRIMARY KEY (id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on HSE tables
ALTER TABLE hse_contractor_vetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE hse_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hse_incidents ENABLE ROW LEVEL SECURITY;

-- HSE department access policy
CREATE POLICY "hse_department_access" ON hse_contractor_vetting
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '02400'
    )
  );

-- Contractor view policy (for approved contractors)
CREATE POLICY "approved_contractor_view" ON hse_contractor_vetting
  FOR SELECT USING (approval_status = 'approved');

-- Incident reporting policy (all authenticated users can report)
CREATE POLICY "incident_reporting" ON hse_incidents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Incident investigation policy (HSE roles only)
CREATE POLICY "incident_investigation" ON hse_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '02400'
      AND level >= 2
    )
  );
```

---

## Role Assignment Guidelines

### Automatic Role Assignment

1. **Department-Based Assignment**
   - Users in department 02400 automatically get base HSE permissions
   - Level 1: HSE Assistant or Safety Observer roles
   - Level 2: HSE Officer or Coordinator roles
   - Level 3+: HSE Manager or Director roles

2. **Specialization-Based Assignment**
   - **Safety focus**: Safety Officer/Manager roles
   - **Environmental focus**: Environmental Officer/Manager roles
   - **Training focus**: Training Specialist roles
   - **Audit focus**: HSE Auditor roles

3. **Project-Based Permissions**
   - Project HSE coordinators get additional project-specific permissions
   - Emergency response team members get specialized emergency permissions

### Manual Role Assignment

- **HSE Director** assigns specialized roles (Safety Manager, Environmental Manager)
- **Department Heads** can request HSE role elevations for their team members
- **Governance Team** approves all HSE role assignment requests

---

## HSE-Specific Security Requirements

### Data Classification

| Data Type | Classification | Access Requirements |
|-----------|----------------|-------------------|
| **Contractor HSE Records** | Confidential | HSE department only |
| **Incident Reports** | Restricted | HSE department + management |
| **Safety Training Records** | Internal | All employees |
| **Environmental Permits** | Public | Approved permits viewable |
| **Audit Reports** | Confidential | HSE department + audited parties |

### Audit Logging Requirements

All HSE operations must be logged:

```sql
CREATE TABLE public.hse_audit_log (
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

- **Monthly compliance reports** to HSE Director
- **Quarterly audit reviews** of role assignments
- **Annual security assessments** of HSE systems
- **Real-time monitoring** of critical HSE operations

---

## Implementation Checklist

### Phase 1: Core HSE Permissions
- [x] Create HSE-specific user roles in user_roles table
- [x] Implement department-based automatic role assignment
- [x] Add RLS policies to HSE tables
- [x] Create HSE audit logging system

### Phase 2: Workflow Integration
- [x] Integrate contractor vetting permissions
- [x] Implement incident management workflows
- [x] Add inspection scheduling permissions
- [x] Create training certification system

### Phase 3: Advanced Features
- [x] Implement emergency response permissions
- [x] Add environmental monitoring access controls
- [x] Create audit trail automation
- [x] Develop compliance reporting dashboards

---

## Related Documentation

- [1300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md](./1300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md) - HSE questionnaire templates
- [02400-contractor-vetting/README.md](../client/src/pages/02400-safety/02400-contractor-vetting/README.md) - Contractor vetting system
- [1300_02400_HSE_MASTER_GUIDE.md](./1300_02400_HSE_MASTER_GUIDE.md) - HSE master documentation
- [0000_MASTER_ROLES_PERMISSIONS_INDEX.md](../0000_MASTER_ROLES_PERMISSIONS_INDEX.md) - Master security index

---

## Version History

- **v1.0 (2025-12-11)**: Initial HSE roles and permissions framework
  - Defined comprehensive HSE role hierarchy
  - Integrated contractor vetting and incident management permissions
  - Added RLS policies for HSE data security
  - Created workflow-based permission assignments
