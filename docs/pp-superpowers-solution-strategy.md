# pp-superpowers — solution-strategy Skill Specification

**Version:** 1.0
**Date:** April 2, 2026
**Author:** SDFX Studios
**Status:** Approved for build
**Parent document:** pp-superpowers Design Roadmap v1.0

---

## 1. Skill Overview

| Attribute | Value |
|---|---|
| **Name** | solution-strategy |
| **Skill number** | 1 |
| **Domain** | Solution packaging architecture, environment promotion, dependency management |
| **Lifecycle group** | Discover |
| **Has sub-skills** | No — single sequential workflow with two operating modes |
| **Foundation sections consumed** | `00-project-identity`, `01-requirements`, `02-architecture-decisions`, `04-solution-packaging` |
| **Foundation sections produced** | Updates `04-solution-packaging` (enrichment — preserves original, appends new sections) |
| **Upstream dependency** | solution-discovery (foundation must exist with COMPLETE state) |
| **Downstream handoff** | application-design (default), schema-design, alm-workflow, environment-setup |
| **Agents** | None |

### 1.1 Purpose

solution-strategy deepens the packaging decisions made during solution-discovery. solution-discovery captures the initial single-vs-multi-solution choice; solution-strategy refines that decision with environment promotion paths, deployment planning, dependency graphs (for multi-solution), and versioning strategy.

This skill is paired with solution-discovery in Phase 1 because it directly operates on `04-solution-packaging.md` while the packaging context is fresh. Building it in the same phase avoids revisiting solution-discovery's output format later.

### 1.2 Relationship to Other Skills

**solution-discovery (upstream):** Produces the initial `04-solution-packaging.md` that solution-strategy reads and enriches. solution-discovery's COMPLETE stage suggests solution-strategy when packaging is multi-solution.

**application-design:** May signal that multi-solution architecture is warranted. application-design's bounded context analysis (§4.4 in application-design spec) presents a tension signal when 3+ bounded contexts exist but packaging specifies a single solution. The developer may return to solution-strategy to re-evaluate.

**alm-workflow (downstream):** Reads the environment promotion map and deployment plan from `04-solution-packaging.md` to drive export/deploy procedures.

**environment-setup (downstream):** Reads connection references and environment variables from `04-solution-packaging.md` to configure target environments.

### 1.3 When to Use This Skill

solution-strategy adds value when:

- **Multi-solution packaging** — dependency graphs, layering strategy, and deployment sequencing need explicit design
- **ISV distribution** — solution segmentation, managed-only distribution, and licensing tier separation require deliberate architecture
- **Complex environments** — 3+ environments with different managed/unmanaged states, connection references, and environment variables
- **Any project** — even single-solution greenfield projects benefit from documenting the environment promotion path and deployment plan (fast path handles this efficiently)

solution-strategy is optional but recommended. solution-discovery's COMPLETE stage suggests it when packaging is multi-solution. Developers may also invoke it directly when they want to formalize deployment planning.

---

## 2. Mode Architecture

solution-strategy supports two operating modes, determined at INIT.

### 2.1 CREATE Mode — New Strategy

**When:** No `.foundation/.strategy-state.json` exists, or it exists with a stage other than COMPLETE (resume).

**Process:** Walk through the stages in order. The conversation adapts based on the ASSESS stage outcome — simple projects take the fast path (abbreviated flow), complex projects take the full path (all stages).

**Exit:** After REVIEW stage confirms all decisions, the skill transitions to COMPLETE, writes the updated `04-solution-packaging.md`, and suggests the next skill.

### 2.2 UPDATE Mode — Revise Strategy

**When:** `.foundation/.strategy-state.json` exists with `"stage": "COMPLETE"`. The developer wants to revise specific strategy decisions (e.g., after application-design revealed bounded contexts that warrant multi-solution, or after a deployment constraint changed).

**Process:** The developer specifies which aspect to update (packaging structure, environment map, or deployment plan). The skill loads the current `04-solution-packaging.md`, presents the relevant sections, and conducts a focused conversation to modify them. After updates are confirmed, the skill re-runs REVIEW validation against the foundation.

**Exit:** After the update is written and downstream impact warnings are presented, the skill returns to COMPLETE.

### 2.3 Mode Selection Logic

