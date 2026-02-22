<!-- pipeline:v3 -->
# Pipeline v3 Architecture — Parallel Iteration SDLC with Token Budget Timebox

**Version**: v3  
**Status**: Active  
**Date**: 2026-02-22  
**Supersedes**: Pod-Based SDLC v2.1 (sequential phases)

This is the single source of truth for the v3 pipeline. All pipeline-aware files reference this document. Search with `grep -r "pipeline:v3"` to find every file in the manifest.

---

## 1. Why v3

v2.1 ran 6 sequential phases — waterfall in SAFe vocabulary. A Sudoku test run exposed this: all teams waited idle while one team worked. v3 gets into the spirit of SAFe by running teams in parallel within token-budgeted iterations, with dual-trigger Integration Points that fire when work is done OR when the timebox expires.

**Token budget = the AI equivalent of an 80-hour sprint.** It's measurable, deterministic, and enables velocity tracking across PIs.

---

## 2. Pipeline Structure

```
PI-001
├── PI Planning          (budget-aware, all Leads + Founder)
├── Iteration 1: Foundation   — parallel teams, token-budgeted
│   Integration Point 1: "Spec Lock"        (dual trigger)
├── Iteration 2: Build        — parallel teams, token-budgeted
│   Integration Point 2: "Feature Complete" (dual trigger)
├── Iteration 3: Harden       — parallel teams, token-budgeted
│   Integration Point 3: "Ship Decision"    (dual trigger)
└── IP Iteration: Learn       — same budget tier, retros + knowledge + ship
```

**Iteration naming** (suggested defaults; project may override in pipeline.json):
- **Iteration 1: Foundation** — research, PM spec, design system, tech evaluation, test plan
- **Iteration 2: Build** — implementation, core features, design execution
- **Iteration 3: Harden** — quality, security, browser testing, hardening
- **IP Iteration: Learn** — retrospectives, knowledge compounding, ship

---

## 3. Token Budget Timebox

### 3.1 Budget Allocation (Initial Calibration — Refine Per PI)

```
PI total: ~7M tokens
  PI Planning:    500K   (high ceiling — budget-aware agents plan better)
  Iteration 1:    1.5M
  Iteration 2:    2.0M
  Iteration 3:    1.5M
  IP Iteration:   1.5M   (same tier — learning needs resources early)
```

Per-team budgets are allocated **asymmetrically** by the Founder at PI Planning based on iteration workload. Examples:
- Iteration 1: Product gets more (research-heavy), Engineering gets less
- Iteration 2: Engineering gets more (code-heavy), Product gets less
- Iteration 3: Quality gets more (testing-heavy)

### 3.2 Budget Rules

- No carryover between iterations (Founder can authorize explicit extension in writing)
- Grace period: finish current task when budget hit, then stop
- Per-team checkpoints: **70%** (status report), **90%** (wrap-up mode), **100%** (forced stop)
- Founder-authorized cross-team reallocation for critical unfinished work

### 3.3 Budget Thresholds in pipeline.json

```json
"constants": {
  "budgets": {
    "product":     { "total": 600000, "t70": 420000, "t90": 540000 },
    "design":      { "total": 250000, "t70": 175000, "t90": 225000 },
    "engineering": { "total": 400000, "t70": 280000, "t90": 360000 },
    "quality":     { "total": 250000, "t70": 175000, "t90": 225000 }
  }
}
```

---

## 4. Dual-Trigger Integration Points

An Integration Point fires when **either** condition is met (whichever comes first):

| Trigger | Description |
|---------|-------------|
| (a) All required artifacts exist | Fast path — work is done |
| (b) All teams exhausted budget | Timebox path — time is up |

The Orchestrator checks both conditions after every task completion and after every budget alert.

---

## 5. Coordination Architecture

### 5.1 Communication Hierarchy (Use Lightest Sufficient Level)

