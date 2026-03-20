# 1300_00000_EXTERNAL_PARTY_EVALUATION_SYSTEM (Continued)

## Scoring & Weighted Aggregation (Continued)

```javascript
    // Calculate weighted score (continued)
    const components = package.discipline_scores.map(score => {
      const weight = weights.find(w => w.discipline_code === score.discipline_code);
      const weighted = (score.percentage * weight.weight_percentage) / 100;
      
      return {
        discipline: score.discipline_name,
        score: score.score,
        max: score.max_score,
        percentage: score.percentage,
        weight: weight.weight_percentage,
        weighted: weighted
      };
    });
    
    const totalWeightedScore = components.reduce((sum, c) => sum + c.weighted, 0);
    
    const calculation = {
      components,
      total: totalWeightedScore,
      calculated_at: new Date().toISOString(),
      calculated_by: currentUserId
    };
    
    // Save weighted score
    await supabase
      .from('evaluation_packages')
      .update({
        final_weighted_score: totalWeightedScore,
        final_weighted_percentage: totalWeightedScore,
        scoring_calculation: calculation,
        overall_status: 'scored'
      })
      .eq('id', packageId);
    
    return {
      weightedScore: totalWeightedScore,
      components,
      calculation
    };
  }
}
```

### Context-Specific Scoring Examples

#### Contractor Vetting Scoring
```javascript
// Safety discipline scores contractor
await evaluationService.scoreDocument(documentId, {
  sectionScores: [
    { section: 'Company Info', score: 20, max: 20 },
    { section: 'Safety Experience', score: 35, max: 40 },
    { section: 'Incident History', score: 30, max: 40 }
  ],
  overallComments: 'Strong safety record overall',
  decision: 'approved'
});
// Result: 85/100 (85%)
```

#### Tender Evaluation Scoring
```javascript
// Construction discipline scores technical proposal
await evaluationService.scoreDocument(documentId, {
  sectionScores: [
    { section: 'Technical Approach', score: 40, max: 45 },
    { section: 'Project Team', score: 35, max: 35 },
    { section: 'Equipment', score: 13, max: 20 }
  ],
  overallComments: 'Strong technical proposal, equipment concerns',
  decision: 'approved'
});
// Result: 88/100 (88%)

// Finance discipline scores pricing
await evaluationService.scoreDocument(priceDocId, {
  sectionScores: [
    { section: 'Price Competitiveness', score: 45, max: 50 },
    { section: 'Payment Terms', score: 28, max: 30 },
    { section: 'Price Breakdown', score: 18, max: 20 }
  ],
  overallComments: 'Competitive pricing with reasonable terms',
  decision: 'approved'
});
// Result: 91/100 (91%)
```

#### RFQ Scoring
```javascript
// Procurement scores quotation
await evaluationService.scoreDocument(documentId, {
  sectionScores: [
    { section: 'Pricing', score: 45, max: 50 },
    { section: 'Delivery Terms', score: 28, max: 30 },
    { section: 'Warranty', score: 17, max: 20 }
  ],
  overallComments: 'Competitive quote with good terms',
  decision: 'approved'
});
// Result: 90/100 (90%)
```

---

## Security & RLS Policies

### RLS Policies for external_party_document_instances