```
INIT:
  IF .foundation/ does not exist → BLOCK
    "No project foundation found. Run solution-discovery first."
  IF .foundation/04-solution-packaging.md does not exist or is placeholder → BLOCK
    "Solution packaging section is missing or incomplete. Run solution-discovery first."
  IF .strategy-state.json does not exist → CREATE mode
  IF .strategy-state.json exists AND stage != COMPLETE → RESUME (CREATE mode, pick up at last incomplete stage)
  IF .strategy-state.json exists AND stage == COMPLETE:
    → Ask: "Your solution strategy is complete. Would you like to update it?"
    → If yes → UPDATE mode (developer specifies aspect)
    → If no → suggest downstream skill and exit
```

---

## 3. State Machine

### 3.1 CREATE Mode State Machine

**Full path:**

```
INIT → ASSESS → PACKAGING_DESIGN → ENVIRONMENT_MAP → DEPLOYMENT_PLAN → REVIEW → COMPLETE
```

**Fast path** (determined at ASSESS):

```
INIT → ASSESS → ENVIRONMENT_MAP → DEPLOYMENT_PLAN → REVIEW → COMPLETE
```

| Stage | What it produces | Required | Full path | Fast path |
|---|---|---|---|---|
| INIT | Loads foundation, selects mode | Yes | Yes | Yes |
| ASSESS | Assessment result (fast/full path determination) | Yes | Yes | Yes |
| PACKAGING_DESIGN | Solution boundaries, dependency graph, layering | Conditional | Yes | Skipped |
| ENVIRONMENT_MAP | Environment promotion table, connection references | Yes | Yes | Yes |
| DEPLOYMENT_PLAN | Versioning strategy, deployment type, rollback | Yes | Yes | Yes |
| REVIEW | Validates all decisions against foundation | Yes | Yes | Yes |
| COMPLETE | Writes enriched `04-solution-packaging.md`, suggests next skill | Yes | Yes | Yes |

**Fast path criteria** (all must be true):
- Solution packaging says "Single solution"
- No ISV distribution need
- Single development team
- No multi-tenant requirements
- Developer confirms single-solution is appropriate

When fast path is active, PACKAGING_DESIGN is skipped entirely — the single-solution decision from solution-discovery is confirmed during ASSESS. ENVIRONMENT_MAP and DEPLOYMENT_PLAN still execute but with abbreviated question sets (3 focused questions instead of the full rounds).

### 3.2 UPDATE Mode State Machine

```
INIT → ASPECT_SELECT → ASPECT_UPDATE → REVIEW → COMPLETE
```

| Stage | What happens |
|---|---|
| INIT | Reads `.strategy-state.json`, confirms COMPLETE state, enters UPDATE mode |
| ASPECT_SELECT | Developer specifies which aspect to update: packaging structure, environment map, or deployment plan |
| ASPECT_UPDATE | Loads current `04-solution-packaging.md`, presents relevant sections, conducts focused conversation to modify |
| REVIEW | Re-validates updated strategy against foundation requirements |
| COMPLETE | Writes updated `04-solution-packaging.md`, presents downstream impact warnings |

### 3.3 Resume Behavior

When INIT detects `.strategy-state.json` exists but shows a stage other than COMPLETE:

1. Read `.strategy-state.json` to determine the last completed stage and assessment result
2. Present a status summary showing completed stages and remaining stages
3. Auto-position at the first incomplete stage
4. Continue the flow from that point (using the stored assessment result to determine fast/full path)

**Status summary format:**

```
Solution strategy status for [project name]:

  ✓ ASSESS — [single-confirmed / multi-required / isv-segmented]
  ✓ PACKAGING_DESIGN — [N] solutions defined with dependency order
  ✗ ENVIRONMENT_MAP — not started
  · DEPLOYMENT_PLAN — not started
  · REVIEW — not started

Resuming at stage: ENVIRONMENT_MAP.
```

### 3.4 State File Specification

`.foundation/.strategy-state.json`:

```json
{
  "version": "1.0",
  "projectName": "ProjectCentral",
  "mode": "CREATE",
  "stage": "ENVIRONMENT_MAP",
  "assessmentResult": "single-confirmed",
  "path": "fast",
  "stages": {
    "ASSESS": { "status": "complete", "completedAt": "2026-04-02T10:00:00Z" },
    "PACKAGING_DESIGN": { "status": "skipped", "reason": "fast path — single solution confirmed" },
    "ENVIRONMENT_MAP": { "status": "in-progress", "startedAt": "2026-04-02T10:15:00Z" },
    "DEPLOYMENT_PLAN": { "status": "not-started" },
    "REVIEW": { "status": "not-started" }
  },
  "lastUpdated": "2026-04-02T10:15:00Z",
  "updates": []
}
```

