# Logistics Data Capture Analysis: Procurement (01900) → Logistics (01700)

## Executive Summary

This analysis evaluates whether the Procurement (01900) workflow captures sufficient logistics-relevant data to support the Logistics (01700) framework. The assessment identifies **captured data**, **partial captures**, and **data gaps** that need to be addressed for seamless integration.

**Overall Assessment**: ⚠️ **PARTIALLY SUFFICIENT** - Core logistics data is captured, but several critical fields require enhancement.

---

## Data Capture Assessment

### ✅ SUFFICIENTLY CAPTURED DATA

The following logistics-relevant data is well-captured in the Procurement workflow:

| Data Field | Source Document | Capture Quality |
|------------|-----------------|-----------------|
| **INCOTERMS** | Appendix C: Delivery Schedule | ✅ Explicit field `[INCOTERMS-CODE]` |
| **Delivery Location** | Appendix C: Delivery Schedule | ✅ Explicit field `[DELIVERY-LOCATION]` |
| **Risk Transfer Timing** | Appendix C: Delivery Schedule | ✅ Explicit field `[RISK-TRANSFER-TIMING]` |
| **Delivery Schedule** | Appendix C: Delivery Schedule | ✅ Monthly/weekly patterns defined |
| **Gross/Net Weight** | Appendix F: Packing Specification | ✅ Captured per item |
| **Hazardous Materials Classification** | Appendix B: Safety Data Sheets | ✅ GHS classification captured |
| **UN Number** | Appendix F: Packing Specification | ✅ For dangerous goods |
| **Packing Group** | Appendix F: Packing Specification | ✅ For dangerous goods |
| **HS Codes** | Appendix E: Logistics Documents | ✅ Referenced for customs |
| **Country of Origin** | Appendix E: Logistics Documents | ✅ Certificate of origin requirements |
| **Supplier Details** | Various templates | ✅ Name, contact information |
| **Product Descriptions** | Appendix A: Product Specifications | ✅ Detailed specifications |
| **Batch Numbers** | Appendix F: Packing Specification | ✅ Traceability requirements |
| **Special Handling Instructions** | Appendix B: Safety Data Sheets | ✅ Handling procedures |

### ⚠️ PARTIALLY CAPTURED DATA

The following data is captured but may require standardization or enhancement:

| Data Field | Current State | Recommendation |
|------------|---------------|----------------|
| **Supplier Country** | Captured in supplier details but not standardized | Add explicit `supplier_country` field with ISO country code |
| **Item Weight** | Captured in packing specs but not in core order | Add `item_weight` and `item_volume` to order line items |
| **Item Volume** | Captured in packing specs (CBM) | Add to order line items for shipping calculations |
| **Hazardous Flag** | Captured in SDS appendix | Add boolean `hazardous_materials` flag to order header |
| **Delivery Requirements** | Captured in delivery schedule | Standardize into structured fields |
| **Transportation Mode** | Implicit in Incoterms | Add explicit `preferred_shipping_mode` field |

### ❌ MISSING DATA GAPS

The following critical logistics data is NOT currently captured:

| Missing Field | Impact on Logistics | Recommendation |
|---------------|---------------------|----------------|
| **Supplier Address (Full)** | Cannot generate B/L without complete address | Add full supplier address fields |
| **Supplier Country Code** | Cannot determine customs requirements | Add ISO country code field |
| **Port of Loading** | Required for international shipping | Add `port_of_loading` field for international orders |
| **Port of Discharge** | Required for international shipping | Add `port_of_discharge` field |
| **Final Destination (if different)** | Required for multi-leg shipments | Add `final_destination` field |
| **Insurance Requirements** | Required for CIF/CIP shipments | Add `insurance_required` boolean |
| **Currency** | Required for customs valuation | Add `transaction_currency` field |
| **Total Order Value** | Required for customs declaration | Ensure `total_value` is captured |
| **Preferred Carrier** | For routing optimization | Add `preferred_carrier` optional field |
| **Delivery Deadline** | For priority routing | Add `required_delivery_date` field |
| **Customs Broker** | For clearance coordination | Add `customs_broker` optional field |
| **Import Permit Number** | For restricted goods | Add `import_permit_reference` field |
| **Export License** | For controlled goods | Add `export_license_reference` field |

