# 1300_02400_CONTRACTOR_VETTING_MULTI_DISCIPLINE_SYSTEM (Continued)

## Security & RLS Policies (Continued)

```sql
-- Coordinators can view all vetting packages
create policy "coordinators_view_all_packages"
on contractor_vetting_packages for select
using (
  exists (
    select 1 from user_roles 
    where user_id = auth.uid() 
    and role in ('admin', 'vetting_coordinator')
  )
);

-- Discipline members can view packages containing their documents
create policy "discipline_view_related_packages"
on contractor_vetting_packages for select
using (
  id in (
    select distinct vetting_package_id 
    from contractor_document_instances 
    where discipline_code in (
      select discipline_code from user_discipline_access where user_id = auth.uid()
    )
  )
);

-- Only coordinators can update weighted scores
create policy "coordinators_update_weighted_scores"
on contractor_vetting_packages for update
using (
  exists (
    select 1 from user_roles 
    where user_id = auth.uid() 
    and role in ('admin', 'vetting_coordinator')
  )
);
```

---

## UI Components

### Phase 1: Safety Templates Page Enhancement

**File**: `client/src/pages/02400-safety/components/02400-safety-document-templates-page.js`

**New Tabs to Add**:

```javascript
const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'drafts', 'issued'

return (
  <div className="safety-templates-page">
    {/* Existing stats cards */}
    
    {/* Tab Navigation */}
    <div className="tab-navigation">
      <button 
        className={activeTab === 'templates' ? 'active' : ''}
        onClick={() => setActiveTab('templates')}
      >
        Templates
      </button>
      <button 
        className={activeTab === 'drafts' ? 'active' : ''}
        onClick={() => setActiveTab('drafts')}
      >
        Draft Documents
      </button>
      <button 
        className={activeTab === 'issued' ? 'active' : ''}
        onClick={() => setActiveTab('issued')}
      >
        Issued Documents
      </button>
    </div>
    
    {/* Tab Content */}
    {activeTab === 'templates' && <TemplatesView />}
    {activeTab === 'drafts' && <DraftDocumentsView />}
    {activeTab === 'issued' && <IssuedDocumentsView />}
  </div>
);
```

### Component 1: HTMLPreviewModal

**File**: `client/src/pages/02400-safety/components/modals/HTMLPreviewModal.jsx`

**Purpose**: Display HTML content from templates safely

```javascript
import React from 'react';
import './HTMLPreviewModal.css';

export const HTMLPreviewModal = ({ isOpen, onClose, htmlContent, templateName }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content html-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>HTML Preview: {templateName}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="preview-actions">
            <button onClick={() => window.print()}>Print</button>
            <button onClick={() => navigator.clipboard.writeText(htmlContent)}>
              Copy HTML
            </button>
          </div>
          
          <div className="html-preview-container">
            <iframe
              srcDoc={htmlContent}
              sandbox="allow-same-origin"
              title="HTML Preview"
              style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
```

### Component 2: CreateDocumentModal

**File**: `client/src/pages/02400-safety/components/modals/CreateDocumentModal.jsx`

**Purpose**: "Use Template" workflow - create document from template

```javascript
import React, { useState } from 'react';
import './CreateDocumentModal.css';

export const CreateDocumentModal = ({ isOpen, onClose, template, onSubmit }) => {
  const [formData, setFormData] = useState({
    documentName: `${template.template_name} - Copy`,
    contractorEmail: '',
    contractorName: '',
    contractorOrgName: '',
    dueDate: '',
    instructions: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      templateId: template.id,
      disciplineCode: '02400'
    });
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-document-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Document from Template</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="template-preview">
              <h3>{template.template_name}</h3>
              <p>{template.template_description}</p>
            </div>
            
            <div className="form-group">
              <label>Document Name*</label>
              <input
                type="text"
                value={formData.documentName}
                onChange={(e) => setFormData({...formData, documentName: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Contractor Email*</label>
              <input
                type="email"
                value={formData.contractorEmail}
                onChange={(e) => setFormData({...formData, contractorEmail: e.target.value})}
                placeholder="contractor@company.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Contractor Name</label>
              <input
                type="text"
                value={formData.contractorName}
                onChange={(e) => setFormData({...formData, contractorName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Contractor Organization</label>
              <input
                type="text"
                value={formData.contractorOrgName}
                onChange={(e) => setFormData({...formData, contractorOrgName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Due Date*</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Additional Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                rows="4"
                placeholder="Any special instructions for the contractor..."
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Draft Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### Component 3: PreIssueReviewModal

**File**: `client/src/pages/02400-safety/components/modals/PreIssueReviewModal.jsx`

**Purpose**: Review document before issuing to contractor

```javascript
import React, { useState } from 'react';
import './PreIssueReviewModal.css';

