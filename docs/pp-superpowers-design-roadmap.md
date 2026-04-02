# pp-superpowers — Design Roadmap

**Version:** 1.0
**Date:** March 28, 2026
**Author:** SDFX Studios
**Status:** Approved for detailed design
**Parent document:** Plugin Suite Design Roadmap v1.0

---

## 1. Executive Summary

pp-superpowers is the core plugin of the Power Platform Claude Code Plugin Suite. It owns the full Power Platform development lifecycle — from initial requirements discovery through schema design, UI implementation, business logic, integration, security, and deployment.

The plugin is a literal fork of `obra/superpowers`, preserving the proven infrastructure (plugin manifest, hook system, command dispatch, agent/subagent patterns, git worktree workflow) while replacing all skill content with Power Platform-specific mandatory workflows.

pp-superpowers contains 10 main skills organized into 4 lifecycle groups. Three skills use the sub-skill routing pattern for domains where workflows genuinely diverge by type, producing 13 sub-skills. Seven skills are single-workflow skills with internal branching for artifact variations.

**Lifecycle groups:**

| Group | When first needed | Skills |
|---|---|---|
| Discover | Before you build anything | solution-discovery, solution-strategy |
| Design | Before you write code | application-design, schema-design, ui-design, security |
| Build | When you implement | business-logic, integration |
| Continuous | Throughout the project | alm-workflow, environment-setup |

Groups indicate dependency order — when skills are first needed in a project. Execution is iterative, not waterfall. A developer will revisit Design skills after Build activities reveal new requirements, and Continuous skills run from day one alongside everything else.

**Key architectural decisions:**
- Solution-discovery produces a modular foundation document directory (`.foundation/`), with each section file designed to serve a specific downstream skill
- Skills save incremental progress and can resume across sessions
- Downstream handoff is suggestive — the completing skill recommends the next skill and waits for developer confirmation
- Web resources are absorbed into their domain owners: PCF controls into ui-design, JS form scripts into business-logic, HTML/CSS into ui-design
- Business logic encompasses all logic implementation types: C# plugins, Power Automate flows, business rules, and client-side scripts

---

## 2. Repository Structure

The target file tree after forking `obra/superpowers` and applying all transformations.

```
pp-superpowers/
├── .claude-plugin/
│   ├── plugin.json                          ← modified manifest
│   └── marketplace.json                     ← marketplace listing
│
├── skills/
│   │
│   │── solution-discovery/
│   │   └── SKILL.md
│   │
│   │── solution-strategy/
│   │   └── SKILL.md
│   │
│   │── application-design/
│   │   └── SKILL.md
│   │
│   │── schema-design/
│   │   └── SKILL.md
│   │
│   │── ui-design/                           ← domain router
│   │   ├── SKILL.md                         ← routes by app type
│   │   ├── model-driven-app/
│   │   │   └── SKILL.md
│   │   ├── canvas-app/
│   │   │   └── SKILL.md
│   │   ├── pcf-control/
│   │   │   └── SKILL.md
│   │   ├── custom-page/
│   │   │   └── SKILL.md
│   │   └── modal-dialog/
│   │       └── SKILL.md
│   │
│   │── security/
│   │   └── SKILL.md
│   │
│   │── business-logic/                      ← domain router
│   │   ├── SKILL.md                         ← routes by logic type
│   │   ├── csharp-plugin/
│   │   │   └── SKILL.md
│   │   ├── power-automate/
│   │   │   └── SKILL.md
│   │   ├── business-rule/
│   │   │   └── SKILL.md
│   │   └── client-script/
│   │       └── SKILL.md
│   │
│   │── integration/                         ← domain router
│   │   ├── SKILL.md                         ← routes by integration type
│   │   ├── connectors/
│   │   │   └── SKILL.md
│   │   ├── dataflows/
│   │   │   └── SKILL.md
│   │   ├── virtual-tables/
│   │   │   └── SKILL.md
│   │   └── fabric/
│   │       └── SKILL.md
│   │
│   │── alm-workflow/
│   │   └── SKILL.md
│   │
│   └── environment-setup/
│       └── SKILL.md
│
├── agents/                                  ← subagent definitions
│   ├── schema-reviewer.md
│   ├── plugin-auditor.md
│   ├── ui-reviewer.md
│   ├── security-reviewer.md
│   ├── alm-reviewer.md
│   └── integration-reviewer.md
│
├── hooks/
│   └── session-start.sh                     ← writes .pp-context/project.json
│
├── commands/                                ← retained from Superpowers
│   └── (retained commands TBD during build)
│
├── docs/
│   └── skill-framework.md                   ← skill authoring guide
│
└── tests/
    └── (retained test infrastructure)
```

**Foundation document directory** (created per-project at project root):

```
.foundation/
├── .discovery-state.json                    ← incremental progress tracker
├── 00-project-identity.md                   ← project name, purpose, constraints
├── 01-requirements.md                       ← problem statement, scope, scale
├── 02-architecture-decisions.md             ← app types, technology choices
├── 03-entity-map.md                         ← high-level entity list + relationships
├── 04-solution-packaging.md                 ← solution strategy, dependencies
├── 05-ui-plan.md                            ← UI approach per entity/persona
├── 06-logic-map.md                          ← business rules, plugin triggers, flow triggers
├── 07-integration-map.md                    ← external systems, connectors, data movement
├── 08-security-profile.md                   ← personas, roles, FLS requirements
└── 09-constraints.md                        ← stack limits, licensing, timeline
```

---

## 3. Fork Transformation Plan

pp-superpowers is a literal fork of `obra/superpowers`. The fork strategy preserves infrastructure while replacing all domain content.

### 3.1 Keep from Superpowers

These components are proven and require no modification:

| Component | Path | Purpose |
|---|---|---|
| Plugin manifest structure | `.claude-plugin/plugin.json` | Plugin registration and marketplace listing |
| Marketplace registration | `.claude-plugin/marketplace.json` | Centralized discovery via pp-marketplace |
| Hook execution infrastructure | `hooks/` | Lifecycle hook dispatch (session-start, pre-tool, post-tool) |
| Command registration and dispatch | `commands/` | Slash command system |
| Agent/subagent creation pattern | `agents/` | Subagent dispatch with context injection |
| Two-stage review pattern | (within skills) | Spec compliance review → code quality review |
| Git worktree workflow | `skills/using-git-worktrees/` | Parallel development on isolated branches |
| Test infrastructure | `tests/` | Skill testing framework |

### 3.2 Replace from Superpowers

These components are removed and replaced with Power Platform equivalents:

| Superpowers component | Replaced by | Rationale |
|---|---|---|
| `skills/brainstorming/` | `skills/solution-discovery/` | Generic brainstorming → structured Power Platform discovery |
| `skills/writing-plans/` | Absorbed into each skill's workflow stages | Plan writing is not a standalone activity — each skill produces its own plan |
| `skills/executing-plans/` | Absorbed into each skill's execute stage | Execution is domain-specific, not generic |
| `skills/subagent-driven-development/` | Retained as pattern, applied per-skill | The pattern stays; the generic skill is replaced by domain-specific agent dispatch |
| `skills/test-driven-development/` | Adapted per-skill for Power Platform testing | C# plugin unit tests, solution checker, PCF test harness, flow test runs |
| `skills/systematic-debugging/` | Adapted per-skill for Power Platform debugging | Plugin trace logs, flow run history, browser dev tools for client scripts |
| `skills/requesting-code-review/` | Domain-specific review agents | Review criteria differ per artifact type |
| `skills/receiving-code-review/` | Retained as pattern | Feedback incorporation process is universal |
| `skills/verification-before-completion/` | Retained as pattern, adapted per-skill | Verification criteria are domain-specific |
| `skills/finishing-a-development-branch/` | Retained with ALM awareness | Branch completion includes solution export verification |
| `skills/dispatching-parallel-agents/` | Retained as infrastructure | Parallel agent dispatch is universal |
| `skills/using-superpowers/` | Replaced with pp-superpowers orientation | Introduction to the Power Platform skill system |
| `skills/writing-skills/` | Retained for skill authoring | Used when extending pp-superpowers with new skills |
| `agents/code-reviewer.md` | Domain-specific reviewer agents | One generic reviewer → multiple specialized reviewers |