---

## Template Analysis

### Procurement Templates with Logistics Data

#### 1. Appendix C: Delivery Schedule (`01900_appendix_c_delivery_schedule.html`)
**Logistics-Relevant Fields:**
- INCOTERMS code
- Delivery Point
- Risk Transfer timing
- Monthly delivery quantities
- Weekly delivery patterns
- Transportation requirements
- Temperature controlled compartments
- Driver requirements (hazmat training)

**Coverage**: ~60% of logistics requirements

#### 2. Appendix E: Logistics Documents Specification (`01900_appendix_e_logistics_documents_specification.html`)
**Logistics-Relevant Fields:**
- Bill of Lading requirements
- Consignor/Consignee details
- Origin and destination addresses
- Gross weight, net weight, tare weight
- Hazardous goods classification
- Certificate of Origin requirements
- HS codes and customs classifications
- Country of origin

**Coverage**: ~70% of logistics requirements

#### 3. Appendix F: Packing and Marking Specification (`01900_appendix_f_packing_and_marking_specification.html`)
**Logistics-Relevant Fields:**
- Net quantity and gross weight
- Batch numbers and manufacturing dates
- Hazard classifications
- Dangerous goods labels
- UN certification requirements
- ISPM 15 compliance (international shipping)
- Pallet configurations

**Coverage**: ~50% of logistics requirements

---

## Data Handoff Schema: Current vs Required

### Current Data Handoff (01900 → 01700)

```json
{
  "order_data": {
    "order_id": "string",
    "order_number": "string",
    "order_date": "date",
    "order_value": "number (partial)",
    "currency": "MISSING"
  },
  "supplier_data": {
    "supplier_name": "string",
    "supplier_country": "MISSING (ISO code)",
    "supplier_address": "PARTIAL",
    "supplier_contact": "string"
  },
  "delivery_data": {
    "delivery_location": "string",
    "delivery_country": "MISSING",
    "required_delivery_date": "MISSING",
    "special_requirements": "array (partial)"
  },
  "item_data": {
    "items": "array",
    "total_weight": "PARTIAL",
    "total_volume": "MISSING",
    "hazardous_materials": "PARTIAL (in SDS only)"
  },
  "terms": {
    "incoterms": "string",
    "payment_terms": "string"
  }
}
```

### Required Data Handoff (Complete)

```json
{
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
    "port_of_loading": "string (for international)",
    "port_of_discharge": "string (for international)",
    "final_destination": "string (if different)",
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
        "country_of_origin": "string",
        "hazardous": "boolean",
        "un_number": "string (if hazardous)",
        "packing_group": "string (if hazardous)"
      }
    ],
    "total_weight": "number (kg)",
    "total_volume": "number (CBM)",
    "hazardous_materials": "boolean"
  },
  "logistics_data": {
    "incoterms": "string",
    "preferred_shipping_mode": "string (sea/air/road/rail)",
    "preferred_carrier": "string (optional)",
    "insurance_required": "boolean",
    "customs_broker": "string (optional)",
    "import_permit_reference": "string (if required)",
    "export_license_reference": "string (if required)"
  },
  "terms": {
    "payment_terms": "string",
    "payment_method": "string"
  }
}
```

---

## Recommendations

### Priority 1: Critical Fields (Required for Basic Logistics)

1. **Add `supplier_country` field** to order header
   - Type: String (ISO 3166-1 alpha-2)
   - Required: Yes
   - Location: Order creation form

2. **Add `delivery_country` field** to delivery section
   - Type: String (ISO 3166-1 alpha-2)
   - Required: Yes
   - Location: Delivery schedule appendix

3. **Add `required_delivery_date` field**
   - Type: Date
   - Required: Yes
   - Location: Order header