```sql
-- Enable RLS
alter table external_party_document_instances enable row level security;

-- Policy 1: Users can ONLY see documents from their own discipline
create policy "discipline_isolation_select"
on external_party_document_instances for select
using (
  discipline_code in (
    select discipline_code 
    from user_discipline_access 
    where user_id = auth.uid()
      and access_level in ('read', 'write', 'admin')
  )
  or assigned_to_party_email = (
    select email from user_management where user_id = auth.uid()
  )
  or auth.uid() in (
    select user_id from user_roles where role in ('admin', 'evaluation_coordinator')
  )
);

-- Policy 2: Users can ONLY insert documents for their own discipline
create policy "discipline_isolation_insert"
on external_party_document_instances for insert
with check (
  discipline_code in (
    select discipline_code 
    from user_discipline_access 
    where user_id = auth.uid()
      and access_level in ('write', 'admin')
  )
);

-- Policy 3: Users can ONLY update documents from their own discipline
create policy "discipline_isolation_update"
on external_party_document_instances for update
using (
  discipline_code in (
    select discipline_code 
    from user_discipline_access 
    where user_id = auth.uid()
      and access_level in ('write', 'admin')
  )
  or (
    -- External parties can update their assigned documents
    assigned_to_party_email = (
      select email from user_management where user_id = auth.uid()
    )
    and status in ('issued', 'in_progress', 'revision_requested')
  )
);

-- Policy 4: Users can ONLY delete documents from their own discipline
create policy "discipline_isolation_delete"
on external_party_document_instances for delete
using (
  discipline_code in (
    select discipline_code 
    from user_discipline_access 
    where user_id = auth.uid()
      and access_level = 'admin'
  )
);
```

### RLS Policies for evaluation_packages

```sql
-- Enable RLS
alter table evaluation_packages enable row level security;

-- Coordinators can view all packages
create policy "coordinators_view_all_packages"
on evaluation_packages for select
using (
  exists (
    select 1 from user_roles 
    where user_id = auth.uid() 
    and role in ('admin', 'evaluation_coordinator')
  )
);

-- Discipline members can view packages containing their documents
create policy "discipline_view_related_packages"
on evaluation_packages for select
using (
  id in (
    select distinct evaluation_package_id 
    from external_party_document_instances 
    where discipline_code in (
      select discipline_code from user_discipline_access where user_id = auth.uid()
    )
  )
);

-- Only coordinators can update weighted scores
create policy "coordinators_update_weighted_scores"
on evaluation_packages for update
using (
  exists (
    select 1 from user_roles 
    where user_id = auth.uid() 
    and role in ('admin', 'evaluation_coordinator')
  )
);

-- External parties can view their own packages
create policy "parties_view_own_packages"
on evaluation_packages for select
using (
  party_email = (
    select email from user_management where user_id = auth.uid()
  )
);
```

---

## UI Components

### Generic Reusable Components

All UI components are **context-agnostic** and work across all evaluation types:

#### Component 1: ExternalPartyDocumentModal

**Purpose**: Create document from template (works for all contexts)

```javascript
import React, { useState } from 'react';

export const ExternalPartyDocumentModal = ({ 
  isOpen, 
  onClose, 
  template, 
  context,  // 'contractor_vetting', 'tender_response', etc.
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    documentName: `${template.template_name} - Copy`,
    partyEmail: '',
    partyName: '',
    partyOrgName: '',
    partyType: context === 'contractor_vetting' ? 'contractor' : 
               context === 'tender_response' ? 'bidder' : 
               context === 'rfq_response' ? 'supplier' : 'respondent',
    dueDate: '',
    instructions: '',
    contextReferenceId: '',  // Tender/RFQ number
    contextMetadata: {}
  });
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create Document from Template</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            ...formData,
            templateId: template.id,
            disciplineCode: template.discipline_code,
            documentContext: context
          });
        }}>
          {/* Form fields */}
          <input
            type="email"
            placeholder={`${formData.partyType} email`}
            value={formData.partyEmail}
            onChange={(e) => setFormData({...formData, partyEmail: e.target.value})}
            required
          />
          
          {/* Context-specific fields */}
          {context === 'tender_response' && (
            <input
              type="text"
              placeholder="Tender Number"
              value={formData.contextReferenceId}
              onChange={(e) => setFormData({...formData, contextReferenceId: e.target.value})}
            />
          )}
          
          {context === 'rfq_response' && (
            <input
              type="text"
              placeholder="RFQ Number"
              value={formData.contextReferenceId}
              onChange={(e) => setFormData({...formData, contextReferenceId: e.target.value})}
            />
          )}
          
          <button type="submit">Create Draft Document</button>
        </form>
      </div>
    </div>
  );
};
```

#### Component 2: ScoringModal

