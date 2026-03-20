# Logistics Data Capture Implementation Plan

## Overview

This implementation plan defines the steps required to add logistics-relevant data capture fields to the Procurement (01900) workflow, enabling seamless integration with the Logistics (01700) framework.

**Status**: 📋 Planning Complete, Implementation Pending  
**Version**: 1.0.0  
**Created**: 2026-02-17  
**Priority**: High

---

## Implementation Summary

### Objective
Enhance the Procurement (01900) workflow to capture all logistics-relevant data fields required for seamless handoff to the Logistics (01700) framework when orders are signed.

### Scope
- Database schema updates
- Form field additions
- Agent integration updates
- API endpoint modifications
- Frontend component updates

### Timeline
- **Phase 1 (Priority 1)**: 2-3 days
- **Phase 2 (Priority 2)**: 3-5 days
- **Phase 3 (Priority 3)**: 1-2 days
- **Total Estimated**: 6-10 days

---

## Phase 1: Critical Fields (Priority 1)

### 1.1 Database Schema Updates

```sql
-- Migration: Add logistics fields to orders table
-- File: database/migrations/add_logistics_fields_priority1.sql

-- Add supplier country code
ALTER TABLE orders ADD COLUMN supplier_country VARCHAR(2);
COMMENT ON COLUMN orders.supplier_country IS 'ISO 3166-1 alpha-2 country code for supplier location';

-- Add delivery country code
ALTER TABLE orders ADD COLUMN delivery_country VARCHAR(2);
COMMENT ON COLUMN orders.delivery_country IS 'ISO 3166-1 alpha-2 country code for delivery destination';

-- Add required delivery date
ALTER TABLE orders ADD COLUMN required_delivery_date DATE;
COMMENT ON COLUMN orders.required_delivery_date IS 'Target delivery date for logistics planning';

-- Add transaction currency
ALTER TABLE orders ADD COLUMN transaction_currency VARCHAR(3) DEFAULT 'ZAR';
COMMENT ON COLUMN orders.transaction_currency IS 'ISO 4217 currency code for order value';

-- Add hazardous materials flag
ALTER TABLE orders ADD COLUMN hazardous_materials BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN orders.hazardous_materials IS 'Flag indicating if order contains hazardous materials';

-- Create indexes for logistics queries
CREATE INDEX idx_orders_supplier_country ON orders(supplier_country);
CREATE INDEX idx_orders_delivery_country ON orders(delivery_country);
CREATE INDEX idx_orders_hazardous ON orders(hazardous_materials);
```

### 1.2 Form Field Additions

#### Purchase Order Request Form
**File**: `docs/pages-forms-templates/01900_procurement/html/01900_purchase_order_request_form.html`

Add the following fields:
```html
<!-- Supplier Country Field -->
<div class="form-group">
    <label for="supplierCountry">Supplier Country *</label>
    <select id="supplierCountry" name="supplierCountry" required>
        <option value="">Select Country</option>
        <!-- ISO 3166-1 alpha-2 country codes -->
        <option value="ZA">South Africa</option>
        <option value="CN">China</option>
        <option value="US">United States</option>
        <option value="DE">Germany</option>
        <!-- ... more countries -->
    </select>
</div>

<!-- Delivery Country Field -->
<div class="form-group">
    <label for="deliveryCountry">Delivery Country *</label>
    <select id="deliveryCountry" name="deliveryCountry" required>
        <option value="">Select Country</option>
        <!-- ISO 3166-1 alpha-2 country codes -->
        <option value="ZA">South Africa</option>
        <!-- ... more countries -->
    </select>
</div>

<!-- Required Delivery Date -->
<div class="form-group">
    <label for="requiredDeliveryDate">Required Delivery Date *</label>
    <input type="date" id="requiredDeliveryDate" name="requiredDeliveryDate" required>
</div>

<!-- Transaction Currency -->
<div class="form-group">
    <label for="transactionCurrency">Currency *</label>
    <select id="transactionCurrency" name="transactionCurrency" required>
        <option value="ZAR">ZAR - South African Rand</option>
        <option value="USD">USD - US Dollar</option>
        <option value="EUR">EUR - Euro</option>
        <option value="GBP">GBP - British Pound</option>
        <option value="CNY">CNY - Chinese Yuan</option>
    </select>
</div>

<!-- Hazardous Materials Flag -->
<div class="form-group">
    <label for="hazardousMaterials">
        <input type="checkbox" id="hazardousMaterials" name="hazardousMaterials">
        This order contains hazardous materials
    </label>
</div>
```

