# 01900_PROCUREMENT_ROLES_PERMISSIONS.md

## Procurement Department - Roles & Permissions

### Status
- [x] Initial draft
- [x] Security review required
- [ ] Governance approval pending
- [ ] Implementation completed

### Version History
- v1.0 (2025-12-11): Initial roles and permissions framework for Procurement department

---

## Overview

This document defines the roles, permissions, and access control framework for the Procurement (01900) department. The department manages all procurement activities including vendor management, contract administration, purchase orders, supplier qualification, and procurement compliance across construction projects.

### Integration with Existing Security Infrastructure

The Procurement department integrates with the existing security framework:

- **RLS Security Dashboard**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`
- **Schema Dashboard**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`
- **User Roles Table**: `public.user_roles` with department_code = '01900'
- **Template Management**: Procurement templates managed through governance

---

## Core Roles & Permissions Matrix

### 1. Procurement Leadership Roles (Level 3-4)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Procurement Director** | 01900 | 4 | `procurement:*`, `contract:approve_final`, `vendor:blacklist`, `budget:approve_unlimited`, `audit:conduct` | Executive procurement leadership and oversight |
| **Procurement Manager** | 01900 | 3 | `procurement:manage`, `contract:approve`, `vendor:qualify`, `budget:approve_high`, `report:departmental` | Department-level procurement management |
| **Contract Manager** | 01900 | 3 | `contract:*`, `negotiation:lead`, `compliance:contract`, `supplier:manage` | Contract administration and supplier management |
| **Strategic Sourcing Manager** | 01900 | 3 | `sourcing:*`, `strategy:develop`, `market:analyze`, `framework:establish` | Strategic sourcing and market analysis |

### 2. Procurement Operations Roles (Level 2-3)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Procurement Coordinator** | 01900 | 2 | `purchase:create`, `vendor:evaluate`, `requisition:process`, `order:track` | Day-to-day procurement coordination |
| **Buyer** | 01900 | 2 | `purchase:execute`, `supplier:negotiate`, `order:place`, `delivery:monitor` | Purchase execution and supplier negotiation |
| **Contract Administrator** | 01900 | 2 | `contract:administer`, `compliance:monitor`, `variation:process`, `closeout:manage` | Contract administration and compliance |
| **Procurement Analyst** | 01900 | 2 | `data:analyze`, `report:generate`, `performance:monitor`, `benchmark:create` | Procurement analytics and reporting |

### 3. Procurement Specialist Roles (Level 2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Vendor Qualification Specialist** | 01900 | 2 | `vendor:qualify`, `audit:supplier`, `certification:verify`, `prequalification:manage` | Supplier qualification and prequalification |
| **Category Manager** | 01900 | 2 | `category:manage`, `strategy:category`, `spend:analyze`, `supplier:category` | Category management and spend analysis |
| **Import/Export Specialist** | 01900 | 2 | `import:manage`, `export:coordinate`, `customs:handle`, `compliance:trade` | International trade and customs management |
| **Procurement Auditor** | 01900 | 2 | `audit:conduct`, `compliance:verify`, `process:audit`, `improvement:recommend` | Internal procurement auditing |

### 4. Procurement Support Roles (Level 1-2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Procurement Assistant** | 01900 | 1 | `document:process`, `data:entry`, `communication:coordinate`, `filing:manage` | Administrative support for procurement activities |
| **Purchase Requisition Clerk** | 01900 | 1 | `requisition:create`, `approval:route`, `tracking:update` | Purchase requisition processing |
| **Supplier Liaison** | 01900 | 1 | `supplier:communicate`, `status:monitor`, `issue:escalate` | Supplier relationship coordination |

---

## Permission Definitions

### Procurement Core Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `procurement:manage` | Full procurement department management | Procurement Managers, Directors |
| `procurement:coordinate` | Procurement operational coordination | Procurement Coordinators |
| `procurement:view` | View procurement information | All procurement roles |
| `procurement:report` | Generate procurement reports | Procurement Analysts, Managers |

### Vendor & Supplier Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `vendor:evaluate` | Evaluate vendor proposals and performance | Procurement Coordinators, Buyers |
| `vendor:qualify` | Qualify and prequalify vendors | Vendor Qualification Specialists, Managers |
| `vendor:approve` | Approve vendor relationships | Procurement Managers |
| `vendor:blacklist` | Blacklist non-compliant vendors | Procurement Directors |
| `supplier:manage` | Manage supplier relationships | Contract Managers, Buyers |
| `supplier:negotiate` | Negotiate supplier contracts | Buyers, Contract Managers |

### Contract Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `contract:create` | Create procurement contracts | Procurement Coordinators, Buyers |
| `contract:administer` | Administer existing contracts | Contract Administrators |
| `contract:approve` | Approve contract terms | Procurement Managers |
| `contract:approve_final` | Final contract approval authority | Procurement Directors |
| `contract:amend` | Amend contract terms | Contract Managers |
| `variation:process` | Process contract variations | Contract Administrators |

