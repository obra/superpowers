# Guinea CDC (Customs Declaration) Processing

## Overview

This document defines the extension to the Logistics (01700) workflow for processing CDC (Déclaration en Détail en Douane) customs declarations for imports into Guinea. CDC is the mandatory detailed customs declaration form required for all imported goods entering Guinea.

**Status**: 📋 Planning Complete  
**Version**: 1.0.0  
**Created**: 2026-02-17  
**Country Code**: GN (Guinea)  
**Customs Portal**: GUCE (Guichet Unique du Commerce Extérieur) at guceg.gov.gn

---

## CDC Overview

### What is CDC?

**CDC (Déclaration en Détail en Douane)** is the detailed written customs declaration mandatory for all imports into Guinea. The declaration is managed through the **GUCE (Guichet Unique du Commerce Extérieur de Guinée)** online portal.

### Key Characteristics

| Characteristic | Requirement |
|----------------|-------------|
| **Mandatory** | All imported goods require CDC |
| **Electronic Submission** | Via GUCE portal through approved CAD (Customs Agents) |
| **Pre-Clearance** | Must be submitted before goods arrival |
| **Duty-Free Goods** | Still require CDC declaration |
| **Verbal Declarations** | Only for minor traveler items without commercial value |

### Regulatory Framework

- **Customs Code**: Guinea Customs Code (updated 2015+)
- **HS Standard**: WCO 6-digit base with Guinea 8-10 digit national extensions
- **Regional**: ECOWAS Common External Tariff (CET) alignment
- **Portal**: GUCE at guceg.gov.gn or www.guichetunique.org

---

## GUCE Portal Workflow

### Registration Process

```
1. Submit written account request to GUCEG
2. Receive approval with login credentials via email/mail
3. First login: mandatory password change
4. Access portal at guceg.gov.gn
5. View available procedures based on user profile
```

### Clearance Steps

#### Step 1: Pre-Arrival (DI Submission)
```
Action: Submit Déclaration d'Intention d'Importation (DI)
Portal: Initier/Envoyer
Required Documents:
  - BESC (Bordereau Electronique de Suivi des Cargaisons)
  - Commercial Invoice
  - Transport Documents
  - CIVIO (for vehicles)
Approvals: MINCOMMERCE/SGS validation
```

#### Step 2: Value Verification & Payment
```
Action: Use simulator for duties/taxes calculation
Portal: e-Payment validation
Payment: Electronic bank transfer to Central Bank
Output: Quittance (receipt) after validation
```

#### Step 3: Declaration & Inspection
```
Action: File CDC via CAD (Certified Customs Agent)
Portal: Dossier Virtuel de Transaction (DVT)
Process: Scan goods, request removal (enlèvement)
Output: Bon à délivrer from consignee/PAD
```

#### Step 4: Final Release
```
Action: Customs validation
Portal: Validation Douane
Output: Bon de sortie (exit permit)
Tracking: Dossier number/state (en cours, clos)
Notifications: Status alerts and rejections
```

### Clearance Timeline

| Step | Portal Action | Typical Delay Risk |
|------|---------------|-------------------|
| DI Submission | Initier/Envoyer | Missing BESC |
| Payment | e-Payment validation | Bank non-validation |
| Enlèvement | Bon à délivrer | Incomplete scan reports |
| Sortie | Validation Douane | Unpaid fees |

---

## DDI Requirements

### Demande Déscriptive d'Importation (DDI)

**Threshold**: Required for imports over **12 million GNF** (~USD 1,250)

**Issuing Authority**: Ministry of Commerce

**Purpose**: Formal import authorization

### DDI Application Process

```
1. Submit application to Ministry of Commerce
2. Provide commercial invoice and supplier details
3. Specify goods description and HS codes
4. Declare import value in GNF
5. Receive DDI authorization document
```

---

## Required Data for CDC

### Standard Documents

| Document | Purpose | Required |
|----------|---------|----------|
| Commercial Invoice | Value verification | ✅ Always |
| Bill of Lading | Transport proof | ✅ Always |
| Packing List | Goods details | ✅ Always |
| Certificate of Origin | Origin verification | ✅ For preferential rates |
| DDI Authorization | Import approval | ✅ Values >12M GNF |

### Additional CDC Data Fields