### 3.3 Add to Superpowers

These components are new additions with no Superpowers equivalent:

| Addition | Purpose |
|---|---|
| 10 Power Platform skills (§7) | Domain-specific mandatory workflows |
| 13 sub-skills across 3 router skills | Type-specific workflows within domains |
| 6 domain-specific reviewer agents (§9) | Specialized review criteria per artifact type |
| `.foundation/` directory convention | Shared context produced by solution-discovery, consumed by all |
| `.pp-context/project.json` hook output | Inter-plugin coordination (suite roadmap §3.1) |
| Sub-skill routing pattern (§8) | Parent SKILL.md detects type and delegates |
| Incremental progress tracking | State machine enabling cross-session skill resumption |
| Downstream handoff mechanism | Skill completion suggests next skill with confirmation |

---

## 4. Session-Start Hook

pp-superpowers fires a session-start hook that writes project-level context to `.pp-context/project.json`. Other plugins in the suite read this file for situational awareness.

### 4.1 What the Hook Detects

The hook reads the project root for pp-superpowers-specific artifacts:

| Check | Source | Written to project.json |
|---|---|---|
| Foundation document exists? | `.foundation/` directory | `foundation.exists: true/false` |
| Discovery progress | `.foundation/.discovery-state.json` | `foundation.stage: "ARCHITECTURE"` |
| Foundation completeness | Presence of each section file | `foundation.sections: [list of completed sections]` |
| Active skill state | `.pp-context/skill-state.json` | `activeSkill: "schema-design"` |
| Last skill completed | `.pp-context/skill-state.json` | `lastCompleted: "application-design"` |
| Suggested next skill | `.pp-context/skill-state.json` | `suggestedNext: "schema-design"` |

### 4.2 project.json Schema

```json
{
  "plugin": "pp-superpowers",
  "timestamp": "2026-03-28T14:30:00Z",
  "foundation": {
    "exists": true,
    "stage": "COMPLETE",
    "sections": [
      "00-project-identity",
      "01-requirements",
      "02-architecture-decisions",
      "03-entity-map",
      "04-solution-packaging",
      "05-ui-plan",
      "06-logic-map",
      "07-integration-map",
      "08-security-profile",
      "09-constraints"
    ]
  },
  "workflow": {
    "activeSkill": null,
    "lastCompleted": "schema-design",
    "suggestedNext": "ui-design",
    "completedSkills": ["solution-discovery", "application-design", "schema-design"]
  }
}
```

### 4.3 How Other Plugins Use This

- **pp-memory** reads `workflow.activeSkill` to tag session observations with the current skill context
- **pp-meta** reads `foundation.exists` and `foundation.stage` to report suite health
- **pp-devenv** does not consume this file (it writes its own environment.json)
- **pp-docs** reads `foundation.sections` to know which design artifacts are available as source material
- **pp-research** reads `workflow.activeSkill` to scope documentation lookups to the relevant domain

---

## 5. Skill Framework

Every skill in pp-superpowers follows a consistent framework. This section defines the contract that each skill must satisfy, serving as both a design template for future detailed design sessions and a structural guarantee for inter-skill consistency.

### 5.1 Skill Definition Template

Each skill's SKILL.md must define:

```
SKILL DEFINITION
────────────────────────────────────────────────
Name:               [skill-name]
Domain:             [what this skill owns]
Lifecycle group:    [Discover | Design | Build | Continuous]
Has sub-skills:     [yes/no — if yes, this SKILL.md is a router]

PREREQUISITES
────────────────────────────────────────────────
Foundation sections required:
  - [list of .foundation/ files this skill reads]
Other prerequisites:
  - [e.g., "PAC CLI connected", "schema-design completed"]

TRIGGER CONDITIONS
────────────────────────────────────────────────
Activate when:
  - [natural language patterns that trigger this skill]
  - [project state conditions]

WORKFLOW STAGES
────────────────────────────────────────────────
Stage 1: [name]
  Gate: [what must be true before entering this stage]
  Action: [what happens in this stage]
  Output: [what this stage produces]
  
Stage 2: [name]
  ...

AGENTS DISPATCHED
────────────────────────────────────────────────
  - [agent-name]: [when dispatched, what it reviews]

OUTPUTS PRODUCED
────────────────────────────────────────────────
  - [file or artifact produced by this skill]

REVIEW CRITERIA
────────────────────────────────────────────────
  - [domain-specific quality gates]

DOWNSTREAM HANDOFF
────────────────────────────────────────────────
Suggests next: [skill-name]
Context passed: [what the next skill receives]
```

### 5.2 Mandatory Workflow Principles

These principles apply to every skill and cannot be overridden by individual SKILL.md files:

**Gating is enforced, not suggested.** If a stage's gate condition is not met, the skill must block progress and tell the developer what is missing. It does not proceed with assumptions.

**Foundation sections are read, never modified.** Skills consume foundation document sections as input context. The foundation directory is owned by solution-discovery. Any skill that discovers the foundation is outdated should flag the issue and suggest re-running solution-discovery to update the relevant section — not modify the file directly.

**Progress is saved.** Every skill writes its current stage to `.pp-context/skill-state.json` on stage transitions. If a session ends mid-skill, the next session can resume from the last completed stage.

**Completion suggests the next skill.** When a skill completes, it writes `suggestedNext` to the skill state and presents the suggestion to the developer. It does not auto-start the next skill.

**Review before close.** Every skill ends with a review stage. For skills that produce code or configuration, the two-stage review pattern applies (spec compliance first, then quality). For skills that produce design documents, a single review stage validates completeness and consistency.

### 5.3 Sub-Skill Routing Pattern

Three skills (ui-design, business-logic, integration) use a parent SKILL.md that acts as a router. The router does not contain workflow stages itself — it detects the type of work needed and delegates to the appropriate sub-skill.

Routing logic:
1. Read the relevant foundation document section(s) to understand what type of artifact is needed
2. If unambiguous, delegate directly to the sub-skill
3. If ambiguous, ask the developer to confirm the type
4. Pass full context (foundation sections, environment state, session memory) to the sub-skill

Sub-skills follow the same framework template as main skills. They have their own stages, gates, agents, outputs, and review criteria. The only difference is that they are invoked by a parent router rather than triggered directly.

**Two levels maximum.** Sub-skills do not have sub-sub-skills. Variations within a sub-skill (e.g., forms vs. views within model-driven-app) are handled as conditional branches within the workflow stages, not as additional nesting levels.

### 5.4 Incremental Progress Tracking

Skills save progress via `.pp-context/skill-state.json`:

```json
{
  "activeSkill": "schema-design",
  "activeStage": "LOGICAL_MODEL",
  "stageHistory": [
    { "stage": "CONCEPTUAL_MODEL", "completedAt": "2026-03-28T10:00:00Z" },
    { "stage": "LOGICAL_MODEL", "startedAt": "2026-03-28T10:30:00Z" }
  ],
  "lastCompleted": "application-design",
  "suggestedNext": null,
  "completedSkills": ["solution-discovery", "application-design"],
  "artifacts": [
    { "skill": "application-design", "file": "docs/ddd-model.md", "createdAt": "2026-03-28T09:45:00Z" }
  ]
}
```

On session start, pp-superpowers reads this file and presents the developer with their current position:

> "You're in schema-design, stage: logical model. Your conceptual model is complete. Want to continue from where you left off, or start a different skill?"

---

## 6. Solution-Discovery — Full Specification

Solution-discovery is skill #0, the front door of pp-superpowers. It handles the scenario "I have requirements but no design" and produces the foundation document directory that every downstream skill consumes.

### 6.1 State Machine

Solution-discovery uses a 10-stage state machine. Each stage maps to a foundation document section file. Progress is saved after each stage transition, enabling the skill to resume across sessions.

```
INIT → PROJECT_IDENTITY → REQUIREMENTS → ARCHITECTURE → ENTITY_MAP →
SOLUTION_PACKAGING → UI_PLAN → LOGIC_MAP → INTEGRATION_MAP →
SECURITY_PROFILE → CONSTRAINTS → REVIEW → COMPLETE
```

| Stage | Foundation section written | Can skip? | Skip condition |
|---|---|---|---|
| INIT | (none — reads existing state) | No | — |
| PROJECT_IDENTITY | `00-project-identity.md` | No | Always required |
| REQUIREMENTS | `01-requirements.md` | No | Always required |
| ARCHITECTURE | `02-architecture-decisions.md` | No | Always required |
| ENTITY_MAP | `03-entity-map.md` | No | Always required |
| SOLUTION_PACKAGING | `04-solution-packaging.md` | Yes | If single-solution, defaults are sufficient |
| UI_PLAN | `05-ui-plan.md` | Yes | If developer will define UI during ui-design |
| LOGIC_MAP | `06-logic-map.md` | Yes | If no server/client logic is known yet |
| INTEGRATION_MAP | `07-integration-map.md` | Yes | If no external integrations exist |
| SECURITY_PROFILE | `08-security-profile.md` | Yes | If single-user or security is undefined |
| CONSTRAINTS | `09-constraints.md` | No | Always required |
| REVIEW | (validates all sections) | No | Always required |
| COMPLETE | Updates `.discovery-state.json` | No | — |

**Skip logic:** Stages marked "Can skip" are offered to the developer with context-appropriate defaults. Skipping writes a minimal placeholder file that downstream skills can detect as incomplete. When a downstream skill encounters a placeholder, it prompts the developer to either fill in the section or proceed with assumptions documented explicitly.

### 6.2 Conversation Flow and Gating Logic

Solution-discovery conducts a structured conversation across its stages. The conversation is divided into rounds to avoid overwhelming the developer with questions.

#### Stage: PROJECT_IDENTITY

**Round 1 — Who and what:**

> 1. What is the name of this project or solution?
> 2. What does it do in one sentence?
> 3. Who is the primary audience? (Internal team, external customers, mixed)

**Gate to proceed:** All three questions answered. Write `00-project-identity.md`.

#### Stage: REQUIREMENTS

**Round 2 — The problem and scope:**

> 4. What problem does this solution solve? (Describe the pain point it addresses.)
> 5. How does it solve that problem? (The purpose — what the solution enables.)
> 6. What is the scope? (What is explicitly included and excluded.)
> 7. What is the expected scale? (Number of users, data volume, geographic distribution.)

**Gate to proceed:** Problem, purpose, and scope are defined. Scale can be approximate. Write `01-requirements.md`.

#### Stage: ARCHITECTURE

**Round 3 — Technology decisions:**

Before presenting options, invoke pp-research (if available) to pull current Microsoft Learn guidance for the domains described in requirements.

> 8. Based on your requirements, here is my recommended architecture: [present recommendation with rationale]. Does this match your thinking, or do you see it differently?
> 9. What app type(s) does this need? (Model-Driven, Canvas, both, Code App, Custom Pages — present recommendation based on requirements.)
> 10. Are there existing systems this must integrate with? (ERP, CRM, external APIs, file shares.)
> 11. Are there known technology constraints? (Licensing tier, specific connectors required, on-premises requirements.)

**Gate to proceed:** App type decision is confirmed. Integration points are listed (even if empty). Write `02-architecture-decisions.md`.

#### Stage: ENTITY_MAP

**Round 4 — What data exists:**

> 12. Based on the requirements, here are the entities I see in your domain: [present initial entity list derived from requirements and architecture decisions]. What would you add, remove, or rename?
> 13. For each entity, what are the key relationships? (Parent-child, many-to-many, lookups.)
> 14. Are any of these entities already in Dataverse as system tables, Dynamics 365 tables, or third-party tables?