export const PreIssueReviewModal = ({ isOpen, onClose, document, onApprove, onRequestChanges }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  
  const handleApprove = async () => {
    await onApprove(document.id, reviewNotes);
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pre-issue-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pre-Issue Review</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="document-info">
            <h3>{document.document_name}</h3>
            <p><strong>Contractor:</strong> {document.assigned_to_contractor_email}</p>
            <p><strong>Due Date:</strong> {new Date(document.due_date).toLocaleDateString()}</p>
          </div>
          
          <div className="html-preview">
            <h4>Document Content Preview</h4>
            <iframe
              srcDoc={document.html_content}
              sandbox="allow-same-origin"
              title="Document Preview"
              style={{ width: '100%', height: '400px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div className="form-group">
            <label>Review Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows="4"
              placeholder="Add any review comments or notes..."
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-warning" onClick={() => onRequestChanges(document.id, reviewNotes)}>
            Request Changes
          </button>
          <button className="btn-success" onClick={handleApprove}>
            Approve for Issue
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Component 4: DisciplineScoringModal

**File**: `client/src/pages/02400-safety/components/modals/DisciplineScoringModal.jsx`

**Purpose**: Score contractor responses section by section

```javascript
import React, { useState } from 'react';
import './DisciplineScoringModal.css';

export const DisciplineScoringModal = ({ isOpen, onClose, document, onSubmitScore }) => {
  const [sectionScores, setSectionScores] = useState([]);
  const [overallComments, setOverallComments] = useState('');
  
  const calculateTotal = () => {
    return sectionScores.reduce((sum, s) => sum + s.score, 0);
  };
  
  const calculateMaxTotal = () => {
    return sectionScores.reduce((sum, s) => sum + s.max, 0);
  };
  
  const handleSubmit = async (decision) => {
    const totalScore = calculateTotal();
    const maxScore = calculateMaxTotal();
    const percentage = (totalScore / maxScore) * 100;
    
    await onSubmitScore({
      documentId: document.id,
      score: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      breakdown: { sections: sectionScores },
      comments: overallComments,
      decision: decision
    });
    
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content scoring-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Score Document - {document.document_name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="contractor-responses">
            <h3>Contractor Responses</h3>
            {/* Display contractor's responses */}
            <div className="responses-content">
              {document.contractor_responses && 
                Object.entries(document.contractor_responses).map(([key, response]) => (
                  <div key={key} className="response-item">
                    <p><strong>Q:</strong> {response.question}</p>
                    <p><strong>A:</strong> {response.answer}</p>
                  </div>
                ))
              }
            </div>
          </div>
          
          <div className="scoring-section">
            <h3>Section Scoring</h3>
            {/* Section scoring inputs */}
            <div className="score-inputs">
              <div className="section-score">
                <label>Section 1: Company Information</label>
                <input type="number" placeholder="Score" />
                <span>/ 20</span>
              </div>
              {/* More sections... */}
            </div>
            
            <div className="total-score">
              <h4>Total Score: {calculateTotal()} / {calculateMaxTotal()} 
                ({((calculateTotal() / calculateMaxTotal()) * 100).toFixed(1)}%)
              </h4>
            </div>
          </div>
          
          <div className="form-group">
            <label>Overall Comments</label>
            <textarea
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              rows="4"
              placeholder="Overall assessment and comments..."
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={() => handleSubmit('rejected')}>
            Reject
          </button>
          <button className="btn-warning" onClick={() => handleSubmit('revision_requested')}>
            Request Revision
          </button>
          <button className="btn-success" onClick={() => handleSubmit('approved')}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Component 5: WeightedScoringModal (Coordinator)

**File**: `client/src/pages/coordinator/components/WeightedScoringModal.jsx`

**Purpose**: Calculate weighted final score across all disciplines

```javascript
import React, { useState, useEffect } from 'react';
import './WeightedScoringModal.css';

export const WeightedScoringModal = ({ isOpen, onClose, vettingPackage, weights, onFinalDecision }) => {
  const [weightedScore, setWeightedScore] = useState(0);
  const [components, setComponents] = useState([]);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  
  useEffect(() => {
    if (vettingPackage && weights) {
      calculateWeightedScore();
    }
  }, [vettingPackage, weights]);
  
  const calculateWeightedScore = () => {
    const comps = vettingPackage.discipline_scores.map(score => {
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
    
    const total = comps.reduce((sum, c) => sum + c.weighted, 0);
    setComponents(comps);
    setWeightedScore(total);
  };
  
  const handleSubmit = async () => {
    await onFinalDecision({
      packageId: vettingPackage.id,
      finalScore: weightedScore,
      components: components,
      decision: decision,
      comments: comments
    });
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content weighted-scoring-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Final Vetting Score - {vettingPackage.contractor_name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="discipline-scores-table">
            <h3>Individual Discipline Scores</h3>
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
                {components.map((comp, idx) => (
                  <tr key={idx}>
                    <td>{comp.discipline}</td>
                    <td>{comp.score}/{comp.max} ({comp.percentage.toFixed(1)}%)</td>
                    <td>{comp.weight}%</td>
                    <td className="weighted-score">{comp.weighted.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3"><strong>FINAL WEIGHTED SCORE:</strong></td>
                  <td className="final-score"><strong>{weightedScore.toFixed(2)}/100</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="threshold-indicator">
            <p>Approval Threshold: 85%</p>
            <p className={weightedScore >= 85 ? 'meets-threshold' : 'below-threshold'}>
              {weightedScore >= 85 ? '✅ MEETS THRESHOLD' : '❌ BELOW THRESHOLD'}
            </p>
          </div>
          
          <div className="form-group">
            <label>Final Decision*</label>
            <select value={decision} onChange={(e) => setDecision(e.target.value)} required>
              <option value="">Select decision...</option>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
              <option value="conditional">Conditional Approval</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Decision Comments*</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="4"
              placeholder="Rationale for final decision..."
              required
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={!decision || !comments}
          >
            Submit Final Decision
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Objective**: Set up database tables and basic HTML preview

**Tasks**:
1. ✅ Create `contractor_document_instances` table
2. ✅ Create `discipline_vetting_weights` table
3. ✅ Create `contractor_vetting_packages` table
4. ✅ Create `user_discipline_access` table (if not exists)
5. ✅ Implement RLS policies for all tables
6. ✅ Add HTML preview tab to View Template modal
7. ✅ Create HTMLPreviewModal component
8. ✅ Test HTML rendering with safety templates

**Success Criteria**:
- All tables created with proper constraints
- RLS policies enforced
- HTML content displays correctly in iframe
- Discipline isolation verified

### Phase 2: Document Creation Workflow (Weeks 3-4)

**Objective**: Implement "Use Template" → Create Draft → Pre-Issue Review → Issue

**Tasks**:
1. ✅ Create DocumentInstanceService.js (Pattern B)
2. ✅ Add "Use Template" button to templates table
3. ✅ Implement CreateDocumentModal
4. ✅ Add "Draft Documents" tab to Safety Templates page
5. ✅ Implement DraftDocumentsTable component
6. ✅ Create PreIssueReviewModal
7. ✅ Implement document issue workflow (generate access token, send email)
8. ✅ Test full workflow: Template → Draft → Review → Issue

**Success Criteria**:
- Documents created from templates successfully
- Template snapshot frozen at creation time
- Pre-issue review workflow functional
- Access tokens generated and emails sent
- Documents appear in "Draft Documents" tab

### Phase 3: Contractor Access (Weeks 5-6)

**Objective**: Build contractor document viewer on Other Parties page

**Tasks**:
1. ✅ Add "Assigned Documents" section to Other Parties page (01850)
2. ✅ Implement contractor document list view
3. ✅ Create ContractorDocumentViewer component
4. ✅ Build question-answer interface
5. ✅ Implement auto-save functionality
6. ✅ Add submit functionality with confirmation
7. ✅ Test contractor access via email link and Other Parties page

**Success Criteria**:
- Contractors can view assigned documents
- Q&A interface functional
- Responses auto-save every 2 minutes
- Submit workflow works correctly
- Discipline members receive submission notifications

### Phase 4: Discipline Scoring (Weeks 7-8)

**Objective**: Implement post-submission review and scoring

**Tasks**:
1. ✅ Add "Issued Documents" tab to Safety Templates page
2. ✅ Implement IssuedDocumentsTable with status badges
3. ✅ Create DisciplineScoringModal
4. ✅ Build section-by-section scoring interface
5. ✅ Implement score calculation logic
6. ✅ Add approve/reject/revision workflows
7. ✅ Update vetting package with discipline scores
8. ✅ Test scoring workflow end-to-end

**Success Criteria**:
- Discipline members can score contractor responses
- Score breakdown stored correctly
- Decisions update document status
- Scores added to vetting packages
- Notifications sent on decision

### Phase 5: Weighted Aggregation (Weeks 9-10)

**Objective**: Build coordinator dashboard and weighted scoring

**Tasks**:
1. ✅ Create VettingCoordinatorDashboard page
2. ✅ Implement VettingPackageService.js
3. ✅ Build vetting packages list view
4. ✅ Create WeightedScoringModal
5. ✅ Implement weighted score calculation
6. ✅ Add final decision workflow
7. ✅ Build discipline weights configuration page
8. ✅ Test complete vetting cycle across multiple disciplines

**Success Criteria**:
- Coordinator can view all vetting packages
- Weighted scores calculate correctly
- Final decisions recorded properly
- All parties notified of final decision
- Weights configurable per organization

### Phase 6: Reporting & Analytics (Weeks 11-12)

**Objective**: Add reporting capabilities and analytics

**Tasks**:
1. ✅ Build vetting history reports
2. ✅ Implement contractor performance tracking
3. ✅ Add discipline performance metrics
4. ✅ Create weighting analysis tools
5. ✅ Build audit trail views
6. ✅ Implement email notification system
7. ✅ Add export functionality (PDF/Excel)

**Success Criteria**:
- Comprehensive vetting reports available
- Historical data queryable
- Performance metrics accurate
- Email notifications working
- Exports functional

---

## Configuration

### Default Discipline Weights

```sql
-- Run this after creating discipline_vetting_weights table
insert into discipline_vetting_weights 
  (organization_id, discipline_code, discipline_name, weight_percentage, scoring_criteria, max_score, passing_score)
values
  (
    (select id from organizations where name = 'Your Organization' limit 1),
    '02400',
    'Safety',
    30.00,
    '{"criteria": ["Safety record", "HSEQ certifications", "Incident history", "PPE compliance", "Training programs"]}',
    100,
    70
  ),
  (
    (select id from organizations where name = 'Your Organization' limit 1),
    '00435',
    'Construction',
    25.00,
    '{"criteria": ["Project experience", "Quality of work", "Equipment availability", "Previous projects", "Technical capability"]}',
    100,
    70
  ),
  (
    (select id from organizations where name = 'Your Organization' limit 1),
    '01200',
    'Finance',
    25.00,
    '{"criteria": ["Financial stability", "Insurance coverage", "Banking references", "Payment history", "Credit rating"]}',
    100,
    70
  ),
  (
    (select id from organizations where name = 'Your Organization' limit 1),
    '02500',
    'Security',
    15.00,
    '{"criteria": ["Background checks", "Security clearances", "Criminal record", "References", "Legal compliance"]}',
    100,
    70
  ),
  (
    (select id from organizations where name = 'Your Organization' limit 1),
    '02200',
    'Quality Assurance',
    5.00,
    '{"criteria": ["ISO 9001 certification", "QA management system", "Standards compliance", "Audit history", "Quality procedures"]}',
    100,
    70
  );
```

### User Discipline Access Configuration

```sql
-- Grant Safety discipline access to users
insert into user_discipline_access (user_id, discipline_code, access_level)
select 
  um.user_id,
  '02400',
  case 
    when ur.role = 'safety_manager' then 'admin'
    when ur.role = 'safety_officer' then 'write'
    else 'read'
  end
from user_management um
join user_roles ur on um.user_id = ur.user_id
where ur.role in ('safety_manager', 'safety_officer', 'safety_coordinator');

-- Grant Vetting Coordinator role
insert into user_roles (user_id, role)
select user_id, 'vetting_coordinator'
from user_management
where email in ('coordinator@company.com', 'hse.manager@company.com');
```

### Environment Variables

```env
# Access Token Expiry (in days)
CONTRACTOR_DOCUMENT_ACCESS_EXPIRY=30

# Email Configuration
VETTING_NOTIFICATION_FROM=noreply@company.com
VETTING_COORDINATOR_EMAIL=vetting@company.com

# Approval Threshold (percentage)
VETTING_APPROVAL_THRESHOLD=85.0
```

### Email Templates

**Document Assignment Email**:
```
Subject: Document Assignment - {document_name}

Dear {contractor_name},

You have been assigned a document to complete for contractor vetting:

Document: {document_name}
Organization: {organization_name}
Due Date: {due_date}

Please click the link below to access and complete the document:
{access_link}

This link will expire in 30 days from the issue date.

If you have any questions, please contact {assigned_by_email}.

Best regards,
{organization_name}
```

**Document Submission Confirmation**:
```
Subject: Document Submitted - {document_name}

Dear {contractor_name},

Your responses for {document_name} have been successfully submitted for review.

Submission Date: {submission_date}
Document Status: Under Review

You will be notified once the review is complete.

Best regards,
{organization_name}
```

**Vetting Completion Email**:
```
Subject: Vetting Complete - Final Decision

Dear {contractor_name},

Your contractor vetting process has been completed.

Final Weighted Score: {weighted_score}/100
Decision: {decision} ({approved/rejected/conditional})

{decision_comments}

Thank you for your participation.

Best regards,
{organization_name}
```

---

## Status & Version Control

**Current Status**: ARCHITECTURAL PLAN - Ready for Implementation

**Version**: 1.0  
**Date**: October 2025  
**Author**: System Architect  
**Approved By**: Pending  

**Next Steps**:
1. Review and approve architecture plan
2. Begin Phase 1 implementation (database tables)
3. Set up development environment
4. Create first HTML preview functionality

**Dependencies**:
- Existing safety_templates table
- User authentication system
- Email notification system
- Supabase database access

**Risk Mitigation**:
- RLS policies prevent cross-discipline access
- Template snapshots prevent data corruption
- Two-review workflow ensures quality control
- Weighted scoring provides flexible decision-making

---

## References

- [Safety Master Guide](./1300_02400_HSE_MASTER_GUIDE.md)
- [Pattern B Supabase Integration](../database-systems/0500_SUPABASE_DUAL_SYSTEM_ANALYSIS.md)
- [Chatbot Implementation](./1300_00435_LANGCHAIN_CHATBOT_COMPLETE_IMPLEMENTATION.md)
- [Travel Arrangements Reference](./1300_00105_TRAVEL_ARRANGEMENTS_IMPLEMENTATION.md)

---

**END OF DOCUMENT**
