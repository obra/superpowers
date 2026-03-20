# Procurement-SOW Association System Design

## Status
- [x] Initial draft
- [x] Tech review completed
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-12-02): Initial design with separate SOW entity model
- v1.5 (2025-12-04): **MAJOR REVISION** - Corrected to integrated document hierarchy where SOW is part of order document, not separate entity

## Overview

This document outlines the comprehensive procurement system where **SOW templates define the structure and appendices required for different order types**, and the resulting SOW content is **integrated within the procurement order document itself**. This reflects actual procurement practice where orders contain embedded SOW content, with SOW structure varying by procurement type (materials vs equipment vs services).

## CORRECTED Document Hierarchy

### Single Integrated Procurement Document
```
Procurement Order Document (Single PDF/Word File)
├── Document 1: Approval Cover Sheet (Routing Document)
│   ├── Order Summary & Key Details
│   ├── Approval Matrix (who needs to approve what)
│   ├── Approval Signatures (collected during routing)
│   └── Distribution List
│
└── Document 2: Main Order Document (Technical Document)
    ├── Order Header & Commercial Terms
    │   ├── Order Number, Date, Validity
    │   ├── Supplier Details & Contact
    │   ├── Payment Terms & Delivery Schedule
    │   └── Commercial Conditions
├── Scope of Work (Integrated Section)
│   ├── SOW Description & Objectives
│   ├── Technical Specifications
│   └── Appendices (Dynamically selected A-F based on order type and requirements)
    └── Signatures & Execution
```

### Database Schema (Corrected)
```
procurement_orders table
├── order_metadata (basic order info, supplier, value, etc.)
├── approval_cover_content (generated approval routing document)
├── main_order_content (integrated document with SOW + appendices)
├── appendix_contributions (tracking who contributed what)
├── appendix_a_content (technical specs - engineering)
├── appendix_b_content (quality requirements)
├── appendix_c_content (compliance & safety - engineering + safety)
├── appendix_d_content (testing procedures - quality)
├── appendix_e_content (documentation - engineering)
├── appendix_f_content (legal terms - legal)
├── approval_status (draft → in_approval → approved → executed)
└── approval_signatures (who signed when, on cover sheet)
```

## Multi-Disciplinary Contribution Workflow

### Order Creation with Integrated SOW
```
1. Procurement Team Creates Order Framework
   ├── Selects Order Type (Purchase/Work/Service)
   ├── Chooses SOW Template (defines appendix structure)
   └── Creates Basic Order Structure

2. Discipline Assignment to Appendices
   ├── Appendix A: Engineering (Technical Specifications)
   ├── Appendix B: Quality (Requirements & Testing)
   ├── Appendix C: Engineering + Safety (Compliance)
   ├── Appendix D: Quality (Testing Procedures)
   ├── Appendix E: Engineering (Documentation)
   └── Appendix F: Legal (Terms & Conditions)

3. Multi-Disciplinary Content Contribution (Comprehensive Task-Based Assignment)
   ├── Task Cards Created at Multiple Levels:
   │   ├── Order-Level Tasks: "Create Procurement Order for [Project/Item]"
   │   ├── SOW-Level Tasks: "Develop SOW for Order [Order-Number]"
   │   ├── Cover Sheet Tasks: "Compile Approval Cover Sheet for Order [Order-Number]"
   │   └── Appendix-Level Tasks: Individual tasks for each appendix contribution
   ├── Task Assignment Based on Configurable Roles and Disciplines:
   │   ├── **Dynamically Assigned**: Order creation tasks assigned to configured procurement roles
   │   ├── **Dynamically Assigned**: SOW development tasks assigned to configured technical roles
   │   ├── **Dynamically Assigned**: Cover sheet compilation based on organizational approval workflows
   │   ├── **Dynamically Assigned**: Appendix contributions based on discipline assignments
   │   └── **Configurable**: All role assignments determined by organizational structure and template configuration
   ├── Task Cards Displayed on http://localhost:3060/#/my-tasks
   ├── Task Cards Include: Task type + order details + direct navigation links
   └── Users Click Task Cards → Navigate to appropriate procurement pages for their tasks

4. Document Assembly
   ├── Generate Approval Cover Sheet (routing document)
   ├── Integrate All Contributions into Main Order Document
   ├── Mark Tasks as Complete When Contributions Submitted
   └── Final Package: Cover Sheet + Integrated Order Document
```

## Implementation Status

### ✅ Completed
- **Database Schema**: `procurement_orders` table with appendix content fields
- **Backend API**: Full CRUD for orders with appendix content management
- **DocumentBrowser Tabs**: Smart Suggestions, Templates, SOW Documents, Engineering Docs, Procurement Appendices
- **Template Selection**: Dynamic loading based on order type
- **Organization-scoped Disciplines**: Available for assignment

### 🔄 In Progress - Critical Modal Restructure Required
- **Create Order Modal**: Currently implements basic order creation only ❌
- **Missing**: Integrated SOW workflow with multi-disciplinary appendix assignments ❌
- **Missing**: Approval cover sheet generation ❌
- **Missing**: Discipline-to-appendix assignment interface ❌

### 📋 Required Modal Restructure

**Current Modal Issues:**
- Creates basic procurement orders only
- No SOW integration within order document
- Single discipline dropdown (not multi-discipline assignment)
- No appendix A-F structure handling
- No approval cover sheet workflow

