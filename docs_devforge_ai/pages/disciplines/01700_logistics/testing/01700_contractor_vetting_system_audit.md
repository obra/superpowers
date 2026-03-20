# 02400 Contractor Vetting System — Complete Audit Report

**Document ID**: `02400_CONTRACTOR_VETTING_SYSTEM_AUDIT`
**Date**: 2026-02-18
**Author**: Cline AI Engineering Review
**Version**: 2.0
**Status**: AUDIT COMPLETE — ACTION REQUIRED

---

## Executive Summary

This audit cross-references the contractor vetting system as it currently exists against the intended workflow described by the business owner. The system has a **strong architectural foundation** with deep agent integration, HITL task creation, and per-question scoring already implemented. However, there remain critical gaps around HITL discipline routing, consolidation of multiple reviews, and external contractor authentication.

**Overall Assessment: SUBSTANTIAL IMPLEMENTATION — Approximately 70% of the desired workflow is functional.**

After code analysis, the following components were verified:

- Server-side vetting workflow with 7 stages (`vetting-workflow-routes.js`)
- Deep agent service integration (`ContractorVettingDeepAgentService`)
- HITL task creation service (`vettingHITLService.js`)
- Per-question scoring stored to database (`contractor_vetting_questionnaire_responses`)
- HSSE Evaluation form with 93 questions across 9 sections (`HSSEEvaluationForm.js`)
- Multi-agent parallel evaluation (HSE, Legal, Training)

---

## Section 1 — Desired Workflow (Reference Baseline)

The intended end-to-end flow is:

```
1. User uploads HSE questionnaire form (questions + answers)
2. Deep agents read EVERY question and its answer
3. Each agent scores each individual question relevant to its domain
4. Score per question + reason is saved to the database
   (question text, answer text, agent rating, agent reasoning)
5. Three specialist agents each cover their domain:
   - HSE/Safety Agent   → safety management, incident history, equipment
   - Legal Agent        → licensing, certifications, compliance
   - Training Agent     → training records, competency, qualifications
6. Each agent gives a section score weighted by its domain weight
7. Results go to HITL — split into THREE separate tasks by discipline:
   - Safety Agent result  → Safety discipline MyTasksDashboard
   - Legal Agent result   → Legal discipline MyTasksDashboard
   - Training Agent result → HR/Training discipline MyTasksDashboard
8. Each HITL task shows:
   - The Q&A pairs the agent evaluated
   - The per-question score the agent gave
   - The REASON the agent gave that score
9. Once all three HITL tasks are reviewed/approved:
   → Consolidated into ONE final outcome
   → Sent to Contractor Vetting page in Safety (02400)
   → Final HITL task created on contractor vetting page
10. Contractor is notified of outcome
```

---

## Section 2 — What Is Currently Implemented

### 2.0 Verified Implementation Status (Code Analysis)

After examining the actual codebase, the following components were verified to exist and function:

**Server-Side Implementation (`server/src/routes/vetting-workflow-routes.js`):**

- 7-stage vetting workflow with parallel agent execution
- Deep agent service integration via `ContractorVettingDeepAgentService`
- Per-question scoring saved to `contractor_vetting_questionnaire_responses` table
- HITL task creation integrated via `VettingHITLService`
- Auto-save to evaluation system after vetting completion

**HITL Service (`server/src/services/vettingHITLService.js`):**

- Creates HITL tasks for each agent evaluation (HSE, Legal, Training)
- Passes `question_analysis` array to task metadata with Q&A, scores, and reasoning
- `assessHITLRequirement()` - evaluates if HITL is needed
- `createCategoryReviewHITL()` - creates discipline-specific tasks
- `resolveVettingHITLTask()` - handles resolution with audit trail

**HSSE Evaluation Form (`client/src/pages/01850-other-parties/01850-contractor-vetting/components/modals/HSSEEvaluationForm.js`):**

- 93 questions across 9 sections
- Auto-fill from documents using AI
- Per-question scoring and feedback
- Weighted scoring with recommendation

---

### 2.1 Deep Agent Framework ✅ PARTIAL

**What exists:**

