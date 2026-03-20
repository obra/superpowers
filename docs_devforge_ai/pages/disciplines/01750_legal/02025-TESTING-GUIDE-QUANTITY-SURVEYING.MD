# Quantity Surveying (02025) Testing Guide

**Document ID:** 02025_TESTING_GUIDE_QUANTITY_SURVEYING  
**Discipline:** 02025 - Quantity Surveying  
**Version:** 1.0  
**Last Updated:** 2026-02-20  

---

## Document Usage Guide

**🎯 This Document's Role**: Comprehensive testing guide for the Quantity Surveying discipline, covering drawing measurements, BOQ generation, and dimension extraction workflows.

**📚 Related Documents:**

- **`docs/workflows-simulations/TESTING_FRAMEWORK.md`** → Overall testing framework
- **`docs/workflows-simulations/0000_TESTING_DASHBOARD_PROCEDURE.md`** → Testing dashboard procedures
- **`docs/workflows-simulations/01900_TESTING_GUIDE_HANDOFF_SYSTEM.md`** → Handoff system testing
- **`deep-agents/docs/0000_WORKFLOW_OPTIMIZATION_GUIDE.md`** → Workflow optimization

---

## 1. Purpose

This guide defines testing procedures for the Quantity Surveying (02025) discipline, including:
- Drawing measurement workflows
- BOQ (Bill of Quantities) generation
- OpenCV dimension extraction
- Vision-language model analysis
- Measurement validation and standards compliance

---

## 2. Scope

### 2.1 Components Under Test

| Component | Location | Description |
|-----------|----------|-------------|
| Drawing Measurement Page | `client/src/pages/02025-quantity-surveying/` | Main QS page with tabs |
| Drawings Tab | `components/tabs/02025-drawings-tab.js` | Drawing management |
| Measurements Tab | `components/tabs/02025-measurements-tab.js` | Measurement management |
| Drawing Analysis Tab | `components/tabs/02025-drawing-analysis-tab.js` | AI-powered analysis |
| Reports Tab | `components/tabs/02025-reports-tab.js` | BOQ reports |
| OpenCV Simulator | `deep-agents/.../quantity-surveying-opencv-simulator.js` | Dimension extraction |
| Measurement Validation | `measurement-validation-Service.js` | Standards validation |

### 2.2 Test Categories

| Category | Description | Priority |
|----------|-------------|----------|
| Drawing CRUD | Create, read, update, delete drawings | High |
| Measurement CRUD | Create, read, update, delete measurements | High |
| Dimension Extraction | OpenCV-based dimension extraction | High |
| VL Analysis | Vision-language model analysis | Medium |
| Standards Validation | ASAQS, SANS, NRM compliance | High |
| BOQ Generation | Bill of Quantities generation | High |
| HITL Integration | Human-in-the-loop for low confidence | Medium |

---

## 3. Test Structure

### 3.1 Workflow Parts

```javascript
export const testMetadata = {
  workflow: '02025-quantity-surveying',
  name: 'Quantity Surveying (02025) Full Workflow',
  description: 'Complete QS workflow from drawing upload to BOQ generation',
  parts: [
    {
      id: 'part_1_drawing_management',
      name: 'Part 1: Drawing Management',
      description: 'Upload, view, and manage drawings',
      sourceFile: '02025-drawings-tab.js',
      mockScenarios: [...],
      genericTests: [...]
    },
    {
      id: 'part_2_measurement_management',
      name: 'Part 2: Measurement Management',
      description: 'Add, validate, and manage measurements',
      sourceFile: '02025-measurements-tab.js',
      mockScenarios: [...],
      genericTests: [...]
    },
    {
      id: 'part_3_opencv_extraction',
      name: 'Part 3: OpenCV Dimension Extraction',
      description: 'AI-powered dimension extraction from drawings',
      sourceFile: 'quantity-surveying-opencv-simulator.js',
      mockScenarios: [...],
      genericTests: [...]
    },
    {
      id: 'part_4_vl_analysis',
      name: 'Part 4: Vision-Language Analysis',
      description: 'Kimi K2.5 / Qwen VL analysis for interpretation',
      sourceFile: '02025-drawing-analysis-tab.js',
      mockScenarios: [...],
      genericTests: [...]
    },
    {
      id: 'part_5_boq_generation',
      name: 'Part 5: BOQ Generation',
      description: 'Bill of Quantities compilation and export',
      sourceFile: '02025-reports-tab.js',
      mockScenarios: [...],
      genericTests: [...]
    }
  ]
};
```

---

## 4. Mock Scenarios

### 4.1 Part 1: Drawing Management

| Scenario | Description | Mock Data |
|----------|-------------|-----------|
| Architectural Drawing | Standard architectural plan | `discipline: 'Architectural', scale: '1:100'` |
| Structural Drawing | Structural engineering drawing | `discipline: 'Structural', scale: '1:50'` |
| Electrical Plan | Electrical layout drawing | `discipline: 'Electrical', scale: '1:200'` |
| Multi-revision Drawing | Drawing with multiple revisions | `revision: 'C', previous_revisions: ['A', 'B']` |

