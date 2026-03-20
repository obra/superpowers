# 02025 Quantity Surveying Drawing Measurement System — Implementation Plan

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.1 (2026-02-18): Production implementation complete — all UI phases delivered, Supabase wired, Kimi K2.5 integrated, swarm registered
- v1.0 (2026-02-18): Initial implementation plan created from master guide and drawing measurement documentation

---

## Executive Summary

**Purpose**: Deliver a production-ready Quantity Surveying Drawing Measurement System (discipline 02025) within the ConstructAI EPCM platform, providing professional-grade measurement workflows, industry-standard compliance, AI-assisted take-off, and full integration with Document Control (00900) and the wider platform ecosystem.

**Business Value**:
- Replaces manual measurement workflows with validated, auditable digital processes
- Enforces SANS-1200, CIDB-BPG-QS, ASAQS, RICS NRM2, and ISO 128-1 compliance automatically
- Reduces measurement errors through real-time tolerance checking and cross-validation
- Creates a complete, tamper-proof audit trail for every measurement event
- Enables AI-assisted BOQ generation competitive with $500/hour QS professionals
- Provides 3D dimensional integrity visualisation ("Nano Banana") for rapid QA

**Scope**:
- Database schema and RLS policies for `a_002025_qs_data` and `a_002025_qs_audit_trail`
- Service layer: MeasurementStandardsService, MeasurementValidationService, DimensionalAnalysisService, EnhancedChainageService, Quick3DVisualizationService
- UI layer: DrawingMeasurementPageComponent (Template A), DrawingAnalysisUpload, MeasurementStandardsSelector
- AI/Chatbot layer: DrawingMeasurementChatbot (LangChain), enhanced BOQ prompts
- Document Control integration (00900 drawing version locking)
- API endpoints for measurement CRUD, validation, and audit summary
- OpenCV AI Agents integration (02300 pipeline) for automated take-off

**Key Stakeholders**: Quantity Surveyors, Project Managers, Document Controllers, EPCM Directors

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    02025 QS MEASUREMENT SYSTEM                   │
├──────────────────────────────────────────────────────────────────┤
│  UI Layer                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ DrawingMeasurementPageComponent (Template A)            │    │
│  │  ├── Tab: Overview (dashboard stats)                    │    │
│  │  ├── Tab: Drawings (CRUD + version locking)             │    │
│  │  ├── Tab: Measurements (entry + validation)             │    │
│  │  ├── Tab: Drawing Analysis (BOQ upload + AI)            │    │
│  │  └── Tab: Reports (audit summary + export)              │    │
│  │ DrawingAnalysisUpload  │  MeasurementStandardsSelector  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  AI / Chatbot Layer                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ DrawingMeasurementChatbot (LangChain)                   │    │
│  │  ├── /api/chat/drawing/analyze  (BOQ file upload)       │    │
│  │  ├── /api/chat/drawing/message  (conversation)          │    │
│  │  └── /api/chat/drawing/accessible/:code (count badge)   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Service Layer                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │ Measurement  │ │ Dimensional  │ │ Quick3DVisualization  │    │
│  │ Standards    │ │ Analysis     │ │ Service (Nano Banana) │    │
│  │ Service      │ │ Service      │ │                       │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │ Measurement  │ │ Enhanced     │                              │
│  │ Validation   │ │ Chainage     │                              │
│  │ Service      │ │ Service      │                              │
│  └──────────────┘ └──────────────┘                              │
│                                                                  │
│  Data Layer                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ a_002025_qs_data  │  a_002025_qs_audit_trail            │    │
│  │ FK → a_00900_doccontrol_documents (drawing version)     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  External Integrations                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │ Doc Control  │ │ Doc Numbering│ │ OpenCV AI Agents      │    │
│  │ (00900)      │ │ (00200)      │ │ (02300 pipeline)      │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Foundation

### 1.1 Core Tables

**Status**: ✅ Schema defined — pending production migration verification

**Deliverables**:
- `a_002025_qs_data` — primary measurement store
- `a_002025_qs_audit_trail` — tamper-proof validation log