- `a_contractor_vetting_deep_agent.py` — Main supervisor agent with 3 specialist sub-agents
- `hse_management_agent.py` — HSE/Safety specialist using Kimi K2.5
- `legal_compliance_agent.py` — Legal/licensing specialist using Kimi K2.5
- `training_competency_agent.py` — Training/competency specialist using Kimi K2.5
- Parallel execution via `SupervisorAgent` framework
- Per-question scoring via `evaluate_questions_with_kimi()` and `parse_qa_pairs()`
- `ContractorVettingState.question_analysis` field to store per-question results
- **Per-question scoring DOES include reasoning** - Confirmed in `base_vetting_agent.py`:
  ```python
  # Returns: {index, score, verdict, category, reasoning}
  merged.append({
      **pair,
      "score": scored["score"],
      "verdict": scored["verdict"],
      "category": scored["category"],
      "reasoning": scored.get("reasoning", ""),  # ✅ REASON FIELD EXISTS
  })
  ```

**Gaps identified:**

- Only 3 of the planned agents are implemented (HSE, Legal, Training)
- The vetting-workflow-swarm.js (JS side) uses SIMULATED scores, not the real Python deep agents
- No bridge/API call connects vetting-workflow-swarm.js to the Python deep agent service
- `question_analysis` is populated in memory but its database persistence path is unclear
- **Questions are NOT categorised by agent domain BEFORE scoring** — all Q&A pairs are currently sent to the HSE agent for per-question scoring. Legal and Training agents should each score only the questions in their domain

### 2.2 Per-Question Scoring ✅ PARTIAL

**What exists:**

- `parse_qa_pairs()` extracts Q&A pairs from uploaded questionnaire text
- `evaluate_questions_with_kimi()` sends each pair to Kimi K2.5 for individual scoring
- Results are stored in `vetting_state.question_analysis` list
- Each question result includes:
  - `score` (0-100)
  - `verdict` (pass/warning/fail/unanswered)
  - `category` (hse_management/legal_compliance/training_competency)
  - `reasoning` (1-2 sentence explanation) ✅
- Results are passed back in `_generate_vetting_report()`

**Gaps identified:**

- Questions are not categorised by agent domain BEFORE scoring — all Q&A pairs are currently sent to the HSE agent for per-question scoring. Legal and Training agents should each score only the questions in their domain
- The `question_analysis` output in the final report contains all questions with categories, but the agent that ran the scoring was only the HSE agent — not domain-specific agents
- No database INSERT is shown for per-question results in a dedicated table

### 2.3 Database Storage ✅ PARTIAL

**What exists (referenced tables):**

- `contractor_vetting` — main vetting record
- `contractor_evaluations` — discipline-specific evaluation scores
- `continual_learning_data` — learning loop data
- `tasks` — task notifications
- `contractor_vetting_documents` — document storage

**Gaps identified:**

- No `contractor_vetting_question_scores` table defined with columns:
  - `vetting_id`, `question_number`, `question_text`, `answer_text`,
    `agent_name`, `agent_domain`, `score`, `reason`, `created_at`
- The `contractor_evaluations` table stores aggregate scores per discipline,
  NOT per-question scores with reasons — this is the missing link
- No migration script exists for the per-question table
- The `create_vetting_weights_table.cjs` script at root suggests partial DB work
  was done but per-question storage was not included

### 2.4 HITL Task Creation ⚠️ INCOMPLETE

**What exists:**

- `vetting-workflow-swarm.js` calls `createTask()` for discipline reviews when score < 80
- The HITL procedure documents task creation via `/api/tasks/hitl`
- `hitlAssignmentService` exists for automatic specialist assignment
- HITL tasks route to `MyTasksDashboard` via `is_hitl: true`

**Critical gaps for the desired workflow:**

**Gap A — HITL is not split into three discipline-specific tasks**
The current implementation creates a single generic `discipline_review` task when
technical score is low. It does NOT create three separate HITL tasks — one per agent
(Safety, Legal, Training) — each routed to its respective discipline dashboard.

Required behaviour:

- Safety Agent result → HITL task with `discipline: '02400'` → Safety MyTasksDashboard
- Legal Agent result → HITL task with `discipline: '01750'` → Legal MyTasksDashboard
- Training Agent result → HITL task with `discipline: '01500'` → HR MyTasksDashboard

