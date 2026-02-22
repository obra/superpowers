<!-- pipeline:v3 -->
# Superpowers — SDLC Orchestration Fork (Pipeline v3)

## SDLC Orchestration Extension

This fork adds a Pipeline v3 SDLC orchestration system on top of Superpowers. v3 moves from 6 sequential phases (v2.1) to parallel iteration teams within token-budgeted timeboxes. All department teams run concurrently within each iteration. Integration Points fire when work is done OR when the timebox expires — whichever comes first.

**Canonical architecture reference**: `docs/pm/references/pipeline-v3-architecture.md`

### Added Commands
- `/orchestrate` — Run the full Pipeline v3 SDLC (PI Planning → Iterations 1–3 + IP Iteration)
- `/scaffold` — Generate project scaffolding from YAML templates
- `/pm-discover` — Standalone PM discovery (Product Lead conducts discovery + researcher dispatch)

---

## Organizational Structure

```
FOUNDER (opus) ← final decision maker, Integration Point resolution, rework authority
│
├── Product Department
│   ├── Product Lead (opus)             — dept accountability, research synthesis, resistance
│   ├── Domain Researcher (sonnet)      — industry regulations, terminology, analogous products
│   ├── Market Researcher (sonnet)      — competitors, community signals, pricing, trends
│   ├── UX Researcher (sonnet)          — user journeys: first open, day 1, day 7, day 30
│   ├── Onboarding Designer (sonnet)    — first-run flow, progressive disclosure, activation
│   └── Artifact Generator (sonnet)    — full PM artifact suite
│
├── Design Department
│   ├── Design Lead (opus)              — dept accountability, design system, resistance
│   └── Visual Designer (sonnet)       — HTML mockups using frontend-design plugin
│
├── Engineering Department
│   ├── Engineering Lead (opus)         — dept accountability, architecture, TDD enforcement
│   ├── Implementers (sonnet per task)  — subagent-driven-development
│   ├── Code Reviewers (sonnet)         — spec + quality reviews per task
│   └── UX Reviewer (sonnet)           — post-implementation screenshot vs. mockup comparison
│
├── Quality Department
│   ├── Quality Lead (opus)             — dept accountability, risk synthesis, ship/no-ship
│   ├── Verifier (sonnet)              — anti-rationalization checker
│   ├── Browser Tester (sonnet)        — smoke, mobile, E2E, accessibility
│   ├── Security Reviewer (sonnet)     — OWASP Top 10 source code analysis
│   └── Release Readiness (opus)       — holistic PM spec vs. implementation check
│
└── Staff
    ├── Orchestrator (opus)            — pipeline conductor, pod brief, Integration Point facilitation
    └── Humanizer (sonnet)             — strips AI patterns from human-facing output
```

---

## Pipeline: v3 Iterations

```
PI-001
├── PI Planning          — all 4 Leads + Founder, token budget allocation, ROAM risks, program board
│
├── Iteration 1: Foundation   — all 4 department teams run concurrently, token-budgeted
│   Product:     Domain research + Market research → PM spec + 6 artifacts
│   Design:      Design system + HTML mockups (onboarding, core, empty states)
│   Engineering: why-reinvent evaluation + architecture design doc + TDD plan
│   Quality:     Definition of Done + acceptance criteria review
│   ──────────────────────────────────────────────────────────────────────
│   Integration Point 1: "Spec Lock"         (dual trigger — see below)
│
├── Iteration 2: Build        — all 4 department teams run concurrently, token-budgeted
│   Product:     Backlog grooming + WSJF prioritization + story refinement
│   Design:      Mockup revisions from IP-1 resolution + design QA
│   Engineering: Implementation (enablers first, then features, subagent-driven)
│   Quality:     Static analysis + ongoing code review
│   ──────────────────────────────────────────────────────────────────────
│   Integration Point 2: "Feature Complete"  (dual trigger — see below)
│
├── Iteration 3: Harden       — all 4 department teams run concurrently, token-budgeted
│   Product:     Release notes + onboarding verification
│   Design:      Final UX review + WCAG compliance check
│   Engineering: Bug fixes + performance + UX screenshot vs. mockup comparison
│   Quality:     Browser tests + security scan + Release Readiness review
│   ──────────────────────────────────────────────────────────────────────
│   Integration Point 3: "Ship Decision"     (dual trigger — see below)
│
└── IP Iteration: Learn       — retros, knowledge compounding, ship
    All Leads:   Retrospectives + mini-learnings
    Orchestrator: knowledge-compounding skill → ~/.claude/memory/
    Engineering: superpowers:finishing-a-development-branch
```