### 4.2 Part 2: Measurement Management

| Scenario | Description | Mock Data |
|----------|-------------|-----------|
| Length Measurement | Linear dimension | `type: 'Length', value: '12.45m'` |
| Area Measurement | Surface area | `type: 'Area', value: '156.8m²'` |
| Volume Measurement | Cubic volume | `type: 'Volume', value: '850.3m³'` |
| Count Measurement | Item count | `type: 'Count', value: '25'` |

### 4.3 Part 3: OpenCV Dimension Extraction

| Scenario | Description | Mock Data |
|----------|-------------|-----------|
| High Confidence Extraction | Clear dimensions, high accuracy | `confidence: 0.95, auto_accept: true` |
| Medium Confidence Extraction | Partial clarity, needs review | `confidence: 0.75, hitl_required: true` |
| Low Confidence Extraction | Unclear, manual intervention needed | `confidence: 0.45, hitl_required: true` |
| Multi-scale Drawing | Mixed scales on one drawing | `scales: ['1:50', '1:100', '1:200']` |

### 4.4 Part 4: Vision-Language Analysis

| Scenario | Description | Mock Data |
|----------|-------------|-----------|
| Standard BOQ Analysis | Typical BOQ generation | `prompt: 'Quantity surveying BOQ'` |
| Specification Extraction | Extract specs from drawing | `prompt: 'Extract specifications'` |
| Material Take-off | Material quantities | `prompt: 'Material take-off'` |
| Anomaly Detection | Identify discrepancies | `prompt: 'Detect anomalies'` |

### 4.5 Part 5: BOQ Generation

| Scenario | Description | Mock Data |
|----------|-------------|-----------|
| Standard BOQ | Complete BOQ document | `format: 'ASAQS', items: 150` |
| Partial BOQ | Incomplete measurements | `completeness: 0.75` |
| Multi-discipline BOQ | Combined disciplines | `disciplines: ['Arch', 'Struct', 'Elec']` |
| Export Formats | PDF, Excel, CSV | `format: 'pdf', 'xlsx', 'csv'` |

---

## 5. Test Implementation

### 5.1 Part 1: Drawing Management Tests

```javascript
describe('Part 1: Drawing Management', () => {
  describe('Scenario: Architectural Drawing', () => {
    const mockData = testMetadata.parts[0].mockScenarios[0].mockData;
    
    test('Drawing uploads successfully', async () => {
      const result = await uploadDrawing(mockData);
      expect(result.success).toBe(true);
      expect(result.drawing.id).toBeDefined();
    });

    test('Drawing metadata saved correctly', async () => {
      const drawing = await getDrawing(result.drawing.id);
      expect(drawing.discipline).toBe('Architectural');
      expect(drawing.scale).toBe('1:100');
    });

    test('Drawing appears in list', async () => {
      const drawings = await listDrawings();
      expect(drawings).toContainEqual(expect.objectContaining({
        discipline: 'Architectural'
      }));
    });

    test('Drawing can be deleted', async () => {
      const result = await deleteDrawing(mockData.id);
      expect(result.success).toBe(true);
    });
  });
});
```

### 5.2 Part 2: Measurement Management Tests

```javascript
describe('Part 2: Measurement Management', () => {
  describe('Scenario: Length Measurement', () => {
    const mockData = {
      type: 'Length',
      value: '12.45',
      unit: 'm',
      drawingId: 1,
      standard: 'ASAQS'
    };
    
    test('Measurement validates against ASAQS', async () => {
      const validation = await validateMeasurement(mockData);
      expect(validation.valid).toBe(true);
      expect(validation.standard).toBe('ASAQS');
    });

    test('Measurement saves to database', async () => {
      const result = await saveMeasurement(mockData);
      expect(result.id).toBeDefined();
    });

    test('Measurement appears in drawing measurements', async () => {
      const measurements = await getMeasurementsForDrawing(mockData.drawingId);
      expect(measurements).toContainEqual(expect.objectContaining({
        type: 'Length'
      }));
    });
  });
});
```

### 5.3 Part 3: OpenCV Dimension Extraction Tests

```javascript
describe('Part 3: OpenCV Dimension Extraction', () => {
  describe('Scenario: High Confidence Extraction', () => {
    const mockData = {
      drawingId: 1,
      extractionMode: 'opencv',
      confidenceThreshold: 0.85
    };
    
    test('OpenCV processes drawing', async () => {
      const result = await runOpenCVExtraction(mockData);
      expect(result.status).toBe('completed');
    });

    test('Dimensions extracted with high confidence', async () => {
      const dimensions = await getExtractedDimensions(mockData.drawingId);
      dimensions.forEach(dim => {
        expect(dim.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    test('High confidence dimensions auto-accepted', async () => {
      const dimensions = await getExtractedDimensions(mockData.drawingId);
      const highConfidence = dimensions.filter(d => d.confidence >= 0.85);
      highConfidence.forEach(dim => {
        expect(dim.status).toBe('auto_accepted');
      });
    });
  });

  describe('Scenario: Medium Confidence Extraction', () => {
    const mockData = {
      drawingId: 2,
      extractionMode: 'opencv',
      confidenceThreshold: 0.75
    };
    
    test('Medium confidence triggers HITL', async () => {
      const dimensions = await getExtractedDimensions(mockData.drawingId);
      const mediumConfidence = dimensions.filter(d => 
        d.confidence >= 0.60 && d.confidence < 0.85
      );
      mediumConfidence.forEach(dim => {
        expect(dim.hitl_required).toBe(true);
      });
    });
  });
});
```