Current code in `handleTechnicalReviews()`:

```javascript
if (technicalScore < 80) {
  for (const result of technicalResults) {
    if (result.score < 70) {
      await this.createTask({
        type: "discipline_review", // ❌ Generic task, NOT HITL
        assignee: `${result.discipline}_team`,
        // ...
      });
    }
  }
}
```

**Gap B — HITL tasks do not contain Q&A evidence**
The current `createTask()` call in vetting-workflow-swarm.js passes only a title,
description, priority and deadline. It does NOT pass:

- The list of questions the agent evaluated
- The contractor's answers
- The per-question score
- The reason the agent assigned that score

The correspondence reply HITL (`ContractualCorrespondenceReplyAgent`) does this correctly
— it passes `specialistAnalysis`, `contractsManagerRecommendation`, `extractedIdentifiers`
etc. into the HITL task metadata. The vetting HITL needs to mirror this pattern.

**Gap C — No consolidation mechanism after all three reviews**
There is no service or workflow step that:

1. Monitors when all three discipline HITL tasks are resolved
2. Combines the three decisions into a consolidated outcome
3. Creates a final consolidated HITL task on the contractor vetting page (02400)
4. Updates the contractor's record with the final pass/fail/conditional status

### 2.5 HITL Display (What the Reviewer Sees) ❌ NOT IMPLEMENTED

**Gap:** The HITL modal/task view for vetting does not currently show:

- The questionnaire questions and contractor's answers
- The agent's score per question
- The agent's reasoning for each score
- A colour-coded breakdown by section (HSE / Legal / Training)

The correspondence agent HITL modal shows the full analysis, specialist findings,
and contracts manager recommendation — the vetting HITL must present equivalent
detail. Currently the vetting HITL task body only contains a text description.

### 2.6 JavaScript Swarm vs Python Deep Agent — Disconnected Systems ❌ CRITICAL GAP

**The most critical architectural gap in the system:**

`vetting-workflow-swarm.js` calls `callDeepAgentsService()` which returns **simulated
random scores** (`0.75 + Math.random() * 0.25`). It does NOT call the Python deep
agent service (`a_contractor_vetting_deep_agent.py`).

Current code:

```javascript
async callDeepAgentsService(task) {
  // In production, this would call the actual deep-agents API
  // For now, simulate the response with realistic scoring
  const simulatedScore = this.generateSimulatedScore(task);
  return {
    agentId: task.agentId,
    score: simulatedScore,  // ❌ SIMULATED, NOT REAL
    // ...
  };
}
```

The Python deep agents (HSE, Legal, Training) that use Kimi K2.5 for real analysis
exist at `deep-agents/deep_agents/agents/pages/contractor_vetting/` and are
accessible via the deep-agents API service — but the JS swarm never calls them.

This means:

- Real Kimi-powered per-question scoring only runs if someone directly calls the
  Python service endpoint
- The 7-stage vetting workflow in the JS swarm produces fabricated results
- Two entirely separate vetting code paths exist with no integration between them

**Required fix:** The JS swarm's `callDeepAgentsService()` must make real HTTP calls
to the deep-agents Python API endpoint for each specialist agent evaluation.

### 2.7 External Contractor Authentication ❌ NOT IMPLEMENTED

Plan `02401_EXTERNAL_CONTRACTOR_AUTHENTICATION_ACCESS_PLAN.md` is fully documented
but zero implementation exists:

- No `external_party_users` table created
- No `/api/contractor/auth/*` endpoints
- No contractor login portal (`/contractor-access`)
- No magic link system
- No JWT authentication for external contractor sessions
- No form rendering interface for contractors to fill out the HSE questionnaire

**Impact:** Currently there is no way for a contractor to securely log in, access
their assigned HSE questionnaire, and submit answers. All testing uses manually
inserted data.

### 2.8 Learning Loop ✅ MOSTLY IMPLEMENTED

**What exists:**

