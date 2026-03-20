# Country-Specific Customs Configuration Framework

## Overview

This document defines the extensible framework for managing country-specific customs requirements. The framework allows easy addition of new countries with their unique customs declaration requirements without modifying core workflow code.

**Status**: 📋 Framework Design Complete  
**Version**: 1.0.0  
**Created**: 2026-02-17  
**Priority**: High

---

## Configuration Architecture

### Database Schema

```sql
-- Table: country_customs_configurations
-- Stores country-specific customs declaration requirements

CREATE TABLE country_customs_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL UNIQUE,  -- ISO 3166-1 alpha-2
    country_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Customs declaration naming
    declaration_name VARCHAR(100),  -- e.g., "CDC", "SAD", "Import Declaration"
    declaration_name_local VARCHAR(100),  -- Local language name
    
    -- Portal information
    customs_portal_url VARCHAR(255),
    customs_portal_name VARCHAR(100),
    
    -- Thresholds
    ddi_threshold_value DECIMAL(15,2),  -- Value threshold for pre-authorization
    ddi_threshold_currency VARCHAR(3) DEFAULT 'USD',
    
    -- HS Code requirements
    hs_code_digits INT DEFAULT 8,  -- Number of digits required (6, 8, or 10)
    hs_code_validation_url VARCHAR(255),
    
    -- Regional alignment
    regional_tariff VARCHAR(50),  -- e.g., "ECOWAS_CET", "SADC_CET", "EAC_CET"
    
    -- Configuration JSON
    required_documents JSONB DEFAULT '[]',
    required_fields JSONB DEFAULT '{}',
    workflow_stages JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    
    CONSTRAINT valid_country_code CHECK (LENGTH(country_code) = 2)
);

-- Index for quick country lookup
CREATE INDEX idx_country_customs_code ON country_customs_configurations(country_code);
CREATE INDEX idx_country_customs_active ON country_customs_configurations(is_active);
```

### Required Fields Configuration Schema

```json
{
  "required_fields": {
    "order_level": [
      {
        "field_name": "importer_tax_id",
        "field_label": "Tax ID",
        "field_type": "string",
        "required": true,
        "validation_regex": "^[A-Z0-9]{8,20}$",
        "local_name": "NIF"
      }
    ],
    "item_level": [
      {
        "field_name": "hs_code",
        "field_label": "HS Code",
        "field_type": "string",
        "required": true,
        "validation_regex": "^[0-9]{8,10}$",
        "digits": 8
      },
      {
        "field_name": "gross_weight",
        "field_label": "Gross Weight (kg)",
        "field_type": "decimal",
        "required": true
      }
    ]
  }
}
```

### Workflow Stages Configuration Schema

```json
{
  "workflow_stages": [
    {
      "stage_id": "pre_authorization",
      "stage_name": "Pre-Authorization",
      "trigger_condition": "order_value > ddi_threshold_value",
      "required_documents": ["ddi_authorization"],
      "estimated_duration_days": 2
    },
    {
      "stage_id": "pre_arrival",
      "stage_name": "Pre-Arrival Declaration",
      "trigger_condition": "shipment_departed",
      "required_documents": ["commercial_invoice", "bill_of_lading"],
      "estimated_duration_days": 1
    }
  ]
}
```

---

## Country Configurations

### Guinea (GN) - CDC

```sql
INSERT INTO country_customs_configurations (
    country_code,
    country_name,
    declaration_name,
    declaration_name_local,
    customs_portal_url,
    customs_portal_name,
    ddi_threshold_value,
    ddi_threshold_currency,
    hs_code_digits,
    regional_tariff,
    required_documents,
    required_fields,
    workflow_stages
) VALUES (
    'GN',
    'Guinea',
    'CDC',
    'Déclaration en Détail en Douane',
    'https://guceg.gov.gn',
    'GUCE (Guichet Unique du Commerce Extérieur)',
    12000000,
    'GNF',
    10,
    'ECOWAS_CET',
    '["commercial_invoice", "bill_of_lading", "packing_list", "certificate_of_origin", "ddi_authorization"]',
    '{
      "order_level": [
        {"field_name": "importer_name", "field_label": "Importer Name", "field_type": "string", "required": true},
        {"field_name": "importer_nif", "field_label": "NIF (Tax ID)", "field_type": "string", "required": true, "local_name": "Numéro d''Identification Fiscale"},
        {"field_name": "importer_address", "field_label": "Importer Address", "field_type": "text", "required": true},
        {"field_name": "importer_phone", "field_label": "Importer Phone", "field_type": "string", "required": true}
      ],
      "item_level": [
        {"field_name": "hs_code", "field_label": "HS Code", "field_type": "string", "required": true, "digits": 10},
        {"field_name": "country_of_origin", "field_label": "Country of Origin", "field_type": "country_code", "required": true},
        {"field_name": "gross_weight", "field_label": "Gross Weight (kg)", "field_type": "decimal", "required": true},
        {"field_name": "net_weight", "field_label": "Net Weight (kg)", "field_type": "decimal", "required": true}
      ]
    }',
    '[
      {"stage_id": "ddi_authorization", "stage_name": "DDI Authorization", "trigger_condition": "order_value > 12000000", "estimated_duration_days": 2},
      {"stage_id": "di_submission", "stage_name": "DI Submission", "trigger_condition": "shipment_departed", "estimated_duration_days": 1},
      {"stage_id": "value_verification", "stage_name": "Value Verification & Payment", "trigger_condition": "di_approved", "estimated_duration_days": 1},
      {"stage_id": "cdc_filing", "stage_name": "CDC Declaration Filing", "trigger_condition": "payment_confirmed", "estimated_duration_days": 2},
      {"stage_id": "inspection", "stage_name": "Inspection & Enlèvement", "trigger_condition": "cdc_filed", "estimated_duration_days": 1},
      {"stage_id": "final_release", "stage_name": "Final Release", "trigger_condition": "inspection_complete", "estimated_duration_days": 1}
    ]'
);
```

