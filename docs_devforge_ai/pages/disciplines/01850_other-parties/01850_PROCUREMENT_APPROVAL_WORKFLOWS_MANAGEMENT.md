# 01900 Procurement Approval Workflows Management

## Status
- [x] Initial draft
- [x] Tech review completed
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-12-04): Approval workflows management page design for governance-controlled procurement approvals

## Overview

This document outlines the design for a dedicated **Procurement Approval Workflows Management** page that allows governance administrators to configure and manage approval authority levels for procurement orders. This page provides centralized control over approval routing, ensuring compliance with organizational approval hierarchies and authority limits.

## Page Location & Access

### Navigation Integration
- **Accordion Location**: Governance section of the main navigation accordion
- **Page Route**: `/governance/procurement-approval-workflows`
- **Access Control**: Restricted to users with governance or system administration roles
- **Menu Label**: "Procurement Approval Workflows"

### User Permissions
- **View Access**: Governance administrators, system administrators
- **Edit Access**: Governance administrators only
- **Audit Access**: Read-only access for compliance officers

## Page Layout & Components

### Header Section
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Procurement Approval Workflows Management                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Configure approval authority levels and routing for procurement    │ │
│ │ orders. Define hierarchical approval workflows based on order value│ │
│ │ and type to ensure proper governance and compliance.               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Main Content Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Tabs: Workflows | Authorities | Templates | Audit Log]               │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ┌─ Workflow Management Table ───────────────────────────────┐     │ │
│ │ │                                                           │     │ │
│ │ │  + Add Workflow    [Search/Filter Controls]              │     │ │
│ │ │                                                           │     │ │
│ │ │  ┌─────────────────────────────────────────────────────┐ │     │ │
│ │ │  │ Order Type │ Value Range │ Approvers │ Status │ Actions │ │     │ │
│ │ │  ├─────────────────────────────────────────────────────┤ │     │ │
│ │ │  │ PO         │ $0-$25K    │ Proc Officer         │ Active │ ✏️ 🗑️ │ │     │ │
│ │ │  │ PO         │ $25K-$100K │ Proc Officer + Mgr   │ Active │ ✏️ 🗑️ │ │     │ │
│ │ │  │ WO         │ $0-$50K    │ Proj Mgr + Safety    │ Active │ ✏️ 🗑️ │ │     │ │
│ │ │  │ ...        │ ...        │ ...                   │ ...    │ ...   │ │     │ │
│ │ │  └─────────────────────────────────────────────────────┘ │     │ │
│ │ └─────────────────────────────────────────────────────────────┘     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tab Structure

### 1. Workflows Tab
**Primary workflow configuration and management**

#### Workflow Management Table
- **Columns**:
  - **Order Type**: PO (Purchase Order), WO (Work Order), SO (Service Order)
  - **Value Range**: Monetary range (e.g., $0-$25,000, $25,000-$100,000)
  - **Approvers**: Sequential list of required approvers
  - **Routing Type**: Sequential or Parallel
  - **Status**: Active, Inactive, Draft
  - **Actions**: Edit, Delete, Duplicate, Test

#### Add/Edit Workflow Modal
```
┌─ Add Procurement Approval Workflow ──────────────────────────────┐
│ Workflow Name: [Purchase Order - Low Value]                     │
│                                                                 │
│ Order Type: [Purchase Order ▼]                                  │
│                                                                 │
│ Value Range:                                                    │
│ From: [$0]                    To: [$25,000]                      │
│                                                                 │
│ Routing Type: [Sequential ▼]  [Parallel]                        │
│                                                                 │
│ Approvers (Sequential):                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Procurement Officer (Required) [Remove]                 │ │
│ │ [+ Add Approver]                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Additional Requirements:                                        │
│ [ ] Technical Review Required                                   │
│ [ ] Legal Review Required                                       │
│ [ ] Budget Approval Required                                    │
│                                                                 │
│ [Save Workflow] [Cancel]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Authorities Tab
**Manage approval authority levels and user assignments**

#### Authority Levels Table
- **Columns**:
  - **Authority Level**: Junior, Senior, Manager, Director, Executive
  - **Value Limit**: Maximum approval amount for this level
  - **Assigned Users**: Users with this approval authority
  - **Status**: Active/Inactive
  - **Actions**: Edit, Assign Users

#### User Assignment Interface
```
┌─ Assign Approval Authorities ──────────────────────────────────────┐
│ Authority Level: Senior Procurement Officer                      │
│ Value Limit: $100,000                                            │
│                                                                 │
│ Assigned Users:                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search users...                                         │ │
│ │ ├─────────────────────────────────────────────────────────┤ │ │
│ │ │ John Smith (Procurement) [Remove]                       │ │ │
│ │ │ Jane Doe (Procurement) [Remove]                         │ │ │
│ │ │ [+ Add User]                                            │ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Save Assignments] [Cancel]                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Templates Tab
**Pre-configured workflow templates for common scenarios**

#### Template Library
- **Standard PO Workflows**: Low/Medium/High value purchase orders
- **Work Order Templates**: Construction, maintenance, installation
- **Service Order Templates**: Professional, technical, training services
- **Custom Templates**: Organization-specific approval patterns

