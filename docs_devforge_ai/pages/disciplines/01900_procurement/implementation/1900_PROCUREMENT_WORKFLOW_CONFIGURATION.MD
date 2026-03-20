# 01900 Comprehensive Procurement Workflow Configuration

## Overview
This document defines the comprehensive configuration for the Procurement workflow (01900), covering the complete procurement lifecycle from order initiation through document generation, approval, execution, fulfillment, and completion. The workflow integrates AI agents for intelligent processing while ensuring compliance and human oversight.

## Workflow Architecture

### Core Components
- **Procurement Order Lifecycle**: Complete order-to-delivery process
- **AI Agent Orchestration**: Intelligent order processing and validation
- **Document Generation**: Automated template selection and population
- **HITL Integration**: Human oversight for critical decisions
- **Approval Workflows**: Multi-level approval routing with limits of authority
- **Fulfillment Tracking**: Order execution and delivery monitoring
- **Quality Assurance**: Post-delivery validation and performance feedback

### Agent Integration
The workflow leverages specialized procurement agents:
- **Procurement Final Review Agent**: Strategic alignment and approval routing
- **Technical Routing Specialist Agent**: Engineering discipline assignment
- **Safety Data Sheets Specialist Agent**: Compliance validation
- **Logistics Specialist Agent**: Supply chain and delivery management
- **Supply Chain Specialist Agent**: Procurement strategy optimization
- **Template Analysis Agent**: Document template selection and analysis
- **Field Population Agent**: Automated form field completion

## Configuration Structure

### Workflow Metadata
```json
{
  "workflowId": "01900_procurement_comprehensive",
  "version": "3.0.0",
  "discipline": "01900",
  "description": "Complete procurement lifecycle with document generation and AI orchestration",
  "initiatedBy": ["procurement_officer", "project_manager", "department_head"],
  "estimatedDuration": "2-45 days",
  "complexityLevels": ["basic", "standard", "complex", "critical"]
}
```

### Stage Configuration

#### Stage 1: Order Initiation & Requirements
```json
{
  "stageId": "order_initiation",
  "name": "Order Initiation & Requirements",
  "description": "Capture procurement requirements and select appropriate templates",
  "estimatedDuration": "1-3 days",
  "automatedSteps": [
    "requirement_validation",
    "budget_check",
    "template_recommendation"
  ],
  "humanSteps": [
    "requirement_approval",
    "template_selection",
    "budget_authorization"
  ],
  "successCriteria": [
    "requirements_complete",
    "template_selected",
    "budget_approved"
  ]
}
```

#### Stage 2: Chatbot Workflow Streaming & Initial Processing
```json
{
  "stageId": "chatbot_streaming",
  "name": "Chatbot Workflow Streaming & Initial Processing",
  "description": "Real-time agent execution displayed in chatbot with sequential updates",
  "estimatedDuration": "4.5 seconds",
  "automatedSteps": [
    "modal_closure",
    "chatbot_activation",
    "sequential_agent_execution",
    "real_time_updates"
  ],
  "humanSteps": [
    "workflow_monitoring",
    "agent_progress_observation",
    "completion_confirmation"
  ],
  "agentIntegration": {
    "template_analysis_agent": {
      "role": "Analyzes procurement requirements against available templates",
      "duration": "800ms",
      "display": "Activation message → Processing → Completion with metrics"
    },
    "requirements_extraction_agent": {
      "role": "Extracts structured requirements from procurement specifications",
      "duration": "700ms",
      "display": "Activation message → Processing → Completion with extraction counts"
    },
    "compliance_validation_agent": {
      "role": "Validates requirements against PPPA, ISO, and CIDB standards",
      "duration": "900ms",
      "display": "Activation message → Processing → Compliance check results"
    },
    "field_population_agent": {
      "role": "Maps extracted data to procurement template fields",
      "duration": "800ms",
      "display": "Activation message → Processing → Field mapping results"
    },
    "quality_assurance_agent": {
      "role": "Validates document completeness and accuracy",
      "duration": "600ms",
      "display": "Activation message → Processing → Quality scores"
    },
    "final_review_agent": {
      "role": "Assembles complete procurement package with appendices",
      "duration": "850ms",
      "display": "Activation message → Processing → Assembly confirmation"
    },
    "assignment_agent": {
      "role": "Distributes tasks to discipline specialists",
      "duration": "650ms",
      "display": "Activation message → Processing → Assignment confirmation"
    }
  },
  "chatbotIntegration": {
    "trigger": "Modal closes immediately when Create is clicked",
    "activation": "Procurement Chatbot opens with workflow message",
    "displayFormat": "Sequential markdown messages with activation, processing, completion",
    "timing": "400ms between agents, 500ms before streaming starts",
    "totalTime": "~4.5 seconds for 7 agents",
    "metricsDisplayed": [
      "Processing time (ms)",
      "Template compatibility score",
      "Requirements extracted count",
      "Compliance checks count",
      "Fields populated count",
      "Quality score",
      "Documents prepared count",
      "Specialists assigned count"
    ]
  }
}
```