### South Africa (ZA) - SAD500

```sql
INSERT INTO country_customs_configurations (
    country_code,
    country_name,
    declaration_name,
    declaration_name_local,
    customs_portal_url,
    customs_portal_name,
    hs_code_digits,
    regional_tariff,
    required_documents,
    required_fields,
    workflow_stages
) VALUES (
    'ZA',
    'South Africa',
    'SAD500',
    'Single Administrative Document',
    'https://www.customs.gov.za',
    'SARS Customs eFiling',
    8,
    'SADC_CET',
    '["commercial_invoice", "bill_of_lading", "packing_list", "certificate_of_origin"]',
    '{
      "order_level": [
        {"field_name": "importer_code", "field_label": "Importer Code", "field_type": "string", "required": true},
        {"field_name": "customs_client_number", "field_label": "CCN", "field_type": "string", "required": true}
      ],
      "item_level": [
        {"field_name": "hs_code", "field_label": "HS Code", "field_type": "string", "required": true, "digits": 8},
        {"field_name": "country_of_origin", "field_label": "Country of Origin", "field_type": "country_code", "required": true},
        {"field_name": "statistical_unit", "field_label": "Statistical Unit", "field_type": "string", "required": true}
      ]
    }',
    '[
      {"stage_id": "pre_clearance", "stage_name": "Pre-Clearance", "trigger_condition": "shipment_departed", "estimated_duration_days": 1},
      {"stage_id": "declaration_submission", "stage_name": "SAD500 Submission", "trigger_condition": "goods_arrived", "estimated_duration_days": 1},
      {"stage_id": "assessment", "stage_name": "Assessment & Payment", "trigger_condition": "declaration_submitted", "estimated_duration_days": 1},
      {"stage_id": "release", "stage_name": "Release", "trigger_condition": "payment_confirmed", "estimated_duration_days": 1}
    ]'
);
```

### Template for New Countries

```sql
-- Template for adding a new country configuration
INSERT INTO country_customs_configurations (
    country_code,
    country_name,
    declaration_name,
    declaration_name_local,
    customs_portal_url,
    customs_portal_name,
    ddi_threshold_value,
    ddi_threshold_currency,
    hs_code_digits,
    regional_tariff,
    required_documents,
    required_fields,
    workflow_stages
) VALUES (
    'XX',  -- ISO 3166-1 alpha-2 country code
    'Country Name',
    'Declaration Name',
    'Local Language Name',
    'https://customs-portal.gov.xx',
    'Portal Name',
    NULL,  -- Set if pre-authorization threshold exists
    'USD',
    8,  -- 6, 8, or 10
    NULL,  -- Regional tariff alignment if applicable
    '[]',  -- Required documents JSON array
    '{}',  -- Required fields JSON object
    '[]'   -- Workflow stages JSON array
);
```

---

## Agent Integration

### Customs Configuration Service

