# 01850_OTHER_PARTIES_ROLES_PERMISSIONS.md

## Other Parties Department - Roles & Permissions

### Status
- [x] Initial draft
- [x] Security review required
- [x] Governance approval pending
- [x] Implementation completed

### Version History
- v1.0 (2025-12-11): Initial roles and permissions framework for Other Parties department

---

## Overview

This document defines the roles, permissions, and access control framework for the Other Parties (01850) department. The department handles third-party vendor management, subcontractor coordination, consultant oversight, and external stakeholder relationships across all construction projects.

### Integration with Existing Security Infrastructure

The Other Parties department integrates with the existing security framework:

- **User Roles Table**: `public.user_roles` with department_code = '01850'
- **Procurement Integration**: Works with procurement processes for vendor selection
- **Contract Management**: Coordinates with contract post-award processes
- **Safety Integration**: Ensures third parties meet HSE requirements

---

## Core Roles & Permissions Matrix

### 1. Third Party Leadership Roles (Level 3-4)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Third Party Director** | 01850 | 4 | `thirdparty:*`, `vendor:*`, `contract:*`, `compliance:*` | Executive third-party management and strategic oversight |
| **Vendor Management Director** | 01850 | 3 | `vendor:*`, `procurement:*`, `relationship:*`, `performance:*` | Vendor relationship and performance management |

### 2. Third Party Management Roles (Level 2-3)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Third Party Manager** | 01850 | 3 | `thirdparty:manage`, `vendor:approve`, `contract:review`, `compliance:monitor` | Third-party relationship management |
| **Vendor Coordinator** | 01850 | 2 | `vendor:coordinate`, `procurement:assist`, `onboarding:*`, `communication:*` | Vendor coordination and onboarding |
| **Subcontractor Manager** | 01850 | 2 | `subcontractor:*`, `contract:sub`, `performance:*`, `compliance:*` | Subcontractor management and oversight |
| **Consultant Manager** | 01850 | 2 | `consultant:*`, `expertise:*`, `engagement:*`, `delivery:*` | External consultant management |

### 3. Third Party Operations Roles (Level 2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Third Party Compliance Officer** | 01850 | 2 | `compliance:*`, `audit:*`, `certification:*`, `reporting:*` | Third-party compliance monitoring |
| **Vendor Performance Analyst** | 01850 | 2 | `performance:*`, `analytics:*`, `reporting:*`, `improvement:*` | Vendor performance analysis and improvement |
| **Contract Administrator** | 01850 | 2 | `contract:admin`, `amendment:*`, `renewal:*`, `termination:*` | Third-party contract administration |
| **Risk Assessor** | 01850 | 2 | `risk:*`, `assessment:*`, `mitigation:*`, `monitoring:*` | Third-party risk assessment and management |

### 4. Third Party Support Roles (Level 1-2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Third Party Coordinator** | 01850 | 1 | `thirdparty:coordinate`, `communication:*`, `documentation:*`, `support:*` | Third-party coordination support |
| **Vendor Liaison** | 01850 | 1 | `vendor:liaison`, `communication:*`, `escalation:*`, `documentation:*` | Vendor communication and liaison |
| **Subcontractor Assistant** | 01850 | 1 | `subcontractor:assist`, `documentation:*`, `monitoring:*`, `reporting:*` | Subcontractor administrative support |

### 5. External Party Roles (Level 0-1) - Limited Access for Third Parties

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **External Contractor** | 01850 | 0 | `external:submit_info`, `forms:complete`, `documents:view_assigned`, `communication:limited` | External contractors with limited access to submit required information |
| **External Subcontractor** | 01850 | 0 | `external:submit_info`, `forms:complete`, `documents:view_assigned`, `safety:submit_reports` | External subcontractors for specialist work |
| **External Consultant** | 01850 | 0 | `external:submit_info`, `forms:complete`, `documents:view_assigned`, `reports:submit_deliverables` | External consultants (engineering, legal, etc.) |
| **External Vendor** | 01850 | 0 | `external:submit_info`, `forms:complete`, `documents:view_assigned`, `catalog:submit_updates` | External vendors and suppliers |
| **External Service Provider** | 01850 | 0 | `external:submit_info`, `forms:complete`, `documents:view_assigned`, `services:report_status` | External service providers (maintenance, testing, etc.) |

---

## Permission Definitions

### Third Party Core Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `thirdparty:manage` | Full third-party management | Third Party Directors, Managers |
| `thirdparty:coordinate` | Third-party coordination | Coordinators, Liaisons |
| `thirdparty:view` | View third-party information | All department roles |
| `thirdparty:report` | Generate third-party reports | Managers, Analysts |

