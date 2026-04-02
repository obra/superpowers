# pp-superpowers — solution-discovery Skill Specification

**Version:** 1.0
**Date:** April 1, 2026
**Author:** SDFX Studios
**Status:** Approved for build
**Parent document:** pp-superpowers Design Roadmap v1.0

---

## 1. Skill Overview

| Attribute | Value |
|---|---|
| **Name** | solution-discovery |
| **Skill number** | 0 (front door of pp-superpowers) |
| **Domain** | Requirements gathering, architecture decisions, foundation document production |
| **Lifecycle group** | Discover |
| **Has sub-skills** | No — single sequential workflow with two operating modes |
| **Foundation sections consumed** | None (solution-discovery *produces* the foundation) |
| **Foundation sections produced** | All 10: `00-project-identity` through `09-constraints` |
| **Upstream dependency** | None — this is the entry point |
| **Downstream handoff** | All skills — every skill reads `.foundation/` at INIT |
| **Agents** | architecture-advisor |

### 1.1 Purpose

solution-discovery is the single entry point for all new work in pp-superpowers. It conducts a structured requirements conversation with the developer and produces the `.foundation/` directory — a set of 10 markdown files that define the project's identity, requirements, architecture, entities, packaging, UI plan, logic map, integration map, security profile, and constraints.

Every other skill in pp-superpowers reads from `.foundation/` at its INIT stage. The foundation is the shared contract between solution-discovery and all downstream skills. If the foundation format changes, every downstream skill's INIT stage must be updated. This is why solution-discovery's design document is in the dependency-complete subset for Phase 1 build.

### 1.2 Relationship to Other Skills

**Downstream — all skills:** Every skill reads one or more foundation sections at INIT. The section classification (§7) defines which sections are required vs. conditionally required for each downstream skill.

**solution-strategy:** Consumes `04-solution-packaging` and may produce an expanded packaging document. solution-discovery writes the initial packaging section; solution-strategy deepens it when multi-solution complexity warrants it.

**application-design:** May enrich foundation sections through the foundation enrichment protocol (see application-design §7). Enrichment updates existing sections but never creates new ones or overrides project identity.

---

## 2. Mode Architecture

solution-discovery supports two operating modes, determined at INIT.

### 2.1 CREATE Mode — New Foundation

**When:** No `.foundation/` directory exists, or the developer explicitly requests a fresh start.

**Process:** Walk through all 10 sections in fixed order (00 → 09). Each section produces one foundation file. The developer answers questions, the skill writes the file, and the state machine advances.

**Exit:** After REVIEW stage confirms all sections, the skill transitions to COMPLETE and suggests the next skill.

### 2.2 UPDATE Mode — Modify Existing Foundation

**When:** `.foundation/` exists and `.discovery-state.json` shows `"stage": "COMPLETE"`. The developer wants to change a specific section (requirements changed, new entities discovered, architecture decision revised).

**Process:** The developer specifies which section to update. The skill loads the current section content, presents it, and conducts a focused conversation to modify it. After the section is updated, the skill evaluates downstream impact (§8) and warns the developer about potentially affected sections and skills.

**Exit:** After the update is written and impact warnings are presented, the skill returns to COMPLETE. It does not re-run the full REVIEW stage — the developer has confirmed the specific change.

### 2.3 Mode Selection Logic

```
INIT:
  IF .foundation/ does not exist → CREATE mode
  IF .foundation/ exists AND .discovery-state.json shows stage != COMPLETE → RESUME (CREATE mode, pick up at last incomplete section)
  IF .foundation/ exists AND .discovery-state.json shows stage == COMPLETE:
    → Ask: "Your foundation is complete. Would you like to update a section?"
    → If yes → UPDATE mode (developer specifies section)
    → If no → exit (suggest downstream skill)
```

---

## 3. State Machine

### 3.1 CREATE Mode State Machine

```
INIT → PROJECT_IDENTITY → REQUIREMENTS → ARCHITECTURE → ENTITY_MAP →
SOLUTION_PACKAGING → UI_PLAN → LOGIC_MAP → INTEGRATION_MAP →
SECURITY_PROFILE → CONSTRAINTS → REVIEW → COMPLETE
```

| Stage | Foundation section written | Section # | Required | Can skip? |
|---|---|---|---|---|
| INIT | (none — reads state, selects mode) | — | — | No |
| PROJECT_IDENTITY | `00-project-identity.md` | 00 | Yes | No |
| REQUIREMENTS | `01-requirements.md` | 01 | Yes | No |
| ARCHITECTURE | `02-architecture-decisions.md` | 02 | Yes | No |
| ENTITY_MAP | `03-entity-map.md` | 03 | Yes | No |
| SOLUTION_PACKAGING | `04-solution-packaging.md` | 04 | Conditional | No — always produces at least a default |
| UI_PLAN | `05-ui-plan.md` | 05 | Conditional | Yes |
| LOGIC_MAP | `06-logic-map.md` | 06 | Conditional | Yes |
| INTEGRATION_MAP | `07-integration-map.md` | 07 | Conditional | Yes |
| SECURITY_PROFILE | `08-security-profile.md` | 08 | Conditional | Yes |
| CONSTRAINTS | `09-constraints.md` | 09 | Yes | No |
| REVIEW | (validates all sections) | — | — | No |
| COMPLETE | Updates `.discovery-state.json` | — | — | No |

**Fixed order:** Stages execute in the order shown. The developer cannot jump ahead or reorder stages. Each stage builds on context from previous stages — architecture decisions reference requirements, entity map references architecture decisions, and so on.

**Skip behavior (conditional sections only):** At the start of each skippable stage, the skill asks whether the developer has information for this section. If the developer says no or wants to defer, the skill writes a **placeholder file** with a standard header and moves to the next stage. Placeholder format:

