# 1300_01900_PROCUREMENT_ORDER_ENHANCEMENT_SYSTEM_WORKFLOW_MERMAID_DIAGRAM.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-11-05): Complete workflow diagram for procurement order enhancement system

## Overview

This document provides a comprehensive Mermaid diagram illustrating the complete workflow of the Procurement Order Enhancement System, showing the integration between template creation, SOW generation, engineering document management, and procurement order creation with document discovery and linking.

## Comprehensive Engineering-to-Procurement Workflow Diagram

```mermaid
flowchart TD
    START(["Complete Engineering-to-Procurement Workflow"])

    subgraph "Phase 1: Template Creation & Discipline Setup"
        A1["Governance Form Creation - Create Master Templates"]
        A2["Template Copy to Disciplines - Engineering Disciplines"]
        A3["Common Engineering Templates Page - Discipline-Aware Filtering"]
        A4["Discipline-Specific Template Usage - Generate Technical Documents"]
    end

    subgraph "Engineering Disciplines & Document Types"
        ENG00825["Architectural 00825 - Floor Plans, Specifications, 3D Renderings"]
        ENG00850["Civil Engineering 00850 - Structural Calcs, Site Plans, Construction Specs"]
        ENG00860["Electrical Engineering 00860 - Schematics, Load Calcs, Equipment Specs"]
        ENG00870["Mechanical Engineering 00870 - P&IDs, Layouts, System Calcs"]
        ENG03000["Landscaping 03000 - Site Analysis, Planting Plans, Irrigation Design"]
    end

    subgraph "Document Control System Integration"
        DCS1["Document Creation via UpsertText - Auto-numbering"]
        DCS2["DCS Approval Workflow - draft to approved"]
        DCS3["Multi-Team Tagging - procurement_relevance, contract_relevance"]
        DCS4["All Documents System - Cross-department discovery"]
        DCS5["Version Control - Mandatory notes, rollback, approvals"]
    end

    subgraph "Phase 2: SOW Generation & Procurement Intelligence"
        B1["AI SOW Generation - Procurement Category Intelligence"]
        B2["SOW Approval Workflow - Cross-Discipline Review"]
        B3["SOW Document References - Link to Required Engineering Docs"]
    end

    subgraph "Phase 3: Procurement Order Creation"
        C1["Create Procurement Order - PO/SO/WO Selection"]
        C2["Smart Document Suggestions - Context-Aware AI Recommendations"]
        C3["Browse Available Documents - Templates + SOW + Engineering Docs"]
        C4["Link Selected Documents - Reference Without Duplication"]
        C5["Submit Order - Complete with Document Links"]
    end

    START --> A1
    A1 --> A2
    A2 --> A3
    A3 --> ENG00825
    A3 --> ENG00850
    A3 --> ENG00860
    A3 --> ENG00870
    A3 --> ENG03000

    ENG00825 --> A4
    ENG00850 --> A4
    ENG00860 --> A4
    ENG00870 --> A4
    ENG03000 --> A4

    A4 --> DCS1
    DCS1 --> DCS2
    DCS2 --> DCS3
    DCS3 --> DCS4
    DCS4 --> DCS5

    DCS5 --> B1
    B1 --> B2
    B2 --> B3

    B3 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5

    classDef phase1 fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef disciplines fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef dcs fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef phase2 fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef phase3 fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class A1,A2,A3,A4 phase1
    class ENG00825,ENG00850,ENG00860,ENG00870,ENG03000 disciplines
    class DCS1,DCS2,DCS3,DCS4,DCS5 dcs
    class B1,B2,B3 phase2
    class C1,C2,C3,C4,C5 phase3
```

## Detailed Component Workflow