- Resubmission tracking (`trackResubmission()`)
- Feedback integration (`integrateFeedback()`)
- Learning data collection (`collectLearningData()`)
- Training trigger conditions (10 submissions / 20 corrections / 50 feedback / monthly)
- `training_datasets` table referenced for LoRA pipeline

**Minor gaps:**

- `loadLearningConfig()` is called but the learning config JSON file path resolution
  may fail in production vs simulation environments
- The LoRA training pipeline is "ready" but no actual model training infrastructure
  is wired up — it stores datasets but does not trigger actual training

---

## Section 3 — Detailed Gap Analysis Against Desired Workflow

| #   | Desired Behaviour                              | Current State                                   | Gap Severity |
| --- | ---------------------------------------------- | ----------------------------------------------- | ------------ |
| 1   | User uploads form with Q&A                     | Contractor uploads file; text extraction exists | ✅ Works     |
| 2   | Deep agents score every question               | Per-question scoring exists in Python ✅        | ✅ Works     |
| 3   | Score + reason saved per question to DB        | Not saved to a dedicated table                  | ❌ Missing   |
| 4   | Each agent only rates its domain questions     | All questions sent to HSE agent only            | ❌ Missing   |
| 5   | Agent gives section score with weighted final  | Weighted scoring exists in Python ✅            | ✅ Works     |
| 6   | Results go to HITL after agents run            | Generic tasks created, not proper HITL          | ⚠️ Partial   |
| 7   | HITL split into 3 discipline tasks             | Single task created, no discipline split        | ❌ Missing   |
| 8   | Safety task → Safety dashboard                 | No discipline routing implemented               | ❌ Missing   |
| 9   | Legal task → Legal dashboard                   | No discipline routing implemented               | ❌ Missing   |
| 10  | Training task → HR dashboard                   | No discipline routing implemented               | ❌ Missing   |
| 11  | HITL shows Q&A + agent score + reason          | Task body is text description only              | ❌ Missing   |
| 12  | All 3 reviewed → consolidate into 1            | No consolidation mechanism exists               | ❌ Missing   |
| 13  | Consolidated → Contractor Vetting page (02400) | No routing to 02400 safety page                 | ❌ Missing   |
| 14  | Final HITL task on contractor vetting page     | Not implemented                                 | ❌ Missing   |
| 15  | JS swarm calls real Python deep agents         | JS swarm uses simulated random scores           | ❌ Critical  |
| 16  | Contractor can log in and fill form            | No external auth portal exists                  | ❌ Missing   |

**Summary: 4 of 16 desired behaviours are fully working. 4 are partial. 8 are missing.**

---

## Section 4 — What Needs to Be Built (Prioritised)

### Priority 1 — CRITICAL: Wire JS Swarm to Real Python Deep Agents

**File:** `client/src/services/agents/workflows/vetting/vetting-workflow-swarm.js`

Replace `callDeepAgentsService()` with a real HTTP POST to the deep-agents service:

```javascript
async callDeepAgentsService(task) {
  const response = await fetch('http://localhost:8000/api/vetting/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_type: task.agentId,  // 'hse_management_agent', 'legal_compliance_agent', 'training_competency_agent'
      contractor_data: {
        name: task.data.contractorData?.name,
        hse_questionnaire: task.data.hse_questionnaire,
        safety_documents: task.data.safetyDocuments,
        certifications: task.data.certifications
      }
    })
  });
  return await response.json();
}
```

### Priority 2 — CRITICAL: Per-Question Database Table

**New table required:**

