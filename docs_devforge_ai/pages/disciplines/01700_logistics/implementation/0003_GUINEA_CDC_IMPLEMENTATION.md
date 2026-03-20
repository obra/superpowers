# Guinea CDC Implementation Plan

## Overview

This implementation plan defines the steps required to add Guinea CDC (Déclaration en Détail en Douane) customs processing capabilities to the Logistics (01700) workflow.

**Status**: 📋 Planning Complete  
**Version**: 1.0.0  
**Created**: 2026-02-17  
**Country Code**: GN (Guinea)  
**Priority**: High

---

## Implementation Summary

### Objective
Extend the Logistics (01700) workflow to support Guinea CDC customs declarations for all imports into Guinea.

### Scope
- Database schema updates for Guinea-specific fields
- CDC processing agent extension
- GUCE portal integration
- CDC document template creation

### Timeline
- **Phase 1 (Database)**: 1-2 days
- **Phase 2 (Agent Extension)**: 2-3 days
- **Phase 3 (GUCE Integration)**: 3-5 days
- **Phase 4 (Testing)**: 1-2 days
- **Total Estimated**: 7-12 days

---

## Phase 1: Database Schema Updates

### 1.1 Order Header Fields

```sql
-- Migration: Add Guinea CDC fields
-- File: database/migrations/add_guinea_cdc_fields.sql

-- DDI (Demande Déscriptive d'Importation) fields
ALTER TABLE orders ADD COLUMN ddi_required BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN orders.ddi_required IS 'DDI required for Guinea imports >12M GNF';

ALTER TABLE orders ADD COLUMN ddi_reference VARCHAR(50);
COMMENT ON COLUMN orders.ddi_reference IS 'DDI authorization number from Ministry of Commerce';

ALTER TABLE orders ADD COLUMN ddi_issue_date DATE;
COMMENT ON COLUMN orders.ddi_issue_date IS 'DDI issue date';

-- Order value in GNF (Guinean Franc)
ALTER TABLE orders ADD COLUMN order_value_gnf DECIMAL(15,2);
COMMENT ON COLUMN orders.order_value_gnf IS 'Order value converted to Guinean Francs';

-- CDC (Déclaration en Détail en Douane) fields
ALTER TABLE orders ADD COLUMN cdc_registration_number VARCHAR(50);
COMMENT ON COLUMN orders.cdc_registration_number IS 'CDC registration number from GUCE';

ALTER TABLE orders ADD COLUMN guce_dossier_number VARCHAR(50);
COMMENT ON COLUMN orders.guce_dossier_number IS 'GUCE dossier tracking number';

ALTER TABLE orders ADD COLUMN bon_de_sortie_reference VARCHAR(50);
COMMENT ON COLUMN orders.bon_de_sortie_reference IS 'Final exit permit reference';
```

### 1.2 Importer Fields

```sql
-- Add Guinea importer fields
ALTER TABLE orders ADD COLUMN importer_nif VARCHAR(20);
COMMENT ON COLUMN orders.importer_nif IS 'Numéro d Identification Fiscale (Guinea tax ID)';

ALTER TABLE orders ADD COLUMN importer_address_guinea TEXT;
COMMENT ON COLUMN orders.importer_address_guinea IS 'Full importer address in Guinea';

ALTER TABLE orders ADD COLUMN importer_phone_guinea VARCHAR(20);
COMMENT ON COLUMN orders.importer_phone_guinea IS 'Importer phone number in Guinea';
```

### 1.3 Transport Fields

```sql
-- Add Guinea transport fields
ALTER TABLE orders ADD COLUMN manifest_number VARCHAR(50);
COMMENT ON COLUMN orders.manifest_number IS 'Cargo manifest number';

ALTER TABLE orders ADD COLUMN manifest_filed_date TIMESTAMP;
COMMENT ON COLUMN orders.manifest_filed_date IS 'Date manifest was filed (48h prior requirement)';

ALTER TABLE orders ADD COLUMN besc_number VARCHAR(50);
COMMENT ON COLUMN orders.besc_number IS 'Bordereau Electronique de Suivi des Cargaisons number';

ALTER TABLE orders ADD COLUMN civio_number VARCHAR(50);
COMMENT ON COLUMN orders.civio_number IS 'CIVIO number for vehicle imports';
```

### 1.4 HS Code Fields

