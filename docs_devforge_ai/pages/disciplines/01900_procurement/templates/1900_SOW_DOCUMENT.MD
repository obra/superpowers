# 03 - Scope of Work (SOW) Document

## Overview

The Scope of Work (SOW) document is the primary procurement contract generated after order creation. It consolidates all requirements, specifications, and compliance information gathered during the chat workflow into a comprehensive professional document.

## Document Structure

### Section 1: Introduction and Context
**Purpose**: Establishes the procurement context and scope

**Content Template**:
```
This Scope of Work (SOW) defines the requirements for the procurement of 
[procurement_type] to support operational needs. The Contractor shall provide 
all necessary [items] as specified herein, ensuring compliance with all 
applicable standards and regulations.
```

**Data Sources**:
- `extractedData.procurement_type.value` - Equipment/Services/Materials/Mixed
- Context-aware language based on procurement type

### Section 2: Detailed Scope of Work
**Purpose**: Defines specific deliverables and requirements

**Content Fields**:
| Field | Data Source | Example |
|-------|-------------|---------|
| Procurement Type | `procurement_type.value` | Equipment |
| Items Required | `items.length` | 5 item(s) |
| Estimated Value | `estimated_value.value` | R 125,000 |
| Destination | `destination_country.name` | Guinea |
| Special Requirements | `requirements.value` | None specified |

### Section 3: Technical Specifications
**Purpose**: Details product specifications and requirements

**Content Generation**:
```javascript
// Lists first 3 items with specifications
items.slice(0, 3).map(item => 
  `${item.productName}: ${item.specification} (Qty: ${item.quantity})`
)
```

**Reference**: Complete specifications in Appendix A

### Section 4: Deliverables and Expected Results
**Purpose**: Defines what the contractor must deliver

**Standard Deliverables**:
1. All specified equipment/materials per technical specifications
2. Complete documentation package (manuals, certificates, test reports)
3. Training materials and personnel training (see Appendix D)
4. Necessary spare parts and consumables
5. Installation, commissioning, and handover

**Data Source**: `extractedData.procurement_type.value` for context-aware language

### Section 5: Quality Standards and Requirements
**Purpose**: Specifies quality and compliance standards

**Standard Requirements**:
- ISO 9001 Quality Management Systems
- API (American Petroleum Institute) standards
- SAE (Society of Automotive Engineers) specifications
- Local regulatory requirements for destination country
- Manufacturer's quality assurance procedures

**Data Source**: `destination_country.name` for country-specific regulations

### Section 6: Safety and Compliance
**Purpose**: Defines safety and regulatory compliance requirements

**Standard Requirements**:
- Occupational Health and Safety Act
- Environmental protection regulations
- Hazardous materials handling and transportation
- International shipping and dangerous goods regulations

**Conditional Content** (when `cdc_required === true`):
```
⚠️ CDC Requirements (Guinea Customs):
- Déclaration en Détail en Douane (Customs Declaration)
- Importer NIF: [importer_nif.value]
- Complete customs documentation package
```

**Reference**: Safety Data Sheets in Appendix B

### Section 7: Logistics and Transportation
**Purpose**: Specifies delivery and logistics requirements

**Content Fields**:
| Field | Data Source | Example |
|-------|-------------|---------|
| Delivery Location | `destination_country.name` | Guinea |
| Incoterm | Static | DAP (Delivered at Place) |
| Importer | `importer_nif.value` | NIF: 123456789 |
| Address | `importer_address.value` | 123 Mining District, Conakry |

**CDC Requirements Block** (when applicable):
```
⚠️ CDC Requirements (Guinea Customs):
- Déclaration en Détail en Douane
- Importer NIF: [value]
- Complete customs documentation package
```

**Reference**: Complete logistics documentation in Appendix E

### Section 8: Packaging and Marking
**Purpose**: Specifies packaging requirements

**Content**: Reference to Appendix F for detailed specifications

### Section 9: Training and Documentation
**Purpose**: Specifies training requirements

**Content**: Reference to Appendix D for training materials

### Section 10: Timeline and Milestones
**Purpose**: Defines delivery schedule and key milestones