### 1.3 API Endpoint Updates

**File**: `server/src/routes/orders.js`

```javascript
// Add logistics fields to order creation validation
const orderSchema = Joi.object({
    // ... existing fields
    supplier_country: Joi.string().length(2).required(),
    delivery_country: Joi.string().length(2).required(),
    required_delivery_date: Joi.date().min('now').required(),
    transaction_currency: Joi.string().length(3).default('ZAR'),
    hazardous_materials: Joi.boolean().default(false)
});

// Add logistics fields to order response
const formatOrderResponse = (order) => ({
    // ... existing fields
    supplier_country: order.supplier_country,
    delivery_country: order.delivery_country,
    required_delivery_date: order.required_delivery_date,
    transaction_currency: order.transaction_currency,
    hazardous_materials: order.hazardous_materials
});
```

### 1.4 Agent Integration Updates

#### Requirement Extraction Agent
**File**: `deep-agents/deep_agents/agents/pages/01900-procurement/main_agents/01900_requirement_extraction_agent.py`

```python
async def extract_logistics_data(self, procurement_data: Dict) -> Dict:
    """Extract logistics-relevant data from procurement specifications"""
    
    logistics_data = {
        'supplier_country': await self.extract_supplier_country(procurement_data),
        'delivery_country': await self.extract_delivery_country(procurement_data),
        'hazardous_materials': await self.detect_hazardous_materials(procurement_data),
        'required_delivery_date': procurement_data.get('required_delivery_date'),
        'currency': procurement_data.get('transaction_currency', 'ZAR')
    }
    
    return logistics_data

async def extract_supplier_country(self, data: Dict) -> str:
    """Extract supplier country from supplier database or order data"""
    supplier_id = data.get('supplier_id')
    if supplier_id:
        supplier = await self.db.get_supplier(supplier_id)
        return supplier.get('country_code', 'ZA')
    return data.get('supplier_country', 'ZA')

async def detect_hazardous_materials(self, data: Dict) -> bool:
    """Detect hazardous materials from SDS appendix or product specs"""
    items = data.get('items', [])
    for item in items:
        if item.get('hazardous') or item.get('un_number'):
            return True
    # Check SDS appendix
    if data.get('appendix_b_sds'):
        return True
    return False
```

#### Quality Assurance Agent
**File**: `deep-agents/deep_agents/agents/pages/01900-procurement/main_agents/01900_quality_assurance_agent.py`

```python
async def validate_logistics_data(self, order_data: Dict) -> Dict:
    """Validate completeness of logistics data fields"""
    
    validation_result = {
        'valid': True,
        'missing_fields': [],
        'warnings': []
    }
    
    # Check critical fields
    critical_fields = ['supplier_country', 'delivery_country', 'required_delivery_date', 'transaction_currency']
    for field in critical_fields:
        if not order_data.get(field):
            validation_result['missing_fields'].append(field)
            validation_result['valid'] = False
    
    # Check for international shipment
    if order_data.get('supplier_country') != order_data.get('delivery_country'):
        validation_result['is_international'] = True
        validation_result['warnings'].append('International shipment requires additional logistics data')
    
    # Check hazardous materials
    if order_data.get('hazardous_materials'):
        validation_result['warnings'].append('Hazardous materials require special handling and documentation')
    
    return validation_result
```

---

## Phase 2: International Logistics Fields (Priority 2)

### 2.1 Database Schema Updates

