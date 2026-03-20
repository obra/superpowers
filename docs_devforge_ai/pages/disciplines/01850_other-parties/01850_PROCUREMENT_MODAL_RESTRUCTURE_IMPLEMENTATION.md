h# 01900 Procurement Modal Restructure Implementation Guide

## Status
- [x] Initial draft
- [x] Tech review completed
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-12-04): Modal restructure implementation guide based on corrected SOW integration workflow
- v1.1 (2025-12-05): Enhanced with integrated document workflow management, agent transition planning, and governance matrix integration

## Overview

This document provides the implementation guide for restructuring the "Create New Procurement Order" modal to support the integrated SOW workflow where the Scope of Work with appendices A-F is embedded within the procurement order document itself.

## Critical UI/UX Improvements (2025-12-05)

### ✅ Implemented Fixes

#### 1. Duplicate Headings Resolution
- **Issue**: Multiple header sections causing visual clutter
- **Fix**: Consolidated to single h2 header with improved description
- **Result**: Cleaner, more focused page layout

#### 2. Discipline Counting Accuracy
- **Issue**: Incorrect counting of assigned disciplines in statistics
- **Fix**: Added dedicated "Assigned Disciplines" stat card showing orders with discipline assignments
- **Result**: Accurate representation of discipline assignment status

#### 3. Discipline Name Presentation
- **Issue**: Discipline names displayed with ID numbers (e.g., "Engineering (ENG001)")
- **Fix**: Display clean discipline names without IDs in table cells
- **Result**: Professional, readable discipline names

#### 4. Text Spacing and Layout
- **Issue**: Cramped text and poor spacing throughout interface
- **Fix**: Increased table row padding (1.25rem), added line-height: 1.5, improved spacing
- **Result**: More readable, less cluttered interface

#### 5. Task Assignment vs Discipline Assignment
- **Issue**: UI assigned disciplines to tasks instead of filtering users by discipline
- **Fix**: Changed SOWAssociationModal to "Assign Tasks to Users" with discipline filtering
- **Result**: Proper user-centric task assignment workflow

#### 6. Cover Sheet Routing Enhancement
- **Issue**: Only sequential/parallel routing options
- **Fix**: Added "Hybrid" routing option with governance matrix integration
- **Result**: Support for complex approval workflows

#### 7. Phase Indicator Labels & Icons
- **Issue**: Phase indicator showed abbreviated labels "1Basic Info 2SOW Template 3Discipline Assignment 4Approval Config 5Review & Create"
- **Fix**: Updated to descriptive workflow steps with colored icons and descriptions:
  - 📝 **Order Information** - Basic details & requirements
  - 📄 **Template Selection** - Choose SOW structure
  - 📊 **Assign Disciplines** - Map teams to appendices
  - ✅ **Approval Setup** - Configure workflow routing
  - 📤 **Review & Create** - Final review & submission
  - **Icons are now colored**: Blue, Green, Purple, Yellow, Red respectively for visual distinction
- **Result**: Professional, readable step labels with contextual icons matching SOW creation wizard style

#### 8. Documentation Updates
- **Issue**: MD docs not reflecting current functionality
- **Fix**: Updated implementation guide with all improvements and clarifications
- **Result**: Accurate, up-to-date documentation

#### 9. User Assignment Enhancement (Phase 3)
- **Issue**: Users not assigned in procurement order workflow - only disciplines assigned
- **Fix**: Implemented "Assign Teams & Users" functionality with UserSelector component, dual assignment system, and user loading from assigned disciplines
- **Components Added**: UserSelector.jsx for user selection interface, user assignment state management, database queries for user loading
- **Result**: Complete user assignment workflow enabling proper task distribution and accountability

## Current Modal Analysis

### ✅ Existing Features (Retain)
- Order type selection (Purchase/Work/Service) ✓
- Template selection with dynamic loading ✓
- Basic form fields (title, description, value, supplier) ✓
- Project selection ✓
- Document linking via DocumentBrowser ✓
- Organization-scoped discipline dropdown ✓

### ❌ Critical Missing Features (Implement)
- SOW template selection defining dynamically selected appendix requirements ❌
- Multi-discipline assignment interface (all disciplines assignable to required appendices) ❌
- Dynamic appendix requirements display (based on order type and template) ❌
- Approval cover sheet generation ❌
- Integrated document workflow management ❌

## Required Modal Restructure

### Phase 1: Add SOW Template Selection
```javascript
// Add to CreateOrderModal.jsx
const [sowTemplates, setSOWTemplates] = useState([]);
const [selectedSOWTemplate, setSelectedSOWTemplate] = useState(null);
const [appendixRequirements, setAppendixRequirements] = useState({});

// Load SOW templates based on order type
useEffect(() => {
  if (formData.orderType) {
    loadSOWTemplates(formData.orderType);
  }
}, [formData.orderType]);

const loadSOWTemplates = async (orderType) => {
  // Load templates that define appendix structures
  const result = await loadAvailableTemplates({
    discipline: '01900',
    targetDocumentType: orderType,
    templateCategory: 'sow_with_appendices' // New category
  });
  setSOWTemplates(result.templates || []);
};
```

### Phase 2: Multi-Discipline Assignment Interface
```javascript
// Add to CreateOrderModal.jsx
const [disciplineAssignments, setDisciplineAssignments] = useState({
  appendix_a: [], // Engineering
  appendix_b: [], // Quality
  appendix_c: [], // Engineering + Safety
  appendix_d: [], // Quality
  appendix_e: [], // Engineering
  appendix_f: []  // Legal
});

const [allDisciplines, setAllDisciplines] = useState([]);

useEffect(() => {
  loadAllAssignableDisciplines();
}, []);

const loadAllAssignableDisciplines = async () => {
  const disciplines = await getUserAssignableDisciplines();
  setAllDisciplines(disciplines);
};

const handleDisciplineAssignment = (appendix, disciplineId, assign) => {
  setDisciplineAssignments(prev => ({
    ...prev,
    [appendix]: assign
      ? [...prev[appendix], disciplineId]
      : prev[appendix].filter(id => id !== disciplineId)
  }));
};
```

### Phase 3: Appendix Requirements Display
```javascript
// Add to modal JSX
{selectedSOWTemplate && (
  <div className="appendix-requirements-section">
    <h5>SOW Appendix Requirements</h5>
    <div className="appendix-grid">
      <div className="appendix-item">
        <h6>Appendix A: Technical Specifications</h6>
        <p>Engineering requirements and technical details</p>
        <DisciplineSelector
          appendix="appendix_a"
          assigned={disciplineAssignments.appendix_a}
          allDisciplines={allDisciplines}
          onChange={handleDisciplineAssignment}
          defaultDisciplines={['engineering']}
        />
      </div>
      <div className="appendix-item">
        <h6>Appendix B: Quality Requirements</h6>
        <p>Quality standards and testing procedures</p>
        <DisciplineSelector
          appendix="appendix_b"
          assigned={disciplineAssignments.appendix_b}
          allDisciplines={allDisciplines}
          onChange={handleDisciplineAssignment}
          defaultDisciplines={['quality']}
        />
      </div>
      {/* Continue for appendices C-F */}
    </div>
  </div>
)}
```