```mermaid
flowchart TD
    subgraph "Template Creation Flow"
        T1["Governance Form Creation - Master Template"]
        T2["Copy to Discipline Pages - Civil/Mechanical/Electrical"]
        T3["Engineering Template Usage - Generate Technical Documents"]
        T4["Document Repository Storage - Version Control & Approval"]
    end

    subgraph "SOW Integration Flow"
        S1["AI SOW Generation - Category-Based Intelligence"]
        S2["Cross-Discipline Approval - Technical & Procurement Review"]
        S3["Document Reference Linking - Specs/Drawings/Data Sheets"]
        S4["SOW Approval & Release - Ready for Procurement"]
    end

    subgraph "Procurement Order Flow"
        P1["Order Type Selection - PO/SO/WO with Context"]
        P2["Smart Suggestions Engine - Project/Phase/Category Aware"]
        P3["Document Discovery Browser - Multi-Source Search & Filter"]
        P4["Document Linking System - Reference Creation"]
        P5["Order Submission - Complete with Document Links"]
    end

    subgraph "Document Sources"
        D1["Procurement Templates - Approved Master Templates"]
        D2["SOW Documents - Approved Scope Documents"]
        D3["Engineering Documents - Specs/Data Sheets/Drawings"]
        D4["Reference Documents - Standards/Manuals/Certificates"]
    end

    subgraph "User Roles & Responsibilities"
        U1["Template Creator - Governance Team"]
        U2["Document Generator - Engineering Disciplines"]
        U3["Procurement Officer - Order Creation & Document Linking"]
        U4["Approver - Cross-Discipline Approval"]
    end

    subgraph "System Components"
        SYS1["Document Discovery Service - Smart Search & Filtering"]
        SYS2["Document Linking Engine - Reference Management"]
        SYS3["Suggestion Engine - AI-Powered Recommendations"]
        SYS4["Project Context Service - Phase & Category Awareness"]
    end

    T1 --> T2 --> T3 --> T4
    S1 --> S2 --> S3 --> S4
    P1 --> P2 --> P3 --> P4 --> P5

    D1 --> P3
    D2 --> P3
    D3 --> P3
    D4 --> P3

    U1 --> T1
    U2 --> T3
    U3 --> P1
    U4 --> S2

    SYS1 --> P3
    SYS2 --> P4
    SYS3 --> P2
    SYS4 --> P1

    classDef templateFlow fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef sowFlow fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef procurementFlow fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef sources fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef roles fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef system fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class T1,T2,T3,T4 templateFlow
    class S1,S2,S3,S4 sowFlow
    class P1,P2,P3,P4,P5 procurementFlow
    class D1,D2,D3,D4 sources
    class U1,U2,U3,U4 roles
    class SYS1,SYS2,SYS3,SYS4 system
```

## Cross-Discipline Document Flow

```mermaid
flowchart LR
    GOV["Governance 01300"] -->|"Create Master Templates"| DISC["Discipline Pages - Civil/Mech/Electrical"]
    DISC -->|"Use Templates"| ENG["Engineering Teams - Generate Documents"]
    ENG -->|"Store Documents"| REPO["Engineering Repository"]
    REPO -->|"Reference in"| SOW["SOW Generation - AI-Powered"]
    SOW -->|"Approval"| APPROVE["Cross-Discipline Approval"]
    APPROVE -->|"Documents Available"| PROC["Procurement Team - Order Creation"]
    REPO -->|"Direct Access"| PROC
    DISC -->|"Templates Available"| PROC
    PROC -->|"Browse & Link"| ORDER["Procurement Order with Document Links"]
    ORDER -->|"Submit"| FULFILL["Order Fulfillment - Document Access"]
    FULFILL -->|"Requirements Feedback"| GOV
    FULFILL -->|"Document Updates"| ENG

    classDef governance fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef disciplines fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef engineering fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef sow fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef procurement fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef fulfillment fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class GOV governance
    class DISC disciplines
    class ENG,REPO engineering
    class SOW,APPROVE sow
    class PROC procurement
    class ORDER,FULFILL fulfillment
```

## Data Flow Architecture

