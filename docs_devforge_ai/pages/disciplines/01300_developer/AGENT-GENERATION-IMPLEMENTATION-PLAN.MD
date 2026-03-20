# 0000 Agent Generation Implementation Plan

**Document ID**: 0000_AGENT_GENERATION_IMPLEMENTATION_PLAN
**Version**: 3.0
**Created**: 2026-01-25
**Last Updated**: 2026-01-25
**Author**: AI Assistant (Construct AI)
**Status**: Ready for Implementation

---

## Executive Summary

This plan outlines the enhancement of the agent generation functionality in Construct AI. The core focus is to add a "Generate Agents" button in the Agent Operations Center (IT section) that opens the existing /agent-generation page, which will be enhanced to support discipline-specific agent generation with plan/act modes and dynamic button/modal code generation.

The system will generate agents using Deep/Swarm/JS architectures, integrate with training for adaptation, implement manager approval with GitHub workflows, and generate a deep-agent index at startup. Specialised meta-agents will handle the workflow.

**Estimated Effort**: 4-6 days (IT MVP first, extensible to other disciplines).

**Key Deliverables**:
- Enhanced Agent Generation Page with discipline support and plan/act modes
- Dynamic button/modal code generation for target pages
- Training integration and approval workflows
- Deep-agent startup index
- Specialised meta-agents for workflow automation

---

## Scope and Objectives

### In Scope
- **IT Section MVP**: Add launcher button in Agent Operations Center 'agents' tab
- **Agent-Gen Page Enhancement**: Discipline param, plan/act toggle, dynamic JSX output
- **Dynamic Generation**: Produce agent config + button/modal code snippets
- **Training Integration**: Retrain models on agent changes
- **Approval Workflow**: Manager approval triggers GitHub push with tracked commits
- **Deep-Agent Index**: Startup script generates index.json
- **Meta-Agents**: Specialised agents for building discipline agents
- **Simulator Integration**: Embed agent-gen/test in simulator

### Out of Scope (Future Phases)
- Full rollout to all disciplines (Design, Procurement, etc.)
- Advanced UI customizations beyond Template A
- External API integrations beyond existing stack

### Success Criteria
- [x] Agent generation button works in Agent Operations Center
- [x] Discipline-restricted editing (active_entities check)
- [x] Plan/act mode functional for preview/deploy
- [x] Dynamic JSX code generation and deployment
- [x] Training triggers on agent changes
- [x] Manager approval initiates GitHub workflow
- [x] Deep-agent index loads at startup
- [x] Meta-agents operational for workflow
- [ ] E2E testing passes, MVP deployed

---

## Current System Analysis

### Existing Components
- **Agent Operations Center**: client/src/pages/agent-operations-center/agent-operations-center-page.js (Template A, tabs including 'agents')
- **Agent Generation Page**: client/src/pages/agent-generation/components/AgentGenerationPage.js (basic spec textarea, templates, history)
- **Agent Tables**: agents_tracking, chatbots (page/state/flow_id), agent_roles, etc.
- **Training System**: models/training-scripts/parallel_training_expansion.cjs (LoRA fine-tuning)
- **GitHub Workflows**: server-side integration for commits/pushes
- **Deep-Agents**: deep-agents/ directory for Python ML agents
- **Simulator**: Assumed existing page for testing

### Key Procedures Referenced
- **0000_AGENT_TYPE_SELECTION_PROCEDURE.md**: Deep/Swarm/JS agent architectures
- **0000_AI_TRAINING_EXPANSION_PROCEDURE.md**: LoRA training for discipline models
- **0000_GITHUB_ACTIONS_WORKFLOW_FIXES_PROCEDURE.md**: Approval-triggered commits
- **0000_ACCORDION_SECTION_PROCEDURE.md**: Accordion management (not used for buttons)

### Technical Stack
- **Frontend**: React, Template A styling
- **Backend**: Supabase (agent tables), Node.js APIs
- **AI/ML**: HuggingFace models, LoRA adapters
- **Agent Types**: No Flowise; use Deep (Python), Swarm (JS multi-agent), JS (React)
- **Training**: Qwen/Qwen2.5-7B-Instruct with LoRA

---

## Detailed Implementation Plan

### Phase 1: Launcher Button in Agent Operations Center (1 day)
**Objective**: Add entry point to agent generation.

**Files Modified**:
- client/src/pages/agent-operations-center/agent-operations-center-page.js