### Stage 3: Document Generation & Population
```json
{
  "stageId": "document_generation",
  "name": "Document Generation & Population",
  "description": "Generate and populate procurement documents using AI agents",
  "estimatedDuration": "2-5 days",
  "automatedSteps": [
    "template_analysis",
    "requirement_extraction",
    "field_population",
    "compliance_validation"
  ],
  "humanSteps": [
    "specialist_reviews",
    "quality_assurance",
    "final_approvals"
  ],
  "agentIntegration": {
    "template_analysis_agent": "template_selection",
    "field_population_agent": "automated_completion",
    "compliance_agent": "validation_checks"
  }
}
```

#### Stage 3: Technical Evaluation & Compliance
```json
{
  "stageId": "technical_evaluation",
  "name": "Technical Evaluation & Compliance",
  "description": "Technical specification review and regulatory compliance validation",
  "estimatedDuration": "3-7 days",
  "automatedSteps": [
    "specification_analysis",
    "compliance_check",
    "risk_assessment"
  ],
  "humanSteps": [
    "technical_review",
    "safety_validation",
    "compliance_approval"
  ],
  "agentIntegration": {
    "technical_routing_agent": "discipline_assignment",
    "safety_specialist_agent": "compliance_validation",
    "logistics_agent": "feasibility_assessment"
  }
}
```

#### Stage 4: Approval & Authorization
```json
{
  "stageId": "approval_authorization",
  "name": "Approval & Authorization",
  "description": "Multi-level approval routing based on limits of authority",
  "estimatedDuration": "1-5 days",
  "automatedSteps": [
    "approval_matrix_calculation",
    "stakeholder_notification",
    "deadline_tracking"
  ],
  "humanSteps": [
    "approval_reviews",
    "condition_setting",
    "final_authorization"
  ]
}
```

#### Stage 5: Procurement Execution
```json
{
  "stageId": "procurement_execution",
  "name": "Procurement Execution",
  "description": "Supplier selection, contract negotiation, and order placement",
  "estimatedDuration": "5-15 days",
  "automatedSteps": [
    "supplier_evaluation",
    "price_analysis",
    "contract_generation"
  ],
  "humanSteps": [
    "supplier_selection",
    "negotiation",
    "final_approval"
  ],
  "agentIntegration": {
    "procurement_final_review_agent": "strategic_evaluation",
    "supply_chain_agent": "optimization_recommendations"
  }
}
```

#### Stage 6: Order Fulfillment & Delivery
```json
{
  "stageId": "order_fulfillment",
  "name": "Order Fulfillment & Delivery",
  "description": "Order execution, delivery tracking, and quality control",
  "estimatedDuration": "7-30 days",
  "automatedSteps": [
    "order_tracking",
    "delivery_monitoring",
    "quality_inspection"
  ],
  "humanSteps": [
    "delivery_acceptance",
    "quality_verification",
    "issue_resolution"
  ]
}
```

#### Stage 7: Completion & Performance Review
```json
{
  "stageId": "completion_review",
  "name": "Completion & Performance Review",
  "description": "Final acceptance, documentation, and supplier performance evaluation",
  "estimatedDuration": "1-3 days",
  "automatedSteps": [
    "documentation_archival",
    "performance_metrics",
    "supplier_rating"
  ],
  "humanSteps": [
    "final_acceptance",
    "feedback_collection",
    "lesson_learned"
  ]
}
```

## Business Rules Configuration