```sql
-- Migration: Add international logistics fields
-- File: database/migrations/add_logistics_fields_priority2.sql

-- Add port of loading
ALTER TABLE orders ADD COLUMN port_of_loading VARCHAR(5);
COMMENT ON COLUMN orders.port_of_loading IS 'UN/LOCODE port code for loading';

-- Add port of discharge
ALTER TABLE orders ADD COLUMN port_of_discharge VARCHAR(5);
COMMENT ON COLUMN orders.port_of_discharge IS 'UN/LOCODE port code for discharge';

-- Add preferred shipping mode
ALTER TABLE orders ADD COLUMN preferred_shipping_mode VARCHAR(10);
COMMENT ON COLUMN orders.preferred_shipping_mode IS 'Preferred shipping mode: sea/air/road/rail';

-- Add insurance required flag
ALTER TABLE orders ADD COLUMN insurance_required BOOLEAN;
COMMENT ON COLUMN orders.insurance_required IS 'Insurance required for shipment';

-- Add customs broker
ALTER TABLE orders ADD COLUMN customs_broker VARCHAR(255);
COMMENT ON COLUMN orders.customs_broker IS 'Assigned customs broker for clearance';

-- Add item-level logistics fields
ALTER TABLE order_items ADD COLUMN item_weight DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN item_volume DECIMAL(10,3);
ALTER TABLE order_items ADD COLUMN country_of_origin VARCHAR(2);
ALTER TABLE order_items ADD COLUMN hs_code VARCHAR(10);

COMMENT ON COLUMN order_items.item_weight IS 'Weight in kg per item';
COMMENT ON COLUMN order_items.item_volume IS 'Volume in CBM per item';
COMMENT ON COLUMN order_items.country_of_origin IS 'ISO 3166-1 alpha-2 country of origin';
COMMENT ON COLUMN order_items.hs_code IS 'Harmonized System code for customs';

-- Create indexes
CREATE INDEX idx_orders_ports ON orders(port_of_loading, port_of_discharge);
CREATE INDEX idx_order_items_origin ON order_items(country_of_origin);
```

### 2.2 Delivery Schedule Appendix Updates

**File**: `docs/pages-forms-templates/01900_procurement/html/01900_appendix_c_delivery_schedule.html`

Add the following fields:
```html
<!-- Port of Loading (for international orders) -->
<div class="form-group" id="portOfLoadingGroup" style="display: none;">
    <label for="portOfLoading">Port of Loading (for international shipments)</label>
    <select id="portOfLoading" name="portOfLoading">
        <option value="">Select Port</option>
        <option value="CNSHA">Shanghai, China</option>
        <option value="CNNGB">Ningbo, China</option>
        <option value="USLAX">Los Angeles, USA</option>
        <option value="DEHAM">Hamburg, Germany</option>
        <!-- ... more ports -->
    </select>
</div>

<!-- Port of Discharge (for international orders) -->
<div class="form-group" id="portOfDischargeGroup" style="display: none;">
    <label for="portOfDischarge">Port of Discharge (for international shipments)</label>
    <select id="portOfDischarge" name="portOfDischarge">
        <option value="">Select Port</option>
        <option value="ZADUR">Durban, South Africa</option>
        <option value="ZACPT">Cape Town, South Africa</option>
        <!-- ... more ports -->
    </select>
</div>

<!-- Preferred Shipping Mode -->
<div class="form-group">
    <label for="preferredShippingMode">Preferred Shipping Mode</label>
    <select id="preferredShippingMode" name="preferredShippingMode">
        <option value="">Auto-determine</option>
        <option value="sea">Sea Freight</option>
        <option value="air">Air Freight</option>
        <option value="road">Road Transport</option>
        <option value="rail">Rail Transport</option>
    </select>
</div>

<script>
// Show/hide port fields based on international shipment
document.getElementById('supplierCountry').addEventListener('change', updatePortFields);
document.getElementById('deliveryCountry').addEventListener('change', updatePortFields);

function updatePortFields() {
    const supplierCountry = document.getElementById('supplierCountry').value;
    const deliveryCountry = document.getElementById('deliveryCountry').value;
    const isInternational = supplierCountry !== deliveryCountry;
    
    document.getElementById('portOfLoadingGroup').style.display = isInternational ? 'block' : 'none';
    document.getElementById('portOfDischargeGroup').style.display = isInternational ? 'block' : 'none';
}
</script>
```

### 2.3 Order Line Items Updates

Add logistics fields to each order line item:
```html
<!-- Item Weight -->
<div class="form-group">
    <label for="itemWeight">Weight (kg)</label>
    <input type="number" id="itemWeight" name="itemWeight" step="0.01" min="0">
</div>

<!-- Item Volume -->
<div class="form-group">
    <label for="itemVolume">Volume (CBM)</label>
    <input type="number" id="itemVolume" name="itemVolume" step="0.001" min="0">
</div>

<!-- Country of Origin -->
<div class="form-group">
    <label for="countryOfOrigin">Country of Origin</label>
    <select id="countryOfOrigin" name="countryOfOrigin">
        <option value="">Select Country</option>
        <!-- ISO country codes -->
    </select>
</div>

<!-- HS Code -->
<div class="form-group">
    <label for="hsCode">HS Code</label>
    <input type="text" id="hsCode" name="hsCode" pattern="[0-9]{4,10}" 
           placeholder="Enter 4-10 digit HS code">
</div>
```

