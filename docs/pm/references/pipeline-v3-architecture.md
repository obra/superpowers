<!-- pipeline:v3.1 -->
# Pipeline v3.1 Architecture — Parallel Iteration SDLC with Intent Engineering + AOA

**Version**: v3.1
**Status**: Active
**Date**: 2026-02-26
**Supersedes**: Pipeline v3 (parallel iterations without structured intent)

This is the single source of truth for the v3.1 pipeline. All pipeline-aware files reference this document. Search with `grep -r "pipeline:v3.1"` to find every file in the manifest.

**v3.1 additions over v3**: Intent capture at PI start, human engagement at Integration Points (C3.5), Agentic Output Architecture for DOA artifacts, PI continuation mode across sessions.

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
0-B. PI Continuation Check (v3.1)
   - If completed PI detected in pipeline.json → ask: continue to PI-002 or start fresh?
   - If --continue-pi flag → archive PI-001 artifacts, reset pipeline.json, carry intent forward

0-A. Auto Mode Intent Gate (v3.1, --auto only)
   - If --auto AND no docs/pm/intent.md → block until project-level intent captured
   - Enforced minimums: anti_goals >= 2, escalation_triggers >= 2, success_criteria >= 2

0. Intake + Intent Capture (v3.1)
   - 8 questions (6 original + anti-goals + consumption environment)
   - Structure answers into docs/pm/intent.md
   - Write constants.intent to pipeline.json

1. Pre-flight
   - Validate pipeline.json exists and is valid
   - Memory search: ~/.claude/memory/index.md → top 3 relevant learnings

2. PI Planning (budget-aware)
   - All active Leads write PI briefs (parallel)
   - All active Leads cross-pollinate (parallel)
   - Founder resolves (reads intent.md for alignment): approved objectives, per-team budgets
   - Orchestrator writes constants block to each iteration in pipeline.json

3. FOR each iteration (1, 2, 3, IP):
   a. Orchestrator writes constants block (budgets, thresholds, deps, sanity checks)
   b. All Leads write iteration plans (parallel, budget-aware)

   c. PARALLEL EXECUTION ENGINE:
      WHILE iteration not complete:
        FOR each team IN constants.active_teams:
          IF team.budget_consumed >= team.budget.total → team DONE (budget exhausted)
          ELIF next_unblocked_task(team) exists → dispatch task
             (PreToolUse hook injects context + judgment boundaries; SubagentStop updates state)
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
   h. Integration Point sync (converge-diverge, 5 steps):
      C1: All Leads write sync briefs (parallel)
      C2: All Leads cross-pollinate (parallel, skip if < 3 Leads)
      C3: Founder resolves (reads intent.md)
      C3.5: Human Engagement (v3.1, interactive mode only)
            - Score findings against intent success_criteria
            - Present 3-5 targeted questions via AskUserQuestion
            - Write responses to docs/pm/ip-feedback/iteration-{N}-human-feedback.md
      C4: Execute next iteration
   i. Orchestrator: update pod brief, update program board
   j. Write DOA summary with AOA format selection (v3.1):
      - Curation pass: score findings against intent
      - Select format from consumer profile in intent.md
      - Fallback to Markdown if tool unavailable

4. IP Iteration
   - Full budget, parallel retrospectives
   - Knowledge compounding → ~/.claude/memory/
   - Ship (superpowers:finishing-a-development-branch)
   - PI artifact package via AOA (v3.1)

5. Pipeline complete
   - Learnings to memory
   - safe_metrics summary