```python
# File: deep-agents/deep_agents/agents/pages/01700-logistics/services/customs_config_service.py

class CustomsConfigurationService:
    """Service for loading and managing country-specific customs configurations"""
    
    async def get_country_config(self, country_code: str) -> Dict:
        """Load customs configuration for a specific country"""
        
        config = await self.db.query(
            """
            SELECT * FROM country_customs_configurations 
            WHERE country_code = $1 AND is_active = TRUE
            """,
            country_code
        )
        
        if not config:
            return self.get_default_config()
        
        return {
            'country_code': config['country_code'],
            'country_name': config['country_name'],
            'declaration_name': config['declaration_name'],
            'portal_url': config['customs_portal_url'],
            'portal_name': config['customs_portal_name'],
            'ddi_threshold': {
                'value': config['ddi_threshold_value'],
                'currency': config['ddi_threshold_currency']
            },
            'hs_code_digits': config['hs_code_digits'],
            'regional_tariff': config['regional_tariff'],
            'required_documents': config['required_documents'],
            'required_fields': config['required_fields'],
            'workflow_stages': config['workflow_stages']
        }
    
    def get_default_config(self) -> Dict:
        """Return default configuration for countries without specific config"""
        return {
            'country_code': 'DEFAULT',
            'declaration_name': 'Import Declaration',
            'hs_code_digits': 6,
            'required_documents': ['commercial_invoice', 'bill_of_lading', 'packing_list'],
            'required_fields': {
                'order_level': [],
                'item_level': [
                    {'field_name': 'hs_code', 'field_label': 'HS Code', 'required': True}
                ]
            },
            'workflow_stages': [
                {'stage_id': 'declaration', 'stage_name': 'Customs Declaration'},
                {'stage_id': 'clearance', 'stage_name': 'Clearance'}
            ]
        }
    
    async def validate_customs_data(self, country_code: str, order_data: Dict) -> Dict:
        """Validate order data against country-specific requirements"""
        
        config = await self.get_country_config(country_code)
        validation_result = {
            'valid': True,
            'missing_fields': [],
            'errors': []
        }
        
        # Validate order-level fields
        for field in config['required_fields'].get('order_level', []):
            if field['required'] and not order_data.get(field['field_name']):
                validation_result['missing_fields'].append({
                    'field': field['field_name'],
                    'label': field['field_label'],
                    'level': 'order'
                })
                validation_result['valid'] = False
        
        # Validate item-level fields
        for item in order_data.get('items', []):
            for field in config['required_fields'].get('item_level', []):
                if field['required'] and not item.get(field['field_name']):
                    validation_result['missing_fields'].append({
                        'field': field['field_name'],
                        'label': field['field_label'],
                        'level': 'item',
                        'item_id': item.get('id')
                    })
                    validation_result['valid'] = False
        
        return validation_result
```

### Dynamic Form Generation

```javascript
// File: client/src/services/customsFormGenerator.js

class CustomsFormGenerator {
  /**
   * Generate dynamic form fields based on country configuration
   */
  generateFormFields(countryConfig) {
    const fields = [];
    
    // Add order-level fields
    const orderFields = countryConfig.required_fields?.order_level || [];
    orderFields.forEach(field => {
      fields.push({
        name: field.field_name,
        label: field.field_label,
        type: field.field_type,
        required: field.required,
        validation: field.validation_regex 
          ? new RegExp(field.validation_regex) 
          : null,
        localName: field.local_name
      });
    });
    
    return fields;
  }
  
  /**
   * Generate item-level field template
   */
  generateItemFields(countryConfig) {
    return countryConfig.required_fields?.item_level || [];
  }
  
  /**
   * Generate workflow stages for display
   */
  generateWorkflowStages(countryConfig) {
    return countryConfig.workflow_stages || [];
  }
}
```

---

## Adding New Countries

### Step-by-Step Guide

1. **Research Country Requirements**
   - Customs declaration name and format
   - Portal URL and authentication requirements
   - Required documents
   - HS code digit requirements
   - Pre-authorization thresholds
   - Regional tariff alignments

2. **Create Configuration Record**
   ```sql
   INSERT INTO country_customs_configurations (...) VALUES (...);
   ```

3. **Create Detailed Documentation**
   - Create file: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_{COUNTRY}_CUSTOMS_PROCESSING.md`
   - Document portal workflow
   - List all required fields
   - Include common pitfalls

4. **Test Configuration**
   - Validate JSON schemas
   - Test form generation
   - Verify workflow stages

5. **Deploy**
   - Add configuration to database
   - Update documentation
   - Notify users

---

## Configuration Management API

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/customs/config/:country_code` | GET | Get country configuration |
| `/api/customs/config` | POST | Create new country configuration |
| `/api/customs/config/:country_code` | PUT | Update country configuration |
| `/api/customs/config/:country_code` | DELETE | Deactivate country configuration |
| `/api/customs/validate/:country_code` | POST | Validate order data |

---

## Benefits of Configuration-Driven Approach

1. **Easy Addition**: Add new countries by inserting a database record
2. **No Code Changes**: Configuration changes don't require code deployment
3. **Dynamic Forms**: Forms generated automatically from configuration
4. **Validation**: Built-in validation based on field definitions
5. **Extensibility**: Easy to add new field types and validation rules
6. **Maintenance**: Update configurations without system downtime

---

## Related Documentation

- **Guinea CDC Processing**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_GUINEA_CDC_CUSTOMS_PROCESSING.md`
- **Logistics Workflow**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md`
- **Procurement Integration**: `/docs/procedures/human-workflows/01900_PROCUREMENT_INPUT_AGENT_WORKFLOW.md`

---

*Document Version: 1.0.0*  
*Created: 2026-02-17*  
*Author: Construct AI Development Team*