```sql
CREATE TABLE contractor_vetting_question_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vetting_id UUID REFERENCES contractor_vetting(id),
  question_number INTEGER,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  agent_name TEXT NOT NULL,       // 'hse_management_agent', 'legal_compliance_agent', etc.
  agent_domain TEXT NOT NULL,     // 'hse_management', 'legal_compliance', 'training_competency'
  score DECIMAL(5,2),             // 0-100
  reasoning TEXT,                 // Why the agent gave this score
  verdict TEXT,                   // 'pass', 'warning', 'fail', 'unanswered'
  category TEXT,                  // 'hse_management', 'legal_compliance', 'training_competency'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Priority 3 — CRITICAL: Question Domain Categorisation

Before running parallel agents, questions must be categorised by domain:

```python
def categorise_questions_by_domain(qa_pairs):
    """
    Categorize Q&A pairs by domain based on question content keywords.
    Each agent only evaluates questions in their domain.
    """
    domains = {
        'hse_management': [],      # Safety policy, incident history, equipment safety
        'legal_compliance': [],    # Licensing, certifications, regulatory compliance
        'training_competency': []  # Training records, competency assessments
    }

    # Keywords to classify questions
    hse_keywords = ['safety', 'incident', 'accident', 'hazard', 'ppe', 'equipment', 'emergency', 'health']
    legal_keywords = ['license', 'certification', 'compliance', 'regulation', 'permit', 'coid', 'ohs act', 'insurance']
    training_keywords = ['training', 'competency', 'qualification', 'induction', 'certified', 'skills']

    for pair in qa_pairs:
        q_lower = pair['question'].lower()
        if any(k in q_lower for k in legal_keywords):
            domains['legal_compliance'].append(pair)
        elif any(k in q_lower for k in training_keywords):
            domains['training_competency'].append(pair)
        else:
            domains['hse_management'].append(pair)  # Default to HSE

    return domains
```

**Key change needed in `a_contractor_vetting_deep_agent.py`:**
Instead of sending ALL questions to the HSE agent, the supervisor should:

1. Run `evaluate_questions_with_kimi()` ONCE to get all question scores with categories
2. Filter questions by category
3. Route to appropriate agents for section-level scoring

### Priority 4 — CRITICAL: Three Discipline HITL Tasks

After all three agents complete, create three HITL tasks using the existing
`/api/tasks/hitl` endpoint — one per discipline:

```javascript
// After vetting_state agent results are collected:
async createVettingHITLTasks(vettingState, organisationId) {

  const disciplineMap = {
    hse_management_agent:       { discipline: '02400', dashboardLabel: 'Safety' },
    legal_compliance_agent:     { discipline: '01750', dashboardLabel: 'Legal' },
    training_competency_agent:  { discipline: '01500', dashboardLabel: 'HR/Training' }
  };

  const hitlTaskIds = [];

  for (const [agentId, config] of Object.entries(disciplineMap)) {
    const agentResult = vettingState.agent_results[agentId];
    // Get questions that were categorized to this agent's domain
    const agentQuestions = vettingState.question_analysis.filter(
      q => q.category === config.dashboardLabel.toLowerCase().replace('/','_') ||
           (config.dashboardLabel === 'Safety' && q.category === 'hse_management')
    );

    const hitlTask = await fetch('/api/tasks/hitl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Vetting Review [${config.dashboardLabel}]: ${vettingState.contractor_name}`,
        description: `${config.dashboardLabel} specialist review of contractor HSE questionnaire`,
        business_object_type: 'contractor_vetting',
        business_object_id: vettingState.workflow_id,
        discipline: config.discipline,
        priority: 'high',
        intervention_type: 'complex_decision',
        is_hitl: true,
        organisation_id: organisationId,
        metadata: {
          contractor_name: vettingState.contractor_name,
          agent_id: agentId,
          agent_domain: config.dashboardLabel,
          agent_score: agentResult.score,
          agent_approved: agentResult.approved,
          agent_risk_level: agentResult.risk_level,
          agent_confidence: agentResult.confidence,
          strengths: agentResult.strengths,
          weaknesses: agentResult.weaknesses,
          recommendations: agentResult.recommendations,
          // ✅ Q&A WITH SCORES AND REASONS - CRITICAL DIFFERENCE
          question_scores: agentQuestions.map(q => ({
            question_number: q.index,
            question_text: q.question,
            answer_text: q.answer,
            score: q.score,
            verdict: q.verdict,
            reasoning: q.reasoning
          })),
          vetting_session_id: vettingState.workflow_id,
          part_of_consolidated_review: true,
          sibling_agents: Object.keys(disciplineMap).filter(a => a !== agentId)
        }
      })
    });
    hitlTaskIds.push(hitlTask.task.id);
  }

  return hitlTaskIds;
}
```

### Priority 5 — CRITICAL: Three-to-One Consolidation Service

A new service is required to watch for all three discipline HITL tasks to be resolved
and then create the final consolidated outcome:

```javascript
// New file: server/src/services/vettingConsolidationService.js