#### Goods Description Data
```json
{
  "goods_details": {
    "description": "string (detailed product description)",
    "quantity": "number",
    "unit_value": "number (in GNF or foreign currency)",
    "total_value": "number",
    "hs_code": "string (8-10 digits Guinea tariff)",
    "origin_country": "string (ISO 3166-1 alpha-2)",
    "gross_weight": "number (kg)",
    "net_weight": "number (kg)"
  }
}
```

#### Importer/Exporter Data
```json
{
  "importer": {
    "name": "string",
    "address": "string (full address in Guinea)",
    "tax_id": "string (NIF - Numéro d'Identification Fiscale)",
    "contact_person": "string",
    "phone": "string",
    "email": "string"
  },
  "exporter": {
    "name": "string",
    "address": "string (full address)",
    "country": "string (ISO 3166-1 alpha-2)",
    "contact_person": "string"
  }
}
```

#### Transport Data
```json
{
  "transport": {
    "mode": "string (sea/air/road/rail)",
    "vehicle_id": "string (vessel name/flight number/truck plate)",
    "port_of_loading": "string (UN/LOCODE)",
    "port_of_discharge": "string (UN/LOCODE - Conakry: GNCKY)",
    "arrival_date": "date",
    "manifest_number": "string"
  }
}
```

#### Supporting Documents
```json
{
  "supporting_documents": [
    {
      "type": "value_proof",
      "description": "Bank transfer proof or payment evidence",
      "required": true
    },
    {
      "type": "license",
      "description": "Import license for restricted goods",
      "required": "conditional"
    },
    {
      "type": "permit",
      "description": "Special permit (medicines, mining products, firearms)",
      "required": "conditional"
    },
    {
      "type": "certificate",
      "description": "Quality/health certificates",
      "required": "conditional"
    }
  ]
}
```

---

## HS Code Requirements

### HS Code Structure for Guinea

```
Base: 6 digits (WCO Harmonized System)
National Extension: 8-10 digits (Guinea tariff schedule)
Format: XXXXXX.XX.XX
```

### HS Code Validation

#### Validation Steps
```
1. Start with 6-digit WCO HS base
2. Append Guinea's 8-10 digit national tariff subheadings
3. Verify against Customs Code (post-2015)
4. Check ECOWAS CET alignment for reduced rates
5. Use GUCE simulator for duty calculation
6. Submit test declaration via CAD for pre-approval
```

#### Validation Tools

| Tool | Purpose | Access |
|------|---------|--------|
| **GUCE Simulator** | Interactive duty check | Login at guceg.gov.gn |
| **DGD Tariff PDFs** | Static nomenclature | dgd.gov.gn/texte |
| **WCO Trade Tools** | Official HS standards | wcotradetools.org |
| **FindHS.Codes** | Quick product search | findhs.codes |
| **Customs Agents** | Binding confirmation | Mandatory for clearance |

### Common HS Code Errors

| Error Type | Example | Consequence |
|------------|---------|-------------|
| **Misclassification** | Guitar as toy (9207 vs 9503) | Higher duties/fines |
| **Outdated HS** | Pre-update codes | Rejection/delay |
| **Vague Description** | "Parts" without specs | Query/rework |
| **Incomplete Details** | Missing 8-10 digit extension | Simulator errors |

---

## CDC Processing Workflow Extension

### Integration with Logistics Workflow

The CDC processing extends the **Stage 4: Customs Clearance** of the Logistics workflow:

```
Standard Customs Clearance (Stage 4)
        ↓
Guinea-Specific CDC Processing
        ↓
┌─────────────────────────────────────────────────────────────┐
│                    CDC PROCESSING STAGES                     │
├─────────────────────────────────────────────────────────────┤
│ Stage 4a: DDI Authorization (if value >12M GNF)             │
│ Stage 4b: DI Submission (Pre-Arrival)                       │
│ Stage 4c: Value Verification & Payment                      │
│ Stage 4d: CDC Declaration Filing                            │
│ Stage 4e: Inspection & Enlèvement                           │
│ Stage 4f: Final Release (Bon de Sortie)                     │
└─────────────────────────────────────────────────────────────┘
```

### CDC Processing Stages

#### Stage 4a: DDI Authorization
**Trigger**: Order value > 12,000,000 GNF (~USD 1,250)

**Actions**:
1. Calculate order value in GNF
2. Submit DDI application to Ministry of Commerce
3. Provide commercial invoice and supplier details
4. Receive DDI authorization document

