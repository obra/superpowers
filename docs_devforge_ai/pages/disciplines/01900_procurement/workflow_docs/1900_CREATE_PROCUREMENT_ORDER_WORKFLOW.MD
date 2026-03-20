flowchart TD
    %% Start
    START([🎯 Start Order Creation])

    %% Phase 1: Order Information
    subgraph "Phase 1: Basic Info"
        P1_TITLE[📝 Basic Details]
        P1_TYPE[Order Type Selection]
        P1_DISCIPLINE[Primary Discipline]
        P1_BASIC[Title & Description]
        P1_FINANCIAL[Value & Project]
        P1_SUPPLIER[Supplier Info]
        P1_REQUIREMENTS[Special Requirements]
        P1_DOCUMENTS[Document Links]
    end

    %% Phase 2: Template Selection
    subgraph "Phase 2: Template Selection"
        P2_TITLE[📋 SOW Templates]
        P2_FILTER[Auto-Filter by Type]
        P2_SELECT[Choose Template]
        P2_PREVIEW[Template Preview]
        P2_AUTO_ASSIGN[Discipline Suggestions]
        P2_SEQUENCE[Task Sequence Preview]
    end

    %% Phase 3: Discipline Assignment
    subgraph "Phase 3: Assign Disciplines"
        P3_TITLE[👥 Discipline Mapping]
        P3_APPENDICES[Appendix\nAssignment]
        P3_USERS[User\nAssignment]
        P3_VALIDATION[Validate Assignments]
        P3_SUGGESTIONS[Template Suggestions]
    end

    %% Phase 4: Approval Configuration
    subgraph "Phase 4: Approval Setup"
        P4_TITLE[✅ Approval Config]
        P4_MATRIX[Auto Approval Matrix]
        P4_COVER_SHEET[Cover\nSheet\nOptions]
        P4_ROUTING[Sequential\nParallel\nHybrid]
        P4_HYBRID[Complex\nRouting\nPaths]
        P4_VALIDATION[Validate\nApprovers]
    end

    %% Phase 5: Review & Create
    subgraph "Phase 5: Review & Submit"
        P5_TITLE[🔍 Final Review]
        P5_SUMMARY[Order Summary]
        P5_VALIDATION[Validation Check]
        P5_SUBMIT[Create Order]
        P5_WORKFLOW[Trigger Approvals]
    end

    %% End States
    SUCCESS([✅ Order Created])
    CANCEL([❌ Cancelled])

    %% Phase Transitions
    START --> P1_TITLE

    %% Phase 1 Flow
    P1_TITLE --> P1_TYPE
    P1_TYPE --> P1_DISCIPLINE
    P1_DISCIPLINE --> P1_BASIC
    P1_BASIC --> P1_FINANCIAL
    P1_FINANCIAL --> P1_SUPPLIER
    P1_SUPPLIER --> P1_REQUIREMENTS
    P1_REQUIREMENTS --> P1_DOCUMENTS

    %% Navigation between phases
    P1_DOCUMENTS -->|Next Button| P2_TITLE
    P2_TITLE --> P2_FILTER
    P2_FILTER --> P2_SELECT
    P2_SELECT --> P2_PREVIEW
    P2_PREVIEW --> P2_AUTO_ASSIGN
    P2_AUTO_ASSIGN --> P2_SEQUENCE

    P2_SEQUENCE -->|Next Button| P3_TITLE
    P3_TITLE --> P3_APPENDICES
    P3_APPENDICES --> P3_USERS
    P3_USERS --> P3_VALIDATION
    P3_VALIDATION --> P3_SUGGESTIONS

    P3_SUGGESTIONS -->|Next Button| P4_TITLE
    P4_TITLE --> P4_MATRIX
    P4_MATRIX --> P4_COVER_SHEET
    P4_COVER_SHEET --> P4_ROUTING
    P4_ROUTING --> P4_HYBRID
    P4_HYBRID --> P4_VALIDATION

    P4_VALIDATION -->|Next Button| P5_TITLE
    P5_TITLE --> P5_SUMMARY
    P5_SUMMARY --> P5_VALIDATION
    P5_VALIDATION --> P5_SUBMIT
    P5_SUBMIT --> P5_WORKFLOW

    %% Final transitions
    P5_WORKFLOW --> SUCCESS

    %% Cancel options from any phase
    P1_TITLE -.->|Cancel Button| CANCEL
    P2_TITLE -.->|Previous Button| P1_TITLE
    P2_TITLE -.->|Cancel Button| CANCEL
    P3_TITLE -.->|Previous Button| P2_TITLE
    P3_TITLE -.->|Cancel Button| CANCEL
    P4_TITLE -.->|Previous Button| P3_TITLE
    P4_TITLE -.->|Cancel Button| CANCEL
    P5_TITLE -.->|Previous Button| P4_TITLE
    P5_TITLE -.->|Cancel Button| CANCEL

    %% Phase indicators at top
    PHASE1_INDICATOR[Phase 1 of 5 - 📝 Order Information]
    PHASE2_INDICATOR[Phase 2 of 5 - 📋 Template Selection]
    PHASE3_INDICATOR[Phase 3 of 5 - 👥 Assign Disciplines]
    PHASE4_INDICATOR[Phase 4 of 5 - ✅ Approval Setup]
    PHASE5_INDICATOR[Phase 5 of 5 - 🔍 Review & Create]

    %% Connect phase indicators
    PHASE1_INDICATOR -.-> P1_TITLE
    PHASE2_INDICATOR -.-> P2_TITLE
    PHASE3_INDICATOR -.-> P3_TITLE
    PHASE4_INDICATOR -.-> P4_TITLE
    PHASE5_INDICATOR -.-> P5_TITLE

    %% Styling
    classDef phase1 fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef phase2 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef phase3 fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef phase4 fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef phase5 fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef success fill:#d4edda,stroke:#155724,stroke-width:3px
    classDef cancel fill:#f8d7da,stroke:#721c24,stroke-width:2px
    classDef indicator fill:#ffffff,stroke:#6c757d,stroke-width:1px

    class P1_TITLE,P1_TYPE,P1_DISCIPLINE,P1_BASIC,P1_FINANCIAL,P1_SUPPLIER,P1_REQUIREMENTS,P1_DOCUMENTS phase1
    class P2_TITLE,P2_FILTER,P2_SELECT,P2_PREVIEW,P2_AUTO_ASSIGN,P2_SEQUENCE phase2
    class P3_TITLE,P3_APPENDICES,P3_USERS,P3_VALIDATION,P3_SUGGESTIONS phase3
    class P4_TITLE,P4_MATRIX,P4_COVER_SHEET,P4_ROUTING,P4_HYBRID,P4_VALIDATION phase4
    class P5_TITLE,P5_SUMMARY,P5_VALIDATION,P5_SUBMIT,P5_WORKFLOW phase5
    class SUCCESS success
    class CANCEL cancel
    class PHASE1_INDICATOR,PHASE2_INDICATOR,PHASE3_INDICATOR,PHASE4_INDICATOR,PHASE5_INDICATOR indicator