### Limits of Authority Matrix
```json
{
  "limitsOfAuthority": {
    "procurement_officer": {
      "maxValue": 50000,
      "approvalTypes": ["low_value_orders", "standard_templates"],
      "conditions": ["budget_available", "no_special_requirements"]
    },
    "procurement_manager": {
      "maxValue": 250000,
      "approvalTypes": ["medium_value_orders", "complex_templates", "supplier_changes"],
      "conditions": ["technical_review_completed", "risk_assessment_approved"]
    },
    "executive": {
      "maxValue": 1000000,
      "approvalTypes": ["high_value_orders", "strategic_suppliers", "policy_changes"],
      "conditions": ["full_business_case", "board_notification"]
    },
    "board_level": {
      "maxValue": 10000000,
      "approvalTypes": ["critical_infrastructure", "enterprise_agreements"],
      "conditions": ["executive_summary", "legal_review", "full_due_diligence"]
    }
  }
}
```

### Document Template Configuration

#### Available Procurement Templates

**✅ SYSTEM NOW OPERATIONAL**: The procurement templates-forms-management page at `http://localhost:3060/#/templates-forms-management?discipline=01900` displays 7 fully functional procurement templates:

**Equipment Rental Agreement Form**
- Complete HTML form with validation schemas
- Fields: Equipment Type, Rental Period, Daily Rate, Delivery Location, Special Requirements
- Suitable for: equipment_rental, rental_agreement document types

**Supplier Evaluation Form**
- Comprehensive supplier qualification form
- Fields: Company Name, Contact Person, Product/Services, Quality/Delivery/Price Ratings (1-5 scale), Certifications, Recommendations
- Suitable for: supplier_evaluation, vendor_assessment document types

**Contractor Performance Review**
- Multi-dimensional contractor assessment form
- Fields: Contractor Name, Contract Number, Review Period, Work Quality, Timeliness, Safety Compliance, Communication, Cost Control, Overall Rating
- Suitable for: contractor_review, performance_evaluation, vendor_assessment document types

**Purchase Order Request Form**
- Complete purchase request workflow form
- Fields: Requester Info, Request Details, Item Description, Quantity, Unit Price, Total Cost, Budget Code, Approval Requirements
- Suitable for: purchase_request, procurement_request, order_request document types

**Vendor Registration Form**
- Comprehensive vendor onboarding form
- Fields: Company Details, Business Registration, Tax ID, Business Address, Contact Info, Business Type, Products/Services, Certifications, References
- Suitable for: vendor_registration, supplier_registration, vendor_onboarding document types

**Additional Templates**:
- Form - Scope Of Work Test (draft status - for testing)
- Form - Lubricants Form (active - procurement SOW template)

**Technical Implementation**:
- All templates use `discipline: 'Procurement'` for proper filtering
- Templates include complete HTML forms, JSON validation schemas, and UI configuration
- Discipline code mapping (01900 → Procurement) implemented in API routes
- Templates accessible via `/api/templates?status=all&user_role=unknown&discipline=01900`

## Agent Orchestration Rules

### Agent Assignment Logic
```json
{
  "agentAssignment": {
    "order_value_based": {
      "low_value": ["basic_validation_agent"],
      "medium_value": ["basic_validation_agent", "compliance_agent"],
      "high_value": ["comprehensive_review_agent", "risk_assessment_agent", "compliance_agent"],
      "critical_value": ["comprehensive_review_agent", "risk_assessment_agent", "compliance_agent", "executive_review_agent"]
    },
    "complexity_based": {
      "document_generation": ["template_analysis_agent", "field_population_agent"],
      "technical_complexity": ["technical_routing_agent", "specialist_agents"],
      "supply_chain_complexity": ["logistics_agent", "supply_chain_agent"],
      "regulatory_complexity": ["compliance_agent", "legal_agent"]
    },
    "specialized_requirements": {
      "safety_critical": ["safety_specialist_agent", "compliance_agent"],
      "international": ["supply_chain_agent", "customs_agent"],
      "innovative_technology": ["technical_routing_agent", "innovation_agent"]
    }
  }
}
```