**Status values:** `not-started`, `in-progress`, `complete`, `skipped`

**Assessment result values:** `single-confirmed`, `multi-required`, `isv-segmented`

**Path values:** `fast`, `full`

**Update tracking (UPDATE mode):** When an aspect is modified in UPDATE mode, an entry is added to the `updates` array:

```json
{
  "aspect": "environment-map",
  "updatedAt": "2026-04-15T14:00:00Z",
  "reason": "Added UAT environment after compliance review",
  "impactWarnings": ["alm-workflow", "environment-setup"]
}
```

---

## 4. Conversation Flow and Gating Logic

Each stage conducts a structured conversation organized into rounds. The skill does not proceed to the next stage until the gate condition is met.

### 4.1 Foundation Context Injection

At INIT, the skill reads the consumed foundation sections and uses them as context throughout the conversation:

| Foundation section | Context extracted |
|---|---|
| `00-project-identity` | Project name, type (greenfield/extension/migration), publisher prefix, audience |
| `01-requirements` | Scale (user count, data volume), scope, integration needs |
| `02-architecture-decisions` | App type, platform characteristics, licensing tier |
| `04-solution-packaging` | Current packaging decision (single/multi), solution table, deployment notes |

This context shapes question phrasing and recommendations throughout the workflow.

### 4.2 Stage: INIT

**What happens:**

1. Check for `.foundation/` directory and required sections (00, 01, 02, 04)
2. If any required section is missing or placeholder → BLOCK with guidance
3. Check for `.strategy-state.json`:
   - If absent → announce CREATE mode, proceed to ASSESS
   - If present, stage != COMPLETE → present status summary (§3.3), resume
   - If present, stage == COMPLETE → ask if developer wants to UPDATE or proceed to another skill
4. Read all four consumed foundation sections into context

**No questions asked.** INIT is a routing stage.

### 4.3 Stage: ASSESS

The ASSESS stage evaluates the current packaging decision and determines whether the fast path or full path is appropriate.

**Round 1 — Present current state:**

Present a summary of the current packaging decision from `04-solution-packaging.md`:

> "Your current solution packaging:
> - **Structure:** [Single solution / Multiple solutions]
> - **Rationale:** [rationale from discovery]
> - **Entity count:** [N] entities from your entity map
> - **Project type:** [greenfield / extension / migration]
> - **Scale:** [user count], [data volume]
>
> I'll evaluate whether this packaging needs refinement."

**Round 2 — Decision tree:**

Walk through the decision tree to determine if multi-solution is warranted. Ask only the questions whose answers are not already evident from the foundation:

> 1. [If single-solution] Is this solution distributed to external customers (ISV / AppSource)?
> 2. [If single-solution] Are there multiple development teams working on separate components?
> 3. [If single-solution] Will any components be shared across multiple apps or solutions in the future?

**Decision logic:**

```
IF 04-solution-packaging says "Multiple solutions" → full path (assessmentResult: multi-required)
IF ISV distribution → full path (assessmentResult: isv-segmented)
IF multiple dev teams with component separation → full path (assessmentResult: multi-required)
IF components shared across future apps → ask developer if they want to split now or later:
  → If split now → full path (assessmentResult: multi-required)
  → If later → fast path (assessmentResult: single-confirmed)
IF none of the above → fast path (assessmentResult: single-confirmed)
```

**Round 3 — Path announcement:**

> [Fast path]: "Your single-solution packaging is appropriate for this project. I'll confirm the decision and add environment promotion and deployment planning."
>
> [Full path]: "Your project needs multi-solution architecture. I'll walk you through solution boundaries, dependency design, environment promotion, and deployment planning."

**Gate:** Decision tree completed. Path (fast/full) determined and announced.

**Project-type variations:**

| Type | Additional context |
|---|---|
| Extension | "What solution(s) already exist in the target environment? Your new components will need to coexist with or depend on them." |
| Migration | "Will the migration be deployed alongside the existing system during transition, or will it fully replace it?" |

### 4.4 Stage: PACKAGING_DESIGN (full path only)

This stage is skipped on the fast path. On the full path, it defines solution boundaries and dependencies.

**Round 1 — Solution domain identification:**