**Content Fields**:
| Milestone | Data Source | Timeline |
|-----------|-------------|----------|
| Order confirmation | Static | Within 2 business days |
| Manufacturing/Procurement | `timeline.timeframe` | Standard (2-4 weeks) |
| Shipping | Static | Within 1 week of completion |
| Delivery | `timeline.timeframe` | As per agreed schedule |
| Installation/Commissioning | Static | Within 1 week of delivery |

**Reference**: Detailed delivery schedule in Appendix C

### Section 11: Warranty
**Purpose**: Defines warranty terms and conditions

**Standard Terms**:
- Equipment free from defects in materials and workmanship
- Warranty period: 12 months from delivery or 6 months from commissioning
- Response time: Within 24 hours for critical failures
- All warranty repairs at no cost to Client

### Section 12: Payment Terms
**Purpose**: Defines payment schedule

**Standard Terms**:
- 30% upon order confirmation
- 40% upon shipment
- 30% upon successful delivery and commissioning

### Section 13: Acceptance Criteria
**Purpose**: Defines conditions for final acceptance

**Standard Criteria**:
- All deliverables meet technical requirements
- All documentation provided and approved
- Training completed successfully
- Equipment operational and performing to specifications
- All warranty and support documentation in place

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHAT CONVERSATION                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ User     │  │ User     │  │ User     │  │ User     │       │
│  │ Input    │→ │ Input    │→ │ Input    │→ │ Input    │       │
│  │ (Type)   │  │ (Items)  │  │ (Country)│  │ (Confirm)│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTRACTED DATA OBJECT                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ procurement_type: { value: "Equipment" }                  │  │
│  │ items: [{ productName, specification, quantity, ... }]   │  │
│  │ destination_country: { name: "Guinea", code: "GN" }      │  │
│  │ estimated_value: { value: 125000 }                        │  │
│  │ timeline: { timeframe: "Standard (2-4 weeks)" }          │  │
│  │ cdc_required: true                                        │  │
│  │ importer_nif: { value: "NIF123456789" }                  │  │
│  │ requirements: { value: "None" }                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SOW DOCUMENT SECTIONS                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Section 1  │  │ Section 2  │  │ Section 3  │  ...          │
│  │ Intro      │  │ Scope      │  │ Tech Specs │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Intelligent Content Generation

### Context-Aware Language
The SOW adapts its language based on procurement type:

| Procurement Type | Language Adaptation |
|------------------|---------------------|
| Equipment | "equipment", "installation", "commissioning" |
| Services | "services", "performance", "deliverables" |
| Materials | "materials", "supply", "specifications" |
| Mixed | "equipment and materials", "comprehensive" |

### Country-Specific Compliance
Automatic inclusion of country-specific requirements:

| Country | Additional Requirements |
|---------|------------------------|
| Guinea | CDC (Customs Declaration), NIF requirement |
| South Africa | SABS certification, local content |
| International | Incoterms, export documentation |

### Dynamic Section Generation
Sections are generated based on available data:

```javascript
// Example: Only show CDC requirements if applicable
{extractedData.cdc_required && (
  <div className="cdc-requirements">
    <p>⚠️ CDC Requirements (Guinea Customs):</p>
    <ul>
      <li>Déclaration en Détail en Douane</li>
      <li>Importer NIF: {extractedData.importer_nif?.value}</li>
    </ul>
  </div>
)}
```

## Template Storage

### Database Template Tables

The SOW document uses templates stored in the `sow_templates` table:

```sql
CREATE TABLE public.sow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  order_type VARCHAR(50) NOT NULL,
  appendix_definitions JSONB NOT NULL,
  discipline_defaults JSONB NULL,
  is_active BOOLEAN NULL DEFAULT true,
  organization_id UUID NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  CONSTRAINT sow_templates_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_sow_templates_order_type ON public.sow_templates (order_type);
CREATE INDEX idx_sow_templates_organization ON public.sow_templates (organization_id);
```

### SOW Template Schema Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `template_name` | VARCHAR(255) | Name of the SOW template |
| `description` | TEXT | Template description |
| `order_type` | VARCHAR(50) | Type of order (Equipment, Services, Materials, Mixed) |
| `appendix_definitions` | JSONB | JSON array defining which appendices are included |
| `discipline_defaults` | JSONB | Default values for discipline-specific fields |
| `is_active` | BOOLEAN | Whether template is active |
| `organization_id` | UUID | Foreign key to organizations table |
| `created_by` | UUID | Foreign key to auth.users table |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Appendix Definitions Structure