```markdown
# [Section Title]

**Status:** Placeholder — not yet completed
**Skipped during:** solution-discovery CREATE, [date]
**Reason:** [developer's stated reason or "deferred to later"]

---

_This section will be completed when the developer runs solution-discovery in UPDATE mode or when the consuming skill requests it._
```

Downstream skills detect placeholder files by checking for the `**Status:** Placeholder` line. When a downstream skill encounters a placeholder for a section it conditionally requires, it warns the developer and offers to proceed with documented assumptions or return to solution-discovery first.

### 3.2 UPDATE Mode State Machine

```
INIT → SECTION_SELECT → SECTION_UPDATE → IMPACT_ANALYSIS → COMPLETE
```

| Stage | What happens |
|---|---|
| INIT | Reads `.discovery-state.json`, confirms COMPLETE state, enters UPDATE mode |
| SECTION_SELECT | Developer specifies which section to update (by number or name) |
| SECTION_UPDATE | Loads current section, presents it, conducts focused conversation to modify |
| IMPACT_ANALYSIS | Evaluates downstream impact per the dependency map (§8), presents warnings |
| COMPLETE | Writes updated section, updates `.discovery-state.json` with update timestamp |

### 3.3 Resume Behavior

When INIT detects `.foundation/` exists but `.discovery-state.json` shows a stage other than COMPLETE:

1. Read `.discovery-state.json` to determine the last completed stage
2. Present a status summary showing completed sections (with a one-line summary of each) and remaining sections
3. Auto-position at the first incomplete section (the section immediately after the last completed stage)
4. Continue the fixed-order flow from that point

The developer cannot choose which section to resume at — the skill always resumes at the first incomplete section. This preserves the fixed-order guarantee (no section is filled before its predecessors).

**Status summary format:**

```
Foundation status for [project name]:

  ✓ 00 Project Identity — [project name], [project type]
  ✓ 01 Requirements — [problem statement summary, first 50 chars]
  ✓ 02 Architecture — [app type], [solution count]
  ✗ 03 Entity Map — not started
  · 04–09 — not started

Resuming at section 03: Entity Map.
```

### 3.4 State File Specification

`.foundation/.discovery-state.json`:

```json
{
  "version": "1.0",
  "projectName": "ProjectCentral",
  "projectType": "greenfield",
  "mode": "CREATE",
  "stage": "ENTITY_MAP",
  "sections": {
    "00-project-identity": { "status": "complete", "completedAt": "2026-04-01T10:00:00Z" },
    "01-requirements": { "status": "complete", "completedAt": "2026-04-01T10:15:00Z" },
    "02-architecture-decisions": { "status": "complete", "completedAt": "2026-04-01T10:30:00Z" },
    "03-entity-map": { "status": "in-progress", "startedAt": "2026-04-01T10:45:00Z" },
    "04-solution-packaging": { "status": "not-started" },
    "05-ui-plan": { "status": "not-started" },
    "06-logic-map": { "status": "not-started" },
    "07-integration-map": { "status": "not-started" },
    "08-security-profile": { "status": "not-started" },
    "09-constraints": { "status": "not-started" }
  },
  "lastUpdated": "2026-04-01T10:45:00Z",
  "updates": []
}
```

**Status values:** `not-started`, `in-progress`, `complete`, `skipped`, `placeholder`

**Update tracking (UPDATE mode):** When a section is modified in UPDATE mode, an entry is added to the `updates` array:

```json
{
  "section": "01-requirements",
  "updatedAt": "2026-04-15T14:00:00Z",
  "reason": "Added new requirement for mobile access",
  "impactWarnings": ["05-ui-plan", "02-architecture-decisions"]
}
```

---

## 4. Conversation Flow and Gating Logic

Each stage conducts a structured conversation organized into rounds. Questions within a round are asked together. The skill does not proceed to the next stage until the gate condition is met.

### 4.1 Project-Type Context Injection

Section `00-project-identity` captures the project type as one of its questions. The answer — greenfield, extension, or migration — becomes context that modifies question phrasing in subsequent stages. Rather than maintaining three separate conversation flows, each stage has a base question set with project-type-aware variations noted inline.

**Project types:**

| Type | Definition | Context effect on questions |
|---|---|---|
| **Greenfield** | No existing solution. Building from scratch. | Questions focus on "what do you want to build?" |
| **Extension** | Existing Power Platform solution being enhanced. | Questions focus on "what exists and what are you adding?" |
| **Migration** | Moving from another system to Power Platform. | Questions focus on "what exists in the source system and how does it map?" |

### 4.2 Stage: INIT

**What happens:**
1. Check for `.foundation/` directory
2. If absent → announce CREATE mode, proceed to PROJECT_IDENTITY
3. If present, check `.discovery-state.json`:
   - If stage is not COMPLETE → present status summary (§3.3), resume at first incomplete
   - If stage is COMPLETE → ask if developer wants to UPDATE a section or proceed to another skill

**No questions asked.** INIT is a routing stage — it reads state and selects the mode.

### 4.3 Stage: PROJECT_IDENTITY

**Round 1 — Who and what:**

> 1. What is the name of this project or solution?
> 2. What does it do in one sentence?
> 3. Who is the primary audience? (Internal team, external customers, mixed)
> 4. What type of project is this?
>    - **Greenfield:** Building a new solution from scratch
>    - **Extension:** Adding features to an existing Power Platform solution
>    - **Migration:** Moving from another system to Power Platform

**Round 2 — Publisher identity:**

> 5. What is your Dataverse publisher prefix? (e.g., `sdfx`, `contoso`)
>    _If you don't have one yet, I'll help you choose one that follows naming conventions._