> "Let's define your solution boundaries. Based on your [N] entities and [M] integrations, I see these natural grouping options:
>
> - **By functional domain:** Group related entities and logic into domain-specific solutions
> - **By team ownership:** Each development team owns a separate solution
> - **By distribution tier:** Base solution + premium add-on solutions (ISV)
> - **By update frequency:** Stable foundation vs. frequently-changing logic
>
> Which approach best fits your project? Or describe your own grouping."

**Round 2 — Solution definition:**

For each solution the developer defines:

> "For each solution, tell me:
> 1. **Solution name** (using your publisher prefix: [prefix]_)
> 2. **What it contains** — which entities, apps, flows, and components
> 3. **Dependencies** — which other solutions must be installed first"

Present back as a table for confirmation.

**Round 3 — Dependency validation:**

> Present the dependency graph as a text diagram:
>
> ```
> [base_solution]
>   └── [extension_a]
>   └── [extension_b]
>         └── [extension_c]
> ```
>
> "Does this dependency order look correct? Dependencies flow from top to bottom — parent solutions must be installed before children."

**Round 4 — Layering strategy (ISV only):**

> [If assessmentResult is isv-segmented]:
> "For ISV distribution, let's define your layering strategy:
> 1. **Base layer:** Which solution is the managed foundation that all customers receive?
> 2. **Extension layers:** Which solutions are optional add-ons or premium tiers?
> 3. **Customer customization boundary:** What can customers customize without breaking your solution? (Typically: adding columns, views, dashboards — but NOT modifying your managed components)"

**Gate:** At least 2 solutions defined (for multi-solution). Each solution has a name, contents, and dependency list. Dependency graph has no circular references.

**Project-type variation:**

| Type | Additional question |
|---|---|
| Extension | "Which existing solutions in the target environment will your new solutions depend on? Do any of your solutions extend existing solution components?" |
| Migration | "Will the migration be delivered as a single deployment or phased? If phased, which solution contains the first migration batch?" |

### 4.5 Stage: ENVIRONMENT_MAP

**Full path — Round 1 — Environment inventory:**

> "How many environments will this project use? Common patterns:
>
> - **Minimal (2):** Dev + Prod (small team, low risk)
> - **Standard (3):** Dev + Test + Prod (with QA validation)
> - **Enterprise (4+):** Dev + Test + UAT + Prod (with formal acceptance)
>
> List your environments in promotion order (from development to production)."

**Full path — Round 2 — Environment details:**

For each environment:

> "For [environment name]:
> 1. **Purpose:** What happens here? (Active development / QA testing / User acceptance / Production)
> 2. **Solution state:** Managed or unmanaged?
> 3. **Who has access?** (Developers only / QA team / Business users / Everyone)
> 4. **Data:** Production data, test data, or synthetic data?"

**Full path — Round 3 — Connection references and environment variables:**

> "Do you have any values that change between environments?
>
> - **Connection references:** External system connections that differ per environment (e.g., API endpoints, service accounts)
> - **Environment variables:** Configuration values that differ per environment (e.g., email addresses, feature flags, URLs)
>
> List each with its dev and production values. Test/UAT values can be defined later."

Present the environment map as a table for confirmation.

**Fast path — Abbreviated (single round):**

> "Let's document your environment promotion path. For a [project type] project of this scale, I recommend:
>
> | Environment | Type | Solution State | Purpose |
> |---|---|---|---|
> | Dev | Development | Unmanaged | Active development |
> | [Prod or Test+Prod] | Production | Managed | [Live system] |
>
> Does this match your setup, or do you need additional environments?"

One follow-up for connection references if the developer has any.

**Gate:** At least 2 environments defined. Each has a purpose and managed/unmanaged state specified. Promotion order is clear.

### 4.6 Stage: DEPLOYMENT_PLAN

**Full path — Round 1 — Versioning strategy:**

> "What versioning strategy should your solution(s) use?
>
> - **Semantic versioning** (recommended): major.minor.build.revision
>   - Major: breaking changes or major feature releases
>   - Minor: new features, non-breaking changes
>   - Build: incremental builds during development
>   - Revision: patches and hotfixes
>
> - **Date-based versioning:** year.month.day.build (useful for regular release cadences)
>
> - **Sequential versioning:** incrementing build numbers (simplest, least informative)
>
> Which approach fits your team?"

**Full path — Round 2 — Deployment type:**