**Purpose**: Score external party responses (works for all contexts)

```javascript
export const ScoringModal = ({ 
  isOpen, 
  onClose, 
  document, 
  context,  // Determines UI labels
  onSubmitScore 
}) => {
  const getContextLabels = (ctx) => {
    const labels = {
      contractor_vetting: {
        title: 'Score Contractor',
        partyLabel: 'Contractor',
        decisionsLabel: 'Vetting Decision'
      },
      tender_response: {
        title: 'Score Bid',
        partyLabel: 'Bidder',
        decisionsLabel: 'Evaluation Decision'
      },
      rfq_response: {
        title: 'Score Quotation',
        partyLabel: 'Supplier',
        decisionsLabel: 'Quote Decision'
      }
    };
    return labels[ctx] || labels.contractor_vetting;
  };
  
  const labels = getContextLabels(context);
  
  return (
    <div className="modal-overlay">
      <div className="modal-content scoring-modal">
        <h2>{labels.title} - {document.document_name}</h2>
        
        <div className="party-info">
          <p><strong>{labels.partyLabel}:</strong> {document.assigned_to_party_name}</p>
        </div>
        
        {/* Scoring interface - identical across contexts */}
        <div className="scoring-sections">
          {/* Section scoring inputs */}
        </div>
        
        <div className="modal-footer">
          <button onClick={() => onSubmitScore('rejected')}>Reject</button>
          <button onClick={() => onSubmitScore('revision_requested')}>Request Revision</button>
          <button onClick={() => onSubmitScore('approved')}>Approve</button>
        </div>
      </div>
    </div>
  );
};
```

#### Component 3: WeightedScoringModal

**Purpose**: Calculate weighted final score (coordinator use)