# Create New Procurement Order Workflow

---

## 🚨 **COPYABLE NODE LABELS - QUICK REFERENCE GUIDE**

> **⚠️ IMPORTANT: ONLY copy labels from the YELLOW code blocks below**
>
> **📋 These are the EXACT node labels used in the Mermaid diagram above**
> **🎯 COPY DIRECTLY from these code blocks into your Mermaid diagrams**
> **🚫 DO NOT copy from the narrative text below - only from these code blocks!**

---

## 📋 **QUICK REFERENCE: Copyable Node Labels by Phase**

### **Phase 1: Basic Info** - Copyable Node Labels
```yaml
📝 Basic Details
Order Type Selection
Primary Discipline
Title & Description
Value & Project
Supplier Info
Special Requirements
Document Links
```

### **Phase 2: Template Selection** - Copyable Node Labels
```yaml
📋 SOW Templates
Auto-Filter by Type
Choose Template
Template Preview
Discipline Suggestions
Task Sequence Preview
```

### **Phase 3: Assign Disciplines** - Copyable Node Labels
```yaml
👥 Discipline Mapping
Appendix\nAssignment
User\nAssignment
Validate Assignments
Template Suggestions
```

### **Phase 4: Approval Setup** - Copyable Node Labels
```yaml
✅ Approval Config
Auto Approval Matrix
Cover\nSheet\nOptions
Sequential\nParallel\nHybrid
Complex\nRouting\nPaths
Validate\nApprovers
```

### **Phase 5: Review & Submit** - Copyable Node Labels
```yaml
🔍 Final Review
Order Summary
Validation Check
Create Order
Trigger Approvals
```

---

## Overview
The "Create New Procurement Order" modal guides users through a comprehensive 5-phase workflow designed to capture all necessary information for compliant procurement document generation. The workflow ensures proper discipline assignment, approval routing, and document structure while minimizing user input through intelligent defaults and automation.