### Phase 4: Approval Workflow Configuration
```javascript
// Add approval cover sheet configuration
const [approvalConfig, setApprovalConfig] = useState({
  generateCoverSheet: true,
  approvalMatrix: [],
  routingType: 'sequential' // sequential or parallel
});

const generateApprovalMatrix = (orderValue, orderType) => {
  // Auto-generate approval matrix based on value and type
  const matrix = [];
  if (orderValue > 100000) {
    matrix.push({ role: 'procurement_manager', required: true });
    matrix.push({ role: 'department_head', required: true });
    matrix.push({ role: 'executive', required: true });
  } else if (orderValue > 25000) {
    matrix.push({ role: 'procurement_officer', required: true });
    matrix.push({ role: 'procurement_manager', required: true });
  }
  // Add technical approvals for work orders
  if (orderType === 'work_order') {
    matrix.push({ role: 'safety_officer', required: true });
    matrix.push({ role: 'project_manager', required: true });
  }
  setApprovalConfig(prev => ({ ...prev, approvalMatrix: matrix }));
};
```

## New Components Required

### DisciplineSelector Component
```javascript
// components/DisciplineSelector.jsx
const DisciplineSelector = ({
  appendix,
  assigned,
  allDisciplines,
  onChange,
  defaultDisciplines = []
}) => {
  return (
    <div className="discipline-selector">
      <label>Assign Disciplines:</label>
      <div className="discipline-checkboxes">
        {allDisciplines.map(discipline => (
          <label key={discipline.id} className="discipline-checkbox">
            <input
              type="checkbox"
              checked={assigned.includes(discipline.id)}
              onChange={(e) => onChange(appendix, discipline.id, e.target.checked)}
              defaultChecked={defaultDisciplines.includes(discipline.code)}
            />
            {discipline.name}
          </label>
        ))}
      </div>
    </div>
  );
};
```

### AppendixRequirementsDisplay Component
```javascript
// components/AppendixRequirementsDisplay.jsx
const AppendixRequirementsDisplay = ({ template, assignments }) => {
  const appendixConfig = {
    appendix_a: { title: "Technical Specifications", default: "Engineering" },
    appendix_b: { title: "Quality Requirements", default: "Quality" },
    appendix_c: { title: "Compliance & Safety", default: "Engineering + Safety" },
    appendix_d: { title: "Testing Procedures", default: "Quality" },
    appendix_e: { title: "Documentation", default: "Engineering" },
    appendix_f: { title: "Legal & Commercial Terms", default: "Legal" }
  };

  return (
    <div className="appendix-requirements">
      {Object.entries(appendixConfig).map(([key, config]) => (
        <div key={key} className="appendix-requirement">
          <h6>{key.toUpperCase()}: {config.title}</h6>
          <div className="assigned-disciplines">
            {assignments[key]?.length > 0 ? (
              assignments[key].map(id => {
                const discipline = allDisciplines.find(d => d.id === id);
                return <span key={id} className="discipline-tag">{discipline?.name}</span>;
              })
            ) : (
              <span className="default-discipline">Default: {config.default}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Updated Modal Flow

### Step 1: Basic Order Information
- Order Type (Purchase/Work/Service) ✅ *(exists)*
- Title, Description, Value, Supplier ✅ *(exists)*
- Project Selection ✅ *(exists)*

### Step 2: SOW Template Selection *(NEW)*
- Select SOW template based on order type
- Template defines required appendices A-F structure
- Display appendix requirements

### Step 3: Discipline Assignment *(NEW)*
- Multi-select interface for all disciplines
- Assign disciplines to specific appendices
- Pre-populate defaults (A=Engineering, B=Quality, etc.)
- Allow custom assignments

### Step 4: Approval Configuration *(NEW)*
- Auto-generate approval matrix based on value/type
- Configure approval cover sheet
- Set routing type (sequential/parallel)

### Step 5: Task Creation & Document Generation
- Create order with integrated SOW content
- Generate approval cover sheet
- **Create Individual Task Cards** at multiple levels:
  - **Order-Level Tasks**: "Create Procurement Order for [Project/Item]" → Procurement Officers
  - **SOW-Level Tasks**: "Develop SOW for Order [Order-Number]" → Engineering/Technical Leads
  - **Cover Sheet Tasks**: "Compile Approval Cover Sheet for Order [Order-Number]" → Configured approval workflow roles
  - **Appendix-Level Tasks**: Individual tasks for each appendix contribution → Discipline Experts
  - Task cards appear on http://localhost:3060/#/my-tasks (one card per task, not grouped)
  - Each card includes task type + order details + direct navigation link
  - Clicking card navigates to appropriate procurement page with proper filtering
- **Multi-Level Display Structure**:
  - **Top Level**: Stats cards for major groups (PO: 3 outstanding, WO: 1 outstanding, SO: 2 outstanding)
  - **Task Level**: Individual cards below stats (e.g., "Appendix A for Order PO-2025-001", "Appendix C for Order PO-2025-001")
- **Task Completion Tracking**: Mark tasks complete when contributions submitted

## Database Schema Updates

### Enhanced Procurement Orders Table
```sql
ALTER TABLE procurement_orders ADD COLUMN IF NOT EXISTS
  sow_template_id UUID REFERENCES templates(id),
  appendix_a_content TEXT,
  appendix_b_content TEXT,
  appendix_c_content TEXT,
  appendix_d_content TEXT,
  appendix_e_content TEXT,
  appendix_f_content TEXT,
  approval_cover_content TEXT,
  main_order_content TEXT,
  discipline_assignments JSONB,
  contribution_status JSONB,
  approval_matrix JSONB,
  approval_routing_type VARCHAR(20) DEFAULT 'sequential';