### Purchase Order Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `purchase:create` | Create purchase requisitions | All procurement roles |
| `purchase:approve` | Approve purchase requisitions | Procurement Coordinators, Managers |
| `purchase:execute` | Execute purchase orders | Buyers |
| `order:place` | Place orders with suppliers | Buyers |
| `order:track` | Track order status and delivery | Procurement Coordinators |
| `order:cancel` | Cancel purchase orders | Procurement Managers |

### Budget & Financial Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `budget:view` | View procurement budgets | Procurement Coordinators, Analysts |
| `budget:approve_low` | Approve low-value purchases | Procurement Coordinators |
| `budget:approve_medium` | Approve medium-value purchases | Procurement Managers |
| `budget:approve_high` | Approve high-value purchases | Procurement Directors |
| `budget:approve_unlimited` | Unlimited budget approval | Procurement Directors |
| `spend:analyze` | Analyze procurement spend | Procurement Analysts, Category Managers |

### Sourcing & Strategy Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `sourcing:conduct` | Conduct sourcing activities | Procurement Coordinators, Buyers |
| `sourcing:strategy` | Develop sourcing strategies | Strategic Sourcing Managers |
| `strategy:develop` | Develop procurement strategies | Strategic Sourcing Managers |
| `strategy:category` | Develop category strategies | Category Managers |
| `market:analyze` | Analyze market conditions | Strategic Sourcing Managers |
| `benchmark:create` | Create procurement benchmarks | Procurement Analysts |

---

## Procurement Workflow Permissions

### Purchase Requisition Process

```
REQUISITION CREATION ────► APPROVAL ROUTING ────► PURCHASE ORDER ────► DELIVERY
         ↓                        ↓                     ↓              ↓
    Department Request      Budget Approval        Supplier Order   Goods Receipt
    (Any Employee)          (Coordinator)           (Buyer)         (Coordinator)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Requisition Creation** | `requisition:create` | All employees |
| **Initial Review** | `requisition:review` | Procurement Assistants |
| **Budget Approval** | `budget:approve_low/medium/high` | Procurement Coordinators/Managers |
| **Technical Approval** | `purchase:approve` | Department approvers |
| **Purchase Order** | `order:place`, `supplier:select` | Buyers |
| **Order Tracking** | `order:track`, `delivery:monitor` | Procurement Coordinators |
| **Goods Receipt** | `delivery:receive`, `quality:inspect` | Procurement Coordinators |

### Vendor Qualification Process

```
VENDOR APPLICATION ────► PREQUALIFICATION ────► QUALIFICATION ────► APPROVAL
        ↓                        ↓                     ↓              ↓
   Document Review         Basic Checks         Detailed Audit     Final Approval
   (Qualification Specialist) (Coordinator)     (Specialist)       (Manager)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Application Review** | `vendor:review`, `document:verify` | Procurement Assistants, Coordinators |
| **Prequalification** | `vendor:prequalify`, `basic:check` | Procurement Coordinators |
| **Detailed Qualification** | `vendor:qualify`, `audit:conduct`, `certification:verify` | Vendor Qualification Specialists |
| **Technical Approval** | `vendor:approve` | Procurement Managers |
| **Final Approval** | `vendor:approve_final` | Procurement Directors |

### Contract Management Process

```
CONTRACT DRAFT ────► NEGOTIATION ────► APPROVAL ────► EXECUTION ────► ADMINISTRATION
      ↓                  ↓               ↓             ↓                ↓
  Template Selection  Terms Agreement  Legal Review  Signing       Performance
  (Contract Admin)    (Contract Mgr)   (Manager)     (Director)    (Contract Admin)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Contract Drafting** | `contract:create`, `template:use` | Contract Administrators |
| **Negotiation** | `negotiation:lead`, `terms:negotiate` | Contract Managers, Buyers |
| **Internal Approval** | `contract:approve` | Procurement Managers |
| **Final Approval** | `contract:approve_final` | Procurement Directors |
| **Contract Administration** | `contract:administer`, `compliance:monitor` | Contract Administrators |

---

## Database Schema Integration

### Procurement-Specific Tables

```sql
-- Procurement vendor qualification records
CREATE TABLE public.procurement_vendor_qualification (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  vendor_id uuid NOT NULL,
  qualification_officer_id text NOT NULL,
  financial_rating integer,
  technical_rating integer,
  compliance_rating integer,
  overall_score integer,
  qualification_status text DEFAULT 'pending',
  approved_by text,
  approved_at timestamp with time zone,
  valid_until date,
  prequalification_expiry date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procurement_vendor_qualification_pkey PRIMARY KEY (id)
);

-- Procurement purchase orders
CREATE TABLE public.procurement_purchase_orders (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  po_number text NOT NULL UNIQUE,
  vendor_id uuid NOT NULL,
  project_id uuid,
  requester_id text NOT NULL,
  approver_id text,
  total_value numeric(15,2),
  currency_code text DEFAULT 'ZAR',
  status text DEFAULT 'draft',
  delivery_date date,
  actual_delivery_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procurement_purchase_orders_pkey PRIMARY KEY (id)
);