**Schema**:
```sql
CREATE TABLE a_002025_qs_data (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type               VARCHAR(50) NOT NULL,  -- 'measurement' | 'audit_trail'

    -- Drawing Reference (FK to Document Control)
    doc_control_document_id UUID NOT NULL REFERENCES a_00900_doccontrol_documents(id),
    document_version_used   INTEGER,
    measurement_context     TEXT,

    -- Measurement Data
    measurement_type        VARCHAR(50) NOT NULL,  -- 'linear' | 'area' | 'volume' | 'irregular'
    value                   DECIMAL(12,4),
    unit                    VARCHAR(20),           -- 'm' | 'm²' | 'm³'
    precision_level         DECIMAL(4,4),
    tolerance_applied       VARCHAR(100),

    -- Validation
    validation_status       VARCHAR(50),           -- 'pass' | 'warning' | 'fail'
    tolerance_level         VARCHAR(50),           -- 'minor' | 'major' | 'critical'
    validation_standard     VARCHAR(20),           -- 'SANS-1200' | 'CIDB-BPG-QS' | 'ASAQS'

    -- Categorisation
    element_type            VARCHAR(100),
    quantity_category       VARCHAR(100),          -- 'concrete' | 'reinforcement' | 'electrical' etc.
    project_phase           VARCHAR(50),           -- 'tender' | 'construction' | 'variation'
    location_reference      VARCHAR(255),
    description             TEXT,

    -- Audit
    created_by              UUID REFERENCES auth.users(id),
    verified_by             UUID REFERENCES auth.users(id),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    verified_at             TIMESTAMPTZ
);

CREATE TABLE a_002025_qs_audit_trail (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measurement_id    UUID REFERENCES a_002025_qs_data(id),
    validation_type   VARCHAR(100),
    validation_result JSONB,
    user_id           UUID REFERENCES auth.users(id),
    timestamp         TIMESTAMPTZ DEFAULT NOW(),
    system_version    VARCHAR(20)
);
```

### 1.2 Row-Level Security (RLS)

**Policies required**:
```sql
-- Quantity surveyors: full CRUD on own org measurements
-- Project managers: read + approve
-- Document controllers: read + archive
-- All roles: read audit trail (no write)
```

**Implementation checklist**:
- [ ] Enable RLS on `a_002025_qs_data`
- [ ] Enable RLS on `a_002025_qs_audit_trail`
- [ ] Create `quantity_surveyor` policy (INSERT, SELECT, UPDATE, DELETE)
- [ ] Create `project_manager` policy (SELECT, UPDATE status only)
- [ ] Create `document_controller` policy (SELECT)
- [ ] Verify no infinite recursion in policy joins
- [ ] Test with `database-security` MCP tool

### 1.3 Indexes and Performance

```sql
CREATE INDEX idx_qs_data_drawing ON a_002025_qs_data(doc_control_document_id);
CREATE INDEX idx_qs_data_type ON a_002025_qs_data(measurement_type);
CREATE INDEX idx_qs_data_status ON a_002025_qs_data(validation_status);
CREATE INDEX idx_qs_audit_measurement ON a_002025_qs_audit_trail(measurement_id);
```

---

## Phase 2: Service Layer Implementation

### 2.1 MeasurementStandardsService

**File**: `client/src/pages/02025-quantity-surveying/components/measurement-standards-Service.js`

**Supported Standards**:
| Standard | Authority | Version |
|----------|-----------|---------|
| ASAQS | Association of South African Quantity Surveyors | 8th Edition, 2023 |
| SANS 1200 | South African National Standards | Current |
| CIDB BPG QS | Construction Industry Development Board | Current |
| ISO 128-1 | International Technical Drawing Standards | Current |
| RICS NRM2 | Royal Institution of Chartered Surveyors | Current |

**Core Methods**:
```javascript
setProjectStandard(projectId, standard, config)
validateMeasurement(measurement, standard)
generateDocumentationTemplate(projectId, measurementType, method)
getToleranceThresholds(standard, measurementType)
```

**Implementation checklist**:
- [ ] Implement tolerance threshold lookup per standard
- [ ] Implement project-standard configuration persistence (Supabase)
- [ ] Implement documentation template generator
- [ ] Unit tests for all 5 standards
- [ ] Cross-standard validation capability

### 2.2 MeasurementValidationService

**File**: `client/src/pages/02025-quantity-surveying/components/measurement-validation-Service.js`

**Tolerance Thresholds**:
| Type | Minor | Major | Critical |
|------|-------|-------|----------|
| Length | ±0.005m | ±0.01m | ±0.02m |
| Area | ±0.01m² | ±0.05m² | ±0.1m² |
| Volume | ±0.02m³ | ±0.05m³ | ±0.1m³ |
| Angle | ±0.5° | ±1.0° | ±2.0° |

**Compliance Standards**:
```javascript
complianceStandards = {
  'SANS-1200':   { length: 0.01, area: 0.05, volume: 0.1 },
  'CIDB-BPG-QS': { length: 0.005, area: 0.02, volume: 0.05 }
};
```

**Validation Methods**:
```javascript
validateMeasurement(measurement, standard)
performCrossValidation(measurements)
generateAuditTrail(validationResults, userId)
applyToleranceAdjustments(measurements, standard)
detectDuplicates(measurements)
```

**Quality Targets**:
- Pass rate: ≥95% of measurements within tolerance
- Validation coverage: 100% automated on all measurements
- Audit trail: 100% of measurements logged

**Implementation checklist**:
- [ ] Implement range validation (realistic value ranges by type)
- [ ] Implement unit consistency checking
- [ ] Implement cross-verification (linear → area → volume)
- [ ] Implement duplicate detection algorithm
- [ ] Implement audit trail generation with tamper-proof timestamps
- [ ] Integration tests against SANS-1200 and CIDB-BPG-QS thresholds

### 2.3 DimensionalAnalysisService