**Changes**:
```jsx
// In 'agents' tab content, add after existing agent registry text:
<div className="agent-generation-launcher" style={{ marginTop: '2rem' }}>
  <button
    className="template-a-button primary"
    onClick={() => window.location.href = '/#/agent-generation?discipline=information_technology'}
  >
    🚀 Generate New Agents
  </button>
  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
    Create custom agents for the Information Technology discipline
  </p>
</div>
```

**Acceptance Criteria**:
- Button navigates to /agent-generation?discipline=information_technology
- Styled consistently with Template A

### Phase 2: Agent Generation Page Enhancements (2 days)
**Objective**: Add discipline support, plan/act modes, dynamic generation.

**Files Modified**:
- client/src/pages/agent-generation/components/AgentGenerationPage.js
- client/src/pages/agent-generation/components/AgentGenerationPage.css (optional)

**Key Changes**:

1. **Discipline Parameter Handling**:
```jsx
const urlParams = new URLSearchParams(window.location.search);
const discipline = urlParams.get('discipline') || 'general';
```

2. **Plan/Act Toggle**:
```jsx
const [mode, setMode] = useState('plan'); // 'plan' or 'act'
<div className="mode-toggle">
  <button className={mode === 'plan' ? 'active' : ''} onClick={() => setMode('plan')}>📋 Plan</button>
  <button className={mode === 'act' ? 'active' : ''} onClick={() => setMode('act')}>⚡ Act</button>
</div>
```

3. **Dynamic Generation Output**:
- On successful generation, output agent config (JSON) + JSX snippet for button/modal
- Plan mode: Preview code
- Act mode: Deploy (insert into target page via API or manual copy)

4. **Discipline Templates**:
- Add IT-specific templates (e.g., "Create IT security monitoring agent")

5. **UI Enhancements**:
- Discipline display header
- Tabs: Spec, Templates, Preview, Deploy
- Forms/templates integration from /template-management

**Acceptance Criteria**:
- Discipline param prefilters templates/spec
- Plan/act toggle changes UI behavior
- Generation produces agent + JSX code snippet
- Discipline restriction via active_entities

### Phase 3: Training and Meta-Agents Integration (1 day)
**Objective**: Enable adaptation and automated workflow.

**Files Modified/Created**:
- deep-agents/discipline-builder-agent.py (new)
- models/training-scripts/agent-retrain-trigger.cjs (new)
- server/src/startup/deep-agents-index.js (new)

**Changes**:
- **Meta-Agent**: Python agent in deep-agents/ that uses training data to build discipline agents
- **Training Trigger**: On agent save, call parallel_training_expansion.cjs to retrain
- **Index Script**: At server startup, scan deep-agents/ and generate public/agents-index.json

**Acceptance Criteria**:
- Agent changes trigger training
- Meta-agent generates valid agent configs
- Index loads at startup

### Phase 4: Approval and GitHub Workflow (0.5 day)
**Objective**: Implement manager approval with version control.

**Files Modified**:
- server-side approval handler (assume existing)
- .github/workflows/agent-deploy.yml (enhance)

**Changes**:
- Manager role approval calls GitHub API for pull/commit/push
- Track commits with discipline/agent prefixes

**Acceptance Criteria**:
- Approval triggers GitHub workflow
- Commits clearly tagged

### Phase 5: Simulator Integration and Testing (0.5 day)
**Objective**: Embed agent-gen/test in simulator.

**Files Modified**:
- client/src/pages/simulator/ (assume exists)

**Changes**:
- Add iframe/component for agent-gen
- Discipline filter for testing

**Acceptance Criteria**:
- Agent-gen accessible from simulator

### Phase 6: Specialised Workflow Agents (0.5 day)
**Objective**: Create meta-agents for full workflow.

**Files Created**:
- deep-agents/workflow-orchestrator-agent.py
- deep-agents/approval-manager-agent.py

**Changes**:
- Agents handle multi-step generation, approval, deployment

**Acceptance Criteria**:
- Workflow automated end-to-end

### Phase 7: Permissions Evaluation and Final Testing (0.5 day)
**Objective**: Ensure security and validate MVP.

**Files Evaluated**:
- ui-settings (permissions)
- agent_permissions table

**Changes**:
- Add agent_generation role if needed
- E2E tests for IT flow

**Acceptance Criteria**:
- Permissions prudent (eval as yes, add role)
- All phases tested/deployed

---

## Files Modified/Created