> "How should solution updates be applied in downstream environments?
>
> - **Upgrade** (recommended for most projects): Replaces the existing solution with the new version. All customizations in managed layers are preserved.
> - **Patch:** Applies incremental changes without a full solution version bump. Useful for hotfixes, but has limitations (cannot add new components).
> - **Both:** Upgrades for planned releases, patches for emergency fixes.
>
> Which deployment approach do you need?"

**Full path — Round 3 — Rollback and sequence:**

> "Two final deployment questions:
>
> 1. **Rollback procedure:** If a deployment fails or causes issues, what is the recovery plan?
>    - Restore from environment backup (recommended for Dataverse)
>    - Uninstall and reinstall previous version
>    - Forward-fix (deploy a corrected version)
>
> 2. [Multi-solution only] **Deployment sequence:** What order should solutions be deployed?
>    (This should match your dependency graph — base solutions first, extensions after.)"

**Fast path — Abbreviated (single round):**

> "For deployment planning:
>
> 1. **Versioning:** I recommend semantic versioning (major.minor.build.revision) for your project. Does that work?
> 2. **Deployment type:** Managed solution upgrade is standard. Any need for patch deployments?
> 3. **Rollback:** Environment backup before each deployment is the standard safety net. Any additional rollback requirements?"

**Gate:** Versioning strategy selected. Deployment type decided. Rollback procedure documented (even if minimal).

### 4.7 Stage: REVIEW

**What happens:**

1. Present a strategy summary showing all decisions made:

```
Solution Strategy Summary for [Project Name]
=============================================

Assessment: [single-confirmed / multi-required / isv-segmented]
Path: [fast / full]

Packaging
─────────
  Structure: [Single solution / N solutions]
  [If multi-solution:]
    Solutions: [list with dependencies]
    Dependency graph: [text diagram]
    Layering: [base + extensions description]

Environment Promotion
─────────────────────
  Environments: [N] ([names in order])
  Promotion path: [env1] → [env2] → ... → [prod]
  Connection references: [N] defined
  Environment variables: [N] defined

Deployment Plan
───────────────
  Versioning: [strategy]
  Deployment type: [upgrade / patch / both]
  Rollback: [procedure]
  [If multi-solution:] Deployment sequence: [order]

───────────────────────────────────────────
Confirm this strategy? [yes / request changes]
```

2. Run cross-reference validation checks:

| Check | Sections involved | What it catches |
|---|---|---|
| Environment-constraint alignment | Environment map, `09-constraints` | Infrastructure constraints conflict with environment plan (e.g., constraints say "single tenant" but environments span tenants) |
| Packaging-architecture alignment | Packaging, `02-architecture-decisions` | App type implies complexity that contradicts packaging simplicity (or vice versa) |
| Scale-environment alignment | Environment count, `01-requirements` | High user count / data volume with minimal environments (no test/UAT) |
| Dependency-entity alignment | Solution boundaries, `03-entity-map` (if read) | Solution claims to contain entities not in the entity map |

3. Present any warnings found. Ask the developer to resolve or acknowledge.

4. If changes requested → return to the relevant stage, then re-present REVIEW.

**Gate:** Developer explicitly confirms the strategy is complete and accurate.

### 4.8 Stage: COMPLETE

**What happens:**

1. Write the enriched `04-solution-packaging.md` (see §5 for format)
2. Write `.strategy-state.json` with `"stage": "COMPLETE"`
3. Present the downstream skill suggestion

**Suggestion logic:**

```
IF application-design has not been completed → suggest application-design
  "Your solution strategy is set. I'd suggest application-design next to model
   your domain with DDD before moving to schema-design."

ELSE IF schema-design has not been completed → suggest schema-design
  "Your solution strategy is set. With application-design complete, schema-design
   is the natural next step to define your Dataverse tables."

ELSE → suggest the developer's choice
  "Your solution strategy is set. Which skill would you like to work on next?"
```

4. Present other available options:

```
Other options:
  - schema-design — start data modeling
  - application-design — model your domain with DDD
  - Any other skill — the foundation supports all downstream skills
```

5. Wait for explicit developer confirmation. Do not auto-start the next skill.

---

## 5. Output Specifications

### 5.1 Updated 04-solution-packaging.md

solution-strategy enriches the existing `04-solution-packaging.md` written by solution-discovery. The original content (Packaging Decision, Solutions, Deployment Notes) is preserved. New sections are appended.

**Enrichment metadata:** An HTML comment is added after the header to mark the enrichment:

```markdown
<!-- Enriched by solution-strategy [CREATE | UPDATE], [date]. Changes: [summary] -->
```