**Required Data**:
- Order value in GNF
- Commercial invoice
- Supplier details
- Goods description with HS codes

**Output**: DDI Authorization Document

#### Stage 4b: DI Submission (Pre-Arrival)
**Trigger**: Shipment departed from origin

**Actions**:
1. Submit Déclaration d'Intention d'Importation (DI)
2. Upload BESC, invoice, transport documents
3. Obtain MINCOMMERCE/SGS approvals
4. For vehicles: Obtain CIVIO

**Required Data**:
- BESC (Bordereau Electronique de Suivi des Cargaisons)
- Commercial invoice
- Bill of lading
- Transport documents
- HS codes for all items

**Output**: DI Approval

#### Stage 4c: Value Verification & Payment
**Trigger**: DI approved

**Actions**:
1. Use GUCE simulator for duty calculation
2. Verify HS codes and duty rates
3. Calculate total duties and taxes
4. Process electronic payment via bank
5. Obtain quittance (receipt)

**Required Data**:
- HS codes (8-10 digits)
- Goods value
- Origin country
- ECOWAS CET eligibility

**Output**: Quittance (Payment Receipt)

#### Stage 4d: CDC Declaration Filing
**Trigger**: Payment confirmed

**Actions**:
1. File CDC via Certified Customs Agent (CAD)
2. Submit detailed goods declaration
3. Provide all supporting documents
4. Enter DVT (Dossier Virtuel de Transaction)

**Required Data**:
- Complete goods description
- Importer/exporter details
- Transport information
- Supporting documents
- HS codes (validated)

**Output**: CDC Registration Number

#### Stage 4e: Inspection & Enlèvement
**Trigger**: CDC filed

**Actions**:
1. Schedule goods inspection
2. Scan goods at port/warehouse
3. Request removal (enlèvement)
4. Obtain bon à délivrer

**Required Data**:
- CDC registration number
- Goods location
- Inspection schedule

**Output**: Bon à Délivrer

#### Stage 4f: Final Release
**Trigger**: Inspection complete

**Actions**:
1. Customs validation
2. Issue bon de sortie
3. Track dossier status
4. Complete clearance

**Required Data**:
- All previous documents
- Payment confirmation
- Inspection report

**Output**: Bon de Sortie (Exit Permit)

---

## Common Pitfalls & Solutions

### Documentation Issues

| Pitfall | Impact | Solution |
|---------|--------|----------|
| **Incomplete docs** | Rejections, delays up to 8 weeks | Pre-validate all documents |
| **Missing HS codes** | Automatic rejection | Use GUCE simulator validation |
| **Wrong origin proofs** | Non-conformité status | Verify certificates |
| **Files >512KB** | Upload rejection | Compress documents |

### Account Issues

| Pitfall | Impact | Solution |
|---------|--------|----------|
| **Forgotten passwords** | Access blocked | Maintain credential records |
| **Unapproved profiles** | Cannot submit | Complete registration process |
| **Expired credentials** | Session timeout | Update credentials regularly |

### Data Entry Errors

| Pitfall | Impact | Solution |
|---------|--------|----------|
| **Wrong chassis numbers** | Compléments d'informations | Double-check all entries |
| **Unfiled manifests 48h prior** | Non-conformité | File manifests on time |
| **HS code mismatches** | Query/rework | Use validation tools |

### Communication Issues

| Pitfall | Impact | Solution |
|---------|--------|----------|
| **Poor broker communication** | Missed validations | Maintain regular contact |
| **Ignoring e-notifications** | Overlooked payments | Monitor portal regularly |
| **Late responses** | Processing delays | Respond within 24 hours |

---

## Data Capture Requirements

### Additional Fields for Guinea CDC

#### Order Header Fields
```sql
-- Add Guinea-specific fields to orders table
ALTER TABLE orders ADD COLUMN ddi_required BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN ddi_reference VARCHAR(50);
ALTER TABLE orders ADD COLUMN ddi_issue_date DATE;
ALTER TABLE orders ADD COLUMN order_value_gnf DECIMAL(15,2);
ALTER TABLE orders ADD COLUMN cdc_registration_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN guce_dossier_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN bon_de_sortie_reference VARCHAR(50);
```