```javascript
export const WeightedScoringModal = ({ 
  isOpen, 
  onClose, 
  evaluationPackage, 
  context,
  onFinalDecision 
}) => {
  const [weightedScore, setWeightedScore] = useState(0);
  const [decision, setDecision] = useState('');
  
  const getContextDecisions = (ctx) => {
    const decisions = {
      contractor_vetting: ['approved', 'rejected', 'conditional'],
      tender_response: ['awarded', 'shortlisted', 'rejected'],
      rfq_response: ['approved', 'rejected', 'under_negotiation'],
      prequalification: ['qualified', 'disqualified', 'conditional']
    };
    return decisions[ctx] || decisions.contractor_vetting;
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content weighted-scoring-modal">
        <h2>Final Evaluation - {evaluationPackage.party_name}</h2>
        
        <table>
          <thead>
            <tr>
              <th>Discipline</th>
              <th>Score</th>
              <th>Weight</th>
              <th>Weighted Score</th>
            </tr>
          </thead>
          <tbody>
            {/* Discipline scores */}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3"><strong>FINAL WEIGHTED SCORE:</strong></td>
              <td><strong>{weightedScore.toFixed(2)}/100</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <select 
          value={decision} 
          onChange={(e) => setDecision(e.target.value)}
        >
          <option value="">Select decision...</option>
          {getContextDecisions(context).map(d => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
        
        <button onClick={() => onFinalDecision({
          packageId: evaluationPackage.id,
          finalScore: weightedScore,
          decision
        })}>
          Submit Final Decision
        </button>
      </div>
    </div>
  );
};
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Objective**: Create generic database tables and core service layer

**Tasks**:
1. ✅ Create `external_party_document_instances` table
2. ✅ Create `evaluation_packages` table
3. ✅ Create `discipline_evaluation_weights` table
4. ✅ Create `user_discipline_access` table (if not exists)
5. ✅ Implement RLS policies for all tables
6. ✅ Create ExternalPartyEvaluationService.js (Pattern B)
7. ✅ Test table structure and RLS policies

**Success Criteria**:
- All tables created with proper constraints
- RLS policies enforce discipline isolation
- Service layer operational with basic CRUD
- Context field validated across all operations

### Phase 2: Contractor Vetting Implementation (Weeks 3-4)

**Objective**: Implement first context (contractor vetting) as proof of concept

**Tasks**:
1. ✅ Add HTML preview to Safety Templates page
2. ✅ Implement "Use Template" workflow
3. ✅ Create Draft Documents tab
4. ✅ Build Pre-Issue Review modal
5. ✅ Implement Issue to Contractor workflow
6. ✅ Test complete contractor vetting cycle

**Success Criteria**:
- Contractor vetting fully functional
- Documents created with document_context='contractor_vetting'
- All workflow states working
- Discipline isolation verified

### Phase 3: Tender Evaluation Implementation (Weeks 5-6)

**Objective**: Implement tender evaluation reusing existing components

**Tasks**:
1. ✅ Add tender templates to Procurement page (01900)
2. ✅ Reuse ExternalPartyDocumentModal with context='tender_response'
3. ✅ Configure tender-specific evaluation weights
4. ✅ Test tender evaluation workflow
5. ✅ Verify context-specific metadata storage

**Success Criteria**:
- Tender evaluation operational
- Context switching works seamlessly
- Different evaluation weights applied correctly
- UI adapts to tender context

### Phase 4: RFQ Evaluation Implementation (Weeks 7-8)

**Objective**: Add RFQ evaluation context

**Tasks**:
1. ✅ Add RFQ templates to Procurement page
2. ✅ Configure RFQ-specific weights
3. ✅ Test RFQ evaluation workflow
4. ✅ Verify supplier scoring

**Success Criteria**:
- RFQ evaluation functional
- Three contexts (vetting, tender, RFQ) coexist
- No interference between contexts
- All use same core tables and components

### Phase 5: Contractor Access & Other Parties Integration (Weeks 9-10)

**Objective**: Build external party document viewer

**Tasks**:
1. ✅ Add "Assigned Documents" section to Other Parties page (01850)
2. ✅ Build context-aware document viewer
3. ✅ Implement Q&A interface with auto-save
4. ✅ Add submit functionality
5. ✅ Test access across all contexts

**Success Criteria**:
- External parties can access their documents
- Viewer adapts to document context
- Responses save correctly
- Submit workflow functional

### Phase 6: Coordinator Dashboard & Weighted Scoring (Weeks 11-12)

**Objective**: Build evaluation coordinator functionality

**Tasks**:
1. ✅ Create Evaluation Coordinator Dashboard page
2. ✅ Build context-aware package list
3. ✅ Implement WeightedScoringModal
4. ✅ Add final decision workflow
5. ✅ Build weights configuration page
6. ✅ Test complete evaluation cycle

**Success Criteria**:
- Coordinator can view all packages across contexts
- Weighted scoring works for all contexts
- Context-specific decisions supported
- Final decisions recorded properly

### Phase 7: Additional Contexts (Weeks 13-14)

**Objective**: Add remaining contexts (prequalification, RFI, consultant selection)

**Tasks**:
1. ✅ Configure prequalification context
2. ✅ Configure RFI context
3. ✅ Configure consultant selection context
4. ✅ Test all contexts end-to-end
5. ✅ Document context-specific configurations

**Success Criteria**:
- All 7 contexts operational
- System handles context switching smoothly
- No performance degradation
- Documentation complete

---

## Configuration

### Default Evaluation Weights by Context

#### Contractor Vetting Weights

```sql
insert into discipline_evaluation_weights 
  (organization_id, evaluation_context, discipline_code, discipline_name, weight_percentage, scoring_criteria)
values
  (current_org_id, 'contractor_vetting', '02400', 'Safety', 30.00, 
   '{"criteria": ["Safety record", "Certifications", "Incident history"]}'),
  (current_org_id, 'contractor_vetting', '00435', 'Construction', 25.00,
   '{"criteria": ["Experience", "Quality of work", "Equipment"]}'),
  (current_org_id, 'contractor_vetting', '01200', 'Finance', 25.00,
   '{"criteria": ["Financial stability", "Insurance", "Payment history"]}'),
  (current_org_id, 'contractor_vetting', '02500', 'Security', 15.00,
   '{"criteria": ["Background checks", "Clearances", "References"]}'),
  (current_org_id, 'contractor_vetting', '02200', 'Quality Assurance', 5.00,
   '{"criteria": ["ISO certifications", "QA systems", "Audit history"]}');