```mermaid
flowchart TD
    subgraph "Data Sources"
        DB_TEMPLATES["Procurement Templates - procurement_templates"]
        DB_SOW["SOW Documents - scope_of_work"]
        DB_ENG["Engineering Documents - engineering_documents"]
        DB_ORDERS["Procurement Orders - procurement_orders"]
        DB_LINKS["Document Links - procurement_order_documents"]
    end

    subgraph "Services"
        SVC_DISCOVERY["Document Discovery Service - Smart Filtering & Search"]
        SVC_LINKING["Document Linking Service - Reference Management"]
        SVC_SUGGESTIONS["Smart Suggestions Service - AI-Powered Recommendations"]
        SVC_CONTEXT["Project Context Service - Phase & Category Awareness"]
    end

    subgraph "User Interfaces"
        UI_MODAL["Procurement Order Modal - Enhanced with Document Selection"]
        UI_BROWSER["Document Browser - Multi-Source Discovery"]
        UI_SOW["SOW Generation Interface - Document Reference Linking"]
        UI_REPO["Engineering Repository - Document Publishing"]
    end

    subgraph "API Endpoints"
        API_TEMPLATES["GET /api/procurement/documents/templates"]
        API_SOW["GET /api/procurement/documents/sows"]
        API_ENG["GET /api/procurement/documents/engineering"]
        API_LINK["POST /api/procurement/orders/link-documents"]
        API_SUGGEST["GET /api/procurement/documents/suggestions"]
    end

    DB_TEMPLATES --> SVC_DISCOVERY
    DB_SOW --> SVC_DISCOVERY
    DB_ENG --> SVC_DISCOVERY

    SVC_DISCOVERY --> SVC_SUGGESTIONS
    SVC_SUGGESTIONS --> UI_MODAL
    SVC_SUGGESTIONS --> UI_BROWSER

    UI_MODAL --> SVC_LINKING
    UI_BROWSER --> SVC_LINKING
    UI_SOW --> SVC_LINKING

    SVC_LINKING --> DB_LINKS
    SVC_LINKING --> DB_ORDERS

    SVC_CONTEXT --> SVC_DISCOVERY
    SVC_CONTEXT --> SVC_SUGGESTIONS

    API_TEMPLATES --> SVC_DISCOVERY
    API_SOW --> SVC_DISCOVERY
    API_ENG --> SVC_DISCOVERY
    API_LINK --> SVC_LINKING
    API_SUGGEST --> SVC_SUGGESTIONS

    UI_REPO --> DB_ENG

    classDef databases fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef services fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef interfaces fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef apis fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class DB_TEMPLATES,DB_SOW,DB_ENG,DB_ORDERS,DB_LINKS databases
    class SVC_DISCOVERY,SVC_LINKING,SVC_SUGGESTIONS,SVC_CONTEXT services
    class UI_MODAL,UI_BROWSER,UI_SOW,UI_REPO interfaces
    class API_TEMPLATES,API_SOW,API_ENG,API_LINK,API_SUGGEST apis
```

## Project & Phase Context Flow

```mermaid
flowchart TD
    subgraph "Project Context"
        PROJ["Project Selection - ID & Basic Info"]
        PHASE["Project Phase - Planning/Design/Procurement/etc."]
        CATEGORY["Procurement Category - A/B/C Goods/Equipment/etc."]
    end

    subgraph "Context Processing"
        CTX_ENGINE["Context Engine - Project + Phase + Category"]
        FILTER_ENGINE["Smart Filtering - Relevant Documents Only"]
        SUGGEST_ENGINE["Suggestion Engine - Context-Aware Recommendations"]
    end

    subgraph "Document Sources"
        TEMPLATES["Templates - Project-Phase Filtered"]
        SOW_DOCS["SOW Documents - Project-Phase Approved"]
        ENG_DOCS["Engineering Docs - Project-Phase Available"]
        REF_DOCS["Reference Docs - Category Relevant"]
    end

    subgraph "User Selection"
        ORDER_TYPE["Order Type - PO/SO/WO Selection"]
        DOC_BROWSER["Document Browser - Filtered Results"]
        SMART_SUGGEST["Smart Suggestions - AI Recommendations"]
        FINAL_LINK["Document Linking - Reference Creation"]
    end

    PROJ --> CTX_ENGINE
    PHASE --> CTX_ENGINE
    CATEGORY --> CTX_ENGINE

    CTX_ENGINE --> FILTER_ENGINE
    CTX_ENGINE --> SUGGEST_ENGINE

    FILTER_ENGINE --> TEMPLATES
    FILTER_ENGINE --> SOW_DOCS
    FILTER_ENGINE --> ENG_DOCS
    FILTER_ENGINE --> REF_DOCS

    SUGGEST_ENGINE --> SMART_SUGGEST

    ORDER_TYPE --> SMART_SUGGEST
    ORDER_TYPE --> DOC_BROWSER

    TEMPLATES --> DOC_BROWSER
    SOW_DOCS --> DOC_BROWSER
    ENG_DOCS --> DOC_BROWSER
    REF_DOCS --> DOC_BROWSER

    DOC_BROWSER --> FINAL_LINK
    SMART_SUGGEST --> FINAL_LINK

    classDef context fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef processing fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef sources fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef selection fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class PROJ,PHASE,CATEGORY context
    class CTX_ENGINE,FILTER_ENGINE,SUGGEST_ENGINE processing
    class TEMPLATES,SOW_DOCS,ENG_DOCS,REF_DOCS sources
    class ORDER_TYPE,DOC_BROWSER,SMART_SUGGEST,FINAL_LINK selection
```

