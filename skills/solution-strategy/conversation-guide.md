# Conversation Guide — solution-strategy

This file is the stage-by-stage reference for the solution-strategy conversation. Each stage lists questions (in rounds), gate conditions, output directives, and state-write directives.

**Foundation context:** At INIT, read sections 00, 01, 02, and 04. Use project type, scale, app type, and current packaging decision as context throughout.

**Two paths:** The ASSESS stage determines whether to follow the fast path (single-solution, simple) or full path (multi-solution, ISV, complex). Stages marked "full path only" are skipped on the fast path. Stages marked "abbreviated on fast path" use reduced question sets.

---

## Stage: INIT

**What happens:**

1. Verify `.foundation/` exists
2. Verify required foundation sections exist and are not placeholders:
   - `00-project-identity.md`
   - `01-requirements.md`
   - `02-architecture-decisions.md`
   - `04-solution-packaging.md`
3. Verify `.foundation/.discovery-state.json` shows `"stage": "COMPLETE"`
4. Check for `.foundation/.strategy-state.json`:
   - If absent → CREATE mode, proceed to ASSESS
   - If present, stage != `COMPLETE` → RESUME mode, present status summary, resume at first incomplete stage
   - If present, stage == `COMPLETE` → ask UPDATE or exit
5. Read all four consumed foundation sections into context. Extract:
   - Project name, type, publisher prefix, audience (from 00)
   - User count, data volume, scope (from 01)
   - App type, platform characteristics, licensing tier (from 02)
   - Packaging decision (single/multi), solution table, deployment notes (from 04)

**No questions asked.** INIT is a routing stage.

**If any prerequisite fails:** Stop with a clear message explaining what's missing and which skill to run.

**Write `.strategy-state.json`:** Create initial state file with `stage: "ASSESS"`, `mode: "CREATE"`. Use the actual current UTC timestamp for `lastUpdated` — run `date -u +%Y-%m-%dT%H:%M:%SZ` in Bash to get it. Never use `T00:00:00Z` as a placeholder.

---

## Stage: ASSESS

### Round 1 — Present current state

Summarize what solution-discovery produced:

> "Here's your current solution packaging from discovery:
>
> - **Structure:** [Single solution / Multiple solutions]
> - **Rationale:** [rationale from 04]
> - **Entity count:** [N] entities (from entity map if available, or from solutions table)
> - **Project type:** [greenfield / extension / migration]
> - **App type:** [from 02]
> - **Scale:** [user count] users, [data volume] records
>
> I'll evaluate whether this packaging needs refinement and add environment and deployment details."

### Round 2 — Decision tree

Ask only the questions whose answers are not already evident from the foundation. Skip questions where the answer is already known.

**If 04-solution-packaging says "Multiple solutions":**
> "Your foundation already specifies multiple solutions. We'll design the full dependency architecture."
> → Set assessmentResult = `multi-required`, path = `full`. Skip remaining decision tree questions.

**If single solution, ask these in sequence (stop at first "yes"):**

1. "Is this solution distributed to external customers (ISV / AppSource)?"
   → If yes: assessmentResult = `isv-segmented`, path = `full`. Stop.

2. "Are there multiple development teams working on separate components?"
   → If yes: assessmentResult = `multi-required`, path = `full`. Stop.

3. "Will any components be shared across multiple apps or solutions in the future?"
   → If yes: "Would you like to split into multiple solutions now, or keep it single for now and revisit later?"
     → Split now: assessmentResult = `multi-required`, path = `full`. Stop.
     → Defer: assessmentResult = `single-confirmed`, path = `fast`.
   → If no: assessmentResult = `single-confirmed`, path = `fast`.

**Project-type variations:**

| Type | Additional context question |
|---|---|
| Extension | "What solution(s) already exist in the target environment? Your new components will need to coexist with or depend on them." |
| Migration | "Will the migration be deployed alongside the existing system during a transition period, or will it fully replace it?" |

### Round 3 — Path announcement

**Fast path:**
> "Your single-solution packaging is appropriate for this project. I'll confirm the decision and add environment promotion and deployment planning — this should be quick."

**Full path:**
> "Your project [needs / already has] multi-solution architecture. I'll walk you through solution boundaries, dependency design, environment promotion, and deployment planning."

**Gate:** Decision tree completed. Assessment result and path determined.

