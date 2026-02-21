# Superpowers — SDLC Orchestration Fork (Pod-Based v2.1)

## SDLC Orchestration Extension

This fork adds a pod-based SDLC orchestration system on top of Superpowers. The v2.1 update extends the v2 pod-based pipeline with: an AI Employee Framework (consolidated into global `~/.claude/CLAUDE.md`), SAFe-aligned backlog management, persistent cross-project memory, and a PM tool selection decision (OpenProject). The v2.1 optimization consolidates the Foundation Layer from 4 standalone files + 18 agent sections into a single ~500-token `## AI Employee Framework` section in the global CLAUDE.md — reducing per-pipeline token cost by ~7K tokens/run and eliminating the worst-case 168K token risk.

### Added Commands
- `/orchestrate` — Run the full pod-based SDLC pipeline (Product Discovery → Design → Architecture → Implementation → Quality → Ship)
- `/yolo-orchestrate` — Fully autonomous pipeline run (Founder makes decisions autonomously, logs all findings)
- `/scaffold` — Generate project scaffolding from YAML templates
- `/pm-discover` — Standalone PM discovery (Product Lead conducts discovery + researcher dispatch)

---

## Organizational Structure

```
FOUNDER (opus) ← final decision maker, cross-dept sync via converge-diverge, rework authority
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
    ├── Orchestrator (opus)            — pipeline conductor, pod brief, sync facilitation
    └── Humanizer (sonnet)             — strips AI patterns from human-facing output
```

---

## Pipeline: 6 Phases

```
Phase 1: PRODUCT DISCOVERY
  Product Lead dispatches (converge-diverge internally):
  ├── [DIVERGE] Domain Researcher + Market Researcher (parallel)
  ├── [CONVERGE] Product Lead synthesizes → product-lead-synthesis.md
  ├── [DIVERGE] UX Researcher + Onboarding Designer (parallel)
  ├── [CONVERGE] Product Lead synthesizes → final-product-brief.md
  └── Artifact Generator → 6 PM artifacts
  ★ SYNC: Product + Design + Engineering + Quality Leads → Founder resolves

Phase 2: DESIGN
  Design Lead dispatches:
  ├── Creates design system (colors/WCAG, typography, spacing, components, breakpoints)
  └── Visual Designer → HTML mockups (onboarding, core screen, empty states)
  ★ SYNC: Product + Design + Engineering Leads → Founder resolves

Phase 3: ARCHITECTURE
  Engineering Lead dispatches:
  ├── why-reinvent skill → technology evaluation
  ├── superpowers:brainstorming → design doc
  └── superpowers:writing-plans → TDD implementation plan
  ★ SYNC: Engineering + Design + Product Leads → Founder resolves

Phase 4: IMPLEMENTATION
  Engineering Lead dispatches:
  ├── superpowers:using-git-worktrees → environment setup
  ├── superpowers:subagent-driven-development → implementation (mockups in context)
  └── ux-reviewer → compare screenshots to mockups
  ★ SYNC: Engineering + Design Leads → Founder resolves

Phase 5: QUALITY
  Quality Lead dispatches (converge-diverge internally):
  ├── [DIVERGE] Static Analysis + Security Scan + Browser Test (parallel)
  ├── [CONVERGE] Quality Lead synthesizes → quality-synthesis.md
  └── Release Readiness Reviewer → holistic ship check
  ★ FINAL SYNC: Quality + Engineering + Product Leads → Founder makes ship/no-ship

Phase 6: SHIP
  superpowers:finishing-a-development-branch (gate: always)
```

---

## Converge-Diverge Sync Protocol

At each phase boundary, the Orchestrator facilitates a 4-step sync:

```
Step C1 — Converge-1 (Share State): All Leads write sync briefs in parallel
           → docs/sync/phase-N/briefs/<dept>-brief.md

Step C2 — Diverge-1 (Cross-Pollinate): All Leads read other briefs, write responses in parallel
           → docs/sync/phase-N/responses/<dept>-response.md
           [Skip if < 3 Leads OR pure execution phase]

Step C3 — Converge-2 (Founder Decides): Founder reads all briefs + responses, writes resolution
           → docs/sync/phase-N/resolution.md

Step C4 — Diverge-2 (Execute): Next phase runs with resolution in context
```