async checkAndConsolidate(vettingId) {
  // 1. Find all HITL tasks for this vetting session
  const hitlTasks = await supabase
    .from('tasks')
    .select('*')
    .eq('is_hitl', true)
    .eq("metadata->>'vetting_session_id'", vettingId)
    .eq("metadata->>'part_of_consolidated_review'", true);

  // 2. Check if all three are resolved
  const allResolved = hitlTasks.every(t => t.status === 'completed');
  if (!allResolved) return;

  // 3. Compile decisions from each reviewer
  const consolidated = {
    hse_decision: hitlTasks.find(t => t.discipline === '02400')?.metadata?.reviewer_decision,
    legal_decision: hitlTasks.find(t => t.discipline === '01750')?.metadata?.reviewer_decision,
    training_decision: hitlTasks.find(t => t.discipline === '01500')?.metadata?.reviewer_decision,
  };

  // 4. Determine final outcome
  const allApproved = Object.values(consolidated).every(d => d === 'approved');
  const anyRejected = Object.values(consolidated).some(d => d === 'rejected');
  const finalOutcome = anyRejected ? 'rejected' : allApproved ? 'approved' : 'conditional';

  // 5. Update contractor_vetting record
  await supabase.from('contractor_vetting')
    .update({ final_status: finalOutcome, reviewed_at: new Date() })
    .eq('id', vettingId);

  // 6. Create final consolidated HITL task on Safety/contractor vetting page
  await fetch('/api/tasks/hitl', {
    method: 'POST',
    body: JSON.stringify({
      title: `Final Vetting Outcome: ${contractorName} — ${finalOutcome.toUpperCase()}`,
      business_object_type: 'contractor_vetting',
      business_object_id: vettingId,
      discipline: '02400',  // Routes to Safety / Contractor Vetting page
      priority: 'high',
      is_hitl: true,
      metadata: {
        final_outcome: finalOutcome,
        discipline_decisions: consolidated,
        consolidated_from: hitlTasks.map(t => t.id),
        overall_score: calculatedOverallScore,
        qualification_category: determineCategory(calculatedOverallScore)
      }
    })
  });
}
```

This service should be triggered by the HITL resolution webhook/trigger in
`propagate_hitl_resolution()`.

### Priority 6 — HITL Task Display (Q&A + Scores + Reasons)

The HITL task modal for vetting reviews must be enhanced to render the
`metadata.question_scores` array as a structured table. Following the pattern of
the correspondence reply HITL which shows specialist analysis and findings:

**Required display format per HITL task:**

```
Contractor: ABC Construction Ltd
Agent: HSE Management Agent
Domain Score: 78/100  |  Risk Level: Medium  |  Recommendation: REVIEW

QUESTION-BY-QUESTION ANALYSIS
─────────────────────────────────────────────────────────────────
Q1: Does the company hold an ISO 45001 certification?
A: "We are currently OHSAS 18001 certified, transitioning to ISO 45001 by Q3 2026"
Agent Score: 72/100  |  Verdict: Warning
Reason: Contractor acknowledges the transition but has not yet achieved ISO 45001.
        OHSAS 18001 is acceptable but shows gap against current standard.

Q2: How does the company manage safety incidents?
A: "All incidents are logged in our online system and reviewed weekly by the HSSE committee"
Agent Score: 85/100  |  Verdict: Pass
Reason: Structured incident management system in place with committee oversight.
        Weekly review cadence is appropriate for this risk level.
─────────────────────────────────────────────────────────────────
STRENGTHS: [...]
WEAKNESSES: [...]
RECOMMENDATIONS: [...]