## Implementation Phases Timeline

```mermaid
gantt
    title Procurement Order Enhancement System Implementation
    dateFormat  YYYY-MM-DD
    section Phase 1: Core Integration
    Template & SOW Integration      :done, phase1_1, 2025-11-05, 2w
    Basic Document Dropdowns        :done, phase1_2, 2025-11-07, 1w
    Document Linking Infrastructure :active, phase1_3, 2025-11-08, 2w
    section Phase 2: Enhanced Discovery
    Document Browser Interface     :planned, phase2_1, 2025-11-15, 2w
    Smart Suggestions Engine       :planned, phase2_2, 2025-11-17, 2w
    Project/Phase Filtering        :planned, phase2_3, 2025-11-19, 2w
    section Phase 3: Engineering Integration
    Engineering Document Repository :planned, phase3_1, 2025-11-25, 2w
    Document Publishing Workflow    :planned, phase3_2, 2025-11-27, 2w
    Cross-Discipline Sharing       :planned, phase3_3, 2025-11-29, 3w
    section Phase 4: Optimization & Training
    Performance Optimization       :planned, phase4_1, 2025-12-05, 1w
    User Training & Documentation  :planned, phase4_2, 2025-12-06, 2w
    Final Testing & Deployment     :planned, phase4_3, 2025-12-08, 2w
```

## Key Integration Points

### Template System Integration
- **Source**: Governance Form Creation (01300)
- **Flow**: Master Template → Discipline Copy → Engineering Usage → Document Generation
- **Result**: Structured templates available for procurement order creation

### SOW System Integration
- **Source**: AI-Generated SOW with procurement requirements
- **Flow**: SOW Generation → Approval Workflow → Document References → Procurement Access
- **Result**: Approved SOWs with linked document requirements available for orders

### Engineering Document Integration
- **Source**: Discipline-specific document generation
- **Flow**: Template Usage → Document Creation → Repository Storage → Procurement Discovery
- **Result**: Engineering documents discoverable by procurement category and project phase

### Procurement Order Integration
- **Source**: Enhanced order creation modal
- **Flow**: Order Type Selection → Smart Suggestions → Document Discovery → Linking → Submission
- **Result**: Procurement orders with comprehensive document references

## Success Metrics Visualization

```mermaid
pie title Implementation Success Metrics
    "Document Linking Rate" : 85
    "Time Savings" : 80
    "User Satisfaction" : 90
    "System Performance" : 95
    "Error Reduction" : 75
```

## Related Documentation

- [1300_01900_PROCUREMENT_ORDER_ENHANCEMENT_SYSTEM.md](./1300_01900_PROCUREMENT_ORDER_ENHANCEMENT_SYSTEM.md) - Complete system specification
- [1300_01900_PROCUREMENT_TEMPLATE_SYSTEM.md](./1300_01900_PROCUREMENT_TEMPLATE_SYSTEM.md) - Template system architecture
- [1300_01900_SCOPE_OF_WORK_GENERATION.md](./1300_01900_SCOPE_OF_WORK_GENERATION.md) - SOW generation system
- [1300_01300_GOVERNANCE.md](./1300_01300_GOVERNANCE.md) - Template creation workflow

## Status
- [x] ✅ High-level workflow diagram completed
- [x] ✅ Detailed component workflow documented
- [x] ✅ Cross-discipline document flow illustrated
- [x] ✅ Data flow architecture mapped
- [x] ✅ Project/phase context flow defined
- [x] ✅ Implementation timeline created
- [x] ✅ Integration points documented
- [x] ✅ Success metrics visualized

## Version History
- v1.0 (2025-11-05): Complete workflow diagrams for procurement order enhancement system
