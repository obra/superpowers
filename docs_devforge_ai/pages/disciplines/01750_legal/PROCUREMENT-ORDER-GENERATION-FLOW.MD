sequenceDiagram
    participant U as User
    participant DOM as Document Ordering Management
    participant TFM as Templates-Forms Management
    participant TTM as Template Type Manager
    participant COM as Create Order Modal
    participant API as Backend APIs
    participant DB as Database
    participant PA as Procurement Agents

    %% Phase 1: Template Type Management
    U->>DOM: Access Document Ordering Management
    DOM->>TTM: Click "Manage Template Types"
    TTM->>API: GET /api/template-types
    API->>DB: Query template_types table
    DB-->>API: Return template types
    API-->>TTM: Template types data
    TTM-->>DOM: Display template types

    %% Phase 2: Template Creation/Management
    U->>TFM: Access Templates-Forms Management
    TFM->>API: GET /api/procurement-templates
    API->>DB: Query procurement_templates
    DB-->>API: Return templates
    API-->>TFM: Templates data
    TFM-->>U: Display templates table

    %% Phase 3: Document Ordering Assembly
    U->>DOM: Select discipline & contract type
    DOM->>API: GET /api/discipline-document-sections
    API->>DB: Query discipline_document_sections
    DB-->>API: Return sections
    API-->>DOM: Sections data

    U->>DOM: Drag sections to canvas
    U->>DOM: Save variation
    DOM->>API: POST /api/document-variations
    API->>DB: Save document variation
    DB-->>API: Variation saved
    API-->>DOM: Success response

    %% Phase 4: Order Creation from Template
    U->>COM: Click "Create Order"
    COM->>TTM: Select template variation
    TTM->>API: GET /api/template-types
    API->>DB: Get template variations
    DB-->>API: Template variations
    API-->>COM: Variations for selection

    COM->>API: GET /api/procurement/sequence/{variation}
    API->>PA: Generate task sequence
    PA->>API: Task sequence data
    API-->>COM: Sequence for order

    U->>COM: Fill order details & submit
    COM->>API: POST /api/procurement-orders
    API->>DB: Create procurement order
    DB-->>API: Order created
    API-->>PA: Trigger order processing
    PA->>API: Order processing tasks
    API-->>COM: Order created successfully
    COM-->>U: Order confirmation

    %% Phase 5: Agent Processing
    PA->>API: Process order with agents
    API->>DB: Update order status
    DB-->>API: Status updates
    API-->>PA: Processing complete
    PA-->>U: Order ready for execution

    %% Styling
    Note over U,PA: Complete Procurement Order Generation Flow
