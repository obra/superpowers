# 02400 Contractor Vetting Workflow - Learning Process & Continuous Improvement

## Overview

The 02400 Contractor Vetting Workflow includes a comprehensive learning system that enables continuous improvement through contractor submissions, feedback integration, resubmission tracking, and automated model training. This document describes the complete learning architecture and processes.

## Learning Architecture

### Core Concept: Learning Loops

The vetting workflow operates on **continuous learning loops** where each contractor interaction improves the system's ability to:

1. **Analyze submissions** for quality and completeness
2. **Provide actionable feedback** to contractors
3. **Track improvements** through resubmissions
4. **Train models** on collected learning data
5. **Optimize predictions** for future submissions

### Learning Data Flow

```
Contractor Submission → Analysis → Feedback → Resubmission → Learning Data → Model Training → Improved Predictions
         ↓                ↓          ↓          ↓              ↓               ↓                ↓
   Initial Analysis   Score &    Corrections  Track        Store          Trigger         Better Quality
                      Issues                  Learning     Learning       Training        Assessments
                                                    Curve    Data          Pipeline
```

## Data Collection Mechanisms

### 1. Submission Analysis

When a contractor submits documentation, the system performs comprehensive quality analysis:

**Required Documents Checked:**
- `safety_certifications`
- `technical_qualifications`
- `insurance_certificates`
- `financial_statements`

**Quality Assessment:**
```javascript
// Example analysis output
{
  "analysis_id": "analysis-123456",
  "completeness_score": 0.85,  // 0.0 to 1.0
  "missing_documents": ["insurance_certificates"],
  "incomplete_documents": ["safety_certifications: doc_0"],
  "quality_issues": ["technical_qualifications: proposal_1 (content too short)"],
  "feedback_items": [
    {
      "type": "missing_document",
      "severity": "critical",
      "items": ["insurance_certificates"],
      "action": "upload_documents",
      "deadline": "2026-02-04T08:37:00.000Z"
    }
  ]
}
```

**Scoring Formula:**
```
Completeness Score = MAX(0, 1 - (missing_count × 0.1) - (incomplete_count × 0.05))

Example:
- 2 missing documents: 0.8 score
- 1 incomplete document: 0.95 score
- 0 issues: 1.0 score
```

### 2. Feedback Integration

**Feedback Sources:**
- Specialist agents (safety, technical, legal)
- Human reviewers (vetting committee, discipline experts)
- Compliance checkers
- Quality assurance

**Feedback Categories:**
- **Correction**: Required fix for critical/high severity issues
- **Suggestion**: Optional improvement for low/informational severity
- **Requirement**: Mandatory action for compliance
- **Rejection Reason**: Explanation for failed vetting

**Severity Levels:**
1. **Critical** - Immediate action required (7-day deadline)
2. **High** - Important correction (5-day deadline)
3. **Medium** - Improvement recommended (3-day deadline)
4. **Low** - Optional enhancement
5. **Informational** - Educational feedback

**Effectiveness Calculation:**
```
Feedback Effectiveness = (Critical/High Corrections) / Total Corrections

Example:
- 3 critical + 2 high + 5 medium corrections = 5/10 = 0.5 effectiveness
```

### 3. Resubmission Tracking

**Maximum Resubmissions:** 3 cycles (configurable)

**Time Limits:**
- First resubmission: 7 days
- Second resubmission: 14 days
- Third resubmission: 30 days

**Learning Increment:** 0.15 (15% improvement per successful cycle)
**Decay Factor:** 0.85 (reduction if no improvement)
**Improvement Threshold:** 0.10 (10% improvement required)

**Learning Curve Tracking:**
```json
{
  "learning_curve": [
    {
      "iteration": 1,
      "previous_score": 0.65,
      "new_score": 0.78,
      "improvement": 0.13,
      "timestamp": "2026-01-28T08:00:00.000Z"
    },
    {
      "iteration": 2,
      "previous_score": 0.78,
      "new_score": 0.89,
      "improvement": 0.11,
      "timestamp": "2026-01-29T08:00:00.000Z"
    }
  ]
}
```

**Status Determination:**
```javascript
if (improvement > 0.1) {
  status = 'significant_improvement';
} else if (improvement > 0) {
  status = 'improvement';
} else {
  status = 'no_improvement';
}
```

### 4. Learning Data Collection