**File**: `client/src/pages/02025-quantity-surveying/components/dimensional-analysis-Service.js`

**Supported Disciplines**: Architectural, Civil, Mechanical, Electrical, Process Engineering

**Core Methods**:
```javascript
createCoordinateSystem(drawingData, discipline)
generateChainages(elements, gridLines, discipline)
analyzeCrossSections(coordinateSystem, drawingData)
detectIntersections(elements)
```

**Implementation checklist**:
- [ ] Coordinate system creation from grid lines
- [ ] Building element relationship analysis
- [ ] Chainage measurement generation per discipline
- [ ] Cross-section analysis and intersection detection
- [ ] Integration with EnhancedChainageService

### 2.4 Quick3DVisualizationService (Nano Banana)

**File**: `client/src/pages/02025-quantity-surveying/components/quick-3d-visualization-Service.js`

**Thickness-Based Color Coding**:
```
Walls:  100mm=#FF6B6B (Brick)  150mm=#96CEB4 (Block)  225mm=#FFEAA7 (Load-bearing)
Slabs:  125mm=#DCEDC1          200mm=#FFAAA5           250mm=#A8E6CF
Beams:  200x250mm=#85C1E9      300x400mm=#82E0AA
Status: Red=Error  Orange=Warning  Green=Success
```

**Implementation checklist**:
- [ ] Babylon.js scene initialisation
- [ ] Thickness-based colour coding system
- [ ] Multi-view presets (isometric, front, back, left, right, top, bottom)
- [ ] Dimension label annotation
- [ ] Integrity assessment indicators
- [ ] Element type focus/filter capability

---

## Phase 3: UI Layer Implementation

### 3.1 DrawingMeasurementPageComponent (Template A)

**File**: `client/src/pages/02025-quantity-surveying/components/02025-quantity-surveying-drawing-measurement-page.js`

**Tab Structure**:
| Tab | Content | Key Actions |
|-----|---------|-------------|
| Overview | Dashboard stats (drawings, measurements, verifications, pending) | Refresh, export summary |
| Drawings | Drawing list with version locking | Add, edit, archive, link to Doc Control |
| Measurements | Measurement entry with live validation | Create, validate, verify, export BOQ |
| Drawing Analysis | BOQ file upload + AI analysis | Upload drawings, trigger AI, view report |
| Reports | Audit summary, tolerance reports | Generate, download, share |

**Dashboard Statistics**:
```javascript
{
  totalDrawings: number,
  totalMeasurements: number,
  verificationsCompleted: number,
  pendingReviews: number,
  passRate: percentage,
  lastUpdated: timestamp
}
```

**Implementation checklist**:
- [ ] Template A page scaffold with 5-tab navigation
- [ ] Dashboard statistics with real-time Supabase queries
- [ ] Drawing CRUD with Document Control FK integration
- [ ] Measurement entry form with inline validation feedback
- [ ] Status indicators (Completed / In Progress / Pending)
- [ ] Advanced search and filtering across drawings and measurements
- [ ] BOQ analysis trigger → chatbot event bridge
- [ ] Report generation and download

### 3.2 DrawingAnalysisUpload

**File**: `client/src/pages/02025-quantity-surveying/components/02025-drawing-analysis-upload.js`

**Implementation checklist**:
- [ ] Multi-file drag-and-drop upload (drawings + specifications)
- [ ] File validation (size, type: PDF/DWG/DXF/PNG/JPG)
- [ ] Upload progress indicators
- [ ] File serialisation for chatbot event dispatch
- [ ] Error state handling and user feedback

### 3.3 MeasurementStandardsSelector

**File**: `client/src/pages/02025-quantity-surveying/components/measurement-standards-Selector.js`

**Implementation checklist**:
- [ ] Dropdown/radio selector for 5 supported standards
- [ ] Per-project standard persistence
- [ ] Tolerance preview on standard selection
- [ ] Integration with MeasurementValidationService

---

## Phase 4: AI and Chatbot Layer

### 4.1 DrawingMeasurementChatbot

**File**: `client/src/pages/02025-quantity-surveying/chatbots/02025-drawing-measurement-chatbot.js`

**API Endpoints**:
```javascript
POST /api/chat/drawing/analyze          // BOQ analysis with file upload
POST /api/chat/drawing/message          // Conversation endpoint
GET  /api/chat/drawing/accessible/:code // Drawing count badge
```

**Enhanced Prompt Specifications**:
```javascript
precision: {
  length:  "±0.5mm (≤2m), ±1mm (2–5m), ±2mm (>5m)",
  area:    "±0.01m² (≤20m²), ±0.05m² (20–100m²), ±0.1m² (>100m²)",
  volume:  "±0.02m³ with ±1% for complex shapes"
},
costAlgorithms: {
  unitRates: "Current market rates with location adjustments",
  wastage:   "10–15% tiles, 5–10% concrete",
  profit:    "15–25% industry standard"
}
```