**Updated file structure (after enrichment):**

```markdown
# Solution Packaging

**Status:** Complete
**Written by:** solution-discovery CREATE, [date]
**Project:** [project name]

<!-- Enriched by solution-strategy CREATE, [date]. Changes: added environment promotion map, deployment plan[, solution dependencies] -->

---

## Packaging Decision

**Structure:** [Single solution | Multiple solutions]
**Rationale:** [rationale from solution-discovery, potentially expanded by solution-strategy]

## Solutions

| Solution Name | Contains | Dependencies |
|---|---|---|
| [name] | [component types / entity groups] | [prerequisite solutions] |

## Solution Dependencies
_(Multi-solution only — added by solution-strategy)_

**Dependency graph:**

```
[base_solution]
  └── [extension_a]
  └── [extension_b]
        └── [extension_c]
```

**Layering strategy:** [base + extension description, ISV customization boundaries if applicable]

## Environment Promotion Map

| Environment | Type | Solution State | Purpose | Data | Access |
|---|---|---|---|---|---|
| Dev | Development | Unmanaged | Active development | Test data | Developers |
| Test | Testing | Managed | QA validation | Test data | QA team |
| UAT | Pre-production | Managed | User acceptance | Production copy | Business users |
| Prod | Production | Managed | Live system | Production | All users |

**Promotion path:** Dev → Test → UAT → Prod

## Connection References

| Name | Type | Dev Value | Prod Value | Notes |
|---|---|---|---|---|
| [name] | [Connection reference | Environment variable] | [dev value] | [prod value] | [purpose] |

_(If no connection references: "No connection references identified. Add them when external integrations are configured.")_

## Deployment Plan

- **Versioning strategy:** [Semantic versioning: major.minor.build.revision | Date-based | Sequential]
- **Deployment type:** [Managed solution upgrade | Patch | Both — upgrades for releases, patches for hotfixes]
- **Rollback procedure:** [Environment backup restoration | Uninstall and reinstall previous | Forward-fix]
- **Deployment sequence:** [For multi-solution: ordered list matching dependency graph]

## Deployment Notes

[Original content from solution-discovery, potentially extended by solution-strategy]
```

### 5.2 Enrichment Protocol

solution-strategy follows the foundation enrichment protocol defined in solution-discovery §9:

1. Enrichment updates existing sections — it does not create new foundation files
2. Enrichment does not modify `00-project-identity`
3. All enrichment changes require developer confirmation before writing (REVIEW stage)
4. Enriched sections receive the metadata comment

**What solution-strategy may modify in the original content:**

- **Rationale** in Packaging Decision — may be expanded with strategy analysis context
- **Solutions table** — may be expanded (new solutions added for multi-solution) or refined (component assignments clarified)
- **Deployment Notes** — may be extended with strategy-specific notes

**What solution-strategy appends:**

- Solution Dependencies section (multi-solution only)
- Environment Promotion Map section
- Connection References section
- Deployment Plan section

### 5.3 Interaction with solution-discovery UPDATE mode

If the developer later runs solution-discovery UPDATE mode and changes `04-solution-packaging.md`, the enrichment sections added by solution-strategy may be affected. solution-discovery's impact analysis (§8 in solution-discovery spec) already warns about solution-strategy when section 04 is updated.

**Protocol:** When solution-discovery UPDATE mode rewrites `04-solution-packaging.md`:
- The enrichment comment is preserved as a warning marker
- solution-discovery's impact warning includes: "solution-strategy has enriched this section with environment promotion and deployment planning. Re-run solution-strategy after this update if the packaging decision changed."

---

## 6. Validation Rules

### 6.1 Per-Stage Validation

| Stage | Validation rule |
|---|---|
| ASSESS | Assessment result is one of: `single-confirmed`, `multi-required`, `isv-segmented`. Path is one of: `fast`, `full`. |
| PACKAGING_DESIGN | At least 2 solutions defined (multi-solution). Each has name, contents, dependencies. No circular dependencies in the graph. |
| ENVIRONMENT_MAP | At least 2 environments defined. Each has purpose and managed/unmanaged state. Promotion order is specified. |
| DEPLOYMENT_PLAN | Versioning strategy selected. Deployment type decided. Rollback procedure documented. |
| REVIEW | Cross-reference checks pass or warnings acknowledged. Developer explicitly confirms. |

### 6.2 Cross-Reference Validation (REVIEW stage)