```

## API Updates Required

### New Endpoints
- `GET /api/templates/procurement/sow-templates` - Get SOW templates with appendix definitions
- `GET /api/disciplines/assignable` - Get all assignable disciplines
- `POST /api/procurement-orders/:id/assign-disciplines` - Assign disciplines to appendices
- `POST /api/procurement-orders/:id/generate-documents` - Generate cover + main document

### Updated Endpoints
- `POST /api/procurement-orders` - Include SOW template and discipline assignments
- `PUT /api/procurement-orders/:id/appendices/:appendix` - Contribute to specific appendix

## Implementation Priority

### Phase 1: Core Procurement Workflow (Foundation)
1. Add SOW template selection to modal
2. Update template service to support SOW templates
3. Display appendix requirements based on template
4. Create DisciplineSelector component
5. Implement multi-discipline assignment logic

### Phase 2: Document Assembly & Initial Review (Week 2-3)
1. Create document assembler service for integrated SOW documents
2. Implement PDF generation for procurement documents
3. Add contribution tracking and completion notifications
4. Enable configurable document review workflow (dynamically assigned based on organizational disciplines and order requirements - may include procurement manager, cost control, technical experts, legal review, etc.)

### Phase 3: Governance Approval Integration (Week 4)
1. **Implement Procurement Approval Workflows Management Page**
   - See detailed implementation in `1300_01900_PROCUREMENT_APPROVAL_WORKFLOWS_MANAGEMENT.md`
   - Set up governance-controlled final approval workflow configuration
   - Configure organizational executive approval hierarchies
2. **Integrate Final Approval Routing**
   - Connect compiled documents to governance approval workflows
   - Generate approval cover sheets with configured executive routing
   - Add approval tasks to My Tasks system for final approvers

## Testing Requirements

### Unit Tests
- Discipline assignment logic
- Appendix requirements validation
- Approval matrix generation

### Integration Tests
- End-to-end order creation with SOW integration
- Multi-discipline contribution workflow
- Document assembly and PDF generation

### User Acceptance Tests
- Procurement officer creates order with SOW
- Multiple disciplines contribute to appendices
- Approval routing works correctly
- Final document package is generated

## Success Criteria

- Modal successfully creates orders with integrated SOW content
- All disciplines can be assigned to appendices appropriately
- Approval cover sheets are generated and routed correctly
- Multi-disciplinary contribution workflow functions end-to-end
- Final document package contains both cover sheet and integrated order

## Design Principles - SOW Template Structure

### ✅ SOW Templates ARE Separate Entities (Corrected)
- **SOW templates vary by order type**: Materials orders vs Equipment orders have different templates
- **Template defines appendix structure**: Each template specifies which appendices are required (NOT limited to A-F)
- **Dynamic appendix selection**: Templates can define ANY appendices needed - not restricted to A-F combinations
- **Template selection determines workflow**: Choosing template defines discipline assignments and contribution requirements

### ⚠️ CRITICAL: Templates Define Appendix Structure Flexibly
**Templates are NOT restricted to appendices A-F** - they can define completely different appendix structures:
- Equipment templates might need: Safety (S), Installation (I), Commissioning (C), Warranty (W), Training (T)
- Materials templates might need: Specifications (S), Quality (Q), Packaging (P), Storage (T), Handling (H)
- Services templates might need: Scope (S), Deliverables (D), Timeline (T), Reporting (R), Acceptance (A)

**Each template defines its own appendix labels and purposes** - the system supports full flexibility.

## SOW Template Selection by Order Type

### Two-Level Template Selection Hierarchy

1. **Order Type Selection** (PO/WO/SO) → Determines which SOW templates are available
2. **SOW Template Selection** → Defines which appendices are required for that specific template

### Purchase Order (PO) SOW Templates
When Order Type = "purchase_order", available SOW templates include:

- **Equipment Procurement SOW**: For machinery, vehicles, tools (Appendices A, B, C, E, F - includes safety compliance and installation requirements specific to equipment)
- **Materials Procurement SOW**: For raw materials, supplies, components (Appendices A, B, F - focuses on technical specs and quality without equipment-specific safety/installation needs)
- **IT Procurement SOW**: For computers, software, systems (Appendices A, D, F - emphasizes testing requirements over physical safety concerns)
- **Services Procurement SOW**: For maintenance, consulting, support (Appendices A, B, F - service scope and quality standards)

### Work Order (WO) SOW Templates
When Order Type = "work_order", available SOW templates include:

- **Construction SOW**: For building, renovation, infrastructure (Appendix A: Technical Specifications, Appendix C: Safety Requirements, Appendix E: Documentation Deliverables)
- **Installation SOW**: For equipment setup, system integration (Appendix A: Technical Specifications, Appendix C: Safety Requirements, Appendix E: Commissioning Documentation)
- **Maintenance SOW**: For facility upkeep, repairs (Appendix A: Scope of Work, Appendix B: Quality Standards, Appendix C: Safety Requirements)
- **Modification SOW**: For system upgrades, alterations (Appendix A: Technical Specifications, Appendix C: Safety Requirements, Appendix E: As-built Documentation)

### Service Order (SO) SOW Templates
When Order Type = "service_order", available SOW templates include:

- **Professional Services SOW**: For consulting, design, engineering (Appendix A: Scope of Services, Appendix B: Quality Standards, Appendix F: Legal Terms)
- **Technical Services SOW**: For specialized expertise, analysis (Appendix A: Scope of Services, Appendix D: Methodology, Appendix F: Legal Terms)
- **Training Services SOW**: For education, certification programs (Appendix A: Training Scope, Appendix B: Quality Standards, Appendix D: Assessment Methods)
- **Certification Services SOW**: For compliance, auditing, inspection (Appendix A: Scope of Certification, Appendix B: Quality Standards, Appendix D: Testing Protocols, Appendix F: Legal Terms)

**Each SOW template is designed for its order type category and defines exactly which appendices are required for that specific procurement scenario.**

## Template Variations by Order Type (Examples Only):
These are **example patterns only** - actual appendix requirements are determined by the specific template selected, not by broad order type categories. Different templates within the same order type may require different appendix combinations:

- **Materials (PO)**: Template-specific (e.g., Standard Materials needs A, F; Bulk Materials needs A, B, F)
- **Equipment (PO)**: Template-specific (e.g., Standard Equipment needs A, B, C, F; IT Equipment needs A, D, F)
- **Construction (WO)**: Template-specific (e.g., Building Construction needs A, C, E; Maintenance needs A, B, C)
- **Services (SO)**: Template-specific (e.g., Engineering Services needs A, B, F; Training Services needs A, B, D)

**The template itself defines exactly which appendices are required** - the system supports full flexibility for different procurement scenarios.

## Rollback Plan

If implementation encounters issues:
1. Keep existing modal as fallback
2. Gradually enable new features
3. Provide feature flags to disable complex components
4. Ensure backward compatibility with existing orders

This restructure transforms the modal from a basic order creation tool into a comprehensive procurement document management system with integrated SOW and multi-disciplinary collaboration capabilities.

## Integrated Document Workflow Management

### Enhanced Draft System Integration
The existing draft system (see `/Users/_PropAI/construct_ai/docs/pages-disciplines/1300_01300_MASTER_GUIDE_DOCUMENT_APPROVAL.md`) requires enhancement to support comprehensive procurement workflows. The current draft system provides basic multi-level approval workflows but needs expansion for procurement-specific requirements.

#### Required Enhancements to Draft System:
1. **Procurement-Specific Workflow States**: Add states for procurement order creation, discipline contribution, approval routing, and final execution
2. **Multi-Disciplinary Task Assignment**: Integration with discipline assignment matrix for appendix contributions
3. **Document Version Control**: Enhanced version tracking for iterative contributions across disciplines
4. **Approval Cover Sheet Integration**: Link draft workflows to approval cover sheet generation and routing
5. **Document Numbering Integration**: Automatic document numbering upon approval completion (see `/Users/_PropAI/construct_ai/docs/pages-disciplines/1300_00200_DOCUMENT_NUMBERING_COMPLETE_SYSTEM.md`)

#### Draft Workflow Enhancement Implementation:
```javascript
// Enhanced draft workflow states for procurement
const procurementWorkflowStates = {
  draft: 'Order framework created, awaiting discipline assignments',
  discipline_assignment: 'Disciplines assigned to appendices, tasks created',
  contribution: 'Disciplines contributing to assigned appendices',
  review: 'Technical review and cross-discipline validation',
  approval_routing: 'Approval cover sheet routing through governance matrix',
  approved: 'All approvals received, document numbered and distributed',
  executed: 'Order executed and archived'
};
```

### Workflow Builder Integration
The existing workflow builder (`/Users/_PropAI/construct_ai/docs/pages-disciplines/1300_01300_MASTER_GUIDE_WORKFLOW_BUILDER.md`) needs enhancement to ingest workflow diagrams and convert them to understandable matrices for governance control.

#### Workflow Diagram Ingestion:
1. **Diagram Upload Interface**: Allow governance teams to upload workflow diagrams (Visio, PDF, images)
2. **AI-Powered Conversion**: Use vision and NLP to extract workflow steps, roles, and decision points
3. **Matrix Generation**: Convert diagrams to searchable, editable matrices similar to chatbot/page tabs in settings

#### Enhanced Workflow Builder Features:
```javascript
// New workflow ingestion capabilities
const workflowIngestionService = {
  ingestDiagram: async (file) => {
    // Extract workflow from diagram
    const extractedWorkflow = await visionService.extractWorkflow(file);
    // Convert to matrix format
    const matrix = await workflowService.convertToMatrix(extractedWorkflow);
    // Store in governance-controlled matrix
    return await governanceService.saveWorkflowMatrix(matrix);
  },

  searchWorkflows: (criteria) => {
    // Search by work task: Vendor pre-qualification, Package strategy, etc.
    return governanceService.searchMatrices(criteria);
  }
};
```

### Template Management Integration
Integrate workflow functionality into `/Users/_PropAI/construct_ai/docs/pages-disciplines/1300_01300_MASTER_GUIDE_TEMPLATE_MANAGEMENT.md` to include governance-controlled workflow matrices.

#### Template-Workflow Integration:
1. **Workflow Template Types**: Add workflow templates alongside form/document templates
2. **Governance Matrix Control**: Governance team can edit workflow matrices, users can only view
3. **Search by Work Task**: Matrix searchable by work tasks (Vendor pre-qualification, Package strategy, Project Contracting Plan, etc.)
4. **Dynamic Prompt Keys**: Include prompt keys for agent integration

#### Implementation Structure:
```javascript
// Enhanced template management with workflow integration
const templateManagementService = {
  workflowTemplates: {
    // Governance-controlled matrices
    approvalMatrices: [], // Work task-based matrices
    distributionMatrices: [], // Who gets which documents
    agentPrompts: [] // HITL prompt keys for agent transition
  },

  governanceControls: {
    editableByGovernance: ['approvalMatrices', 'distributionMatrices'],
    searchableByAll: ['approvalMatrices', 'distributionMatrices', 'agentPrompts']
  }
};
```

## Governance-Controlled Approval Matrix

### Procurement Approval Workflows Management Page
Create a dedicated page for governance team control of procurement approval workflows, structured similarly to chatbot/page tabs in settings.

#### Matrix Structure:
- **Work Task Categories**: Vendor pre-qualification, Package strategy, Project Contracting Plan, Sole Source Justification, Early works & Execution, Tender Bid List approval, Expression of Interests, Draft RFP or Tender review, Tender evaluation criteria, Sort-listing, Conformed PO, Recommendation for award, Contract Variation, Close out, Release of warranty, Final Completion, Recommended Liquidated Damages
- **Dynamic and Editable**: All entries dynamic and editable by governance team only
- **Role-Based Search**: Search workflows by work task to find applicable approval processes

#### Page Implementation:
```javascript
// Procurement Approval Workflows Management Page
const ProcurementApprovalWorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');

  const workTasks = [
    'Vendor pre-qualification', 'Package strategy', 'Project Contracting Plan',
    'Sole Source Justification', 'Early works & Execution', 'Tender Bid List approval',
    'Expression of Interests', 'Draft RFP or Tender review', 'Tender evaluation criteria',
    'Sort-listing', 'Conformed PO', 'Recommendation for award', 'Contract Variation',
    'Close out', 'Release of warranty', 'Final Completion', 'Recommended Liquidated Damages'
  ];

  // Governance-only editing capabilities
  const canEdit = useUserRole() === 'governance';

  return (
    <div className="procurement-workflows-management">
      <SearchAndFilter
        workTasks={workTasks}
        onTaskSelect={setSelectedTask}
      />
      <WorkflowMatrix
        workflows={workflows}
        selectedTask={selectedTask}
        editable={canEdit}
        onUpdate={updateWorkflowMatrix}
      />
    </div>
  );
};
```

## Document Lifecycle Management

### Post-Approval Processing
After document approval, integrate with formal document control system and assign document numbers.

#### Document Numbering Integration:
```javascript
// Automatic document numbering upon approval
const documentNumberingIntegration = {
  onApprovalComplete: async (orderId) => {
    // Generate document number using numbering system
    const docNumber = await documentNumberingService.generateNumber({
      discipline: '01900',
      type: 'procurement_order',
      organization: currentOrg
    });

    // Update order with document number
    await procurementService.updateOrder(orderId, {
      document_number: docNumber,
      status: 'numbered'
    });

    // Trigger distribution workflow
    await distributionService.initiateDistribution(orderId);
  }
};
```

### Distribution Matrix
Governance-controlled matrix determining document distribution post-numbering.

#### Distribution Matrix Structure:
- **Document Types**: Different procurement document types require different distribution
- **Recipient Determination**: Matrix defines who receives which documents based on role, department, and document type
- **Automated Distribution**: System automatically distributes to assigned recipients after numbering

#### Implementation:
```javascript
// Distribution matrix controlled by governance
const distributionMatrix = {
  procurement_order: {
    procurement_team: ['procurement_manager', 'procurement_officer'],
    technical_team: ['project_manager', 'engineering_lead'],
    finance_team: ['cost_controller', 'finance_manager'],
    legal_team: ['legal_counsel'],
    executive_team: ['department_head', 'executive_sponsor']
  },

  getRecipients: (documentType, orderValue) => {
    const baseRecipients = distributionMatrix[documentType] || [];
    // Add additional recipients based on order value thresholds
    if (orderValue > 100000) {
      baseRecipients.push('senior_executive');
    }
    return baseRecipients;
  }
};
```

## Document Consistency and Formatting

### Order-Level Document Hierarchy
Ensure consistent formatting across all documents within an Order.

#### Formatting Standards:
- **Font Size**: Consistent sizing across all documents (headers, body, footnotes)
- **Indents**: Standardized indentation for sections and subsections
- **Numbering**: Consistent numbering schemes for sections, figures, tables
- **RBAC-Controlled Editing**: Formatting standards editable by governance team only

#### Implementation:
```javascript
// Order-level formatting standards
const orderFormattingStandards = {
  fonts: {
    header1: { size: 16, weight: 'bold', family: 'Arial' },
    header2: { size: 14, weight: 'bold', family: 'Arial' },
    body: { size: 11, family: 'Arial' },
    footnote: { size: 9, family: 'Arial' }
  },

  indents: {
    section: '0.5in',
    subsection: '0.75in',
    body: '1.0in'
  },

  numbering: {
    sections: '1.0, 1.1, 1.2',
    figures: 'Figure 1.0, Figure 1.1',
    tables: 'Table 1.0, Table 1.1'
  }
};
```

### Formatting Hierarchy Control
Apply formatting standards across entire document hierarchy within orders.

#### RBAC Implementation:
```javascript
// RBAC for formatting control
const formattingPermissions = {
  governance: {
    canEditStandards: true,
    canApplyStandards: true,
    canOverrideStandards: true
  },

  procurement_officer: {
    canEditStandards: false,
    canApplyStandards: true,
    canOverrideStandards: false
  },

  contributor: {
    canEditStandards: false,
    canApplyStandards: false,
    canOverrideStandards: false
  }
};
```

## Enhanced My Tasks Display System - Implementation Plan

### Overview
The existing My Tasks page (`/my-tasks`) currently displays outstanding actions grouped by document types. This enhancement transforms it into a hierarchical, searchable task management system with intelligent HITL (Human-In-The-Loop) navigation.

### Core Features

#### 1. Enhanced Search & Filter Bar
- **Discipline Filter**: Procurement, Engineering, Quality, Safety, Legal
- **Order Type Filter**: PO/SO/WO (dynamic based on selected discipline)
- **Document Type Filter**: Cover Sheet, SOW, Appendix A-F (within discipline)
- **Due Date Sort**: Ascending/descending
- **Status Filter**: Pending, In Progress, Completed, Overdue

#### 2. Hierarchical Task Display Structure
```
🔴 HITL Tasks (Agent Intervention Required)
├── 🤖 Agent needs approval for PO-2025-001 Cover Sheet
├── 🤖 Agent needs clarification for SO-2025-002 Appendix C