**Gate:** Questions 1–4 answered. Question 5 may use a default derived from the project name if the developer doesn't have a publisher prefix yet.

**Output:** Write `00-project-identity.md`

**Project-type captured here** — all subsequent stages reference `projectType` from this section.

### 4.4 Stage: REQUIREMENTS

**Round 1 — Problem and purpose:**

> 6. What problem does this solution solve? (Describe the pain point.)
> 7. How does it solve that problem? (What the solution enables.)

**Round 2 — Scope:**

> 8. What is explicitly in scope?
> 9. What is explicitly out of scope?

**Round 3 — Scale:**

> 10. How many users do you expect? (Number or range)
> 11. What data volume do you expect? (Records, growth rate — rough order of magnitude is fine.)
> 12. Is this single-region or multi-region?

**Project-type variation:**

| Type | Additional question |
|---|---|
| Extension | "What existing capabilities are you extending? List the features or entities being modified." |
| Migration | "What is the source system? Describe its core data structures and processes at a high level." |

**Gate:** Questions 6–9 answered. Questions 10–12 may use "unknown — to be determined" if the developer doesn't have scale estimates yet.

**Output:** Write `01-requirements.md`

### 4.5 Stage: ARCHITECTURE

**Round 1 — App type decision:**

> 13. Based on your requirements, I recommend [app type]. Here's why: [rationale].
>     - **Model-Driven App:** Best for data-heavy, forms-and-views workflows with role-based access
>     - **Canvas App:** Best for custom UX, mobile-first, or pixel-precise layouts
>     - **Both:** Model-Driven for internal operations + Canvas for field/mobile workers
>     - **Custom (code-based):** Best when platform controls can't meet UX requirements
>
>     Do you agree with this recommendation, or do you have a different preference?

The recommendation is generated by the **architecture-advisor agent** (§10), which analyzes requirements and proposes an app type with rationale.

**Round 2 — Architecture characteristics:**

> 14. Will this solution need offline capability?
> 15. Does it need to integrate with external systems? (APIs, legacy databases, third-party services)
> 16. Are there licensing constraints? (Which Power Platform licenses are available?)

**Project-type variation:**

| Type | Additional question |
|---|---|
| Extension | "What app type does the existing solution use? Will the extension use the same type or add a new one?" |
| Migration | "Does the source system have a web UI, desktop client, or both? What aspects of the UX must be preserved?" |

**Gate:** App type decision confirmed (question 13). Questions 14–16 answered (may be "not applicable").

**Output:** Write `02-architecture-decisions.md`

### 4.6 Stage: ENTITY_MAP

**Round 1 — Entity identification:**

> 17. [Greenfield] List the main "things" your system needs to track. These become your Dataverse tables. Don't worry about columns yet — just the nouns.
>     _(Example: Projects, Tasks, Team Members, Time Entries)_
>
> 17. [Extension] What existing Dataverse tables will this extension modify or extend? What new tables do you need to add?
>
> 17. [Migration] List the key tables/objects in your source system. I'll help you map them to Dataverse tables.

**Round 2 — Relationship identification:**

> 18. How do these entities relate to each other? For each relationship, describe:
>     - Which entity owns the other (parent-child)?
>     - Can the child exist without the parent?
>     - Is it one-to-many or many-to-many?
>
>     _Don't worry about getting this perfect — schema-design will refine these relationships. I just need the high-level picture._

**Round 3 — Entity confirmation:**

Present the entity list with relationships as a summary table and ask the developer to confirm or adjust.

**Gate:** At least 2 entities identified with at least 1 relationship described.

**Output:** Write `03-entity-map.md`

### 4.7 Stage: SOLUTION_PACKAGING

**Round 1 — Solution structure:**

> 19. Will this be a single solution or multiple solutions?
>     - **Single solution:** One deployable package containing everything (recommended for most projects)
>     - **Multiple solutions:** Separate packages with dependencies (needed for ISV distribution, large-team separation, or layered architecture)
>
>     _For a [greenfield/extension/migration] project with [N] entities, I'd recommend [single/multiple] because [rationale]._

**Round 2 (if multiple solutions):**

> 20. Describe the solution boundaries — which components belong in each solution?
> 21. What is the dependency order? (Which solution must be installed first?)

**Gate:** Packaging decision made (single or multiple). If multiple, boundaries and dependency order documented.

**Output:** Write `04-solution-packaging.md`

### 4.8 Stage: UI_PLAN (skippable)

**Skip offer:**

> "Next is the UI plan — personas, navigation structure, and app modules. If you'd prefer to define the UI during the ui-design skill instead, I can write a placeholder and move on. Would you like to define the UI plan now, or defer it?"

**If proceeding:**

**Round 1 — Personas:**

> 22. Who are the distinct user types? For each, describe:
>     - Role name (e.g., Project Manager, Team Member, Admin)
>     - What they primarily do in the system
>     - What data they need to see vs. what they need to edit

**Round 2 — Navigation:**

> 23. Based on your [app type] decision and these personas, here's a suggested app structure: [proposed sitemap/navigation]. Does this match your vision?

**Project-type variation:**

| Type | Additional question |
|---|---|
| Extension | "What does the current app navigation look like? Where do the new features fit?" |
| Migration | "What is the current system's navigation structure? Which aspects should be preserved?" |

**Gate:** At least 1 persona defined. Navigation structure confirmed or placeholder accepted.

**Output:** Write `05-ui-plan.md`

### 4.9 Stage: LOGIC_MAP (skippable)

**Skip offer:**

> "Next is the logic map — server-side plugins, client scripts, business rules, and automation flows. If you don't have enough detail on business logic yet, I can write a placeholder. Would you like to define the logic map now, or defer it?"