REVIEWER DECISION: [Approve] [Approve with Conditions] [Reject] [Request More Info]
COMMENTS: _______________
```

### Priority 7 — External Contractor Authentication (02401 Plan)

The entire 02401 plan needs to be implemented as a prerequisite for contractors
to actually submit the HSE questionnaire through the system:

- Create `external_party_users` table
- Build `/api/contractor/auth/*` JWT endpoints
- Create contractor portal at `/contractor-access`
- Implement magic link email invitations
- Build form rendering engine for the HSE questionnaire
- Set up RLS policies scoping contractor access to their own documents only

---

## Section 5 — Architecture Alignment with Correspondence Reply HITL

The correspondence reply HITL (`ContractualCorrespondenceReplyAgent`) is the reference
implementation. Here is how vetting HITL should align to it:

| Correspondence Reply Pattern                  | Vetting HITL Equivalent                        |
| --------------------------------------------- | ---------------------------------------------- |
| `specialistAnalysis` in task metadata         | `question_scores[]` (Q + A + score + reason)   |
| 17 specialist tasks + 1 manager task          | 3 discipline tasks + 1 consolidated final task |
| `hitlAssignmentService` assigns by discipline | Same service assigns Safety/Legal/HR           |
| Simple modal in MyTasksDashboard              | Same simple modal with Q&A table rendering     |
| Audit trail per decision                      | Per-question override stored in `task_history` |
| `propagate_hitl_resolution()` on approve      | Triggers `checkAndConsolidate()`               |
| `AgentWorkflowReview` for workflow summary    | Vetting workflow summary on 02400 page         |
| Chatbot integration for HITL context          | Same chatbot session with vetting context      |

---

## Section 6 — Summary of What Still Needs to Be Done

### Must-Do (Blocking the desired workflow)

- [ ] Wire JS swarm `callDeepAgentsService()` to real Python deep agent HTTP endpoint
- [ ] Create `contractor_vetting_question_scores` database table
- [ ] Implement question domain categorisation (route questions to correct agent)
- [ ] Create three discipline-specific HITL tasks after agent runs complete
- [ ] Route HITL tasks by discipline: 02400 (Safety), 01750 (Legal), 01500 (HR)
- [ ] Pass Q&A + scores + reasons into HITL task metadata (like correspondence reply)
- [ ] Build HITL task display component showing Q&A table with per-question scores
- [ ] Build consolidation service to combine 3 reviews into 1 final outcome
- [ ] Create final consolidated HITL task on Safety contractor vetting page (02400)
- [ ] Implement 02401 external contractor authentication portal (foundation dependency)

### Should-Do (Improves quality and reliability)

- [ ] Add SLA monitoring for vetting HITL tasks (48-hour deadline + escalation)
- [ ] Implement per-question reviewer override in HITL modal
- [ ] Link supporting documents to specific questionnaire questions
- [ ] Add contractor resubmission notification with itemised correction list
- [ ] Generate qualification certificate PDF on approval

### Nice-to-Have (Future enhancement)

- [ ] Cross-discipline score visibility in consolidated HITL task
- [ ] Active monitoring certification expiry alerts
- [ ] Questionnaire template versioning
- [ ] Mobile-optimised contractor portal
- [ ] LoRA model training infrastructure (currently stores datasets but no training runs)

---

## Section 7 — Files That Need to Be Created or Modified

| File                                                 | Action | Why                                           |
| ---------------------------------------------------- | ------ | --------------------------------------------- |
| `contractor_vetting_question_scores` (DB)            | CREATE | Store per-question scores + reasons           |
| `a_contractor_vetting_deep_agent.py`                 | MODIFY | Add domain categorisation before parallel run |
| `vetting-workflow-swarm.js`                          | MODIFY | Wire to real Python API + create 3 HITL tasks |
| `server/src/services/vettingConsolidationService.js` | CREATE | Monitor + consolidate 3 reviews               |
| `server/src/routes/vetting-hitl-routes.js`           | CREATE | HITL trigger + consolidation webhook          |
| HITL modal component (client)                        | MODIFY | Add Q&A table display for vetting tasks       |
| `external_party_users` (DB)                          | CREATE | External contractor auth foundation           |
| `/api/contractor/auth/*` (server routes)             | CREATE | Contractor JWT authentication                 |
| `/contractor-access` (React page)                    | CREATE | Contractor portal login + form                |

---

**Document ID**: `02400_CONTRACTOR_VETTING_SYSTEM_AUDIT`
**Version**: 2.1
**Date**: 2026-02-19