📋 Procurement Discipline (5 tasks)
├── 🛒 Purchase Orders (3 tasks)
│   ├── 📄 Cover Sheet - PO-2025-001 (Pending)
│   ├── 📋 PO Form - PO-2025-001 (In Progress)
│   └── 📄 SOW - PO-2025-001 (Pending)
└── 🔧 Service Orders (2 tasks)
    └── 📄 Cover Sheet - SO-2025-002 (Pending)

🏗️ Engineering Discipline (4 tasks)
├── 📋 SOW - PO-2025-001 (Pending)
├── 📑 Appendix A - PO-2025-001 (In Progress)
├── 📑 Appendix C - PO-2025-001 (Completed)
└── 📑 Appendix E - PO-2025-001 (Pending)
```

#### 3. Smart HITL Navigation (Option 6: Smart Default with Override)
- **Intelligent Defaults**:
  - Approval tasks → Page interface
  - Clarification tasks → Chatbot activation
  - Complex decisions → User choice modal
- **User Override**: Always show alternative options
- **Context Preservation**: Maintain task context across navigation methods

#### 4. Enhanced Task Cards
- **Hierarchical Context**: Show full path (Discipline > Order Type > Document)
- **Action Buttons**: Complete, Reassign, Add Comment, View Details
- **Status Indicators**: Priority, due dates, progress
- **Direct Navigation**: Click navigates to task-specific completion interface

### Additional Features

#### 5. Task Reassignment
- **User Selection**: Dropdown of available discipline members
- **Approval Workflow**: Optional approval for reassignments
- **Notification**: Automatic notification to new assignee

#### 6. Task Communication
- **Comments Thread**: Add notes, questions, clarifications
- **File Attachments**: Attach documents to tasks
- **Mention System**: @username notifications

#### 7. Push Notifications
- **Browser Notifications**: For task assignments, due dates, mentions
- **In-App Notifications**: Bell icon with notification center
- **Notification Preferences**: User-configurable notification settings

#### 8. Task Analytics Dashboard
- **Completion Rates**: By discipline, user, task type
- **Bottleneck Analysis**: Identify workflow slowdowns
- **Performance Metrics**: Average completion times, overdue rates

#### 9. Calendar Integration
- **Due Date Sync**: Tasks appear in external calendars
- **Calendar Overlay**: Color-coded task due dates
- **Reminder System**: Calendar-based reminders

#### 10. Task Lifecycle Management
- **Automatic Escalation**: Overdue tasks escalate to supervisors
- **Task Archiving**: Completed tasks archived after configurable period
- **Status Automation**: Auto-complete dependent tasks

### Technical Implementation

#### New Routes & Pages
```jsx
// Task-specific completion pages
<Route path="/purchase-orders/:orderId/cover-sheet" element={<OrderCoverSheetPage />} />
<Route path="/purchase-orders/:orderId/form" element={<OrderFormPage />} />
<Route path="/purchase-orders/:orderId/sow" element={<OrderSOWPage />} />
<Route path="/purchase-orders/:orderId/appendix/:appendixId" element={<OrderAppendixPage />} />

