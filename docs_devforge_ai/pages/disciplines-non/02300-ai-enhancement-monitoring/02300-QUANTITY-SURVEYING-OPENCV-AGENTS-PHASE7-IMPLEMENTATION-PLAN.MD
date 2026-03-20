# 02300 Quantity Surveying OpenCV Agents - Phase 7 Implementation Plan

## Phase 7: Training & Validation

**Document Status**: 🚀 IMPLEMENTATION IN PROGRESS  
**Created**: 2026-01-28T19:30:00Z  
**Last Updated**: 2026-01-28T19:30:00Z  
**Author**: Cline AI (ConstructAI)  
**Approval**: Phase 6 Complete - Ready for Phase 7

---

## Executive Summary

### **🎯 Phase 7 Objectives**

Phase 7 completes the Quantity Surveying OpenCV + Qwen3-VL implementation by:
1. **Executing end-to-end simulations** on real drawing data
2. **Generating comprehensive Parquet datasets** for training
3. **Validating QS measurement accuracy** against manual benchmarks
4. **Setting up continual learning pipeline** for model improvements
5. **Optimizing performance** for production deployment

### **Success Criteria**

- ✅ **End-to-end simulations**: 100+ drawings processed successfully
- ✅ **Dataset generation**: 15,000+ Parquet samples with ground truth
- ✅ **Accuracy validation**: >93% measurement accuracy vs. manual QS
- ✅ **Continual learning**: Pipeline operational with weekly updates
- ✅ **Performance**: <60s processing time per drawing
- ✅ **Production readiness**: All systems deployed and monitored

---

## Prerequisites & Assumptions

### **Required Components (From Previous Phases)**

#### **✅ Phase 4: Real Implementations (COMPLETED)**
- **Real OpenCV**: Canvas-based image processing (18.8 KB)
- **Real Tesseract.js**: OCR with worker pool (21.7 KB)
- **Real Qwen3-VL API**: API client architecture (21.9 KB)
- **Updated cv2-drawing-utils.js**: All integrations (41.0 KB)
- **Test Suite**: Comprehensive testing (13.8 KB)
- **Verification**: All checks passing

#### **✅ Phase 5: Customer-Specific Training (COMPLETED)**
- **Training Framework**: Parallel training infrastructure
- **Customer Repositories**: GitHub + Hugging Face structure
- **Pilot Training**: 5 specialist agents trained
- **Model Deployment**: Versioning and deployment pipeline
- **Documentation**: Complete technical details

#### **✅ Phase 6: UI Integration (COMPLETED)**
- **Workflow Definition**: 6-stage workflow JSON
- **CLI Runner**: Command-line simulation tool
- **Simulator Framework**: 1194-line simulator
- **UI Components**: React components for customer selection
- **Database Integration**: Supabase CRUD operations
- **Status Summary**: All deliverables documented

### **Phase 7 Dependencies**

#### **Drawing Dataset**
- **Source**: Customer drawings (PNG/PDF)
- **Format**: Architectural plans with manual measurements
- **Volume**: 100+ drawings for training and validation
- **Ground Truth**: Manual QS measurements for comparison

#### **Hardware Requirements**
- **GPU**: RunPod serverless GPU for training (RTX 4090 or A100)
- **Storage**: 500GB for datasets and models
- **Memory**: 16GB+ RAM for processing
- **Network**: High-speed for dataset downloads

#### **API Access**
- **Qwen3-VL**: API key for production inference
- **Hugging Face**: Access for dataset storage
- **GitHub**: Access for model deployment
- **Supabase**: Database credentials

---

## Phase 7 Implementation Plan

### **Overall Timeline**: Week 7-8 (2 weeks)
```
Week 7: Data Preparation & Initial Simulations
Week 8: Validation, Optimization & Production Deployment
```

---

## Implementation Tasks

### **Task 7.1: Drawing Dataset Preparation**

#### **7.1.1: Collect Test Drawings**
**Objective**: Gather 100+ architectural drawings for simulation and validation

**Actions**:
1. **Customer drawings** (60 drawings)
   - Request drawings from pilot customers
   - Include variety: residential, commercial, industrial
   - Different scales: 1:50, 1:100, 1:200
   - Multiple formats: PNG, JPG, PDF

2. **Public dataset drawings** (30 drawings)
   - Download from FloorPlanCAD via Hugging Face
   - Extract SVG annotations to PNG
   - Generate synthetic manual measurements

3. **Simulation-generated drawings** (10 drawings)
   - Use cv2-drawing-utils.js to create test drawings
   - Add synthetic dimensions and annotations
   - Generate ground truth measurements