### Agent Decision Thresholds
```json
{
  "decisionThresholds": {
    "auto_approve": {
      "confidence_threshold": 0.95,
      "risk_score_max": 0.2,
      "compliance_score_min": 0.9
    },
    "human_review": {
      "confidence_threshold": 0.7,
      "risk_score_min": 0.3,
      "complexity_score_min": 0.6
    },
    "escalation_required": {
      "confidence_threshold": 0.5,
      "risk_score_min": 0.5,
      "critical_factors_present": true
    }
  }
}
```

## Integration Points

### System Integrations
- **ERP Systems**: SAP, Oracle, Microsoft Dynamics
- **Supplier Portals**: Automated order transmission
- **Financial Systems**: Budget checking and commitment
- **Inventory Systems**: Stock level validation
- **Quality Management**: Inspection and acceptance workflows
- **Templates System**: Document generation and population

### Data Sources
- **Supplier Database**: Qualification and performance history
- **Contract Repository**: Template and clause libraries
- **Compliance Frameworks**: Regulatory requirements and standards
- **Market Intelligence**: Pricing benchmarks and supplier analysis
- **Internal Policies**: Procurement procedures and approval limits

## Monitoring & Analytics

### Key Performance Indicators
```json
{
  "kpis": {
    "order_cycle_time": {
      "target": "15 days",
      "measurement": "order_creation_to_delivery"
    },
    "document_accuracy": {
      "target": "98%",
      "measurement": "auto_populated_fields_accuracy"
    },
    "approval_efficiency": {
      "target": "24 hours",
      "measurement": "average_approval_cycle_time"
    },
    "supplier_performance": {
      "target": "95%",
      "measurement": "on_time_delivery_rate"
    },
    "cost_savings": {
      "target": "5%",
      "measurement": "negotiated_vs_list_price"
    }
  }
}
```

### Workflow Analytics
- **Stage transition times and bottlenecks**
- **Agent performance metrics and accuracy**
- **HITL intervention rates and resolution times**
- **Template utilization and success rates**
- **Approval workflow efficiency analysis**

## Risk Management

### Procurement Risk Categories
- **Financial Risk**: Budget overruns, currency fluctuations, supplier default
- **Supplier Risk**: Delivery failures, quality issues, capacity constraints
- **Compliance Risk**: Regulatory violations, contract breaches
- **Operational Risk**: Process failures, system downtime, human error
- **Technical Risk**: Specification errors, integration issues
- **Reputational Risk**: Stakeholder dissatisfaction, brand damage

### Mitigation Strategies
- **Automated validation**: Real-time compliance and budget checking
- **Multi-supplier strategy**: Risk diversification across suppliers
- **Escalation protocols**: Multi-level approval and review processes
- **Contingency planning**: Backup suppliers and alternative sourcing
- **Performance monitoring**: Continuous supplier evaluation and rating
- **Audit trails**: Complete documentation of all procurement decisions

## Security Implementation

### Data Protection
- **Supplier Confidentiality**: Encrypted storage of sensitive supplier data
- **Access Controls**: Role-based access to procurement workflows
- **Audit Trails**: Complete audit logging of all procurement decisions
- **Data Retention**: Configurable retention policies for procurement records
- **Compliance Monitoring**: Regular security assessments and access reviews

### Agent Security Validation
- **Input Validation**: Sanitization of all procurement-related data
- **Output Filtering**: Prevention of sensitive data exposure in agent responses
- **Rate Limiting**: Protection against automated abuse of procurement endpoints
- **Authentication**: Secure agent-to-system communication protocols

## Logistics Integration (01700)

### Trigger Configuration
```json
{
  "logisticsTrigger": {
    "triggerEvent": "order_signed",
    "triggerConditions": {
      "order_signed_by_buyer": true,
      "order_signed_by_supplier": true,
      "order_status": "confirmed"
    },
    "additionalConditions": {
      "international_shipment": "supplier_country != delivery_country",
      "customs_required": "international_shipment = true"
    }
  }
}
```