// HITL resolution
<Route path="/hitl/:taskId" element={<HITLResolutionPage />} />
```

#### Enhanced API Endpoints
```javascript
// Task management
GET /api/tasks/my-tasks?filters=...&sort=...
POST /api/tasks/:taskId/reassign
POST /api/tasks/:taskId/comment
GET /api/tasks/analytics

// HITL management
GET /api/tasks/hitl-tasks
POST /api/tasks/hitl/:taskId/resolve
POST /api/tasks/hitl/:taskId/chat
```

#### Database Schema Extensions
```sql
-- Task assignments and reassignments
ALTER TABLE tasks ADD COLUMN assigned_to UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN reassigned_from UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN reassigned_at TIMESTAMP;

-- Task comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES users(id),
  comment TEXT,
  created_at TIMESTAMP
);

-- Task analytics
CREATE TABLE task_analytics (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  action VARCHAR(50), -- 'created', 'completed', 'reassigned'
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMP
);
```

### Implementation Phases

#### Phase 1: Core Task Display (Week 1-2)
1. Enhanced search/filter bar
2. Hierarchical task organization
3. Task-specific navigation routes
4. Basic HITL integration

#### Phase 2: Task Management Features (Week 3-4)
1. Task reassignment system
2. Comments and communication
3. Push notifications
4. Calendar integration

#### Phase 3: Advanced Features (Week 5-6)
1. Task analytics dashboard
2. Automatic escalation
3. Task lifecycle management
4. Performance optimizations

### Success Metrics
- **Task Completion Time**: Reduced from current average
- **User Satisfaction**: Survey-based feedback on usability
- **HITL Resolution Efficiency**: Time to resolve agent interventions
- **Task Visibility**: Users can find and access tasks quickly
- **Collaboration Quality**: Improved communication through comments

## Multi-Disciplinary Contribution Workflow

### Order Creation with Integrated SOW

#### Enhanced Appendix Flexibility
Add support for including attachments in appendices (PDF, DOC, DOCX, XLS, XLSX, DWG, and other project documents containing supplementary data about logistics, technical drawings, calculations, etc.).

##### Supported File Types:
- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX
- **CAD Drawings**: DWG, DXF
- **Images**: JPG, PNG, TIFF, BMP
- **Archives**: ZIP (containing multiple related files)

##### Attachment Management:
- **Multi-file Upload**: Support multiple attachments per appendix
- **File Validation**: Size limits, type restrictions, virus scanning
- **Version Tracking**: Track attachment versions alongside content versions
- **Preview Integration**: Inline preview for supported file types
- **Download Controls**: Secure access with audit logging

```javascript
// Enhanced appendix structure with comprehensive attachment support
const appendixStructure = {
  appendix_a: {
    title: "Technical Specifications",
    content: "",
    attachments: [
      {
        id: "uuid",
        filename: "equipment_specs.pdf",
        fileType: "application/pdf",
        fileSize: 2048576, // bytes
        uploadedBy: "user_id",
        uploadedAt: "timestamp",
        version: "1.0",
        description: "Equipment technical specifications and requirements",
        tags: ["technical", "equipment", "specs"],
        securityLevel: "internal", // internal, confidential, restricted
        previewAvailable: true
      },
      {
        id: "uuid",
        filename: "installation_diagram.dwg",
        fileType: "application/acad",
        fileSize: 5120000,
        uploadedBy: "user_id",
        uploadedAt: "timestamp",
        version: "2.1",
        description: "CAD drawing showing installation requirements",
        tags: ["drawing", "installation", "cad"],
        securityLevel: "internal",
        previewAvailable: false // DWG may require external viewer
      }
    ],
    disciplines: ['engineering'],
    allowAttachments: true,
    maxAttachments: 10,
    maxFileSize: 50 * 1024 * 1024, // 50MB per file
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'application/acad']
  },

  // ... other appendices
};