**Dual-trigger Integration Points**: an Integration Point fires when ALL key_outputs for that iteration exist in the filesystem (fast path) OR when ALL teams have exhausted their token budgets (timebox path) — whichever comes first. The hook `pipeline-subagent-stop.sh` evaluates both conditions after every task completion.

**Token Budget Defaults**:
```
PI total: ~7M tokens
  PI Planning:    500K
  Iteration 1:    1.5M  (Product-heavy: research + PM spec)
  Iteration 2:    2.0M  (Engineering-heavy: implementation)
  Iteration 3:    1.5M  (Quality-heavy: testing + hardening)
  IP Iteration:   1.5M  (Balanced: retros + ship)
```

Token budget is the AI equivalent of sprint hours. Set at PI Planning in `pipeline.json`, enforced per-team per-iteration by `pipeline-subagent-stop.sh`. When a team hits 80% of its budget, the hook injects a budget-alert into the next dispatch context. When a team exhausts its budget, the team is marked complete for that iteration regardless of remaining tasks — partial output is accepted and logged.

---

## Integration Point Protocol

At each Integration Point, the Orchestrator facilitates a 4-step sync:

```
Step C1 — Share State: All Leads write sync briefs in parallel
           → docs/sync/iteration-{N}/briefs/<dept>-brief.md

Step C2 — Cross-Pollinate: All Leads read other briefs, write responses in parallel
           → docs/sync/iteration-{N}/responses/<dept>-response.md
           [Skip if < 3 Leads have material findings]

Step C3 — Founder Resolves: reads all briefs + responses, writes resolution
           → docs/sync/iteration-{N}/resolution.md

Step C4 — Execute: next iteration begins with resolution in context
```

Resolution files are injected by `pipeline-pre-dispatch.sh` into every subsequent task context. Leads do not need to re-read them manually — the hook handles context injection.

---

## Hook Architecture

6 hooks automate coordination at ~0 orchestrator token cost:

```
~/.claude/scripts/hooks/
├── pipeline-session-start.sh   — validate pipeline.json on session start; surface blocked tasks
├── pipeline-pre-dispatch.sh    — inject budget context + dep key_outputs before task dispatch
├── pipeline-subagent-start.sh  — record task start time + mark task in_progress in pipeline.json
├── pipeline-subagent-stop.sh   — parse TASK_RESULT, update task state, check budget thresholds,
│                                  evaluate dual-trigger Integration Point conditions
├── pipeline-post-dispatch.sh   — inject newly-unblocked tasks + budget alerts after task completes
└── pipeline-stop-guard.sh      — verify no skipped tasks, check expected key_outputs exist
```

Hooks read and write `docs/pm/pipeline.json` (project-level state). No orchestrator tokens are spent on state management — hooks handle it entirely.

---

## Pipeline File

`docs/pm/pipeline.json` — one file per project. Replaces both `pipeline.yaml` + `.pipeline-state.json` from v2.1.

**Template**: `~/.claude/skills/orchestration/templates/pipeline-v3-template.json`

**Structure**:
```json
{
  "constants": { ... },      // immutable once set: project name, epic, capabilities, token budgets
  "state": {                 // updated per task by hooks
    "current_iteration": 1,
    "integration_points": { ... },
    "teams": {
      "product":     { "budget_used": 0, "budget_total": 375000, "status": "active" },
      "design":      { "budget_used": 0, "budget_total": 375000, "status": "active" },
      "engineering": { "budget_used": 0, "budget_total": 375000, "status": "active" },
      "quality":     { "budget_used": 0, "budget_total": 375000, "status": "active" }
    },
    "tasks": { ... }
  }
}
```

Dependencies are declared in `constants.iterations.{N}.dependencies` per team. The `pipeline-pre-dispatch.sh` hook resolves dependencies and injects `key_outputs` from upstream tasks automatically. No manual artifact passing by the Orchestrator.

