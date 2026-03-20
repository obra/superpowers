# 01700 Logistics Workflow Strategy

## Overview

This document outlines the strategy for the Logistics Workflow (01700), including CDC (Customs Declaration), Import/Export documentation, and integration with the Procurement Workflow (01900).

## Current Implementation Status

### Testing Phase (Current)
- CDC/DDI functionality is embedded within the Procurement Input Agent Modal
- Triggered when destination country is Guinea
- Collects required fields during the procurement chat workflow:
  - Importer NIF (Numéro d'Identification Fiscale)
  - Importer Address in Guinea
  - DDI requirement detection (orders > 12 million GNF)

### Production Architecture (Target)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOGISTICS PAGE (01700)                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Main Dashboard                               │   │
│  │  • Active Shipments                                               │   │
│  │  • Pending Customs Clearance                                      │   │
│  │  • Document Status Overview                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ CDC Modal       │  │ Import/Export   │  │ Shipment Tracking       │  │
│  │                 │  │ Documentation   │  │                         │  │
│  │ • GUCE Portal   │  │                 │  │ • Real-time status      │  │
│  │ • NIF Entry     │  │ • Commercial    │  │ • Carrier integration   │  │
│  │ • CDC Filing    │  │   Invoice       │  │ • Delivery confirmation │  │
│  │ • DDI Request   │  │ • Bill of       │  │                         │  │
│  │ • Status Track  │  │   Lading        │  │                         │  │
│  └─────────────────┘  │ • Certificate   │  └─────────────────────────┘  │
│                       │   of Origin     │                               │
│                       │ • Packing List  │                               │
│                       │ • SDS           │                               │
│                       └─────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. CDC Modal (01700-CDCModal.js)

**Purpose:** Handle Guinea customs declaration requirements through GUCE portal integration.

**Features:**
- NIF (Tax ID) management
- CDC (Déclaration en Détail en Douane) filing
- DDI (Demande Déscriptive d'Importation) requests for orders > 12 million GNF
- GUCE portal API integration
- Status tracking and notifications

**Triggers:**
- Automatic: When procurement order destination = Guinea
- Manual: From logistics dashboard

**Data Flow:**
```
Procurement Order Created
        ↓
Destination = Guinea?
        ↓ Yes
Auto-create CDC Task
        ↓
Open CDC Modal (or queue for later)
        ↓
Collect NIF, Importer Address
        ↓
Submit to GUCE Portal
        ↓
Track CDC Status
        ↓
Link to Procurement Order
```

### 2. Import/Export Documentation Modal (01700-ImportExportModal.js)

**Purpose:** Manage all import/export documentation for international shipments.

**Document Types:**

| Document | Required For | Status Tracking |
|----------|-------------|-----------------|
| Commercial Invoice | All international shipments | Pending/Received/Verified |
| Bill of Lading | Sea freight | Pending/Received/Verified |
| Air Waybill | Air freight | Pending/Received/Verified |
| Certificate of Origin | All international shipments | Pending/Received/Verified |
| Packing List | All shipments | Pending/Received/Verified |
| Safety Data Sheets (SDS) | Hazardous materials | Pending/Received/Verified |
| CDC | Guinea imports | Pending/Filed/Cleared |
| DDI | Guinea imports > 12M GNF | Pending/Approved |

**Features:**
- Document upload and storage
- Verification workflow
- Expiry tracking
- Automated reminders
- Integration with customs brokers

### 3. Shipment Tracking Component

**Purpose:** Real-time tracking of shipments and delivery status.

**Features:**
- Carrier API integration (DHL, Maersk, etc.)
- Real-time status updates
- Delivery confirmation
- Exception handling
- Notification system

## Integration with Procurement Workflow (01900)

### Order Creation Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    PROCUREMENT WORKFLOW                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Chat Agent → Collect Order Details                             │
│       ↓                                                            │
│  2. Destination Country Detection                                  │
│       ↓                                                            │
│  3. CDC Required? (Guinea)                                         │
│       ├── No → Standard Order Flow                                 │
│       └── Yes → Collect CDC Data                                   │
│              • NIF                                                 │
│              • Importer Address                                    │
│              • DDI Check (value > 12M GNF)                         │
│       ↓                                                            │
│  4. Create Procurement Order                                       │
│       ↓                                                            │
│  5. Auto-generate SOW with Appendices A-F                          │
│       ↓                                                            │
│  6. Create Logistics Task (if international)                       │
│       ↓                                                            │
│  7. Link to Logistics Page for CDC/Import processing               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Data Handoff

**From Procurement to Logistics:**
```javascript
{
  orderId: "PO-2026-02-001",
  orderNumber: "PO-2026-02-001",
  destinationCountry: {
    code: "GN",
    name: "Guinea",
    requiresCDC: true
  },
  cdcData: {
    importerNIF: "NIF123456789",
    importerAddress: "123 Rue du Commerce, Conakry",
    ddiRequired: true,
    orderValueGNF: 15000000
  },
  items: [...],
  estimatedValue: 40500,
  timeline: "standard"
}
```

## Database Schema

### logistics_documents Table

```sql
CREATE TABLE logistics_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_order_id UUID REFERENCES procurement_orders(id),
  document_type VARCHAR(50) NOT NULL, -- 'cdc', 'ddi', 'commercial_invoice', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'submitted', 'approved', 'rejected'
  file_url TEXT,
  metadata JSONB,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### cdc_submissions Table

```sql
CREATE TABLE cdc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_order_id UUID REFERENCES procurement_orders(id),
  nif VARCHAR(50) NOT NULL,
  importer_name VARCHAR(255),
  importer_address TEXT,
  order_value_gnf DECIMAL(15,2),
  ddi_required BOOLEAN DEFAULT FALSE,
  ddi_status VARCHAR(20), -- 'not_required', 'pending', 'approved'
  guce_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'cleared', 'rejected'
  submitted_at TIMESTAMP,
  cleared_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### CDC Endpoints

```
POST   /api/logistics/cdc                    - Create CDC submission
GET    /api/logistics/cdc/:id                - Get CDC status
PUT    /api/logistics/cdc/:id                - Update CDC submission
POST   /api/logistics/cdc/:id/submit         - Submit to GUCE
GET    /api/logistics/cdc/order/:orderId     - Get CDC by order ID
```

### Import/Export Endpoints

```
GET    /api/logistics/documents              - List all documents
POST   /api/logistics/documents              - Upload document
GET    /api/logistics/documents/:id          - Get document details
PUT    /api/logistics/documents/:id          - Update document
DELETE /api/logistics/documents/:id          - Delete document
POST   /api/logistics/documents/:id/verify   - Verify document
```

## GUCE Portal Integration

### Overview
The GUCE (Guichet Unique du Commerce Extérieur) is Guinea's single window for foreign trade operations.

### Integration Points

1. **CDC Submission**
   - API endpoint for electronic CDC filing
   - Real-time status updates
   - Document attachment support

2. **DDI Request**
   - Ministry of Commerce integration
   - Approval workflow tracking
   - Document generation

3. **Status Tracking**
   - Webhook notifications
   - Real-time status polling
   - Exception alerts

### Authentication
- API key authentication
- Digital certificate for document signing
- Secure token management

## Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] CDC data collection in procurement modal
- [x] NIF and importer address fields
- [x] DDI threshold detection
- [x] Appendix E (Logistics Documents) in SOW

### Phase 2: Logistics Page
- [ ] Create 01700-Logistics.js page
- [ ] Implement logistics dashboard
- [ ] Create 01700-CDCModal.js
- [ ] Create 01700-ImportExportModal.js
- [ ] Database tables for logistics_documents and cdc_submissions

### Phase 3: GUCE Integration
- [ ] GUCE API integration
- [ ] CDC electronic submission
- [ ] DDI request workflow
- [ ] Real-time status tracking

### Phase 4: Carrier Integration
- [ ] DHL API integration
- [ ] Maersk API integration
- [ ] Shipment tracking component
- [ ] Delivery confirmation workflow

## Testing Strategy

### Current Testing (Procurement Modal)
- CDC flow tested within procurement workflow
- Guinea destination triggers CDC data collection
- DDI threshold calculation verified

### Future Testing (Logistics Page)
- Dedicated test scenarios for CDC modal
- Import/Export document workflow tests
- GUCE sandbox integration testing
- Carrier API mock testing

## Related Documents

- [01900 Procurement Workflow](../01900_PROCUREMENT_COMPREHENSIVE_WORKFLOW/01900_PROCUREMENT_WORKFLOW_IMPLEMENTATION.md)
- [Scope of Work Template](/Users/_PropAI/_Forms/Patrick/Scope%20of%20Work.txt)
- [GUCE Portal Documentation](https://guce.gov.gn)

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-23 | 0.1.0 | Initial strategy document created |