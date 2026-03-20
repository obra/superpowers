graph TB
    %% User Interface Layer
    subgraph "User Interface Layer"
        DOM[Document Ordering Management<br/>document-ordering-management-page.js]
        TFM[Templates-Forms Management<br/>01900-template-management-page.js]
        COM[Create Order Modal<br/>CreateOrderModal.jsx]
    end

    %% Component Layer
    subgraph "Component Layer"
        SL[Section Library<br/>SectionLibrary.jsx]
        VC[Variation Canvas<br/>VariationCanvas.jsx]
        AP[Action Panel<br/>ActionPanel.jsx]
        TTM[Template Type Manager<br/>TemplateTypeManager.jsx]
        PTT[Procurement Templates Table<br/>ProcurementTemplatesTable.jsx]
        TSC[Task Sequence Cards<br/>TaskSequenceCards.jsx]
    end

    %% Service Layer
    subgraph "Service Layer"
        DSDS[Discipline Document Sections Service<br/>disciplineDocumentSectionsService.js]
        TTS[Template Types Service<br/>template-types API]
        PTS[Procurement Template Service<br/>procurement service]
        DSS[Document Structure Service<br/>documentStructureService.js]
        TGS[Template Generation Service<br/>templateGenerationService.js]
        DGS[DocumentGenerator Service<br/>DocumentGenerator.js - NEW]
        POT[Previous Order Templates Service<br/>procurement-orders API - NEW]
    end

    %% Agent Layer
    subgraph "Agent Layer"
        subgraph "Procurement Agent Workflow"
            PA1[Template Analysis Agent<br/>agent_procurement_01]
            PA2[Requirement Extraction Agent<br/>agent_procurement_02]
            PA3[Compliance Validation Agent<br/>agent_procurement_03]
            PA4[Field Population Agent<br/>agent_procurement_04]
            PA5[Quality Assurance Agent<br/>agent_procurement_05]
            PA6[Final Review Agent<br/>agent_procurement_06]
        end
        TSA[Task Sequencing Agent<br/>sequence API]
        DSA[Document Structure Agent<br/>documentStructureExtractionService.js]
        AO[Agent Orchestrator<br/>workflow_manager]
    end

    %% Database Layer
    subgraph "Database Layer"
        TT[template_types table<br/>PostgreSQL]
        DV[document_variations table<br/>PostgreSQL]
        DDS[discipline_document_sections table<br/>PostgreSQL]
        PT[procurement_templates table<br/>PostgreSQL]
        PO[procurement_orders table<br/>PostgreSQL]
    end

    %% API Layer
    subgraph "API Layer"
        TTAPI[Template Types API<br/>/api/template-types]
        DSAPI[Document Sections API<br/>/api/discipline-document-sections]
        PTAPI[Procurement Templates API<br/>/api/procurement-templates]
        SEQAPI[Sequence API<br/>/api/procurement/sequence]
        POTAPI[Previous Order Templates API<br/>/api/procurement/orders/templates - NEW]
    end

    %% User Workflow Sequence (Clear Step-by-Step)
    TFM -->|📝 1. MANAGE TEMPLATES| DOM
    DOM -->|📋 2. ORDER DOCUMENTS| COM
    COM -->|🚀 3. CREATE ORDER<br/>4-Step Hierarchical Selection:<br/>Order Type → Template Variation → SOW Template → Order Details| AO

    %% Progress Notifications (Multiple Channels)
    AO -.->|💬 Chatbot Updates| CB
    AO -.->|🔔 Push Notifications| PN
    AO -.->|📊 Progress Dashboard| PD
    AO -.->|📧 Email Alerts| EM

    %% UI to Component Mappings (Simplified)
    TFM -.->|uses| PTT
    TFM -.->|uses| TTM
    DOM -.->|uses| SL
    DOM -.->|uses| VC
    COM -.->|uses| TSC

    SL --> DSDS
    VC --> DSDS
    TTM --> TTS
    PTT --> PTS

    %% Procurement Agent Workflow Sequence (Clear Step-by-Step)
    AO -->|🎯 START| PA1
    PA1 -->|✅ PASS| PA2
    PA2 -->|📋 EXTRACT| PA3
    PA3 -->|⚖️ VALIDATE| PA4
    PA4 -->|📝 POPULATE| PA5
    PA5 -->|🔍 QA CHECK| PA6
    PA6 -->|📄 GENERATE DOCS| DG
    DG -->|🏁 COMPLETE| AO

    %% Document Generation Service
    subgraph "Document Generation Layer"
        DG[DocumentGenerator Service<br/>generateFromTemplate#40;#41;<br/>CLIENT COMPLIANT OUTPUT]
    end

    %% Human-in-the-Loop Layer
    subgraph "HITL - Human Review Layer"
        HITL_SOW[👤 SOW Review<br/>Human validates SOW content]
        HITL_APP_A[👤 Appendix A Review<br/>Human checks scope]
        HITL_APP_B[👤 Appendix B Review<br/>Human checks pricing]
        HITL_APP_C[👤 Appendix C Review<br/>Human checks schedule]
        HITL_APP_D[👤 Appendix D Review<br/>Human checks specs]
        HITL_APP_E[👤 Appendix E Review<br/>Human checks safety]
        HITL_APP_F[👤 Appendix F Review<br/>Human checks legal]
    end

    %% HITL Integration Points
    PA4 -.->|🧑‍💼 Request Review| HITL_SOW
    PA4 -.->|🧑‍💼 Request Review| HITL_APP_A
    PA4 -.->|🧑‍💼 Request Review| HITL_APP_B
    PA4 -.->|🧑‍💼 Request Review| HITL_APP_C
    PA4 -.->|🧑‍💼 Request Review| HITL_APP_D
    PA4 -.->|🧑‍💼 Request Review| HITL_APP_E
    PA4 -.->|🧑‍💼 Request Review| HITL_APP_F
    HITL_SOW -.->|✅ Approved| PA5
    HITL_APP_A -.->|✅ Approved| PA5
    HITL_APP_B -.->|✅ Approved| PA5
    HITL_APP_C -.->|✅ Approved| PA5
    HITL_APP_D -.->|✅ Approved| PA5
    HITL_APP_E -.->|✅ Approved| PA5
    HITL_APP_F -.->|✅ Approved| PA5

    %% Parallel Processing (Optional Optimization)
    PA2 -.->|⚡ parallel| PA3
    PA3 -.->|⚡ parallel| PA4

    %% Quality Assurance Feedback (Iterative Improvement)
    PA5 -.->|🔄 feedback| PA1
    PA5 -.->|🔄 feedback| PA2
    PA5 -.->|🔄 feedback| PA3
    PA5 -.->|🔄 feedback| PA4

    %% Service Integration (Simplified)
    PTS -.->|data| PA1
    PTS -.->|data| PA4
    TGS -.->|templates| PA4

    %% Supporting Agent Interactions (Background Processing)
    PA1 -.->|sequencing| TSA
    PA2 -.->|structure| DSA
    PA3 -.->|structure| DSA
    PA4 -.->|generation| TGS

    %% Performance Layer (Caching & Optimization)
    subgraph "Performance Layer"
        TC[⚡ Template Cache<br/>Redis/In-memory]
        CC[⚡ Compliance Cache<br/>Redis/In-memory]
    end

    PTS -.-> TC
    TC -.-> PA1
    TC -.-> PA4
    AO -.-> CC
    CC -.-> PA3

    TTS --> TTAPI
    DSDS --> DSAPI
    PTS --> PTAPI
    TSA --> SEQAPI
    %% DocumentGenerator uses procurement templates
    DGS --> PTAPI
    %% Previous Order Templates API
    POT --> POTAPI

    TTAPI --> TT
    DSAPI --> DDS
    PTAPI --> PT
    SEQAPI --> PO
    %% Previous Order Templates query procurement_orders
    POTAPI --> PO

    TT --> DV
    DV --> DDS

    %% Styling
    classDef ui fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef component fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef service fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef agent fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef orchestrator fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef cache fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef db fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef api fill:#f9fbe7,stroke:#827717,stroke-width:2px
    classDef hitl fill:#bbdefb,stroke:#1565c0,stroke-width:3px

    class DOM,TFM,COM ui
    class SL,VC,AP,TTM,PTT,TSC component
    class DSDS,TTS,PTS,DSS,TGS service
    class PA1,PA2,PA3,PA4,PA5,PA6,TSA,DSA agent
    class AO orchestrator
    class TC,CC cache
    class TT,DV,DDS,PT,PO db
    class TTAPI,DSAPI,PTAPI,SEQAPI api
    class HITL_SOW,HITL_APP_A,HITL_APP_B,HITL_APP_C,HITL_APP_D,HITL_APP_E,HITL_APP_F hitl

# System Integration Diagram - Optimized Procurement Workflow

This diagram shows the optimized interrelationships between system components with enhanced agent workflow, orchestration, caching, and error handling.

## Optimizations Implemented:
- **✅ ENFORCED sequential workflow**: Templates → Document Ordering → Order Creation → Agent Processing (now REQUIRED in code)
- **Detailed 6-agent procurement workflow** with sequential processing
- **Agent Orchestrator** for workflow management and error handling
- **Parallel processing** for requirement extraction, compliance validation, and field population
- **Feedback loops** from Quality Assurance to earlier agents
- **Validation gates** between workflow stages
- **Enhanced service integration** with all agents
- **Caching layer** for performance optimization
- **Comprehensive error handling flows**
- **Multi-channel progress notifications**: Chatbots, push notifications, dashboards, email alerts

## User Workflow Sequence:
1. **Template Management** (TFM) → User manages procurement templates
2. **Document Ordering** (DOM) → User arranges document sections and creates variations
3. **Order Creation** (COM) → User creates procurement orders through 4-step hierarchical selection:
   - **Step 1 - Order Type**: PO (Purchase Order), WO (Work Order), or SO (Service Order)
   - **Step 2 - Template Variation**: Standard/Complex/Emergency/Compliance complexity levels
   - **Step 3 - SOW Template**: Filtered templates showing required appendices based on variation
   - **Step 4 - Order Details**: Title, description, financials, and technical requirements
4. **Agent Processing** (AO → PA1-6) → Automated agent workflow processes the order

## Agent Workflow Sequence:
1. **Template Analysis** (PA1) → Evaluates template compatibility
2. **Requirement Extraction** (PA2) → Extracts technical specs and requirements
3. **Compliance Validation** (PA3) → Validates regulatory compliance
4. **Field Population** (PA4) → Populates template fields
5. **Quality Assurance** (PA5) → Validates document quality
6. **Final Review** (PA6) → Executive approval and execution

## User Progress Notifications

The system provides **multi-channel progress awareness** for agent processing through:

### 💬 **Chatbot Updates (Primary Channel)**
- **Real-time messaging** during agent processing
- **Contextual guidance** and explanations
- **Interactive Q&A** about progress and issues
- **Status summaries** with next steps

### 🔔 **Push Notifications (Immediate Alerts)**
- **Browser notifications** for major milestones
- **Mobile app notifications** (when applicable)
- **Critical issue alerts** requiring user attention
- **Completion confirmations**

### 📊 **Progress Dashboard (Visual Tracking)**
- **Real-time progress bars** showing agent completion %
- **Status indicators** for each workflow stage
- **Timeline views** of processing history
- **Performance metrics** and bottlenecks

### 📧 **Email Alerts (Non-urgent Updates)**
- **Daily/weekly summaries** for long-running processes
- **Completion notifications** with document links
- **Escalation alerts** for delayed processing
- **Quality assurance feedback** requiring review

### **Notification Triggers:**
- **Agent Start**: "Analysis beginning on your procurement order..."
- **Stage Completion**: "Template analysis complete, extracting requirements..."
- **Issues Found**: "Compliance check failed - please review safety requirements"
- **User Input Needed**: "Manual approval required for high-value contract"
- **Final Completion**: "Procurement document ready for execution"

---

# User Input Requirements Throughout Procurement Workflow

This diagram shows the **complete user input journey** from template creation to order creation, highlighting what information users must provide at each stage.

```mermaid
flowchart TD
    %% Start
    START([🎯 User Begins Procurement Process])

    %% Phase 1: Template Creation (Governance Level)
    subgraph "Phase 1: Template Creation (Governance/Template Admins)"
        T1[Navigate to Templates-Forms Management<br/>http://localhost:3060/#/templates-forms-management?discipline=01900]
        T2[Select Template Type<br/>• Form • Template • Schedule • Specification • Appendix]
        T3[Choose Discipline<br/>• Procurement (01900) • Safety • Engineering • etc.]
        T4[Input Template Details<br/>• Name • Description • HTML Content • Field Configuration]
        T5[Configure Field Properties<br/>• Field Name • Type • Protection Level • Validation Rules]
        T6[Set Template Permissions<br/>• Read/Write Access • User Roles • Organization Scope]
        T7[Save Template<br/>Status: Draft/Published]
    end

    %% Phase 2: Document Ordering (Governance Level)
    subgraph "Phase 2: Document Ordering (Governance/Discipline Leads)"
        D1[Navigate to Document Ordering Management<br/>http://localhost:3060/#/document-ordering-management]
        D2[Select Discipline<br/>• Procurement • Safety • Engineering • etc.]
        D3[Choose Contract Type<br/>• Purchase Order • Work Order • Service Order]
        D4[Arrange Document Sections<br/>Drag & Drop: Appendix A, B, C, D, E, F]
        D5[Configure Section Properties<br/>• Required/Optional • Document Types • User Assignments]
        D6[Save Document Variation<br/>• Variation Name • Description • Status]
    end

    %% Phase 3: Order Creation (Procurement Officers)
    subgraph "Phase 3: Order Creation (Procurement Officers)"
        O1[Navigate to Purchase Orders<br/>http://localhost:3060/#/purchase-orders]
        O2[Click 'Create New Order' Button<br/>Opens CreateOrderModal]
        O3[Step 1: Order Type<br/>PO/WO/SO Selection]
        O3b[Step 2: Template Variation<br/>Standard/Complex/Emergency/Compliance]
        O3c[Step 3: SOW Template<br/>Filtered by variation, shows appendices]
        O3d[Step 4: Order Details<br/>Title, description, financials]
        O4[Optionally Use Previous Order Template<br/>• Browse approved orders • Auto-fill form • Modify as needed]
        O5[Enter Order Details<br/>• Title (Required) • Description (Optional)]
        O6[Enter Financial Information<br/>• Estimated Value (ZAR) - Optional but recommended]
        O7[Specify Technical Requirements<br/>• Equipment Involved (Checkbox) • Compliance Required (Checkbox)]
        O8[Set Technical Complexity<br/>• Low/Medium/High dropdown]
        O9[Review Auto-Assignments<br/>System shows: Disciplines, Document Sections, Approval Matrix]
        O10[Submit Order<br/>System validates prerequisites and creates order]
    end

    %% Phase 4: Agent Processing (Automated)
    subgraph "Phase 4: Agent Processing (No User Input Required)"
        A1[Template Analysis Agent<br/>Evaluates compatibility - Automated]
        A2[Requirement Extraction Agent<br/>Extracts specs - Automated]
        A3[Compliance Validation Agent<br/>Checks regulations - Automated]
        A4[Field Population Agent<br/>Populates data - Automated]
        A5[Quality Assurance Agent<br/>Validates quality - Automated]
        A6[Final Review Agent<br/>Executive assessment - Automated]
        A7[DocumentGenerator Service<br/>Creates client-compliant documents - Automated]
    end

    %% Phase 5: Optional Manual Tasks (Discipline Specialists)
    subgraph "Phase 5: Optional Manual Tasks (Discipline Users)"
        M1[Receive Task Assignment<br/>Auto-assigned based on Phase 3 selections]
        M2[Navigate to SOW Document<br/>Via MyTasksDashboard task link]
        M3[Contribute to Assigned Appendices<br/>A-F based on user discipline/role]
        M4[Review & Approve Contributions<br/>Discipline leads validate work]
        M5[Mark Tasks Complete<br/>System tracks completion status]
    end

    %% Phase 6: Approval Process (Approvers)
    subgraph "Phase 6: Approval Process (Auto-Assigned Approvers)"
        AP1[Receive Approval Notification<br/>Based on limits of authority matrix]
        AP2[Review Order Details<br/>Access via approval dashboard]
        AP3[Review Generated Documents<br/>HTML/PDF/Word formats available]
        AP4[Approve/Reject/Request Changes<br/>Sequential or parallel approval]
        AP5[Provide Approval Comments<br/>Optional feedback/notes]
    end

    %% End
    END([✅ Procurement Package Complete])

    %% Flow connections
    START --> T1
    T1 --> T2
    T2 --> T3
    T3 --> T4
    T4 --> T5
    T5 --> T6
    T6 --> T7

    T7 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> D5
    D5 --> D6

    D6 --> O1
    O1 --> O2
    O2 --> O3
    O3 --> O3b
    O3b --> O3c
    O3c --> O3d
    O3d --> O4
    O4 --> O5
    O5 --> O6
    O6 --> O7
    O7 --> O8
    O8 --> O9
    O9 --> O10

    O10 --> A1
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A5 --> A6
    A6 --> A7

    A7 --> M1
    M1 --> M2
    M2 --> M3
    M3 --> M4
    M4 --> M5

    M5 --> AP1
    AP1 --> AP2
    AP2 --> AP3
    AP3 --> AP4
    AP4 --> AP5
    AP5 --> END

    %% Parallel optional paths
    O4 -.->|Optional shortcut| O5
    A7 -.->|If no manual tasks| AP1

    %% Styling
    classDef governance fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef ordering fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef creation fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef automated fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef manual fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef approval fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef startend fill:#ffffff,stroke:#000000,stroke-width:3px

    class T1,T2,T3,T4,T5,T6,T7 governance
    class D1,D2,D3,D4,D5,D6 ordering
    class O1,O2,O3,O4,O5,O6,O7,O8,O9,O10 creation
    class A1,A2,A3,A4,A5,A6,A7 automated
    class M1,M2,M3,M4,M5 manual
    class AP1,AP2,AP3,AP4,AP5 approval
    class START,END startend
```

## Complete User Input Requirements Summary

### **Phase 1: Template Creation (Governance Users Only)**

#### **Navigation Input:**
- URL: `http://localhost:3060/#/templates-forms-management?discipline=01900`
- User must have governance or template admin permissions

#### **Required User Inputs:**
1. **Template Type Selection**: Choose from dropdown (Form, Template, Schedule, Specification, Appendix)
2. **Discipline Selection**: Select Procurement (01900) or other applicable disciplines
3. **Template Name**: Free text input (required)
4. **Template Description**: Free text input (required)
5. **HTML Content**: Rich text editor or HTML upload (required for templates)
6. **Field Configuration**: Define form fields with properties:
   - Field name, type, validation rules
   - Protection levels (read/write/admin)
   - Required/optional status
7. **Permissions**: Select user roles and organization scope
8. **Status**: Choose Draft or Published

### **Phase 2: Document Ordering (Governance/Discipline Leads Only)**

#### **Navigation Input:**
- URL: `http://localhost:3060/#/document-ordering-management`
- User must have governance permissions or discipline lead role

#### **Required User Inputs:**
1. **Discipline Selection**: Choose from available disciplines
2. **Contract Type Selection**: Choose PO, WO, or SO
3. **Document Section Arrangement**: Drag and drop sections (Appendix A-F) into desired order
4. **Section Properties Configuration**:
   - Required vs Optional status
   - Associated document types
   - User assignment mappings
5. **Variation Details**:
   - Variation name and description
   - Status (Active/Inactive)

### **Phase 3: Order Creation (Procurement Officers)**

#### **Navigation Input:**
- URL: `http://localhost:3060/#/purchase-orders`
- Click "Create New Order" button

#### **Required User Inputs:**
1. **Template Variation**: Required dropdown selection (system enforces prerequisite)
2. **Previous Order Template**: Optional selection from approved orders (auto-fills form)
3. **Order Title**: Required text input
4. **Description**: Optional text area
5. **Estimated Value**: Optional number input with ZAR currency
6. **Equipment Involved**: Checkbox (affects discipline assignments)
7. **Compliance Required**: Checkbox (affects safety approvals)
8. **Technical Complexity**: Required dropdown (Low/Medium/High)

#### **System-Generated (No User Input Required):**
- Discipline assignments (auto-calculated from template variation)
- Document sections (auto-determined from document ordering)
- Approval matrix (auto-calculated from limits of authority)
- Task assignments (auto-created based on discipline mappings)

### **Phase 4: Agent Processing (No User Input Required)**
- **Fully Automated**: 6-agent workflow + DocumentGenerator service
- **Progress Notifications**: Users receive updates via preferred channels
- **No Manual Intervention**: Required unless quality gates fail

### **Phase 5: Manual Tasks (Discipline Specialists - Optional)**
- **Task Assignment**: Auto-assigned based on Phase 3 selections
- **Appendix Contributions**: Manual content input for assigned sections
- **Review & Approval**: Discipline leads validate contributions

### **Phase 6: Approval Process (Auto-Assigned Approvers)**
- **Approval Assignment**: Auto-determined by limits of authority
- **Review Actions**: Approve/Reject/Request Changes
- **Optional Comments**: Free text feedback

## User Input Critical Path Summary

### **Minimum Required Inputs for Basic Procurement Order:**
1. ✅ **Template Variation Selection** (Required - enforces workflow prerequisites)
2. ✅ **Order Title** (Required - basic identification)
3. ✅ **Technical Complexity** (Required - affects approval routing)
4. ⭕ **Previous Order Template** (Optional - speeds up data entry)
5. ⭕ **Description, Value, Checkboxes** (Optional but recommended)

### **Governance-Only Inputs (Setup Required Before Orders):**
1. ✅ **Template Creation** (Governance admins - creates available templates)
2. ✅ **Document Ordering** (Governance admins - creates document variations)

### **System Intelligence Reduces User Input:**
- **Auto-discipline assignment** based on template variation
- **Auto-document section determination** based on ordering configuration
- **Auto-approval matrix calculation** based on limits of authority
- **Smart template suggestions** based on form data
- **Previous order templates** for instant form population

**The workflow minimizes user input requirements while ensuring all necessary information is captured for compliant procurement document generation!** 🎯📋✅