| Check | Sections involved | What it catches |
|---|---|---|
| Environment-constraint alignment | Environment map, `09-constraints.md` | Environments contradict infrastructure constraints |
| Packaging-architecture alignment | Packaging, `02-architecture-decisions.md` | Complex app type with oversimplified packaging (or vice versa) |
| Scale-environment alignment | Environment count, `01-requirements.md` | Large-scale project with too few environments for proper validation |
| Dependency-entity alignment | Solution boundaries, `03-entity-map.md` | Solutions reference entities not in the entity map |

Validation issues are presented as warnings, not errors. The developer decides whether each issue needs resolution.

---

## 7. Handoff Contract — solution-strategy → downstream skills

### 7.1 What solution-strategy produces

| Artifact | Path | Always present? |
|---|---|---|
| State file | `.foundation/.strategy-state.json` | Yes |
| Enriched packaging | `.foundation/04-solution-packaging.md` | Yes (enriched with new sections) |

### 7.2 What downstream skills may assume

1. If `.strategy-state.json` shows `"stage": "COMPLETE"`, the enriched `04-solution-packaging.md` contains environment promotion map and deployment plan sections
2. The enrichment comment `<!-- Enriched by solution-strategy -->` is present in the file
3. The original solution-discovery content (Packaging Decision, Solutions, Deployment Notes) is preserved
4. If the assessment was `multi-required` or `isv-segmented`, the Solution Dependencies section exists

### 7.3 What downstream skills may NOT assume

1. That solution-strategy has been run — it is recommended but optional
2. That enrichment sections exist in `04-solution-packaging.md` — always check for the enrichment comment
3. That connection references are complete — they may be added incrementally as integrations are configured
4. That environment details are final — environment setup may reveal additional needs

### 7.4 Downstream Impact Warnings (UPDATE mode)

When solution-strategy UPDATE mode modifies `04-solution-packaging.md`:

| Aspect updated | Downstream impact |
|---|---|
| Packaging structure changed (single → multi or vice versa) | alm-workflow, environment-setup — deployment procedures need revision |
| Environment map changed | environment-setup — environment configuration needs updating |
| Deployment plan changed | alm-workflow — export/deploy procedures need updating |
| Connection references changed | environment-setup — connection configuration needs updating |

**Warning format:**

```
Solution strategy aspect [environment-map] updated.

Impact analysis:
  Downstream skills to review:
    ⚠ alm-workflow — if ALM procedures have been configured, review promotion steps
    ⚠ environment-setup — if environments have been provisioned, review configuration

  These are warnings, not automatic invalidations. Review each flagged item
  and update if the change affects it.
```

---

## 8. Decision Tree — Single vs. Multi-Solution

This decision tree is executed during the ASSESS stage. It is the primary analytical tool for determining the appropriate packaging architecture.

### 8.1 Decision Flow

```
START: Read 04-solution-packaging.md

Q1: Does solution-discovery already specify multiple solutions?
  → Yes: assessmentResult = multi-required, path = full
  → No: Continue to Q2

Q2: Is this solution distributed to external customers (ISV / AppSource)?
  → Yes: assessmentResult = isv-segmented, path = full
  → No: Continue to Q3

Q3: Are there multiple development teams working on separate components?
  → Yes: assessmentResult = multi-required, path = full
  → No: Continue to Q4

Q4: Will any components be shared across multiple apps or solutions in the future?
  → Yes: Ask developer — split now or defer?
    → Split now: assessmentResult = multi-required, path = full
    → Defer: assessmentResult = single-confirmed, path = fast
  → No: assessmentResult = single-confirmed, path = fast
```

### 8.2 Multi-Solution Boundary Patterns

When multi-solution is warranted, recommend one of these grouping strategies:

| Pattern | When to use | Example |
|---|---|---|
| **By functional domain** | Entities and logic cluster naturally into distinct business areas | CRM solution + ERP solution + Portal solution |
| **By team ownership** | Multiple teams need independent release cycles | Team A's components + Team B's components |
| **By distribution tier** | ISV with base product + add-on modules | Base solution + Premium features solution |
| **By update frequency** | Stable schema vs. frequently-changing logic | Data model solution + Business logic solution |
| **By migration phase** | Phased migration with incremental deployment | Phase 1 entities + Phase 2 entities |

### 8.3 ISV Segmentation Model

For ISV scenarios, the standard layering is:

```
Publisher's base solution (managed, required)
  └── Publisher's extension solutions (managed, optional per licensing tier)
        └── Customer's customization layer (unmanaged overlay)
```

**Customization boundary rules:**
- Customers CAN: add columns, create views, create dashboards, create flows
- Customers CANNOT: modify publisher-managed components (tables, forms, sitemap, security roles)
- Publisher updates install cleanly because managed components are locked

---

## 9. Decision Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Fast path for simple projects | Most Power Platform projects are single-solution with a small team. Requiring full multi-solution analysis for every project wastes the developer's time. The fast path confirms the single-solution decision and focuses on environment promotion and deployment planning — which even simple projects benefit from. |
| 2 | Stage names follow roadmap, not implementation plan | The roadmap (§7.1) is the authoritative design source. The implementation plan (§5.3) used provisional stage names (SOLUTION_ANALYSIS, PACKAGING_DECISION, DEPENDENCY_MAP) before the detailed design existed. ASSESS, PACKAGING_DESIGN, ENVIRONMENT_MAP, DEPLOYMENT_PLAN are more descriptive and self-documenting. |
| 3 | Single output file (enriched 04) vs. separate files | All packaging-related information belongs in one file. Creating separate files (e.g., `environment-map.md`, `deployment-plan.md`) would fragment related content and require downstream skills to discover and parse multiple files. alm-workflow already reads `04-solution-packaging.md` — one file to consume is simpler. |
| 4 | Separate `.strategy-state.json` vs. extending `.discovery-state.json` | `.discovery-state.json` is owned by solution-discovery. Its schema tracks 10 foundation sections. Extending it for a different skill's stage progression would mix concerns and create coupling between the two skills' state management. Each skill owns its own state file within the shared `.foundation/` directory. |
| 5 | No agent needed | Unlike ARCHITECTURE stage in solution-discovery (where app type selection benefits from structured evaluation against measurable trade-offs), solution-strategy's decisions are pattern-based and informed by the developer's organizational context (team structure, distribution model, environment count). A conversational approach with embedded decision logic is more effective than delegating to an agent. |
| 6 | PACKAGING_DESIGN skipped (not abbreviated) on fast path | For single-solution projects, there is no packaging to design — the decision is already made. Running an abbreviated version would ask questions that have no meaningful answers in a single-solution context. The fast path skips it entirely and devotes time to environment and deployment planning instead. |
| 7 | Collect-then-write pattern (write at REVIEW, not per stage) | Writing to `04-solution-packaging.md` after each stage creates partial file states if a session is interrupted. The collect-then-write pattern accumulates decisions in the state file and conversation context, then writes the complete enriched file atomically at REVIEW. If a session is interrupted, resume picks up from the last completed stage and re-collects remaining decisions. |
| 8 | Implementation plan checkpoint correction | The implementation plan (§5.3) says solution-strategy produces `docs/solution-strategy.md`. The actual output is an enriched `.foundation/04-solution-packaging.md`. Writing to a `docs/` file would create a disconnected artifact that alm-workflow would need to discover. Enriching the existing foundation file keeps the solution packaging contract centralized. |

---

## 10. Open Items for Build

- **Question phrasing refinement:** The question wordings in §4 are design-phase drafts. During build, refine phrasing based on how Claude Code actually presents them in the terminal.
- **Microsoft Learn integration:** During ASSESS, optionally query Microsoft Learn (via MCP tools) for current solution architecture guidance and packaging best practices. Define specific documentation pages to query and handle MCP unavailability gracefully (fall back to built-in knowledge).
- **ISV scenario depth:** The ISV segmentation model (§8.3) covers the common case. Real-world ISV scenarios may have additional complexity (multi-geo deployment, per-tenant isolation, AppSource certification requirements). Expand during or after a real ISV use case.
- **Connection reference discovery:** In the ENVIRONMENT_MAP stage, the skill asks the developer to list connection references manually. When pp-devenv integration is available, the skill could read existing connection references from the environment via PAC CLI. Document the integration point but build the manual-entry version first.
- **Dependency graph visualization:** The text-based dependency graph (§4.4, Round 3) works in the terminal but is limited for complex dependency trees. Consider Excalidraw MCP integration for visual dependency diagrams when the MCP tool is available.
- **`.gitignore` coverage:** `.foundation/` is already in `.gitignore`. Confirm that `.strategy-state.json` (within `.foundation/`) is covered. If the developer has customized their `.gitignore`, the state file may be committed accidentally.