```

---

## 9.1 Intent Engineering Integration (v3.1)

Intent capture ensures the pipeline stays aligned with the human's actual goals — not the agents' interpretation of them.

### 9.1.1 Intent Capture at PI Start

At Step 0, the Orchestrator asks 8 intake questions (6 original + anti-goals + consumption environment). Answers are structured into `docs/pm/intent.md` using the intent template. The intent document contains:

- **Goals**: primary, secondary, anti-goals (what NOT to build)
- **Constraints**: speed, quality, budget, technical
- **Judgment Boundaries**: what AI owns vs. what human approves, escalation triggers
- **Success Criteria**: measurable outcomes (minimum 2)
- **Consumer Profile**: who reads the output, how, in what format (for AOA)

Intent is written to `constants.intent` in pipeline.json (scope, auto_mode, captured flag).

### 9.1.2 Auto Mode Intent Gate (Step 0-A)

When `--auto` flag is set AND no `docs/pm/intent.md` exists, the pipeline blocks until project-level intent is captured with enforced minimums:
- `anti_goals >= 2`
- `escalation_triggers >= 2`
- `success_criteria >= 2`

Even autonomous sessions require this human interaction upfront. The rest runs without C3.5.

### 9.1.3 Agent-to-Agent Intent Protocol

The Orchestrator constructs `intent_request` JSON blocks in Task prompts for dependent tasks. This is Orchestrator-constructed (in prompt text), NOT hook-injected. The pre-dispatch hook injects only project-level judgment boundaries from intent.md.

### 9.1.4 Intent Reuse

`docs/pm/intent.md` persists across sessions. Subsequent sessions skip capture if the intent document exists and is non-stale (same PI, same project).

---

## 9.2 Human Engagement at Integration Points (v3.1)

### 9.2.1 C3.5: Structured Human Engagement

After C3 (Founder Resolves) and before C4 (Execute), in interactive mode only:

1. Orchestrator reads `intent.md` success_criteria + escalation_triggers
2. Reads `resolution.md` for key findings
3. Scores findings against intent
4. Presents 3-5 targeted questions via AskUserQuestion
5. Writes responses to `docs/pm/ip-feedback/iteration-{N}-human-feedback.md`
6. Updates `pipeline.json`: `state.iterations.{N}.ip_feedback.captured = true`

### 9.2.2 Skip Conditions

- `--auto` mode: C3.5 is skipped entirely. P1 findings logged with `REQUIRES_ATTENTION`.
- Tier A: No Integration Points, so no C3.5.

### 9.2.3 Feedback Flow

IP feedback files are included in dispatch context via context-management Layer 5.5. The Orchestrator reads the file and includes it in prompt, not via automatic hook injection.

---

## 9.3 Agentic Output Architecture (v3.1)

AOA ensures human-facing output matches the consumer's needs — not a one-size-fits-all Markdown dump.

### 9.3.1 Where AOA Applies

Only 3 artifact types use AOA format selection:
1. **DOA IP summaries** (`docs/pm/doa/ip-{N}-summary.*`)
2. **PI complete summary** (`docs/pm/doa/pi-complete-summary.*`)
3. **PI artifact package** (generated at IP Iteration end)

All internal pipeline artifacts remain Markdown.

### 9.3.2 Format Selection

The Orchestrator reads the Consumer Profile from `intent.md`:
- `consumer_type`: executive / technical / mobile-casual
- `consumption_environment`: desktop / mobile / email / CI
- `preferred_affordance`: read-only / annotatable / editable / interactive

Format is selected based on these slots. Fallback to Markdown if the AOA tool is unavailable or intent was not captured.

### 9.3.3 Curation Before Format (R5)

Before AOA format selection, the Orchestrator runs a curation pass:
- Score findings against intent success_criteria
- Structure output as "What You Need to Know" (top findings) vs. "Full Details" (everything else)
- This ensures the human sees the most important information first, regardless of format.

---

## 9.4 PI Continuation Mode (v3.1)

### 9.4.1 Detection

The `pipeline-session-start.sh` hook detects a completed PI when `current_iteration == "ip"` and `iterations.ip.state.integration_point_triggered == true`.

### 9.4.2 Archive Protocol

When continuing to PI-002:
1. Copy all artifacts to `docs/pm/archive/PI-001/`
2. Verify archive (file count check)
3. Remove originals: `sync/`, `retrospectives/`, `iteration-plans/`, `doa/`, `demos/`, `pi-planning/`
4. KEEP: `intent.md`, `.pod-brief.md`, `learnings/`, `decisions/`
5. Reset pipeline.json: PI-002, iteration 0, preserve `constants.intent`
6. Update pod brief: last 3 decisions, "Prior PI Summary" reference

### 9.4.3 Trigger

- `--continue-pi` flag: skips confirmation question
- No flag but completed PI detected: asks "Continue to PI-002 or start fresh?"

---

## 10. Version Governance

### 10.1 Pipeline Signature Tags

Every file with pipeline-specific instructions is tagged:

```markdown
<!-- pipeline:v3.1 -->
## Pipeline Information
**Version**: v3.1 (Parallel Iteration SDLC + Intent + AOA)
**Architecture**: See `docs/pm/references/pipeline-v3-architecture.md`

