# 01700 Logistics Workflow Configuration

## Overview
This document defines the comprehensive configuration for the Logistics workflow (01700), covering the complete logistics lifecycle from order receipt through delivery completion. The workflow integrates with the Procurement (01900) system and is triggered when an order is signed by both parties.

## Workflow Architecture

### Core Components
- **Order Integration**: Triggered by Procurement (01900) order signed event
- **AI Agent Orchestration**: Intelligent logistics processing and coordination
- **Document Generation**: Automated import/export documentation
- **HITL Integration**: Human oversight for critical logistics decisions
- **Customs Integration**: Electronic customs submission and clearance
- **Tracking System**: Real-time shipment tracking and monitoring

### Agent Integration
The workflow leverages specialized logistics agents with table-based prompt management:

### Core Agents
- **Logistics Orchestrator Agent**: Master coordination of all logistics activities
- **Customs Clearance Agent**: HS code classification and customs processing
- **Import/Export Document Agent**: Trade documentation generation using database-driven prompts
- **Shipping Management Agent**: Carrier selection and booking
- **Trade Compliance Agent**: Regulatory compliance verification

### Database-Driven Prompt System
The logistics workflow uses a centralized database table (`logistics_document_prompts`) for managing document generation prompts, following the same architecture as the procurement system (01900).

#### Table Structure
```sql
CREATE TABLE logistics_document_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(50) NOT NULL UNIQUE,
    document_name VARCHAR(255) NOT NULL,
    prompt_content TEXT NOT NULL,
    context_requirements JSONB DEFAULT '{}',
    generation_conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Supported Document Types
The system supports 7 core logistics document types:

| Document Type | Purpose | Key Context Requirements |
|---------------|---------|--------------------------|
| `commercial_invoice` | International trade invoice | order_number, supplier/buyer details, items, total_value, incoterms |
| `bill_of_lading` | Sea freight transportation | shipper/consignee details, vessel info, ports, cargo description |
| `packing_list` | Itemized shipping details | items, packages, weights, shipping marks |
| `certificate_of_origin` | Country of manufacture certification | exporter/importer details, country_of_origin, harmonized_codes |
| `insurance_certificate` | Cargo insurance coverage | policy details, coverage amount, voyage information |
| `customs_declaration` | Import/export clearance form | declaration type, countries, items, customs office |
| `delivery_note` | Domestic delivery confirmation | order details, delivery address, receipt confirmation |

#### Agent Functions
```sql
-- Retrieve active prompt for document generation
get_active_logistics_prompt(document_type VARCHAR(50))

-- Validate context data against prompt requirements
validate_logistics_prompt_context(document_type VARCHAR(50), context_data JSONB)