---

## Skills (in ~/.claude/skills/)

| Skill | Purpose |
|-------|---------|
| `orchestration` | v3 pipeline management: iteration dispatch, Integration Point facilitation, token budget tracking, pod brief, feedback loops, SAFe backlog management, memory search |
| `pm-discovery` | Product Lead-led discovery with researcher dispatch (parallel within Iteration 1) |
| `judgment-gates` | Severity gates + Integration Point sync gates + rework gates |
| `context-management` | Context scoping: pod brief (≤3K tokens), sync resolutions, consumed artifacts, token budget |
| `why-reinvent` | Before building custom: evaluate existing solutions, recommend adopt or build |
| `static-analysis` | TypeScript, linting, coverage gate (P1 on type errors or coverage < 80%) |
| `security-scan` | npm audit + secret scanning + OWASP Top 10 review |
| `browser-testing` | SDLC context for Iteration 3 browser-test work; uses agent-browser plugin |
| `scaffolding` | Project type templates and generation engine |
| `knowledge-compounding` | Cross-project memory: extract learnings/patterns/heuristics at IP Iteration end, search memory at PI Planning |

---

## Agents (in ~/.claude/agents/)

### Department Leads (opus)
| Agent | Role |
|-------|------|
| `founder` | Final decision maker. Reads all Lead sync briefs + responses. Synthesizes trade-offs. Returns `proceed` or `rework`. |
| `product-lead` | Orchestrates Product team. Enforces PM artifact quality. Resistance authority. |
| `engineering-lead` | Orchestrates Engineering team. Enforces TDD + design compliance. "Why reinvent" check. |
| `design-lead` | Orchestrates Design team. Enforces design system + accessibility. Mockup approval. |
| `quality-lead` | Orchestrates Quality team. Synthesizes all quality signals. Ship/no-ship authority. |

### Product Team (sonnet)
| Agent | Role |
|-------|------|
| `domain-researcher` | Regulations, terminology, analogous products, domain traps |
| `market-researcher` | Competitors, community signals (Reddit/HN/Twitter), pricing models, trends |
| `ux-researcher` | User journeys: first open, day 1, day 7, day 30 — with emotions + friction |
| `onboarding-designer` | First-run flow, progressive disclosure, empty states, activation metrics, retention triggers |
| `artifact-generator` | Full PM artifact suite: personas, journeys, stories, PRD, spec |

### Design Team (sonnet)
| Agent | Role |
|-------|------|
| `visual-designer` | HTML mockups using frontend-design plugin. Mobile-first (375px). Empty states required. |

### Engineering Team (sonnet)
| Agent | Role |
|-------|------|
| `ux-reviewer` | Post-implementation: browser screenshots vs. design mockups. WCAG check. |

### Quality Team
| Agent | Role |
|-------|------|
| `verifier` (sonnet) | Anti-rationalization checker. Depth check for generic phrases. TDD verification. |
| `browser-tester` (sonnet) | Smoke, mobile (375px), E2E, accessibility |
| `security-reviewer` (sonnet) | OWASP Top 10 source code analysis |
| `release-readiness-reviewer` (opus) | PM spec coverage, onboarding verification, cross-cutting concerns, feedback loop authority |

### Staff
| Agent | Role |
|-------|------|
| `orchestrator` (opus) | Pipeline conductor. Pod brief. Integration Point facilitation. Feedback loops. |
| `humanizer` (sonnet) | Strips AI verbal tics from human-facing output |

---

## Shared Memory: Pod Brief

`docs/pm/.pod-brief.md` — read by every agent in every iteration. Maintained by Orchestrator.

**Contents**: project vision, key decisions (running log), domain context, design principles, technical constraints, open questions, feedback log.

**Token cap**: 3,000 tokens. Orchestrator summarizes when it grows.

---

## Feedback Loops

Late-iteration findings can send work back to earlier iterations:
- Max 2 cycles between any iteration pair before Founder escalation
- Feedback written to `docs/pm/feedback/YYYY-MM-DD-<from>-to-<target>.md`
- Orchestrator re-dispatches target iteration Lead with feedback in context

---

## Templates (in ~/.claude/skills/orchestration/templates/)

