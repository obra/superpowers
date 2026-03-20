# Independent Assessment: Overstory vs Construct AI Deep-Agents

**Assessed by:** Cline (independent review)  
**Date:** 2026-02-18  
**Repos reviewed:** `/tmp/overstory` (cloned), `/deep-agents/` (local)  
**Purpose:** Evaluate the prior AI-generated analysis and make concrete, grounded recommendations  
**Updated:** Corrections applied after user feedback — see Section 2.3

---

## 1. What I Actually Found in Both Codebases

### 1.1 Overstory — What It Really Is

After reading the source directly, Overstory is a **well-engineered, production-quality TypeScript system** built specifically for one use case: running multiple Claude Code CLI sessions in parallel across git worktrees, coordinated via SQLite messaging. Its quality is high — 1,793 tests, strict TypeScript, zero runtime dependencies, WAL-mode SQLite, proper schema migration, and a thoughtful ZFC (Zero Failure Crash) health monitoring principle.

**Key technical facts from the source:**

| Component | Reality |
|-----------|---------|
| Mail system | SQLite table with 12 typed message types, WAL mode, prepared statements, proper migration |
| Agent identity | YAML file per agent: name, capability, sessionsCompleted, expertiseDomains, recentTasks (capped at 20) |
| Health monitoring | Observable-state-first: tmux liveness > PID liveness > recorded state. Forward-only state transitions |
| Merge resolution | 4 tiers: clean-merge → auto-resolve (keep incoming) → AI-resolve (claude --print) → reimagine |
| Session lifecycle | Checkpoint/handoff JSON files for crash recovery and compaction survival |
| Conflict learning | Records patterns to `mulch` (a separate knowledge CLI), skips tiers that have failed ≥2× |
| Event store | Full SQLite event log: tool_start/end, session_start/end, mail_sent/received, spawn, error |
| Metrics | Token tracking per session: input, output, cache_read, cache_creation, estimated cost USD |

**The Claude Code dependency is absolute.** Tier 3 (AI-resolve) and Tier 4 (reimagine) both spawn `claude --print -p <prompt>` as a subprocess. The entire agent execution model is tmux sessions running Claude Code. This is not an abstraction — it is the core mechanism.

### 1.2 Our Deep-Agents System — What It Really Is

After reading the source directly, our system is a **Python framework that is partially implemented and primarily aspirational in its current state**.

**Key technical facts from the source:**

| Component | Reality |
|-----------|---------|
| `DeepAgent` base class | Solid abstract base: lifecycle (initialize/execute/cleanup), callback system, in-memory parent/child communication, retry logic |
| `SubAgent` | Extends DeepAgent with dependency management, resource requests, coordination commands |
| `WorkflowState` | Pydantic model — well-structured state for correspondence workflows specifically |
| `MultiInstanceFineTuningOrchestrator` | Generates markdown template files and **simulates** fine-tuning with `asyncio.sleep()`. Not connected to any real model training |
| `ParallelSpecialistCoordinator` | Real parallel execution logic using `asyncio.gather()` with semaphores and timeouts — this is the most production-ready component |
| Services (121 files) | Pattern files for LangExtract — regex patterns and prompt templates for document extraction |
| Agent pages | Only **7 discipline pages** implemented (not 46+): contracts_post_award, architectural, civil-engineering, logistics, procurement, quantity_surveying, contractor_vetting |
| Communication | **In-memory only** — `communicate_with_parent()` is a direct Python method call. No persistence, no cross-process messaging |
| State persistence | None beyond Pydantic model serialization. No SQLite, no file-based checkpoints |
| Health monitoring | None implemented |
| Production deployment | LangExtract FastAPI service is deployed on Render. The agent framework itself is **not deployed** |

**The critical finding:** The prior analysis claimed "130 active agents" and "46+ discipline agents." The actual count of implemented agent page directories is **7**. The 121 service files are LangExtract pattern files (regex + prompts), not agents. The `MultiInstanceFineTuningOrchestrator` simulates fine-tuning with sleep() calls — it does not train any models.

---

## 2. Assessment of the Prior AI-Generated Analysis

The prior analysis (OVERSTORY_REPO_ANALYSIS.md) is **well-written but significantly overstated** in several areas:

### 2.1 What the Prior Analysis Got Right

- ✅ Overstory is Claude Code-specific and cannot be directly integrated
- ✅ The CLI interface is not suitable for end users
- ✅ The messaging system design is genuinely valuable
- ✅ The STEELMAN warnings are real and important
- ✅ MIT license — no legal risk
- ✅ The agent identity/CV concept is worth adapting
- ✅ The checkpoint/recovery pattern is worth adapting

### 2.2 Where the Prior Analysis Was Wrong or Misleading

**Overstated our current capabilities:**
- Claims "130 active agents" — actual: 7 discipline page directories
- Claims "46+ discipline agents" — actual: 7 implemented, 121 are pattern files
- Claims "MultiInstanceFineTuningOrchestrator" does parallel fine-tuning — actual: it generates markdown files and sleeps
- Claims "80+ discipline pattern services" — actual: 121 LangExtract pattern files (not agents)

**Overstated integration complexity:**
- The prior analysis proposes 10 appendices of integration architecture before the basic messaging system even exists
- It proposes mining 6GB of Cline history before the core system is built

**Missed the real problem:**
- The prior analysis never identified that the `WorkflowState` is specifically designed for correspondence workflows, not general agent use
- It never identified that the communication layer is in-memory only (no cross-process capability)

### 2.3 Corrections After User Feedback

**Agent Simulation UI and Agent Operations Center DO exist** — verified at:
- `client/src/pages/02050-agent-simulation-ui/` — full React page with simulation controls
- `client/src/pages/agent-operations-center/` — full React page with ChatbotBase, tabs, agent testing state