// File type validation and handling
const fileTypeHandlers = {
  'application/pdf': {
    preview: true,
    thumbnail: true,
    textExtraction: true,
    supported: true
  },
  'application/msword': {
    preview: false,
    thumbnail: false,
    textExtraction: true,
    supported: true
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    preview: true,
    thumbnail: false,
    textExtraction: true,
    supported: true
  },
  'application/acad': {
    preview: false,
    thumbnail: true,
    textExtraction: false,
    supported: true,
    externalViewer: true
  }
};
```

##### Attachment UI Components:
```javascript
// Attachment management component
const AppendixAttachments = ({ appendix, attachments, onUpload, onDelete, onDownload }) => {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="appendix-attachments">
      <div className="attachment-header">
        <h6>Attachments</h6>
        <FileUploadButton
          multiple={true}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.jpg,.png"
          onUpload={onUpload}
          maxSize={50 * 1024 * 1024}
        />
      </div>

      <div className="attachments-list">
        {attachments.map(attachment => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onDelete={onDelete}
            onDownload={onDownload}
            canPreview={fileTypeHandlers[attachment.fileType]?.preview}
          />
        ))}
      </div>

      {attachments.length === 0 && (
        <div className="no-attachments">
          <p>No attachments yet. Drag and drop files here or click upload.</p>
        </div>
      )}
    </div>
  );
};
```

### Phase 2: Multi-Discipline Assignment Interface

#### Active Organization Disciplines Integration
Disciplines selected from active organization's disciplines. For default EPCM organization: approximately 45 disciplines including various engineering disciplines (Civil, Structural, Process, Mechanical, Electrical, Instrumentation, etc.).

```javascript
// Load disciplines from active organization
const loadOrganizationDisciplines = async () => {
  const orgDisciplines = await organizationService.getActiveDisciplines(currentOrg);
  // EPCM org has ~45 disciplines: Civil, Structural, Process, Mechanical, Electrical, etc.
  setAllDisciplines(orgDisciplines);
};
```

## Agent Transition Planning

### AI Agent-Centric Workflow Conversion
The enhanced procurement modal restructure is specifically designed to facilitate seamless conversion to AI agent-centric workflows, leveraging the task-based architecture, structured data flows, and HITL integration points.

#### Agent-Friendly Design Principles
1. **Modular Task Structure**: Individual task cards per appendix/discipline enable parallel agent execution
2. **Structured Data Inputs**: Template-driven forms provide consistent data for agent processing
3. **Validation Checkpoints**: Clear acceptance criteria enable automated quality assurance
4. **Audit Trail Integration**: Complete logging supports agent accountability and learning
5. **HITL Decision Points**: Natural workflow pauses for human expertise when needed

#### Agent-Executable Workflow Components

##### 1. Order Creation & Validation (Agent-Automated)
```javascript
// Agent can fully automate order creation
const agentOrderCreation = {
  inputs: {
    projectId: "from user selection",
    orderType: "purchase_order|work_order|service_order",
    basicRequirements: "natural language description"
  },

  agentSteps: [
    {
      step: "requirement_analysis",
      agent: "ProcurementAnalysisAgent",
      action: "Analyze requirements and suggest appropriate order type and value",
      output: "structured_order_draft"
    },
    {
      step: "template_recommendation",
      agent: "TemplateMatchingAgent",
      action: "Match requirements to optimal SOW template based on historical data",
      output: "recommended_template"
    },
    {
      step: "discipline_suggestion",
      agent: "DisciplineAssignmentAgent",
      action: "Suggest discipline assignments based on template requirements and project context",
      output: "discipline_assignments"
    }
  ],

  hitlPoint: "final_review",
  humanAction: "Review and approve automated order creation"
};
```

##### 2. Multi-Disciplinary Content Contribution (Parallel Agent Execution)
```javascript
// Agents can contribute to appendices autonomously
const agentAppendixContribution = {
  perAppendixAutomation: {
    engineering_appendix_a: {
      agent: "TechnicalSpecificationAgent",
      inputs: ["order_requirements", "project_standards", "historical_specs"],
      actions: [
        "draft_technical_requirements",
        "validate_against_standards",
        "generate_calculation_sheets",
        "attach_relevant_drawings"
      ],
      outputs: ["content_draft", "attachments[]", "validation_report"]
    },

    quality_appendix_b: {
      agent: "QualityAssuranceAgent",
      inputs: ["technical_specs", "industry_standards", "project_quality_plan"],
      actions: [
        "generate_quality_requirements",
        "create_testing_protocols",
        "add_compliance_checklists"
      ]
    }
  },

  coordinationAgent: {
    role: "ContributionCoordinatorAgent",
    responsibilities: [
      "monitor_appendix_completion",
      "validate_cross-appendix_consistency",
      "flag_conflicts_for_human_resolution",
      "notify_next_workflow_step"
    ]
  }
};
```

##### 3. Document Assembly & Validation (Agent-Driven)
```javascript
// Agent orchestrates final document assembly
const agentDocumentAssembly = {
  assemblyAgent: {
    role: "DocumentAssemblerAgent",
    inputs: ["all_appendix_contributions", "template_structure", "formatting_standards"],
    actions: [
      {
        step: "content_integration",
        action: "Merge all appendix content into integrated document structure"
      },
      {
        step: "consistency_validation",
        action: "Cross-reference requirements across appendices for consistency"
      },
      {
        step: "formatting_application",
        action: "Apply organizational formatting standards automatically"
      },
      {
        step: "attachment_processing",
        action: "Validate and organize all file attachments"
      }
    ],
    outputs: ["integrated_document", "validation_report", "ready_for_review"]
  },

  qualityAgent: {
    role: "DocumentQualityAgent",
    actions: [
      "final_spellcheck_grammar",
      "completeness_verification",
      "compliance_check",
      "generate_quality_score"
    ]
  }
};
```

##### 4. Approval Routing (Agent-Coordinated)
```javascript
// Agent manages approval workflow using governance matrices
const agentApprovalRouting = {
  routingAgent: {
    role: "ApprovalRoutingAgent",
    inputs: ["order_details", "governance_matrices", "stakeholder_directory"],
    actions: [
      {
        step: "matrix_lookup",
        action: "Query governance matrix for required approvals based on order characteristics"
      },
      {
        step: "stakeholder_identification",
        action: "Identify and prioritize approval stakeholders"
      },
      {
        step: "parallel_routing",
        action: "Send approval requests to multiple stakeholders simultaneously"
      },
      {
        step: "escalation_monitoring",
        action: "Monitor approval progress and trigger escalations if needed"
      }
    ]
  },

  notificationAgent: {
    role: "StakeholderCommunicationAgent",
    actions: [
      "generate_personalized_notifications",
      "provide_approval_context",
      "send_reminders",
      "collect_feedback"
    ]
  }
};
```

### HITL Integration Points
Strategic human intervention points where agent automation gives way to human expertise:

#### 1. **Complex Business Decisions**
```javascript
const hitlPoints = {
  strategic_decisions: {
    trigger: "order_value > $500K OR high_risk_classification",
    human_action: "executive_review",
    context_provided: ["agent_recommendations", "risk_assessment", "market_analysis"],
    decision_options: ["approve", "modify", "reject_with_feedback"]
  },

  stakeholder_conflicts: {
    trigger: "conflicting_appendix_requirements OR stakeholder_disagreements",
    human_action: "facilitated_resolution",
    context_provided: ["conflict_analysis", "stakeholder_positions", "compromise_options"]
  }
};
```

#### 2. **Exception Handling**
```javascript
const exceptionHandling = {
  agent_failure: {
    trigger: "agent_unable_to_complete_task",
    human_action: "manual_intervention",
    context_provided: ["failure_reason", "partial_results", "suggested_alternatives"]
  },

  unusual_patterns: {
    trigger: "deviation_from_historical_norms",
    human_action: "pattern_validation",
    context_provided: ["anomaly_details", "historical_comparison", "business_justification"]
  }
};
```

### Permission System for Agent Integration
The redesigned permission system supports seamless agent-human collaboration:

#### Agent Permission Model
```javascript
// Agent permissions mapped to human equivalents
const agentPermissions = {
  procurement_creation_agent: {
    can_create_orders: true,
    can_select_templates: true,
    can_suggest_disciplines: true,
    can_read_project_data: true,
    cannot_approve_executive: false, // Explicit restriction
    cannot_modify_governance: false
  },

  contribution_agents: {
    scoped_permissions: {
      appendix_a: { can_edit: true, can_upload: true, can_validate: true },
      other_appendices: { can_read: true, can_comment: false }
    },
    collaboration_permissions: {
      can_coordinate_with_other_agents: true,
      can_request_human_clarification: true,
      can_escalate_issues: true
    }
  }
};
```

#### HITL Permission Overrides
```javascript
// Human override capabilities at HITL points
const hitlOverrides = {
  human_can_override: [
    "agent_decisions",
    "workflow_routing",
    "approval_assignments",
    "document_content"
  ],

  override_audit: {
    log_override: true,
    require_justification: true,
    notify_original_agent: true
  }
};
```

### Agent Learning & Improvement Integration
The workflow design supports continuous agent improvement:

#### Learning from Human Feedback
```javascript
const agentLearning = {
  feedback_collection: {
    explicit_feedback: "human_ratings_and_comments",
    implicit_feedback: "approval_rates_and_override_patterns",
    contextual_feedback: "business_outcome_correlation"
  },

  model_improvement: {
    retraining_triggers: ["performance_thresholds", "new_patterns", "human_corrections"],
    data_annotation: "convert_human_actions_to_training_data",
    version_control: "track_agent_model_versions"
  }
};
```

#### Performance Analytics for Agent Optimization
```javascript
const agentAnalytics = {
  metrics: {
    task_completion_rate: "percentage_of_automated_steps",
    human_intervention_rate: "HITL_frequency",
    quality_score: "human_satisfaction_ratings",
    efficiency_gain: "time_saved_vs_manual_process"
  },

  optimization: {
    bottleneck_identification: "slow_steps_analysis",
    automation_expansion: "identify_new_automatable_steps",
    agent_specialization: "create_domain_specific_agents"
  }
};
```

### Conversion Roadmap: Manual → Hybrid → Agent-Centric

#### Phase 1: Hybrid Operation (Current → Enhanced)
- **Manual Tasks**: Order creation, discipline assignment, final approvals
- **Agent Assistance**: Template suggestions, content validation, formatting
- **HITL Points**: All major decisions require human confirmation

#### Phase 2: Agent-Augmented (Enhanced → Agent-Assisted)
- **Agent Tasks**: Routine content generation, basic validations, notifications
- **Manual Tasks**: Complex decisions, stakeholder management, exceptions
- **HITL Points**: High-value decisions, conflicts, strategic choices

#### Phase 3: Agent-Centric (Agent-Assisted → Agent-Driven)
- **Agent Tasks**: End-to-end workflow orchestration, most content generation
- **Manual Tasks**: Oversight, strategic decisions, quality assurance
- **HITL Points**: Only critical business decisions and exceptions

### Technical Enablers for Agent Conversion

#### 1. **Structured API Layer**
All workflow steps exposed via APIs enable agent integration without UI dependencies.

#### 2. **Event-Driven Architecture**
Workflow state changes trigger agent actions automatically.

#### 3. **Audit Trail Integration**
Complete logging supports agent accountability and continuous improvement.

#### 4. **Modular Agent Architecture**
Individual agents per workflow step enable specialization and parallel execution.

#### 5. **Feedback Loop Integration**
Human feedback directly improves agent performance over time.

This agent-centric design transforms the procurement process from manual coordination to intelligent automation while maintaining human oversight where it matters most.

### Permission System Review
Review and potentially redesign permissions for pages, agents, and chatbots to support agent-based workflow execution.

#### Permission Reassessment Areas:
1. **Page Permissions**: Which pages can agents access vs humans?
2. **Agent Permissions**: What actions can agents perform autonomously?
3. **Chatbot Permissions**: How do chatbots integrate with agent workflows?
4. **HITL Permissions**: What permissions are needed for human intervention points?

#### Permission Integration:
```javascript
// Integrated permission system for agents and humans
const integratedPermissions = {
  evaluateAccess: (userType, action, resource) => {
    if (userType === 'agent') {
      return agentPermissionService.checkPermission(action, resource);
    } else if (userType === 'human') {
      return userPermissionService.checkPermission(action, resource);
    } else if (userType === 'chatbot') {
      return chatbotPermissionService.checkPermission(action, resource);
    }
  },

  hitlOverride: (action, resource) => {
    // Allow human override at HITL points regardless of agent permissions
    return userPermissionService.canOverride(action, resource);
  }
};
```

## Document Review and Inconsistencies

### Reviewed Documents Analysis:
1. **Document Approval System**: Comprehensive draft system exists but needs procurement-specific enhancements
2. **Workflow Builder**: Visual design capabilities exist but need diagram ingestion and matrix conversion
3. **Template Management**: Template system exists but needs workflow integration
4. **Approval Matrix**: Governance-controlled matrices exist but need procurement-specific workflows
5. **Document Numbering**: Complete system exists for post-approval numbering
6. **Document Management**: Comprehensive system exists for distribution and lifecycle management

### Identified Inconsistencies:
1. **Workflow State Definitions**: Procurement workflows need additional states beyond current draft system
2. **Matrix Search Capabilities**: Current matrices not searchable by work tasks as required
3. **Attachment Support**: Current appendix structure doesn't support file attachments
4. **Agent Integration**: Current permissions don't account for agent vs human execution models

### Resolution Plan:
1. **Extend Draft System**: Add procurement-specific workflow states and transitions
2. **Enhance Matrix Search**: Add work task-based search capabilities to approval matrices
3. **Appendix Attachments**: Modify appendix structure to support file attachments
4. **Permission Redesign**: Create integrated permission system supporting agents, humans, and chatbots

## Success Criteria (Enhanced)

### Functional Enhancements:
- ✅ SOW template selection with dynamic appendix requirements
- ✅ Multi-discipline assignment interface (Order, SOW, Cover Sheet)
- ✅ Dynamic appendix requirements display
- ✅ Approval cover sheet generation
- ✅ Integrated document workflow management with enhanced draft system
- ✅ Workflow diagram ingestion and matrix conversion
- ✅ Governance-controlled approval matrices with work task search
- ✅ Post-approval document numbering integration
- ✅ Document distribution matrix implementation
- ✅ Consistent formatting across order document hierarchy
- ✅ Attachment support in appendices
- ✅ Active organization disciplines integration (~45 for EPCM)
- ✅ Agent transition planning with HITL integration

### Technical Enhancements:
- ✅ Enhanced draft system with procurement workflow states
- ✅ Workflow builder diagram ingestion capabilities
- ✅ Template management workflow integration
- ✅ RBAC-controlled formatting standards
- ✅ Integrated permission system for agents and humans
- ✅ Document lifecycle management from creation to archive

### Business Process Enhancements:
- ✅ End-to-end procurement document workflow
- ✅ Multi-disciplinary collaboration framework
- ✅ Governance-controlled approval processes
- ✅ Automated document distribution
- ✅ Agent-assisted workflow execution with human oversight

## Implementation Timeline (Enhanced)

### Phase 1: Core Procurement Workflow (Weeks 1-2)
1. SOW template selection and appendix requirements
2. Multi-discipline assignment interface
3. Dynamic appendix display with attachment support
4. Enhanced draft system integration

### Phase 2: Workflow and Governance Integration (Weeks 3-4)
1. Workflow builder diagram ingestion
2. Governance-controlled approval matrices
3. Template management workflow integration
4. Document numbering and distribution integration

### Phase 3: Advanced Features and Agent Transition (Weeks 5-6)
1. Consistent formatting across document hierarchy
2. Agent transition planning and HITL integration
3. Permission system redesign
4. End-to-end testing and validation

### Phase 4: Production Deployment and Monitoring (Weeks 7-8)
1. Production deployment with feature flags
2. User training and documentation
3. Performance monitoring and optimization
4. Iterative improvements based on usage feedback