**Validation:** assessmentResult is one of: `single-confirmed`, `multi-required`, `isv-segmented`. Path is one of: `fast`, `full`.

**Update `.strategy-state.json`:** Set `ASSESS` to `complete`, set `assessmentResult` and `path`, set `stage` to next stage (PACKAGING_DESIGN if full, ENVIRONMENT_MAP if fast).

---

## Stage: PACKAGING_DESIGN (full path only)

This stage is **skipped on fast path.** When skipped, set PACKAGING_DESIGN status to `skipped` with reason "fast path — single solution confirmed."

### Round 1 — Solution domain identification

> "Let's define your solution boundaries. Based on your [N] entities and [project type], here are natural grouping approaches:
>
> - **By functional domain:** Group related entities and logic into domain-specific solutions
> - **By team ownership:** Each development team owns a separate solution
> - **By distribution tier:** Base solution + premium add-on solutions (ISV)
> - **By update frequency:** Stable foundation vs. frequently-changing logic
>
> Which approach best fits your project? Or describe your own grouping."

### Round 2 — Solution definition

> "For each solution, define:
> 1. **Solution name** (use your publisher prefix: [prefix]_)
> 2. **What it contains** — which entities, apps, flows, and components
> 3. **Dependencies** — which other solutions must be installed first
>
> Start with the base solution (the one with no dependencies), then work outward."

After the developer defines solutions, present as a confirmation table:

```
| Solution Name | Contains | Dependencies |
|---|---|---|
| [prefix]_[name] | [contents] | [deps or "None"] |
```

> "Does this look right? Any changes?"

### Round 3 — Dependency validation

Present the dependency graph:

```
[base_solution]
  └── [extension_a]
  └── [extension_b]
        └── [extension_c]
```

> "Dependencies flow from top to bottom — parent solutions must be installed before children. Does this order look correct?"

**Validation:** Check for circular dependencies. If found:
> "I detected a circular dependency: [A] → [B] → [A]. Solutions can't depend on each other circularly. Let's restructure — which dependency should be removed?"

### Round 4 — Layering strategy (ISV only)

Only ask if assessmentResult is `isv-segmented`:

> "For ISV distribution, let's define your layering strategy:
>
> 1. **Base layer:** Which solution is the managed foundation that all customers receive?
> 2. **Extension layers:** Which solutions are optional add-ons or premium tiers?
> 3. **Customer customization boundary:** What can customers customize without breaking your solution?
>    - Typical safe customizations: adding columns, creating views, creating dashboards, creating flows
>    - Typically locked: publisher-managed tables, forms, sitemap, security roles
>
> Define each layer."

**Project-type variations:**

| Type | Additional question |
|---|---|
| Extension | "Which existing solutions in the target environment will your new solutions depend on? Do any of your solutions extend components from those existing solutions?" |
| Migration | "Will the migration be delivered as a single deployment or in phases? If phased, which solution contains the first migration batch?" |

**Gate:** At least 2 solutions defined. Each has a name, contents, and dependency list. No circular dependencies.

**Validation:** All solution names use the publisher prefix. Each solution has at least one component listed. Dependency graph is a valid DAG (directed acyclic graph).

**Update `.strategy-state.json`:** Set `PACKAGING_DESIGN` to `complete`, set `stage` to `ENVIRONMENT_MAP`.

---

## Stage: ENVIRONMENT_MAP

### Full path — Round 1 — Environment inventory

> "How many environments will this project use? Common patterns:
>
> - **Minimal (2):** Dev + Prod — small team, low risk
> - **Standard (3):** Dev + Test + Prod — with QA validation
> - **Enterprise (4+):** Dev + Test + UAT + Prod — with formal user acceptance
>
> List your environments in promotion order (from development to production)."

### Full path — Round 2 — Environment details

For each environment the developer lists:

> "For **[environment name]**:
> 1. **Purpose:** What happens here? (Active development / QA testing / User acceptance / Production)
> 2. **Solution state:** Managed or unmanaged?
> 3. **Who has access?** (Developers only / QA team / Business users / Everyone)
> 4. **Data:** Production data, test data, or synthetic data?"

### Full path — Round 3 — Connection references and environment variables