-- Procurement contracts
CREATE TABLE public.procurement_contracts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  contract_number text NOT NULL UNIQUE,
  vendor_id uuid NOT NULL,
  contract_type text NOT NULL,
  value numeric(15,2),
  currency_code text DEFAULT 'ZAR',
  start_date date,
  end_date date,
  status text DEFAULT 'draft',
  administrator_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procurement_contracts_pkey PRIMARY KEY (id)
);

-- Procurement requisitions
CREATE TABLE public.procurement_requisitions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  requisition_number text NOT NULL UNIQUE,
  requester_id text NOT NULL,
  department_code text,
  project_id uuid,
  description text,
  estimated_value numeric(15,2),
  required_date date,
  status text DEFAULT 'draft',
  approver_id text,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procurement_requisitions_pkey PRIMARY KEY (id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on procurement tables
ALTER TABLE procurement_vendor_qualification ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_requisitions ENABLE ROW LEVEL SECURITY;

-- Procurement department access policy
CREATE POLICY "procurement_department_access" ON procurement_vendor_qualification
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01900'
    )
  );

-- Purchase requisition access (department-based)
CREATE POLICY "requisition_department_access" ON procurement_requisitions
  FOR ALL USING (
    requester_id = auth.uid()::text OR
    department_code IN (
      SELECT department_code FROM user_roles
      WHERE user_id = auth.uid()::text
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01900'
    )
  );

-- Contract administration policy
CREATE POLICY "contract_administration_access" ON procurement_contracts
  FOR ALL USING (
    administrator_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01900'
      AND level >= 2
    )
  );

-- Purchase order access policy
CREATE POLICY "purchase_order_access" ON procurement_purchase_orders
  FOR SELECT USING (
    requester_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01900'
    )
  );
```

---

## Role Assignment Guidelines

### Automatic Role Assignment

1. **Department-Based Assignment**
   - Users in department 01900 automatically get base procurement permissions
   - Level 1: Procurement Assistant or Requisition Clerk roles
   - Level 2: Buyer or Procurement Coordinator roles
   - Level 3+: Procurement Manager or Director roles

2. **Specialization-Based Assignment**
   - **Contract focus**: Contract Administrator/Manager roles
   - **Sourcing focus**: Strategic Sourcing Manager roles
   - **Category focus**: Category Manager roles
   - **Vendor focus**: Vendor Qualification Specialist roles

3. **Project-Based Permissions**
   - Project procurement coordinators get additional project-specific permissions
   - Category managers get permissions for their assigned categories

### Manual Role Assignment

- **Procurement Director** assigns specialized roles (Contract Manager, Strategic Sourcing Manager)
- **Department Heads** can request procurement role elevations for their team members
- **Governance Team** approves all procurement role assignment requests

---

## Procurement-Specific Security Requirements

### Data Classification

| Data Type | Classification | Access Requirements |
|-----------|----------------|-------------------|
| **Vendor Financial Data** | Confidential | Procurement department only |
| **Contract Terms** | Restricted | Procurement + legal + management |
| **Purchase Orders** | Internal | Procurement + requesting departments |
| **Vendor Qualification** | Internal | Procurement department |
| **Procurement Reports** | Internal | Procurement + management |

### Audit Logging Requirements

All procurement operations must be logged:

```sql
CREATE TABLE public.procurement_audit_log (
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

- **Monthly procurement reports** to Procurement Director
- **Quarterly vendor performance reviews** and qualification audits
- **Annual procurement compliance assessments**
- **Real-time monitoring** of high-value purchase approvals

---

## Implementation Checklist

### Phase 1: Core Procurement Permissions
- [ ] Create procurement-specific user roles in user_roles table
- [ ] Implement department-based automatic role assignment
- [ ] Add RLS policies to procurement tables
- [ ] Create procurement audit logging system

### Phase 2: Workflow Integration
- [ ] Integrate purchase requisition permissions
- [ ] Implement vendor qualification workflows
- [ ] Add contract management permissions
- [ ] Create purchase order approval system

### Phase 3: Advanced Features
- [ ] Implement strategic sourcing permissions
- [ ] Add category management access controls
- [ ] Create spend analysis automation
- [ ] Develop procurement performance dashboards

---

## Related Documentation

- [amended_technical_documents_prompt.md](./amended_technical_documents_prompt.md) - Procurement templates and RLS policies
- [procurement_templates_schema.sql](../sql/procurement_templates_schema.sql) - Procurement template schema
- [0000_MASTER_ROLES_PERMISSIONS_INDEX.md](../0000_MASTER_ROLES_PERMISSIONS_INDEX.md) - Master security index

---

## Version History

- **v1.0 (2025-12-11)**: Initial procurement roles and permissions framework
  - Defined comprehensive procurement role hierarchy
  - Integrated vendor qualification and contract management permissions
  - Added RLS policies for procurement data security
  - Created workflow-based permission assignments