| Level | Mechanism | Token Cost | When to Use |
|-------|-----------|-----------|-------------|
| 1. Pipeline file | JSON task status + key_outputs | ~30 tokens | Status checks, dependency resolution |
| 2. Hook injection | PreToolUse injects key_outputs into dispatch | 0 agent tokens | Unblocking cross-team deps |
| 3. Artifacts | Full documents (PM spec, mockups) | ~2K–10K tokens | Deep work consuming the artifact |

### 5.2 Orchestrator as Router

Agents **never** read `pipeline.json` directly. The Orchestrator reads state, assembles minimal context, and dispatches with just enough. Hooks automate the bookkeeping so Orchestrator tokens go to decisions, not state management.

### 5.3 OpenProject

OpenProject is **disabled by default** for v3 runs. It can be layered on as a human review interface without changing the core algorithm. No OP fields in `pipeline.json`.

---

## 6. Pipeline File: pipeline.json

**One file per project**: `docs/pm/pipeline.json`

Replaces both `pipeline.yaml` (template) and `.pipeline-state.json` (runtime). One file, one format, jq-parseable.

Template: `~/.claude/skills/orchestration/templates/pipeline-v3-template.json`

### 6.1 Top-Level Schema

```json
{
  "pipeline": "v3",
  "pi": "PI-001",
  "project": "<project-name>",
  "current_iteration": 1,

  "pi_planning": {
    "budget": 500000,
    "status": "pending"
  },

  "iterations": { ... },

  "safe_metrics": {
    "pi_planning": { "runs": 0, "objectives_count": 0 },
    "token_velocity": {},
    "retro": { "iterations_retrod": 0, "improvement_items": 0, "learnings_captured": 0 }
  }
}
```

### 6.2 Iteration Schema

Each iteration has two blocks: **constants** (computed once, immutable) and **state** (updated per task).

```json
"iterations": {
  "1": {
    "name": "Foundation",
    "status": "pending",

    "teams": {
      "product": {
        "tasks": ["product:research", "product:pm-spec", "product:wsjf"]
      },
      "design": {
        "tasks": ["design:trends", "design:design-system"]
      },
      "engineering": {
        "tasks": ["engineering:tech-eval", "engineering:scaffold"]
      },
      "quality": {
        "tasks": ["quality:test-plan", "quality:framework-setup"]
      }
    },

    "constants": {
      "budgets": {
        "product":     { "total": 600000, "t70": 420000, "t90": 540000 },
        "design":      { "total": 250000, "t70": 175000, "t90": 225000 },
        "engineering": { "total": 400000, "t70": 280000, "t90": 360000 },
        "quality":     { "total": 250000, "t70": 175000, "t90": 225000 }
      },
      "dependencies": {
        "design:design-system": ["product:color-direction"],
        "quality:test-plan": ["product:pm-spec"]
      },
      "sanity_checks": {
        "product:pm-spec": {
          "estimated_tokens": 200000,
          "budget_guidance": "5-8 targeted web searches per researcher",
          "required_fields": ["task_id", "status", "key_outputs", "artifacts_produced"],
          "required_artifacts": ["docs/pm/*-pm-spec.md"],
          "min_key_outputs": 3
        }
      },
      "integration_point": {
        "name": "Spec Lock",
        "trigger_artifacts": [
          "docs/pm/*-pm-spec.md",
          "docs/design/design-system.md",
          "docs/eng/tech-eval.md"
        ]
      }
    },

    "state": {
      "tasks": {
        "product:pm-spec": {
          "status": "pending",
          "tokens": 0,
          "key_outputs": [],
          "artifacts": []
        }
      },
      "budget_consumed": {
        "product": 0, "design": 0, "engineering": 0, "quality": 0
      },
      "alerts_triggered": {
        "product": [], "design": [], "engineering": [], "quality": []
      }
    }
  }
}
```

### 6.3 Dependency Rules

- Dependencies live in **exactly one place**: `iterations.{N}.constants.dependencies`
- New dependencies can be added mid-iteration (task breakdown skill only); no removals
- The hook checks deps before dispatch; unmet deps → task stays blocked

---

## 7. Agent Output Contract

Every dispatched agent **must** include this block in their response:

```
<!-- TASK_RESULT
{
  "task_id": "product:pm-spec",
  "status": "completed",
  "tokens_reported": 150000,
  "key_outputs": ["email-only auth", "3 screens", "mobile-first"],
  "artifacts_produced": ["docs/pm/pm-spec.md"],
  "issues": []
}
-->
```

**Format rules:**
- HTML comment = invisible in markdown, parseable by `grep -o '<!-- TASK_RESULT.*-->'`
- `status`: `"completed"` | `"partial"` | `"failed"`
- `tokens_reported`: agent's self-reported count (cross-checked against transcript)
- `key_outputs`: 3–10 short strings (decision keywords, not prose)
- `artifacts_produced`: list of file paths
- `issues`: list of blocking issues (empty array if none)

**Validation**: SubagentStop hook validates against `sanity_checks` in constants. Token count cross-checked against transcript JSONL (>20% mismatch → warning, transcript value used).

---

## 8. Hook Architecture

6 hooks automate coordination bookkeeping at ~0 agent token cost.

### 8.1 Hook Summary

| Hook | Event | Action | Latency |
|------|-------|--------|---------|
| `pipeline-session-start.sh` | Session begins | Validate pipeline.json exists and is valid JSON | ~50ms |
| `pipeline-pre-dispatch.sh` | PreToolUse [Task] | Read pipeline.json → inject key_outputs + budget context via additionalContext. Deny if team budget exhausted. | ~80ms |
| `pipeline-subagent-start.sh` | SubagentStart | Record start_time, log dispatch to metrics | ~20ms |
| `pipeline-subagent-stop.sh` | SubagentStop | Parse TASK_RESULT → validate sanity checks → update state → track tokens → check budget thresholds | ~250ms |
| `pipeline-post-dispatch.sh` | PostToolUse [Task] | Read updated state → inject "newly unblocked: X, Y" + budget alerts | ~80ms |
| `pipeline-stop-guard.sh` | Stop | Verify no pending tasks skipped, expected artifacts exist | ~50ms |

**Total hook overhead per dispatch: ~430ms** vs. 15–45 seconds of agent work. Under 3%.

All hooks use `jq` — zero interpreter startup.

### 8.2 Hook Locations

```
~/.claude/scripts/hooks/
├── pipeline-session-start.sh
├── pipeline-pre-dispatch.sh
├── pipeline-subagent-start.sh
├── pipeline-subagent-stop.sh
├── pipeline-post-dispatch.sh
└── pipeline-stop-guard.sh
```

### 8.3 Hook Registration (project-level settings.json)

Hooks are registered in `.claude/settings.json` at the project root. They only fire when `docs/pm/pipeline.json` exists (each hook checks for this file first).

---

## 9. Execution Algorithm

```
1. Pre-flight
   - Validate pipeline.json exists and is valid
   - Memory search: ~/.claude/memory/index.md → top 3 relevant learnings

2. PI Planning (budget-aware)
   - All 4 Leads write PI briefs (parallel)
   - All 4 Leads cross-pollinate (parallel)
   - Founder resolves: approved objectives, per-team budgets, program board
   - Orchestrator writes constants block to each iteration in pipeline.json

3. FOR each iteration (1, 2, 3, IP):
   a. Orchestrator writes constants block (budgets, thresholds, deps, sanity checks)
   b. All Leads write iteration plans (parallel, budget-aware)

   c. PARALLEL EXECUTION ENGINE:
      WHILE iteration not complete:
        FOR each team IN [product, design, engineering, quality]:
          IF team.budget_consumed >= team.budget.total → team DONE (budget exhausted)
          ELIF next_unblocked_task(team) exists → dispatch task
             (PreToolUse hook injects context; SubagentStop hook updates state)
          ELSE → team BLOCKED (waiting on deps)
        IF all teams DONE or BLOCKED → iteration ends (timebox trigger)
        
        Budget checkpoints (per-team):
          IF consumed >= t70 AND "70" not in alerts_triggered → report status
          IF consumed >= t90 AND "90" not in alerts_triggered → switch to wrap-up mode
          IF consumed >= total → stop, record as budget-exhausted

   d. Wait for active tasks to finish (grace period: complete current task)
   e. Check Integration Point dual trigger:
      - (a) All trigger_artifacts exist → "fast path complete"
      - (b) All teams DONE/BLOCKED → "timebox expired"
      - Whichever fires first → proceed to Integration Point sync

   f. All Leads write retrospectives (parallel)
   g. System Demo (Iterations 2 + 3 only)
   h. Integration Point sync (converge-diverge, 4 steps):
      C1: All Leads write sync briefs (parallel)
      C2: All Leads cross-pollinate (parallel, skip if < 3 Leads)
      C3: Founder resolves (sequential)
      C4: Execute next iteration
   i. Orchestrator: update pod brief, update program board

4. IP Iteration
   - Full budget, parallel retrospectives
   - Knowledge compounding → ~/.claude/memory/
   - Ship (superpowers:finishing-a-development-branch)

5. Pipeline complete
   - Learnings to memory
   - safe_metrics summary
```