> "Do you have any values that change between environments?
>
> - **Connection references:** External system connections that differ per environment (e.g., API endpoints, service accounts)
> - **Environment variables:** Configuration values that differ per environment (e.g., notification email addresses, feature flags, URLs)
>
> List each with its purpose and what changes between dev and production. Test/UAT values can be defined later."

If the developer lists any, present as a confirmation table:

```
| Name | Type | Dev Value | Prod Value | Purpose |
|---|---|---|---|---|
| [name] | [Conn ref / Env var] | [value] | [value] | [what it's for] |
```

If none: "No connection references or environment variables needed right now. You can add them later when integrations are configured."

### Fast path — Abbreviated (single round)

> "Let's document your environment promotion path. For a [project type] project with [user count] users, I recommend:
>
> | Environment | Type | Solution State | Purpose |
> |---|---|---|---|
> | Dev | Development | Unmanaged | Active development |
> | [Test — include if scale or compliance warrants it] |
> | Prod | Production | Managed | Live system |
>
> Does this match your setup, or do you need additional environments?"

If the developer confirms, follow up once:
> "Any connection references or environment variables that differ between dev and production? (External API endpoints, notification addresses, etc.) If not, we'll skip that for now."

**Gate:** At least 2 environments defined. Each has a purpose and managed/unmanaged state. Promotion order is clear.

**Validation:** At least one environment is unmanaged (development). At least one environment is managed (production or testing). Promotion order has development before production.

**Update `.strategy-state.json`:** Set `ENVIRONMENT_MAP` to `complete`, set `stage` to `DEPLOYMENT_PLAN`.

---

## Stage: DEPLOYMENT_PLAN

### Full path — Round 1 — Versioning strategy

> "What versioning strategy should your solution(s) use?
>
> - **Semantic versioning** (recommended): major.minor.build.revision
>   - Major: breaking changes or major feature releases
>   - Minor: new features, non-breaking changes
>   - Build: incremental builds during development
>   - Revision: patches and hotfixes
>
> - **Date-based versioning:** year.month.day.build — useful for regular release cadences
>
> - **Sequential versioning:** incrementing build numbers — simplest, least informative
>
> Which approach fits your team?"

### Full path — Round 2 — Deployment type

> "How should solution updates be applied in downstream environments?
>
> - **Upgrade** (recommended): Replaces the existing managed solution with the new version. All customizations in unmanaged layers are preserved.
> - **Patch:** Applies incremental changes without a full version bump. Useful for hotfixes, but limited — cannot add new components.
> - **Both:** Upgrades for planned releases, patches for emergency fixes.
>
> Which deployment approach do you need?"

### Full path — Round 3 — Rollback and sequence

> "Two final deployment questions:
>
> 1. **Rollback procedure:** If a deployment fails or causes issues, what's the recovery plan?
>    - **Environment backup** (recommended): Restore from backup taken before deployment
>    - **Uninstall and reinstall:** Remove failed version, install previous version
>    - **Forward-fix:** Deploy a corrected version as quickly as possible
>
> 2. [Multi-solution only] **Deployment sequence:** What order should solutions be deployed? This should match your dependency graph — base solutions first, extensions after."

### Fast path — Abbreviated (single round)

> "For deployment planning:
>
> 1. **Versioning:** I recommend semantic versioning (major.minor.build.revision). Does that work?
> 2. **Deployment type:** Managed solution upgrade is standard for your project. Any need for patch deployments?
> 3. **Rollback:** Taking an environment backup before each deployment is the standard safety net. Any additional rollback requirements?"

If the developer accepts all defaults:
> "Great — semantic versioning, managed upgrades, with environment backup as rollback."

**Gate:** Versioning strategy selected. Deployment type decided. Rollback procedure documented.

**Validation:** Versioning strategy is one of: semantic, date-based, sequential. Deployment type is one of: upgrade, patch, both. Rollback procedure is documented.

**Update `.strategy-state.json`:** Set `DEPLOYMENT_PLAN` to `complete`, set `stage` to `REVIEW`.

---

## Stage: REVIEW

### Step 1 — Present strategy summary