**Deliverables**:
- `drawings/dataset/train/` (60 drawings for training)
- `drawings/dataset/validate/` (20 drawings for validation)
- `drawings/dataset/test/` (20 drawings for testing)
- `drawings/dataset/ground_truth/` (Manual measurements in JSON)

**File Structure**:
```
agents/pages/02025_quantity_surveying/drawings/
├── dataset/
│   ├── train/
│   │   ├── residential_01.png
│   │   ├── commercial_01.png
│   │   └── ... (60 files)
│   ├── validate/
│   │   └── ... (20 files)
│   ├── test/
│   │   └── ... (20 files)
│   └── ground_truth/
│       ├── residential_01.json
│       ├── commercial_01.json
│       └── ... (100 files)
└── reference/
    └── scale_samples/ (Scale bar images for calibration testing)
```

**Success Criteria**:
- ✅ 100+ drawings collected
- ✅ Variety of building types represented
- ✅ Ground truth measurements for all drawings
- ✅ Proper directory structure established

**Estimated Time**: 2-3 days

---

### **Task 7.2: End-to-End Simulation Execution**

#### **7.2.1: Configure Simulation Runner**
**Objective**: Set up and execute simulations on test drawing dataset

**Configuration**:
```javascript
// agents/simulation/phase7-config.js
const phase7Config = {
  // Simulation settings
  executionMode: 'production', // or 'test', 'validation'
  batchSize: 10, // Process 10 drawings at a time
  maxConcurrent: 3, // 3 concurrent simulations
  
  // Input settings
  inputDirectory: 'agents/pages/02025_quantity_surveying/drawings/dataset',
  inputFormats: ['png', 'jpg', 'jpeg'],
  validationRequired: true,
  
  // Processing settings
  stages: ['preprocess', 'cv_extraction', 'vl_analysis', 'volume_calc', 'validation'],
  generateDocumentation: true,
  exportResults: true,
  
  // Output settings
  outputDirectory: 'agents/simulation/results/phase7',
  exportFormats: ['json', 'parquet', 'csv'],
  includeMetadata: true,
  
  // Performance monitoring
  trackMetrics: true,
  logLevel: 'detailed',
  saveExecutionHistory: true
};
```

#### **7.2.2: Execute Training Set Simulations**
**Objective**: Process 60 training drawings to generate initial datasets