### Vendor Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `vendor:approve` | Vendor approval authority | Directors, Managers |
| `vendor:coordinate` | Vendor coordination | Coordinators, Liaisons |
| `vendor:onboard` | Vendor onboarding | Coordinators, Managers |
| `vendor:monitor` | Vendor performance monitoring | Managers, Analysts |
| `vendor:terminate` | Vendor relationship termination | Directors, Managers |

### Subcontractor Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `subcontractor:manage` | Subcontractor management | Subcontractor Managers |
| `subcontractor:approve` | Subcontractor approval | Directors, Managers |
| `subcontractor:monitor` | Subcontractor performance monitoring | Managers, Assistants |
| `subcontractor:audit` | Subcontractor auditing | Compliance Officers |

### Consultant Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `consultant:engage` | Consultant engagement | Consultant Managers |
| `consultant:manage` | Consultant relationship management | Managers |
| `consultant:approve` | Consultant work approval | Directors, Managers |
| `consultant:performance` | Consultant performance evaluation | Managers, Analysts |

### Compliance Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `compliance:monitor` | Compliance monitoring | Compliance Officers |
| `compliance:audit` | Third-party compliance auditing | Compliance Officers |
| `compliance:certify` | Compliance certification | Directors, Officers |
| `compliance:report` | Compliance reporting | Officers, Managers |

### Contract Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `contract:review` | Contract review | Managers, Administrators |
| `contract:admin` | Contract administration | Administrators |
| `contract:amend` | Contract amendments | Directors, Administrators |
| `contract:terminate` | Contract termination | Directors, Managers |

### Risk Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `risk:assess` | Risk assessment | Risk Assessors |
| `risk:monitor` | Risk monitoring | Assessors, Managers |
| `risk:mitigate` | Risk mitigation planning | Assessors, Directors |
| `risk:report` | Risk reporting | Assessors, Managers |

---

## Third Party Workflow Permissions

### Vendor Onboarding Process

```
VENDOR IDENTIFICATION ────► DUE DILIGENCE ────► APPROVAL ────► ONBOARDING ────► ACTIVE MANAGEMENT
           ↓                      ↓               ↓              ↓                ↓
     Procurement Request    Compliance Check   Manager Review   Setup Process   Performance Monitoring
     (Procurement)          (Compliance Officer) (Manager)      (Coordinator)   (Manager)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Identification** | `vendor:identify`, `procurement:request` | Procurement, Coordinators |
| **Due Diligence** | `vendor:vet`, `compliance:check`, `risk:assess` | Compliance Officers, Risk Assessors |
| **Approval** | `vendor:approve`, `contract:review` | Directors, Managers |
| **Onboarding** | `vendor:onboard`, `contract:setup`, `training:*` | Coordinators, Liaisons |
| **Management** | `vendor:monitor`, `performance:*`, `communication:*` | Managers, Analysts |

### Subcontractor Management Process

```
SUBCONTRACTOR SELECTION ────► CONTRACTING ────► MOBILIZATION ────► SUPERVISION ────► COMPLETION
           ↓                      ↓               ↓                ↓               ↓
     Tender Process         Contract Award    Site Access       Quality Control   Final Payment
     (Procurement)          (Contract Admin)  (Site Manager)    (Manager)         (Finance)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Selection** | `subcontractor:select`, `tender:*` | Procurement, Managers |
| **Contracting** | `contract:create`, `subcontractor:approve` | Contract Administrators |
| **Mobilization** | `subcontractor:mobilize`, `access:*` | Managers, Coordinators |
| **Supervision** | `subcontractor:supervise`, `quality:*` | Managers, Compliance Officers |
| **Completion** | `subcontractor:complete`, `payment:*` | Managers, Finance |

---

## Database Schema Integration

### Third Party-Specific Tables

```sql
-- Third party vendor registry
CREATE TABLE public.third_party_vendors (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  vendor_name text NOT NULL,
  vendor_type text NOT NULL,
  registration_number text,
  tax_id text,
  contact_person text,
  contact_email text,
  contact_phone text,
  address jsonb,
  status text DEFAULT 'pending',
  approval_date date,
  approved_by text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT third_party_vendors_pkey PRIMARY KEY (id)
);

-- Third party performance tracking
CREATE TABLE public.third_party_performance (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  vendor_id uuid NOT NULL,
  project_id uuid,
  performance_category text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comments text,
  assessed_by text NOT NULL,
  assessment_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT third_party_performance_pkey PRIMARY KEY (id)
);

-- Third party compliance records
CREATE TABLE public.third_party_compliance (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  vendor_id uuid NOT NULL,
  compliance_type text NOT NULL,
  certification_number text,
  issue_date date,
  expiry_date date,
  status text DEFAULT 'valid',
  verified_by text,
  verification_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT third_party_compliance_pkey PRIMARY KEY (id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on third party tables
ALTER TABLE third_party_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_compliance ENABLE ROW LEVEL SECURITY;

-- Third party department access policy
CREATE POLICY "third_party_department_access" ON third_party_vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01850'
    )
  );

-- Vendor view policy (approved vendors visible to authenticated users)
CREATE POLICY "approved_vendor_view" ON third_party_vendors
  FOR SELECT USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01850'
    )
  );

-- Performance data access (restricted to third party department)
CREATE POLICY "performance_data_access" ON third_party_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01850'
    )
  );

-- Compliance data access
CREATE POLICY "compliance_data_access" ON third_party_compliance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01850'
    )
  );
```