```
Solution Strategy Summary for [Project Name]
=============================================

Assessment: [single-confirmed / multi-required / isv-segmented]
Path: [fast / full]

Packaging
─────────
  Structure: [Single solution / N solutions]
  [If multi-solution:]
    Solutions:
      - [solution_1]: [contents] (no dependencies)
      - [solution_2]: [contents] (depends on: solution_1)
      - ...
    Dependency graph:
      [base]
        └── [ext_a]
        └── [ext_b]
    [If ISV:] Layering: [base + extension description]

Environment Promotion
─────────────────────
  Environments: [N] environments
  Promotion path: [Dev] → [Test] → [Prod]

  | Environment | Type | Solution State | Purpose | Data | Access |
  |---|---|---|---|---|---|
  | [name] | [type] | [managed/unmanaged] | [purpose] | [data type] | [who] |

  Connection references: [N defined / None]
  [If any, list them]

Deployment Plan
───────────────
  Versioning: [strategy]
  Deployment type: [upgrade / patch / both]
  Rollback: [procedure]
  [If multi-solution:] Deployment sequence: [ordered list]

───────────────────────────────────────────
Confirm this strategy? [yes / request changes]
```

### Step 2 — Cross-reference validation

Run these checks against the foundation:

| Check | How | Warning if failed |
|---|---|---|
| Environment-constraint alignment | Read `09-constraints.md` if it exists (not placeholder). Check infrastructure constraints against environment plan. | "Your constraints mention [constraint] but your environment plan [conflict]. Worth reviewing." |
| Packaging-architecture alignment | Compare app type complexity with packaging simplicity. | "Your architecture uses [complex app type] but packaging is single-solution. This is fine for most projects, but worth confirming." |
| Scale-environment alignment | Compare user count / data volume with environment count. | "Your project targets [N] users but has only [M] environments. Consider adding a test/UAT environment for validation at scale." |
| Dependency-entity alignment | If multi-solution, check that solution contents reference entities from `03-entity-map.md`. | "Solution [name] references [entity] which isn't in your entity map. Confirm this is intentional." |

Present any warnings found. These are advisories, not blockers.

### Step 3 — Developer confirmation

> "Does this strategy look correct, or would you like to change anything?"

If changes requested:
- Ask which section needs changes (packaging, environments, or deployment)
- Return to the relevant stage
- After changes, return to REVIEW and re-present the summary

**Gate:** Developer explicitly confirms the strategy.

**Output:** Write enriched `04-solution-packaging.md` using the template below.

**Update `.strategy-state.json`:** Set `REVIEW` to `complete`, set `stage` to `COMPLETE`.

---

## Stage: COMPLETE

1. Confirm the enriched `04-solution-packaging.md` was written successfully
2. Update `.strategy-state.json` to `"stage": "COMPLETE"`

3. Present the downstream skill suggestion:

```
IF application-design has not been completed → suggest application-design
  "Your solution strategy is set. I'd suggest application-design next to model
   your domain with DDD before moving to schema-design."

ELSE IF schema-design has not been completed → suggest schema-design
  "Your solution strategy is set. With application-design complete, schema-design
   is the natural next step to define your Dataverse tables."

ELSE → developer's choice
  "Your solution strategy is set. Which skill would you like to work on next?"
```

4. Present other options:

```
Other options:
  - schema-design — start data modeling
  - application-design — model your domain with DDD
  - Any other skill — the foundation supports all downstream skills
```

5. **Wait for explicit developer confirmation. Do NOT auto-start the next skill.**

---

## UPDATE Mode Flow

### Step 1 — Aspect selection

> "Your solution strategy is complete. Which aspect would you like to update?
>
> 1. **Packaging structure** — modify solution boundaries, add/remove solutions, change dependencies
> 2. **Environment map** — add/remove environments, change promotion path, update connection references
> 3. **Deployment plan** — change versioning strategy, deployment type, or rollback procedure"

### Step 2 — Focused conversation

Load the current `04-solution-packaging.md` and present the relevant sections. Conduct a focused conversation to modify the selected aspect. Use the same question patterns from the relevant stage above, but focused on what's changing.

### Step 3 — REVIEW

Re-run the full REVIEW stage (Step 1–3 from the REVIEW section above). This ensures the update is validated against the foundation.

### Step 4 — Write and warn

Write the updated `04-solution-packaging.md`. Present downstream impact warnings:

| Aspect updated | Downstream impact |
|---|---|
| Packaging structure | alm-workflow, environment-setup — deployment procedures may need revision |
| Environment map | environment-setup — environment configuration may need updating |
| Deployment plan | alm-workflow — export/deploy procedures may need updating |
| Connection references | environment-setup — connection configuration may need updating |