**Execution Script**:
```javascript
// scripts/run-phase7-training-simulations.js
import { QSSimulationRunner } from './run-qs-simulation.js';
import fs from 'fs';
import path from 'path';

async function runPhase7TrainingSimulations() {
  console.log('🚀 Starting Phase 7 Training Simulations');
  console.log('=' .repeat(80));
  
  const config = {
    customerId: 'pilot_customer',
    standard: 'AAQS_2015',
    outputDir: 'agents/simulation/results/phase7/training',
    verbose: true,
    generateParquet: true
  };
  
  const runner = new QSSimulationRunner();
  const results = [];
  
  try {
    // Get list of training drawings
    const drawingsDir = 'agents/pages/02025_quantity_surveying/drawings/dataset/train';
    const drawings = fs.readdirSync(drawingsDir).filter(f => 
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
    );
    
    console.log(`📁 Found ${drawings.length} training drawings`);
    
    // Process each drawing
    for (let i = 0; i < drawings.length; i++) {
      const drawing = drawings[i];
      const drawingPath = path.join(drawingsDir, drawing);
      
      console.log(`\n📄 Processing ${i + 1}/${drawings.length}: ${drawing}`);
      
      // Execute simulation
      const result = await runner.runWithRetry(drawingPath, config);
      
      // Store result
      results.push({
        drawing: drawing,
        success: result.success,
        executionId: result.executionId,
        measurementsCount: result.data?.measurements?.length || 0,
        qualityScore: result.data?.qualityScore,
        duration: result.duration
      });
      
      // Save individual result
      const resultFile = path.join(config.outputDir, `${result.executionId}_results.json`);
      fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
      console.log(`   ✓ Result saved: ${result.executionId}`);
    }
    
    // Generate summary report
    const summary = {
      timestamp: new Date().toISOString(),
      totalDrawings: drawings.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgMeasurements: results.filter(r => r.success).reduce((sum, r) => sum + r.measurementsCount, 0) / results.filter(r => r.success).length,
      avgQualityScore: results.filter(r => r.success).reduce((sum, r) => sum + (r.qualityScore || 0), 0) / results.filter(r => r.success).length,
      avgDuration: results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length
    };
    
    // Save summary
    const summaryFile = path.join(config.outputDir, 'training_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 TRAINING SIMULATION SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total Drawings Processed: ${summary.totalDrawings}`);
    console.log(`Successful: ${summary.successful} (${(summary.successful / summary.totalDrawings * 100).toFixed(1)}%)`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Avg Measurements per Drawing: ${summary.avgMeasurements.toFixed(1)}`);
    console.log(`Avg Quality Score: ${summary.avgQualityScore.toFixed(3)}`);
    console.log(`Avg Duration: ${summary.avgDuration.toFixed(0)}ms`);
    console.log(`Results saved to: ${config.outputDir}`);
    console.log('=' .repeat(80));
    
    return summary;
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
    throw error;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase7TrainingSimulations();
}

export { runPhase7TrainingSimulations };
```

**Success Criteria**:
- ✅ 60/60 training drawings processed successfully
- ✅ Each drawing generates results JSON and Parquet files
- ✅ Summary report with metrics generated
- ✅ Average processing time <60s per drawing

**Estimated Time**: 1 day (including processing)

---

### **Task 7.3: Validation Set Simulations**

#### **7.3.1: Execute Validation Simulations**
**Objective**: Process 20 validation drawings for accuracy measurement

**Execution**:
```javascript
// scripts/run-phase7-validation-simulations.js
import { QSSimulationRunner } from './run-qs-simulation.js';
import fs from 'fs';
import path from 'path';

async function runPhase7ValidationSimulations() {
  console.log('🔍 Starting Phase 7 Validation Simulations');
  
  const config = {
    customerId: 'pilot_customer',
    standard: 'AAQS_2015',
    outputDir: 'agents/simulation/results/phase7/validation',
    verbose: true,
    generateParquet: true
  };
  
  const runner = new QSSimulationRunner();
  
  // Get validation drawings
  const drawingsDir = 'agents/pages/02025_quantity_surveying/drawings/dataset/validate';
  const drawings = fs.readdirSync(drawingsDir).filter(f => 
    f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
  );
  
  // Get ground truth measurements
  const groundTruthDir = 'agents/pages/02025_quantity_surveying/drawings/dataset/ground_truth';
  
  const validationResults = [];
  
  for (const drawing of drawings) {
    const drawingPath = path.join(drawingsDir, drawing);
    const groundTruthPath = path.join(groundTruthDir, drawing.replace(/\.(png|jpg|jpeg)$/, '.json'));
    
    // Load ground truth
    let groundTruth = null;
    if (fs.existsSync(groundTruthPath)) {
      groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));
    }
    
    // Execute simulation
    const result = await runner.runWithRetry(drawingPath, config);
    
    // Compare with ground truth
    const comparison = compareWithGroundTruth(result, groundTruth);
    
    validationResults.push({
      drawing: drawing,
      success: result.success,
      groundTruthPresent: groundTruth !== null,
      ...comparison
    });
  }
  
  // Calculate overall metrics
  const overallMetrics = calculateValidationMetrics(validationResults);
  
  // Save validation report
  const report = {
    timestamp: new Date().toISOString(),
    results: validationResults,
    metrics: overallMetrics,
    configuration: config
  };
  
  fs.writeFileSync(
    path.join(config.outputDir, 'validation_report.json'),
    JSON.stringify(report, null, 2)
  );
  
  return overallMetrics;
}

function compareWithGroundTruth(simulationResult, groundTruth) {
  if (!groundTruth || !simulationResult.success) {
    return { accuracy: 0, error: 'Missing data' };
  }
  
  const simulated = simulationResult.data.measurements || [];
  const manual = groundTruth.measurements || [];
  
  // Element-by-element comparison
  const comparisons = [];
  
  for (const manualItem of manual) {
    const simulatedItem = simulated.find(s => 
      s.element === manualItem.element || 
      (s.type && manualItem.type && s.type === manualItem.type)
    );
    
    if (simulatedItem) {
      const manualValue = manualItem.volume || manualItem.area || manualItem.length || 0;
      const simulatedValue = simulatedItem.volume || simulatedItem.area || simulatedItem.length || 0;
      
      if (manualValue > 0) {
        const error = Math.abs(simulatedValue - manualValue) / manualValue;
        comparisons.push({
          element: manualItem.element,
          manualValue,
          simulatedValue,
          error,
          withinTolerance: error <= 0.05 // 5% tolerance
        });
      }
    }
  }
  
  // Calculate accuracy metrics
  const totalElements = comparisons.length;
  const withinTolerance = comparisons.filter(c => c.withinTolerance).length;
  const accuracy = totalElements > 0 ? (withinTolerance / totalElements) : 0;
  
  // Calculate mean absolute percentage error
  const mape = comparisons.reduce((sum, c) => sum + c.error, 0) / (comparisons.length || 1);
  
  return {
    accuracy,
    mape,
    totalElements,
    withinTolerance,
    comparisons
  };
}

function calculateValidationMetrics(validationResults) {
  const successfulResults = validationResults.filter(r => r.success && r.groundTruthPresent);
  
  if (successfulResults.length === 0) {
    return {
      overallAccuracy: 0,
      avgMAPE: 0,
      totalDrawings: validationResults.length,
      successful: 0,
      hasGroundTruth: 0
    };
  }
  
  const overallAccuracy = successfulResults.reduce((sum, r) => sum + r.accuracy, 0) / successfulResults.length;
  const avgMAPE = successfulResults.reduce((sum, r) => sum + r.mape, 0) / successfulResults.length;
  
  return {
    overallAccuracy,
    avgMAPE,
    totalDrawings: validationResults.length,
    successful: successfulResults.length,
    hasGroundTruth: successfulResults.filter(r => r.groundTruthPresent).length,
    accuracyDistribution: {
      excellent: successfulResults.filter(r => r.accuracy >= 0.95).length,
      good: successfulResults.filter(r => r.accuracy >= 0.85 && r.accuracy < 0.95).length,
      acceptable: successfulResults.filter(r => r.accuracy >= 0.70 && r.accuracy < 0.85).length,
      poor: successfulResults.filter(r => r.accuracy < 0.70).length
    }
  };
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase7ValidationSimulations();
}

export { runPhase7ValidationSimulations };
```

**Success Criteria**:
- ✅ 20/20 validation drawings processed
- ✅ Ground truth comparisons completed
- ✅ Accuracy metrics calculated (>93% target)
- ✅ Validation report generated

**Estimated Time**: 1 day

---

### **Task 7.4: Parquet Dataset Generation**

#### **7.4.1: Generate Training Parquet Dataset**
**Objective**: Create comprehensive Parquet dataset for continual learning

**Dataset Schema**:
```sql
-- Parquet Schema for QS Training Data
CREATE TABLE qs_training_data (
    -- Image Information
    image_path VARCHAR(255),      -- Relative path to drawing image
    image_id VARCHAR(100),        -- Unique drawing identifier
    image_format VARCHAR(10),     -- png, jpg, jpeg
    image_size INT,               -- File size in bytes
    
    -- Drawing Metadata
    drawing_type VARCHAR(50),     -- residential, commercial, industrial
    scale VARCHAR(20),            -- 1:50, 1:100, 1:200
    standard VARCHAR(20),         -- AAQS_2015, SMM7, NRM1
    customer_id VARCHAR(100),     -- Customer identifier
    project_id VARCHAR(100),      -- Project identifier
    
    -- Input Prompt
    prompt VARCHAR(500),          -- Extraction instructions
    
    -- Simulation Results
    response_json VARCHAR(5000),  -- JSON string with measurements
    measurements_count INT,       -- Number of elements measured
    quality_score FLOAT,          -- Quality score (0-1)
    
    -- Ground Truth Comparison
    ground_truth_json VARCHAR(5000),  -- Manual measurements JSON
    accuracy FLOAT,               -- Accuracy vs ground truth
    mape FLOAT,                   -- Mean absolute percentage error
    
    -- Processing Metadata
    execution_id VARCHAR(100),    -- Simulation execution ID
    processing_time_ms INT,       -- Processing duration
    timestamp VARCHAR(50),        -- ISO timestamp
    
    -- Agent Information
    agents_used VARCHAR(200),     -- List of agents used
    cv_extraction_time_ms INT,    -- OpenCV processing time
    vl_analysis_time_ms INT,      -- Qwen3-VL analysis time
    
    -- Quality Flags
    requires_review BOOLEAN,      -- Requires human review
    confidence_below_threshold BOOLEAN,  -- Low confidence flag
    missing_height_data BOOLEAN   -- Cross-DWG height missing
    
    -- Additional Metadata
    metadata_json VARCHAR(2000)   -- Additional information
);
```

**Generation Script**:
```javascript
// scripts/generate-parquet-dataset.js
import fs from 'fs';
import path from 'path';

async function generateParquetDataset() {
  console.log('📦 Generating Parquet Dataset for Phase 7');
  console.log('=' .repeat(80));
  
  const dataset = [];
  
  // 1. Process training results
  const trainingResultsDir = 'agents/simulation/results/phase7/training';
  const trainingFiles = fs.readdirSync(trainingResultsDir).filter(f => f.endsWith('_results.json'));
  
  console.log(`📊 Processing ${trainingFiles.length} training results...`);
  
  for (const file of trainingFiles) {
    const resultPath = path.join(trainingResultsDir, file);
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    
    // Find ground truth for this drawing
    const drawingName = file.replace('_results.json', '').replace(/sim_\d+_/, '');
    const groundTruthPath = `agents/pages/02025_quantity_surveying/drawings/dataset/ground_truth/${drawingName}.json`;
    const groundTruth = fs.existsSync(groundTruthPath) ? 
      JSON.parse(fs.readFileSync(groundTruthPath, 'utf8')) : null;
    
    // Calculate accuracy if ground truth exists
    let accuracy = null;
    let mape = null;
    
    if (groundTruth && result.data.measurements) {
      const comparison = compareMeasurements(result.data.measurements, groundTruth.measurements);
      accuracy = comparison.accuracy;
      mape = comparison.mape;
    }
    
    // Create dataset entry
    const entry = {
      image_path: `drawings/dataset/train/${drawingName}.png`,
      image_id: drawingName,
      image_format: 'png',
      image_size: fs.statSync(`agents/pages/02025_quantity_surveying/drawings/dataset/train/${drawingName}.png`).size,
      
      drawing_type: drawingName.includes('residential') ? 'residential' : 
                    drawingName.includes('commercial') ? 'commercial' : 'industrial',
      scale: '1:100', // Default, could be extracted from OCR
      standard: 'AAQS_2015',
      customer_id: 'pilot_customer',
      project_id: result.executionId,
      
      prompt: 'Extract QS measurements per center-line rules from drawing',
      
      response_json: JSON.stringify(result.data.measurements || []),
      measurements_count: result.data.measurements?.length || 0,
      quality_score: result.data.qualityScore || null,
      
      ground_truth_json: groundTruth ? JSON.stringify(groundTruth.measurements || []) : null,
      accuracy: accuracy,
      mape: mape,
      
      execution_id: result.executionId,
      processing_time_ms: result.duration,
      timestamp: new Date().toISOString(),
      
      agents_used: 'coordinator,concrete,masonry,steel,roofing,finishes',
      cv_extraction_time_ms: result.metrics?.stageDurations?.['02_feature_extraction'] || 0,
      vl_analysis_time_ms: result.metrics?.stageDurations?.['04_qwen_vl_analysis'] || 0,
      
      requires_review: (result.data.qualityScore || 0) < 0.85,
      confidence_below_threshold: (result.data.qualityScore || 0) < 0.70,
      missing_height_data: false,
      
      metadata_json: JSON.stringify({
        executionId: result.executionId,
        customerId: 'pilot_customer',
        standard: 'AAQS_2015',
        drawingType: drawingName.includes('residential') ? 'residential' : 
                     drawingName.includes('commercial') ? 'commercial' : 'industrial'
      })
    };
    
    dataset.push(entry);
  }
  
  // 2. Process validation results
  const validationResultsDir = 'agents/simulation/results/phase7/validation';
  const validationFiles = fs.readdirSync(validationResultsDir).filter(f => f.endsWith('_results.json'));
  
  console.log(`📊 Processing ${validationFiles.length} validation results...`);
  
  for (const file of validationFiles) {
    const resultPath = path.join(validationResultsDir, file);
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    
    // Find ground truth for this drawing
    const drawingName = file.replace('_results.json', '').replace(/sim_\d+_/, '');
    const groundTruthPath = `agents/pages/02025_quantity_surveying/drawings/dataset/ground_truth/${drawingName}.json`;
    const groundTruth = fs.existsSync(groundTruthPath) ? 
      JSON.parse(fs.readFileSync(groundTruthPath, 'utf8')) : null;
    
    // Calculate accuracy
    let accuracy = null;
    let mape = null;
    
    if (groundTruth && result.data.measurements) {
      const comparison = compareMeasurements(result.data.measurements, groundTruth.measurements);
      accuracy = comparison.accuracy;
      mape = comparison.mape;
    }
    
    // Create dataset entry
    const entry = {
      image_path: `drawings/dataset/validate/${drawingName}.png`,
      image_id: drawingName,
      image_format: 'png',
      image_size: fs.statSync(`agents/pages/02025_quantity_surveying/drawings/dataset/validate/${drawingName}.png`).size,
      
      drawing_type: drawingName.includes('residential') ? 'residential' : 
                    drawingName.includes('commercial') ? 'commercial' : 'industrial',
      scale: '1:100',
      standard: 'AAQS_2015',
      customer_id: 'pilot_customer',
      project_id: result.executionId,
      
      prompt: 'Extract QS measurements per center-line rules from drawing',
      
      response_json: JSON.stringify(result.data.measurements || []),
      measurements_count: result.data.measurements?.length || 0,
      quality_score: result.data.qualityScore || null,
      
      ground_truth_json: groundTruth ? JSON.stringify(groundTruth.measurements || []) : null,
      accuracy: accuracy,
      mape: mape,
      
      execution_id: result.executionId,
      processing_time_ms: result.duration,
      timestamp: new Date().toISOString(),
      
      agents_used: 'coordinator,concrete,masonry,steel,roofing,finishes',
      cv_extraction_time_ms: result.metrics?.stageDurations?.['02_feature_extraction'] || 0,
      vl_analysis_time_ms: result.metrics?.stageDurations?.['04_qwen_vl_analysis'] || 0,
      
      requires_review: (result.data.qualityScore || 0) < 0.85,
      confidence_below_threshold: (result.data.qualityScore || 0) < 0.70,
      missing_height_data: false,
      
      metadata_json: JSON.stringify({
        executionId: result.executionId,
        customerId: 'pilot_customer',
        standard: 'AAQS_2015',
        drawingType: drawingName.includes('residential') ? 'residential' : 
                     drawingName.includes('commercial') ? 'commercial' : 'industrial'
      })
    };
    
    dataset.push(entry);
  }
  
  // 3. Save dataset
  const datasetDir = 'agents/simulation/datasets/phase7';
  if (!fs.existsSync(datasetDir)) {
    fs.mkdirSync(datasetDir, { recursive: true });
  }
  
  const datasetFile = path.join(datasetDir, 'qs_training_data.json');
  fs.writeFileSync(datasetFile, JSON.stringify(dataset, null, 2));
  
  // 4. Generate Parquet file (using parquet library)
  try {
    const { ParquetWriter, ParquetSchema } = await import('parquetjs');
    
    // Define schema
    const schema = new ParquetSchema({
      image_path: { type: 'UTF8' },
      image_id: { type: 'UTF8' },
      image_format: { type: 'UTF8' },
      image_size: { type: 'INT64' },
      drawing_type: { type: 'UTF8' },
      scale: { type: 'UTF8' },
      standard: { type: 'UTF8' },
      customer_id: { type: 'UTF8' },
      project_id: { type: 'UTF8' },
      prompt: { type: 'UTF8', compression: 'GZIP' },
      response_json: { type: 'UTF8', compression: 'GZIP' },
      measurements_count: { type: 'INT32' },
      quality_score: { type: 'DOUBLE' },
      ground_truth_json: { type: 'UTF8', compression: 'GZIP' },
      accuracy: { type: 'DOUBLE' },
      mape: { type: 'DOUBLE' },
      execution_id: { type: 'UTF8' },
      processing_time_ms: { type: 'INT32' },
      timestamp: { type: 'UTF8' },
      agents_used: { type: 'UTF8' },
      cv_extraction_time_ms: { type: 'INT32' },
      vl_analysis_time_ms: { type: 'INT32' },
      requires_review: { type: 'BOOLEAN' },
      confidence_below_threshold: { type: 'BOOLEAN' },
      missing_height_data: { type: 'BOOLEAN' },
      metadata_json: { type: 'UTF8', compression: 'GZIP' }
    });
    
    // Write Parquet file
    const parquetFile = path.join(datasetDir, 'qs_training_data.parquet');
    const writer = await ParquetWriter.openFile(schema, parquetFile);
    
    for (const row of dataset) {
      await writer.appendRow(row);
    }
    
    await writer.close();
    
    console.log(`✅ Parquet dataset generated: ${parquetFile}`);
    console.log(`   Total rows: ${dataset.length}`);
    console.log(`   File size: ${(fs.statSync(parquetFile).size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.warn('⚠️ Parquet generation failed, saving JSON only:', error.message);
  }
  
  // 5. Generate dataset statistics
  const stats = {
    totalRows: dataset.length,
    trainingRows: trainingFiles.length,
    validationRows: validationFiles.length,
    accuracyStats: {
      avgAccuracy: dataset.filter(r => r.accuracy !== null).reduce((sum, r) => sum + r.accuracy, 0) / 
                   dataset.filter(r => r.accuracy !== null).length,
      avgMAPE: dataset.filter(r => r.mape !== null).reduce((sum, r) => sum + r.mape, 0) / 
               dataset.filter(r => r.mape !== null).length,
      rowsWithGroundTruth: dataset.filter(r => r.accuracy !== null).length
    },
    qualityStats: {
      avgMeasurements: dataset.reduce((sum, r) => sum + r.measurements_count, 0) / dataset.length,
      avgQualityScore: dataset.filter(r => r.quality_score !== null).reduce((sum, r) => sum + r.quality_score, 0) / 
                       dataset.filter(r => r.quality_score !== null).length,
      requiresReview: dataset.filter(r => r.requires_review).length
    },
    performanceStats: {
      avgProcessingTime: dataset.reduce((sum, r) => sum + r.processing_time_ms, 0) / dataset.length,
      totalProcessingTime: dataset.reduce((sum, r) => sum + r.processing_time_ms, 0)
    }
  };
  
  const statsFile = path.join(datasetDir, 'dataset_statistics.json');
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  
  console.log('\n' + '=' .repeat(80));
  console.log('📊 DATASET STATISTICS');
  console.log('=' .repeat(80));
  console.log(`Total Rows: ${stats.totalRows}`);
  console.log(`Training Rows: ${stats.trainingRows}`);
  console.log(`Validation Rows: ${stats.validationRows}`);
  console.log(`Rows with Ground Truth: ${stats.accuracyStats.rowsWithGroundTruth}`);
  console.log(`Avg Accuracy: ${(stats.accuracyStats.avgAccuracy * 100).toFixed(1)}%`);
  console.log(`Avg MAPE: ${(stats.accuracyStats.avgMAPE * 100).toFixed(1)}%`);
  console.log(`Avg Measurements per Drawing: ${stats.qualityStats.avgMeasurements.toFixed(1)}`);
  console.log(`Avg Quality Score: ${stats.qualityStats.avgQualityScore.toFixed(3)}`);
  console.log(`Avg Processing Time: ${stats.performanceStats.avgProcessingTime.toFixed(0)}ms`);
  console.log(`Total Processing Time: ${stats.performanceStats.totalProcessingTime / 1000}s`);
  console.log('=' .repeat(80));
  
  return stats;
}

function compareMeasurements(simulated, manual) {
  if (!manual || manual.length === 0) {
    return { accuracy: 0, mape: 0 };
  }
  
  const comparisons = [];
  
  for (const manualItem of manual) {
    const simulatedItem = simulated.find(s => 
      s.element === manualItem.element || 
      (s.type && manualItem.type && s.type === manualItem.type)
    );
    
    if (simulatedItem) {
      const manualValue = manualItem.volume || manualItem.area || manualItem.length || 0;
      const simulatedValue = simulatedItem.volume || simulatedItem.area || simulatedItem.length || 0;
      
      if (manualValue > 0) {
        const error = Math.abs(simulatedValue - manualValue) / manualValue;
        comparisons.push({
          element: manualItem.element,
          manualValue,
          simulatedValue,
          error,
          withinTolerance: error <= 0.05
        });
      }
    }
  }
  
  if (comparisons.length === 0) {
    return { accuracy: 0, mape: 0 };
  }
  
  const accuracy = comparisons.filter(c => c.withinTolerance).length / comparisons.length;
  const mape = comparisons.reduce((sum, c) => sum + c.error, 0) / comparisons.length;
  
  return { accuracy, mape };
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateParquetDataset();
}

export { generateParquetDataset };
```

**Success Criteria**:
- ✅ JSON dataset generated (100+ rows)
- ✅ Parquet file generated (if parquetjs available)
- ✅ Dataset statistics calculated
- ✅ Ground truth accuracy metrics included

**Estimated Time**: 1 day

---

### **Task 7.5: Continual Learning Pipeline Setup**

#### **7.5.1: Set Up Automated Training Pipeline**
**Objective**: Configure weekly automated retraining with new data

**Pipeline Configuration**:
```javascript
// agents/continual-learning/continual-learning-pipeline.js
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

class ContinualLearningPipeline {
  constructor() {
    this.config = {
      schedule: 'weekly', // weekly, monthly, or on-demand
      triggerThreshold: 100, // Minimum new samples to trigger training
      trainingDataDir: 'agents/simulation/datasets/phase7',
      modelStorageDir: 'models/continual-learning',
      trainingQueueDir: 'agents/continual-learning/queue',
      notificationEmail: 'team@construct-ai.com',
      maxConcurrentJobs: 2,
      retentionPeriod: 30, // Days to keep old models
      accuracyThreshold: 0.85, // Retrain if accuracy drops below this
      metricsTracking: true
    };
    
    this.isRunning = false;
    this.jobQueue = [];
  }
  
  // Initialize pipeline
  async initialize() {
    console.log('🔄 Initializing Continual Learning Pipeline');
    
    // Create directories
    const dirs = [
      this.config.trainingDataDir,
      this.config.modelStorageDir,
      this.config.trainingQueueDir,
      path.join(this.config.trainingDataDir, 'new_data'),
      path.join(this.config.trainingDataDir, 'training_history')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Load existing model metadata
    this.modelMetadata = this.loadModelMetadata();
    
    console.log('✅ Continual Learning Pipeline initialized');
    console.log(`   Schedule: ${this.config.schedule}`);
    console.log(`   Trigger threshold: ${this.config.triggerThreshold} new samples`);
    console.log(`   Max concurrent jobs: ${this.config.maxConcurrentJobs}`);
    
    return this;
  }
  
  // Check for new data
  async checkForNewData() {
    const newDir = path.join(this.config.trainingDataDir, 'new_data');
    const files = fs.readdirSync(newDir).filter(f => f.endsWith('.json') || f.endsWith('.parquet'));
    
    if (files.length >= this.config.triggerThreshold) {
      console.log(`📊 New data detected: ${files.length} files`);
      return true;
    }
    
    return false;
  }
  
  // Add training job to queue
  async queueTrainingJob(customerId, trainingDataPath, modelType = 'specialist') {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      customerId,
      trainingDataPath,
      modelType,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      priority: 'normal'
    };
    
    this.jobQueue.push(job);
    
    // Save job metadata
    const jobFile = path.join(this.config.trainingQueueDir, `${jobId}.json`);
    fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));
    
    console.log(`📋 Job queued: ${jobId} for customer ${customerId}`);
    
    return job;
  }
  
  // Process queued jobs
  async processQueue() {
    if (this.isRunning) {
      console.log('⚠️ Pipeline already running, skipping queue processing');
      return;
    }
    
    this.isRunning = true;
    
    try {
      console.log('🔄 Processing training queue...');
      
      // Get queued jobs
      const queueDir = this.config.trainingQueueDir;
      const jobFiles = fs.readdirSync(queueDir).filter(f => f.endsWith('.json'));
      
      // Process jobs (max concurrent)
      const activeJobs = [];
      
      for (const jobFile of jobFiles.slice(0, this.config.maxConcurrentJobs)) {
        const jobPath = path.join(queueDir, jobFile);
        const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
        
        if (job.status === 'queued') {
          console.log(`🚀 Starting job: ${job.id}`);
          job.status = 'processing';
          job.startedAt = new Date().toISOString();
          
          // Save updated job
          fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));
          
          // Execute training
          const result = await this.executeTraining(job);
          
          // Update job status
          job.status = result.success ? 'completed' : 'failed';
          job.completedAt = new Date().toISOString();
          job.result = result;
          
          fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));
          
          activeJobs.push(job);
          
          // Clean up job file
          if (job.status === 'completed') {
            const archiveDir = path.join(this.config.trainingDataDir, 'training_history', 'completed');
            if (!fs.existsSync(archiveDir)) {
              fs.mkdirSync(archiveDir, { recursive: true });
            }
            fs.renameSync(jobPath, path.join(archiveDir, jobFile));
          }
        }
      }
      
      console.log(`✅ Queue processing complete. Processed ${activeJobs.length} jobs`);
      
    } catch (error) {
      console.error('❌ Queue processing failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }
  
  // Execute training for a job
  async executeTraining(job) {
    console.log(`📊 Training ${job.modelType} model for customer ${job.customerId}`);
    
    try {
      // Import training framework
      const { CustomerTrainingFramework } = await import(
        '../training/customer-training-framework.js'
      );
      
      const framework = new CustomerTrainingFramework();
      
      // Configure training
      const trainingConfig = {
        customerId: job.customerId,
        modelType: job.modelType,
        trainingDataPath: job.trainingDataPath,
        outputDir: this.config.modelStorageDir,
        maxEpochs: 10,
        learningRate: 0.001,
        batchSize: 32,
        useGPU: true,
        validationSplit: 0.2
      };
      
      // Execute training
      const result = await framework.trainCustomerModel(trainingConfig);
      
      if (result.success) {
        // Update model metadata
        this.updateModelMetadata(job.customerId, job.modelType, result.modelPath, result.metrics);
        
        // Archive training data
        this.archiveTrainingData(job.trainingDataPath);
        
        return {
          success: true,
          modelPath: result.modelPath,
          metrics: result.metrics,
          validationResults: result.validationResults
        };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error(`❌ Training failed for job ${job.id}:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  // Update model metadata
  updateModelMetadata(customerId, modelType, modelPath, metrics) {
    if (!this.modelMetadata[customerId]) {
      this.modelMetadata[customerId] = {};
    }
    
    if (!this.modelMetadata[customerId][modelType]) {
      this.modelMetadata[customerId][modelType] = [];
    }
    
    const version = this.modelMetadata[customerId][modelType].length + 1;
    const modelId = `${customerId}_${modelType}_v${version}`;
    
    const metadata = {
      modelId,
      customerId,
      modelType,
      version,
      path: modelPath,
      metrics,
      trainedAt: new Date().toISOString(),
      status: 'active'
    };
    
    this.modelMetadata[customerId][modelType].push(metadata);
    
    // Save metadata
    const metadataFile = path.join(this.config.modelStorageDir, 'model_metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(this.model