### Logistics Data Handoff Schema
```json
{
  "logisticsDataHandoff": {
    "order_data": {
      "order_id": "string",
      "order_number": "string",
      "order_date": "date",
      "order_value": "number",
      "currency": "string (ISO 4217)"
    },
    "supplier_data": {
      "supplier_name": "string",
      "supplier_country": "string (ISO 3166-1 alpha-2)",
      "supplier_address": "string (full address)",
      "supplier_city": "string",
      "supplier_postal_code": "string",
      "supplier_contact": "string",
      "supplier_email": "string",
      "supplier_phone": "string"
    },
    "delivery_data": {
      "delivery_location": "string",
      "delivery_country": "string (ISO 3166-1 alpha-2)",
      "delivery_address": "string (full address)",
      "required_delivery_date": "date",
      "port_of_loading": "string (UN/LOCODE, for international)",
      "port_of_discharge": "string (UN/LOCODE, for international)",
      "final_destination": "string (if different from delivery)",
      "special_requirements": "array"
    },
    "item_data": {
      "items": [
        {
          "description": "string",
          "hs_code": "string",
          "quantity": "number",
          "unit_price": "number",
          "weight": "number (kg)",
          "volume": "number (CBM)",
          "country_of_origin": "string (ISO 3166-1 alpha-2)",
          "hazardous": "boolean",
          "un_number": "string (if hazardous)",
          "packing_group": "string (if hazardous)"
        }
      ],
      "total_weight": "number (kg)",
      "total_volume": "number (CBM)",
      "hazardous_materials": "boolean"
    },
    "logistics_terms": {
      "incoterms": "string (e.g., FOB, CIF, DDP)",
      "preferred_shipping_mode": "string (sea/air/road/rail)",
      "preferred_carrier": "string (optional)",
      "insurance_required": "boolean",
      "customs_broker": "string (optional)",
      "import_permit_reference": "string (if required)",
      "export_license_reference": "string (if required)"
    }
  }
}
```

### Required Logistics Data Fields

#### Priority 1: Critical Fields (Required for Basic Logistics)
| Field | Type | Location | Description |
|-------|------|----------|-------------|
| `supplier_country` | VARCHAR(2) | Order Header | ISO 3166-1 alpha-2 country code |
| `delivery_country` | VARCHAR(2) | Delivery Section | ISO 3166-1 alpha-2 country code |
| `required_delivery_date` | DATE | Order Header | Target delivery date |
| `transaction_currency` | VARCHAR(3) | Order Header | ISO 4217 currency code |
| `hazardous_materials` | BOOLEAN | Order Header | Flag for hazardous goods |

#### Priority 2: Important Fields (Required for International Logistics)
| Field | Type | Location | Description |
|-------|------|----------|-------------|
| `port_of_loading` | VARCHAR(5) | Delivery Schedule | UN/LOCODE port code |
| `port_of_discharge` | VARCHAR(5) | Delivery Schedule | UN/LOCODE port code |
| `item_weight` | DECIMAL(10,2) | Order Line Items | Weight in kg per item |
| `item_volume` | DECIMAL(10,3) | Order Line Items | Volume in CBM per item |
| `country_of_origin` | VARCHAR(2) | Order Line Items | ISO country code per item |

### Agent Responsibilities for Logistics Data

| Agent | Logistics Data Responsibilities |
|-------|--------------------------------|
| **Template Analysis Agent** | Identify logistics-relevant templates, flag international orders |
| **Requirement Extraction Agent** | Extract supplier/delivery country, identify hazardous materials |
| **Compliance Validation Agent** | Validate country codes, check import/export restrictions |
| **Field Population Agent** | Auto-populate country codes, calculate weight/volume |
| **Quality Assurance Agent** | Validate logistics data completeness |
| **Final Review Agent** | Assess logistics readiness, trigger logistics workflow |