-- Check if document should be generated based on conditions
should_generate_logistics_document(document_type VARCHAR(50), context_data JSONB)
```

#### Agent Integration Example
```json
{
  "import_export_doc_agent": {
    "table_integration": "logistics_document_prompts",
    "document_types": [
      "commercial_invoice",
      "bill_of_lading",
      "packing_list",
      "certificate_of_origin",
      "insurance_certificate",
      "customs_declaration",
      "delivery_note"
    ],
    "context_validation": "validate_logistics_prompt_context()",
    "generation_logic": "should_generate_logistics_document()",
    "prompt_retrieval": "get_active_logistics_prompt()"
  }
}
```

## Configuration Structure

### Workflow Metadata
```json
{
  "workflowId": "01700_logistics_comprehensive",
  "version": "1.0.0",
  "discipline": "01700",
  "description": "Complete logistics lifecycle with customs clearance and document generation",
  "triggerSource": "01900",
  "triggerEvent": "order_signed",
  "estimatedDuration": "3-45 days",
  "complexityLevels": ["domestic", "regional", "international", "complex_international"]
}
```

### Stage Configuration

#### Stage 1: Order Receipt & Planning
```json
{
  "stageId": "order_receipt",
  "name": "Order Receipt & Planning",
  "description": "Receive signed order from Procurement and plan logistics requirements",
  "triggerEvent": "order_signed",
  "estimatedDuration": "1-2 days",
  "automatedSteps": [
    "order_data_extraction",
    "logistics_requirements_analysis",
    "shipping_mode_determination",
    "route_planning",
    "agent_assignment"
  ],
  "humanSteps": [
    "review_logistics_plan",
    "approve_shipping_method",
    "confirm_delivery_requirements"
  ],
  "successCriteria": [
    "order_data_validated",
    "logistics_plan_created",
    "agents_assigned"
  ],
  "integrationPoints": {
    "source": "01900_procurement",
    "trigger": "order_signed_by_both_parties",
    "dataReceived": [
      "order_id",
      "order_number",
      "supplier_details",
      "delivery_location",
      "order_value",
      "items",
      "incoterms",
      "required_delivery_date"
    ]
  }
}
```

#### Stage 2: Documentation Preparation
```json
{
  "stageId": "documentation_prep",
  "name": "Documentation Preparation",
  "description": "Generate and validate all required import/export documents",
  "estimatedDuration": "2-5 days",
  "automatedSteps": [
    "document_requirements_determination",
    "commercial_invoice_generation",
    "packing_list_generation",
    "bill_of_lading_preparation",
    "certificate_of_origin_processing",
    "customs_declaration_preparation"
  ],
  "humanSteps": [
    "review_generated_documents",
    "obtain_certifications",
    "sign_documents",
    "submit_to_authorities"
  ],
  "agentIntegration": {
    "import_export_doc_agent": {
      "role": "Generate all trade documentation",
      "documents": [
        "commercial_invoice",
        "packing_list",
        "bill_of_lading",
        "certificate_of_origin",
        "export_declaration",
        "safety_data_sheet",
        "insurance_certificate"
      ]
    },
    "trade_compliance_agent": {
      "role": "Verify compliance requirements",
      "checks": [
        "sanctions_screening",
        "export_control_verification",
        "import_regulation_check",
        "certificate_requirements"
      ]
    }
  },
  "successCriteria": [
    "all_documents_generated",
    "documents_validated",
    "certifications_obtained",
    "compliance_verified"
  ]
}
```

#### Stage 3: Shipping Coordination
```json
{
  "stageId": "shipping_coordination",
  "name": "Shipping Coordination",
  "description": "Book shipping and coordinate pickup and transit",
  "estimatedDuration": "1-3 days for booking, 7-30 days for transit",
  "automatedSteps": [
    "carrier_selection",
    "route_optimization",
    "booking_creation",
    "tracking_setup",
    "pickup_coordination"
  ],
  "humanSteps": [
    "approve_carrier_selection",
    "confirm_booking",
    "coordinate_cargo_readiness",
    "verify_pickup"
  ],
  "agentIntegration": {
    "shipping_management_agent": {
      "role": "Manage shipping booking and tracking",
      "functions": [
        "carrier_analysis",
        "route_optimization",
        "booking_management",
        "tracking_setup"
      ]
    }
  },
  "successCriteria": [
    "carrier_selected",
    "booking_confirmed",
    "tracking_enabled",
    "pickup_scheduled"
  ]
}
```

#### Stage 4: Customs Clearance
```json
{
  "stageId": "customs_clearance",
  "name": "Customs Clearance",
  "description": "Process customs declarations and clear goods through customs",
  "estimatedDuration": "1-5 days",
  "automatedSteps": [
    "hs_code_classification",
    "duty_calculation",
    "customs_declaration_submission",
    "risk_assessment",
    "clearance_tracking"
  ],
  "humanSteps": [
    "review_customs_declaration",
    "approve_duty_payment",
    "respond_to_customs_queries",
    "coordinate_inspection"
  ],
  "agentIntegration": {
    "customs_clearance_agent": {
      "role": "Process customs clearance",
      "functions": [
        "hs_code_classification",
        "duty_calculation",
        "documentation_verification",
        "restriction_screening",
        "risk_assessment"
      ]
    }
  },
  "successCriteria": [
    "customs_declaration_submitted",
    "duties_paid",
    "clearance_obtained",
    "goods_released"
  ]
}
```

#### Stage 5: Delivery & Completion
```json
{
  "stageId": "delivery_completion",
  "name": "Delivery & Completion",
  "description": "Coordinate final delivery and complete logistics workflow",
  "estimatedDuration": "1-3 days",
  "automatedSteps": [
    "delivery_coordination",
    "proof_of_delivery_capture",
    "documentation_archival",
    "performance_metrics_calculation",
    "supplier_rating_update"
  ],
  "humanSteps": [
    "receive_delivery",
    "verify_goods",
    "sign_proof_of_delivery",
    "report_issues"
  ],
  "successCriteria": [
    "delivery_completed",
    "goods_verified",
    "documentation_archived",
    "metrics_updated"
  ]
}
```

## Order System Integration (01900)

### Trigger Configuration
```json
{
  "triggerConfig": {
    "sourceDiscipline": "01900",
    "triggerEvent": "order_signed",
    "triggerConditions": {
      "order_signed_by_buyer": true,
      "order_signed_by_supplier": true,
      "order_status": "confirmed"
    },
    "additionalTriggers": [
      {
        "event": "shipment_ready",
        "condition": "goods_ready_for_pickup"
      },
      {
        "event": "customs_required",
        "condition": "international_shipment"
      }
    ]
  }
}
```

### Data Handoff Schema
```json
{
  "dataHandoff": {
    "from_01900_to_01700": {
      "order_data": {
        "order_id": "string",
        "order_number": "string",
        "order_date": "date",
        "order_value": "number",
        "currency": "string"
      },
      "supplier_data": {
        "supplier_name": "string",
        "supplier_country": "string",
        "supplier_address": "string",
        "supplier_contact": "string"
      },
      "delivery_data": {
        "delivery_location": "string",
        "delivery_country": "string",
        "required_delivery_date": "date",
        "special_requirements": "array"
      },
      "item_data": {
        "items": "array",
        "total_weight": "number",
        "total_volume": "number",
        "hazardous_materials": "boolean"
      },
      "terms": {
        "incoterms": "string",
        "payment_terms": "string"
      }
    },
    "from_01700_to_01900": {
      "logistics_status": {
        "shipment_id": "string",
        "tracking_number": "string",
        "current_status": "string",
        "eta": "date"
      },
      "delivery_confirmation": {
        "delivery_date": "date",
        "proof_of_delivery": "string",
        "issues_reported": "array"
      },
      "cost_data": {
        "shipping_cost": "number",
        "duty_cost": "number",
        "total_logistics_cost": "number"
      }
    }
  }
}
```

## Business Rules Configuration

### Shipping Mode Selection Rules
```json
{
  "shippingModeRules": {
    "urgent_delivery": {
      "condition": "required_delivery_date < 14 days",
      "mode": "air",
      "justification": "Time-critical delivery"
    },
    "high_value": {
      "condition": "order_value > 500000",
      "mode": "air",
      "justification": "High-value goods require faster, more secure transit"
    },
    "hazardous_materials": {
      "condition": "hazardous_materials = true",
      "mode": "sea",
      "justification": "Sea freight is safer for hazardous materials"
    },
    "regional_delivery": {
      "condition": "origin and destination in SADC region",
      "mode": "road",
      "justification": "Road freight is cost-effective for regional delivery"
    },
    "standard_international": {
      "condition": "international_shipment = true",
      "mode": "sea",
      "justification": "Sea freight is cost-effective for international shipments"
    }
  }
}
```

### Customs Clearance Thresholds
```json
{
  "customsThresholds": {
    "low_value": {
      "threshold": 50000,
      "clearance_type": "simplified",
      "inspection_probability": "low"
    },
    "standard_value": {
      "threshold": 200000,
      "clearance_type": "standard",
      "inspection_probability": "medium"
    },
    "high_value": {
      "threshold": 1000000,
      "clearance_type": "detailed",
      "inspection_probability": "high",
      "requires_additional_docs": true
    }
  }
}
```

### HITL Escalation Triggers
```json
{
  "hitlTriggers": {
    "high_value_shipments": {
      "threshold": 100000,
      "escalation_level": "logistics_manager",
      "reason": "High-value shipment requires management approval"
    },
    "restricted_items": {
      "condition": "restricted_items_detected",
      "escalation_level": "compliance_team",
      "reason": "Restricted items require compliance review"
    },
    "customs_issues": {
      "condition": "customs_clearance_failed",
      "escalation_level": "senior_logistics_manager",
      "reason": "Customs issues require senior intervention"
    },
    "delivery_exceptions": {
      "condition": "delivery_exception_detected",
      "escalation_level": "logistics_coordinator",
      "reason": "Delivery exception requires coordination"
    }
  }
}
```

## Performance Metrics

### Key Performance Indicators
```json
{
  "kpis": {
    "order_to_delivery_time": {
      "target": "21 days",
      "measurement": "order_signed_to_delivery_complete"
    },
    "documentation_accuracy": {
      "target": "98%",
      "measurement": "documents_accepted_first_time"
    },
    "customs_clearance_time": {
      "target": "48 hours",
      "measurement": "declaration_submitted_to_clearance"
    },
    "on_time_delivery": {
      "target": "95%",
      "measurement": "deliveries_on_or_before_eta"
    },
    "cost_accuracy": {
      "target": "90%",
      "measurement": "estimated_vs_actual_logistics_cost"
    }
  }
}
```

### Agent Performance Metrics
```json
{
  "agentMetrics": {
    "logistics_orchestrator": {
      "processing_time_target": "<5 seconds",
      "accuracy_target": ">95%"
    },
    "customs_clearance_agent": {
      "hs_classification_accuracy": ">92%",
      "duty_calculation_accuracy": ">95%"
    },
    "import_export_doc_agent": {
      "document_generation_time": "<3 seconds",
      "document_accuracy": ">98%"
    },
    "shipping_management_agent": {
      "carrier_selection_accuracy": ">90%",
      "transit_time_prediction_accuracy": ">85%"
    },
    "trade_compliance_agent": {
      "screening_accuracy": ">98%",
      "false_positive_rate": "<5%"
    }
  }
}
```

## Integration Points

### External System Integrations
```json
{
  "externalIntegrations": {
    "vesselfinder_api": {
      "purpose": "Vessel tracking",
      "endpoint": "https://api.vesselfinder.com",
      "data": ["vessel_position", "eta", "route"],
      "refresh_rate": "hourly"
    },
    "customs_system": {
      "purpose": "Electronic customs submission",
      "endpoint": "https://customs.gov.za/api",
      "data": ["declaration_submission", "status_query", "duty_payment"],
      "authentication": "certificate"
    },
    "carrier_apis": {
      "purpose": "Booking and tracking",
      "carriers": ["MAERSK", "MSC", "DHL", "FedEx"],
      "data": ["booking", "tracking", "documentation"]
    }
  }
}
```

### Internal System Integrations
```json
{
  "internalIntegrations": {
    "procurement_01900": {
      "trigger": "order_signed",
      "data_exchange": "bidirectional",
      "status_updates": "real-time"
    },
    "inventory_system": {
      "purpose": "Stock level validation",
      "data": ["availability", "location", "reservations"]
    },
    "financial_system": {
      "purpose": "Cost tracking and payment",
      "data": ["budget_check", "payment_processing", "cost_allocation"]
    }
  }
}
```

## Country-Specific Extensions

### Guinea CDC Processing

For shipments to Guinea, Stage 4 (Customs Clearance) is extended with CDC (Déclaration en Détail en Douane) processing:

**CDC Extension Stages**:
- **Stage 4a**: DDI Authorization (if value >12M GNF)
- **Stage 4b**: DI Submission (Pre-Arrival)
- **Stage 4c**: Value Verification & Payment
- **Stage 4d**: CDC Declaration Filing
- **Stage 4e**: Inspection & Enlèvement
- **Stage 4f**: Final Release (Bon de Sortie)

**Additional Data Required for Guinea**:
| Field | Type | Description |
|-------|------|-------------|
| `ddi_required` | BOOLEAN | DDI required flag (>12M GNF) |
| `ddi_reference` | VARCHAR(50) | DDI authorization number |
| `order_value_gnf` | DECIMAL(15,2) | Order value in GNF |
| `cdc_registration_number` | VARCHAR(50) | CDC registration |
| `guce_dossier_number` | VARCHAR(50) | GUCE dossier tracking |
| `importer_nif` | VARCHAR(20) | Guinea tax ID |
| `besc_number` | VARCHAR(50) | BESC tracking number |
| `hs_code_guinea` | VARCHAR(10) | 8-10 digit Guinea HS code |

**Full Documentation**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_GUINEA_CDC_CUSTOMS_PROCESSING.md`

## Version Control
- **Version**: 1.2.0
- **Created**: 2026-02-17
- **Last Updated**: 2026-02-25
- **Change Log**: Added database-driven prompt system and agent integration details
- **Change Log**: Added Guinea CDC customs processing extension
- **Change Log**: Initial logistics workflow configuration created
- **Next Review**: 2026-08-17