---

## Skills (in ~/.claude/skills/)

| Skill | Purpose |
|-------|---------|
| `orchestration` | Pod-based pipeline management, phase dispatch, converge-diverge sync, pod brief, feedback loops, SAFe backlog management, memory search |
| `pm-discovery` | Product Lead-led discovery with researcher dispatch (converge-diverge internally) |
| `judgment-gates` | Severity gates + converge-diverge sync gates + rework gates |
| `context-management` | Context scoping: pod brief (≤3K tokens), sync resolutions, consumed artifacts, token budget |
| `why-reinvent` | Before building custom: evaluate existing solutions, recommend adopt or build |
| `static-analysis` | TypeScript, linting, coverage gate (P1 on type errors or coverage < 80%) |
| `security-scan` | npm audit + secret scanning + OWASP Top 10 review |
| `browser-testing` | SDLC context for browser-test stage; uses agent-browser plugin |
| `scaffolding` | Project type templates and generation engine |
| `knowledge-compounding` | **NEW** — Cross-project memory: extract learnings/patterns/heuristics at pipeline end, search memory at pipeline start |

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
| `orchestrator` (opus) | Pipeline conductor. Pod brief. Converge-diverge facilitation. Feedback loops. |
| `humanizer` (sonnet) | Strips AI verbal tics from human-facing output |

---

## Shared Memory: Pod Brief

`docs/pm/.pod-brief.md` — read by every agent in every phase. Maintained by Orchestrator.

**Contents:** project vision, key decisions (running log), domain context, design principles, technical constraints, open questions, feedback log.

**Token cap:** 3,000 tokens. Orchestrator summarizes when it grows.

---

## Feedback Loops

Late-stage findings can send work back to earlier phases:
- Max 2 cycles between any phase pair before Founder escalation
- Feedback written to `docs/pm/feedback/YYYY-MM-DD-<from>-to-<target>.md`
- Orchestrator re-dispatches target phase Lead with feedback in context

---

## Templates (in ~/.claude/skills/orchestration/templates/)

| File | Purpose |
|------|---------|
| `pipeline-default.yaml` | 6-phase pod-based pipeline config with SAFe fields (epic, capabilities, backlogs, pi, iterations) |
| `backlog-template.md` | **NEW** — SAFe backlog template (Epic → Capability → Feature → Story hierarchy) |
| `pod-brief-template.md` | Pod brief initialization template |
| `product-standards.md` | Product dept non-negotiables |
| `engineering-standards.md` | Engineering dept non-negotiables |
| `design-standards.md` | Design dept non-negotiables |
| `quality-standards.md` | Quality dept non-negotiables |
| `sync-brief-template.md` | Lead sync brief format |
| `sync-response-template.md` | Lead cross-pollination response format |
| `converge-diverge-protocol.md` | Generic converge-diverge protocol reference |

---

## External Plugins (in ~/.agents/skills/)

- `agent-browser` (vercel-labs) — Headless browser CLI; primary tool for UX Reviewer + Browser Tester
  - Install: `npx skills add vercel-labs/agent-browser --yes --global`
  - Fallback: `npx playwright` (v1.58.2)
- `frontend-design` — Used by Visual Designer for high-quality HTML mockups

---

## AI Employee Framework (Consolidated in v2.1 Optimization)

All agents operate within a shared behavioral framework defined in `~/.claude/CLAUDE.md` (global):

| Location | Content | Tokens |
|----------|---------|--------|
| `~/.claude/CLAUDE.md` → `## AI Employee Framework` | Vision, operating norms, constitutional principles, behavioral examples, decision hierarchy, authority boundaries | ~500 (loaded once per session) |
| Each agent's `## Identity` section | 1-2 line role-specific directive | ~40 per agent |
| `~/.claude/foundation/archive/` | Original 4 foundation files archived (vision, mission, constitution, characteristics) | not loaded |

**Architecture change from original v2.1**: The 4 standalone foundation files and 18 agent `## Foundation` sections (4 bullets each) are replaced by a single global section + 1-line per-agent `## Identity`. Token savings: ~7K tokens/run realistic, ~168K worst-case risk eliminated.