**If proceeding:**

**Round 1 — Logic identification:**

> 24. What business rules or automations does your system need? For each, describe:
>     - What triggers it? (Record create, update, delete, manual action, scheduled)
>     - What does it do? (Validate, calculate, create related records, notify, integrate)
>     - Which entities does it touch?
>
>     _Don't worry about choosing between plugins, flows, or business rules — business-logic will help you pick the right implementation. I just need to know what the logic does._

**Round 2 — Logic summary:**

Present the identified logic items as a numbered list with trigger, action, and entity references. Ask the developer to confirm or adjust.

**Gate:** At least 1 logic item identified, or explicit decision to defer (placeholder).

**Output:** Write `06-logic-map.md`

### 4.10 Stage: INTEGRATION_MAP (skippable)

**Skip offer:**

> "Next is the integration map — external systems, APIs, and data sources that connect to your solution. If your solution doesn't integrate with external systems, I can skip this section. Are there any external integrations?"

**If proceeding:**

**Round 1 — Integration identification:**

> 25. What external systems does this solution connect to? For each:
>     - System name and type (API, database, file share, SaaS platform)
>     - Direction: Does data flow in, out, or both?
>     - Frequency: Real-time, scheduled, or on-demand?
>     - Authentication: How do you connect? (API key, OAuth, service account)

**Round 2 — Integration summary:**

Present integrations as a summary table and ask for confirmation.

**Project-type variation:**

| Type | Additional question |
|---|---|
| Migration | "Which integrations from the source system need to be replicated in Power Platform? Are any being replaced or retired?" |

**Gate:** At least 1 integration documented, or explicit confirmation that there are no external integrations (writes a section documenting "No external integrations identified").

**Output:** Write `07-integration-map.md`

### 4.11 Stage: SECURITY_PROFILE (skippable)

**Skip offer:**

> "Next is the security profile — who can see and do what. If security requirements are still undefined, I can write a placeholder. Would you like to define the security profile now, or defer it?"

**If proceeding:**

**Round 1 — Access model:**

> 26. What security model best describes your needs?
>     - **Role-based:** Users are assigned roles that control access (most common)
>     - **Team-based:** Access is determined by team membership (for org-unit separation)
>     - **Combination:** Role-based with team scoping for row-level access
>
> 27. List the security roles you envision. For each:
>     - Role name
>     - What they can create, read, update, delete (high level — not per-entity yet)
>     - Any data they must NOT see (field-level security candidates)

**Round 2 — Row ownership:**

> 28. Who "owns" records in your system?
>     - Individual users (user-owned tables)
>     - Teams (team-owned tables)
>     - The organization (org-owned tables — everyone can see everything)
>
>     _Different entities may have different ownership models. List any exceptions._

**Gate:** At least security model type selected (question 26). Role list and ownership model are helpful but may be deferred to the security skill.

**Output:** Write `08-security-profile.md`

### 4.12 Stage: CONSTRAINTS

**Round 1 — Hard constraints:**

> 29. What are the non-negotiable constraints for this project?
>     - Timeline: When must this be delivered?
>     - Budget: Any cost limitations? (Licensing, development hours)
>     - Licensing: Which Power Platform licenses are available? (Per-user, per-app, premium connectors)
>     - Compliance: Any regulatory or compliance requirements? (GDPR, HIPAA, SOX, data residency)
>     - Infrastructure: Any constraints on environments, tenants, or deployment?

**Round 2 — Known risks:**

> 30. Are there any known risks or open questions that need resolution before building?
> 31. Are there performance requirements? (Response time targets, concurrent user limits)

**Gate:** At least one constraint documented. If the developer says "no constraints," the skill writes a section documenting "No constraints identified — revisit when constraints surface."

**Output:** Write `09-constraints.md`

### 4.13 Stage: REVIEW

**What happens:**

1. Present a foundation summary showing all 10 sections. For each section, display:
   - Section number and name
   - Status (complete, skipped/placeholder)
   - One-paragraph summary of the content

2. Ask the developer to confirm the foundation is accurate or request changes.

3. If changes are requested:
   - Return to the specific stage
   - Update the section file
   - Return to REVIEW
   - Re-present the summary

**Gate:** Developer explicitly confirms the foundation is complete and accurate.

**Summary format:**

```
Foundation Summary for [Project Name]
=====================================

00 Project Identity ✓
   [project name] — [one-line description]
   Type: [greenfield/extension/migration] | Prefix: [publisher prefix]

01 Requirements ✓
   [problem statement, first 80 chars]
   Scope: [N] in-scope items, [M] out-of-scope items
   Scale: [users] users, [volume] records

02 Architecture Decisions ✓
   App type: [type] | Offline: [yes/no] | External integrations: [yes/no]

03 Entity Map ✓
   [N] entities identified, [M] relationships documented

04 Solution Packaging ✓
   [Single solution / N solutions with dependencies]

05 UI Plan [✓ / ⊘ placeholder]
   [N] personas, [M] app modules defined

06 Logic Map [✓ / ⊘ placeholder]
   [N] logic items: [X] plugins, [Y] flows, [Z] business rules

07 Integration Map [✓ / ⊘ placeholder / ✕ none]
   [N] external integrations documented

08 Security Profile [✓ / ⊘ placeholder]
   Model: [role-based/team-based/combination], [N] roles defined

09 Constraints ✓
   [N] constraints documented, [M] risks identified

---
All sections confirmed? [yes / request changes]
```

### 4.14 Stage: COMPLETE

**What happens:**

1. Update `.discovery-state.json` to `"stage": "COMPLETE"`
2. Present the downstream skill suggestion

**Suggestion logic:**