```

#### Tender Evaluation Weights

```sql
insert into discipline_evaluation_weights 
  (organization_id, evaluation_context, discipline_code, discipline_name, weight_percentage, scoring_criteria)
values
  (current_org_id, 'tender_evaluation', '00435', 'Construction', 35.00,
   '{"criteria": ["Technical approach", "Project team", "Equipment", "Experience"]}'),
  (current_org_id, 'tender_evaluation', '01200', 'Finance', 30.00,
   '{"criteria": ["Price competitiveness", "Payment terms", "Financial capacity"]}'),
  (current_org_id, 'tender_evaluation', '02400', 'Safety', 20.00,
   '{"criteria": ["Safety plan", "Safety record", "PPE provisions"]}'),
  (current_org_id, 'tender_evaluation', '02200', 'Quality Assurance', 10.00,
   '{"criteria": ["Quality plan", "QA/QC procedures", "Testing protocols"]}'),
  (current_org_id, 'tender_evaluation', '02500', 'Security', 5.00,
   '{"criteria": ["Security plan", "Personnel clearance", "Site security"]}');
```

#### RFQ Evaluation Weights

```sql
insert into discipline_evaluation_weights 
  (organization_id, evaluation_context, discipline_code, discipline_name, weight_percentage, scoring_criteria)
values
  (current_org_id, 'rfq_evaluation', '01900', 'Procurement', 40.00,
   '{"criteria": ["Pricing", "Delivery terms", "Commercial terms"]}'),
  (current_org_id, 'rfq_evaluation', '01200', 'Finance', 30.00,
   '{"criteria": ["Payment terms", "Currency", "Price validity"]}'),
  (current_org_id, 'rfq_evaluation', '02200', 'Quality Assurance', 20.00,
   '{"criteria": ["Product quality", "Standards compliance", "Certifications"]}'),
  (current_org_id, 'rfq_evaluation', '00435', 'Construction', 10.00,
   '{"criteria": ["Technical specifications", "Compatibility", "Installation"]}');
```

---

## Migration from Contractor-Specific to Generic

### Migration Script

```sql
-- If you already created contractor_document_instances, migrate to generic

-- Step 1: Rename tables
alter table if exists contractor_document_instances 
  rename to external_party_document_instances;

alter table if exists contractor_vetting_packages 
  rename to evaluation_packages;

alter table if exists discipline_vetting_weights 
  rename to discipline_evaluation_weights;

-- Step 2: Add new columns
alter table external_party_document_instances 
  add column if not exists document_context varchar(50) default 'contractor_vetting';

alter table external_party_document_instances 
  add column if not exists context_reference_id varchar(100);

alter table external_party_document_instances 
  add column if not exists context_metadata jsonb default '{}'::jsonb;

-- Step 3: Rename columns
alter table external_party_document_instances 
  rename column assigned_to_contractor_id to assigned_to_party_id;

alter table external_party_document_instances 
  rename column assigned_to_contractor_email to assigned_to_party_email;

alter table external_party_document_instances 
  rename column assigned_to_contractor_name to assigned_to_party_name;

alter table external_party_document_instances 
  rename column assigned_to_contractor_org_name to assigned_to_party_org_name;

alter table external_party_document_instances 
  add column if not exists assigned_to_party_type varchar(50) default 'contractor';

alter table external_party_document_instances 
  rename column vetting_package_id to evaluation_package_id;

alter table external_party_document_instances 
  rename column vetting_package_name to evaluation_package_name;

alter table external_party_document_instances 
  rename column contractor_responses to party_responses;

-- Step 4: Add new constraints
alter table external_party_document_instances 
  add constraint valid_document_context check (
    document_context in (
      'contractor_vetting', 'tender_response', 'rfq_response', 
      'prequalification', 'rfi_response', 'consultant_selection',
      'subcontractor_evaluation'
    )
  );