[pipeline-specific instructions]
<!-- /pipeline:v3.1 -->
```

Search: `grep -r "pipeline:v3.1"` finds every v3.1-aware file.
Upgrade: When v4 arrives, search for `pipeline:v3.1`, review and update each file.

### 10.2 Scrub Checklist

After v3.1 implementation, these patterns must return 0 results in agent/skill files:

```bash
# Existing scrub (v2.1 patterns):
grep -r "Phase [1-6]"    # v2.1 sequential phases
grep -r "micro.sync"     # removed terminology
grep -r "pipeline\.yaml"  # replaced by pipeline.json
grep -r "pipeline-state\.json"  # replaced by pipeline.json

# v3.1 scrub (new):
grep -r "pipeline:v3 " ~/.claude/agents/ ~/.claude/skills/  # all updated to v3.1
grep -r "docs/sync/phase-" ~/.claude/  # should be iteration-{N}
```

---

## 11. File Manifest

Every file tagged `<!-- pipeline:v3.1 -->`:

| File | Role |
|------|------|
| `docs/pm/references/pipeline-v3-architecture.md` | This file — canonical v3.1 reference |
| `~/.claude/skills/orchestration/SKILL.md` | Parallel execution engine, budget dispatch, DOA+AOA |
| `~/.claude/agents/orchestrator.md` | Orchestrator agent — intent capture, C3.5, AOA format |
| `~/.claude/agents/founder.md` | Founder — reads intent.md, budget allocation |
| `~/.claude/agents/product-lead.md` | Product Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/agents/design-lead.md` | Design Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/agents/engineering-lead.md` | Engineering Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/agents/quality-lead.md` | Quality Lead — iteration-scoped, TASK_RESULT contract |
| `~/.claude/agents/marketing-lead.md` | Marketing Lead — optional, TASK_RESULT contract |
| `~/.claude/agents/humanizer.md` | Humanizer — preserves TASK_RESULT + intent blocks |
| `~/.claude/agents/verifier.md` | Verifier — intent alignment check |
| `~/.claude/agents/artifact-generator.md` | Artifact Generator — TASK_RESULT contract |
| `~/.claude/agents/browser-tester.md` | Browser Tester — TASK_RESULT contract |
| `~/.claude/agents/content-marketer.md` | Content Marketer — TASK_RESULT contract |
| `~/.claude/agents/domain-researcher.md` | Domain Researcher — TASK_RESULT contract |
| `~/.claude/agents/growth-marketer.md` | Growth Marketer — TASK_RESULT contract |
| `~/.claude/agents/market-researcher.md` | Market Researcher — TASK_RESULT contract |
| `~/.claude/agents/onboarding-designer.md` | Onboarding Designer — TASK_RESULT contract |
| `~/.claude/agents/release-readiness-reviewer.md` | Release Readiness — TASK_RESULT contract |
| `~/.claude/agents/security-reviewer.md` | Security Reviewer — TASK_RESULT contract |
| `~/.claude/agents/seo-specialist.md` | SEO Specialist — TASK_RESULT contract |
| `~/.claude/agents/ux-researcher.md` | UX Researcher — TASK_RESULT contract |
| `~/.claude/agents/ux-reviewer.md` | UX Reviewer — TASK_RESULT contract |
| `~/.claude/agents/visual-designer.md` | Visual Designer — TASK_RESULT contract |
| `~/.claude/skills/judgment-gates/SKILL.md` | Integration Point gate type + Engagement Gate |
| `~/.claude/skills/knowledge-compounding/SKILL.md` | IP Iteration compounding |
| `~/.claude/skills/context-management/SKILL.md` | Hook-aware context assembly + Layer 0.5/5.5 |
| `CLAUDE.md` (worktree) | v3.1 overview, version governance |
| `~/.claude/CLAUDE.md` (global) | AI Employee Framework + budget-awareness principle |
| `~/.claude/skills/orchestration/templates/pipeline-v3-template.json` | Pipeline file template |
| `~/.claude/skills/orchestration/templates/intent-template.md` | Intent document template (v3.1) |
| `~/.claude/skills/orchestration/templates/ip-feedback-template.md` | IP feedback template (v3.1) |
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
| Intent at Orchestrator level, not hooks (v3.1) | Agent-to-agent intent is Orchestrator-constructed in prompts, not hook-injected. Keeps hook complexity low. |
| AOA only for 3 artifact types (v3.1) | DOA summaries, PI complete, PI package. Internal artifacts stay Markdown. |
| C3.5 human engagement (v3.1) | Structured questions between iterations, scored against intent. Skipped in --auto. |
| PI continuation (v3.1) | Copy-then-verify-then-delete. Intent + learnings always carry forward. |
<!-- /pipeline:v3.1 -->