```
IF solution packaging is multi-solution → suggest solution-strategy
  "Your packaging has [N] solutions with dependencies. I'd suggest running
   solution-strategy next to finalize the dependency graph and layering."

ELSE IF entity map has 5+ entities → suggest application-design
  "Your entity map has [N] entities. DDD modeling in application-design will
   help organize these into bounded contexts before schema work begins."

ELSE → suggest application-design (default)
  "Based on your foundation, I'd suggest application-design next to model
   your domain before moving to schema-design."
```

3. Present other available options:

```
Other options:
  - schema-design — jump straight to data modeling
  - ui-design — start designing the user interface
  - Any other skill — the foundation supports all downstream skills
```

4. Wait for explicit developer confirmation. Do not auto-start the next skill.

---

## 5. Output Specifications

### 5.1 Foundation Directory Structure

```
.foundation/
  .discovery-state.json          ← state tracker (§3.4)
  00-project-identity.md
  01-requirements.md
  02-architecture-decisions.md
  03-entity-map.md
  04-solution-packaging.md
  05-ui-plan.md
  06-logic-map.md
  07-integration-map.md
  08-security-profile.md
  09-constraints.md
```

### 5.2 Section File Formats

Each section file follows a standard structure. The exact content varies by section, but every file has:

```markdown
# [Section Title]

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery [CREATE | UPDATE], [date]
**Project:** [project name]

---

[Section content]
```

#### 00-project-identity.md

```markdown
# Project Identity

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

**Project name:** [name]
**Solution prefix:** [publisher prefix, e.g., sdfx_]
**One-line description:** [what it does]
**Primary audience:** [internal | external | mixed]
**Project type:** [greenfield | extension | migration]
```

#### 01-requirements.md

```markdown
# Requirements

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Problem Statement

[What pain point this solution addresses]

## Purpose

[How the solution solves the problem]

## Scope

### In Scope

- [explicit list]

### Out of Scope

- [explicit list]

## Scale

- Expected users: [number or range]
- Expected data volume: [records, growth rate]
- Geographic distribution: [single region | multi-region]

## Extension Context
_(Extension projects only — omit for greenfield)_

- Existing capabilities being extended: [list]
- Entities being modified: [list]

## Migration Context
_(Migration projects only — omit for greenfield)_

- Source system: [name and type]
- Core source data structures: [high-level description]
```

#### 02-architecture-decisions.md

```markdown
# Architecture Decisions

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## App Type

**Decision:** [Model-Driven App | Canvas App | Both | Custom (code-based)]
**Rationale:** [why this type was chosen]

## Platform Characteristics

- Offline capability: [yes | no | not determined]
- External integrations: [yes | no]
- Licensing tier: [per-user | per-app | premium | not determined]

## Architecture Notes

[Any additional architecture context captured during conversation — integration patterns, known constraints, migration-specific UX preservation needs]
```

#### 03-entity-map.md

```markdown
# Entity Map

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Entities

| Entity Name | Description | Ownership |
|---|---|---|
| [name] | [what it represents] | [user | team | org] |

## Relationships

| Parent | Child | Type | Cascade | Notes |
|---|---|---|---|---|
| [parent entity] | [child entity] | [1:N | N:N] | [TBD — refined in schema-design] | [context] |
```

#### 04-solution-packaging.md

```markdown
# Solution Packaging

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Packaging Decision

**Structure:** [Single solution | Multiple solutions]
**Rationale:** [why this structure was chosen]

## Solutions
_(For multi-solution only — single-solution lists one entry)_

| Solution Name | Contains | Dependencies |
|---|---|---|
| [name] | [component types / entity groups] | [prerequisite solutions] |

## Deployment Notes

[Any packaging-specific notes — ISV considerations, layering strategy, managed vs. unmanaged]
```

#### 05-ui-plan.md

```markdown
# UI Plan

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Personas

| Persona | Role | Primary Activities | Data Access |
|---|---|---|---|
| [name] | [role title] | [what they do] | [what they see / edit] |

## Navigation Structure

[App modules, sitemap areas, navigation description — varies by app type]

## Extension Notes
_(Extension projects only)_

- Current navigation: [description]
- Where new features fit: [placement within existing navigation]
```

#### 06-logic-map.md

```markdown
# Logic Map

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Logic Items

| # | Trigger | Action | Entities | Notes |
|---|---|---|---|---|
| 1 | [what triggers it] | [what it does] | [which entities] | [context] |

_Implementation type (plugin, flow, business rule, client script) is determined by the business-logic skill — this map captures what the logic does, not how it's implemented._
```

#### 07-integration-map.md

```markdown
# Integration Map

**Status:** [Complete | Placeholder — not yet completed | No external integrations identified]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Integrations

| # | System | Type | Direction | Frequency | Auth |
|---|---|---|---|---|---|
| 1 | [system name] | [API/DB/SaaS/file] | [in/out/both] | [real-time/scheduled/on-demand] | [method] |

## Migration Integration Notes
_(Migration projects only)_

- Integrations being replicated: [list]
- Integrations being retired: [list]
```

#### 08-security-profile.md

```markdown
# Security Profile

**Status:** [Complete | Placeholder — not yet completed]
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Security Model

**Type:** [role-based | team-based | combination]

## Roles

| Role | Create | Read | Update | Delete | Notes |
|---|---|---|---|---|---|
| [role name] | [scope] | [scope] | [scope] | [scope] | [field-level restrictions, special access] |

_Scope values: all, own, business unit, none, or entity-specific overrides._

## Record Ownership

| Entity | Ownership Type | Rationale |
|---|---|---|
| [entity name] | [user | team | organization] | [why this model] |
```

#### 09-constraints.md