---

## Phase 3: Enhancement Fields (Priority 3)

### 3.1 Database Schema Updates

```sql
-- Migration: Add enhancement fields
-- File: database/migrations/add_logistics_fields_priority3.sql

-- Add import permit reference
ALTER TABLE orders ADD COLUMN import_permit_reference VARCHAR(100);
COMMENT ON COLUMN orders.import_permit_reference IS 'Import permit reference for restricted goods';

-- Add export license reference
ALTER TABLE orders ADD COLUMN export_license_reference VARCHAR(100);
COMMENT ON COLUMN orders.export_license_reference IS 'Export license reference for controlled goods';

-- Add preferred carrier
ALTER TABLE orders ADD COLUMN preferred_carrier VARCHAR(255);
COMMENT ON COLUMN orders.preferred_carrier IS 'Preferred shipping carrier';
```

### 3.2 Compliance Validation Agent Updates

**File**: `deep-agents/deep_agents/agents/pages/01900-procurement/main_agents/01900_compliance_validation_agent.py`

```python
async def validate_logistics_compliance(self, order_data: Dict) -> Dict:
    """Validate logistics compliance requirements"""
    
    compliance_result = {
        'compliant': True,
        'requirements': [],
        'restrictions': [],
        'permits_required': []
    }
    
    supplier_country = order_data.get('supplier_country')
    delivery_country = order_data.get('delivery_country')
    
    # Check sanctions
    if await self.check_sanctions(supplier_country):
        compliance_result['restrictions'].append({
            'type': 'sanctions',
            'country': supplier_country,
            'message': f'Supplier country {supplier_country} is subject to sanctions'
        })
        compliance_result['compliant'] = False
    
    # Check import restrictions
    restrictions = await self.check_import_restrictions(supplier_country, delivery_country)
    compliance_result['restrictions'].extend(restrictions)
    
    # Check required permits
    if order_data.get('hazardous_materials'):
        compliance_result['permits_required'].append({
            'type': 'import_permit',
            'reason': 'Hazardous materials require import permit'
        })
    
    # Check export controls
    for item in order_data.get('items', []):
        if await self.check_export_control(item.get('hs_code')):
            compliance_result['permits_required'].append({
                'type': 'export_license',
                'hs_code': item.get('hs_code'),
                'reason': 'Item subject to export controls'
            })
    
    return compliance_result
```

---

## Testing Plan

### Unit Tests

```python
# tests/test_logistics_data_capture.py

import pytest
from deep_agents.agents.pages.procurement import RequirementExtractionAgent

class TestLogisticsDataCapture:
    
    @pytest.mark.asyncio
    async def test_extract_supplier_country(self):
        """Test supplier country extraction"""
        agent = RequirementExtractionAgent()
        data = {'supplier_id': 'SUP001', 'supplier_country': 'CN'}
        result = await agent.extract_supplier_country(data)
        assert result == 'CN'
    
    @pytest.mark.asyncio
    async def test_detect_hazardous_materials(self):
        """Test hazardous materials detection"""
        agent = RequirementExtractionAgent()
        data = {'items': [{'hazardous': True}]}
        result = await agent.detect_hazardous_materials(data)
        assert result == True
    
    @pytest.mark.asyncio
    async def test_validate_logistics_data_completeness(self):
        """Test logistics data validation"""
        agent = QualityAssuranceAgent()
        data = {
            'supplier_country': 'CN',
            'delivery_country': 'ZA',
            'required_delivery_date': '2026-03-01',
            'transaction_currency': 'ZAR'
        }
        result = await agent.validate_logistics_data(data)
        assert result['valid'] == True
```

### Integration Tests