### Phase 1: Basic Info - Copyable Node Labels
```
📝 Basic Details
Order Type Selection
Primary Discipline
Title & Description
Value & Project
Supplier Info
Special Requirements
Document Links
```

### Phase 2: Template Selection - Copyable Node Labels
```
📋 SOW Templates
Auto-Filter by Type
Choose Template
Template Preview
Discipline Suggestions
Task Sequence Preview
```

### Phase 3: Assign Disciplines - Copyable Node Labels
```
👥 Discipline Mapping
Appendix\nAssignment
User\nAssignment
Validate Assignments
Template Suggestions
```

### Phase 4: Approval Setup - Copyable Node Labels
```
✅ Approval Config
Auto Approval Matrix
Cover\nSheet\nOptions
Sequential\nParallel\nHybrid
Complex\nRouting\nPaths
Validate\nApprovers
```

### Phase 5: Review & Submit - Copyable Node Labels
```
🔍 Final Review
Order Summary
Validation Check
Create Order
Trigger Approvals
```

---

## Phase Summary Blocks (Copyable Labels)

### Phase 1: Basic Info - Copyable Node Labels
```
📝 Basic Details
Order Type Selection
Primary Discipline
Title & Description
Value & Project
Supplier Info
Special Requirements
Document Links
```

### Phase 2: Template Selection - Copyable Node Labels
```
📋 SOW Templates
Auto-Filter by Type
Choose Template
Template Preview
Discipline Suggestions
Task Sequence Preview
```

### Phase 3: Assign Disciplines - Copyable Node Labels
```
👥 Discipline Mapping
Appendix\nAssignment
User\nAssignment
Validate Assignments
Template Suggestions
```

### Phase 4: Approval Setup - Copyable Node Labels
```
✅ Approval Config
Auto Approval Matrix
Cover\nSheet\nOptions
Sequential\nParallel\nHybrid
Complex\nRouting\nPaths
Validate\nApprovers
```

### Phase 5: Review & Submit - Copyable Node Labels
```
🔍 Final Review
Order Summary
Validation Check
Create Order
Trigger Approvals
```

## Detailed Phase Breakdown

### Phase 1: Order Information (Basic Details & Requirements)
**Purpose**: Capture fundamental order information and establish the foundation for subsequent phases.

**Required User Inputs:**
- **Order Type**: Purchase Order, Service Order, or Work Order (required)
- **Primary Discipline**: Engineering, Procurement, Safety, Finance, etc. (optional but recommended)
- **Title**: Descriptive order title (required)
- **Description**: Detailed order description (optional)
- **Priority**: Low, Medium, High, or Urgent (default: Medium)
- **Estimated Value**: Financial value in specified currency (optional but affects approvals)
- **Currency**: ZAR, USD, EUR, GBP (default: ZAR)
- **Project**: Active project selection (required)
- **Supplier Information**: Name and contact details (optional)
- **Delivery Date**: Expected completion date (optional)
- **Special Requirements**: Technical notes, compliance requirements (optional)
- **Supporting Documents**: Link relevant documents via integrated browser (optional)

**System Intelligence:**
- Auto-populates user information (creator, organization)
- Loads available templates based on order type selection
- Filters projects by active status and organization scope

### Phase 2: Template Selection (Choose SOW Structure)
**Purpose**: Select the appropriate Scope of Work template that defines document structure and collaboration requirements.

**Required User Inputs:**
- **SOW Template Selection**: Choose from filtered templates based on order type (required)

**System Intelligence:**
- **Auto-filtering**: Templates filtered by order type (Purchase/Service/Work Order)
- **Template Preview**: Shows required appendices and structure
- **Auto-discipline Suggestions**: Pre-populates recommended disciplines for each appendix
- **Task Sequence Preview**: Visual workflow preview with editable steps for managers
- **Smart Defaults**: Template-driven discipline assignments that users can override

**Key Features:**
- Template variations (Standard, Complex, Emergency, Compliance) affect filtering
- Appendix requirements displayed (A-F scope sections)
- Task sequence canvas shows automated workflow steps
- Discipline suggestions based on template defaults (Engineering, Quality, Safety, etc.)

### Phase 3: Assign Disciplines (Map Teams to Appendices)
**Purpose**: Assign organizational disciplines and specific users to collaborate on each appendix section.

**Required User Inputs:**
- **Discipline Assignment**: Map disciplines to appendices A-F (required for template)
- **User Assignment**: Select specific users for each appendix (optional but recommended)