```markdown
# Constraints

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

---

## Hard Constraints

- **Timeline:** [delivery date or "not defined"]
- **Budget:** [cost limitations or "not defined"]
- **Licensing:** [available licenses or "not determined"]
- **Compliance:** [regulatory requirements or "none identified"]
- **Infrastructure:** [environment/tenant constraints or "none identified"]

## Performance Requirements

- Response time targets: [if defined]
- Concurrent user limits: [if defined]

## Known Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | [description] | [what happens if it occurs] | [how to address] |
```

---

## 6. Validation Rules

Each section file is validated before being written. Validation catches structural errors (missing required fields) but does not judge content quality — that's the developer's responsibility during REVIEW.

### 6.1 Per-Section Validation

| Section | Validation rule |
|---|---|
| 00-project-identity | Project name is non-empty. Project type is one of: greenfield, extension, migration. Publisher prefix follows Dataverse naming rules (2–8 lowercase alphanumeric characters). |
| 01-requirements | Problem statement is non-empty. At least 1 in-scope item. |
| 02-architecture-decisions | App type is one of the recognized types. |
| 03-entity-map | At least 2 entities listed. At least 1 relationship documented. |
| 04-solution-packaging | Packaging decision (single or multiple) is stated. If multiple, at least 2 solutions listed with dependencies. |
| 05-ui-plan | At least 1 persona defined (if not placeholder). |
| 06-logic-map | At least 1 logic item (if not placeholder). |
| 07-integration-map | At least 1 integration (if not placeholder or "none identified"). |
| 08-security-profile | Security model type selected (if not placeholder). |
| 09-constraints | At least 1 constraint or explicit "none identified" statement. |

### 6.2 Cross-Section Consistency Checks (REVIEW stage)

During REVIEW, the skill performs cross-section consistency checks:

| Check | Sections involved | What it catches |
|---|---|---|
| Entity references | 03, 05, 06, 07, 08 | Logic map, UI plan, integration map, or security profile references an entity not in the entity map |
| App type alignment | 02, 05 | UI plan describes navigation for a different app type than the architecture decision |
| Integration alignment | 02, 07 | Architecture says "no external integrations" but integration map has entries (or vice versa) |
| Persona-role alignment | 05, 08 | UI plan personas don't map to any security role, or security roles have no corresponding persona |

When a consistency issue is found, the skill presents it as a warning (not an error) and asks the developer to resolve or acknowledge the discrepancy.

---

## 7. Section Classification for Downstream Skills

This section defines which foundation sections each downstream skill requires. This is the contract between solution-discovery and all other skills.

### 7.1 Three-Tier Classification

**Tier 1 — Required (must exist before ANY downstream skill runs):**

| Section | Why it's universally required |
|---|---|
| `00-project-identity` | Every skill needs to know project name, type, and publisher prefix |
| `01-requirements` | Every skill needs scope context to avoid out-of-scope work |
| `02-architecture-decisions` | App type and platform characteristics shape every design decision |

**Tier 2 — Conditionally required (must exist before skills that consume them):**

| Section | Required by | Why |
|---|---|---|
| `03-entity-map` | application-design, schema-design, ui-design, security | Can't model, design schemas, design UI, or design security without knowing the entities |
| `04-solution-packaging` | solution-strategy, alm-workflow | Can't design packaging strategy or ALM without knowing current packaging state |
| `05-ui-plan` | ui-design, schema-design (UX denormalization) | UI design needs personas and navigation; schema needs UI context for denormalization |
| `06-logic-map` | business-logic | Can't design plugins/flows/rules without knowing what logic is needed |
| `07-integration-map` | integration | Can't design connectors/dataflows without knowing what integrates |
| `08-security-profile` | security, ui-design | Security design needs the profile; UI design needs it for visibility rules |
| `09-constraints` | All skills (advisory) | Constraints inform decisions but don't block skill execution |

**Tier 3 — Optional (advisory, never blocks execution):**

| Section | Status |
|---|---|
| `09-constraints` | All skills should read constraints if present, but can proceed without them. Missing constraints are noted in the skill's output as "No constraints documented — validate against constraints when available." |

### 7.2 Downstream Skill INIT Gate Logic

Each downstream skill's INIT stage checks for its required foundation sections:

```
INIT:
  READ .foundation/ directory
  CHECK Tier 1 sections (00, 01, 02) — if ANY missing → BLOCK
    "I need the project foundation before I can proceed. Run solution-discovery first."

  CHECK Tier 2 sections consumed by THIS skill — if ANY missing or placeholder:
    IF placeholder → WARN
      "[Section] is a placeholder. I can proceed with documented assumptions,
       or you can run solution-discovery UPDATE mode to fill it in first.
       Proceed with assumptions?"
    IF missing → BLOCK
      "[Section] does not exist. Run solution-discovery to create it."

  CHECK Tier 3 (09-constraints) — if missing or placeholder → NOTE
    "No constraints documented. I'll proceed without constraint validation.
     Consider filling in constraints later to catch conflicts."
```

---

## 8. Downstream Impact Analysis (UPDATE Mode)

When a foundation section is modified in UPDATE mode, the skill evaluates which downstream skills and sections may be affected. This uses the dependency map from the roadmap's Appendix B.

### 8.1 Impact Map