#### Importer Fields
```sql
-- Add Guinea importer fields
ALTER TABLE orders ADD COLUMN importer_nif VARCHAR(20);
ALTER TABLE orders ADD COLUMN importer_address_guinea TEXT;
ALTER TABLE orders ADD COLUMN importer_phone_guinea VARCHAR(20);
```

#### Transport Fields
```sql
-- Add Guinea transport fields
ALTER TABLE orders ADD COLUMN manifest_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN manifest_filed_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN besc_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN civio_number VARCHAR(50);  -- For vehicles
```

#### HS Code Fields
```sql
-- Add Guinea HS code fields to order_items
ALTER TABLE order_items ADD COLUMN hs_code_guinea VARCHAR(10);
ALTER TABLE order_items ADD COLUMN hs_code_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN ecowas_cet_rate DECIMAL(5,2);
ALTER TABLE order_items ADD COLUMN duty_rate DECIMAL(5,2);
```

---

## Agent Responsibilities for CDC

### Customs Clearance Agent Extensions

```python
class GuineaCDCProcessor:
    """Extension to Customs Clearance Agent for Guinea CDC processing"""
    
    async def process_guinea_cdc(self, order_data: Dict) -> Dict:
        """Process CDC declaration for Guinea imports"""
        
        # Stage 4a: Check DDI requirement
        if self.requires_ddi(order_data):
            ddi_result = await self.process_ddi_authorization(order_data)
        
        # Stage 4b: Submit DI
        di_result = await self.submit_di_declaration(order_data)
        
        # Stage 4c: Value verification and payment
        payment_result = await self.process_payment(order_data)
        
        # Stage 4d: File CDC
        cdc_result = await self.file_cdc_declaration(order_data)
        
        # Stage 4e: Inspection
        inspection_result = await self.coordinate_inspection(order_data)
        
        # Stage 4f: Final release
        release_result = await self.obtain_final_release(order_data)
        
        return {
            'ddi': ddi_result,
            'di': di_result,
            'payment': payment_result,
            'cdc': cdc_result,
            'inspection': inspection_result,
            'release': release_result
        }
    
    def requires_ddi(self, order_data: Dict) -> bool:
        """Check if DDI is required (value > 12M GNF)"""
        value_gnf = order_data.get('order_value_gnf', 0)
        return value_gnf > 12000000
    
    async def validate_hs_code_guinea(self, hs_code: str) -> Dict:
        """Validate HS code for Guinea customs"""
        
        # Check 8-10 digit format
        if len(hs_code) < 8:
            return {'valid': False, 'error': 'HS code must be 8-10 digits'}
        
        # Validate against GUCE simulator
        validation = await self.query_guce_simulator(hs_code)
        
        return validation
```

---

## Implementation Checklist

### Phase 1: Data Capture
- [ ] Add Guinea-specific database fields
- [ ] Update order forms for CDC data
- [ ] Add HS code validation for Guinea
- [ ] Create DDI requirement check

### Phase 2: GUCE Integration
- [ ] Register GUCE portal account
- [ ] Implement DI submission API
- [ ] Implement payment processing
- [ ] Implement CDC filing

### Phase 3: Agent Updates
- [ ] Extend Customs Clearance Agent for CDC
- [ ] Add HS code validation logic
- [ ] Add DDI processing workflow
- [ ] Add inspection coordination

### Phase 4: Testing
- [ ] Test with mock Guinea data
- [ ] Validate HS code processing
- [ ] Test GUCE portal integration
- [ ] Verify document generation

---

## Related Documentation

- **Logistics Framework**: `/docs/logistics/01700_LOGISTICS_SETUP_COMPLETE.md`
- **Workflow Configuration**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md`
- **Customs Clearance Agent**: `/deep-agents/deep_agents/agents/pages/01700-logistics/main_agents/a_customs_clearance_agent.py`
- **Procurement Integration**: `/docs/logistics/01700_PROCUREMENT_DATA_CAPTURE_ANALYSIS.md`

---

## External Resources

- **GUCE Portal**: https://guceg.gov.gn
- **DGD (Direction Générale des Douanes)**: https://dgd.gov.gn
- **WCO Trade Tools**: https://wcotradetools.org
- **FindHS.Codes**: https://findhs.codes
- **ECOWAS CET**: ECOWAS Common External Tariff documentation

---

*Document Version: 1.0.0*  
*Created: 2026-02-17*  
*Author: Construct AI Development Team*