**Complete Session Data Structure:**
```json
{
  "session_id": "vetting-789",
  "timestamp": "2026-01-28T08:37:00.000Z",
  
  "input_data": {
    "contractor_profile": { ... },
    "risk_level": "high",
    "project_value": 35000000000,
    "submission_data": { ... }
  },
  
  "agent_evaluations": [
    {
      "stage": "technical_reviews",
      "score": 0.85,
      "agents_utilized": 8,
      "timestamp": "2026-01-28T08:37:00.000Z"
    }
  ],
  
  "learning_state": {
    "submission_count": 3,
    "feedback_count": 12,
    "resubmission_count": 2,
    "correction_count": 5,
    "improvement_score": 0.28,
    "learning_curve": [ ... ]
  },
  
  "submissions": [ ... ],
  "feedback_items": [ ... ],
  "corrections": [ ... ],
  "agent_evaluations_detailed": [ ... ],
  
  "outcomes": {
    "final_qualification": {
      "decision": "ADVANCED_QUALIFICATION",
      "score": 0.82,
      "confidence": 0.85
    },
    "metrics": {
      "duration_ms": 156.77,
      "stages_completed": 7,
      "agents_utilized": 16,
      "success_rate": 0.857
    },
    "next_steps": [ ... ]
  },
  
  "metadata": {
    "workflow_id": "02400",
    "workflow_name": "Contractor Vetting Workflow",
    "total_stages": 7,
    "total_agents": 16,
    "duration_ms": 156.77
  }
}
```

## Model Training Pipeline

### Training Triggers

The system monitors for conditions to trigger automated model training:

| Trigger | Threshold | Example |
|---------|-----------|---------|
| **Completed Submissions** | 10 submissions | After 10 contractors complete vetting |
| **Human Corrections** | 20 corrections | After 20 specialist corrections |
| **Feedback Items** | 50 feedback items | After 50 feedback items collected |
| **Monthly Cycle** | 30 days since last training | Automated monthly retraining |

**Trigger Logic:**
```javascript
const triggers = [
  '10_completed_submissions',
  '20_human_corrections',
  '50_feedback_items',
  'monthly_cycle'
];

for (const trigger of triggers) {
  if (shouldTrain(trigger)) {
    triggerModelTraining();
    break;  // Trigger on first met condition
  }
}
```

### Data Transformation for Training

**Training Dataset Format:**
```python
[
  {
    "input": {
      "stage": "technical_reviews",
      "agents": 8,
      "duration": "2026-01-28T08:37:00.000Z"
    },
    "output": {
      "score": 0.85,
      "recommended_action": "accept"
    },
    "label": "agent_evaluation"
  },
  {
    "input": {
      "completeness": 0.85,
      "missing_docs": 1,
      "quality_issues": 2
    },
    "output": {
      "resubmission_needed": false,
      "predicted_score": 0.85
    },
    "label": "submission_quality"
  },
  {
    "input": {
      "field": "safety_certifications",
      "severity": "critical",
      "source": "specialist_agent"
    },
    "output": {
      "correction_improvement": 0.1,
      "action_required": true
    },
    "label": "feedback_correction"
  }
]
```

### Training Configuration

**LoRA Training Parameters:**
```yaml
dataset_size: 100
validation_split: 0.2  # 20% for validation
epochs: 10
learning_rate: 0.001
batch_size: 32

validation_metrics:
  - accuracy
  - precision
  - recall
  - f1_score
  - auc_roc
```

**Dataset Storage:**
```sql
-- Database table: training_datasets
CREATE TABLE training_datasets (
  dataset_id VARCHAR PRIMARY KEY,
  session_ids JSONB,  -- Array of session IDs
  data JSONB,         -- Training data
  trigger_reason VARCHAR,
  created_at TIMESTAMP,
  status VARCHAR
);
```

## Prediction System

### Prediction Types

**1. Submission Quality Prediction**
- **Input**: Completeness score, missing documents, quality issues
- **Output**: Predicted score, resubmission probability
- **Use Case**: Pre-emptive feedback for contractors

**2. Feedback Effectiveness Prediction**
- **Input**: Correction severity, field type, source
- **Output**: Predicted improvement, impact level
- **Use Case**: Prioritize high-impact feedback

**3. Resubmission Probability**
- **Input**: Current completeness, previous improvements
- **Output**: Probability of resubmission
- **Use Case**: Schedule follow-up communications

**4. Qualification Decision Prediction**
- **Input**: Stage scores, confidence levels, category
- **Output**: Predicted decision, confidence
- **Use Case**: Quick preliminary assessments

### Prediction Flow