```javascript
// tests/integration/logistics_handoff.test.js

describe('Logistics Data Handoff', () => {
    
    test('should include all required fields in order_signed event', async () => {
        const order = await createOrder({
            supplier_country: 'CN',
            delivery_country: 'ZA',
            required_delivery_date: '2026-03-01',
            transaction_currency: 'USD',
            hazardous_materials: false
        });
        
        const handoffData = await prepareLogisticsHandoff(order.id);
        
        expect(handoffData).toHaveProperty('order_data.order_id');
        expect(handoffData).toHaveProperty('supplier_data.supplier_country', 'CN');
        expect(handoffData).toHaveProperty('delivery_data.delivery_country', 'ZA');
    });
    
    test('should trigger logistics workflow on order_signed', async () => {
        const order = await createAndSignOrder({
            supplier_country: 'CN',
            delivery_country: 'ZA'
        });
        
        const logisticsWorkflow = await getLogisticsWorkflow(order.id);
        expect(logisticsWorkflow).toBeDefined();
        expect(logisticsWorkflow.status).toBe('initiated');
    });
});
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Review and approve database migration scripts
- [ ] Test migrations on staging database
- [ ] Update API documentation
- [ ] Update frontend components
- [ ] Run unit and integration tests
- [ ] Perform security review

### Deployment Steps
1. [ ] Deploy database migrations (Priority 1)
2. [ ] Deploy API endpoint updates
3. [ ] Deploy frontend form updates
4. [ ] Deploy agent integration updates
5. [ ] Verify data capture functionality
6. [ ] Deploy database migrations (Priority 2)
7. [ ] Deploy international logistics features
8. [ ] Deploy database migrations (Priority 3)
9. [ ] Deploy enhancement features

### Post-Deployment
- [ ] Verify data capture in production
- [ ] Monitor agent performance
- [ ] Validate logistics handoff triggers
- [ ] Update user documentation
- [ ] Train users on new fields

---

## Rollback Plan

### Database Rollback
```sql
-- Rollback Priority 1 fields
ALTER TABLE orders DROP COLUMN IF EXISTS supplier_country;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_country;
ALTER TABLE orders DROP COLUMN IF EXISTS required_delivery_date;
ALTER TABLE orders DROP COLUMN IF EXISTS transaction_currency;
ALTER TABLE orders DROP COLUMN IF EXISTS hazardous_materials;

-- Rollback Priority 2 fields
ALTER TABLE orders DROP COLUMN IF EXISTS port_of_loading;
ALTER TABLE orders DROP COLUMN IF EXISTS port_of_discharge;
ALTER TABLE orders DROP COLUMN IF EXISTS preferred_shipping_mode;
ALTER TABLE orders DROP COLUMN IF EXISTS insurance_required;
ALTER TABLE orders DROP COLUMN IF EXISTS customs_broker;
ALTER TABLE order_items DROP COLUMN IF EXISTS item_weight;
ALTER TABLE order_items DROP COLUMN IF EXISTS item_volume;
ALTER TABLE order_items DROP COLUMN IF EXISTS country_of_origin;
ALTER TABLE order_items DROP COLUMN IF EXISTS hs_code;

-- Rollback Priority 3 fields
ALTER TABLE orders DROP COLUMN IF EXISTS import_permit_reference;
ALTER TABLE orders DROP COLUMN IF EXISTS export_license_reference;
ALTER TABLE orders DROP COLUMN IF EXISTS preferred_carrier;
```

---

## Success Criteria

### Phase 1 Success Metrics
- [ ] All orders capture supplier_country and delivery_country
- [ ] Required delivery date captured for all orders
- [ ] Currency field populated for all orders
- [ ] Hazardous materials flag correctly set
- [ ] Logistics handoff data passes validation

### Phase 2 Success Metrics
- [ ] International orders capture port information
- [ ] Item-level weight and volume calculated
- [ ] Country of origin captured per item
- [ ] HS codes validated against customs database

### Phase 3 Success Metrics
- [ ] Permit requirements automatically identified
- [ ] Export controls checked for all items
- [ ] Carrier preferences captured

---

## Related Documentation

- **Logistics Framework**: `/docs/logistics/01700_LOGISTICS_SETUP_COMPLETE.md`
- **Data Capture Analysis**: `/docs/logistics/01700_PROCUREMENT_DATA_CAPTURE_ANALYSIS.md`
- **Procurement Workflow**: `/docs/workflows/01900_PROCUREMENT_COMPREHENSIVE_WORKFLOW/01900_PROCUREMENT_WORKFLOW_CONFIGURATION.md`
- **Logistics Workflow**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md`
- **Agents Registry**: `/docs/agents/0000_AGENTS_REGISTRY.md`

---

*Document Version: 1.0.0*  
*Created: 2026-02-17*  
*Author: Construct AI Development Team*