# pp-superpowers — Implementation Plan

**Version:** 2.0
**Date:** April 1, 2026
**Author:** SDFX Studios
**Status:** Approved — design-to-build bridge
**Parent document:** pp-superpowers Design Roadmap v1.0

**Version history:**

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 1, 2026 | Initial approved version |
| 2.0 | April 1, 2026 | Skill inventory reconciliation — corrected Phase 4/5 build sequence to use approved roadmap skill names (deployment → alm-workflow, removed testing and review as standalone skills, added solution-strategy to Phase 1, added environment-setup to Phase 4). Updated fork modification checklist and design-status template to match. |

---

## 1. Purpose and Scope

This document bridges the design phase (10 skill specification documents) and the build phase (actual implementation of the pp-superpowers Claude Code plugin). It answers five questions that the design documents do not:

1. **When is design done enough to start building?** — Design completion criteria and the dependency-complete threshold.
2. **What exactly changes in the forked Superpowers repo?** — Fork review protocol and modification checklist.
3. **In what order are skills built?** — Per-skill build sequence based on dependency chains, not document production order.
4. **How do you know a skill is correctly implemented?** — Per-skill validation checkpoints.
5. **How do the other plugins (pp-devenv, pp-memory) fit into the pp-superpowers build?** — Cross-plugin phasing and stub strategy.

This document does not cover pp-devenv, pp-meta, pp-memory, pp-research, or pp-docs implementation — those follow their own design and implementation documents.

---

## 2. Design Completion Criteria

### 2.1 The Dependency-Complete Threshold

Building begins when the **dependency-complete subset** of skill design documents is approved — not all 10. The dependency-complete subset is:

| Document | Why it's blocking |
|---|---|
| `pp-superpowers-design-roadmap.md` | Suite architecture, fork transformation plan, skill inventory — the foundation everything builds on |
| `pp-superpowers-application-design.md` | Defines the DDD model output format consumed by schema-design and referenced by ui-design and business-logic |
| `pp-superpowers-schema-design.md` | Defines the physical model output format consumed by ui-design, business-logic, and security |
| `pp-superpowers-solution-discovery.md` | Defines the `.foundation/` output format consumed by every downstream skill at INIT — if this format changes during build, all downstream skill INIT stages need updating |

These four documents are blocking because solution-discovery — the first skill to build — produces the foundation that all downstream skills consume, and application-design and schema-design define the output formats that the entire Design and Build layer depend on. If any of these output formats change during build, downstream skill stages need updating. The dependency-complete subset gives enough stability to start.

**The remaining 6 skill design documents** (solution-strategy, security, integration, alm-workflow, and environment-setup) can be completed in parallel with building the first implemented skills. ui-design and business-logic design documents are already approved.

### 2.2 What "Approved" Means

