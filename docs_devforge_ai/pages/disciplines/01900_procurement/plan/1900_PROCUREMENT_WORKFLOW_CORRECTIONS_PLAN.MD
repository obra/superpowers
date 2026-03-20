# Procurement Workflow Corrections Plan

## Overview

This document outlines the implementation plan for correcting 10 critical gaps in the 01900 Procurement → 01700 Logistics workflow, with CDC (Customs Declaration Certificate) as a separate handoff discipline.

---

## Architecture: Three-Discipline Handoff Model

```
┌─────────────────────────────────────────────────────────────────┐
│  DISCIPLINE 01900 (Procurement)                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Stage 1  │→│ Stage 2  │→│ Stage 3  │→│ HANDOFF  │──────────┼──┐
│  │ Order    │  │ Input    │  │ 6-Agent │  │ order_   │        │  │
│  │ Creation │  │ Agent    │  │ Pipeline│  │ signed   │        │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │  │
│                                                       │        │  │
│                                        ┌──────────────┘        │  │
│                                        │ CDC Handoff           │  │
│                                        ▼                       │  │
│                              ┌─────────────────┐               │  │
│                              │  CDC Discipline │               │  │
│                              │  (01900-CDC)    │               │  │
│                              │  NIF/RCCM/DDI   │               │  │
│                              └─────────────────┘               │  │
└─────────────────────────────────────────────────────────────────┘  │
                                                                       │
┌─────────────────────────────────────────────────────────────────┐  │
│  DISCIPLINE 01700 (Logistics)                                    │  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │  │
│  │ Stage 1  │←│ Stage 2  │←│ Stage 3  │←│ TRIGGER │←──────────┼──┘
│  │ Order    │  │ Shipping │  │ Customs  │  │ Event   │        │
│  │ Receipt  │  │ Coord    │  │ Clearance│  │         │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Gap Prioritization (Dependency Order)

| Priority | Gap | Dependencies | Estimated Effort |
|----------|-----|--------------|------------------|
| **P0** | GAP 8: 01700 handoff trigger mechanism | None | 2 days |
| **P0** | GAP 2: CDC API endpoint | None | 1 day |
| **P1** | GAP 1: SOW creation step | GAP 8 | 1 day |
| **P1** | GAP 5: Field population CDC/logistics fields | GAP 2 | 1 day |
| **P1** | GAP 9: AppendixE endpoints | GAP 8 | 1 day |
| **P2** | GAP 6: Final review document assembly | GAP 5 | 2 days |
| **P2** | GAP 4: PDF/DOCX export implementation | GAP 6 | 2 days |
| **P2** | GAP 3: AppendixE download buttons | GAP 4 | 0.5 day |
| **P3** | GAP 7: HITL pipeline integration | GAP 6 | 2 days |
| **P3** | GAP 10: Tracking tab real data | GAP 8, GAP 9 | 1 day |

**Total Estimated Effort: 13.5 days**

---

## Phase 1: Foundation (P0 - Days 1-3)

### GAP 8: 01700 Handoff Trigger Mechanism

**Problem:** `order_signed` event is documented but not implemented.

**Solution:** Implement event bus using Supabase Postgres triggers + webhooks.

**Files to Create/Modify:**

```
server/
├── src/
│   ├── services/
│   │   └── events/
│   │       ├── event-bus.js              # NEW - Event publisher/subscriber
│   │       └── handoff-events.js         # NEW - Discipline handoff events
│   └── routes/
│       └── webhook-routes.js             # NEW - Webhook endpoints for 01700
│
database/
└── migrations/
    └── 20260219_handoff_events.sql       # NEW - Events table + triggers