### 5.4 Part 4: Vision-Language Analysis Tests

```javascript
describe('Part 4: Vision-Language Analysis', () => {
  describe('Scenario: Standard BOQ Analysis', () => {
    const mockData = {
      drawings: [{ id: 1, name: 'Building Plan A' }],
      prompt: 'Quantity surveying BOQ',
      standard: 'ASAQS'
    };
    
    test('VL analysis initiates', async () => {
      const result = await initiateVLAnalysis(mockData);
      expect(result.status).toBe('processing');
    });

    test('BOQ items extracted', async () => {
      const boq = await getBOQResults(mockData);
      expect(boq.items.length).toBeGreaterThan(0);
    });

    test('Items categorized by trade', async () => {
      const boq = await getBOQResults(mockData);
      boq.items.forEach(item => {
        expect(item.trade).toBeDefined();
      });
    });
  });
});
```

### 5.5 Part 5: BOQ Generation Tests

```javascript
describe('Part 5: BOQ Generation', () => {
  describe('Scenario: Standard BOQ', () => {
    const mockData = {
      projectId: 'proj-001',
      format: 'ASAQS',
      includeAllDrawings: true
    };
    
    test('BOQ compiles all measurements', async () => {
      const boq = await generateBOQ(mockData);
      expect(boq.total_items).toBeGreaterThan(0);
    });

    test('BOQ exports to PDF', async () => {
      const exportResult = await exportBOQ(mockData, 'pdf');
      expect(exportResult.format).toBe('pdf');
      expect(exportResult.url).toBeDefined();
    });

    test('BOQ exports to Excel', async () => {
      const exportResult = await exportBOQ(mockData, 'xlsx');
      expect(exportResult.format).toBe('xlsx');
    });
  });
});
```

---

## 6. Standards Validation

### 6.1 Supported Standards

| Standard | Code | Description |
|----------|------|-------------|
| ASAQS | `ASAQS` | Association of South African Quantity Surveyors |
| SANS | `SANS` | South African National Standards |
| NRM | `NRM` | New Rules of Measurement (UK) |
| POMI | `POMI` | Principles of Measurement International |

### 6.2 Validation Rules

```javascript
const validationRules = {
  ASAQS: {
    length: { units: ['m', 'mm'], precision: 2 },
    area: { units: ['m²'], precision: 2 },
    volume: { units: ['m³'], precision: 3 },
    count: { units: ['nr', 'ea'], precision: 0 }
  },
  SANS: {
    length: { units: ['m', 'mm'], precision: 2 },
    area: { units: ['m²'], precision: 2 },
    volume: { units: ['m³'], precision: 3 }
  }
};
```

---

## 7. HITL Integration

### 7.1 Confidence Thresholds

| Confidence Level | Action | HITL Required |
|------------------|--------|---------------|
| ≥ 85% | Auto-accept | No |
| 60-84% | Queue for review | Yes |
| < 60% | Flag for manual entry | Yes |

### 7.2 HITL Workflow

```
┌─────────────────┐
│ OpenCV/VL       │
│ Extraction      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ≥85%      ┌─────────────────┐
│ Confidence      │──────────────▶│ Auto-Accept     │
│ Check           │               │ Measurement     │
└────────┬────────┘               └─────────────────┘
         │
         │ 60-84%
         ▼
┌─────────────────┐
│ HITL Queue      │
│ (QS Review)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ QS Approves/    │
│ Corrects        │
└─────────────────┘
```

---

## 8. Test File Location

```
/server/src/tests/02025_quantity_surveying/
├── README.md
├── 02025_drawing_management.test.js
├── 02025_measurement_management.test.js
├── 02025_opencv_extraction.test.js
├── 02025_vl_analysis.test.js
├── 02025_boq_generation.test.js
└── fixtures/
    ├── sample_drawings.json
    └── sample_measurements.json
```

---

## 9. Running Tests

```bash
# Run all QS tests
npm test -- server/src/tests/02025_quantity_surveying/

# Run specific test file
npm test -- server/src/tests/02025_quantity_surveying/02025_opencv_extraction.test.js

# Run with coverage
npm test -- --coverage server/src/tests/02025_quantity_surveying/
```

---

## 10. Related Documents

| Document | Location |
|----------|----------|
| Testing Framework | `docs/workflows-simulations/TESTING_FRAMEWORK.md` |
| Testing Dashboard Procedure | `docs/workflows-simulations/0000_TESTING_DASHBOARD_PROCEDURE.md` |
| Workflow Optimization Guide | `deep-agents/docs/0000_WORKFLOW_OPTIMIZATION_GUIDE.md` |

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-20 | Testing Team | Initial QS testing guide |