A design document is approved when:
- All sections are complete (no "TBD" in gating sections: state machine, conversation flow, handoff contract)
- All open items are classified as "deferred to build phase" — not unresolved architectural questions
- The decision log is stable (no pending decisions that could change the skill's state machine or outputs)

The current status of all approved documents is tracked in the `docs/design-status.md` file in the plugin repo (created during build setup — see §4.1).

### 2.3 Build-Ready Signal

Before writing a single line of plugin code, confirm:

```
[ ] pp-superpowers-design-roadmap.md — Approved
[ ] pp-superpowers-application-design.md — Approved
[ ] pp-superpowers-schema-design.md — Approved
[ ] pp-superpowers-solution-discovery.md — Approved
[ ] Superpowers fork cloned locally
[ ] Fork modification checklist produced (see §3)
[ ] pp-devenv stub script written (see §6.2)
[ ] Node.js confirmed in PATH
[ ] .NET SDK confirmed via DOTNET_ROOT (for csharp-plugin sub-skill testing)
```

---

## 3. Fork Review Protocol

### 3.1 What the Fork Is

pp-superpowers is built by forking [obra/superpowers](https://github.com/obra/superpowers) — a collection of Claude Code skills structured as a plugin. The fork preserves the Superpowers plugin architecture (manifest, hooks, commands, agents directory structure) while replacing or extending its content with Power Platform-specific skills.

The fork is not a migration of the existing 8 Claude.ai skills. It is a **fresh implementation informed by the design documents**, using the Superpowers repo structure as the scaffold.

### 3.2 Fork Review Steps

**Step 1 — Clone and inventory the fork**

```bash
git clone https://github.com/obra/superpowers.git pp-superpowers
cd pp-superpowers
find . -type f | grep -v ".git" | sort > fork-inventory.txt
```

Review `fork-inventory.txt`. Map every file to one of three categories: KEEP (unchanged), REPLACE (rewrite with Power Platform content), REMOVE (not relevant).

**Step 2 — Understand the Superpowers structure**

Before modifying anything, read and understand:
- `CLAUDE.md` — the plugin manifest (how Claude Code loads the plugin)
- `hooks/` — session-start and other lifecycle hooks
- `commands/` — slash commands
- `agents/` — agent definitions
- `skills/` — skill SKILL.md files

**Step 3 — Map design decisions to files**

For each design decision in the pp-superpowers design roadmap that requires a file change, record the specific file and modification in the fork modification checklist (§3.3).

**Step 4 — Produce the checklist**

Create `docs/fork-modification-checklist.md` in the repo. Each entry is either KEEP, REPLACE, REMOVE, or ADD.

**Step 5 — Open GitHub Issues**

For each REPLACE, REMOVE, or ADD entry, open a corresponding GitHub Issue tagged `fork-modification`. The checklist is the reference; the issues are the work tracking mechanism.

### 3.3 Fork Modification Checklist Structure

`docs/fork-modification-checklist.md` format:

```markdown
# Fork Modification Checklist

## Status legend
- [ ] Not started
- [~] In progress
- [x] Complete

---

## CLAUDE.md (plugin manifest)
- [ ] REPLACE: Update plugin name from "superpowers" to "pp-superpowers"
- [ ] REPLACE: Update description to reflect Power Platform domain
- [ ] REPLACE: Update skills list to reference pp-superpowers skill paths
- [ ] REPLACE: Update hook references to pp-superpowers hooks

## hooks/
- [ ] REPLACE: session-start hook — replace with .pp-context/ context writer
  (reads solution name, environment URL, PAC CLI auth state)
- [ ] REMOVE: Any Superpowers-specific hooks not applicable to Power Platform

## commands/
- [ ] REPLACE: Map existing commands to pp-superpowers equivalents or REMOVE
- [ ] ADD: Any Power Platform-specific commands (e.g., /pac-status)

## agents/
- [ ] REMOVE: All existing Superpowers agents
- [ ] ADD: architecture-advisor (solution-discovery)
- [ ] ADD: domain-modeler (application-design)
- [ ] ADD: solution-analyzer (application-design)
- [ ] ADD: schema-reviewer (schema-design)
- [ ] ADD: ui-reviewer (ui-design)
- [ ] ADD: security-reviewer (security)
- [ ] ADD: plugin-auditor (business-logic)
- [ ] ADD: integration-reviewer (integration)
- [ ] ADD: alm-reviewer (alm-workflow)

## skills/
- [ ] REMOVE: All existing Superpowers skills
- [ ] ADD: solution-discovery/SKILL.md
- [ ] ADD: application-design/SKILL.md
- [ ] ADD: schema-design/SKILL.md
- [ ] ADD: ui-design/SKILL.md
- [ ] ADD: ui-design/model-driven-app/SKILL.md
- [ ] ADD: ui-design/canvas-app/SKILL.md
- [ ] ADD: ui-design/pcf-control/SKILL.md
- [ ] ADD: ui-design/custom-page/SKILL.md
- [ ] ADD: ui-design/modal-dialog/SKILL.md
- [ ] ADD: ui-design/code-app/SKILL.md
- [ ] ADD: business-logic/SKILL.md
- [ ] ADD: business-logic/csharp-plugin/SKILL.md
- [ ] ADD: business-logic/power-automate/SKILL.md
- [ ] ADD: business-logic/business-rule/SKILL.md
- [ ] ADD: business-logic/client-script/SKILL.md
- [ ] ADD: solution-strategy/SKILL.md
- [ ] ADD: integration/SKILL.md
- [ ] ADD: integration/connectors/SKILL.md
- [ ] ADD: integration/dataflows/SKILL.md
- [ ] ADD: integration/virtual-tables/SKILL.md
- [ ] ADD: integration/fabric/SKILL.md
- [ ] ADD: security/SKILL.md
- [ ] ADD: alm-workflow/SKILL.md
- [ ] ADD: environment-setup/SKILL.md

## docs/
- [ ] ADD: design-status.md (tracks design document approval state)
- [ ] ADD: fork-modification-checklist.md (this file)
```

### 3.4 Preserving Fork Updatability

After forking, the upstream Superpowers repo may receive updates. To preserve the ability to pull upstream changes to the structural layer (CLAUDE.md format, hooks system, base architecture) without losing pp-superpowers content:

1. Keep a `upstream` remote pointing to `obra/superpowers`
2. Separate structural changes (hook loading mechanism, CLAUDE.md schema) from content changes (skill files, agent definitions)
3. Structural changes go in the root and `hooks/` directory — content changes go in `skills/` and `agents/`
4. When pulling upstream: merge root and `hooks/` selectively; never auto-merge `skills/` or `agents/`

---

## 4. Per-Skill Build Sequence

### 4.1 Build Setup (Before First Skill)

Before implementing any skill, complete the repository setup:

```bash
# Fork setup
git clone https://github.com/obra/superpowers.git pp-superpowers
cd pp-superpowers
git remote add upstream https://github.com/obra/superpowers.git

# Create design tracking file
mkdir -p docs
cat > docs/design-status.md << 'EOF'
# Design Document Status

| Document | Status | Version | Notes |
|---|---|---|---|
| plugin-suite-design-roadmap | Approved | 1.0 | |
| pp-superpowers-design-roadmap | Approved | 1.0 | |
| pp-superpowers-application-design | Approved | 1.0 | |
| pp-superpowers-schema-design | Approved | 1.0 | |
| pp-superpowers-ui-design | Approved | 1.0 | |
| pp-superpowers-business-logic | Approved | 1.0 | |
| pp-superpowers-implementation-plan | Approved | 2.0 | V2: skill inventory reconciliation |
| pp-superpowers-solution-discovery | Not started | — | Phase 1 blocker |
| pp-superpowers-solution-strategy | Not started | — | |
| pp-superpowers-security | Not started | — | |
| pp-superpowers-integration | Not started | — | |
| pp-superpowers-alm-workflow | Not started | — | |
| pp-superpowers-environment-setup | Not started | — | |
EOF

# Write stub script for cross-plugin dev dependency
cat > dev-stub.sh << 'EOF'
#!/bin/bash
# Development stub: writes fake .pp-context/ files so pp-superpowers can
# run before pp-devenv is built. Delete this file once pp-devenv is complete.
mkdir -p .pp-context
echo "solutionName: ProjectCentral" > .pp-context/solution.md
echo "targetEnv: https://dev-org.crm.dynamics.com" > .pp-context/environment.md
echo "authStatus: connected" > .pp-context/pac-state.md
echo "publisherPrefix: sdfx" >> .pp-context/pac-state.md
echo "Stub .pp-context/ written."
EOF
chmod +x dev-stub.sh

# Produce fork modification checklist (see §3.3)
# Open GitHub Issues for each REPLACE/REMOVE/ADD entry
```

### 4.2 Build Sequence

Skills are built in **dependency chain order**, not in the order their design documents were produced.

```
Phase 1 — Foundation
  solution-discovery        ← everything depends on this; built first
  solution-strategy         ← refines solution packaging decisions from solution-discovery

Phase 2 — Design layer (parallel after Phase 1)
  application-design        ← depends on solution-discovery output format
  schema-design             ← depends on application-design output format

Phase 3 — Build layer (parallel after Phase 2)
  ui-design                 ← depends on schema-design output format
  business-logic            ← depends on schema-design + ui-design output formats
  security                  ← depends on schema-design + ui-design output formats

Phase 4 — Lifecycle completion (parallel after Phase 3)
  integration               ← depends on schema-design + business-logic patterns
  alm-workflow              ← depends on all Build layer outputs
  environment-setup         ← depends on solution-discovery + architecture decisions
```

**Rationale for this order:** solution-discovery produces the foundation document format that all downstream skills read. If solution-discovery's output format changes during build, all downstream skill INIT stages need to update. Building it first and stabilizing its output format before other skills are written prevents cascading rework. solution-strategy is paired with solution-discovery in Phase 1 because it directly refines solution-discovery's packaging output while that context is fresh.

Within Phase 2, application-design can begin as soon as solution-discovery is validated. Within Phase 3, ui-design, business-logic, and security can begin in parallel once schema-design is validated — they consume schema-design's output but do not depend on each other until the form event map handoff (ui-design → business-logic). Phase 4 handles lifecycle skills that depend on the Build layer outputs being stable. Testing and review are not standalone skills — they are stages within each skill's workflow (REVIEW stage).

### 4.3 Branch Strategy

Each skill is built on its own feature branch following GitHub Flow:

```
main                           ← stable, only merged validated skills
└── feature/skill-solution-discovery
└── feature/skill-application-design
└── feature/skill-schema-design
└── feature/skill-ui-design
└── feature/skill-business-logic
... etc.
```

Skills in the same phase can be developed in parallel on separate branches. Phase completion means all skills in that phase are merged to main.

---

## 5. Per-Skill Validation Checkpoints

Each skill is considered implementation-complete when it passes all checkpoints for its layer. A skill that fails a checkpoint is not merged to main.

### 5.1 Checkpoint Framework

Every skill must pass four checkpoint gates before merging:

**Gate 1 — Structure:** Does the SKILL.md file exist at the correct path? Does it contain all required sections (state machine, stage definitions, conversation flow, output specifications)?

**Gate 2 — State machine completeness:** Can the skill be invoked and walk through every stage defined in its state machine without errors? Test by running Claude Code against a minimal project (see §5.2).

**Gate 3 — Handoff contract:** Does the skill produce the output artifacts specified in its handoff contract? After completing the skill, do the expected files exist at the expected paths?

**Gate 4 — Design document alignment:** Does the implementation match the approved design document? Walk through the design document section by section and verify each decision is reflected in the SKILL.md.

### 5.2 Minimal Test Project

A minimal test project is maintained at `tests/minimal-project/` in the repo. It contains:

```
tests/minimal-project/
  .foundation/
    00-project-identity.md    ← minimal project identity
    01-requirements.md        ← 3 simple requirements
    02-architecture-decisions.md ← single-solution, MDA app type
    03-entity-map.md          ← 2 entities
    04-solution-packaging.md  ← single-solution
    05-ui-plan.md             ← 1 persona, 1 app type
    06-logic-map.md           ← 1 plugin, 1 business rule
  docs/
    ddd-model.md              ← minimal DDD model
    schema-physical-model.md  ← 2 entities, 5 columns each
    ui-form-event-map.md      ← 1 form event
```

Every skill validation run uses this test project as input. It is intentionally minimal — just enough to exercise every stage without taking long to walk through.

### 5.3 Per-Skill Checkpoints

#### solution-discovery

| Checkpoint | Validation |
|---|---|
| Structure | SKILL.md at `skills/solution-discovery/SKILL.md`; all stage definitions present |
| State machine | Can start a new project, walk through IDENTITY → REQUIREMENTS → ARCHITECTURE → ENTITY_MAP → PACKAGING → UI_PLAN → LOGIC_MAP → REVIEW → COMPLETE |
| Handoff contract | After COMPLETE: `.foundation/` directory exists with all 7 section files |
| Design alignment | Foundation document format matches the format specified in pp-superpowers-design-roadmap §6 |

#### application-design

| Checkpoint | Validation |
|---|---|
| Structure | SKILL.md at `skills/application-design/SKILL.md`; Mode A and Mode B flows present |
| State machine | Mode A: INIT → DOMAIN_ANALYSIS → CONCEPTUAL_MODEL → DOCUMENTATION → MIND_MAP → REVIEW → COMPLETE using minimal test project |
| Handoff contract | After COMPLETE: `docs/ddd-model.md` exists and contains bounded contexts, aggregates, aggregate roots, and ubiquitous language |
| Design alignment | Output format matches pp-superpowers-application-design.md §5 specification |

#### schema-design

| Checkpoint | Validation |
|---|---|
| Structure | SKILL.md at `skills/schema-design/SKILL.md`; all 6 stages present |
| State machine | Walk through INIT → CONCEPTUAL_MODEL → LOGICAL_MODEL → PHYSICAL_MODEL → UX_DENORMALIZATION → PARITY_CHECK → REVIEW → COMPLETE |
| Handoff contract | After COMPLETE: `docs/schema-physical-model.md` exists with entity and column definitions |
| Design alignment | Physical model format matches pp-superpowers-schema-design.md §5 specification |

#### ui-design

| Checkpoint | Validation |
|---|---|
| Structure | Router SKILL.md + all 6 sub-skill SKILL.md files present at correct paths |
| State machine | Router: INIT → CONTEXT_GATHER → SUB_SKILL_SELECTION → [dispatch] → COMPLETE. Sub-skill: walk model-driven-app through all stages using minimal test project |
| Handoff contract | After COMPLETE: `docs/ui-design-spec.md` and `docs/ui-form-event-map.md` exist |
| Design alignment | Sub-skill outputs match pp-superpowers-ui-design.md §10 specification |

#### business-logic

| Checkpoint | Validation |
|---|---|
| Structure | Router SKILL.md + all 4 sub-skill SKILL.md files present at correct paths |
| State machine | Router: INIT → CONTEXT_GATHER → SUB_SKILL_SELECTION → [dispatch] → COMPLETE. Sub-skill: walk csharp-plugin through all stages |
| Handoff contract | After COMPLETE: `docs/business-logic-inventory.md` exists with plugin registration specs |
| Design alignment | Plugin audit output matches pp-superpowers-business-logic.md §9 scoring specification |

#### solution-strategy

| Checkpoint | Validation |
|---|---|
| Structure | SKILL.md at `skills/solution-strategy/SKILL.md`; all stage definitions present |
| State machine | Walk through INIT → SOLUTION_ANALYSIS → PACKAGING_DECISION → DEPENDENCY_MAP → REVIEW → COMPLETE |
| Handoff contract | After COMPLETE: `docs/solution-strategy.md` exists with solution packaging decisions and dependency map |
| Design alignment | Output format matches pp-superpowers-solution-strategy.md specification |

#### security

| Checkpoint | Validation |
|---|---|
| Structure | SKILL.md at `skills/security/SKILL.md`; all stage definitions present |
| State machine | Walk through INIT → ROLE_ANALYSIS → ROLE_MATRIX → FIELD_SECURITY → TEAM_SECURITY → REVIEW → COMPLETE |
| Handoff contract | After COMPLETE: `docs/security-design.md` exists with security role matrix and field-level security specifications |
| Design alignment | Role matrix format matches pp-superpowers-security.md specification |

#### integration

| Checkpoint | Validation |
|---|---|
| Structure | Router SKILL.md + all 4 sub-skill SKILL.md files present at correct paths |
| State machine | Router: INIT → CONTEXT_GATHER → SUB_SKILL_SELECTION → [dispatch] → COMPLETE. Sub-skill: walk connectors through all stages using minimal test project |
| Handoff contract | After COMPLETE: `docs/integration-inventory.md` exists with connector/dataflow/virtual-table specifications |
| Design alignment | Output format matches pp-superpowers-integration.md specification |

#### alm-workflow

| Checkpoint | Validation |
|---|---|
| Structure | SKILL.md at `skills/alm-workflow/SKILL.md`; all stage definitions present |
| State machine | Walk through INIT → EXPORT → UNPACK → DIFF → COMMIT → DEPLOY → DOCUMENTATION → REVIEW → COMPLETE |
| Handoff contract | After COMPLETE: PAC CLI command sequences documented, deployment procedure document exists |
| Design alignment | Output format matches pp-superpowers-alm-workflow.md specification |

#### environment-setup

| Checkpoint | Validation |
|---|---|
| Structure | SKILL.md at `skills/environment-setup/SKILL.md`; all stage definitions present |
| State machine | Walk through INIT → ENVIRONMENT_INVENTORY → SETTINGS_CONFIGURATION → FEATURE_ACTIVATION → INTEGRATION_SETUP → REVIEW → COMPLETE |
| Handoff contract | After COMPLETE: `docs/environment-config.md` exists with environment settings and feature activation state |
| Design alignment | Output format matches pp-superpowers-environment-setup.md specification |

---

## 6. Cross-Plugin Phasing

### 6.1 The Dependency Problem

pp-superpowers reads from `.pp-context/` — a directory written by pp-devenv's session-start hook. During pp-superpowers development, pp-devenv does not exist yet. Without `.pp-context/`, every skill's INIT stage will fail to load environment context.

Additionally, pp-superpowers skill state is persisted in `.pp-context/skill-state.json` — managed by pp-memory. Without pp-memory, state does not persist across sessions.

### 6.2 Stub Script Strategy

The stub script (`dev-stub.sh`) created in §4.1 resolves the pp-devenv dependency. It writes hardcoded `.pp-context/` files representing a development environment configuration.

```bash
#!/bin/bash
# dev-stub.sh
# Run this at the start of each pp-superpowers development session.
# Simulates pp-devenv's session-start hook.
# DELETE this file once pp-devenv is implemented.

mkdir -p .pp-context
echo "solutionName: ProjectCentral" > .pp-context/solution.md
echo "targetEnv: https://dev-org.crm.dynamics.com" > .pp-context/environment.md
cat > .pp-context/pac-state.md << 'EOF'
authStatus: connected
publisherPrefix: sdfx
cliVersion: 1.32.0
EOF
echo ".pp-context/ written for development session."
```

**Usage:** Run `./dev-stub.sh` once at the start of each development session before running Claude Code with pp-superpowers loaded.

**Lifecycle:** This script exists only during pp-superpowers development. When pp-devenv is implemented, its session-start hook replaces this script's function. The stub is then deleted.

### 6.3 pp-memory Stub

pp-memory provides session persistence — it allows a skill to resume from the last stage when the conversation is reopened. Without it, skill-state.json is written but not automatically reloaded on session start.

During pp-superpowers development, session persistence is handled manually: the developer copies the relevant skill state into the conversation when resuming. This is acceptable for development — full session persistence is a quality-of-life enhancement, not a functional blocker.

The pp-memory integration is implemented when pp-memory is built (per the suite build order: pp-devenv → pp-meta → pp-memory → pp-superpowers). At that point, the session-start hook in pp-memory automatically loads `.pp-context/skill-state.json` and presents the resume prompt.

### 6.4 Suite Build Order Alignment

The suite build order from the plugin-suite-design-roadmap is:

```
pp-devenv → pp-meta → pp-memory → pp-superpowers → pp-research → pp-docs
```

The stub strategy allows pp-superpowers development to begin before pp-devenv is complete — but it is important to note that the stub creates **technical debt** that must be resolved:

| Stub | Resolves when | Resolution action |
|---|---|---|
| `dev-stub.sh` | pp-devenv is implemented | Delete stub; update pp-superpowers INIT stages to handle absent `.pp-context/` gracefully (warn but allow) |
| Manual session resume | pp-memory is implemented | Wire pp-memory's session-start hook to auto-load skill state |

These resolution actions are tracked as GitHub Issues tagged `cross-plugin-integration`.

### 6.5 pp-meta Coordination

pp-meta handles capability routing and suite governance. For pp-superpowers, pp-meta is relevant when:
- A developer invokes a capability that doesn't exist in pp-superpowers but exists in another plugin (e.g., asking about infrastructure from within a solution-discovery session)
- A new capability needs to be added to the suite — pp-meta determines which existing plugin should absorb it

During pp-superpowers development, pp-meta does not yet exist. Skills are invoked directly. When pp-meta is built, it wraps the invocation layer — no changes to pp-superpowers skill files are needed unless pp-meta's routing format requires specific markers in SKILL.md files. This is tracked as an open item until the pp-meta design is produced.

---

## 7. Existing Skill Reference Protocol

The 8 existing Claude.ai skills are reference material — not migration artifacts. They are consulted during build to identify patterns worth preserving, not to copy content.

### 7.1 Reference Map

| pp-superpowers skill | Relevant Claude.ai reference skill | Reference purpose |
|---|---|---|
| application-design | `power-platform-feature-brainstorm` | Brainstorming conversation patterns, DDD discussion approach |
| schema-design | `dataverse-schema-design` | Column type guidance, naming convention rules, anti-patterns |
| ui-design | `dataverse-power-platform` | MDA form patterns, Canvas app patterns, app type decision guidance |
| business-logic (csharp-plugin) | `dataverse-csharp-plugin-audit` | Full audit capability → plugin-auditor agent |
| business-logic (all sub-skills) | `power-platform-feature-brainstorm` | Logic type decision approach |
| solution-discovery | None directly | New design — no direct reference |
| solution-strategy | `dataverse-power-platform` | Solution packaging patterns, multi-solution architecture guidance |
| security | `dataverse-power-platform` | Security role patterns, team-based security concepts |
| integration | `dataverse-power-platform` | Connector patterns, integration architecture guidance |
| alm-workflow | None directly | New design — PAC CLI operations are domain-specific |
| environment-setup | None directly | New design — environment configuration is domain-specific |

### 7.2 Reference Protocol

When implementing a skill, consult the reference skill **before writing SKILL.md content** for the relevant stages:

1. Open the reference skill in `~/.claude/skills/` (or the equivalent path in the Claude.ai skills directory)
2. Read it for patterns: conversation flow structure, decision criteria, output formats, known edge cases
3. Extract the patterns that translate to Claude Code SKILL.md format
4. Identify patterns that are Claude.ai-specific (chat interface, no file system access) and do not translate
5. Implement the translated patterns in the Claude Code SKILL.md

**What translates well:**
- Domain knowledge (column type guidance, naming conventions, plugin audit criteria)
- Decision criteria (when to use X vs. Y)
- Known anti-patterns and edge cases
- Output format structure

**What does not translate:**
- Conversational interface patterns (Claude.ai has no file system; Claude Code does)
- Tool invocation patterns (Claude.ai skills may reference different tools)
- Any session memory patterns (Claude.ai skills have no persistent state)

### 7.3 dataverse-csharp-plugin-audit → plugin-auditor

This is the most direct reference case. The full audit skill becomes the plugin-auditor agent in business-logic. The translation process:

1. Read `dataverse-csharp-plugin-audit` SKILL.md completely
2. Identify all audit domains and their criteria
3. Map each criterion to the plugin-auditor's audit domain structure (§9 of pp-superpowers-business-logic.md)
4. Preserve the scoring formula (HIGH × 15, MEDIUM × 5, LOW × 1)
5. Preserve the HTML report format concept but adapt it to markdown (Claude Code has no browser rendering for HTML artifacts in the same way)
6. Add pp-research integration for live Microsoft Learn documentation retrieval

---

## 8. Iteration Model

### 8.1 Issue-Driven Iteration

After all skills are implemented, improvements are handled through GitHub Issues:

1. **Discovery:** A gap is identified during real-world use (e.g., a skill does not handle a specific edge case, a stage requires too many back-and-forth exchanges, an output format is inconvenient for the downstream skill)
2. **Filing:** A GitHub Issue is opened describing the gap, the reproduction steps, and the expected behavior. Issue is tagged `skill-improvement` and labeled with the skill name.
3. **Triage:** Issues are reviewed and prioritized. Low-severity improvements are batched by skill. High-severity issues (a skill produces incorrect output) are addressed immediately on a hotfix branch.
4. **Batch application:** Improvements are applied to a skill in a named batch (e.g., `v1.1-schema-design-improvements`). A batch is a branch that collects all pending improvements for one skill.
5. **Validation:** The batch is validated against the skill's checkpoints (§5.3) before merging.
6. **Design document update:** If the improvement changes the skill's behavior meaningfully, the corresponding design document is updated to match. The design document is the source of truth — implementation follows it, and both must stay in sync.

### 8.2 Design Document Versioning

Design documents are versioned in their header (`Version: 1.0`, `1.1`, etc.). When a design document is updated:

1. Increment the version number
2. Update the Decision Log with a new entry describing what changed and why
3. Remove or update any Open Items that the change resolves
4. Open a GitHub Issue tagged `design-update` that links the updated document to the implementation changes required

Version history is maintained in the document header as a changelog:

```markdown
**Version history:**
| Version | Date | Changes |
|---|---|---|
| 1.0 | April 1, 2026 | Initial approved version |
| 1.1 | [date] | [description of change] |
```

### 8.3 Change Protocol Boundaries

Not all changes require full design document updates:

| Change type | Design doc update? | GitHub Issue? | Branch required? |
|---|---|---|---|
| Fix a bug in a skill (wrong output, broken stage) | No — unless the bug reveals a design flaw | Yes (hotfix tag) | Yes |
| Add a new edge case handler to an existing stage | No — implementation detail | Yes (improvement tag) | Yes, batch |
| Change a stage's conversation flow for clarity | No — not a behavior change | Yes (improvement tag) | Yes, batch |
| Change a skill's output format | **Yes** — downstream skills depend on it | Yes (breaking-change tag) | Yes, immediately |
| Add a new sub-skill to a router | **Yes** — extends the design document | Yes | Yes, treat as new skill build |
| Change a handoff contract | **Yes** — affects multiple skills | Yes (breaking-change tag) | Yes, coordinate across affected skills |

---

## 9. Decision Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Dependency-complete subset as the build-start threshold | All 10 documents before building creates a long feedback loop; rolling (each skill once its doc is done) risks rework when upstream designs shift. The subset (solution-discovery + application-design + schema-design) gives structural stability without over-designing before building begins. |
| 2 | Stub script for pp-devenv dependency | The environment variable fallback design (reading env vars when .pp-context/ is absent) would be the better long-term production design but adds upfront implementation work. The stub script is lower overhead for a solo developer — it's deleted once pp-devenv is built. |
| 3 | Markdown checklist + GitHub Issues for fork review | The checklist is the always-visible reference (readable in VS Code). The Issues are the trackable work items (assignable, closeable, filterable). Each serves a different purpose — using both provides reference and tracking without redundancy. |
| 4 | Issue-driven iteration | The alternative (informal in-place edits) creates undocumented divergence between the design documents and the implementation. Issue-driven iteration maintains traceability from gap discovery to design update to implementation change. |
| 5 | Build sequence follows dependency chains, not document production order | Documents were produced in a session-driven order (application-design, schema-design, ui-design, business-logic). The dependency chain order (solution-discovery first, then design layer, then build layer) avoids building a skill before the skills it depends on are stable. |
| 6 | Feature branches per skill, main is always stable | Solo developer workflow that preserves the ability to make emergency fixes to main without blocked-by-in-progress-feature constraints. Each skill being in a branch also creates a natural review checkpoint before merging. |
| 7 | Existing Claude.ai skills are reference material, not migration targets | The Claude.ai skills were designed for a conversational interface with no file system access. Direct migration would produce skills that are correctly structured for the wrong runtime. Translation preserves the domain knowledge while discarding the interface assumptions. |
| 8 | plugin-auditor agent absorbs full dataverse-csharp-plugin-audit capability | The audit skill is mature and comprehensive. Scoping it down would discard value. Promoting it to a resident agent makes the full capability available within the plugin development workflow without a separate invocation. |
| 9 | Minimal test project maintained in the repo | Each skill's checkpoint validation needs a consistent, controlled input. A shared minimal project ensures all skills are validated against the same baseline, making validation results comparable across skill implementations and builds. |
| 10 | Design document is the source of truth; implementation follows it | When implementation and design diverge, the design document wins. The implementation is updated to match, or the design document is updated with a versioned change. Allowing silent divergence makes the design documents useless as reference material. |
| 11 | solution-discovery added to dependency-complete subset (V2) | The V1 dependency-complete subset assumed solution-discovery's foundation format was stable enough from the roadmap alone. In practice, the foundation format needs a full skill specification (state machine, output format, section structure) before Phase 1 build can start safely. Adding it to the blocking set prevents cascading rework if the foundation format changes. |
| 12 | Removed testing and review as standalone skills (V2) | Testing and review are stages within each skill's workflow (the REVIEW stage), not separate skills with their own SKILL.md files. The V1 build sequence listed them as standalone Phase 4/5 items due to informal naming during initial document production. |
| 13 | solution-strategy paired with solution-discovery in Phase 1 (V2) | solution-strategy directly refines solution-discovery's `04-solution-packaging` output. Building it in the same phase keeps the packaging context fresh and avoids revisiting solution-discovery's output format later. |
| 14 | security moved to Phase 3 alongside ui-design and business-logic (V2) | security consumes schema-design outputs (`03-entity-map`, `08-security-profile`) at the same dependency level as ui-design and business-logic. It does not depend on Build layer outputs, so Phase 4 was too late. |

---

## 10. Open Items for Build

- **CLAUDE.md schema for Superpowers:** Read the actual Superpowers CLAUDE.md structure before starting the fork review. The manifest schema may have evolved since it was referenced in the design documents — verify the current format before producing the fork modification checklist.
- **pp-meta marker format:** When pp-meta is designed, it may require specific markers or metadata in each skill's SKILL.md for capability routing. If so, all 10 pp-superpowers SKILL.md files will need a retroactive update. Track as an open item until pp-meta design is complete.
- **Session state resume mechanism without pp-memory:** The minimal manual approach (developer copies skill state into conversation) is acceptable for development but needs to be clearly documented as the interim procedure so it's used consistently and doesn't produce confusing half-resumed sessions.
- **Design status tracking format:** `docs/design-status.md` is defined in this document but its format is minimal. Consider whether it should include the open item counts from each design document, or whether a simple approved/not-started status is sufficient.
- **Validation checkpoint tooling:** The checkpoints in §5.3 are described as manual walkthroughs. Consider whether any checkpoints can be automated (e.g., verifying that expected output files exist after a skill run, or linting SKILL.md for required sections).
- **GitHub Issue templates:** Define Issue templates for the three Issue types used in this plan: `fork-modification`, `skill-improvement`, and `design-update`. Templates ensure consistent issue content and make triage faster.
- **Fork update procedure:** When the upstream Superpowers repo receives structural updates (hooks system, CLAUDE.md schema), the procedure for selectively pulling those changes needs to be documented and tested. Define this before the first pull from upstream.
- **solution-discovery foundation format:** ~~The dependency-complete threshold requires solution-discovery's output format to be stable. The format is referenced in the pp-superpowers design roadmap but not fully specified in a dedicated skill design document. This document should be produced before Phase 1 build begins.~~ **Resolved in V2:** `pp-superpowers-solution-discovery.md` is now formally included in the dependency-complete subset (§2.1) and the build-ready signal checklist (§2.3). The foundation format is locked when this design document is approved.