---

## Persistent Memory (NEW in v2.1)

Cross-project knowledge base in `~/.claude/memory/`:

```
~/.claude/memory/
├── index.md                  — searchable index (keyword-matched at pipeline start)
├── learnings/                — cross-project lessons from pipeline runs
├── patterns/                 — execution patterns that produced strong outcomes
└── heuristics/               — decision rules derived from multiple projects
```

**At pipeline start**: Orchestrator searches memory for relevant prior learnings → top 3 included in pod brief.
**At pipeline end**: `knowledge-compounding` skill extracts and stores new entries.

---

## SAFe Alignment (NEW in v2.1)

| SAFe Concept | Our Implementation |
|---|---|
| Epic | Full product build — defined in `pipeline.yaml` `epic` section |
| Capability | Cross-cutting concern — defined in `pipeline.yaml` `capabilities` section |
| Feature | Deliverable unit within a phase — managed per Lead in team backlogs |
| Story | User stories from PM spec |
| PI (Program Increment) | One full pipeline run |
| Iteration | One phase within the PI |
| Inspect & Adapt | Converge-diverge sync at each phase boundary |

Backlogs created at `docs/pm/backlog/`:
- `portfolio-backlog.md` + `program-backlog.md` → Product Lead
- `{dept}-team-backlog.md` → each Lead for their department

---

## PM Tool Decision (NEW in v2.1)

**Selected**: OpenProject Community Edition (self-hosted, Docker Compose)
**Decision record**: `docs/pm/decisions/2026-02-21-pm-tool-selection.md`
**Why**: SAFe 4-level hierarchy, OpenAPI 3.1 REST API, active maintenance (v17.1.1 Feb 2026), Rails Engine plugin system for AI context fields
**Status**: Decided — integration implementation (Phase 5 of feedback plan) pending

---

## Design Philosophy

1. **Judgment before tools** — severity gates + converge-diverge syncs surface decisions that matter
2. **Research before ask** — exhaust automated research before asking the human
3. **Verify before trust** — anti-rationalization verification at every stage
4. **Amplification not replacement** — the human validates at gates; agents produce, not replace
5. **Don't reinvent** — `why-reinvent` skill applied at every architecture decision; use what exists
6. **Leads resist** — department Leads are authorized and required to push back on mediocre work
7. **Context as dictionary** — filesystem artifacts are shared state; no growing chat logs
8. **AI-native identity** — agents leverage AI strengths; no mimicking human limitations or hedging when data is available
9. **Compound intelligence** — every pipeline run makes the next one smarter via structured memory

---

## v1 → v2 Comparison

| Aspect | v1 (sequential) | v2 (pod-based) |
|--------|-----------------|----------------|
| Structure | 10 sequential stages | 6 phases with parallel stages + feedback loops |
| Quality control | Verifier classifies P1/P2/P3 | Leads enforce standards + Founder decides at sync |
| Communication | One-way artifact passing | Structured handoffs + converge-diverge sync sessions |
| Decision making | Verifier flags, user approves | Leads present trade-offs, Founder synthesizes |
| PM depth | Generic artifact generation | Domain + UX + onboarding research before artifacts |
| Design | None | Full design phase with HTML mockups before any code |
| Feedback loops | None | Max 2 cycles between any two phases |
| Shared context | Scoped consumes/produces | Pod brief (3K cap) + sync resolutions + artifacts |
| Resistance | Nobody pushes back | Leads resist; Founder rejects mediocre work |
| "Why reinvent" | Not systematic | Applied at every architecture decision |

---

## Tested Against

- CatHabits MVP (React + TypeScript + Vite — mobile-first web app)
- v1 full autonomous pipeline run: 2026-02-20
- v1 results: 38 tests, 100% passing, 3 real bugs caught
- v1 learnings: `docs/pm/learnings/process/2026-02-20-enhanced-sdlc-pipeline-first-run.md`
- v2 first run: pending (CatHabits v2 — 289 tests, 91.66% coverage, 16 decision records, 5 syncs)
- v2.1 (this update): AI Employee Foundation Layer, SAFe backlogs, persistent memory, PM tool decision; Foundation Layer consolidated into global CLAUDE.md (optimization)