The `appendix_definitions` JSONB field defines which appendices are included:

```json
{
  "appendices": [
    {
      "id": "A",
      "name": "Product Specifications",
      "required": true,
      "template_ref": "appendix_a_specifications"
    },
    {
      "id": "B",
      "name": "Safety Data Sheets",
      "required": false,
      "condition": "has_hazardous_materials"
    },
    {
      "id": "C",
      "name": "Delivery Schedule",
      "required": true
    },
    {
      "id": "D",
      "name": "Training Materials",
      "required": false,
      "condition": "procurement_type == 'Equipment'"
    },
    {
      "id": "E",
      "name": "Logistics Documents",
      "required": true
    },
    {
      "id": "F",
      "name": "Packing Specification",
      "required": true
    }
  ]
}
```

### Discipline Defaults Structure

The `discipline_defaults` JSONB field contains default values:

```json
{
  "discipline_code": "01900",
  "default_incoterm": "DAP",
  "default_warranty_months": 12,
  "default_payment_terms": {
    "order_confirmation": 30,
    "shipment": 40,
    "delivery": 30
  },
  "quality_standards": ["ISO 9001", "API", "SAE"],
  "compliance_requirements": {
    "guinea": ["CDC", "NIF"],
    "south_africa": ["SABS"]
  }
}
```

### Template Retrieval Process

```javascript
// Template Analysis Agent retrieves SOW template from database
const retrieveSOWTemplate = async (orderType, organizationId) => {
  const response = await fetch('/api/sow-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'retrieve',
      filters: {
        order_type: orderType, // 'Equipment', 'Services', 'Materials', 'Mixed'
        is_active: true,
        organization_id: organizationId
      }
    })
  });
  
  return response.json();
};
```

### Template Query by Order Type

```javascript
// Query template by order type
const getTemplateByOrderType = async (orderType) => {
  const { data, error } = await supabase
    .from('sow_templates')
    .select('*')
    .eq('order_type', orderType)
    .eq('is_active', true)
    .single();
    
  return data;
};
```

## Agent Integration

### 7-Agent Workflow Contribution
The SOW document benefits from all 7 specialist agents:

1. **Template Analysis Agent**: Queries `procurement_templates` table to identify appropriate SOW template
2. **Requirements Extraction Agent**: Extracts requirements from chat
3. **Compliance Validation Agent**: Validates regulatory compliance
4. **Field Population Agent**: Populates template fields from `html_content` with extracted data
5. **Quality Assurance Agent**: Verifies document completeness against `content_schema`
6. **Final Review Agent**: Reviews final document quality
7. **Assignment Agent**: Assigns approval workflow

### HITL Gates
- **Gate 1** (After Compliance Validation): User reviews compliance requirements
- **Gate 2** (After Final Review): User approves final SOW document

## Export Options

### Print Format
- Professional document layout
- Page breaks between major sections
- Header/footer with order reference

### PDF Export
- Formatted PDF with table of contents
- Embedded appendices references
- Digital signature placeholder

### Document Compilation
```javascript
const compileSOWDocument = async (extractedData) => {
  const template = await retrieveTemplate('sow', '01900');
  const populated = populateTemplateFields(template, extractedData);
  return {
    content: populated,
    metadata: {
      orderNumber: extractedData.createdOrder.order_number,
      generatedAt: new Date().toISOString()
    }
  };
};
```

## Validation Rules

### Required Data for SOW Generation
- `procurement_type` - Must be specified
- `items` - At least one item required
- `estimated_value` - Must be calculated
- `destination_country` - Must be specified

### Conditional Requirements
- `importer_nif` - Required when `cdc_required === true`
- `importer_address` - Required when `cdc_required === true`
- `timeline` - Optional, defaults to "Standard (2-4 weeks)"

## Error Handling

### Missing Data Scenarios
1. **No Items**: Display "No items added" message
2. **Missing Value**: Show "TBD" placeholder
3. **Missing Country**: Prompt user to specify destination
4. **Incomplete CDC Data**: Highlight missing importer details

### Recovery Actions
- Return to Chat tab to complete missing data
- Manual field entry in Preview tab
- Specialist agent suggestions for missing fields