| File | Purpose |
|------|---------|
| `pipeline-v3-template.json` | v3 pipeline config (constants + state, token budgets, iterations, key_outputs) |
| `backlog-template.md` | SAFe backlog template (Epic → Capability → Feature → Story hierarchy) |
| `pod-brief-template.md` | Pod brief initialization template |
| `product-standards.md` | Product dept non-negotiables |
| `engineering-standards.md` | Engineering dept non-negotiables |
| `design-standards.md` | Design dept non-negotiables |
| `quality-standards.md` | Quality dept non-negotiables |
| `sync-brief-template.md` | Lead sync brief format |
| `sync-response-template.md` | Lead cross-pollination response format |
| `integration-point-protocol.md` | Integration Point sync protocol reference |

---

## External Plugins (in ~/.agents/skills/)

- `agent-browser` (vercel-labs) — Headless browser CLI; primary tool for UX Reviewer + Browser Tester
  - Install: `npx skills add vercel-labs/agent-browser --yes --global`
  - Fallback: `npx playwright` (v1.58.2)
- `frontend-design` — Used by Visual Designer for high-quality HTML mockups

---

## AI Employee Framework

All agents operate within a shared behavioral framework defined in `~/.claude/CLAUDE.md` (global):

| Location | Content | Tokens |
|----------|---------|--------|
| `~/.claude/CLAUDE.md` → `## AI Employee Framework` | Vision, operating norms, constitutional principles, behavioral examples, decision hierarchy, authority boundaries | ~500 (loaded once per session) |
| Each agent's `## Identity` section | 1-2 line role-specific directive | ~40 per agent |

Token savings vs. original v2: ~7K tokens/run realistic. The 4 standalone foundation files and 18 agent `## Foundation` sections are replaced by a single global section + 1-line per-agent `## Identity`.

---

## Persistent Memory

Cross-project knowledge base in `~/.claude/memory/`:

```
~/.claude/memory/
├── index.md                  — searchable index (keyword-matched at PI Planning)
├── learnings/                — cross-project lessons from pipeline runs
├── patterns/                 — execution patterns that produced strong outcomes
└── heuristics/               — decision rules derived from multiple projects
```

**At PI Planning**: Orchestrator searches memory for relevant prior learnings → top 3 included in pod brief.
**At IP Iteration end**: `knowledge-compounding` skill extracts and stores new entries.

---

## SAFe Alignment

| SAFe Concept | v3 Implementation |
|---|---|
| Epic | Full product build — defined in `pipeline.json` `constants.epic` section |
| Capability | Cross-cutting concern — defined in `pipeline.json` `constants.capabilities` |
| Feature | Deliverable unit within an iteration — managed per Lead in team backlogs |
| Story | User stories from PM spec |
| PI (Program Increment) | One full pipeline run |
| Iteration | One of 3 timeboxed parallel-team iterations within the PI |
| Inspect & Adapt | Integration Point sync at each iteration boundary |
| PI Planning | All 4 Leads + Founder: PI Objectives, ROAM risks, program board, token budget allocation |
| System Demo | IP-2 (Engineering Lead) + IP-3 (Quality Lead) — browser demo of all Must Have stories |
| WSJF | Iteration 2 start — Product Lead scores features by Business Value × Time Criticality × Risk Reduction / Job Size |
| Iteration Planning | Each Lead writes iteration plan before iteration work starts |
| Retrospective | Each Lead writes retro + mini-learnings at IP Iteration |
| Feature Parallelism | Iteration 2 — enablers first, then up to 3 feature groups in parallel |
| Enabler Features | Each task tagged `type: enabler` or `type: business`; enablers ordered first |
| Program Board | Created at PI Planning; updated at each Integration Point by Orchestrator |
| Definition of Done | `docs/pm/definition-of-done.md` — Epic / Feature / Story checklists; checked by Leads in retro |
| IP Iteration | Analytics-driven optimization — retros + knowledge compounding + ship |

**Not applicable** (with rationale):
- Daily Standup: AI agents don't lose context — pod brief = state transfer
- Scrum of Scrums: One pipeline, not multiple ARTs — Integration Points cover this

SAFe metrics tracked in `pipeline.json` state under `safe_metrics`.

Backlogs at `docs/pm/backlog/`:
- `portfolio-backlog.md` + `program-backlog.md` → Product Lead
- `{dept}-team-backlog.md` → each Lead for their department