**Gate to proceed:** Entity list is confirmed by the developer. Relationships are documented at a high level (not column-level — that is schema-design's job). Write `03-entity-map.md`.

#### Stage: SOLUTION_PACKAGING

**Round 5 — How it ships (skippable):**

> 15. Will this be a single solution or multiple solutions? (If multiple: what are the solution domains and their dependencies?)
> 16. Managed or unmanaged in target environments?
> 17. Are there environment-specific variables (connection references, environment variables)?

**Default if skipped:** Single solution, managed in production, no environment variables. Write `04-solution-packaging.md` with defaults noted.

#### Stage: UI_PLAN

**Round 6 — How users interact (skippable):**

> 18. For each user persona, what entities do they primarily interact with?
> 19. What app type serves each persona? (May differ — sales team on Model-Driven, field workers on Canvas.)
> 20. Are there known UI requirements? (Dashboards, specific form layouts, embedded analytics, offline access.)

**Default if skipped:** Placeholder noting UI plan deferred to ui-design skill. Write `05-ui-plan.md`.

#### Stage: LOGIC_MAP

**Round 7 — Where logic lives (skippable):**

> 21. What business rules need to be enforced? (Validation, calculations, state transitions, approval workflows.)
> 22. For each rule, is it server-side (C# plugin, Power Automate) or client-side (business rule, JS form script)?
> 23. Are there automated processes that run on schedules or triggers?

**Default if skipped:** Placeholder noting logic map deferred to business-logic skill. Write `06-logic-map.md`.

#### Stage: INTEGRATION_MAP

**Round 8 — How data moves (skippable):**

> 24. For each external system identified in architecture decisions, how does data flow? (Real-time sync, batch import, on-demand lookup, event-driven.)
> 25. Are there existing connectors for these systems, or will custom connectors be needed?
> 26. Is there a data warehouse, lake, or Fabric environment in scope?

**Default if skipped:** Placeholder noting integration map deferred to integration skill. Write `07-integration-map.md`.

#### Stage: SECURITY_PROFILE

**Round 9 — Who can do what (skippable):**

> 27. What are the distinct user roles or personas?
> 28. For each role, what is the general access level? (Full access, read-only, scoped to own records, scoped to business unit.)
> 29. Are there fields that must be restricted by role? (Salary, SSN, financial data.)

**Default if skipped:** Placeholder noting security profile deferred to security skill. Write `08-security-profile.md`.

#### Stage: CONSTRAINTS

**Round 10 — Hard limits:**

> 30. What are the non-negotiable constraints? (Timeline, budget, licensing tier, compliance requirements, existing infrastructure that cannot change.)
> 31. Are there performance requirements? (Response time, concurrent users, data volume limits.)
> 32. Are there known risks or open questions that need resolution before building?

**Gate to proceed:** At least one constraint documented. Write `09-constraints.md`.

#### Stage: REVIEW

Present a summary of the complete foundation directory. For each section, show a one-paragraph summary and ask the developer to confirm or request changes.

If changes are requested, return to the relevant stage, update the section file, and return to REVIEW.

**Gate to COMPLETE:** Developer confirms the full foundation is accurate.

#### Stage: COMPLETE

- Update `.discovery-state.json` to `"stage": "COMPLETE"`
- Write all completed sections to `.pp-context/skill-state.json`
- Suggest the next skill based on what the foundation reveals:
  - If solution-strategy decisions are complex → suggest `solution-strategy`
  - If the entity map is rich → suggest `application-design`
  - Default suggestion: `application-design` (DDD comes before schema)

### 6.3 Foundation Document Directory Specification

The foundation directory is designed backwards — each section exists because a specific downstream skill needs it as input. This section documents the contract.

#### 00-project-identity.md

**Written by:** solution-discovery (PROJECT_IDENTITY stage)
**Consumed by:** All skills (for context), pp-docs (for brand voice), pp-memory (for observation tagging)

```markdown
# Project Identity

**Project name:** [name]
**Solution prefix:** [publisher prefix, e.g., sdfx_]
**One-line description:** [what it does]
**Primary audience:** [internal | external | mixed]
**Project type:** [greenfield | extension of existing | migration]
```

#### 01-requirements.md

**Written by:** solution-discovery (REQUIREMENTS stage)
**Consumed by:** application-design (DDD source), schema-design (domain understanding), all skills (scope reference)

```markdown
# Requirements

## Problem statement
[What pain point this solution addresses]

## Purpose
[How the solution solves the problem]

## Scope
### In scope
- [explicit list]

### Out of scope
- [explicit list]

## Scale
- Expected users: [number or range]
- Expected data volume: [records, growth rate]
- Geographic distribution: [single region | multi-region | global]
```

#### 02-architecture-decisions.md

**Written by:** solution-discovery (ARCHITECTURE stage)
**Consumed by:** ui-design (app type selection), business-logic (technology choices), integration (external system list), schema-design (platform constraints)

```markdown
# Architecture Decisions

## App type
- Primary: [Model-Driven | Canvas | Both | Code App | Custom Pages]
- Rationale: [why this app type fits the requirements]

## Technology stack
- [list of platform components in use]

## Integration points
| External system | Direction | Method | Priority |
|---|---|---|---|
| [system name] | [inbound | outbound | bidirectional] | [connector | API | dataflow] | [required | nice-to-have] |

## Key decisions
| # | Decision | Rationale | Alternatives considered |
|---|---|---|---|
| 1 | [decision] | [why] | [what else was evaluated] |
```

#### 03-entity-map.md

**Written by:** solution-discovery (ENTITY_MAP stage)
**Consumed by:** application-design (DDD domain objects), schema-design (table design source), ui-design (form planning), security (entity-level access)

```markdown
# Entity Map

## Entities
| Entity | Type | Description | Key relationships |
|---|---|---|---|
| [name] | [new | existing-system | existing-D365] | [what it represents] | [related entities] |

## Relationship summary
- [Entity A] → [Entity B]: [relationship type, e.g., 1:N parent-child]
- ...

## Notes
- [any entity-level observations from discovery]
```

#### 04-solution-packaging.md

**Written by:** solution-discovery (SOLUTION_PACKAGING stage)
**Consumed by:** solution-strategy (detailed packaging design), alm-workflow (export/deploy procedures)

```markdown
# Solution Packaging

## Architecture
- Type: [single solution | multi-solution]
- Solutions: [list if multi-solution, with dependencies]

## Deployment model
- Target: [managed | unmanaged | mixed by environment]
- Environments: [dev | test | UAT | production — list active environments]

## Environment variables
| Variable | Purpose | Varies by environment? |
|---|---|---|
| [name] | [what it configures] | [yes | no] |

## Connection references
| Connection | Connector | Purpose |
|---|---|---|
| [name] | [connector type] | [what it connects to] |
```

#### 05-ui-plan.md

**Written by:** solution-discovery (UI_PLAN stage)
**Consumed by:** ui-design (design plan per app type and persona)

```markdown
# UI Plan

## Persona-to-app mapping
| Persona | App type | Primary entities | Key screens/forms |
|---|---|---|---|
| [role] | [MDA | Canvas | Custom Page] | [entities they interact with] | [known UI needs] |

## UI requirements
- [dashboards, embedded analytics, offline, specific layout needs]

## Status
- [COMPLETE | PLACEHOLDER — deferred to ui-design]
```

#### 06-logic-map.md

**Written by:** solution-discovery (LOGIC_MAP stage)
**Consumed by:** business-logic (implementation planning per logic type)

```markdown
# Logic Map

## Business rules
| Rule | Trigger | Type | Location |
|---|---|---|---|
| [description] | [on create | on update | on demand] | [validation | calculation | state transition | automation] | [server | client | both] |

## Automated processes
| Process | Trigger | Technology | Description |
|---|---|---|---|
| [name] | [schedule | event | manual] | [Power Automate | C# plugin | workflow] | [what it does] |

## Status
- [COMPLETE | PLACEHOLDER — deferred to business-logic]
```

#### 07-integration-map.md

**Written by:** solution-discovery (INTEGRATION_MAP stage)
**Consumed by:** integration (connector/dataflow/virtual table planning)

```markdown
# Integration Map

## Data flows
| Source | Destination | Direction | Frequency | Method |
|---|---|---|---|---|
| [system] | [system] | [in | out | bi] | [real-time | batch | on-demand] | [connector | API | dataflow | virtual table] |

## Connectors
| Connector | Type | Auth method | Status |
|---|---|---|---|
| [name] | [standard | premium | custom] | [OAuth | API key | service principal] | [exists | needs creation] |

## Fabric / Data warehouse
- [scope and status of any data platform integration]

## Status
- [COMPLETE | PLACEHOLDER — deferred to integration]
```

#### 08-security-profile.md

**Written by:** solution-discovery (SECURITY_PROFILE stage)
**Consumed by:** security (role design, FLS planning)

```markdown
# Security Profile

## Roles
| Role | Access level | Entity scope | Notes |
|---|---|---|---|
| [role name] | [full | read | scoped-own | scoped-BU] | [which entities] | [special restrictions] |

## Field-level security
| Entity | Field(s) | Restricted to |
|---|---|---|
| [entity] | [field list] | [role(s) with access] |

## Status
- [COMPLETE | PLACEHOLDER — deferred to security]
```

#### 09-constraints.md

**Written by:** solution-discovery (CONSTRAINTS stage)
**Consumed by:** All skills (hard limits reference)

```markdown
# Constraints

## Non-negotiable
- [timeline, budget, licensing, compliance, infrastructure]

## Performance requirements
- [response time, concurrent users, data volume]

## Open questions
- [unresolved decisions that need answers before or during build]

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| [description] | [high | medium | low] | [planned response] |
```

### 6.4 Downstream Handoff Mechanism

When solution-discovery completes (or when any skill completes), it executes the following handoff sequence:

1. **Write completion state** to `.pp-context/skill-state.json`:
   ```json
   {
     "activeSkill": null,
     "lastCompleted": "solution-discovery",
     "suggestedNext": "application-design",
     "completedSkills": ["solution-discovery"]
   }
   ```

2. **Present the suggestion** to the developer:
   > "Solution discovery is complete. Your foundation directory is ready at `.foundation/`.
   >
   > Based on your foundation, I'd suggest moving to **application-design** next — your entity map has [N] entities that would benefit from Domain Driven Design modeling before schema work begins.
   >
   > Other options available:
   > - **solution-strategy** — if you want to finalize multi-solution packaging first
   > - **schema-design** — if you'd prefer to jump straight to data modeling
   > - **Any other skill** — the foundation supports all downstream skills
   >
   > What would you like to work on next?"

3. **Wait for explicit confirmation.** Do not auto-start the next skill.

The suggestion logic follows these rules:
- If entity map has 5+ entities → suggest `application-design` (DDD will help manage complexity)
- If solution packaging is multi-solution → suggest `solution-strategy` (resolve dependencies first)
- If the developer has expressed urgency about a specific area → suggest that skill
- Default → `application-design`

### 6.5 Agents Within Solution-Discovery

Solution-discovery dispatches one agent during the ARCHITECTURE stage:

**architecture-advisor agent:**
- **When dispatched:** After the developer describes their requirements, before presenting architecture recommendations
- **What it receives:** Requirements summary, known integration points, scale expectations
- **What it does:** Researches current Microsoft Learn guidance via pp-research (if available), evaluates app type options against requirements, identifies platform limitations or licensing considerations
- **What it returns:** Recommended architecture with rationale, alternatives considered, and cited documentation sources
- **Review:** The developer reviews and confirms the recommendation before it is written to `02-architecture-decisions.md`

No other stages require agent dispatch — the remaining stages are conversational and produce documentation directly from developer input.


---

## 7. Skill Framework Specifications

Each skill below is specified at the framework level — enough to define its domain, prerequisites, stages, and outputs, while deferring detailed conversation flows and agent designs to individual skill design sessions.

### 7.1 solution-strategy (Discover)

| Attribute | Value |
|---|---|
| **Domain** | Solution packaging architecture, environment promotion, dependency management |
| **Sub-skills** | None |
| **Foundation sections consumed** | `00-project-identity`, `01-requirements`, `02-architecture-decisions`, `04-solution-packaging` |
| **Foundation sections produced** | Updates `04-solution-packaging` (with developer confirmation via solution-discovery convention) |

**Workflow stages:**
1. **ASSESS** — Read the foundation's solution packaging section and evaluate if defaults are sufficient or if the architecture demands multi-solution design
2. **DESIGN** — If multi-solution: define solution domains, dependency graph, layering strategy (base → extension). If single: confirm and document rationale
3. **ENVIRONMENT_MAP** — Define environment promotion path (dev → test → UAT → prod), managed vs. unmanaged per environment, connection references, environment variables
4. **DEPLOYMENT_PLAN** — Define deployment type guidance (upgrade vs. patch), versioning strategy, rollback procedures
5. **REVIEW** — Validate solution strategy against foundation requirements and constraints

**Outputs:** Updated solution packaging section, deployment procedure reference, environment promotion diagram

**Downstream handoff:** Suggests `application-design` (if not yet completed) or `schema-design`

**Open items for detailed design:**
- Decision tree for single vs. multi-solution
- Solution dependency visualization format
- How to handle solution segmentation for ISV scenarios

---

### 7.2 application-design (Design)

| Attribute | Value |
|---|---|
| **Domain** | Domain Driven Design, conceptual modeling, domain boundaries |
| **Sub-skills** | None |
| **Foundation sections consumed** | `00-project-identity`, `01-requirements`, `02-architecture-decisions`, `03-entity-map` |

**Workflow stages:**
1. **DOMAIN_ANALYSIS** — Analyze the entity map through a DDD lens. Identify aggregates, value objects, domain events, and bounded contexts
2. **CONCEPTUAL_MODEL** — Produce a conceptual domain model. Map entities to aggregate roots and define aggregate boundaries
3. **MIND_MAP** — Generate visual mind maps of domain relationships and workflows. Produce diagrams using Excalidraw or inline SVG
4. **DOCUMENTATION** — Produce DDD documentation: ubiquitous language glossary, aggregate definitions, bounded context map, domain event catalog
5. **REVIEW** — Validate DDD model against requirements. Confirm aggregate boundaries with developer

**Outputs:** DDD documentation file (at project root or `docs/`), conceptual domain model diagram, ubiquitous language glossary

**Agents dispatched:**
- **domain-modeler**: Analyzes entity map and requirements to propose aggregate boundaries and bounded contexts

**Downstream handoff:** Suggests `schema-design` (DDD informs data modeling)

**Open items for detailed design:**
- DDD documentation template format
- How to represent bounded contexts that span multiple solutions
- Mind mapping tool integration (Excalidraw MCP vs. inline SVG)

---

### 7.3 schema-design (Design)

| Attribute | Value |
|---|---|
| **Domain** | Dataverse table and column design: conceptual → logical → physical data model |
| **Sub-skills** | None (staged workflow — conceptual → logical → physical are sequential gates, not divergent paths) |
| **Foundation sections consumed** | `00-project-identity`, `01-requirements`, `02-architecture-decisions`, `03-entity-map`, `05-ui-plan` (for de-normalization decisions) |

**Workflow stages:**
1. **CONCEPTUAL_MODEL** — Translate DDD aggregates and entity map into a conceptual data model. Entities, relationships, and cardinality only — no column types yet. Gate: DDD documentation or entity map must exist
2. **LOGICAL_MODEL** — Add attributes, data types, normalization rules, candidate keys. Apply naming conventions (publisher prefix, casing rules). Identify lookup vs. N:N relationships. Gate: conceptual model confirmed
3. **PHYSICAL_MODEL** — Dataverse-specific implementation: actual column types (whole number, currency, choice, lookup), table types (standard, activity, virtual, elastic), table properties (alt keys, audit changes, duplicate detection, change tracking), relationship behaviors (referential, restrict, cascade). Gate: logical model confirmed
4. **UX_DENORMALIZATION** — Review physical model against UI plan. Identify where denormalization improves form performance or user experience (rollup columns, calculated fields, denormalized lookups). This stage reads `05-ui-plan.md` if available
5. **PARITY_CHECK** — Compare proposed schema against known patterns in similar systems (CRM, ERP, project management). Invoke pp-research for Microsoft Learn documentation on system tables, Dynamics 365 table patterns, and best practices
6. **REVIEW** — Two-stage review: schema-reviewer agent checks naming conventions, relationship validity, and anti-pattern detection. Developer confirms final schema

**Outputs:** Conceptual data model (diagram), logical data model (document), physical data model (detailed specification), de-normalization decisions log

**Agents dispatched:**
- **schema-reviewer**: Reviews physical model for naming convention violations, relationship anti-patterns, missing alt keys, audit configuration gaps

**Key knowledge domains (built into SKILL.md):**
- Column types and data types (text, number, date, choice, lookup, calculated, rollup, formula)
- Table types and properties (standard, activity, virtual, elastic; alt keys, audit, duplicate detection)
- Native vs. custom vs. SaaS tables (system table awareness, D365/Project Operations table knowledge)
- Naming conventions (publisher prefix rules, casing, reserved words)
- Bounded context guidance for multi-solution schemas

**Downstream handoff:** Suggests `ui-design` (forms need schema) or `security` (FLS needs columns defined)

**Open items for detailed design:**
- Physical data model documentation format (ERD + specification table)
- Parity check sources and comparison methodology
- De-normalization decision log template
- How to handle schema evolution after initial design (versioning pattern)

---

### 7.4 ui-design (Design) — Router

| Attribute | Value |
|---|---|
| **Domain** | All user interface design and implementation across app types |
| **Sub-skills** | model-driven-app, canvas-app, pcf-control, custom-page, modal-dialog |
| **Foundation sections consumed** | `02-architecture-decisions`, `03-entity-map`, `05-ui-plan`, `08-security-profile` |

**Routing logic:**
1. Read `02-architecture-decisions.md` for app type decision and `05-ui-plan.md` for persona-to-app mapping
2. If the developer requests work on a specific app type → route directly
3. If ambiguous → present the persona-to-app mapping and ask which app type to work on
4. If PCF control is needed → route to `pcf-control` sub-skill (owns full lifecycle including build/deploy)

**Sub-skill framework (each follows the skill definition template):**

| Sub-skill | Domain | Key stages | Key outputs |
|---|---|---|---|
| model-driven-app | MDA forms, views, charts, ribbon, dashboards | Design plan → form layout → view config → ribbon → charts → review | Form XML guidance, view definitions, dashboard layout |
| canvas-app | Canvas app screens, components, formulas | Screen inventory → layout → delegation check → component design → review | Screen designs, formula documentation, delegation analysis |
| pcf-control | PCF controls (React/TypeScript, full lifecycle) | Requirements → component design → manifest → build → test → deploy → review | PCF component code, manifest, test results |
| custom-page | Custom pages (hybrid Canvas + Fluent UI) | Requirements → page design → navigation → build → test → review | Custom page design, navigation integration |
| modal-dialog | Dialogs and modal experiences | Trigger design → dialog layout → input/output contract → build → review | Dialog specification, trigger configuration |

**Absorbed web resource artifacts:**
- HTML/CSS web resources → handled as branches within `model-driven-app` (form-embedded web resources)
- Image web resources → no workflow needed (trivial upload, handled inline during any UI sub-skill)

**Downstream handoff:** Suggests `business-logic` (UI often reveals logic requirements) or `security` (if FLS needs refinement after form design)

**Open items for detailed design:**
- Form layout specification format (how to document form tabs, sections, controls)
- Canvas app delegation analysis checklist
- PCF build pipeline steps for the constrained environment (no admin, user-level Node.js)
- How model-driven-app handles the forms vs. views vs. charts vs. ribbon branching internally

---

### 7.5 security (Design)

| Attribute | Value |
|---|---|
| **Domain** | Security role design, field-level security, column security profiles |
| **Sub-skills** | None (branches within workflow for roles vs. FLS vs. profiles) |
| **Foundation sections consumed** | `03-entity-map`, `05-ui-plan`, `08-security-profile` |

**Workflow stages:**
1. **ROLE_INVENTORY** — Define security roles from the security profile personas. Map each role to Dataverse privilege levels (organization, business unit, parent:child BU, user) per entity
2. **PRIVILEGE_MATRIX** — Build a full privilege matrix: CRUD + Append + AppendTo + Share + Assign per entity per role
3. **FIELD_SECURITY** — Identify fields requiring field-level security. Define field security profiles and role assignments
4. **HIERARCHY_DESIGN** — If business unit or hierarchy security is in scope, define the hierarchy model
5. **REVIEW** — Security-reviewer agent validates role definitions against the principle of least privilege, checks for over-permissioned roles, validates FLS coverage

**Outputs:** Security role matrix, field security profile definitions, security design document

**Agents dispatched:**
- **security-reviewer**: Validates roles against least-privilege principle, flags over-permissioned entities, checks FLS completeness

**Downstream handoff:** Suggests `business-logic` or `alm-workflow` depending on project state

**Open items for detailed design:**
- Security role matrix format (spreadsheet vs. markdown table vs. generated artifact)
- How to handle team-based security patterns
- Testing methodology for security role verification

---

### 7.6 business-logic (Build) — Router

| Attribute | Value |
|---|---|
| **Domain** | All business logic implementation: server-side, client-side, low-code, no-code |
| **Sub-skills** | csharp-plugin, power-automate, business-rule, client-script |
| **Foundation sections consumed** | `02-architecture-decisions`, `03-entity-map`, `06-logic-map` |

**Routing logic:**
1. Read `06-logic-map.md` for the logic inventory
2. If the developer requests a specific logic type → route directly
3. If ambiguous → present the logic map and ask which rule or process to implement
4. Route based on the technology column in the logic map

**Sub-skill framework:**

| Sub-skill | Domain | Key stages | Key outputs |
|---|---|---|---|
| csharp-plugin | Server-side C# plugins (pre/post operation, custom API, custom workflow activity) | Design → scaffold → implement → register → unit test → integration test → review | Plugin assembly, registration steps, test results |
| power-automate | Cloud flows, scheduled flows, instant flows | Design → build flow → test runs → error handling → solution package → review | Flow definition, test run results, error handling documentation |
| business-rule | No-code MDA business rules | Design → configure → test → review | Business rule configuration, test scenarios |
| client-script | JavaScript form scripts, ribbon commands (Xrm SDK) | Design → implement → deploy as web resource → test → review | JS files, form event registration, ribbon command definitions |

**Key boundary:** Power Automate flows that USE connectors are business-logic. Connector DESIGN and CONFIGURATION is integration. A flow that sends an email via Outlook connector is business-logic. Setting up a custom connector to a third-party API is integration.

**Downstream handoff:** Suggests `integration` (if logic reveals integration needs) or `alm-workflow` (if implementation is ready to commit)

**Open items for detailed design:**
- C# plugin scaffold template and project structure
- Power Automate naming conventions and solution packaging best practices
- Client-script namespace management and web resource registration
- How csharp-plugin handles custom APIs vs. standard plugins (branch or sub-skill?)

---

### 7.7 integration (Build) — Router

| Attribute | Value |
|---|---|
| **Domain** | Data movement between Dataverse and external systems |
| **Sub-skills** | connectors, dataflows, virtual-tables, fabric |
| **Foundation sections consumed** | `02-architecture-decisions`, `07-integration-map` |

**Routing logic:**
1. Read `07-integration-map.md` for the integration inventory
2. If the developer requests a specific integration type → route directly
3. If ambiguous → present the integration map and ask which integration to implement

**Sub-skill framework:**

| Sub-skill | Domain | Key stages | Key outputs |
|---|---|---|---|
| connectors | Custom connectors, connection references, auth patterns | Requirements → API analysis → connector definition → auth config → test → solution package → review | Custom connector definition, OpenAPI spec, auth configuration |
| dataflows | Dataverse dataflows, Power Query transformations, ETL patterns | Source analysis → mapping → transformation design → schedule → test → review | Dataflow definition, transformation documentation, schedule config |
| virtual-tables | External data surfacing via virtual tables, OData providers | Source analysis → provider config → table definition → relationship mapping → test → review | Virtual table configuration, provider setup documentation |
| fabric | Microsoft Fabric link setup, data model bridging, lakehouse patterns | Scope definition → Fabric link config → data model mapping → test → review | Fabric configuration guide, data model bridge documentation |

**Downstream handoff:** Suggests `alm-workflow` (to commit integration artifacts) or `business-logic` (if integration reveals logic needs)

**Open items for detailed design:**
- Custom connector OpenAPI template
- Dataflow vs. Power Automate decision tree (when to use which)
- Virtual table provider options and limitations
- Fabric scope boundaries (what is "foundational" vs. advanced)

---

### 7.8 alm-workflow (Continuous)

| Attribute | Value |
|---|---|
| **Domain** | Application lifecycle management: export, version control, deployment |
| **Sub-skills** | None |
| **Foundation sections consumed** | `00-project-identity`, `04-solution-packaging` |

**Workflow stages:**
1. **EXPORT** — Execute PAC CLI export with correct solution name, verify export completeness
2. **UNPACK** — Unpack solution to source-controlled format using PAC CLI
3. **DIFF** — Review changes against last commit. Present meaningful diff summary
4. **COMMIT** — Stage, commit, and push using GitHub Flow (feature branch or main depending on context)
5. **DEPLOY** — When deploying: select deployment type (upgrade, patch, holding), execute import to target environment, verify deployment success
6. **DOCUMENTATION** — Generate or update deployment procedure documentation

**Key knowledge domains:**
- PAC CLI operations (solution export, unpack, pack, import, environment management)
- Deployment types: upgrade (full replace), patch (additive only), holding solution (staging)
- Version control guidance: semantic versioning for solutions, branching strategy alignment with GitHub Flow
- Connection reference and environment variable handling during deployment

**Agents dispatched:**
- **alm-reviewer**: Reviews exported solution for completeness, checks for unmanaged layer contamination, validates component inventory

**This skill is continuous** — it is used throughout the project lifecycle, not as a one-time phase. Developers should run export → unpack → commit after every meaningful change.

**Open items for detailed design:**
- PAC CLI command templates for common operations
- Deployment procedure documentation template
- How to handle solution version numbering across environments
- Automated vs. manual deployment decision points

---

### 7.9 environment-setup (Continuous)

| Attribute | Value |
|---|---|
| **Domain** | Dataverse environment configuration, feature settings, platform integrations |
| **Sub-skills** | None |
| **Foundation sections consumed** | `00-project-identity`, `02-architecture-decisions`, `04-solution-packaging`, `09-constraints` |

**Workflow stages:**
1. **ENVIRONMENT_INVENTORY** — Identify all environments in scope (dev, test, UAT, production). Verify PAC CLI connectivity via pp-devenv context
2. **SETTINGS_CONFIGURATION** — Configure environment-level settings: auditing, duplicate detection rules, email integration, document management
3. **FEATURE_ACTIVATION** — Enable/disable platform features: embedded canvas apps, custom pages, AI Builder, Copilot features
4. **INTEGRATION_SETUP** — Configure environment-level integrations: SharePoint integration, Exchange integration, Teams integration
5. **REVIEW** — Validate environment configuration against foundation constraints and solution requirements

**This skill is continuous** — initial setup happens early, but environment configuration is revisited when deploying to new environments or enabling new features.

**Downstream handoff:** Does not suggest a specific next skill — environment setup is a service skill invoked as needed.

**Open items for detailed design:**
- Environment settings checklist template
- Feature activation compatibility matrix (which features require which license tier)
- Environment comparison tool (detect configuration drift between environments)

---

## 8. Sub-Skill Routing Pattern

This section specifies how parent SKILL.md files in router skills (ui-design, business-logic, integration) detect and delegate to sub-skills.

### 8.1 Router SKILL.md Structure

A router SKILL.md does not contain workflow stages. It contains:

1. **Domain statement** — what this skill family covers
2. **Sub-skill inventory** — list of available sub-skills with trigger descriptions
3. **Detection logic** — how to determine which sub-skill to invoke
4. **Context passthrough** — what context is passed to the sub-skill

Example structure (ui-design):

```markdown
# ui-design — Router

## Domain
All user interface design and implementation across Power Platform app types.

## Sub-skills
| Sub-skill | Triggers when... |
|---|---|
| model-driven-app | App type is Model-Driven, or developer requests form/view/chart work |
| canvas-app | App type is Canvas, or developer requests screen/component work |
| pcf-control | Developer requests a custom control, or the design calls for React/TypeScript components |
| custom-page | App type includes Custom Pages, or developer requests hybrid Canvas/Fluent UI |
| modal-dialog | Developer requests a dialog, popup, or modal experience |

## Detection
1. Read `02-architecture-decisions.md` → extract app type
2. Read `05-ui-plan.md` → extract persona-to-app mapping
3. If request matches a specific sub-skill → delegate
4. If ambiguous → ask: "Which app type are you working on?"

## Context passed to sub-skill
- Foundation sections: 02, 03, 05, 08
- Environment context from .pp-context/environment.json
- Session memory from .pp-context/session.json (if available)
- Current skill state from .pp-context/skill-state.json
```

### 8.2 Sub-Skill Independence

Each sub-skill is self-contained. It follows the full skill framework template (§5.1) and can be invoked directly by a developer who knows what they want, bypassing the router. The router exists for developers who say "I need to work on UI" without specifying the app type.

### 8.3 Two Levels Maximum

Sub-skills do not have sub-sub-skills. When a sub-skill encounters internal variations (e.g., `model-driven-app` handling forms vs. views vs. charts), it uses conditional branching within its workflow stages:

```
Stage: ARTIFACT_SELECTION
  "What are you building?"
  → Form design       → branch to FORM_DESIGN stages
  → View configuration → branch to VIEW_CONFIG stages
  → Chart design       → branch to CHART_DESIGN stages
  → Ribbon/command bar → branch to RIBBON_CONFIG stages
  → Dashboard layout   → branch to DASHBOARD_DESIGN stages
```

Branches share the same review stage and agents. They differ only in the middle execution stages.

---

## 9. Agent Design Patterns

### 9.1 Agent Types in pp-superpowers

Agents in pp-superpowers fall into two categories:

**Advisor agents** — dispatched during design stages to research and recommend. They return findings to the skill, which presents them to the developer for confirmation.
- architecture-advisor (solution-discovery)
- domain-modeler (application-design)

**Reviewer agents** — dispatched during review stages to evaluate artifacts against quality criteria. They produce a findings report with severity levels.
- schema-reviewer (schema-design)
- plugin-auditor (business-logic/csharp-plugin)
- ui-reviewer (ui-design — shared across sub-skills)
- security-reviewer (security)
- alm-reviewer (alm-workflow)
- integration-reviewer (integration — shared across sub-skills)

### 9.2 Agent Definition Format

Each agent is defined in a markdown file under `agents/`. The file specifies:

```markdown
# [agent-name]

## Role
[One sentence: what this agent does]

## Invoked by
[Which skill(s) dispatch this agent]

## Input context
[What the agent receives — foundation sections, artifacts, environment state]

## Evaluation criteria
[Ordered list of what the agent checks, with severity levels]

## Output format
[Structured findings report format]

## Does not
[Explicit boundaries — what this agent must not attempt]
```

### 9.3 Two-Stage Review Adaptation

Superpowers uses a two-stage review: spec compliance first, then code quality. pp-superpowers adapts this for Power Platform artifacts:

**Stage 1 — Spec compliance:** Does the artifact satisfy the requirements defined in the foundation document and the skill's design outputs?
- Schema matches entity map
- Plugin handles all trigger scenarios from the logic map
- Form includes all fields from the physical data model
- Security roles cover all personas from the security profile

**Stage 2 — Quality:** Does the artifact follow platform best practices and conventions?
- Naming conventions respected
- Anti-patterns avoided
- Performance implications considered
- Platform limitations acknowledged

For design artifacts (documentation, models, plans), only Stage 1 applies — there is no "code quality" dimension, but completeness and consistency are validated.

For implementation artifacts (C# plugins, JS scripts, PCF controls, Power Automate flows), both stages apply in sequence. Stage 1 blocks Stage 2 — a plugin that doesn't handle the required triggers fails review regardless of code quality.

---

## 10. Superpowers Infrastructure Retained

These Superpowers components are retained as-is or with minimal adaptation and do not require redesign.

### 10.1 Git Worktree Workflow

The Superpowers git worktree pattern is retained for parallel development. When a skill enters its implementation stage, it can create an isolated worktree on a feature branch. This is especially valuable for:
- Plugin development (C# changes on a feature branch)
- PCF control development (React/TypeScript on a feature branch)
- Client script development (JS changes on a feature branch)

Design-only skills (solution-discovery, application-design, schema-design) do not use worktrees — their outputs are documents, not code.

### 10.2 Parallel Agent Dispatch

The Superpowers pattern for dispatching multiple agents in parallel is retained. This is used when a review stage needs multiple reviewers simultaneously (e.g., schema-reviewer + security-reviewer when schema changes affect FLS).

### 10.3 Verification Before Completion

The Superpowers verification pattern ("are we actually done?") is retained and adapted per skill. Each skill's final stage includes verification checks specific to its domain before marking completion in the skill state.

### 10.4 Command System

The Superpowers command system is retained. Commands are developer-invoked actions (unlike skills, which trigger automatically). Expected commands for pp-superpowers:

| Command | Purpose |
|---|---|
| `/foundation` | Display foundation document status and completeness |
| `/skills` | List all skills, their status, and suggested next |
| `/resume` | Resume the last active skill from where it left off |
| `/handoff [skill-name]` | Manually start a specific skill with context injection |

Additional commands to be defined during build.

---

## 11. Decision Log

All architectural decisions made during the pp-superpowers design session.

| # | Decision | Rationale |
|---|---|---|
| 1 | 10 skills organized into 4 lifecycle groups (Discover, Design, Build, Continuous) | Groups indicate first-needed dependency order; execution is iterative, not waterfall |
| 2 | Lifecycle groups: Discover → Design → Build → Continuous | Skills are first needed in this order, but the developer revisits earlier skills as the project evolves |
| 3 | solution-discovery produces a modular `.foundation/` directory, not a single file | Each section is designed to serve a specific downstream skill; modular structure enables incremental completion and targeted reads |
| 4 | Skills save incremental progress and can resume across sessions | Solo developer may span days across a design workflow; progress must survive session boundaries |
| 5 | Downstream handoff is suggestive, not automatic | Developer maintains control; the skill recommends the next step and waits for confirmation |
| 6 | Web resources absorbed into domain-owner skills | Web resources are an artifact type, not a domain of concern; PCF → ui-design, JS → business-logic, HTML/CSS → ui-design |
| 7 | plugin-dev renamed to business-logic with 4 sub-skills | Business logic encompasses all implementation types (C# plugins, Power Automate, business rules, client scripts); defined by concern, not artifact |
| 8 | integration added as new skill #7 | Connectors, dataflows, virtual tables, and Fabric patterns have no home in existing skills; genuinely new domain |
| 9 | mda-ui renamed to ui-design with 5 sub-skills | UI design spans multiple app types (MDA, Canvas, PCF, Custom Page, Modal); scoped by domain, not artifact |
| 10 | Two levels maximum — no sub-sub-skills | Sub-skills route by workflow type; variations within a sub-skill (forms vs. views) are branches, not levels |
| 11 | schema-design uses staged workflow (conceptual → logical → physical), not sub-skills | The three model levels are sequential gates, not divergent workflows; you cannot skip from conceptual to physical |
| 12 | ALM and environment-setup are Continuous (not late-stage) | Both are practices that start early and run throughout; ALM should be used from the first solution export |
| 13 | Foundation sections can be skipped with placeholder files | Some sections (UI plan, logic map, integration map, security profile) may not be known at discovery time; placeholders are detectable by downstream skills |
| 14 | solution-strategy moved to Discover group | Solution packaging decisions must be made before design work begins; affects solution boundaries and component ownership |
| 15 | Power Automate flows in business-logic; connector config in integration | Flows implement logic (business-logic domain); connector design and auth configuration is data movement architecture (integration domain) |

---

## 12. Open Items for Detailed Design

Organized by skill, these items are deferred to individual skill design sessions.

### Cross-cutting
- Agent definition files: content for each of the 6 reviewer agents and 2 advisor agents
- Foundation directory: validation script (ensure all referenced sections exist and are not placeholders before a skill proceeds)
- Progress tracking: exact schema for `.pp-context/skill-state.json` edge cases (multiple skills in progress, reverting a completed skill)
- Skill interaction: how to handle a skill discovering the foundation is outdated (formal update request flow vs. inline correction)

### solution-discovery
- Exact question phrasing for each round (adapt based on project type: greenfield vs. extension vs. migration)
- Architecture-advisor agent definition file
- How to handle "I already have a design document" shortcut (import and validate against foundation schema)
- Foundation section validation rules (what constitutes a valid vs. placeholder section)

### solution-strategy
- Single vs. multi-solution decision tree
- Solution dependency visualization format
- ISV scenario handling (solution segmentation for distribution)

### application-design
- DDD documentation template format
- Bounded context map visualization approach
- Mind mapping integration (Excalidraw MCP vs. inline SVG vs. external tool)
- Domain-modeler agent definition file

### schema-design
- Physical data model documentation format
- Parity check methodology (how to systematically compare against known patterns)
- De-normalization decision log template
- Schema evolution pattern (how to handle changes after initial design)
- Schema-reviewer agent definition file

### ui-design
- model-driven-app: form layout specification format, internal branching logic (forms/views/charts/ribbon/dashboards)
- canvas-app: delegation analysis checklist, component library approach
- pcf-control: build pipeline for constrained environment, manifest template
- custom-page: navigation integration pattern, Fluent UI component guidance
- modal-dialog: trigger design patterns, input/output contract format
- ui-reviewer agent definition file (shared criteria across sub-skills + sub-skill-specific additions)

### security
- Security role matrix format and generation approach
- Team-based security pattern guidance
- Security testing methodology
- Security-reviewer agent definition file

### business-logic
- csharp-plugin: scaffold template, project structure, unit test framework, registration steps
- power-automate: naming conventions, solution packaging, error handling patterns, testing approach
- business-rule: configuration documentation format, scope limitation guidance
- client-script: namespace management, web resource registration, Xrm SDK patterns
- plugin-auditor agent definition file (adapted from existing dataverse-csharp-plugin-audit skill)

### integration
- connectors: OpenAPI template, auth pattern guidance, testing approach
- dataflows: dataflow vs. Power Automate decision tree, transformation documentation
- virtual-tables: provider options and limitations matrix, performance considerations
- fabric: scope boundaries for "foundational" coverage, Fabric link setup guide
- integration-reviewer agent definition file

### alm-workflow
- PAC CLI command templates for common operations
- Deployment procedure documentation template
- Solution version numbering strategy
- Automated deployment decision points
- alm-reviewer agent definition file

### environment-setup
- Environment settings checklist template
- Feature activation compatibility matrix
- Environment comparison tool design

---

## Appendix A: Skill Inventory Quick Reference

| # | Skill | Group | Sub-skills | Foundation sections consumed |
|---|---|---|---|---|
| 0 | solution-discovery | Discover | — | (produces all sections) |
| 1 | solution-strategy | Discover | — | 00, 01, 02, 04 |
| 2 | application-design | Design | — | 00, 01, 02, 03 |
| 3 | schema-design | Design | — | 00, 01, 02, 03, 05 |
| 4 | ui-design | Design | model-driven-app, canvas-app, pcf-control, custom-page, modal-dialog | 02, 03, 05, 08 |
| 5 | security | Design | — | 03, 05, 08 |
| 6 | business-logic | Build | csharp-plugin, power-automate, business-rule, client-script | 02, 03, 06 |
| 7 | integration | Build | connectors, dataflows, virtual-tables, fabric | 02, 07 |
| 8 | alm-workflow | Continuous | — | 00, 04 |
| 9 | environment-setup | Continuous | — | 00, 02, 04, 09 |

## Appendix B: Foundation Directory Section Ownership

| Section | Written by | Primary consumers |
|---|---|---|
| 00-project-identity | solution-discovery | All skills, pp-docs, pp-memory |
| 01-requirements | solution-discovery | application-design, schema-design, all skills (scope) |
| 02-architecture-decisions | solution-discovery | ui-design, business-logic, integration, schema-design |
| 03-entity-map | solution-discovery | application-design, schema-design, ui-design, security |
| 04-solution-packaging | solution-discovery | solution-strategy, alm-workflow |
| 05-ui-plan | solution-discovery | ui-design, schema-design (de-normalization) |
| 06-logic-map | solution-discovery | business-logic |
| 07-integration-map | solution-discovery | integration |
| 08-security-profile | solution-discovery | security, ui-design |
| 09-constraints | solution-discovery | All skills (hard limits) |

## Appendix C: Absorbed Web Resource Mapping

| Web resource type | Absorbed into | Rationale |
|---|---|---|
| PCF controls (React/TypeScript) | ui-design / pcf-control | UI component; full lifecycle owned here |
| JavaScript form scripts | business-logic / client-script | Client-side logic enforcement |
| HTML/CSS web resources | ui-design / model-driven-app (branch) | Form-embedded UI artifacts |
| Image web resources | ui-design (inline, no workflow) | Visual assets, trivial upload |
| JSON configuration files | Handled inline by consuming skill | Too small for a dedicated workflow |