---

## 10. Version Governance

### 10.1 Pipeline Signature Tags

Every file with pipeline-specific instructions is tagged:

```markdown
<!-- pipeline:v3 -->
## Pipeline Information
**Version**: v3 (Parallel Iteration SDLC)
**Architecture**: See `docs/pm/references/pipeline-v3-architecture.md`

[pipeline-specific instructions]
<!-- /pipeline:v3 -->
```

Search: `grep -r "pipeline:v3"` finds every v3-aware file.  
Upgrade: When v4 arrives, search for `pipeline:v3`, review and update each file.

### 10.2 v2.1 Scrub Checklist

After v3 implementation, these patterns must return 0 results in agent/skill files:

```bash
grep -r "Phase [1-6]"    # v2.1 sequential phases
grep -r "micro.sync"     # removed terminology
grep -r "openproject\|op_metrics"  # OP disabled in v3 core
grep -r "pipeline\.yaml\|pipeline-state\.json"  # replaced by pipeline.json
```

---

## 11. File Manifest

Every file tagged `<!-- pipeline:v3 -->`:

| File | Role |
|------|------|
| `docs/pm/references/pipeline-v3-architecture.md` | This file — canonical v3 reference |
| `~/.claude/skills/orchestration/SKILL.md` | Parallel execution engine, budget dispatch |
| `~/.claude/agents/orchestrator.md` | Orchestrator agent — parallel dispatch, hook integration |
| `~/.claude/agents/founder.md` | Founder — budget allocation at PI Planning |
| `~/.claude/agents/product-lead.md` | Product Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/agents/design-lead.md` | Design Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/agents/engineering-lead.md` | Engineering Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/agents/quality-lead.md` | Quality Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/skills/judgment-gates/SKILL.md` | Integration Point gate type |
| `~/.claude/skills/knowledge-compounding/SKILL.md` | IP Iteration compounding |
| `~/.claude/skills/context-management/SKILL.md` | Hook-aware context assembly |
| `CLAUDE.md` (worktree) | v3 overview, version governance |
| `~/.claude/CLAUDE.md` (global) | AI Employee Framework + budget-awareness principle |
| `~/.claude/skills/orchestration/templates/pipeline-v3-template.json` | Pipeline file template |
| `.claude/settings.json` | Hook registrations |

---

## 12. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Token budget as timebox | Measurable, deterministic, enables velocity tracking |
| Single pipeline.json | One file, one format, one parser (jq). No sync between yaml + state. |
| Hooks for bookkeeping | 0 agent token cost for state management. Under 3% overhead. |
| Orchestrator-as-router | Agents never read pipeline.json. Orchestrator assembles minimal context. |
| Dual-trigger Integration Points | Fast path (done) + timebox (budget exhausted). No idle waiting. |
| OP disabled by default | Layers on without changing core algorithm. No OP blocking in v3. |
| key_outputs in pipeline.json | Enables unblocking deps via hook injection without full artifact reads. |
| HTML comment output contract | Invisible in markdown, trivially parseable by shell. |
<!-- /pipeline:v3 -->