```sql
-- Add Guinea HS code fields to order_items
ALTER TABLE order_items ADD COLUMN hs_code_guinea VARCHAR(10);
COMMENT ON COLUMN order_items.hs_code_guinea IS '8-10 digit Guinea HS code';

ALTER TABLE order_items ADD COLUMN hs_code_validated BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN order_items.hs_code_validated IS 'HS code validated against GUCE simulator';

ALTER TABLE order_items ADD COLUMN ecowas_cet_rate DECIMAL(5,2);
COMMENT ON COLUMN order_items.ecowas_cet_rate IS 'ECOWAS Common External Tariff rate';

ALTER TABLE order_items ADD COLUMN duty_rate DECIMAL(5,2);
COMMENT ON COLUMN order_items.duty_rate IS 'Calculated duty rate for Guinea';

-- Create indexes for Guinea CDC queries
CREATE INDEX idx_orders_guinea_cdc ON orders(cdc_registration_number);
CREATE INDEX idx_orders_guinea_guce ON orders(guce_dossier_number);
CREATE INDEX idx_orders_guinea_ddi ON orders(ddi_reference);
CREATE INDEX idx_order_items_hs_guinea ON order_items(hs_code_guinea);
```

---

## Phase 2: Agent Extension

### 2.1 CDC Processing Agent

```python
# File: deep-agents/deep_agents/agents/pages/01700-logistics/extensions/guinea_cdc_processor.py

class GuineaCDCProcessor:
    """Extension to Customs Clearance Agent for Guinea CDC processing"""
    
    DDI_THRESHOLD_GNF = 12000000  # ~USD 1,250
    
    async def process_guinea_cdc(self, order_data: Dict) -> Dict:
        """Process CDC declaration for Guinea imports"""
        
        # Convert order value to GNF
        order_value_gnf = await self.convert_to_gnf(
            order_data.get('order_value'),
            order_data.get('transaction_currency')
        )
        
        # Stage 4a: Check DDI requirement
        ddi_result = None
        if order_value_gnf > self.DDI_THRESHOLD_GNF:
            ddi_result = await self.process_ddi_authorization(order_data)
        
        # Stage 4b: Submit DI (Déclaration d'Intention)
        di_result = await self.submit_di_declaration(order_data)
        
        # Stage 4c: Value verification and payment
        payment_result = await self.process_guce_payment(order_data)
        
        # Stage 4d: File CDC
        cdc_result = await self.file_cdc_declaration(order_data)
        
        # Stage 4e: Inspection
        inspection_result = await self.coordinate_inspection(order_data)
        
        # Stage 4f: Final release
        release_result = await self.obtain_bon_de_sortie(order_data)
        
        return {
            'ddi': ddi_result,
            'di': di_result,
            'payment': payment_result,
            'cdc': cdc_result,
            'inspection': inspection_result,
            'release': release_result
        }
    
    async def validate_hs_code_guinea(self, hs_code: str) -> Dict:
        """Validate HS code for Guinea customs (8-10 digits)"""
        
        if len(hs_code) < 8 or len(hs_code) > 10:
            return {
                'valid': False,
                'error': 'HS code must be 8-10 digits for Guinea'
            }
        
        # Validate against GUCE simulator
        validation = await self.query_guce_simulator(hs_code)
        
        return validation
```

---

## Phase 3: GUCE Integration

### 3.1 Portal Integration Points

| Integration | Purpose | Endpoint |
|-------------|---------|----------|
| **GUCE Portal** | CDC submission | guceg.gov.gn |
| **DI Submission** | Pre-arrival declaration | Initier/Envoyer |
| **e-Payment** | Duty payment | Central Bank transfer |
| **DVT** | Virtual transaction dossier | Dossier tracking |

### 3.2 Required Credentials

- GUCE portal account
- Certified Customs Agent (CAD) authorization
- Bank integration for e-Payment

---

## Phase 4: Testing

### 4.1 Test Cases

- [ ] DDI threshold calculation (12M GNF)
- [ ] HS code validation (8-10 digits)
- [ ] DI submission workflow
- [ ] Payment processing
- [ ] CDC document generation
- [ ] Bon de sortie retrieval

---

## Related Documentation

- **CDC Processing Guide**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_GUINEA_CDC_CUSTOMS_PROCESSING.md`
- **Logistics Workflow**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md`
- **Implementation Plan**: `/docs/implementation/implementation-plans/01700_LOGISTICS_DATA_CAPTURE_IMPLEMENTATION.md`

---

*Document Version: 1.0.0*  
*Created: 2026-02-17*  
*Author: Construct AI Development Team*