```
Solution strategy aspect [aspect] updated.

Impact analysis:
  ⚠ [skill] — [specific impact description]

  These are warnings, not automatic invalidations. Review each flagged item
  and update if the change affects it.
```

Update `.strategy-state.json` with the update record in the `updates` array.

---

## Enriched 04-solution-packaging.md Template

When writing the enriched file at REVIEW, use this structure. Preserve all original content from solution-discovery and append the new sections.

```markdown
# Solution Packaging

**Status:** Complete
**Written by:** solution-discovery CREATE, [original date]
**Project:** [project name]

<!-- Enriched by solution-strategy [CREATE | UPDATE], [date]. Changes: [summary of what was added] -->

---

## Packaging Decision

**Structure:** [Single solution | Multiple solutions]
**Rationale:** [original rationale, expanded if strategy analysis added context]

## Solutions

| Solution Name | Contains | Dependencies |
|---|---|---|
| [name] | [component types / entity groups] | [prerequisite solutions or "None"] |

## Solution Dependencies
_(Multi-solution only — omit for single-solution)_

**Dependency graph:**

` ` `
[base_solution]
  └── [extension_a]
  └── [extension_b]
        └── [extension_c]
` ` `

**Layering strategy:** [description of base + extension layers, ISV customization boundaries if applicable]

## Environment Promotion Map

| Environment | Type | Solution State | Purpose | Data | Access |
|---|---|---|---|---|---|
| Dev | Development | Unmanaged | Active development | Test data | Developers |
| [additional environments...] |
| Prod | Production | Managed | Live system | Production | All users |

**Promotion path:** Dev → [intermediates] → Prod

## Connection References

| Name | Type | Dev Value | Prod Value | Purpose |
|---|---|---|---|---|
| [name] | [Connection reference / Environment variable] | [dev] | [prod] | [what it's for] |

_(If none: "No connection references identified. Add when external integrations are configured.")_

## Deployment Plan

- **Versioning strategy:** [Semantic versioning: major.minor.build.revision | Date-based | Sequential]
- **Deployment type:** [Managed solution upgrade | Patch | Both]
- **Rollback procedure:** [Environment backup restoration | Uninstall and reinstall | Forward-fix]
- **Deployment sequence:** [For multi-solution: ordered list. For single-solution: "N/A — single solution"]

## Deployment Notes

[Original notes from solution-discovery, extended if solution-strategy added context]
```

**Important:** The triple backticks in the dependency graph must be actual markdown code fences in the output file. The template above escapes them with spaces for display purposes only.

---

## .strategy-state.json Schema

```json
{
  "version": "1.0",
  "projectName": "[from 00-project-identity]",
  "mode": "[CREATE | UPDATE]",
  "stage": "[INIT | ASSESS | PACKAGING_DESIGN | ENVIRONMENT_MAP | DEPLOYMENT_PLAN | REVIEW | COMPLETE]",
  "assessmentResult": "[single-confirmed | multi-required | isv-segmented]",
  "path": "[fast | full]",
  "stages": {
    "ASSESS": { "status": "[not-started | in-progress | complete]", "completedAt": "[ISO 8601]" },
    "PACKAGING_DESIGN": { "status": "[not-started | in-progress | complete | skipped]", "completedAt": "[ISO 8601]", "reason": "[if skipped]" },
    "ENVIRONMENT_MAP": { "status": "[not-started | in-progress | complete]", "completedAt": "[ISO 8601]" },
    "DEPLOYMENT_PLAN": { "status": "[not-started | in-progress | complete]", "completedAt": "[ISO 8601]" },
    "REVIEW": { "status": "[not-started | in-progress | complete]", "completedAt": "[ISO 8601]" }
  },
  "lastUpdated": "[ISO 8601]",
  "updates": []
}
```

**State transition protocol:**
- Write `.strategy-state.json` after every stage transition
- **Timestamps must be real:** Use the actual current date and time in ISO 8601 format (e.g., `2026-04-02T14:30:00Z`). Do NOT use placeholder values like `T00:00:00Z`. Run `date -u +%Y-%m-%dT%H:%M:%SZ` in Bash to get the current UTC timestamp if needed.
- On RESUME, read the state file to determine where to continue
- On UPDATE, add an entry to the `updates` array with aspect, timestamp, reason, and impact warnings