PI Planning artifacts at `docs/pm/pi-planning/`:
- `pi-objectives.md`, `roam-risks.md`, `iteration-goals.md`, `pi-resolution.md`

Iteration plans at `docs/pm/iteration-plans/iteration-{N}-plan.md`
Retrospectives at `docs/pm/retrospectives/iteration-{N}-retro.md`
System demos at `docs/pm/demos/iteration-{N}-demo.md`
IP Iteration Report at `docs/pm/ip-iteration/pi-001-optimization-report.md`

---

## OpenProject Integration (Optional)

OpenProject Community Edition (self-hosted, Docker Compose) is available as an optional human review layer. It is disabled by default in v3.

**Decision record**: `docs/pm/decisions/2026-02-21-pm-tool-selection.md`
**CLI**: `~/.claude/scripts/op` — verified end-to-end for all sync events
**Enable**: set `constants.integrations.openproject.enabled: true` in `pipeline.json`

When enabled, the Orchestrator syncs Integration Point resolutions to OpenProject work packages via the `op` CLI. SAFe types (Epic, Capability, Feature, User story, Task) and custom fields (Pod Brief Hash, Responsible Agent, Pipeline Iteration, Quality Level) are pre-configured.

---

## Design Philosophy

1. **Judgment before tools** — severity gates + Integration Point syncs surface decisions that matter
2. **Research before ask** — exhaust automated research before asking the human
3. **Verify before trust** — anti-rationalization verification at every stage
4. **Amplification not replacement** — the human validates at Integration Points; agents produce, not replace
5. **Don't reinvent** — `why-reinvent` skill applied at every architecture decision; use what exists
6. **Leads resist** — department Leads are authorized and required to push back on mediocre work
7. **Context as dictionary** — filesystem artifacts are shared state; no growing chat logs
8. **AI-native identity** — agents leverage AI strengths; no mimicking human limitations or hedging when data is available
9. **Compound intelligence** — every pipeline run makes the next one smarter via structured memory

---

## Version Governance

Every file with pipeline-specific instructions is tagged:

```
<!-- pipeline:v3 -->
...pipeline-specific content...
<!-- /pipeline:v3 -->
```

Search for all v3-aware files:
```bash
grep -r "pipeline:v3" ~/.claude/
```

Canonical reference for the full v3 architecture specification:
`docs/pm/references/pipeline-v3-architecture.md`

Prior versions archived at:
- v2.1: `docs/pm/references/archive/pipeline-v2.1-architecture.md`
- v1: `docs/pm/references/archive/pipeline-v1-architecture.md`

---

## v2.1 → v3 Comparison

| Aspect | v2.1 (sequential phases) | v3 (parallel iterations) |
|--------|--------------------------|--------------------------|
| Execution | 6 sequential phases | 3 iterations + IP Iteration; all teams parallel within each |
| Timebox | No | Token budget per team per iteration |
| Coordination | Converge-diverge protocol at phase end | Hook-automated state + Integration Points |
| State management | `pipeline.yaml` + `.pipeline-state.json` | Single `pipeline.json` (constants + state) |
| Dependency tracking | Phase produces/consumes lists | `key_outputs` in `pipeline.json`, injected by hooks |
| OpenProject | Optional but on-by-default | Disabled by default; opt-in via `pipeline.json` |
| Idle time | Teams wait for sequential phases to complete | Teams run concurrently; no idle between phases |
| Hook automation | None | 6 hooks handle state, budget, unblocking, guard |
| Integration Point trigger | Manual phase gate | Dual-trigger: artifacts exist OR budgets exhausted |

---

## Tested Against

- CatHabits MVP v1: 38 tests, 100% passing — v1 pipeline run (2026-02-20)
- CatHabits MVP v2: 289 tests, 91.66% coverage, 16 decision records, 5 syncs — v2.1 pipeline run (2026-02-20)
- v2.1 OpenProject integration: Docker live, CLI verified, SAFe types + custom fields configured, full 6-event sync validated (2026-02-22)
- v3: Pending — Sudoku MVP test run (parallel iteration validation, token budget enforcement, dual-trigger Integration Points)
<!-- /pipeline:v3 -->