-- Step 5: Update evaluation_packages table
alter table evaluation_packages 
  add column if not exists package_context varchar(50) default 'contractor_vetting';

alter table evaluation_packages 
  add column if not exists context_reference_id varchar(100);

alter table evaluation_packages 
  rename column contractor_email to party_email;

alter table evaluation_packages 
  rename column contractor_name to party_name;

alter table evaluation_packages 
  rename column contractor_org_name to party_org_name;

alter table evaluation_packages 
  rename column contractor_id to party_id;

alter table evaluation_packages 
  add column if not exists party_type varchar(50) default 'contractor';

-- Step 6: Update discipline_evaluation_weights table
alter table discipline_evaluation_weights 
  add column if not exists evaluation_context varchar(50) default 'contractor_vetting';

alter table discipline_evaluation_weights 
  drop constraint if exists unique_discipline_per_org;

alter table discipline_evaluation_weights 
  add constraint unique_discipline_per_org_context 
  unique (organization_id, evaluation_context, discipline_code);

-- Step 7: Create new indexes
create index if not exists idx_ext_party_docs_context 
  on external_party_document_instances(document_context);

create index if not exists idx_ext_party_docs_context_ref 
  on external_party_document_instances(context_reference_id);

create index if not exists idx_eval_packages_context 
  on evaluation_packages(package_context);

create index if not exists idx_eval_packages_context_ref 
  on evaluation_packages(context_reference_id);

create index if not exists idx_discipline_eval_weights_context 
  on discipline_evaluation_weights(evaluation_context);

-- Step 8: Update existing data
update external_party_document_instances 
set document_context = 'contractor_vetting'
where document_context is null;

update external_party_document_instances 
set assigned_to_party_type = 'contractor'
where assigned_to_party_type is null;

update evaluation_packages 
set package_context = 'contractor_vetting'
where package_context is null;

update evaluation_packages 
set party_type = 'contractor'
where party_type is null;

update discipline_evaluation_weights 
set evaluation_context = 'contractor_vetting'
where evaluation_context is null;
```

---

## Status & Version Control

**Current Status**: ARCHITECTURAL PLAN - Generic & Reusable Design

**Version**: 2.0 (Revised from contractor-specific)  
**Date**: October 2025  
**Author**: System Architect  
**Approved By**: Pending  

**Changes from Version 1.0**:
- Renamed tables to be context-agnostic
- Added `document_context` field to distinguish use cases
- Added `context_metadata` JSONB for flexible context-specific data
- Renamed contractor-specific fields to generic party fields
- Added support for 7 different evaluation contexts
- Made evaluation weights context-aware
- Updated all documentation to reflect generic design

**Next Steps**:
1. Review and approve revised architecture
2. Begin Phase 1 implementation (generic tables)
3. Implement contractor vetting as first context
4. Expand to tender and RFQ evaluation
5. Add remaining contexts

**Dependencies**:
- Existing safety_templates, procurement_templates tables
- User authentication system
- Email notification system
- Supabase database access

**Benefits of Generic Design**:
- Single codebase supports multiple evaluation types
- Consistent UX across all evaluation contexts
- Easy to add new evaluation types
- Lower maintenance burden
- Better code reuse

---

## References

- [Original Contractor Vetting Plan](./1300_02400_CONTRACTOR_VETTING_MULTI_DISCIPLINE_SYSTEM.md)
- [Safety Master Guide](./1300_02400_HSE_MASTER_GUIDE.md)
- [Procurement Templates](./1300_01900_PROCUREMENT_TEMPLATE_SYSTEM.md)
- [Pattern B Supabase Integration](../database-systems/0500_SUPABASE_DUAL_SYSTEM_ANALYSIS.md)
- [Chatbot Implementation](./1300_00435_LANGCHAIN_CHATBOT_COMPLETE_IMPLEMENTATION.md)

---

**END OF DOCUMENT**