The prior analysis was correct that these pages exist and are integration targets. My initial assessment was wrong to question this without checking.

**Git worktrees** — the team is actively using git worktrees for parallel human developer workflows. As of 2026-02-18, there are **3 active worktrees** running simultaneously:
- `/Users/proc-docs/construct_ai` → branch `Feb-18`
- `/Users/_General/proc-doc-1` → branch `Feb-18-1`
- `/Users/_General/proc-doc-2` → branch `Feb-18-2`

This is exactly the pattern Overstory was built to manage. The worktree management and merge resolution sections of the assessment have been updated accordingly — see Section 3.3 and the revised Section 6.2.

**Context: pre-production development phase** — the system is still being built. The question of "which agents are production-ready" is not the right framing. The focus is on making the priority agents robust during development.

**Priority agents identified by the team:**
- Correspondence (00435-contracts_post_award)
- Procurement (01900-procurement)  
- Safety (specialist agents within 00435 and 01900)
- CV/Contractor Vetting (contractor_vetting)

---

## 3. The Real Gap Analysis

Here is what actually needs to happen, based on what I found:

### 3.1 Current State (Honest)

```
What EXISTS and WORKS in production:
├── LangExtract FastAPI service (deployed on Render)
│   └── 121 pattern files for document extraction
│   └── Processes construction correspondence documents
│
└── 7 discipline agent page implementations (Python, not deployed)
    ├── Parallel specialist coordination (asyncio.gather) — solid
    ├── Pydantic state management — solid
    └── In-memory parent/child communication — works but not cross-process
```

```
What EXISTS but is ASPIRATIONAL (not production):
├── MultiInstanceFineTuningOrchestrator — simulates with sleep()
├── Core framework (DeepAgent, SubAgent) — solid base, not deployed
└── IT Specialist Swarm (20+ files) — unclear production status
```

### 3.2 What Overstory Solves That We Actually Need

Ranked by genuine applicability to our situation:

**HIGH VALUE — directly applicable:**

1. **Persistent inter-agent messaging (SQLite mail store)**  
   Our agents currently communicate via in-memory Python method calls. If we ever run agents in separate processes or across requests, this breaks. Overstory's SQLite mail store is clean, well-tested, and directly adaptable to Python.

2. **Session checkpoint/recovery**  
   Our `WorkflowState` is in-memory. If a long-running correspondence analysis crashes mid-way, all progress is lost. Overstory's checkpoint pattern (save progress to JSON/SQLite before compaction) is directly applicable.

3. **Agent identity persistence**  
   We have no concept of an agent "remembering" past work. Overstory's identity YAML (sessionsCompleted, expertiseDomains, recentTasks) is simple and directly adaptable.

4. **Typed message protocol**  
   Our current message types are ad-hoc strings (`'progress_update'`, `'status_change'`, `'error'`). Overstory's 12 typed message types with structured payloads is a better pattern.