**Implementation checklist**:
- [ ] LangChain chatbot scaffold with conversation history
- [ ] File upload integration (FormData → `/api/chat/drawing/analyze`)
- [ ] Drawing count badge via accessible drawings API
- [ ] Citation system (references to specific drawing versions)
- [ ] Custom event listeners: `chatbotMessage`, `chatbotResponse`, `drawingAnalysisComplete`
- [ ] Error handling and fallback responses
- [ ] Enhanced BOQ prompt registration in promptsService

### 4.2 OpenCV AI Agents Integration (02300 Pipeline)

**Reference**: `agents/pages/02025_quantity_surveying/` (Kimi K2.5 API)

**Integration Points**:
- Automated quantity extraction from uploaded drawings
- Results fed into `a_002025_qs_data` via measurement save endpoint
- Kimi API key: `KIMI_API_KEY` environment variable
- Model: `moonshot-v1-8k` (migrated from Qwen3-VL)

**Implementation checklist**:
- [ ] Verify `real-kimi-api.js` integration is active
- [ ] Connect OpenCV agent output to measurement save workflow
- [ ] Map agent-extracted quantities to `a_002025_qs_data` schema
- [ ] Validate agent measurements through MeasurementValidationService
- [ ] Log agent-generated measurements with `data_type = 'ai_extracted'`

---

## Phase 5: Document Control Integration

### 5.1 Drawing Version Locking

**Integration Target**: `a_00900_doccontrol_documents`

**Rules**:
- Only drawings with `status = 'Approved'` are available for measurement
- Each measurement record locks to a specific `document_version_used`
- Version change alerts trigger when a drawing is superseded

**Implementation checklist**:
- [ ] Drawing selector filtered to `status = 'Approved'` only
- [ ] `doc_control_document_id` + `document_version_used` stored on every measurement
- [ ] Automated alert system when drawing version changes post-measurement
- [ ] Drawing number display using 00200 numbering convention (DR-xxx-Rx)
- [ ] Superseded drawing warning banner in UI

### 5.2 Document Numbering (00200)

**Convention**: `DR-{sequence}-{floor/zone}-R{revision}`

**Implementation checklist**:
- [ ] Drawing number auto-generation on new drawing creation
- [ ] Revision tracking (R1, R2, R3…) linked to Doc Control versions
- [ ] Drawing number display in measurement records and reports

---

## Phase 6: API Endpoints

### 6.1 Core Measurement API

```javascript
POST   /api/02025/save-measurement          // Create measurement record
POST   /api/02025/validate-measurement      // Run validation without saving
GET    /api/02025/measurements/:drawingId   // Get all measurements for a drawing
PUT    /api/02025/measurements/:id          // Update measurement
DELETE /api/02025/measurements/:id          // Soft-delete measurement
GET    /api/02025/audit-summary/:drawingId  // Audit trail summary
GET    /api/02025/drawings                  // List approved drawings
POST   /api/02025/drawings                  // Register new drawing reference
```

### 6.2 Validation API

```javascript
// Real-time validation on measurement entry
POST /api/02025/validate-measurement
Body: { value, type, unit, drawingId, standard }
Response: {
  status: 'pass' | 'warning' | 'fail',
  toleranceLevel: 'minor' | 'major' | 'critical',
  message: string,
  suggestedCorrection?: number
}
```

**Implementation checklist**:
- [ ] Express router for all 02025 endpoints
- [ ] Supabase client integration with RLS-aware queries
- [ ] Input validation and sanitisation middleware
- [ ] Error handling with structured error responses
- [ ] Rate limiting on validation endpoint
- [ ] API documentation (OpenAPI/Swagger)

---

## Phase 7: Testing and Quality Assurance

### 7.1 Unit Tests

**Coverage targets**:
- MeasurementValidationService: 100% method coverage
- MeasurementStandardsService: 100% method coverage
- DimensionalAnalysisService: ≥90% method coverage
- API endpoints: 100% route coverage

**Test cases**:
- [ ] Tolerance validation: pass/warning/fail for each measurement type
- [ ] Cross-validation: linear → area → volume consistency
- [ ] Duplicate detection: identical and near-duplicate measurements
- [ ] Standard switching: SANS-1200 vs CIDB-BPG-QS threshold differences
- [ ] Audit trail generation: completeness and timestamp integrity

### 7.2 Integration Tests

- [ ] Drawing version locking: measurement blocked on non-approved drawing
- [ ] Document Control FK: orphan measurement prevention
- [ ] Chatbot BOQ analysis: file upload → AI response → measurement save
- [ ] OpenCV agent: extracted quantities → validation → database save
- [ ] RLS policies: role-based access enforcement

### 7.3 Performance Benchmarks

| Metric | Target |
|--------|--------|
| Measurement save (API) | < 200ms |
| Real-time validation | < 100ms |
| BOQ analysis (AI) | < 30s per drawing |
| Dashboard load | < 1s |
| Audit summary generation | < 500ms |
| Pass rate | ≥ 95% within tolerance |

### 7.4 QA Workflow Schedule