| Section updated | Downstream sections to review | Downstream skills to warn |
|---|---|---|
| 00-project-identity | None (project identity is declarative) | None — unless project type changed (affects all skills) |
| 01-requirements | 03-entity-map (scope change may add/remove entities) | application-design, schema-design (scope affects model) |
| 02-architecture-decisions | 05-ui-plan (app type change), 06-logic-map (platform change) | ui-design, business-logic, integration |
| 03-entity-map | 06-logic-map, 07-integration-map, 08-security-profile | schema-design, application-design, ui-design, security |
| 04-solution-packaging | None within foundation | solution-strategy, alm-workflow |
| 05-ui-plan | None within foundation | ui-design, schema-design (UX denormalization) |
| 06-logic-map | None within foundation | business-logic |
| 07-integration-map | None within foundation | integration |
| 08-security-profile | None within foundation | security, ui-design |
| 09-constraints | None within foundation | All skills (advisory review) |

### 8.2 Impact Warning Format

After updating a section in UPDATE mode:

```
Section [02-architecture-decisions] updated.

Impact analysis:
  Foundation sections to review:
    ⚠ 05-ui-plan — app type change may affect navigation structure
    ⚠ 06-logic-map — platform change may affect logic implementation options

  Downstream skills with existing output to validate:
    ⚠ ui-design — if docs/ui-design-spec.md exists, review against new architecture
    ⚠ business-logic — if docs/business-logic-inventory.md exists, review logic types

  These are warnings, not automatic invalidations. Review each flagged item
  and update if the change affects it.
```

### 8.3 Special Case — Project Type Change

If `00-project-identity` is updated and the project type changes (e.g., greenfield → extension), the impact warning is elevated:

```
⚠ PROJECT TYPE CHANGED from [old] to [new].

This affects question context in every foundation section. Review all sections
for accuracy — questions were originally phrased for a [old] project.

Recommended: Re-run solution-discovery in CREATE mode with the new project type
to regenerate the full foundation, or manually review each section for type-specific
content that needs updating.
```

---

## 9. Foundation Enrichment Protocol

Other skills (primarily application-design in Mode B) may update foundation sections through the enrichment protocol. This protocol is owned by the enriching skill, not by solution-discovery, but solution-discovery's output format must support it.

### 9.1 Enrichment Rules (enforced by enriching skills)

1. Enrichment may only update existing sections — it cannot create new ones
2. Enrichment may not modify `00-project-identity` — that's the developer's declaration of intent
3. All enrichment changes require developer confirmation before writing
4. Enriched sections receive a metadata comment:

```markdown
<!-- Enriched by [skill-name] [Mode], [date]. Changes: [summary] -->
```

### 9.2 solution-discovery's Responsibility

solution-discovery writes the initial section files. It does not validate enrichment — that responsibility belongs to the enriching skill and the developer. solution-discovery's only requirement is that the section file format is stable enough that other skills can reliably parse and update it. The formats defined in §5.2 are the contract.

---

## 10. Agent Definitions

### 10.1 architecture-advisor

```markdown
# architecture-advisor

## Role
Analyzes project requirements to recommend Power Platform app type and
architecture characteristics. Provides rationale and alternatives so the
developer can make an informed decision.

## Invoked by
solution-discovery skill — ARCHITECTURE stage (§4.5), before presenting
the app type recommendation to the developer.

## Input context
- 00-project-identity.md (project type, audience)
- 01-requirements.md (problem, scope, scale)
- Environment context from .pp-context/ (if available)

## Analysis process
1. Read project identity for type (greenfield/extension/migration) and audience
2. Read requirements for:
   - Scale indicators (user count, data volume, geographic distribution)
   - UX indicators (mentions of mobile, offline, custom UI, pixel-precise layouts)
   - Integration indicators (external APIs, legacy systems)
   - Data complexity indicators (entity count from requirements scope)
3. If pp-research is available: query Microsoft Learn for current app type
   guidance and licensing considerations
4. Evaluate each app type against the requirements:
   - Model-Driven: strong for data-heavy, forms-based, role-secured workflows
   - Canvas: strong for custom UX, mobile-first, pixel control, embedded scenarios
   - Both: strong when internal operations (MDA) + field/mobile (Canvas) coexist
   - Custom: strong when platform controls cannot meet UX requirements
5. Select the app type with the strongest requirement alignment
6. Identify the runner-up and explain what would tip the decision the other way

## Output format
Return a structured recommendation:
- Recommended app type with rationale
- Runner-up app type with trade-off explanation
- Platform characteristics assessment (offline need, integration complexity,
  licensing considerations)
- Cited documentation sources (if pp-research retrieved them)

## Evaluation criteria (ordered by priority)
1. Requirement alignment — does the app type serve the stated requirements?
2. Scale fit — can the app type handle the projected user count and data volume?
3. Licensing efficiency — does the recommendation minimize licensing cost?
4. Complexity fit — does the recommendation match a solo developer's capacity?

## Does not
- Make the decision for the developer — presents recommendation with rationale
- Consider budget constraints (those are captured later in CONSTRAINTS stage)
- Execute any PAC CLI commands or modify the environment
- Access external APIs directly — uses pp-research if available, works from
  knowledge base if not
```

---

## 11. Handoff Contract — solution-discovery → all downstream skills

### 11.1 What solution-discovery produces

| Artifact | Path | Always present? |
|---|---|---|
| State file | `.foundation/.discovery-state.json` | Yes |
| Project identity | `.foundation/00-project-identity.md` | Yes |
| Requirements | `.foundation/01-requirements.md` | Yes |
| Architecture decisions | `.foundation/02-architecture-decisions.md` | Yes |
| Entity map | `.foundation/03-entity-map.md` | Yes |
| Solution packaging | `.foundation/04-solution-packaging.md` | Yes |
| UI plan | `.foundation/05-ui-plan.md` | Yes (may be placeholder) |
| Logic map | `.foundation/06-logic-map.md` | Yes (may be placeholder) |
| Integration map | `.foundation/07-integration-map.md` | Yes (may be placeholder or "none") |
| Security profile | `.foundation/08-security-profile.md` | Yes (may be placeholder) |
| Constraints | `.foundation/09-constraints.md` | Yes |