```

**Implementation Steps:**

1. Create `discipline_handoff_events` table in Supabase
2. Add Postgres trigger on `procurement_orders` when `status = 'signed'`
3. Create webhook endpoint `POST /api/webhooks/logistics/order-signed`
4. Update `ProcurementFinalReviewAgent` to set `status = 'signed'` on approval
5. Create `LogisticsOrchestratorAgent` webhook handler

**Event Payload:**

```javascript
{
  event_id: 'evt_xxx',
  event_type: 'order_signed',
  source_discipline: '01900',
  target_discipline: '01700',
  timestamp: '2026-02-19T10:00:00Z',
  payload: {
    order_id: 'po-2026-001',
    order_number: 'PO-2026-0218-001',
    supplier_name: 'Caterpillar West Africa Ltd',
    supplier_country: 'GN',
    delivery_location: 'Conakry, Guinea',
    order_value: 3350000,
    currency: 'USD',
    items: [...],
    incoterms: 'CIF',
    cdc_data: { nif: '123456789', rccm: 'RCCM-GN-2019-B-12345' },
    logistics_requirements: { ... }
  }
}
```

**Test:**

```javascript
// tests/integration/test-handoff-trigger.cjs
describe('01900 → 01700 Handoff', () => {
  it('should fire order_signed event when procurement approves', async () => {
    // 1. Run procurement pipeline to completion
    // 2. Verify event inserted to discipline_handoff_events
    // 3. Verify webhook called to 01700
    // 4. Verify LogisticsOrchestratorAgent received order data
  });
});
```

---

### GAP 2: CDC API Endpoint

**Problem:** CDC data collected in form but no server endpoint to persist/submit.

**Solution:** Create CDC submission endpoints with separate handoff to CDC discipline.

**Files to Create/Modify:**

```
server/
├── src/
│   ├── routes/
│   │   └── cdc-routes.js                 # NEW - CDC API endpoints
│   └── services/
│       └── cdc/
│           ├── cdc-submission-service.js # NEW - CDC submission logic
│           └── guinea-cdc-client.js      # NEW - Guinea customs API client
│
client/
└── src/
    └── services/
        └── cdcDDIService.js              # MODIFY - Add API calls
```

**API Endpoints:**

```
POST   /api/cdc/submission                 # Create CDC submission
GET    /api/cdc/submission/:orderId        # Get CDC submission status
PUT    /api/cdc/submission/:orderId        # Update CDC data
POST   /api/cdc/submission/:orderId/submit # Submit to Guinea customs
GET    /api/cdc/documents/:orderId         # Get CDC documents
```

**CDC Submission Flow:**

```
1. User fills CDC/DDI fields in modal
2. Frontend calls POST /api/cdc/submission
3. Server stores in cdc_submissions table
4. On order_signed, trigger CDC handoff event
5. CDC discipline processes submission
6. If Guinea API available, submit electronically
7. Otherwise, generate printable PDF for manual submission
```

**Test:**

```javascript
// tests/01900-procurement/test-cdc-submission.cjs
describe('CDC Submission', () => {
  it('should create CDC submission with NIF/RCCM/DDI', async () => {
    const response = await fetch('/api/cdc/submission', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'po-2026-001',
        destination_country: 'GN',
        importer_nif: '123456789',
        importer_rccm: 'RCCM-GN-2019-B-12345',
        customs_office: 'CKY',
        ddi_required: true,
        ddi_reference: 'DDI-2026-001'
      })
    });
    expect(response.status).toBe(201);
  });
});
```

---

## Phase 2: Core Corrections (P1 - Days 4-6)

### GAP 1: SOW Creation Step

**Problem:** Handoff goes to `ProcurementItemSelectionModal` without creating SOW.

**Solution:** Add SOW creation step before item selection.

**Files to Modify:**

```
client/
└── src/
    └── pages/
        └── 01900-procurement/
            └── components/
                └── modals/
                    ├── 01900-ProcurementInputAgentModal.js  # MODIFY
                    └── components/
                        └── AgentHandoffConfirmation.js       # MODIFY

server/
└── src/
    └── routes/
        └── sow-routes.js              # MODIFY - Add SOW creation endpoint
```

**Implementation:**

1. Add `POST /api/sow/create` endpoint
2. Modify `handleHandoff()` in `ProcurementInputAgentModal.js`:
   ```javascript
   const handleHandoff = async () => {
     // 1. Create SOW record first
     const sowResponse = await fetch('/api/sow/create', {
       method: 'POST',
       body: JSON.stringify({ extractedData, sessionId })
     });
     const sow = await sowResponse.json();
     
     // 2. Open ProcurementItemSelectionModal with SOW ID
     openModal('ProcurementItemSelectionModal', {
       sowId: sow.id,
       extractedData: sow.data,
       mode: 'create'
     });
   };
   ```

3. Update button label from "Create SOW" to "Generate SOW & Select Items"

---

### GAP 5: Field Population CDC/Logistics Fields

**Problem:** `01900_field_population_agent.py` doesn't map CDC/logistics fields.

**Solution:** Add field mappings for CDC and logistics data.

**Files to Modify:**

```
deep-agents/
└── deep_agents/
    └── agents/
        └── pages/
            └── 01900-procurement/
                └── main_agents/
                    └── 01900_field_population_agent.py  # MODIFY