| Frequency | Activity |
|-----------|----------|
| Daily | Automated validation checks on all new measurements |
| Weekly | Measurement accuracy reviews and tolerance analysis |
| Monthly | Validation effectiveness assessment and calibration |
| Quarterly | Industry standard compliance verification |

---

## Phase 8: Security and Access Control

### 8.1 Role-Based Access

| Role | Permissions |
|------|-------------|
| `quantity_surveyor` | CREATE, READ, UPDATE, VALIDATE measurements |
| `project_manager` | READ, REVIEW, APPROVE measurements |
| `document_controller` | READ, ARCHIVE measurements |

### 8.2 Data Integrity

- [ ] Measurements locked to specific drawing versions (immutable FK)
- [ ] Audit trail records are append-only (no UPDATE/DELETE)
- [ ] All measurement events attributed to authenticated user
- [ ] Supabase RLS enforced at database level (not just API)

### 8.3 Compliance

- [ ] SANS-1200 tolerance compliance verified on save
- [ ] CIDB-BPG-QS compliance verified on save
- [ ] ASAQS 8th Edition methods available for selection
- [ ] Complete audit trail for professional sign-off

---

## Phase 9: Deployment and Rollout

### 9.1 Prerequisites

- [ ] Supabase tables created and RLS policies active
- [ ] `KIMI_API_KEY` environment variable configured
- [ ] Document Control (00900) tables accessible
- [ ] Node.js ≥18.0.0 environment
- [ ] Webpack entry point `02025-quantity-surveying` configured

### 9.2 Deployment Steps

1. [ ] Run database migration for `a_002025_qs_data` and `a_002025_qs_audit_trail`
2. [ ] Apply RLS policies and verify with security audit tool
3. [ ] Deploy service layer files to `client/src/pages/02025-quantity-surveying/components/`
4. [ ] Deploy chatbot files to `client/src/pages/02025-quantity-surveying/chatbots/`
5. [ ] Register API routes in Express server
6. [ ] Register enhanced BOQ prompts in promptsService
7. [ ] Build and deploy webpack bundle
8. [ ] Smoke test all 5 UI tabs
9. [ ] Verify chatbot BOQ analysis end-to-end
10. [ ] Verify OpenCV agent integration

### 9.3 Rollback Plan

- Database: Supabase migration rollback script prepared before deployment
- UI: Previous webpack bundle retained for 30 days
- API: Feature flag to disable 02025 endpoints without full rollback

---

## Phase 10: Future Enhancements

### Phase 2 (Q1 2026)
- 📐 **BIM Export**: Measurements exported to IFC/BIM-compatible formats
- 📊 **ML Anomaly Detection**: Machine learning-based measurement anomaly flagging
- 🔗 **Cost Database Integration**: Direct links to regional pricing databases (ASAQS rates)
- 📱 **Mobile Capture**: Smartphone/tablet measurement input with GPS tagging

### Phase 3 (Q2 2026)
- 🤖 **Full AI Take-off**: Automated quantity extraction from any drawing format
- 📈 **Predictive Analytics**: Material and cost trend forecasting
- 🔄 **Live Construction Sync**: Real-time measurement updates from site
- 🌐 **Multi-platform**: Progressive Web App for offline measurement capture

---

## Implementation Checklist Summary

### Phase 1 — Database
- [ ] Create `a_002025_qs_data` table
- [ ] Create `a_002025_qs_audit_trail` table
- [ ] Apply RLS policies (3 roles)
- [ ] Create performance indexes

### Phase 2 — Services
- [ ] MeasurementStandardsService (5 standards)
- [ ] MeasurementValidationService (tolerance + cross-validation)
- [ ] DimensionalAnalysisService (5 disciplines)
- [ ] Quick3DVisualizationService (Nano Banana)
- [ ] EnhancedChainageService

### Phase 3 — UI
- [ ] DrawingMeasurementPageComponent (5 tabs)
- [ ] DrawingAnalysisUpload
- [ ] MeasurementStandardsSelector

### Phase 4 — AI/Chatbot
- [ ] DrawingMeasurementChatbot (LangChain)
- [ ] Enhanced BOQ prompts
- [ ] OpenCV/Kimi agent integration

### Phase 5 — Integrations
- [ ] Document Control (00900) version locking
- [ ] Document Numbering (00200) DR-xxx-Rx convention

### Phase 6 — API
- [ ] 8 core measurement endpoints
- [ ] Real-time validation endpoint

### Phase 7 — Testing
- [ ] Unit tests (100% service coverage)
- [ ] Integration tests
- [ ] Performance benchmarks

### Phase 8 — Security
- [ ] RLS enforcement verified
- [ ] Audit trail append-only
- [ ] Role-based access tested

### Phase 9 — Deployment
- [ ] Database migration
- [ ] Webpack build
- [ ] End-to-end smoke test

---