### Related Documentation
- **Logistics Framework**: `/docs/logistics/01700_LOGISTICS_SETUP_COMPLETE.md`
- **Data Capture Analysis**: `/docs/logistics/01700_PROCUREMENT_DATA_CAPTURE_ANALYSIS.md`
- **Logistics Workflow**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md`

## CDC/DDI Integration for Guinea (Customs Declaration)

### Overview
When the destination country is Guinea (GN), additional CDC (Customs Declaration Certificate) requirements are triggered. This integration ensures compliance with Guinea's import regulations and automates DDI (Demande Déscriptive d'Importation) threshold detection.

### CDC Trigger Configuration
```json
{
  "cdcConfiguration": {
    "triggerCountry": "GN",
    "triggerCondition": "destination_country === 'GN'",
    "requiredFields": [
      "importer_nif",
      "importer_address_guinea"
    ],
    "optionalFields": [
      "importer_rccm",
      "customs_office"
    ]
  }
}
```

### DDI Threshold Detection
```json
{
  "ddiThreshold": {
    "thresholdGNF": 12000000,
    "thresholdUSD": 1250,
    "exchangeRates": {
      "USD_TO_GNF": 9600,
      "EUR_TO_GNF": 10400,
      "ZAR_TO_GNF": 520,
      "GBP_TO_GNF": 12100,
      "XAF_TO_GNF": 15.9
    },
    "triggerCondition": "order_value_gnf > 12000000",
    "requiredDocuments": [
      "DDI from Ministry of Commerce",
      "Commercial Invoice",
      "Bill of Lading",
      "Certificate of Origin"
    ]
  }
}
```

### CDC Data Capture Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `destination_country` | VARCHAR(2) | Yes | ISO 3166-1 alpha-2 country code (GN for Guinea) |
| `cdc_required` | BOOLEAN | Auto | Automatically set when destination is Guinea |
| `importer_nif` | VARCHAR(50) | Yes* | Tax ID (Numéro d'Identification Fiscale) |
| `importer_address_guinea` | TEXT | Yes* | Physical address in Guinea for CDC declaration |
| `importer_rccm` | VARCHAR(50) | No | Business registration number |
| `customs_office` | VARCHAR(5) | No | Guinea customs office code (default: CKY) |
| `order_value_gnf` | DECIMAL(15,2) | Auto | Order value converted to GNF |
| `ddi_required` | BOOLEAN | Auto | True if order_value_gnf > 12,000,000 |
| `ddi_reference` | VARCHAR(100) | Cond* | DDI reference number (required if ddi_required) |
| `ddi_issue_date` | DATE | Cond* | DDI issue date (required if ddi_required) |

*Required when destination_country = 'GN'

### CDC Workflow Stages (Logistics Integration)

When an order with CDC requirements is signed, the following stages are triggered in the 01700 Logistics Workflow:

| Stage | Name | Required | Description |
|-------|------|----------|-------------|
| 4a | DDI Authorization | Conditional | Required if order value > 12M GNF |
| 4b | DI Submission (Pre-Arrival) | Yes | Pre-arrival declaration submission |
| 4c | Value Verification & Payment | Yes | Customs value verification and duty payment |
| 4d | CDC Declaration Filing | Yes | Formal customs declaration filing |
| 4e | Inspection & Enlèvement | Yes | Physical inspection and release |
| 4f | Final Release (Bon de Sortie) | Yes | Final customs release document |

### CDC/DDI Service Integration

The CDC/DDI functionality is implemented in:
- **Service**: `/client/src/services/cdcDDIService.js`
- **Component**: `/client/src/pages/01900-procurement/components/modals/CDCDDIWorkflowStep.jsx`
- **Parser**: `/client/src/utils/currencyUOMParser.js`

### Workflow Step Integration

The CDC/DDI workflow step is inserted after "Select Items" and before "Estimated Value" in the procurement workflow:

```
Standard Flow (Non-Guinea):
1. Select Items → Done
2. Estimated Value
3. Procurement Type
4. Requirements
5. Timeline

Guinea CDC Flow:
1. Select Items → Done
2. Destination Country → "Guinea" detected
3. 🌍 CDC Required Alert - Shows CDC processing requirements
4. Importer NIF - Tax ID capture
5. Importer Address - Physical address in Guinea
6. DDI Check - Automatic detection if order value > 12M GNF
7. Estimated Value
8. Procurement Type
9. Requirements
10. Timeline
```

### Related Documentation
- **CDC/DDI Service**: `/client/src/services/cdcDDIService.js`
- **Currency/UOM Parser**: `/client/src/utils/currencyUOMParser.js`
- **Logistics Framework**: `/docs/logistics/01700_LOGISTICS_SETUP_COMPLETE.md`
- **Logistics Workflow**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md`

## Version Control
- **Version**: 3.2.0
- **Last Updated**: 2026-02-17
- **Next Review**: 2026-08-17
- **Change Log**: Added CDC/DDI integration for Guinea customs requirements, DDI threshold detection, and currency/UOM parser