**System Intelligence:**
- **Auto-discipline Loading**: Available disciplines loaded from user permissions
- **User Auto-loading**: Users filtered by selected disciplines and organization scope
- **Validation**: Ensures required disciplines are assigned based on template
- **Template Inheritance**: Uses Phase 2 suggestions as defaults (user can modify)

**Appendix Structure:**
- **Appendix A**: Scope of Work (typically Engineering/Technical)
- **Appendix B**: Pricing/Commercial (Finance/Procurement)
- **Appendix C**: Schedule/Timeframes (Project Management)
- **Appendix D**: Technical Specifications (Engineering/Quality)
- **Appendix E**: Safety/Compliance (Safety/HSSE)
- **Appendix F**: Legal/Contractual (Legal/Procurement)

### Phase 4: Approval Setup (Configure Workflow Routing)
**Purpose**: Configure approval workflow and document routing based on order characteristics.

**Required User Inputs:**
- **Cover Sheet Generation**: Enable/disable approval cover sheet (default: enabled)
- **Routing Type**: Sequential, Parallel, or Hybrid approval flow (default: sequential)

**System Intelligence:**
- **Auto-approval Matrix**: Generated based on order value and type thresholds:
  - <$25k: Procurement Officer + Manager
  - $25k-$100k: + Department Head
  - >$100k: + Executive approval
  - Work Orders: Additional Safety Officer + Project Manager
- **Value-based Logic**: Automatic approver assignment based on limits of authority
- **Routing Intelligence**: Sequential for high-value, parallel for routine approvals

**Approval Types:**
- **Sequential**: Approvals in order (A→B→C)
- **Parallel**: Simultaneous approvals (A, B, C at once)
- **Hybrid**: Complex routing with both sequential and parallel paths

### Phase 5: Review & Create (Final Review & Submission)
**Purpose**: Final validation and order creation with comprehensive summary.

**Required User Inputs:**
- **Final Review**: Confirm all details are correct
- **Order Submission**: Click "Create Order" to proceed

**System Intelligence:**
- **Comprehensive Summary**: Shows all entered data, assignments, and configurations
- **Validation Gates**: Ensures required fields complete and prerequisites met
- **Order Creation**: Database record creation with all relationships
- **Workflow Initiation**: Automatic approval workflow assignment and cover sheet generation

**Post-Creation Actions:**
- Approval workflow automatically initiated
- Approvers notified based on matrix
- Cover sheet generated if enabled
- Procurement chatbot updates user on progress

## User Experience Flow

### Navigation
- **Linear Progression**: Phase 1→2→3→4→5 with validation gates
- **Back Navigation**: Previous button allows returning to modify earlier phases
- **Cancel Option**: Available from any phase, returns to order list without saving
- **Progress Indicators**: Visual phase progress (1/5, 2/5, etc.) with icons

### Validation & Intelligence
- **Smart Dependencies**: Phase 2 filters based on Phase 1 order type
- **Required Field Validation**: Cannot proceed without mandatory information
- **Auto-population**: User, organization, and template data pre-filled where possible
- **Contextual Help**: Tooltips and descriptions guide user input

### Error Handling
- **Field Validation**: Real-time validation with helpful error messages
- **Prerequisite Checks**: Ensures template selection before discipline assignment
- **User Permission Validation**: Verifies user can assign selected disciplines
- **Network Error Recovery**: Handles API failures gracefully with retry options

## Integration Points

### Data Sources
- **User Profiles**: Authentication and permission data
- **Organization Projects**: Active project filtering
- **Template Library**: SOW templates with discipline defaults
- **User Discipline Matrix**: Available users by discipline and role
- **Limits of Authority**: Approval matrix rules

### External Systems
- **Document Browser**: Integration for attaching supporting documents
- **Task Sequence API**: Automated workflow generation
- **Approval Workflow Engine**: Automated approver assignment and routing
- **Procurement Chatbot**: Real-time progress updates

## Success Metrics

### User Efficiency
- **Reduced Input**: Auto-population minimizes manual data entry
- **Guided Workflow**: Step-by-step guidance prevents errors
- **Template Reuse**: Previous order templates speed up creation

### Compliance & Quality
- **Structured Process**: Ensures all required information captured
- **Discipline Coverage**: Proper team assignment to appendices
- **Approval Routing**: Appropriate governance based on order value/risk

### System Performance
- **Automated Workflows**: Reduces manual coordination
- **Real-time Validation**: Prevents invalid orders
- **Scalable Assignment**: Handles complex multi-discipline orders

This workflow transforms complex procurement order creation into a guided, intelligent process that ensures compliance while maximizing user efficiency through automation and smart defaults.