## Related Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Drawing Measurement System | `docs/pages-disciplines/1300_02025_QUANTITY_SURVEYING_DRAWING_MEASUREMENT.md` | System specification |
| Master Guide QS | `docs/pages-disciplines/1300_02025_MASTER_GUIDE_QUANTITY_SURVEYING.md` | Discipline overview |
| QS Guide (Modules) | `docs/pages-disciplines/1300_02025_QUANTITY_SURVEYINGGUIDE.md` | Service layer detail |
| QS Page Structure | `docs/pages-disciplines/1300_02025_QUANTITY_SURVEYINGPAGE.md` | UI/webpack structure |
| Document Control | `docs/pages-disciplines/1300_00900_DOCUMENT_CONTROL_PAGE.md` | Drawing version management |
| Document Numbering | `docs/pages-disciplines/1300_00200_DOCUMENT_NUMBERING_COMPLETE_SYSTEM.md` | Drawing numbering |
| OpenCV Agents Plan | `docs/implementation/implementation-plans/02300_QUANTITY_SURVEYING_OPENCV_AGENTS_*` | AI take-off pipeline |
| Kimi Migration | `docs/implementation/implementation-plans/MIGRATION_QWEN_TO_KIMI.md` | API migration details |

---

**Document ID**: `02025_QUANTITY_SURVEYING_DRAWING_MEASUREMENT_IMPLEMENTATION_PLAN`
**Status**: ✅ Production — UI Complete, Supabase Wired, Swarm Registered
**Created**: 2026-02-18
**Last Updated**: 2026-02-18
**Author**: Cline AI Engineering Team
**Version**: 1.1

---

## Production Delivery Summary (v1.1 — 2026-02-18)

The following phases have been **fully delivered** and are in production:

### ✅ UI Layer (Phase 3) — COMPLETE
- `02025-quantity-surveying-drawing-measurement-page.js` — 421 lines, orchestrator pattern
- `02025-drawing-analysis-tab.js` — 429 lines, full 3-panel implementation
- `02025-reports-tab.js` — 324 lines, real CSV/Excel/BOQ/PDF export
- `02025-drawings-tab.js`, `02025-measurements-tab.js`, `02025-overview-tab.js` — all complete
- All files ≤500 lines (500-line rule compliant per `0000_WORKFLOW_OPTIMIZATION_GUIDE.md`)

### ✅ Supabase CRUD (Phase 1 partial) — COMPLETE
- **Primary table**: `a_02025_qs_data` (live production table, `record_type` discriminator)
- **Invoice processing**: `a_02025_invoice_processing` — wired via `InvoiceHandlingModal`
- **Risk assessments**: `risk_assessments` — wired via `RiskAssessmentModal`
- **Drawing comparisons**: `document_comparisons` — wired via `DrawingComparisonModal`
- Data service: `02025-qs-data-service.js` — 134 lines, all CRUD operations

### ✅ AI Model (Phase 4 partial) — COMPLETE
- **Kimi K2.5** replaces Qwen VL throughout UI and agent layer
- Workflow JSON updated: `quantity-surveying-workflow.json` step 4 → `kimi_k25_analysis`
- Environment variable: `KIMI_API_KEY`, model: `moonshot-v1-8k`

### ✅ Deep-Agents Swarm Registration — COMPLETE
- Discipline spec created: `deep-agents/discipline-specifications/qs-02025-spec.json`
- Matches logistics-02400 pattern — swarm can discover and route tasks to QS agent
- 12 capabilities, 6 DB tables, 8 UI components, 6-stage pipeline registered

### ⏳ Remaining (Future Phases)
- Document Control (00900) version locking integration
- LangChain chatbot implementation
- Express API endpoints
- Full RLS policy enforcement
- Unit/integration test suite

---

## Appendix A: OpenCV Pixel Measurement Pipeline (CV2 Drawing Utils)

> **Source**: `agents/pages/02025_quantity_surveying/cv2-drawing-utils.js` and `real-opencv-implementation.js`
> **Phase Reference**: Phase 2 of 02300_QUANTITY_SURVEYING_OPENCV_AGENTS_IMPLEMENTATION_PLAN.md

This appendix documents the specialist pixel-level measurement pipeline that underpins the automated AI take-off capability. It is a JavaScript implementation (Node.js Canvas-based) that mirrors OpenCV's Python `cv2` API, enabling drawing analysis without native Python bindings.

---

### A.1 Architecture

```
Drawing Image (PNG/PDF/DWG)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                  CV2DrawingUtils Pipeline                    │
│                                                             │
│  1. loadImage()          → imread() via Canvas/mock         │
│  2. preprocess()         → grayscale → blur → threshold     │
│                             → Canny edge detection          │
│  3. detectContours()     → findContours() → classify        │
│  4. detectLines()        → HoughLinesP() → classify         │
│  5. extractText()        → Tesseract.js OCR                 │
│  6. calibrateScale()     → parse "1:100" from OCR text      │
│  7. extractDimensions()  → pixels × scale → metres          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
Dimensions (m / m² / m³) → MeasurementValidationService
        │
        ▼
a_002025_qs_data (data_type = 'ai_extracted')
```