**Required Modal Features:**
1. **SOW Template Selection** → Defines required appendices A-F
2. **Multi-Discipline Assignment Interface** → All disciplines assignable to appendices
3. **Appendix Requirements Display** → Shows A-F structure based on template
4. **Integrated Document Generation** → Creates approval cover + main order document
5. **Contribution Workflow Management** → Tracks who contributes to which appendices

## Create Order Modal - Required Restructure

### Phase 1: Template & Discipline Selection
```javascript
// Modal should include:
- Order Type Selection (Purchase/Work/Service) ✅ (exists)
- SOW Template Selection (defines appendix structure) ❌ (missing)
- Multi-Discipline Assignment:
  - Appendix A → Engineering (Technical Specs)
  - Appendix B → Quality (Requirements)
  - Appendix C → Engineering + Safety (Compliance)
  - Appendix D → Quality (Testing)
  - Appendix E → Engineering (Documentation)
  - Appendix F → Legal (Terms & Conditions)
```

### Phase 2: Content Contribution Workflow
```javascript
// After order creation:
- Notify assigned disciplines of contribution requirements
- Provide contribution interfaces for each appendix
- Track contribution status and completion
- Assemble final integrated document
```

### Phase 3: Approval Workflow
```javascript
// Generate and route:
- Approval Cover Sheet (separate routing document)
- Main Order Document (with integrated SOW + appendices)
- Collect signatures on cover sheet
- Final execution and distribution
```

## API Endpoints (Updated)

### Order Management
- `POST /api/procurement-orders` - Create order with SOW integration
- `PUT /api/procurement-orders/:id/appendices/:appendix` - Contribute to appendix
- `GET /api/procurement-orders/:id/contributions` - Track contributions
- `POST /api/procurement-orders/:id/generate-documents` - Generate cover + main document

### Template & Discipline Integration
- `GET /api/templates/procurement/sow-templates` - Get SOW templates with appendix definitions
- `GET /api/disciplines/assignable` - Get all assignable disciplines
- `POST /api/procurement-orders/:id/assign-disciplines` - Assign disciplines to appendices

## Frontend Components (Required Updates)

### CreateOrderModal.jsx - Critical Updates Needed
```javascript
// Add these missing components:
- SOWTemplateSelector (defines appendix structure)
- DisciplineAssignmentInterface (multi-select for all disciplines)
- AppendixRequirementsDisplay (A-F structure visualization)
- ApprovalWorkflowConfigurator (cover sheet setup)
```

### New Components Required
- `AppendixContributionInterface.jsx` - For discipline content contribution
- `DocumentAssembler.jsx` - Combines cover sheet + main document
- `ApprovalRoutingDashboard.jsx` - Manages cover sheet approvals

## Database Schema Updates

### Enhanced Procurement Orders Table
```sql
ALTER TABLE procurement_orders ADD COLUMN IF NOT EXISTS
  appendix_a_content TEXT,
  appendix_b_content TEXT,
  appendix_c_content TEXT,
  appendix_d_content TEXT,
  appendix_e_content TEXT,
  appendix_f_content TEXT,
  approval_cover_content TEXT,
  main_order_content TEXT,
  discipline_assignments JSONB, -- Tracks which disciplines assigned to which appendices
  contribution_status JSONB;    -- Tracks completion status of each appendix
```

## Success Metrics (Updated)

### Functional Metrics
- **Document Integration Rate**: Percentage of orders with properly integrated SOW content
- **Appendix Completion Rate**: Percentage of assigned appendices with contributions
- **Approval Cycle Time**: Time from order creation to final approval
- **Multi-Disciplinary Participation**: Number of disciplines contributing per order

## Implementation Plan

### Phase 1: Core Procurement Workflow (Foundation)
1. **Implement Basic Procurement Order Creation**
   - Update CreateOrderModal with SOW template selection
   - Add multi-discipline assignment interface
   - Implement appendix requirements display
   - Build appendix contribution interfaces with task cards

### Phase 2: Document Assembly & Review
1. Create document assembler component for integrated SOW documents
2. Implement PDF generation for procurement documents
3. Add contribution tracking and completion notifications
4. Enable configurable document review workflow (dynamically assigned based on organizational disciplines and order requirements)

### Phase 3: Governance Approval Integration
1. **Implement Approval Workflows Management Page** (`1300_01900_PROCUREMENT_APPROVAL_WORKFLOWS_MANAGEMENT.md`)
   - Create database tables for workflows, authorities, and audit logs
   - Build governance-controlled final approval workflow configuration
   - Set up authority levels and user assignments for executive approvals
   - Implement audit logging for final approval compliance
2. **Integrate Final Approval Routing**
   - Connect compiled documents to governance approval workflows
   - Generate approval cover sheets with configured executive routing
   - Add approval tasks to My Tasks system for final approvers

### Phase 4: System Integration & Testing
1. End-to-end workflow testing from order creation to final approval
2. Multi-discipline contribution validation
3. Approval workflow compliance testing
4. Governance reporting and complete audit validation

---

## Key Corrections Made in v1.5

1. **Removed Incorrect Relational Model**: Original design treated SOW as separate entity - corrected to integrated approach
2. **Added Dual Document Structure**: Approval Cover Sheet + Main Order Document
3. **Clarified Appendix Integration**: Appendices A-F are sub-sections within the SOW section of order document
4. **Updated Multi-Disciplinary Workflow**: Focus on contribution to integrated document rather than separate SOW association
5. **Added Approval Cover Sheet**: Critical missing component for procurement routing workflows

This corrected design aligns with actual procurement practices where the SOW and its appendices are integral parts of the procurement order document itself.