4. **Add `currency` field**
   - Type: String (ISO 4217)
   - Required: Yes
   - Location: Order header

5. **Add `hazardous_materials` flag** to order header
   - Type: Boolean
   - Required: Yes
   - Auto-populated from SDS appendix

### Priority 2: Important Fields (Required for International Logistics)

6. **Add `port_of_loading` field**
   - Type: String (UN/LOCODE)
   - Required: For international orders
   - Location: Delivery schedule appendix

7. **Add `port_of_discharge` field**
   - Type: String (UN/LOCODE)
   - Required: For international orders
   - Location: Delivery schedule appendix

8. **Add `item_weight` and `item_volume`** to line items
   - Type: Number
   - Required: Yes
   - Location: Order line items

9. **Add `country_of_origin`** to line items
   - Type: String (ISO 3166-1 alpha-2)
   - Required: For customs
   - Location: Order line items

### Priority 3: Enhancement Fields (Optimization)

10. **Add `preferred_shipping_mode` field**
    - Type: Enum (sea/air/road/rail)
    - Required: No
    - Default: Auto-determined by agent

11. **Add `insurance_required` field**
    - Type: Boolean
    - Required: No
    - Auto-determined from Incoterms

12. **Add `customs_broker` field**
    - Type: String
    - Required: No
    - For pre-assigned broker relationships

---

## Implementation Plan

### Phase 1: Database Schema Updates

```sql
-- Add logistics fields to orders table
ALTER TABLE orders ADD COLUMN supplier_country VARCHAR(2);
ALTER TABLE orders ADD COLUMN delivery_country VARCHAR(2);
ALTER TABLE orders ADD COLUMN required_delivery_date DATE;
ALTER TABLE orders ADD COLUMN transaction_currency VARCHAR(3);
ALTER TABLE orders ADD COLUMN hazardous_materials BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN preferred_shipping_mode VARCHAR(10);
ALTER TABLE orders ADD COLUMN insurance_required BOOLEAN;
ALTER TABLE orders ADD COLUMN customs_broker VARCHAR(255);

-- Add logistics fields to order_items table
ALTER TABLE order_items ADD COLUMN item_weight DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN item_volume DECIMAL(10,3);
ALTER TABLE order_items ADD COLUMN country_of_origin VARCHAR(2);
ALTER TABLE order_items ADD COLUMN hs_code VARCHAR(10);
```

### Phase 2: Form Updates

Update the following procurement forms to capture logistics data:
1. Purchase Order Request Form - Add supplier country, delivery country, required date
2. Delivery Schedule Appendix - Add ports, shipping mode preferences
3. Order Line Items - Add weight, volume, origin country per item

### Phase 3: Agent Integration

Update the Procurement agents to:
1. Extract and validate supplier country from supplier database
2. Auto-populate hazardous materials flag from SDS analysis
3. Calculate total weight/volume from line items
4. Determine shipping mode based on Incoterms and delivery requirements

---

## Conclusion

**Current State**: The Procurement (01900) workflow captures approximately **60-70%** of the logistics data required for the Logistics (01700) framework. The existing templates (Delivery Schedule, Logistics Documents Specification, Packing Specification) contain most of the necessary information but are not structured for seamless data handoff.

**Key Gaps**:
- Supplier and delivery country codes (critical for customs)
- Item-level weight and volume (critical for shipping calculations)
- Required delivery date (critical for logistics planning)
- Currency (critical for customs valuation)
- Port information (critical for international shipping)

**Recommendation**: Implement Priority 1 fields immediately to enable basic logistics functionality. Priority 2 fields should be added before enabling international logistics workflows. Priority 3 fields can be implemented as enhancements.

**Estimated Effort**:
- Priority 1: 2-3 days (database + form updates)
- Priority 2: 3-5 days (international logistics support)
- Priority 3: 1-2 days (optimization features)

---

*Document Version: 1.0.0*  
*Created: 2026-02-17*  
*Author: Construct AI Development Team*