```javascript
// 1. Load trained model
const model = await loadLatestModel();

// 2. Prepare input data
const inputData = {
  completeness: 0.85,
  missing_docs: 1,
  quality_issues: 2
};

// 3. Make prediction
const prediction = await makePrediction(inputData, 'submission_quality');

// 4. Store prediction
learningData.predictions.push(prediction);

// 5. Return to user
return {
  predicted_score: 0.82,
  confidence: 0.75,
  recommendation: 'submit_with_improvements'
};
```

### Fallback Mechanism

When no trained model is available, the system uses heuristic predictions:

```javascript
function heuristicPrediction(inputData, predictionType) {
  switch (predictionType) {
    case 'submission_quality':
      return {
        predicted_score: 0.7 + (Math.random() * 0.2),
        confidence: 0.6,
        recommendation: 'review'
      };
    
    case 'feedback_effectiveness':
      return {
        predicted_improvement: 0.15,
        confidence: 0.65,
        recommendation: 'implement_all'
      };
    
    case 'resubmission_probability':
      return {
        probability: inputData.completeness < 0.8 ? 0.8 : 0.3,
        confidence: 0.7,
        recommendation: inputData.completeness < 0.8 ? 'likely' : 'unlikely'
      };
    
    case 'qualification_decision':
      return {
        predicted_decision: inputData.score > 0.85 ? 'CRITICAL' : 'ADVANCED',
        confidence: 0.75,
        recommendation: 'proceed'
      };
  }
}
```

## Database Schema Integration

### New Tables Required

#### 1. contractor_submission_history
```sql
CREATE TABLE contractor_submission_history (
  submission_id VARCHAR PRIMARY KEY,
  contractor_id VARCHAR,
  session_id VARCHAR,
  stage VARCHAR,
  data JSONB,
  status VARCHAR,
  timestamp TIMESTAMP,
  metadata JSONB
);
```

#### 2. feedback_correction_log
```sql
CREATE TABLE feedback_correction_log (
  correction_id VARCHAR PRIMARY KEY,
  submission_id VARCHAR,
  field VARCHAR,
  original_value TEXT,
  corrected_value TEXT,
  source VARCHAR,
  severity VARCHAR,
  reason TEXT,
  timestamp TIMESTAMP
);
```

#### 3. model_performance_metrics
```sql
CREATE TABLE model_performance_metrics (
  model_id VARCHAR PRIMARY KEY,
  version VARCHAR,
  trained_at TIMESTAMP,
  performance FLOAT,
  validation_metrics JSONB,
  training_data_size INTEGER,
  status VARCHAR,
  metadata JSONB
);
```

#### 4. training_datasets
```sql
CREATE TABLE training_datasets (
  dataset_id VARCHAR PRIMARY KEY,
  session_ids JSONB,
  data JSONB,
  trigger_reason VARCHAR,
  created_at TIMESTAMP,
  status VARCHAR
);
```

#### 5. continual_learning_data (Enhanced)
```sql
CREATE TABLE continual_learning_data (
  session_id VARCHAR PRIMARY KEY,
  data_type VARCHAR,
  data JSONB,
  timestamp TIMESTAMP,
  workflow_id VARCHAR
);
```

## Quality Assurance & Metrics

### Key Performance Indicators (KPIs)

**Submission Metrics:**
- `submission_completion_rate`: Percentage of submissions with complete documentation
- `average_completeness_score`: Average score across all submissions
- `missing_documents_per_submission`: Average count
- `quality_issues_per_submission`: Average count

**Feedback Metrics:**
- `feedback_implementation_rate`: Percentage of feedback implemented
- `average_feedback_effectiveness`: Average effectiveness score
- `correction_resolution_time`: Average time to resolve corrections
- `feedback_category_distribution`: Breakdown by severity

**Learning Metrics:**
- `learning_curve_slope`: Rate of improvement per iteration
- `improvement_rate_per_cycle`: Percentage improvement per resubmission
- `model_accuracy_trend`: Accuracy over time
- `prediction_confidence_trend`: Confidence levels over time

**Process Metrics:**
- `resubmission_rate`: Percentage requiring resubmission
- `average_resubmission_count`: Average iterations per contractor
- `max_resubmissions_reached`: Count of contractors hitting limit
- `automation_success_rate`: Percentage handled without human intervention

### Dashboard Views