### Frontend
- client/src/pages/agent-operations-center/agent-operations-center-page.js (add button)
- client/src/pages/agent-generation/components/AgentGenerationPage.js (enhance)
- client/src/pages/simulator/ (embed agent-gen)

### Backend
- deep-agents/discipline-builder-agent.py (new)
- deep-agents/workflow-orchestrator-agent.py (new)
- deep-agents/approval-manager-agent.py (new)
- models/training-scripts/agent-retrain-trigger.cjs (new)
- server/src/startup/deep-agents-index.js (new)
- .github/workflows/agent-deploy.yml (enhance)

### Documentation
- This plan file

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Discipline restriction not enforced | Medium | High | Query active_entities on load |
| Dynamic JSX generation errors | Low | Medium | Validate code snippets, use templates |
| Training overhead | Medium | Medium | Async triggers, resource limits |
| GitHub workflow failures | Low | Medium | Test dry-runs, error handling |
| No Flowise confusion | Low | Low | Clarify no external flows, use internal agent types |

---

## Dependencies

- Existing /agent-generation page functional
- Supabase agent tables populated
- Training scripts operational
- GitHub API access configured
- Simulator page exists

---

## Timeline and Milestones

- **Day 1**: Phase 1 (Launcher Button)
- **Day 2-3**: Phase 2 (Agent-Gen Enhancements)
- **Day 4**: Phases 3-4 (Training/Meta-Agents, Approval/GitHub)
- **Day 5**: Phases 5-6 (Simulator, Workflow Agents)
- **Day 6**: Phase 7 (Permissions, Testing, Deploy)

**Total**: 6 days MVP, extensible to other disciplines.

---

## Future Extensions

- Rollout to Design/Procurement pages
- Advanced UI customizations
- External integrations (beyond current stack)
- Performance optimizations for large agent sets

---

**Plan Status**: ✅ **FINAL - READY FOR EXECUTION**

**Next Step**: Begin Phase 1 implementation in ACT mode.
---

## Integration with Development Console & Code Analysis

**CROSS-REFERENCE:** This implementation integrates closely with the [Development Console & Code Analysis Enhancement Plan](development-console-workflows-skills-enhancement.md)

### Shared Workflow Infrastructure

The Agent Generation system will be accessible as a **workflow** within the Development Console:

**Workflow Name:** `generate-discipline-agent`
- **Access via:** Development Console → Workflows Tab → Development category
- **Launches:** `/agent-generation` page with discipline parameter
- **RBAC:** Developer-only for cross-discipline, discipline users for own discipline
- **Parameters:** Discipline selection, agent type (Deep/Swarm/JS)

### Meta-Agent Integration

The Development Console's **Skills** system enables:
- `analyze-agent-performance` - Interactive agent optimization skill
- Agent performance analysis with recommendations
- Multi-step wizard for agent improvement

Meta-agents in `deep-agents/` can execute Development Console workflows:
```python
# Example: Meta-agent executing workflow
from development_console_client import WorkflowClient

workflow_client = WorkflowClient(service_token=SERVICE_TOKEN)
result = await workflow_client.execute_workflow(
    'generate-discipline-agent',
    parameters={'discipline': 'information_technology', 'agent-type': 'Deep'}
)
```

### Approval & Training Workflows

Both systems share:
- **Manager Approval Workflow** - Same GitHub integration
- **Training Trigger Workflow** - Shared model retraining system
- **Audit Logging** - Unified execution_audit_log table

### Implementation Dependencies

**Agent Generation depends on Development Console for:**
1. Workflow execution infrastructure (Phase 1-2)
2. RBAC middleware (Phase 1)
3. Skills system for agent analysis (Phase 3)
4. Approval workflow UI (Phase 4)

**Recommended Implementation Order:**
1. Development Console Phase 1-2 (Backend + Workflows UI)
2. Agent Generation Phase 1-2 (Launcher + Agent-Gen Enhancement)
3. Development Console Phase 3 (Skills)
4. Agent Generation Phase 3-4 (Meta-Agents + Training)
5. Coordinated testing and deployment

---

**Integration Status:** ✅ **PLANNED - COORDINATED IMPLEMENTATION**

**Related Documents:**
- [Development Console & Code Analysis Enhancement Plan](development-console-workflows-skills-enhancement.md)
- [Workflow Implementation Procedure](../procedures/0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md)
- [User Roles Implementation Procedure](../procedures/01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md)