---

### A.2 Core Processing Steps

#### Step 1: Image Loading (`loadImage`)
- Loads drawing via Node.js `canvas` library (`loadImage`)
- Falls back to mock (1920×1080) if Canvas unavailable
- Returns: `{ original, processed, metadata: { width, height, channels, path } }`

#### Step 2: Preprocessing (`preprocess`)
Four sequential operations applied to every drawing:

| Step | Operation | Config |
|------|-----------|--------|
| 2a | Grayscale conversion | Luminance formula: `0.299R + 0.587G + 0.114B` |
| 2b | Gaussian blur | Default kernel: `[5,5]`, sigma: `0` |
| 2c | Otsu thresholding | Auto-threshold (preferred) or binary at value `127` |
| 2d | Canny edge detection | Low: `50`, High: `150`, Aperture: `3` |

#### Step 3: Contour Detection (`detectContours`)
- Runs `findContours()` on edge image (8-neighbour connected components)
- Filters: min area `500px²`, max area `80%` of image
- Sorts by area (largest first)
- Classifies each contour:

| Classification | Criteria | QS Element |
|----------------|----------|------------|
| `square_element` | Aspect ratio 0.8–1.2, fill >90% | Column, square slab |
| `rectangle_element` | Aspect ratio 0.8–1.2, fill <90% | Wall, beam, slab |
| `linear_element` | Aspect ratio >2 or <0.5 | Beam, column |
| `large_element` | Area >30% of image | Building outline |
| `generic_element` | All others | Miscellaneous |

#### Step 4: Line Detection (`detectLines`)
- Runs `HoughLinesP()` (probabilistic Hough transform)
- Config: `rho=1`, `theta=π/180`, `threshold=50`, `minLength=50`, `maxGap=10`
- Classifies lines:

| Classification | Angle Range | Purpose |
|----------------|-------------|---------|
| `horizontal_dimension` | ±15° from 0°/180° | Horizontal dimension lines |
| `vertical_dimension` | ±15° from 90°/270° | Vertical dimension lines |
| `diagonal_structural` | Other, length >100px | Structural diagonal elements |

#### Step 5: OCR Text Extraction (`extractText`)
- Uses **Tesseract.js** (`RealTesseractFactory`) for text recognition
- Language: `eng` (configurable)
- Extracts dimension annotations, scale indicators, room labels
- Returns: `{ text, confidence, type: 'dimension'|'area'|'scale' }`

#### Step 6: Scale Calibration (`calibrateScale`)
- Parses OCR text for scale patterns: `1:100`, `1:200`, `1:50`, etc.
- Converts to decimal multiplier: `1:100 → scale = 0.01`
- Falls back to `defaultScale = 0.01` (1:100) if no scale found
- Confidence: OCR-detected `~0.89`, default `~0.65`

#### Step 7: Dimension Extraction (`extractDimensions`)
Converts pixel measurements to real-world units using scale:

```
widthMeters  = boundingBox.width  × scale
heightMeters = boundingBox.height × scale
areaMeters   = contour.area       × scale²
```

Output per element:
```javascript
{
  element: 'element_0',
  type: 'area' | 'length' | 'volume',
  value: 45.670,          // in metres or m²
  unit: 'm2' | 'm',
  measurements: { width, height, area },
  confidence: 0.92,
  classification: 'rectangle_element',
  source: 'contour_extraction'
}
```

---

### A.3 Swarm Agent Architecture (Coordinator + Specialists)

The CV2 pipeline feeds into a multi-agent swarm (`coordinator.js`):

```
QSCoordinatorAgent
├── View Agents (parallel)
│   ├── qs_plan_analyzer_v1     → 2D dimensions, room layout, scale
│   ├── qs_section_analyzer_v1  → Heights, vertical dimensions
│   └── qs_elevation_analyzer_v1 → Facade, external works
│
├── Specialist Agents (parallel)
│   ├── qs_concrete_v1   → AAQS Sec 4-6: foundations, slabs, columns, beams
│   ├── qs_masonry_v1    → AAQS Sec 7-9: walls, blockwork, partitions
│   └── qs_steel_v1      → AAQS Sec 10-12: beams, columns, connections
│
└── QSFusionAgent (6D Fusion)
    ├── Plan + Section → 3D volume extrusion
    ├── Plan + Elevation → vertical element integration
    └── Full 6D → cross-view validation + final quantities
```

**Supported QS Standards in Swarm**:
| Standard | Tolerance | Wastage |
|----------|-----------|---------|
| AAQS 2015 | Concrete 5%, Masonry 3%, Steel 2% | Masonry 3% |
| SMM7 | Concrete 4%, Masonry 2.5%, Steel 3% | — |
| NRM1 | Per element type | — |

---

### A.4 Integration with Main QS System

The OpenCV pipeline integrates with the main 02025 system as follows:

```
CV2DrawingUtils.processDrawing(imagePath)
        │
        ▼ dimensions[]
MeasurementValidationService.validateMeasurement(dim, 'SANS-1200')
        │
        ▼ validated[]
POST /api/02025/save-measurement
  { data_type: 'ai_extracted', validation_status: 'pass'|'warning'|'fail' }
        │
        ▼
a_002025_qs_data + a_002025_qs_audit_trail
```

**Key integration rules**:
- All AI-extracted measurements use `data_type = 'ai_extracted'`
- Must pass MeasurementValidationService before saving
- Confidence < 0.75 → `validation_status = 'warning'`, requires human review
- Confidence < 0.50 → `validation_status = 'fail'`, blocked from saving

---

### A.5 Configuration Reference

```javascript
const cv2Utils = new CV2DrawingUtils({
  // Preprocessing
  grayscale: true,
  blurKernel: [5, 5],
  blurSigma: 0,
  cannyLow: 50,
  cannyHigh: 150,
  cannyAperture: 3,
  thresholdValue: 127,
  thresholdMax: 255,
  useOtsu: true,           // Recommended: auto-threshold

  // Contour/Line detection
  contourMode: 'RETR_EXTERNAL',
  contourMethod: 'CHAIN_APPROX_SIMPLE',
  houghRho: 1,
  houghTheta: Math.PI / 180,
  houghThreshold: 50,
  minLineLength: 50,
  maxLineGap: 10,

  // OCR
  ocrEnabled: true,
  ocrLanguage: 'eng',

  // Scale
  defaultScale: 0.01,      // 1:100 default
  scaleConfidenceThreshold: 0.75,

  // AI (Kimi K2.5)
  kimiModel: 'moonshot-v1-8k',
  kimiApiKey: process.env.KIMI_API_KEY
});
```

---

### A.6 Performance Targets

| Metric | Target |
|--------|--------|
| Single drawing processing | < 500ms |
| Batch (10 drawings) | < 5s total |
| Contour detection | 3–7 contours per typical floor plan |
| Scale calibration confidence | ≥ 0.75 (OCR), ≥ 0.65 (default) |
| Dimension extraction accuracy | ≥ 85% within SANS-1200 tolerance |
| Swarm parallel agents | 3–5 concurrent |
| Quality score threshold | ≥ 0.85 |

---

### A.7 Implementation Checklist (OpenCV Pipeline)

- [ ] Verify `canvas` npm package installed (`npm install canvas`)
- [ ] Verify `tesseract.js` npm package installed
- [ ] Confirm `KIMI_API_KEY` environment variable set
- [ ] Test `CV2DrawingUtils.processDrawing()` with sample floor plan
- [ ] Test `calibrateScale()` with drawings containing `1:100` annotation
- [ ] Test `extractDimensions()` output matches expected m² values
- [ ] Connect `extractDimensions()` output → `MeasurementValidationService`
- [ ] Connect validated dimensions → `POST /api/02025/save-measurement`
- [ ] Test `QSCoordinatorAgent` with all 3 specialist agents active
- [ ] Test `QSFusionAgent` 6D fusion with plan + section + elevation
- [ ] Verify `data_type = 'ai_extracted'` flag on all AI-generated records
- [ ] Verify confidence < 0.75 triggers `validation_status = 'warning'`
- [ ] Run batch test: `processBatch()` with 10 residential drawings
- [ ] Verify quality score ≥ 0.85 on test dataset

---

### A.8 File Reference

| File | Location | Purpose |
|------|----------|---------|
| `cv2-drawing-utils.js` | `agents/pages/02025_quantity_surveying/` | Main OpenCV pipeline (7-step) |
| `real-opencv-implementation.js` | `agents/pages/02025_quantity_surveying/` | Canvas-based OpenCV implementation + factory |
| `real-opencv-implementation-fixed.js` | `agents/pages/02025_quantity_surveying/` | Fixed/patched OpenCV implementation |
| `real-kimi-api.js` | `agents/pages/02025_quantity_surveying/` | Kimi K2.5 API integration |
| `real-tesseract-integration.js` | `agents/pages/02025_quantity_surveying/` | Tesseract.js OCR integration |
| `coordinator.js` | `agents/pages/02025_quantity_surveying/` | Swarm coordinator (view + specialist agents) |
| `fusion-agent.js` | `agents/pages/02025_quantity_surveying/` | 6D fusion agent |
| `kimi-integration.js` | `agents/pages/02025_quantity_surveying/` | Kimi multimodal integration |
| `test-cv2-utilities.js` | `agents/pages/02025_quantity_surveying/` | CV2 pipeline test suite |
| `test-swarm.js` | `agents/pages/02025_quantity_surveying/` | Swarm agent test suite |
| Ground truth dataset | `agents/pages/02025_quantity_surveying/drawings/dataset/ground_truth/` | 91 residential drawing JSON ground truths |

---

**Appendix A Version**: 1.0 (2026-02-18)  
**Source Phase**: 02300 OpenCV Agents — Phase 2 (Core Pipeline) + Phase 4 (Real Implementation)