### 11.2 What downstream skills may assume

1. If `.discovery-state.json` shows `"stage": "COMPLETE"`, all 10 section files exist
2. Tier 1 sections (00, 01, 02) always have content (never placeholders)
3. Tier 2 sections may be placeholders — check for `**Status:** Placeholder` line
4. Section file format follows the specifications in §5.2 — field names and structure are stable
5. Entity names in sections 05–08 reference entities listed in section 03

### 11.3 What downstream skills may NOT assume

1. That all conditional sections have content — always check for placeholder status
2. That section content is complete or accurate — the developer may have left gaps
3. That enrichment has not modified sections — check for enrichment metadata comments
4. That the foundation was created in one session — sections may have been created across multiple sessions or updated via UPDATE mode

### 11.4 Suggestive Handoff

solution-discovery suggests the next skill at COMPLETE (§4.14) but does NOT automatically invoke it. The developer explicitly chooses what to work on next. This preserves developer agency and avoids creating a rigid workflow pipeline.

---

## 12. Decision Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Fixed conversation order (00 → 09) | Later sections build on earlier ones — entity map references architecture decisions, logic map references entities. Fixed order guarantees context flows forward. Skipping is handled by placeholder files rather than reordering. |
| 2 | Resume at last incomplete section with status summary | Resuming at the first incomplete section preserves fixed-order integrity. The status summary gives the developer visibility into progress without requiring a menu choice — reducing overhead when picking up partial work across sessions. |
| 3 | Section-level UPDATE mode with downstream impact warnings | Re-running the full CREATE flow for a single-section change is wasteful. Dedicated UPDATE mode targets the specific section. Impact warnings let the developer assess downstream effects without auto-invalidating sections that may still be correct. |
| 4 | Three-tier section classification (required / conditional / optional) | Requiring all 10 sections before any downstream skill runs blocks progress unnecessarily. Tier 1 (always required) gates on the minimum context every skill needs. Tier 2 (conditionally required) gates only the skills that consume specific sections. Tier 3 (optional) never blocks. |
| 5 | Single adaptive flow with project-type context injection | Three parallel flows (greenfield / extension / migration) triple maintenance for ~15% question variation. Project type is captured in section 00 and modifies question phrasing in subsequent stages — same section structure, different question context. |
| 6 | Placeholder files for skipped sections | Placeholder files are better than absent files because downstream skills can distinguish "not yet filled" from "file missing due to error." The placeholder includes the skip reason and a standard header that downstream skills detect programmatically. |
| 7 | Suggestive handoff, not automatic invocation | Auto-starting the next skill removes developer agency. A solo developer may want to review the foundation, take a break, or work on a different skill than the one suggested. Suggestion with explicit confirmation respects the developer's workflow. |
| 8 | Cross-section consistency checks as warnings, not errors | False positives in consistency checks (e.g., persona names don't exactly match role names but are clearly the same person) would block the developer unnecessarily. Warnings surface the issue; the developer decides whether it needs fixing. |
| 9 | architecture-advisor as the only agent in solution-discovery | Other stages (requirements, entity map, etc.) are conversational — the developer provides the answers. Architecture is the one stage where analytical recommendation adds value because app type selection has measurable trade-offs that benefit from structured evaluation. |
| 10 | Update tracking in .discovery-state.json | Recording what was updated, when, and what impact warnings were generated creates an audit trail. When downstream skills encounter unexpected foundation content, they can check the update history to understand if and why it changed. |

---

## 13. Open Items for Build

- **Publisher prefix validation:** The Dataverse publisher prefix validation rule (2–8 lowercase alphanumeric) should be confirmed against current Microsoft documentation at build time. The rule may have changed or have additional restrictions (reserved prefixes, etc.).
- **pp-research integration for architecture-advisor:** When pp-research is available, the architecture-advisor agent should query Microsoft Learn for current app type guidance. Define the specific documentation pages to query and how to handle pp-research being unavailable (fall back to built-in knowledge).
- **Question phrasing refinement:** The question wordings in §4 are design-phase drafts. During build, refine phrasing based on how Claude Code actually presents them — conversational tone may need adjustment for the terminal context vs. the chat interface these were drafted in.
- **Placeholder detection reliability:** Downstream skills detect placeholders by checking for `**Status:** Placeholder` text. If a developer manually edits a foundation file and removes this line, the placeholder detection fails silently. Consider whether a more robust detection mechanism is needed (e.g., checking `.discovery-state.json` status field instead of file content).
- **Session boundary handling:** If a session ends mid-stage (e.g., the developer has answered 2 of 3 questions in a round), the current stage is marked `in-progress` in `.discovery-state.json`. On resume, should the skill re-ask all questions in the current stage, or attempt to detect what's already been answered? For Phase 1, re-asking the current stage is simpler and avoids partial-state complexity.
- **Entity map format alignment with schema-design:** The entity map format (§5.2, section 03) uses a simple table. schema-design may need additional entity attributes (e.g., estimated record count, primary name column). Confirm at build time whether schema-design's INIT stage needs to parse additional fields from the entity map, and if so, extend the format before solution-discovery is built.
- **Constraint section extensibility:** `09-constraints.md` has a fixed set of constraint categories. Projects may have constraints that don't fit these categories (e.g., accessibility requirements, localization requirements). Consider whether the format should include a "custom constraints" catch-all section.
- **Multi-session CREATE flow:** The design assumes a developer may CREATE a foundation across multiple sessions (resume behavior, §3.3). Confirm that `.discovery-state.json` persistence works correctly across Claude Code session boundaries — specifically, that the file is written after each stage transition and survives session restart.