5. **Observable-state health monitoring (ZFC principle)**  
   We have zero health monitoring. The ZFC principle (trust what you can observe, not what's recorded) is a sound engineering principle applicable to any agent system.

**MEDIUM VALUE — worth considering:**

6. **Token/cost tracking per agent session**  
   Overstory tracks input_tokens, output_tokens, cache tokens, and estimated cost per session. Given we're running LLM calls, this is operationally important.

7. **Event store (audit trail)**  
   Overstory logs every tool_start/end, mail_sent/received, spawn, error to SQLite. This would make debugging our correspondence workflows much easier.

8. **Task group batch tracking**  
   Useful when processing batches of correspondence documents across multiple disciplines.

**NOW HIGH VALUE — worktree management (revised after confirming active worktree usage):**

9. **4-tier merge resolution** — **REVISED: HIGH VALUE.** We actively run 3 simultaneous worktrees (`Feb-18`, `Feb-18-1`, `Feb-18-2`). Overstory's merge resolution tiers (clean-merge → auto-resolve → AI-resolve → reimagine) directly address the conflict problem we face when merging parallel worktree branches. See Section 3.3 and Section 10.
10. **Git worktree isolation** — **REVISED: HIGH VALUE.** We already use this pattern. Formalising it with Overstory's conventions (named worktrees, branch-per-session, structured merge flow) would reduce the current ad-hoc approach.
11. **Conflict history learning** — **REVISED: MEDIUM VALUE.** Recording which file patterns cause conflicts and which resolution strategies succeed is directly applicable to our multi-worktree workflow.

**LOW VALUE — genuinely not applicable:**

12. **Tmux session management** — We don't spawn Claude Code CLI processes. Not applicable.
13. **Mulch expertise recording** — This is a separate CLI tool. Not worth the dependency.

---

## 4. The 7 Implemented Agent Pages — What Each Contains

| Page | Key Agents | Notes |
|------|-----------|-------|
| **00435-contracts_post_award** | `a_construction_correspondence_deep_agent`, `a_contract_management_agent`, `a_document_analysis_agent`, `a_document_retrieval_agent`, `a_human_review_agent`, `a_information_extraction_agent`, `a_professional_formatting_agent` + 20+ discipline specialists | Most complete. Full HITL coordinator. Safety specialist included. |
| **00825-architectural** | Same main agent structure as 00435, architectural-specific specialists | Mirrors 00435 pattern |
| **00850-civil-engineering** | Same main agent structure, civil-specific specialists | Mirrors 00435 pattern |
| **01700-logistics** | `main_agents/` only — no specialist subdirectory | Simpler structure |
| **01900-procurement** | `01900_compliance_validation_agent`, `01900_field_population_agent`, `01900_final_review_agent`, `01900_quality_assurance_agent`, `01900_requirement_extraction_agent`, `01900_template_analysis_agent` + specialists: compliance_monitoring, input_validation, logistics, packaging, **safety**, technical, training, workflow_support | Safety specialist present. Input-agent directory present. |
| **02025_quantity_surveying** | JavaScript simulation files + workflows — not Python agents | Different tech stack |
| **contractor_vetting** | `a_contractor_vetting_deep_agent`, `base_vetting_agent`, `vetting_patterns`, `vetting_agent_configs` + specialists: `hse_management_agent`, `legal_compliance_agent`, `training_competency_agent` | Input-agent directory present. HSE/safety coverage. |

**Priority agents for initial implementation (as identified):**
- **Correspondence** → `00435-contracts_post_award` (most complete, 7 main agents + 20+ specialists)
- **Procurement** → `01900-procurement` (6 main agents + 8 specialist domains including safety)
- **Safety** → embedded as specialists in both 00435 and 01900; standalone at `a_02400_safety_it_specialist.py` and `governance/a_0020_safety_agent.py`
- **CV/Contractor Vetting** → `contractor_vetting` (dedicated deep agent + HSE/legal/training specialists)

---

## 5. Concrete Recommendations

These are ordered by impact and feasibility for the **development phase**, focused on making the priority agents more robust.

> **Note on storage:** All recommendations below use **Supabase** (the project's live database with 458 tables) rather than SQLite or local files. Each recommendation includes:
> 1. A SQL `CREATE TABLE` script → save to `sql/creations/` and run via Supabase SQL Editor
> 2. A Python class using `get_supabase_client()` → place in `deep-agents/deep_agents/messaging/`

---

### Recommendation 1: Implement Supabase-Backed Messaging (Adapt Overstory's Mail Store)

**Why:** Our current in-memory communication breaks the moment agents run in separate processes, separate requests, or need to resume after a crash.

**Step 1 — Create the table** (save as `sql/creations/create_agent_messages_table.sql`, run in Supabase SQL Editor):

```sql
-- sql/creations/create_agent_messages_table.sql
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'status',
    priority TEXT NOT NULL DEFAULT 'normal',
    thread_id UUID,
    payload JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    workflow_id UUID,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_inbox ON agent_messages(to_agent, read);
CREATE INDEX idx_agent_messages_workflow ON agent_messages(workflow_id);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_mode_full_access" ON agent_messages FOR ALL
    USING (COALESCE(current_setting('app.dev_mode', TRUE), 'false')::BOOLEAN);
CREATE POLICY "service_role_full_access" ON agent_messages FOR ALL
    USING (auth.role()::text = 'service_role');
CREATE POLICY "organization_view_access" ON agent_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id::text = auth.uid()::text
        AND uoa.organization_id::text = agent_messages.organization_id::text
    ));
```

**Step 2 — Python class** (Supabase client, adapted from Overstory's `mail/store.ts`):

```python
# deep-agents/deep_agents/messaging/mail_store.py
from deep_agents.utils.supabase_client import get_supabase_client
from dataclasses import dataclass
from typing import Optional, List, Literal
import uuid

MessageType = Literal[
    'status', 'question', 'result', 'error',
    'worker_done', 'merge_ready', 'escalation',
    'health_check', 'dispatch', 'assign'
]

@dataclass
class MailMessage:
    id: str
    from_agent: str
    to_agent: str
    subject: str
    body: str
    type: str
    priority: str
    thread_id: Optional[str]
    payload: Optional[dict]
    read: bool
    workflow_id: Optional[str]
    organization_id: Optional[str]
    created_at: str

class AgentMailStore:
    """Supabase-backed inter-agent messaging. Adapted from Overstory."""

    def __init__(self, organization_id: Optional[str] = None):
        self.supabase = get_supabase_client()
        self.organization_id = organization_id

    def send(self, from_agent: str, to_agent: str, subject: str,
             body: str, type: str = 'status', priority: str = 'normal',
             payload: Optional[dict] = None, workflow_id: Optional[str] = None) -> str:
        msg_id = str(uuid.uuid4())
        self.supabase.table('agent_messages').insert({
            'id': msg_id,
            'from_agent': from_agent,
            'to_agent': to_agent,
            'subject': subject,
            'body': body,
            'type': type,
            'priority': priority,
            'payload': payload,
            'workflow_id': workflow_id,
            'organization_id': self.organization_id,
        }).execute()
        return msg_id

    def get_unread(self, agent_name: str) -> List[MailMessage]:
        result = (
            self.supabase.table('agent_messages')
            .select('*')
            .eq('to_agent', agent_name)
            .eq('read', False)
            .order('created_at')
            .execute()
        )
        return [MailMessage(**row) for row in result.data]

    def mark_read(self, msg_id: str):
        self.supabase.table('agent_messages').update({'read': True}).eq('id', msg_id).execute()
```

**Effort:** 2-3 days. **Impact:** Enables cross-process agent communication and persistent audit trail.

### Recommendation 2: Add Workflow Checkpointing

**Why:** Long-running correspondence analysis (document retrieval + 17 specialists + formatting) can take minutes. A crash loses all progress.

**Step 1 — Create the table** (save as `sql/creations/create_workflow_checkpoints_table.sql`, run in Supabase SQL Editor):

```sql
-- sql/creations/create_workflow_checkpoints_table.sql
CREATE TABLE workflow_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id TEXT NOT NULL UNIQUE,
    agent_name TEXT NOT NULL,
    current_step TEXT NOT NULL,
    progress_summary TEXT,
    completed_steps JSONB DEFAULT '[]',
    pending_steps JSONB DEFAULT '[]',
    partial_results JSONB DEFAULT '{}',
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflow_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_mode_full_access" ON workflow_checkpoints FOR ALL
    USING (COALESCE(current_setting('app.dev_mode', TRUE), 'false')::BOOLEAN);
CREATE POLICY "service_role_full_access" ON workflow_checkpoints FOR ALL
    USING (auth.role()::text = 'service_role');
CREATE POLICY "organization_view_access" ON workflow_checkpoints FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id::text = auth.uid()::text
        AND uoa.organization_id::text = workflow_checkpoints.organization_id::text
    ));
```

**Step 2 — Python class** (adapted from Overstory's `agents/lifecycle.ts`):

```python
# deep-agents/deep_agents/messaging/checkpoint.py
from deep_agents.utils.supabase_client import get_supabase_client
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class WorkflowCheckpoint:
    workflow_id: str
    agent_name: str
    current_step: str
    progress_summary: str
    completed_steps: List[str]
    pending_steps: List[str]
    partial_results: dict

class CheckpointManager:
    def __init__(self, organization_id: Optional[str] = None):
        self.supabase = get_supabase_client()
        self.organization_id = organization_id

    def save(self, checkpoint: WorkflowCheckpoint):
        self.supabase.table('workflow_checkpoints').upsert({
            'workflow_id': checkpoint.workflow_id,
            'agent_name': checkpoint.agent_name,
            'current_step': checkpoint.current_step,
            'progress_summary': checkpoint.progress_summary,
            'completed_steps': checkpoint.completed_steps,
            'pending_steps': checkpoint.pending_steps,
            'partial_results': checkpoint.partial_results,
            'organization_id': self.organization_id,
            'updated_at': datetime.utcnow().isoformat(),
        }, on_conflict='workflow_id').execute()

    def load(self, workflow_id: str) -> Optional[WorkflowCheckpoint]:
        result = (
            self.supabase.table('workflow_checkpoints')
            .select('*')
            .eq('workflow_id', workflow_id)
            .single()
            .execute()
        )
        if not result.data:
            return None
        d = result.data
        return WorkflowCheckpoint(
            workflow_id=d['workflow_id'], agent_name=d['agent_name'],
            current_step=d['current_step'], progress_summary=d['progress_summary'],
            completed_steps=d['completed_steps'], pending_steps=d['pending_steps'],
            partial_results=d['partial_results']
        )

    def clear(self, workflow_id: str):
        self.supabase.table('workflow_checkpoints').delete().eq('workflow_id', workflow_id).execute()
```

**Effort:** 1-2 days. **Impact:** Crash recovery for long-running workflows.

### Recommendation 3: Add Agent Identity Persistence

**Why:** Currently agents have no memory between sessions. An agent that has processed 500 procurement documents should "know" it has expertise in procurement.

**Step 1 — Create the table** (save as `sql/creations/create_agent_identity_store_table.sql`, run in Supabase SQL Editor):

```sql
-- sql/creations/create_agent_identity_store_table.sql
CREATE TABLE agent_identity_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL UNIQUE,
    capability TEXT NOT NULL,
    sessions_completed INTEGER DEFAULT 0,
    expertise_domains JSONB DEFAULT '[]',
    recent_tasks JSONB DEFAULT '[]',
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_identity_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_mode_full_access" ON agent_identity_store FOR ALL
    USING (COALESCE(current_setting('app.dev_mode', TRUE), 'false')::BOOLEAN);
CREATE POLICY "service_role_full_access" ON agent_identity_store FOR ALL
    USING (auth.role()::text = 'service_role');
CREATE POLICY "organization_view_access" ON agent_identity_store FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id::text = auth.uid()::text
        AND uoa.organization_id::text = agent_identity_store.organization_id::text
    ));
```

**Step 2 — Python class** (adapted from Overstory's `agents/identity.ts`):

```python
# deep-agents/deep_agents/messaging/agent_identity.py
from deep_agents.utils.supabase_client import get_supabase_client
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

@dataclass
class AgentIdentity:
    agent_name: str
    capability: str
    sessions_completed: int = 0
    expertise_domains: List[str] = field(default_factory=list)
    recent_tasks: List[dict] = field(default_factory=list)
    MAX_RECENT_TASKS = 20

class AgentIdentityStore:
    def __init__(self, organization_id: Optional[str] = None):
        self.supabase = get_supabase_client()
        self.organization_id = organization_id

    def create(self, agent_name: str, capability: str) -> AgentIdentity:
        self.supabase.table('agent_identity_store').upsert({
            'agent_name': agent_name,
            'capability': capability,
            'organization_id': self.organization_id,
        }, on_conflict='agent_name').execute()
        return AgentIdentity(agent_name=agent_name, capability=capability)

    def load(self, agent_name: str) -> Optional[AgentIdentity]:
        result = (
            self.supabase.table('agent_identity_store')
            .select('*')
            .eq('agent_name', agent_name)
            .single()
            .execute()
        )
        if not result.data:
            return None
        d = result.data
        return AgentIdentity(
            agent_name=d['agent_name'], capability=d['capability'],
            sessions_completed=d['sessions_completed'],
            expertise_domains=d['expertise_domains'],
            recent_tasks=d['recent_tasks']
        )

    def record_completion(self, agent_name: str, workflow_id: str, summary: str, discipline: str):
        identity = self.load(agent_name)
        if not identity:
            return
        identity.sessions_completed += 1
        if discipline not in identity.expertise_domains:
            identity.expertise_domains.append(discipline)
        identity.recent_tasks.append({
            'workflow_id': workflow_id, 'summary': summary,
            'discipline': discipline, 'completed_at': datetime.utcnow().isoformat()
        })
        if len(identity.recent_tasks) > AgentIdentity.MAX_RECENT_TASKS:
            identity.recent_tasks = identity.recent_tasks[-AgentIdentity.MAX_RECENT_TASKS:]
        self.supabase.table('agent_identity_store').update({
            'sessions_completed': identity.sessions_completed,
            'expertise_domains': identity.expertise_domains,
            'recent_tasks': identity.recent_tasks,
            'updated_at': datetime.utcnow().isoformat(),
        }).eq('agent_name', agent_name).execute()
```

**Effort:** 1 day. **Impact:** Agents accumulate expertise over time, enabling smarter routing.

### Recommendation 4: Add Basic Health Monitoring (ZFC Principle)

**Why:** We have no visibility into whether running agents are healthy or stuck.

**Step 1 — Create the table** (save as `sql/creations/create_agent_health_records_table.sql`, run in Supabase SQL Editor):

```sql
-- sql/creations/create_agent_health_records_table.sql
CREATE TABLE agent_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    workflow_id UUID,
    state TEXT NOT NULL DEFAULT 'running',
    current_step TEXT,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    stalled_since TIMESTAMPTZ,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_health_agent ON agent_health_records(agent_id, state);

ALTER TABLE agent_health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_mode_full_access" ON agent_health_records FOR ALL
    USING (COALESCE(current_setting('app.dev_mode', TRUE), 'false')::BOOLEAN);
CREATE POLICY "service_role_full_access" ON agent_health_records FOR ALL
    USING (auth.role()::text = 'service_role');
CREATE POLICY "organization_view_access" ON agent_health_records FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id::text = auth.uid()::text
        AND uoa.organization_id::text = agent_health_records.organization_id::text
    ));
```

**Step 2 — Python class** (adapted from Overstory's ZFC health principle):

```python
# deep-agents/deep_agents/messaging/health_monitor.py
from deep_agents.utils.supabase_client import get_supabase_client
from typing import Optional, Dict
from datetime import datetime

class HealthMonitor:
    """
    Monitors agent health using observable state persisted in Supabase.
    Adapted from Overstory's ZFC principle: trust what you can observe.
    """
    STALE_THRESHOLD_SECONDS = 120   # 2 minutes without activity = stalled
    ZOMBIE_THRESHOLD_SECONDS = 600  # 10 minutes without activity = failed

    def __init__(self, mail_store, organization_id: Optional[str] = None):
        self.supabase = get_supabase_client()
        self.mail_store = mail_store
        self.organization_id = organization_id

    def heartbeat(self, agent_id: str, step: Optional[str] = None):
        """Agent calls this to signal it's alive."""
        self.supabase.table('agent_health_records').upsert({
            'agent_id': agent_id,
            'state': 'running',
            'current_step': step,
            'last_heartbeat': datetime.utcnow().isoformat(),
            'stalled_since': None,
            'organization_id': self.organization_id,
            'updated_at': datetime.utcnow().isoformat(),
        }, on_conflict='agent_id').execute()

    def check_all(self) -> Dict[str, str]:
        """Check health of all active agents in Supabase."""
        result = (
            self.supabase.table('agent_health_records')
            .select('*')
            .not_.in_('state', ['completed', 'failed'])
            .execute()
        )
        now = datetime.utcnow()
        results = {}
        for record in result.data:
            last = datetime.fromisoformat(record['last_heartbeat'].replace('Z', ''))
            elapsed = (now - last).total_seconds()
            agent_id = record['agent_id']
            if elapsed > self.ZOMBIE_THRESHOLD_SECONDS:
                self.supabase.table('agent_health_records').update(
                    {'state': 'failed', 'updated_at': now.isoformat()}
                ).eq('agent_id', agent_id).execute()
                self.mail_store.send(
                    'health_monitor', 'orchestrator',
                    f'Agent failed: {agent_id}',
                    f'No activity for {elapsed:.0f}s',
                    type='escalation'
                )
                results[agent_id] = 'failed'
            elif elapsed > self.STALE_THRESHOLD_SECONDS:
                stalled_since = record.get('stalled_since') or now.isoformat()
                self.supabase.table('agent_health_records').update(
                    {'state': 'stalled', 'stalled_since': stalled_since,
                     'updated_at': now.isoformat()}
                ).eq('agent_id', agent_id).execute()
                results[agent_id] = 'stalled'
            else:
                results[agent_id] = record['state']
        return results
```

**Effort:** 1-2 days. **Impact:** Visibility into stuck agents, automatic escalation, durable across restarts.

### Recommendation 5: Add Token/Cost Tracking

**Why:** We're making LLM API calls with no visibility into cost. This is operationally blind.

**Step 1 — Create the table** (save as `sql/creations/create_agent_session_metrics_table.sql`, run in Supabase SQL Editor):

```sql
-- sql/creations/create_agent_session_metrics_table.sql
CREATE TABLE agent_session_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    workflow_id TEXT,
    discipline TEXT,
    model_used TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd NUMERIC(10,6),
    success BOOLEAN DEFAULT FALSE,
    organization_id UUID REFERENCES organizations(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE agent_session_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_mode_full_access" ON agent_session_metrics FOR ALL
    USING (COALESCE(current_setting('app.dev_mode', TRUE), 'false')::BOOLEAN);
CREATE POLICY "service_role_full_access" ON agent_session_metrics FOR ALL
    USING (auth.role()::text = 'service_role');
CREATE POLICY "organization_view_access" ON agent_session_metrics FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id::text = auth.uid()::text
        AND uoa.organization_id::text = agent_session_metrics.organization_id::text
    ));
```

**Step 2 — Python class** (adapted from Overstory's `metrics/store.ts`):

```python
# deep-agents/deep_agents/messaging/metrics.py
from deep_agents.utils.supabase_client import get_supabase_client
from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timedelta

@dataclass
class SessionMetrics:
    agent_id: str
    workflow_id: str
    discipline: str
    started_at: str
    completed_at: Optional[str]
    input_tokens: int
    output_tokens: int
    model_used: Optional[str]
    success: bool

class MetricsStore:
    """Track token usage and cost per agent session in Supabase."""

    # Approximate costs (update as pricing changes)
    COST_PER_1K_INPUT = 0.003   # GPT-4o input
    COST_PER_1K_OUTPUT = 0.015  # GPT-4o output

    def __init__(self, organization_id: Optional[str] = None):
        self.supabase = get_supabase_client()
        self.organization_id = organization_id

    def record(self, metrics: SessionMetrics):
        cost = (
            (metrics.input_tokens / 1000 * self.COST_PER_1K_INPUT) +
            (metrics.output_tokens / 1000 * self.COST_PER_1K_OUTPUT)
        ) if (metrics.input_tokens or metrics.output_tokens) else None
        self.supabase.table('agent_session_metrics').insert({
            'agent_id': metrics.agent_id,
            'workflow_id': metrics.workflow_id,
            'discipline': metrics.discipline,
            'model_used': metrics.model_used,
            'input_tokens': metrics.input_tokens,
            'output_tokens': metrics.output_tokens,
            'estimated_cost_usd': cost,
            'success': metrics.success,
            'started_at': metrics.started_at,
            'completed_at': metrics.completed_at,
            'organization_id': self.organization_id,
        }).execute()

    def get_total_cost(self, since_days: int = 30) -> float:
        from_date = (datetime.utcnow() - timedelta(days=since_days)).isoformat()
        result = (
            self.supabase.table('agent_session_metrics')
            .select('estimated_cost_usd')
            .gte('started_at', from_date)
            .execute()
        )
        return sum(r['estimated_cost_usd'] or 0 for r in result.data)
```

**Effort:** 1 day. **Impact:** Cost visibility, budget control, queryable via Supabase dashboard.

---

## 6. What NOT to Do (Correcting the Prior Analysis)

### 6.1 Do NOT implement the full messaging architecture described in Appendices D-J

The prior analysis describes a massive integration across simulation procedures, HITL workflows, prompt management, error tracking, and historical Cline data — before the basic messaging system exists. This is **premature architecture**. Build the foundation first.

### 6.2 DO adapt the worktree merge approach — but without the Claude Code dependency

**REVISED:** We actively run 3 simultaneous worktrees. The 4-tier merge resolution concept from Overstory is directly applicable to our workflow. However, Tiers 3 and 4 in Overstory require `claude --print` (Claude Code CLI) — we cannot use those directly. The adapted approach for our team is documented in **Section 10**.

The parts we CAN adapt: Tier 1 (clean merge), Tier 2 (auto-resolve with a defined strategy), and the conflict history recording pattern. Tier 3/4 (AI-resolve) can be done manually with Cline in the worktree rather than via CLI subprocess.

### 6.3 Do NOT mine 6GB of Cline history as a first step

This is a nice-to-have that belongs in Phase 4 or 5, not Phase 1. The prior analysis treats it as a near-term priority.

### 6.4 Do NOT claim 130 agents or 46 discipline implementations

The actual count is 7 discipline page implementations. Planning based on inflated numbers leads to wrong priorities.

### 6.5 Do NOT adopt Overstory's tmux or mulch infrastructure — but DO formalise the worktree workflow

**Tmux** — Claude Code-specific. We don't spawn CLI agent processes. Not applicable.  
**Mulch** — A separate knowledge CLI tool. Not worth the dependency.  
**Git worktrees** — **REVISED: We already use these.** The worktree *conventions* from Overstory (branch naming, isolation rules, merge sequence) are worth adopting. The *tooling* (tmux, mulch) is not. See Section 10 for the adapted approach.

---

## 7. The STEELMAN Warnings — Applied to Our Situation

Overstory's own STEELMAN.md makes 12 arguments against multi-agent swarms. Here is how they apply to **our specific system**:

| Warning | Applies to Us? | Assessment |
|---------|---------------|------------|
| Compounding error rates | **YES** | Our `ParallelSpecialistCoordinator` runs 12-17 specialists in parallel. Each specialist failure compounds. We already handle this with `return_exceptions=True` in `asyncio.gather()` — good. |
| Cost amplification | **YES** | Running 17 specialist LLM calls per correspondence document is expensive. We need token tracking (Rec. 5) to understand actual costs. |
| Loss of coherent reasoning | **PARTIAL** | Our specialists are domain-specific (civil, electrical, etc.) with clear boundaries. Less risk than general-purpose agents. |
| Debugging becomes forensics | **YES** | Currently we have no audit trail. Adding the mail store (Rec. 1) and event logging directly addresses this. |
| Premature decomposition | **LOW** | Our decomposition (by engineering discipline) is well-established domain knowledge, not arbitrary. |
| Merge conflicts | **YES — REVISED** | We run 3 simultaneous worktrees. Merge conflicts are a real daily risk. Overstory's tiered resolution approach (Tiers 1–2 automated, Tiers 3–4 manual with Cline) is directly applicable. See Section 10. |
| Infrastructure complexity | **LOW** | Our proposed additions (5 Supabase tables + Python classes) are minimal — no new infrastructure required. |
| False sense of productivity | **WATCH OUT** | The `MultiInstanceFineTuningOrchestrator` with its `asyncio.sleep()` "fine-tuning" is exactly this — activity theater. |
| Context window fragmentation | **PARTIAL** | Specialists get the full correspondence text. Risk is lower than code-writing agents. |
| Security/trust surface | **LOW** | Our agents don't have shell access or write to the codebase. |
| Expertise illusion | **LOW** | Specialists have fixed, well-defined domains. |
| Operational risk | **MEDIUM** | No circuit breakers currently. Health monitoring (Rec. 4) addresses this. |

---

## 8. Recommended Implementation Order

Based on actual system state and genuine value, focused on the priority agents (correspondence, procurement, safety, CV vetting) during the development phase.

> **Before running any Python code:** create the SQL file in `sql/creations/` and execute it in the Supabase SQL Editor to provision the table. The Python classes depend on the table existing in Supabase.

### Phase 1: Foundation (2-3 weeks)
1. **Create `agent_messages` table + `AgentMailStore`** (Rec. 1)
   - SQL: `sql/creations/create_agent_messages_table.sql` → run in Supabase SQL Editor
   - Python: `deep-agents/deep_agents/messaging/mail_store.py`
   - Enables persistent, cross-process agent communication
2. **Create `workflow_checkpoints` table + `CheckpointManager`** (Rec. 2)
   - SQL: `sql/creations/create_workflow_checkpoints_table.sql` → run in Supabase SQL Editor
   - Python: `deep-agents/deep_agents/messaging/checkpoint.py`
   - Enables crash recovery for long-running workflows
3. **Wire messaging into priority agents** — correspondence (00435), procurement (01900), contractor_vetting

### Phase 2: Observability (1-2 weeks)
4. **Create `agent_session_metrics` table + `MetricsStore`** (Rec. 5)
   - SQL: `sql/creations/create_agent_session_metrics_table.sql` → run in Supabase SQL Editor
   - Python: `deep-agents/deep_agents/messaging/metrics.py`
   - Understand what we're spending per workflow; queryable via Supabase dashboard
5. **Create `agent_health_records` table + `HealthMonitor`** (Rec. 4)
   - SQL: `sql/creations/create_agent_health_records_table.sql` → run in Supabase SQL Editor
   - Python: `deep-agents/deep_agents/messaging/health_monitor.py`
   - Know when agents are stuck or failed; state survives process restarts
6. **Add event logging** to priority agents — audit trail for debugging

### Phase 3: Agent Identity (1 week)
7. **Create `agent_identity_store` table + `AgentIdentityStore`** (Rec. 3)
   - SQL: `sql/creations/create_agent_identity_store_table.sql` → run in Supabase SQL Editor
   - Python: `deep-agents/deep_agents/messaging/agent_identity.py`
   - Agents accumulate expertise across sessions
8. **Route tasks** to agents with relevant expertise domains

### Phase 4: Scale (4-6 weeks)
9. **Expand from 7 to more discipline pages** using the established pattern
10. **Build web UI** for workflow status visibility (using existing React frontend)
11. **User agent creation** — template-based, not code-based

---

## 9. Summary Verdict

| Question | Answer |
|----------|--------|
| Should we directly integrate Overstory? | **No** — Claude Code dependency is absolute |
| Is the prior analysis accurate? | **Partially** — good concepts, overstated our current state |
| What's genuinely valuable from Overstory? | Mail store, checkpoint, identity, health monitoring, metrics, typed protocol |
| What's our actual system state? | 7 discipline agents, LangExtract deployed, framework not deployed |
| What should we build first? | Deploy what exists, then create the 5 Supabase tables and wire in the messaging/checkpoint classes |
| Is the multi-agent approach right for us? | **Yes, with caveats** — domain-specialist parallelism is appropriate; the STEELMAN warnings are manageable given our bounded specialist roles |

The Overstory codebase is genuinely well-engineered and worth studying. The patterns to adapt are the **data layer** (Supabase-backed messaging, checkpoints, identity, metrics) — not the **execution layer** (tmux, worktrees, Claude Code CLI). The prior analysis correctly identified this direction but significantly overstated both our current capabilities and the scope of what should be built first.

---

---

## 10. Systematic Worktree Management — Adapted from Overstory

**Context:** As of 2026-02-18, the team runs 3 simultaneous worktrees on date-named branches. This is the same pattern Overstory was built to manage for AI agents — but we're using it for human developer sessions with Cline. The recommendation is **yes, implement a systematic approach**, adapted from Overstory's conventions but without its Claude Code CLI tooling.

### 10.1 The Problem with the Current Ad-Hoc Approach

Current state:
```
/Users/proc-docs/construct_ai  → Feb-18    (main worktree)
/Users/_General/proc-doc-1     → Feb-18-1  (worktree 2)
/Users/_General/proc-doc-2     → Feb-18-2  (worktree 3)
```

**Risks without a systematic approach:**
- No defined merge order — which branch merges into which first?
- No conflict resolution protocol — what happens when two worktrees edit the same file?
- No isolation rules — which worktrees should avoid touching which files?
- No handoff record — when a worktree session ends, what was accomplished?
- Merge conflicts discovered late, after significant divergence

### 10.2 Overstory's Approach — What to Adapt

Overstory's merge resolution has 4 tiers:

| Tier | Trigger | Action | Our Equivalent |
|------|---------|--------|----------------|
| **Tier 1** | No conflicts | `git merge` succeeds cleanly | Same — just merge |
| **Tier 2** | Conflicts in known-safe files | Auto-resolve: keep incoming (the worker's version) | `git checkout --theirs <file>` for known-safe files |
| **Tier 3** | Conflicts in logic files | AI-resolve: `claude --print` generates resolution | **Manual with Cline** in the worktree |
| **Tier 4** | Tier 3 failed | Reimagine: discard and rewrite from scratch | **Manual with Cline** — start fresh on the conflicting section |

Overstory also records **which files conflict repeatedly** and skips tiers that have failed ≥2× for a given file pattern. We can do this manually with a conflict log.

### 10.3 Recommended Conventions for Our Worktree Workflow

**Branch naming:**
```
<Date>          → main worktree (primary, receives merges)
<Date>-1        → worktree 2 (feature/task isolation)
<Date>-2        → worktree 3 (feature/task isolation)
```
This is already our pattern. Keep it.

**Worktree isolation rules (adapted from Overstory's worker isolation):**

Each worktree session should declare its **primary focus area** at the start. Avoid editing the same files across worktrees simultaneously:

| Worktree | Suggested Focus | Files to Avoid |
|----------|----------------|----------------|
| Main (`Feb-18`) | Integration, merging, shared config | — |
| Worktree 1 (`Feb-18-1`) | One discipline area (e.g., procurement) | Files being changed in worktree 2 |
| Worktree 2 (`Feb-18-2`) | Another discipline area (e.g., correspondence) | Files being changed in worktree 1 |

**Merge sequence (adapted from Overstory's merge order):**

Always merge in this order to minimise conflicts:
1. Worktree 2 → Main (merge the most isolated branch first)
2. Worktree 1 → Main (merge the second branch, resolving any conflicts with worktree 2's changes)
3. Main → both worktrees (sync all worktrees with the merged result)

```bash
# Step 1: Merge worktree 2 into main
cd /Users/proc-docs/construct_ai   # main worktree
git merge Feb-18-2

# Step 2: Merge worktree 1 into main
git merge Feb-18-1

# Step 3: Sync worktrees with merged main
cd /Users/_General/proc-doc-1
git merge Feb-18

cd /Users/_General/proc-doc-2
git merge Feb-18
```

### 10.4 Conflict Resolution Protocol (Adapted from Overstory's 4-Tier System)

When `git merge` reports conflicts, follow this sequence:

**Tier 1 — Clean merge (no action needed)**
```bash
git merge Feb-18-2
# If no conflicts: done
```

**Tier 2 — Auto-resolve known-safe files**

Files that are safe to always take the incoming (worker) version:
- Generated files: `*.json` data files, `build/`, `dist/`
- Lock files: `package-lock.json`, `yarn.lock` (take incoming)
- Migration files: new SQL files in `sql/` (both versions are additive — keep both)

```bash
# For known-safe files, take the incoming version
git checkout --theirs client/src/pages/01900-procurement/some-generated-file.json
git add client/src/pages/01900-procurement/some-generated-file.json
```

**Tier 3 — Manual AI-resolve with Cline**

For logic files (Python agents, React components, SQL migrations) where both versions have meaningful changes:
1. Open the conflicting file in the worktree
2. Ask Cline: *"Resolve this merge conflict — here is the conflict marker. Keep the intent of both versions."*
3. Review and commit

**Tier 4 — Reimagine**

If Tier 3 produces a broken result:
1. Discard the conflicting file: `git checkout HEAD -- <file>`
2. Ask Cline to rewrite the section from scratch, incorporating both sets of changes
3. This is slower but produces cleaner code than a bad merge

### 10.5 Session Handoff Record (Adapted from Overstory's Checkpoint/Handoff)

Overstory saves a handoff JSON file when a session ends. We should do the equivalent — a brief note at the end of each worktree session:

**Create `docs/worktree-handoffs/<date>-<worktree>.md` at the end of each session:**

```markdown
# Worktree Handoff: Feb-18-2 — 2026-02-18

## What was worked on
- Updated procurement agent (01900) to use Supabase checkpoints
- Added `workflow_checkpoints` table SQL script

## Files changed
- deep-agents/deep_agents/messaging/checkpoint.py (new)
- sql/creations/create_workflow_checkpoints_table.sql (new)
- deep-agents/deep_agents/agents/pages/01900-procurement/agents/... (modified)

## State at end of session
- Checkpoint manager implemented and tested locally
- NOT yet wired into the procurement agent — next step

## Conflicts to watch for on merge
- `deep-agents/deep_agents/messaging/__init__.py` — added new import, may conflict if main worktree also modified this

## Next steps for this branch
- Wire CheckpointManager into 01900 procurement agent
- Test with a real procurement workflow
```

This takes 5 minutes and saves significant time when merging or resuming work.

### 10.6 Conflict History Log (Adapted from Overstory's Conflict Learning)

Overstory records which file patterns cause conflicts and skips resolution tiers that have failed. We can do this simply with a shared log:

**`docs/worktree-handoffs/CONFLICT_LOG.md`:**

```markdown
# Conflict History Log

| Date | File Pattern | Conflict Type | Resolution Used | Outcome |
|------|-------------|---------------|-----------------|---------|
| 2026-02-18 | `client/src/pages/*/index.tsx` | Both modified imports | Tier 3 (Cline) | ✅ Clean |
| 2026-02-18 | `package-lock.json` | Both modified | Tier 2 (take incoming) | ✅ Clean |
```

After a few weeks, patterns emerge: certain files always conflict (→ assign to one worktree only), certain file types are always safe to auto-resolve (→ add to Tier 2 list).

### 10.7 Implementation Effort and Recommendation

| Component | Effort | Value |
|-----------|--------|-------|
| Branch naming convention | Already done | — |
| Isolation rules (declare focus area) | 5 min per session | HIGH — prevents conflicts before they happen |
| Merge sequence protocol | 1 hour to document | HIGH — eliminates confusion about merge order |
| Conflict resolution tiers | 1 hour to document | HIGH — consistent approach across team |
| Session handoff records | 5 min per session | MEDIUM — valuable for context recovery |
| Conflict history log | 5 min per conflict | MEDIUM — builds institutional knowledge |

**Recommendation: YES, implement this systematically.** The overhead is minimal (10-15 minutes per session) and the benefit is significant — fewer surprise conflicts, faster merges, and a clear protocol when conflicts do occur. The Overstory approach is sound engineering applied to our exact situation.

The key difference from Overstory: we don't automate Tiers 3 and 4 (no `claude --print` subprocess). Instead, Cline handles these manually in the worktree. This is actually more appropriate for our use case — human developers with Cline assistance, not fully automated agent sessions.

---

*Assessment by: Cline (independent code review)*  
*Based on: Direct source code reading of both repositories*  
*Status: Ready for human review*
