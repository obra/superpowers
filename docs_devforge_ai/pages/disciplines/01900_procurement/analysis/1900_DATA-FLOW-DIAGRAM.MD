flowchart TD
    %% Data Sources
    TT[template_types<br/>User-defined template types]
    DV[document_variations<br/>Saved document variations]
    DDS[discipline_document_sections<br/>Section configurations]
    PT[procurement_templates<br/>Template content]
    PO[procurement_orders<br/>Generated orders]

    %% Processing Components
    DOM[Document Ordering Management<br/>UI Component]
    TFM[Templates-Forms Management<br/>UI Component]
    TTM[Template Type Manager<br/>Management Interface]
    COM[Create Order Modal<br/>Order Creation Interface]

    %% Services
    TTS[Template Types Service<br/>CRUD operations]
    DSDS[Discipline Document Sections Service<br/>Section management]
    PTS[Procurement Template Service<br/>Template operations]
    POS[Procurement Order Service<br/>Order processing]

    %% Agents
    PA[Procurement Agents<br/>AI-powered processing]
    TSA[Task Sequencing Agent<br/>Order optimization]
    DSA[Document Structure Agent<br/>Content generation]

    %% Data Flow
    TT --> TTS
    TTS --> TTM
    TTM --> DOM
    TTM --> COM

    DV --> DSDS
    DSDS --> DOM
    DDS --> DSDS

    PT --> PTS
    PTS --> TFM
    PTS --> COM

    DOM --> DV
    COM --> PO

    PO --> POS
    POS --> PA
    PA --> TSA
    PA --> DSA

    TSA --> PO
    DSA --> PO

    %% Styling
    classDef data fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef ui fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef service fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef agent fill:#fff8e1,stroke:#f57c00,stroke-width:2px

    class TT,DV,DDS,PT,PO data
    class DOM,TFM,TTM,COM ui
    class TTS,DSDS,PTS,POS service
    class PA,TSA,DSA agent

    %% Relationships
    linkStyle 0,2,4,6,8,10,12,14,16,18 stroke:#1976d2,stroke-width:2px
    linkStyle 1,3,5,7,9,11,13,15,17,19 stroke:#388e3c,stroke-width:2px