**1. Submission Analytics Dashboard**
```
Contractor: International Mega Contractor
Session ID: vetting-789

Submission Quality:
┌─────────────────────────────────────┐
│ Completeness Score: 85%             │
│ Missing Documents: 1 (Critical)     │
│ Quality Issues: 2 (Medium)          │
│ Feedback Items: 3                   │
└─────────────────────────────────────┘

Learning Progress:
┌─────────────────────────────────────┐
│ Iteration: 2 (of 3 max)             │
│ Previous Score: 65%                 │
│ Current Score: 85%                  │
│ Improvement: +20%                   │
│ Status: Significant Improvement     │
└─────────────────────────────────────┘
```

**2. Feedback Effectiveness Dashboard**
```
Feedback Analysis:
┌─────────────────────────────────────┐
│ Total Corrections: 10               │
│ Critical: 3 (30%)                   │
│ High: 2 (20%)                       │
│ Medium: 3 (30%)                     │
│ Low: 2 (20%)                        │
│ Effectiveness: 50%                  │
└─────────────────────────────────────┘

Top Impact Areas:
1. Safety Certifications (Critical) - 100% improvement
2. Insurance Documentation (High) - 80% improvement
3. Financial Statements (Medium) - 40% improvement
```

**3. Model Performance Dashboard**
```
Model Training Status:
┌─────────────────────────────────────┐
│ Active Model: v2.1                  │
│ Trained: 2026-01-25                 │
│ Accuracy: 87.5%                     │
│ Precision: 85.2%                    │
│ Recall: 89.3%                       │
│ F1 Score: 87.2%                     │
└─────────────────────────────────────┘

Training Triggers:
┌─────────────────────────────────────┐
│ 10 Submissions: 8/10 ✅             │
│ 20 Corrections: 12/20 ⏳            │
│ 50 Feedback: 34/50 ⏳               │
│ Monthly: 3 days remaining           │
└─────────────────────────────────────┘
```

**4. Contractor Progress Dashboard**
```
Contractor Improvement Track:
┌─────────┬─────────────┬─────────────┬─────────────┐
│ Iteration │ Score       │ Improvement │ Status      │
├─────────┼─────────────┼─────────────┼─────────────┤
│ 1       │ 65%         │ -           │ Initial     │
│ 2       │ 78%         │ +13%        │ Improved    │
│ 3       │ 85%         │ +7%         │ Improved    │
└─────────┴─────────────┴─────────────┴─────────────┘

Next Actions:
- Review critical corrections
- Schedule resubmission within 7 days
- Monitor for additional feedback
```

## Workflow Integration Points

### 1. JavaScript Implementation (Client-Side)

**Entry Points for Learning:**
```javascript
// After complete vetting process
const learningData = await vettingSwarm.collectLearningData({
  session_id: vettingSwarm.vettingSessionId,
  contractorData: contractorData,
  riskLevel: 'high',
  projectValue: 35000000000,
  submissionData: submissionData,
  stageResults: vettingSwarm.results,
  qualificationDecision: qualificationDecision,
  metrics: vettingSwarm.metrics,
  nextSteps: vettingSwarm.getNextSteps(qualificationDecision)
});

// Check if training should be triggered
await vettingSwarm.checkAndTriggerTraining(learningData);
```

**Analysis & Feedback Flow:**
```javascript
// Analyze contractor submission
const analysis = await vettingSwarm.analyzeSubmission({
  contact_email: contractorData.contact_email,
  safety_certifications: safetyDocs,
  technical_qualifications: techDocs,
  insurance_certificates: insuranceDocs,
  financial_statements: financialDocs
});

// Integrate feedback from specialists
const feedbackIntegration = await vettingSwarm.integrateFeedback({
  session_id: vettingSwarm.vettingSessionId,
  submission_id: analysis.analysis_id,
  contractor_email: contractorData.contact_email,
  items: feedbackItems  // From specialist agents or human reviewers
});

// Track resubmission
const resubmission = await vettingSwarm.trackResubmission(
  newSubmissionData,
  previousAnalysis  // From initial submission
);
```

### 2. Python Implementation (Deep-Agents Service)

**Orchestrator Methods:**
```python
from deep_agents.agents.pages.vetting import VettingWorkflowOrchestrator

orchestrator = VettingWorkflowOrchestrator()

# Analyze submission quality
analysis = await orchestrator.analyze_submission_quality(
    submission_data=submission_data,
    database_client=database_client
)

# Integrate feedback
feedback_integration = await orchestrator.integrate_feedback(
    feedback_data=feedback_data,
    database_client=database_client
)

# Track resubmission
resubmission = await orchestrator.track_resubmission(
    resubmission_data=new_submission,
    previous_analysis=previous_analysis,
    database_client=database_client
)

# Collect learning data
learning_data = await orchestrator.collect_learning_data(
    session_data=session_data,
    database_client=database_client
)
```