```

**Add Methods:**

```python
def _map_cdc_fields(self, procurement_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map CDC submission fields"""
    cdc_data = procurement_data.get('cdc_submission', {})
    return {
        'cdc_submission_reference': cdc_data.get('submission_reference'),
        'importer_nif': cdc_data.get('vendor_nif'),
        'importer_rccm': cdc_data.get('vendor_rccm'),
        'importer_tax_clearance': cdc_data.get('vendor_tax_clearance'),
        'cdc_status': cdc_data.get('submission_status'),
        'cdc_completeness': cdc_data.get('cdc_completeness', 0),
        'cdc_review_deadline': cdc_data.get('review_deadline')
    }

def _map_logistics_fields(self, procurement_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map logistics/import-export fields"""
    return {
        'incoterms': procurement_data.get('incoterms'),
        'port_of_loading': procurement_data.get('portOfLoading'),
        'port_of_discharge': procurement_data.get('portOfDischarge'),
        'import_permit_authority': procurement_data.get('importPermitAuthority'),
        'import_permit_required_by': procurement_data.get('importPermitRequiredBy'),
        'export_license_authority': procurement_data.get('exportLicenseAuthority'),
        'export_license_eccn': procurement_data.get('exportLicenseECCN'),
        'customs_broker_port': procurement_data.get('customsBrokerPort'),
        'insurance_provider': procurement_data.get('insuranceProvider'),
        'insurance_coverage_type': procurement_data.get('insuranceCoverageType')
    }
```

---

### GAP 9: AppendixE Endpoints

**Problem:** `/api/procurement/appendix-e/*` endpoints referenced but not implemented.

**Solution:** Create AppendixE routes in server.

**Files to Create:**

```
server/
└── src/
    └── routes/
        └── appendix-e-routes.js         # NEW
```

**Endpoints:**

```javascript
// appendix-e-routes.js
router.post('/create-logistics-task', createLogisticsTask);
router.get('/logistics-task/:orderId', getLogisticsTask);
router.post('/send-message/:taskId', sendTaskMessage);
router.post('/complete-task/:taskId', completeTask);
router.get('/logistics-specs/:orderId', getLogisticsSpecs);
router.post('/add-logistics-spec', addLogisticsSpec);
router.post('/complete-appendix', completeAppendixE);
```

---

## Phase 3: Document Generation (P2 - Days 7-10)

### GAP 6: Final Review Document Assembly

**Problem:** Final review doesn't assemble complete order document with appendices.

**Solution:** Add document assembly step to `ProcurementFinalReviewAgent`.

**Files to Modify:**

```
deep-agents/
└── deep_agents/
    └── agents/
        └── pages/
            └── 01900-procurement/
                └── main_agents/
                    └── 01900_final_review_agent.py  # MODIFY

server/
└── src/
    └── services/
        └── document-assembly/
            └── order-package-assembler.js  # NEW
```

**Add to Final Review Agent:**

```python
async def _assemble_order_package(self, procurement_data: Dict, 
                                   populated_document: Dict,
                                   appendices: Dict) -> Dict[str, Any]:
    """Assemble complete order package with all appendices"""
    return {
        'package_id': f"PKG-{procurement_data.get('order_number')}",
        'documents': [
            {'type': 'purchase_order', 'content': populated_document},
            {'type': 'appendix_a', 'content': appendices.get('A')},
            {'type': 'appendix_b', 'content': appendices.get('B')},
            {'type': 'appendix_c', 'content': appendices.get('C')},
            {'type': 'appendix_d', 'content': appendices.get('D')},
            {'type': 'appendix_e', 'content': appendices.get('E')},
            {'type': 'appendix_f', 'content': appendices.get('F')}
        ],
        'assembly_timestamp': datetime.now().isoformat(),
        'total_pages': 0  # Calculated during PDF generation
    }
```

---

### GAP 4: PDF/DOCX Export Implementation

**Problem:** Export returns mock content, not real documents.

**Solution:** Implement real PDF/DOCX generation using templates.

**Files to Create:**

```
server/
└── src/
    └── services/
        └── document-generation/
            ├── pdf-generator.js          # NEW - Puppeteer PDF generation
            ├── docx-generator.js         # NEW - DOCX generation
            └── template-renderer.js      # NEW - HTML template rendering
```

**Implementation:**

```javascript
// pdf-generator.js
const puppeteer = require('puppeteer');

async function generatePDF(htmlContent, options = {}) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
    ...options
  });
  
  await browser.close();
  return pdf;
}
```

**Template Rendering:**

```javascript
// template-renderer.js
function renderTemplate(templateId, data) {
  // Load 01700 HTML template
  const template = loadTemplate(`01700_${templateId}_template.html`);
  
  // Replace {{field}} placeholders with data
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return rendered;
}
```

---

### GAP 3: AppendixE Download Buttons

**Problem:** View/Edit/Delete buttons have no onClick handlers.

**Solution:** Wire buttons to document actions.

**Files to Modify:**

```
client/
└── src/
    └── pages/
        └── 01900-procurement/
            └── components/
                └── 01900-appendix-e-logistics-documents.js  # MODIFY
```

**Add Handlers:**

```javascript
const handleViewDocument = (docId) => {
  window.open(`/api/logistics/documents/export/${docId}?format=pdf`, '_blank');
};

const handleEditDocument = (docId) => {
  openModal('LogisticsDocumentEditor', { documentId: docId });
};

const handleDeleteDocument = async (docId) => {
  if (confirm('Are you sure you want to delete this document?')) {
    await fetch(`/api/logistics/documents/${docId}`, { method: 'DELETE' });
    loadAppendixEData();
  }
};

const handleDownloadDocument = (docId, format) => {
  window.open(`/api/logistics/documents/export/${docId}?format=${format}`);
};
```

---

## Phase 4: Integration (P3 - Days 11-13)

### GAP 7: HITL Pipeline Integration

**Problem:** HITL interface exists but not wired into agent pipeline.

**Solution:** Add HITL trigger points between agents.

**Files to Modify:**

```
deep-agents/
└── deep_agents/
    └── agents/
        └── pages/
            └── 01900-procurement/
                └── main_agents/
                    ├── 01900_quality_assurance_agent.py    # MODIFY
                    └── 01900_final_review_agent.py         # MODIFY

server/
└── src/
    └── services/
        └── hitl/
            └── hitl-task-creator.js       # NEW
```

**HITL Trigger Logic:**

```python
# In quality_assurance_agent.py
async def _check_hitl_required(self, quality_score: float, 
                                procurement_data: Dict) -> bool:
    """Determine if HITL review is required"""
    # Always require HITL for:
    # 1. High-value orders (> R1M)
    # 2. Quality score < 0.85
    # 3. International shipments
    # 4. Hazardous materials
    
    value = procurement_data.get('totalValue', 0)
    is_international = procurement_data.get('deliveryCountry') != 'ZA'
    is_hazardous = procurement_data.get('hazardousMaterials', False)
    
    return (
      value > 1000000 or
      quality_score < 0.85 or
      is_international or
      is_hazardous
    )

async def _create_hitl_task(self, procurement_data: Dict, 
                            qa_result: Dict) -> str:
    """Create HITL task for human review"""
    response = await fetch('/api/procurement/hitl/create', {
      method: 'POST',
      body: JSON.stringify({
        procurement_id: procurement_data.get('id'),
        review_type: 'quality_assurance',
        priority: 'high' if procurement_data.get('totalValue') > 1000000 else 'normal',
        context: qa_result
      })
    });
    return response.json()['task_id'];
```

---

### GAP 10: Tracking Tab Real Data

**Problem:** Tracking tab shows hardcoded dummy data.

**Solution:** Connect to real shipment data from 01700.

**Files to Modify:**

```
client/
└── src/
    └── pages/
        └── 01900-procurement/
            └── components/
                └── 01900-appendix-e-logistics-documents.js  # MODIFY

server/
└── src/
    └── routes/
        └── logistics-routes.js            # MODIFY - Add tracking endpoint
```

**Add Tracking Endpoint:**

```javascript
// logistics-routes.js
router.get('/tracking/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  // Get shipments from 01700 shipping management
  const { data: shipments } = await supabase
    .from('logistics_shipments')
    .select('*')
    .eq('procurement_order_id', orderId);
    
  // Calculate stats
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    onTimeRate: calculateOnTimeRate(shipments),
    docCompleteness: calculateDocCompleteness(shipments)
  };
  
  res.json({ shipments, stats });
});
```

---

## Testing Strategy

### Unit Tests (Per Gap)

```
tests/
├── 01900-procurement/
│   ├── test-cdc-submission.cjs
│   ├── test-sow-creation.cjs
│   ├── test-field-population-cdc.cjs
│   └── test-hitl-triggers.cjs
│
├── 01700-logistics/
│   ├── test-handoff-receiver.cjs
│   ├── test-document-generation.cjs
│   └── test-tracking-data.cjs
│
└── integration/
    ├── test-full-01900-to-01700.cjs
    └── test-cdc-handoff.cjs
```

### Integration Test Flow

```javascript
// tests/integration/test-full-workflow.cjs
describe('Full Procurement → CDC → Logistics Workflow', () => {
  it('should complete full workflow with all handoffs', async () => {
    // 1. Create order via modal
    const order = await createProcurementOrder(mockOrderData);
    
    // 2. Run 6-agent pipeline
    const pipelineResult = await runProcurementPipeline(order.id);
    
    // 3. Verify CDC submission created
    const cdcSubmission = await getCDCSubmission(order.id);
    expect(cdcSubmission.status).toBe('pending_review');
    
    // 4. Verify order_signed event fired
    const events = await getHandoffEvents(order.id);
    expect(events).toContainEqual(
      expect.objectContaining({ event_type: 'order_signed' })
    );
    
    // 5. Verify 01700 orchestrator triggered
    const logisticsWorkflow = await getLogisticsWorkflow(order.id);
    expect(logisticsWorkflow.status).toBe('in_progress');
    
    // 6. Verify documents generated
    const documents = await getLogisticsDocuments(order.id);
    expect(documents).toContain('commercial_invoice');
    expect(documents).toContain('bill_of_lading');
    
    // 7. Verify PDF export works
    const pdf = await exportDocument(documents[0].id, 'pdf');
    expect(pdf.length).toBeGreaterThan(1000); // Not mock content
  });
});
```

---

## Implementation Timeline

| Week | Days | Focus | Deliverables |
|------|------|-------|--------------|
| 1 | 1-3 | Foundation | GAP 8 (Handoff trigger), GAP 2 (CDC API) |
| 1 | 4-6 | Core | GAP 1 (SOW), GAP 5 (Field population), GAP 9 (AppendixE endpoints) |
| 2 | 7-10 | Documents | GAP 6 (Assembly), GAP 4 (PDF export), GAP 3 (Download buttons) |
| 2 | 11-13 | Integration | GAP 7 (HITL), GAP 10 (Tracking) |
| 2 | 14 | Testing | Full integration tests, documentation |

---

## Database Schema Changes

```sql
-- New tables required

-- Discipline handoff events
CREATE TABLE discipline_handoff_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  source_discipline VARCHAR(10) NOT NULL,
  target_discipline VARCHAR(10) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- CDC submissions
CREATE TABLE cdc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_order_id UUID REFERENCES procurement_orders(id),
  destination_country VARCHAR(2) NOT NULL,
  importer_nif VARCHAR(50) NOT NULL,
  importer_rccm VARCHAR(50),
  customs_office VARCHAR(10),
  ddi_required BOOLEAN DEFAULT FALSE,
  ddi_reference VARCHAR(50),
  submission_status VARCHAR(20) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order packages (assembled documents)
CREATE TABLE order_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_order_id UUID REFERENCES procurement_orders(id),
  package_type VARCHAR(20) DEFAULT 'full',
  documents JSONB NOT NULL,
  total_pages INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for order_signed event
CREATE OR REPLACE FUNCTION trigger_order_signed_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'signed' AND OLD.status != 'signed' THEN
    INSERT INTO discipline_handoff_events (event_type, source_discipline, target_discipline, payload)
    VALUES (
      'order_signed',
      '01900',
      '01700',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'supplier_name', NEW.supplier_name,
        'total_value', NEW.total_value
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_signed_trigger
AFTER UPDATE ON procurement_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_order_signed_event();
```

---

## Success Criteria

1. **Handoff Works:** Order signed in 01900 automatically triggers 01700 orchestrator
2. **CDC Separate:** CDC submission is a distinct handoff with its own workflow
3. **Documents Downloadable:** Users can download real PDF/DOCX files
4. **HITL Integrated:** Pipeline pauses for human review when required
5. **Tracking Real:** Tracking tab shows actual shipment data
6. **All Tests Pass:** 300+ tests covering all gaps