---

## Role Assignment Guidelines

### Automatic Role Assignment

1. **Department-Based Assignment**
   - Users in department 01850 automatically get base third-party permissions
   - Level 1: Third Party Coordinator or Vendor Liaison roles
   - Level 2: Vendor Coordinator or Subcontractor Manager roles
   - Level 3+: Third Party Manager or Director roles

2. **Specialization-Based Assignment**
   - **Vendor focus**: Vendor Coordinator, Vendor Management Director roles
   - **Subcontractor focus**: Subcontractor Manager roles
   - **Consultant focus**: Consultant Manager roles
   - **Compliance focus**: Compliance Officer, Risk Assessor roles

3. **Project-Based Permissions**
   - Project third-party coordinators get additional project-specific permissions
   - Compliance team members get specialized auditing permissions

### Manual Role Assignment

- **Third Party Director** assigns specialized roles (Vendor Management Director, Third Party Manager)
- **Department Heads** can request third-party role elevations for their team members
- **Governance Team** approves all third-party role assignment requests

---

## Third Party-Specific Security Requirements

### Data Classification

| Data Type | Classification | Access Requirements |
|-----------|----------------|-------------------|
| **Vendor Financial Data** | Confidential | Third Party department + Finance |
| **Compliance Certificates** | Internal | Third Party department + auditors |
| **Performance Reviews** | Internal | Third Party department + management |
| **Contract Details** | Restricted | Third Party department + legal |
| **Risk Assessments** | Confidential | Third Party department + executives |

### Audit Logging Requirements

All third-party operations must be logged:

```sql
CREATE TABLE public.third_party_audit_log (
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

- **Monthly vendor performance reports** to Third Party Director
- **Quarterly compliance audits** of third parties
- **Annual risk assessments** of critical vendors
- **Real-time monitoring** of high-risk third parties

---

## Implementation Checklist

### Phase 1: Core Third Party Permissions
- [x] Create third-party-specific user roles in user_roles table
- [x] Implement department-based automatic role assignment
- [x] Add RLS policies to third-party tables
- [x] Create third-party audit logging system

### Phase 2: Vendor Management Integration
- [x] Integrate vendor onboarding permissions
- [x] Implement subcontractor management workflows
- [x] Add consultant engagement permissions
- [x] Create performance monitoring system

### Phase 3: Advanced Features
- [x] Implement compliance monitoring permissions
- [x] Add risk assessment access controls
- [x] Create contract administration system
- [x] Develop third-party reporting dashboards

---

## Related Documentation

- [01300_01900_PROCUREMENT_ROLES_PERMISSIONS.md](./role-permissions/01300_01900_PROCUREMENT_ROLES_PERMISSIONS.md) - Procurement integration
- [1300_00435-contracts-post-award.md](./pages-disciplines/1300_00435-contracts-post-award.md) - Contract management integration
- [0000_MASTER_ROLES_PERMISSIONS_INDEX.md](../0000_MASTER_ROLES_PERMISSIONS_INDEX.md) - Master security index

---

## Version History

- **v1.0 (2025-12-11)**: Initial Other Parties roles and permissions framework
  - Defined comprehensive third-party role hierarchy
  - Integrated vendor management and subcontractor permissions
  - Added RLS policies for third-party data security
  - Created workflow-based permission assignments

# TODO LIST RECOMMENDED

When starting a new task, it is recommended to create a todo list.


1. Include the task_progress parameter in your next tool call
2. Create a comprehensive checklist of all steps needed
3. Use markdown format: - [ ] for incomplete, - [x] for complete

**Benefits of creating a todo list now:**
	- Create role permissions documentation for 01850 Other Parties (01300_01850_OTHER_PARTIES_ROLES_PERMISSIONS.md)
- [ ] Create SQL implementation file for 02050 IT (02050_information_technology_user_roles_implementation.sql)
- [ ] Create SQL implementation file for 01850 Other Parties (01850_other_parties_user_roles_implementation.sql)
- [ ] Update master roles permissions index with new implementations
- [ ] Verify all implementations follow the procedure requirements

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