#### Template Application
- **One-click application** to create new workflows from templates
- **Template customization** before saving as organizational workflow
- **Template versioning** for governance compliance

### 4. Audit Log Tab
**Complete audit trail of workflow changes and approvals**

#### Audit Log Table
- **Columns**:
  - **Timestamp**: When the change occurred
  - **User**: Who made the change
  - **Action**: Create, Update, Delete, Activate, Deactivate
  - **Workflow**: Which workflow was affected
  - **Details**: Specific changes made
  - **IP Address**: For security tracking

## Database Schema

### Approval Workflows Table
```sql
CREATE TABLE procurement_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name VARCHAR(255) NOT NULL,
  order_type VARCHAR(50) NOT NULL, -- 'purchase_order', 'work_order', 'service_order'
  min_value DECIMAL(15,2),
  max_value DECIMAL(15,2),
  routing_type VARCHAR(20) DEFAULT 'sequential', -- 'sequential', 'parallel'
  approvers JSONB NOT NULL, -- Array of approver role/user IDs with sequence
  additional_requirements JSONB, -- technical_review, legal_review, budget_approval
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Approval Authorities Table
```sql
CREATE TABLE procurement_approval_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_level VARCHAR(100) NOT NULL,
  value_limit DECIMAL(15,2),
  assigned_users JSONB, -- Array of user IDs with this authority
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Workflow Audit Log Table
```sql
CREATE TABLE procurement_workflow_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50), -- 'create', 'update', 'delete', 'activate', 'deactivate'
  workflow_id UUID REFERENCES procurement_approval_workflows(id),
  details JSONB, -- Specific changes made
  ip_address INET,
  user_agent TEXT
);
```

## API Endpoints

### Workflow Management
- `GET /api/governance/procurement-workflows` - List all workflows with filtering
- `POST /api/governance/procurement-workflows` - Create new workflow
- `PUT /api/governance/procurement-workflows/:id` - Update workflow
- `DELETE /api/governance/procurement-workflows/:id` - Delete workflow
- `POST /api/governance/procurement-workflows/:id/activate` - Activate/deactivate workflow

### Authority Management
- `GET /api/governance/approval-authorities` - List authority levels
- `POST /api/governance/approval-authorities` - Create authority level
- `PUT /api/governance/approval-authorities/:id` - Update authority level
- `POST /api/governance/approval-authorities/:id/assign-users` - Assign users to authority

### Audit & Templates
- `GET /api/governance/workflow-audit-log` - Get audit log with filtering
- `GET /api/governance/workflow-templates` - Get pre-configured templates
- `POST /api/governance/workflow-templates/:id/apply` - Apply template to create workflow

## User Interface Components

### Workflow Creation Wizard
**Step-by-step workflow creation process:**

1. **Basic Information**: Name, order type, value range
2. **Routing Configuration**: Sequential vs parallel, approver selection
3. **Additional Requirements**: Technical/legal review checkboxes
4. **Testing & Validation**: Simulate approval flow
5. **Activation**: Set status and save

### Bulk Operations
- **Bulk activate/deactivate** multiple workflows
- **Bulk assignment** of users to authority levels
- **Bulk import/export** of workflow configurations

### Validation & Testing
- **Workflow validation** before saving (circular dependencies, missing approvers)
- **Test simulation** to verify approval flow logic
- **Conflict detection** for overlapping value ranges

## Integration Points

### With Procurement Order Creation
- **Automatic workflow selection** based on order type and value
- **Real-time validation** during order creation
- **Approval matrix display** in order modal

### With User Task Management
- **Automatic task creation** for approvers in the approval chain
- **Task status updates** as approvals progress
- **Notification system** for pending approvals

### With Governance Reporting
- **Approval analytics** and bottleneck identification
- **Compliance reporting** on approval adherence
- **Audit trail integration** with governance dashboards

## Security & Compliance

### Access Controls
- **Role-based permissions** for workflow management
- **Audit logging** of all configuration changes
- **Change approval** for critical workflow modifications

### Data Validation
- **Value range validation** to prevent overlaps
- **Authority limit enforcement** based on user roles
- **Approval chain validation** to ensure proper escalation

### Backup & Recovery
- **Configuration backups** before major changes
- **Rollback capabilities** for erroneous modifications
- **Version control** for workflow templates

## Implementation Plan

### Phase 1: Core Framework (Week 1-2)
1. Create database tables and API endpoints
2. Build basic CRUD operations for workflows
3. Implement authority level management

### Phase 2: Advanced Features (Week 3-4)
1. Add workflow templates and bulk operations
2. Implement audit logging and reporting
3. Create validation and testing features

### Phase 3: Integration & Testing (Week 5-6)
1. Integrate with procurement order creation
2. Connect to task management system
3. Comprehensive testing and user acceptance

## Success Criteria

- Governance administrators can create and manage approval workflows
- Workflows automatically apply based on order type and value
- Complete audit trail of all workflow changes
- Seamless integration with procurement order lifecycle
- Compliant with organizational approval hierarchies

This approval workflow management system provides governance control over procurement approvals while maintaining flexibility for different organizational structures and compliance requirements.