### 3. Database Operations

**Storing Learning Data:**
```javascript
// Store in continual_learning_data table
await database.insert('continual_learning_data', {
  session_id: sessionId,
  data_type: 'complete_session',
  data: learningData,
  timestamp: new Date().toISOString(),
  workflow_id: '02400'
});

// Store training dataset
await database.insert('training_datasets', {
  dataset_id: uuidv4(),
  session_ids: [sessionId],
  data: trainingData,
  trigger_reason: triggerReason,
  created_at: new Date().toISOString(),
  status: 'pending_training'
});
```

## Usage Examples

### Example 1: New Contractor Submission

```javascript
const vettingSwarm = new ContractorVettingSwarm();
await vettingSwarm.initialize(databaseClient);

// Contractor submits documentation
const submissionData = {
  contact_email: 'contractor@example.com',
  safety_certifications: [...],
  technical_qualifications: [...],
  insurance_certificates: [...],
  financial_statements: [...]
};

// Analyze submission
const analysis = await vettingSwarm.analyzeSubmission(submissionData);

console.log(`
Submission Analysis Complete:
- Completeness: ${(analysis.completeness_score * 100).toFixed(1)}%
- Missing: ${analysis.missing_documents.length} documents
- Feedback items: ${analysis.feedback_items.length}

Next Steps:
1. Review feedback items
2. Upload missing documents
3. Re-submit within 7 days
`);
```

### Example 2: Feedback Integration

```javascript
// After specialist review
const feedbackItems = [
  {
    field: 'safety_certifications',
    original_value: 'ISO 9001:2015',
    corrected_value: 'ISO 45001:2018',
    source: 'safety_specialist_agent',
    severity: 'critical',
    reason: 'Construction requires ISO 45001, not ISO 9001'
  },
  {
    field: 'insurance_certificates',
    original_value: 'No policy number',
    corrected_value: 'Policy #INS-2026-12345',
    source: 'compliance_agent',
    severity: 'high',
    reason: 'Policy number required for verification'
  }
];

const integration = await vettingSwarm.integrateFeedback({
  session_id: vettingSwarm.vettingSessionId,
  contractor_email: 'contractor@example.com',
  items: feedbackItems
});

console.log(`
Feedback Integration Complete:
- Corrections: ${integration.corrections.length}
- Suggestions: ${integration.suggestions.length}
- Effectiveness: ${(integration.effectiveness * 100).toFixed(1)}%

Tasks Created:
- Correction Required: Safety Certifications (Critical)
- Correction Required: Insurance Certificates (High)
`);
```

### Example 3: Resubmission Tracking

```javascript
// Contractor re-submits with corrections
const previousAnalysis = {
  analysis_id: 'analysis-123456',
  completeness_score: 0.65,
  learning_curve: []
};

const newSubmission = {
  contact_email: 'contractor@example.com',
  safety_certifications: [...],  // Now includes ISO 45001
  insurance_certificates: [...],  // Now includes policy number
  technical_qualifications: [...],
  financial_statements: [...]
};

const resubmission = await vettingSwarm.trackResubmission(
  newSubmission,
  previousAnalysis
);

console.log(`
Resubmission Tracking Complete:
- Iteration: ${resubmission.iteration} (max: 3)
- Improvement: ${(resubmission.improvement * 100).toFixed(1)}%
- Status: ${resubmission.status}

Learning Curve:
${resubmission.learning_curve.map(l => 
  `  ${l.iteration}: ${l.previous_score*100}% → ${l.new_score*100}% (+${(l.improvement*100).toFixed(1)}%)`
).join('\n')}
`);
```

### Example 4: Model Training Trigger

```javascript
// After collecting sufficient data
const learningData = await vettingSwarm.collectLearningData({
  session_id: vettingSwarm.vettingSessionId,
  contractorData: contractorData,
  riskLevel: 'high',
  projectValue: 35000000000,
  submissionData: submissionData,
  stageResults: vettingSwarm.results,
  qualificationDecision: qualificationDecision,
  metrics: vettingSwarm.metrics,
  nextSteps: vettingSwarm.getNextSteps(qualificationDecision)
});

// Check and trigger training
await vettingSwarm.checkAndTriggerTraining(learningData);

console.log(`
Model Training Trigger Check:
- Submissions: ${vettingSwarm.learning