# 1300_00000_EXTERNAL_PARTY_EVALUATION_SYSTEM.md

## Overview

**Purpose**: Generic architectural plan for multi-discipline evaluation of external parties including contractor vetting, tender evaluation, RFQ responses, pre-qualification, and enquiries/RFIs.

**Applies To**: All disciplines evaluating external parties
**Primary Contexts**: 
- Contractor Vetting (Safety page 02400)
- Tender/RFP Evaluation (Procurement page 01900)
- RFQ/Quote Evaluation (Procurement page 01900)
- Pre-qualification (Multiple disciplines)
- RFI/Enquiry Responses (Multiple disciplines)

**Status**: ✅ DATABASE FOUNDATION IMPLEMENTED
**Version**: 2.1 (Database Implementation Complete)
**Date**: October 2025
**Database Deployed**: October 21, 2025

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Generic Database Schema](#generic-database-schema)
3. [Context-Specific Implementations](#context-specific-implementations)
4. [Workflow & State Machine](#workflow--state-machine)
5. [Scoring & Weighted Aggregation](#scoring--weighted-aggregation)
6. [Security & RLS Policies](#security--rls-policies)
7. [UI Components](#ui-components)
8. [Implementation Phases](#implementation-phases)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│         MULTI-DISCIPLINE EXTERNAL PARTY EVALUATION SYSTEM            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Safety      │  │ Construction │  │   Finance    │             │
│  │  (02400)     │  │   (00435)    │  │   (01200)    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
│         └──────────────────┼──────────────────┘                      │
│                            │                                          │
│  ┌──────────────┐  ┌──────▼───────┐  ┌──────────────┐             │
│  │   Security   │  │  EXTERNAL    │  │Quality Assur.│             │
│  │   (02500)    │  │   PARTY      │  │   (02200)    │             │
│  └──────┬───────┘  │  DOCUMENT    │  └──────┬───────┘             │
│         │          │  INSTANCES   │          │                      │
│         └──────────┴──────────────┴──────────┘                      │
│                            │                                          │
│                            ▼                                          │
│                 ┌──────────────────────┐                            │
│                 │   COORDINATOR        │                            │
│                 │  Weighted Scoring    │                            │
│                 │  Final Decision      │                            │
│                 └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Supported Contexts

| Context | External Party Type | Primary Discipline | Use Case |
|---------|-------------------|-------------------|----------|
| **Contractor Vetting** | Contractor | Safety (02400) | Pre-qualification of contractors for projects |
| **Tender Evaluation** | Bidder | Procurement (01900) | Evaluate bids for construction/service tenders |
| **RFQ Response** | Supplier/Vendor | Procurement (01900) | Evaluate quotations for goods/services |
| **Pre-qualification** | Contractor/Consultant | Multiple | Qualify parties for specific project types |
| **RFI Response** | Respondent | Multiple | Gather information for decision-making |
| **Consultant Selection** | Consultant | Multiple | Evaluate and select consultants |
| **Subcontractor Evaluation** | Subcontractor | Construction (00435) | Evaluate subcontractor capabilities |

### Key Architectural Principles

1. **Context-Agnostic Core**: Single system handles all evaluation types
2. **Discipline Isolation**: Each discipline evaluates independently (enforced by RLS)
3. **Shared Document Instance Table**: All contexts use same data structure
4. **Frozen Snapshots**: Documents are immutable copies of templates at creation
5. **Two Review Gates**: Pre-issue review (within discipline) and post-submission review
6. **Weighted Aggregation**: Coordinator combines discipline scores with configurable weights
7. **Flexible Metadata**: Context-specific data stored in JSONB fields

---

## Generic Database Schema

### Table 1: external_party_document_instances

**Purpose**: Unified table for all external party documents across all disciplines and contexts

```sql
create table public.external_party_document_instances (
  id uuid primary key default gen_random_uuid(),
  
  -- CONTEXT IDENTIFICATION (NEW)
  document_context varchar(50) not null,              -- 'contractor_vetting', 'tender_response', 'rfq_response', 'prequalification', 'rfi_response'
  context_reference_id varchar(100),                  -- External reference (e.g., tender number, RFQ number)
  
  -- Source Template (discipline-specific)
  source_table varchar(100) not null,                 -- e.g., 'safety_templates', 'procurement_templates'
  source_template_id uuid not null,
  template_snapshot jsonb not null,                   -- Frozen copy at creation time
  
  -- CRITICAL: Discipline Ownership & Isolation
  discipline_code varchar(20) not null,               -- '02400', '00435', '01200', '02500', '02200'
  discipline_owner_id uuid references user_management(user_id),
  organization_id uuid references organizations(id),
  
  -- Document Metadata
  document_name varchar(255) not null,
  document_description text,
  document_type varchar(50),                          -- 'questionnaire', 'form', 'checklist', 'technical_spec', 'pricing_sheet'
  
  -- GENERIC: External Party Assignment
  assigned_to_party_id uuid references user_management(user_id),
  assigned_to_party_email varchar(255) not null,
  assigned_to_party_name varchar(255),
  assigned_to_party_org_name varchar(255),
  assigned_to_party_type varchar(50),                 -- 'contractor', 'bidder', 'supplier', 'consultant', 'respondent', 'subcontractor'
  
  -- PRE-ISSUE REVIEW (Within Discipline)
  created_by uuid references user_management(user_id),
  created_at timestamp with time zone default now(),
  reviewed_before_issue_by uuid references user_management(user_id),
  reviewed_before_issue_at timestamp with time zone,
  pre_issue_review_notes text,
  
  -- ISSUE TO EXTERNAL PARTY
  issued_by uuid references user_management(user_id),
  issued_at timestamp with time zone,
  due_date date,
  assignment_instructions text,
  
  -- Document Content (frozen from template)
  html_content text not null,                         -- Questions/form HTML
  form_schema jsonb,                                  -- Validation rules
  
  -- External Party Responses
  party_responses jsonb,                              -- Q&A pairs, submissions
  response_metadata jsonb,                            -- Timestamps, IPs, versions
  
  -- Activity Tracking
  started_at timestamp with time zone,
  last_saved_at timestamp with time zone,
  submitted_at timestamp with time zone,
  
  -- POST-SUBMISSION REVIEW (Back to Discipline)
  reviewed_after_submission_by uuid references user_management(user_id),
  reviewed_after_submission_at timestamp with time zone,
  post_submission_review_notes text,
  review_decision varchar(20),                        -- 'approved', 'rejected', 'revision_requested'
  
  -- DISCIPLINE SCORING
  discipline_score integer,
  discipline_max_score integer default 100,
  discipline_score_percentage decimal(5,2),
  score_breakdown jsonb,                              -- Per-section scores
  scoring_comments text,
  scored_by uuid references user_management(user_id),
  scored_at timestamp with time zone,
  
  -- Revision Tracking
  revision_count integer default 0,
  revision_history jsonb,
  
  -- Status (follows state machine)
  status varchar(30) default 'draft',
  completion_percentage integer default 0,
  
  -- Access Control
  access_token varchar(255) unique,
  access_expires_at timestamp with time zone,         -- Default: 30 days from issued_at
  access_revoked boolean default false,
  
  -- GENERIC: Evaluation Package Grouping
  evaluation_package_id uuid,
  evaluation_package_name varchar(255),
  
  -- CONTEXT-SPECIFIC METADATA (NEW)
  context_metadata jsonb,                             -- Flexible storage for context-specific data
  /* Examples:
     Tender: {"bid_amount": 5000000, "bid_currency": "USD", "bid_validity_days": 90}
     RFQ: {"quoted_price": 125000, "delivery_days": 30, "payment_terms": "Net 30"}
     Vetting: {"contractor_category": "Building", "required_capacity": "10M+"}
  */
  
  -- Metadata
  version varchar(20) default '1.0',
  is_active boolean default true,
  updated_at timestamp with time zone default now(),
  updated_by uuid references user_management(user_id),
  
  constraint valid_status check (
    status in (
      'draft', 'ready_for_issue', 'issued', 'in_progress', 
      'submitted', 'under_review', 'revision_requested', 
      'approved', 'rejected', 'expired', 'revoked'
    )
  ),
  constraint valid_review_decision check (
    review_decision is null or review_decision in ('approved', 'rejected', 'revision_requested')
  ),
  constraint valid_document_context check (
    document_context in (
      'contractor_vetting', 'tender_response', 'rfq_response', 
      'prequalification', 'rfi_response', 'consultant_selection',
      'subcontractor_evaluation'
    )
  )
);

-- Indexes for performance
create index idx_ext_party_docs_context on external_party_document_instances(document_context);
create index idx_ext_party_docs_discipline on external_party_document_instances(discipline_code);
create index idx_ext_party_docs_status on external_party_document_instances(status);
create index idx_ext_party_docs_party_email on external_party_document_instances(assigned_to_party_email);
create index idx_ext_party_docs_eval_package on external_party_document_instances(evaluation_package_id);
create index idx_ext_party_docs_access_token on external_party_document_instances(access_token) where access_token is not null;
create index idx_ext_party_docs_due_date on external_party_document_instances(due_date);
create index idx_ext_party_docs_context_ref on external_party_document_instances(context_reference_id);
```

### Table 2: evaluation_packages

**Purpose**: Group related documents from multiple disciplines for comprehensive evaluation

```sql
create table public.evaluation_packages (
  id uuid primary key default gen_random_uuid(),
  
  -- CONTEXT IDENTIFICATION (NEW)
  package_context varchar(50) not null,               -- 'contractor_vetting', 'tender_evaluation', 'rfq_evaluation', 'prequalification'
  context_reference_id varchar(100),                  -- External reference (tender number, RFQ number, etc.)
  
  package_name varchar(255) not null,
  package_description text,
  
  -- GENERIC: External Party Information
  party_email varchar(255) not null,
  party_name varchar(255),
  party_org_name varchar(255),
  party_type varchar(50),                             -- 'contractor', 'bidder', 'supplier', 'consultant', 'respondent'
  party_id uuid references user_management(user_id),
  
  -- Organization
  organization_id uuid references organizations(id),
  
  -- Package Status
  overall_status varchar(30) default 'in_progress',
  
  -- Individual Discipline Scores (populated as each discipline completes)
  discipline_scores jsonb default '[]'::jsonb,
  /* Example structure:
  [
    {
      "discipline_code": "02400",
      "discipline_name": "Safety",
      "score": 85,
      "max_score": 100,
      "percentage": 85.0,
      "status": "approved",
      "scored_by": "user_uuid",
      "scored_at": "2025-01-15T10:00:00Z",
      "comments": "Strong safety record"
    }
  ]
  */
  
  -- Weighted Final Score (calculated by coordinator)
  final_weighted_score decimal(5,2),
  final_weighted_percentage decimal(5,2),
  scoring_calculation jsonb,
  /* Example:
  {
    "components": [
      {"discipline": "Safety", "score": 85, "weight": 30, "weighted": 25.5},
      {"discipline": "Construction", "score": 92, "weight": 25, "weighted": 23.0}
    ],
    "total": 86.0,
    "calculated_at": "2025-01-16T09:00:00Z",
    "calculated_by": "coordinator_uuid"
  }
  */
  
  -- Final Decision
  final_decision varchar(20),                         -- 'approved', 'rejected', 'conditional', 'awarded', 'shortlisted', 'disqualified'
  final_decision_by uuid references user_management(user_id),
  final_decision_at timestamp with time zone,
  final_decision_comments text,
  
  -- CONTEXT-SPECIFIC METADATA (NEW)
  context_metadata jsonb,                             -- Flexible storage for context-specific data
  /* Examples:
     Tender: {
       "tender_id": "TEND-2025-001",
       "bid_amount": 5000000,
       "bid_rank": 2,
       "technical_score": 85,
       "financial_score": 92
     }
     RFQ: {
       "rfq_id": "RFQ-2025-045",
       "total_quote": 125000,
       "delivery_schedule": "30 days",
       "price_rank": 1
     }
     Vetting: {
       "contractor_category": "Building Construction",
       "experience_years": 15,
       "project_capacity": "10M+ USD"
     }
  */
  
  -- Tracking
  created_by uuid references user_management(user_id),
  created_at timestamp with time zone default now(),
  due_date date,
  completed_at timestamp with time zone,
  
  -- Metadata
  updated_at timestamp with time zone default now(),
  updated_by uuid references user_management(user_id),
  
  constraint valid_overall_status check (
    overall_status in (
      'in_progress', 'awaiting_scoring', 'scored', 'approved', 
      'rejected', 'expired', 'awarded', 'shortlisted', 'disqualified'
    )
  ),
  constraint valid_final_decision check (
    final_decision is null or final_decision in (
      'approved', 'rejected', 'conditional', 'awarded', 
      'shortlisted', 'disqualified', 'under_negotiation'
    )
  ),
  constraint valid_package_context check (
    package_context in (
      'contractor_vetting', 'tender_evaluation', 'rfq_evaluation', 
      'prequalification', 'consultant_selection', 'subcontractor_evaluation'
    )
  )
);

-- Indexes
create index idx_eval_packages_context on evaluation_packages(package_context);
create index idx_eval_packages_party on evaluation_packages(party_email);
create index idx_eval_packages_status on evaluation_packages(overall_status);
create index idx_eval_packages_org on evaluation_packages(organization_id);
create index idx_eval_packages_context_ref on evaluation_packages(context_reference_id);
```

### Table 3: discipline_evaluation_weights

**Purpose**: Configure weighting percentages for each discipline in final scoring (context-aware)

```sql
create table public.discipline_evaluation_weights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  
  -- CONTEXT-SPECIFIC CONFIGURATION (NEW)
  evaluation_context varchar(50) not null,            -- 'contractor_vetting', 'tender_evaluation', 'rfq_evaluation'
  
  -- Discipline Configuration
  discipline_code varchar(20) not null,
  discipline_name varchar(100) not null,
  
  -- Weighting (must sum to 100% across all active disciplines for a context)
  weight_percentage decimal(5,2) not null,            -- e.g., 30.00 for 30%
  is_active boolean default true,
  
  -- Scoring Criteria (optional - for display)
  scoring_criteria jsonb,
  max_score integer default 100,
  passing_score integer default 70,
  
  -- Metadata
  created_at timestamp with time zone default now(),
  created_by uuid references user_management(user_id),
  updated_at timestamp with time zone default now(),
  updated_by uuid references user_management(user_id),
  
  constraint weight_percentage_valid check (weight_percentage >= 0 and weight_percentage <= 100),
  constraint unique_discipline_per_org_context unique (organization_id, evaluation_context, discipline_code),
  constraint valid_evaluation_context check (
    evaluation_context in (
      'contractor_vetting', 'tender_evaluation', 'rfq_evaluation', 
      'prequalification', 'consultant_selection', 'subcontractor_evaluation'
    )
  )
);

-- Index
create index idx_discipline_eval_weights_context on discipline_evaluation_weights(evaluation_context);
create index idx_discipline_eval_weights_org_context on discipline_evaluation_weights(organization_id, evaluation_context);
```

---

## Context-Specific Implementations

### Context 1: Contractor Vetting

**Primary Page**: Safety (02400) - Safety Document Templates
**External Party Type**: Contractor
**Typical Workflow**: Pre-qualify contractors before project bidding

```javascript
// Creating a contractor vetting document
const vettingDocument = {
  document_context: 'contractor_vetting',
  context_reference_id: null,  // Optional: link to project
  assigned_to_party_type: 'contractor',
  assigned_to_party_email: 'contractor@company.com',
  assigned_to_party_name: 'ABC Construction Ltd',
  discipline_code: '02400',  // Safety
  evaluation_package_id: vettingPackageId,
  context_metadata: {
    contractor_category: 'Building Construction',
    required_capacity: '10M+ USD projects',
    experience_required_years: 10,
    certifications_required: ['ISO 9001', 'OHSAS 18001']
  }
};

// Evaluation weights for contractor vetting
const vettingWeights = [
  { discipline: 'Safety', weight: 30 },
  { discipline: 'Construction', weight: 25 },
  { discipline: 'Finance', weight: 25 },
  { discipline: 'Security', weight: 15 },
  { discipline: 'Quality Assurance', weight: 5 }
];
```

### Context 2: Tender Evaluation

**Primary Page**: Procurement (01900) - Tender Management
**External Party Type**: Bidder
**Typical Workflow**: Evaluate competitive bids for construction/service tenders

```javascript
// Creating a tender response document
const tenderDocument = {
  document_context: 'tender_response',
  context_reference_id: 'TEND-2025-001',  // Tender number
  assigned_to_party_type: 'bidder',
  assigned_to_party_email: 'bidder@company.com',
  assigned_to_party_name: 'XYZ Contractors',
  discipline_code: '00435',  // Construction
  evaluation_package_id: tenderEvaluationId,
  context_metadata: {
    tender_id: 'TEND-2025-001',
    tender_title: 'Office Building Construction',
    bid_amount: 5000000,
    bid_currency: 'USD',
    bid_validity_days: 90,
    proposed_completion_months: 18,
    bid_submission_date: '2025-02-15'
  }
};

// Evaluation weights for tender evaluation
const tenderWeights = [
  { discipline: 'Construction', weight: 35 },  // Higher weight for technical
  { discipline: 'Finance', weight: 30 },       // Pricing evaluation
  { discipline: 'Safety', weight: 20 },
  { discipline: 'Quality Assurance', weight: 10 },
  { discipline: 'Security', weight: 5 }
];
```

### Context 3: RFQ Response Evaluation

**Primary Page**: Procurement (01900) - Supplier Management
**External Party Type**: Supplier/Vendor
**Typical Workflow**: Evaluate quotations for goods/services

```javascript
// Creating an RFQ response document
const rfqDocument = {
  document_context: 'rfq_response',
  context_reference_id: 'RFQ-2025-045',  // RFQ number
  assigned_to_party_type: 'supplier',
  assigned_to_party_email: 'supplier@company.com',
  assigned_to_party_name: 'Equipment Suppliers Inc',
  discipline_code: '01900',  // Procurement
  evaluation_package_id: rfqEvaluationId,
  context_metadata: {
    rfq_id: 'RFQ-2025-045',
    rfq_title: 'Heavy Equipment Purchase',
    quoted_total: 125000,
    currency: 'USD',
    delivery_days: 30,
    warranty_months: 24,
    payment_terms: 'Net 30',
    quote_validity_days: 60
  }
};

// Evaluation weights for RFQ evaluation
const rfqWeights = [
  { discipline: 'Procurement', weight: 40 },   // Pricing & terms
  { discipline: 'Finance', weight: 30 },        // Payment capability
  { discipline: 'Quality Assurance', weight: 20 },  // Product quality
  { discipline: 'Construction', weight: 10 }    // Technical specs
];
```

### Context 4: Pre-qualification

**Primary Page**: Multiple disciplines
**External Party Type**: Contractor/Consultant
**Typical Workflow**: Qualify parties for specific project types before tender

```javascript
const prequalDocument = {
  document_context: 'prequalification',
  context_reference_id: 'PROJ-2025-012',  // Project number
  assigned_to_party_type: 'contractor',
  assigned_to_party_email: 'contractor@company.com',
  discipline_code: '00435',
  evaluation_package_id: prequalPackageId,
  context_metadata: {
    project_id: 'PROJ-2025-012',
    project_type: 'Infrastructure Development',
    required_capacity: '50M+ USD',
    required_experience_years: 15,
    similar_projects_required: 3,
    geographical_area: 'Sub-Saharan Africa'
  }
};

// Evaluation weights for prequalification
const prequalWeights = [
  { discipline: 'Construction', weight: 40 },
  { discipline: 'Finance', weight: 25 },
  { discipline: 'Safety', weight: 20 },
  { discipline: 'Quality Assurance', weight: 15 }
];
```

### Context 5: RFI/Enquiry Response

**Primary Page**: Multiple disciplines
**External Party Type**: Respondent
**Typical Workflow**: Information gathering for decision-making

```javascript
const rfiDocument = {
  document_context: 'rfi_response',
  context_reference_id: 'RFI-2025-089',
  assigned_to_party_type: 'respondent',
  assigned_to_party_email: 'info@company.com',
  discipline_code: '02050',  // IT
  evaluation_package_id: null,  // May not need package
  context_metadata: {
    rfi_id: 'RFI-2025-089',
    rfi_topic: 'Cloud Infrastructure Solutions',
    information_type: 'technical_capabilities',
    decision_timeline: '30 days'
  }
};

// RFI may not need weighted scoring - informational only
```

---

## Workflow & State Machine

### Universal Document Lifecycle

The state machine is **identical across all contexts**:

```
┌─────────────────────────────────────────────────────────────────┐
│ WITHIN DISCIPLINE (Discipline members can see/edit)             │
├─────────────────────────────────────────────────────────────────┤
│ 1. draft            → Created from template, being prepared     │
│ 2. ready_for_issue  → Reviewed by discipline, ready to send     │
├─────────────────────────────────────────────────────────────────┤
│ ISSUED TO EXTERNAL PARTY (Party can see/edit)                   │
├─────────────────────────────────────────────────────────────────┤
│ 3. issued           → Sent to party, not started yet            │
│ 4. in_progress      → Party has started responding              │
│ 5. submitted        → Party has submitted responses             │
├─────────────────────────────────────────────────────────────────┤
│ BACK TO DISCIPLINE (Discipline reviews responses)               │
├─────────────────────────────────────────────────────────────────┤
│ 6. under_review     → Discipline reviewing party responses      │
│ 7. revision_requested → Sent back to party for changes         │
│ 8. approved         → Discipline approved the responses         │
│ 9. rejected         → Discipline rejected the submission        │
└─────────────────────────────────────────────────────────────────┘
```

### Context-Specific Workflow Examples

#### Contractor Vetting Workflow
```
Safety Discipline:
  Template → Draft → Pre-Issue Review → Issue to Contractor
  → Contractor Completes → Submit → Safety Reviews & Scores
  → Approved (85/100)

Construction Discipline:
  Template → Draft → Pre-Issue Review → Issue to Contractor
  → Contractor Completes → Submit → Construction Reviews & Scores
  → Approved (92/100)

[Similar for Finance, Security, QA]

Coordinator:
  All disciplines scored → Calculate weighted score (86/100)
  → Final Decision: APPROVED
```

#### Tender Evaluation Workflow
```
Construction Discipline (Technical Evaluation):
  Tender Template → Draft → Pre-Issue Review → Issue to Bidder
  → Bidder Submits Technical Proposal → Construction Scores
  → Technical Score: 88/100

Finance Discipline (Financial Evaluation):
  Pricing Template → Draft → Pre-Issue Review → Issue to Bidder
  → Bidder Submits Pricing → Finance Scores
  → Financial Score: 91/100

Safety Discipline (Safety Plan Evaluation):
  Safety Plan Template → Draft → Issue to Bidder
  → Bidder Submits Safety Plan → Safety Scores
  → Safety Score: 82/100

Coordinator:
  Calculate weighted score: (88×35%) + (91×30%) + (82×20%) + ...
  → Final Score: 87.5/100
  → Decision: AWARDED (Rank #2 bidder)
```

#### RFQ Evaluation Workflow
```
Procurement Discipline:
  RFQ Template → Draft → Issue to Supplier
  → Supplier Submits Quote → Procurement Scores
  → Commercial Score: 90/100

Quality Assurance:
  Product Specs Template → Issue to Supplier
  → Supplier Provides Specs → QA Scores
  → Quality Score: 85/100

Finance:
  Payment Terms Review → Score: 88/100

Coordinator:
  Weighted Score: (90×40%) + (85×20%) + (88×30%) + ...
  → Final Score: 88.2/100
  → Decision: APPROVED - Proceed to Purchase Order
```

---

## Scoring & Weighted Aggregation

### Generic Scoring Implementation

The scoring logic is **identical across all contexts** - only the interpretation changes:

```javascript
// Generic scoring service - works for all contexts
class ExternalPartyEvaluationService {
  
  async scoreDocument(documentId, scoreData) {
    const {
      sectionScores,
      overallComments,
      decision
    } = scoreData;
    
    const totalScore = sectionScores.reduce((sum, s) => sum + s.score, 0);
    const maxScore = sectionScores.reduce((sum, s) => sum + s.max, 0);
    const percentage = (totalScore / maxScore) * 100;
    
    // Update document with score
    await supabase
      .from('external_party_document_instances')
      .update({
        discipline_score: totalScore,
        discipline_max_score: maxScore,
        discipline_score_percentage: percentage,
        score_breakdown: { sections: sectionScores },
        scoring_comments: overallComments,
        scored_by: currentUserId,
        scored_at: new Date().toISOString(),
        status: decision,  // 'approved', 'rejected', 'revision_requested'
        reviewed_after_submission_by: currentUserId,
        reviewed_after_submission_at: new Date().toISOString(),
        review_decision: decision
      })
      .eq('id', documentId);
    
    // Add score to evaluation package
    await this.addScoreToPackage(documentId, {
      discipline_code: document.discipline_code,
      score: totalScore,
      max_score: maxScore,
      percentage: percentage,
      status: decision,
      comments: overallComments
    });
  }
  
  async calculateWeightedScore(packageId) {
    // Fetch package with all discipline scores
    const { data: package } = await supabase
      .from('evaluation_packages')
      .select('*, discipline_scores')
      .eq('id', packageId)
      .single();
    
    // Fetch context-specific weights
    const { data: weights } = await supabase
      .from('discipline_evaluation_weights')
      .select('*')
      .eq('organization_id', package.organization_id)
      .eq('evaluation_context', package.package_context)
      .eq('is_active', true);
    
    // Calculate weighted score
    const components = package.discipline_scores.map(score => {
      const weight = weights.find(w => w.discipline_code === score.discipline_code);
      const weighted = (score.percentage * weight.
