# BUILD-TRACKER.md — pp-superpowers Central Build Plan

**Last updated:** April 2, 2026 (Phase 2 in progress — application-design and schema-design skills built, pending live test)  
**Purpose:** Single source of truth for build progress. Read this file at the start of every Claude Code session.

---

## Current Position

**Phase 2 — Design Layer**  
**Active task:** Fix MIND_MAP diagram write-back issue found in live test, then re-test  
**Branch:** `feature/phase2-design-layer`

---

## Immediate Next Actions

Complete these in order. Check off in this file as each is done.

### Phase 2: Build application-design and schema-design

**Branch:** `feature/phase2-design-layer`

#### Step 1 — Agents (parallel)

- [x] `agents/domain-modeler.md` — dispatched by application-design Mode A (April 2)
- [x] `agents/solution-analyzer.md` — dispatched by application-design Mode B (April 2)
- [x] `agents/schema-reviewer.md` — dispatched by schema-design REVIEW (April 2)

#### Step 2 — application-design skill

- [x] `skills/application-design/SKILL.md` — 7-stage state machine, Mode A/B fork, prerequisites, companion loading (April 2)
- [x] `skills/application-design/conversation-guide.md` — stage-by-stage flow, DDD model template, enrichment protocol, Whimsical/Mermaid specs (April 2)

#### Step 3 — schema-design skill

- [x] `skills/schema-design/SKILL.md` — 8-stage state machine, DDD detection, re-entry support, knowledge domain companion (April 2)
- [x] `skills/schema-design/conversation-guide.md` — stage-by-stage flow, physical model template, denormalization log template, ERD specs (April 2)
- [x] `skills/schema-design/knowledge-domains.md` — column types, table types, relationship behaviors, naming conventions, anti-patterns, parity check reference (April 2)

#### Step 4 — Routing and tracker

- [x] `skills/using-pp-superpowers/SKILL.md` — added application-design and schema-design to routing table (April 2)
- [x] `BUILD-TRACKER.md` — updated current position, added Phase 2 checklist (April 2)

#### Step 5 — Live-test application-design (Mode A)

Start a fresh Claude Code conversation. Invoke application-design with a project that has a complete `.foundation/` (run solution-discovery CREATE mode first if needed).

**What to verify:**

- [x] Prerequisite gate — blocks if foundation files missing (April 5)
- [x] Plan mode hard-gate fires (April 5)
- [x] Mode selection presented at DOMAIN_ANALYSIS (April 5)
- [x] domain-modeler agent dispatched (Mode A) — produced solid 4-entity model (April 5)
- [x] Three-round confirmation: bounded contexts → aggregates → ubiquitous language (April 5)
- [x] CONCEPTUAL_MODEL formalization presented (April 5)
- [x] DOCUMENTATION writes `docs/ddd-model.md` using template (April 5)
- [x] Bounded context / single-solution tension check — correctly found no tension with 1 context (April 5)
- [x] MIND_MAP generates Mermaid diagrams (Whimsical correctly detected as unavailable) (April 5) — **Note:** Whimsical replaced with Excalidraw as diagram tool (April 5)
- [ ] **BUG:** MIND_MAP diagrams generated but NOT written back to `docs/ddd-model.md` — placeholder text remained. **Fix applied:** added EXTREMELY-IMPORTANT directive to conversation-guide.md requiring file edit. Re-test needed.
- [x] REVIEW checklist runs with all items (April 5)
- [x] COMPLETE writes state to `.pp-context/skill-state.json`, suggests schema-design, waits (April 5)
- [x] State file updated at each stage transition with real UTC timestamps (April 5)

#### Step 6 — Live-test schema-design (with DDD model)

Run immediately after application-design completes (DDD model exists at `docs/ddd-model.md`).

**What to verify:**

- [ ] INIT detects and loads DDD model, presents entity/context/aggregate counts
- [ ] CONCEPTUAL_MODEL pre-informed by DDD (not asking from scratch)
- [ ] LOGICAL_MODEL loads `knowledge-domains.md` at entry
- [ ] Three rounds: attributes → candidate keys → normalization
- [ ] PHYSICAL_MODEL three rounds: column types → table config → relationship behaviors
- [ ] Physical model document written to `docs/schema-physical-model.md`
- [ ] ERD generated (Mermaid fallback expected)
- [ ] UX_DENORMALIZATION skip logic (if no UI plan, should skip with note)
- [ ] PARITY_CHECK runs anti-pattern scan and system table overlap check
- [ ] REVIEW dispatches schema-reviewer agent, presents findings
- [ ] COMPLETE writes state with artifact list, suggests ui-design, waits

#### Step 7 — Fix issues found during live tests

Branch stays open. Fix on `feature/phase2-design-layer`.

#### Step 8 — Merge to main

```bash
git checkout main
git merge feature/phase2-design-layer
git branch -d feature/phase2-design-layer
```

#### Deferred tests (not blocking merge)

- [ ] application-design Mode B (needs real solution artifacts)
- [ ] schema-design without DDD model
- [ ] schema-design re-entry (delta mode)

---

### Phase 1 completed actions (archived)

### 1. Live-test solution-discovery (CREATE mode)

Start a fresh Claude Code conversation in the pp-superpowers directory. The session-start hook injects `using-pp-superpowers`, which lists `solution-discovery` as an available skill. Invoke it and walk through CREATE mode with a lightweight scenario (e.g., "ProjectCentral — a project management app, greenfield, 4-5 entities").

**What to verify:**

- [x] Mode detection — no `.foundation/` triggers CREATE mode (confirmed April 2)
- [x] Companion file loading — Claude reads `conversation-guide.md` at CREATE entry (confirmed April 2)
- [x] Stage progression — full end-to-end, all 10 stages completed (confirmed April 2, post-fix retest)
- [x] Skip logic — deferred 05-ui-plan, 06-logic-map, 08-security-profile; placeholder files written correctly (confirmed April 2)
- [x] State tracking — `.discovery-state.json` updated at each stage transition (confirmed April 2, post plan mode fix)
- [x] REVIEW stage — summary rendered with per-section status, cross-section consistency checks ran clean (confirmed April 2)
- [x] COMPLETE stage — suggested application-design as next skill, waited for confirmation (confirmed April 2)

**Common failure modes to watch for:**

- Claude doesn't read companion files → directive language not strong enough in SKILL.md
- State file not written after every stage → directive buried or unclear in conversation-guide.md
- Placeholder file format wrong → template not followed from foundation-formats.md
- Skip offer triggers false skips → phrasing issue in conversation-guide.md
- Stage gate too strict or too loose → gate conditions in conversation-guide.md

### 2. Fix issues found during live test

Branch stays open. Fix on the same `feature/pp-solution-discovery` branch.

**Issues identified during April 2 live test:**

- [x] **Build `architecture-advisor` agent** — Created `agents/architecture-advisor.md` with full analysis process, output format, evaluation criteria, and Microsoft Learn MCP integration (nice-to-have, not blocking).
- [x] **Resolve plan mode conflict** — Added HARD-GATE directive in SKILL.md (between Announce and Mode Selection) that tells the developer to exit plan mode via Shift+Tab before the skill proceeds.
- [x] **Re-run full end-to-end CREATE mode test** — all stages passed including skip logic (3 deferred sections), state tracking, REVIEW with consistency checks, and COMPLETE with downstream suggestion. Architecture-advisor agent dispatched successfully and caught Dataverse for Teams licensing constraint. Plan mode directive worked — detected active plan mode, told user to exit, waited.

### 3. Merge to main

After successful live test, merge feature branch. Main should always be stable.

```bash
git checkout main
git merge feature/pp-solution-discovery
git branch -d feature/pp-solution-discovery
```

### 4. Optional — Test RESUME mode

Kill a session mid-flow (e.g., after 3 stages). Start new session, invoke solution-discovery. Verify it detects partial `.foundation/`, reads `.discovery-state.json`, presents status summary, resumes at correct stage.

### 5. Fork cleanup pass

Before starting Phase 1b (solution-strategy), clean up the remaining Superpowers artifacts. No separate cleanup branch was created — cleanup items completed so far are on the `feature/pp-solution-discovery` branch. Remaining items should be done on a dedicated branch or bundled with the solution-discovery merge.

**Completed (on `feature/pp-solution-discovery`):**

- [x] Update `.claude-plugin/plugin.json` — name → `pp-superpowers`, description, version `0.1.0`, author, repo URL (`4d2374f`)
- [x] Update `.cursor-plugin/plugin.json` — name → `pp-superpowers`, description, version `0.1.0`, author, repo URL (`4d2374f`)
- [x] Update `.claude-plugin/marketplace.json` — all fields to pp-superpowers identity (`b30601e`)
- [x] Remove deprecated commands: `commands/brainstorm.md`, `commands/write-plan.md`, `commands/execute-plan.md`; added `commands/.gitkeep` (`6b35953`)
- [x] Remove `skills/using-superpowers/` — replaced by `using-pp-superpowers/`, including `references/codex-tools.md` and `references/gemini-tools.md` (`6fc4658`)

**Remaining items (from fork-modification-checklist.md):**

- [x] Remove `.cursor-plugin/` — not in scope (April 2)
- [x] Remove `hooks-cursor.json` — not in scope (April 2)
- [x] Remove `gemini-extension.json`, `GEMINI.md` — not in scope (April 2)
- [x] Remove `package.json` — OpenCode npm support, not in scope (April 2)
- [x] Remove `docs/README.opencode.md`, `docs/README.codex.md` — not in scope (April 2)
- [x] Remove `RELEASE-NOTES.md` — Superpowers-specific (April 2)
- [x] Remove `agents/code-reviewer.md` — replaced by domain-specific agents later (April 2)
- [x] Remove remaining Superpowers skills: `writing-plans/`, `executing-plans/`, `subagent-driven-development/`, `test-driven-development/`, `systematic-debugging/`, `verification-before-completion/`, `requesting-code-review/`, `receiving-code-review/`, `dispatching-parallel-agents/`, `writing-skills/` (April 2)
- [x] Remove `docs/testing.md`, `docs/plans/`, `docs/superpowers/` (April 2)
- [x] Remove `tests/explicit-skill-requests/`, `tests/claude-code/`, `tests/brainstorm-server/` (April 2)
- [x] Keep (evaluate later): `using-git-worktrees/`, `finishing-a-development-branch/` — revisit during alm-workflow (confirmed April 2)
- [x] Update `.gitignore` — added `.discovery-state.json` (`.pp-context/`, `.foundation/` already present) (April 2)
- [x] Rewrite `README.md` — pp-superpowers identity, minimal scope (April 2)

**Additional items discovered and completed (April 2):**

- [x] Remove `.codex/` — Codex platform support, not in scope per D2
- [x] Remove `.opencode/` — OpenCode platform support, not in scope per D2
- [x] Remove `CHANGELOG.md` — Superpowers-specific, same category as RELEASE-NOTES.md
- [x] Remove `tests/skill-triggering/` — all prompts reference removed Superpowers skills
- [x] Remove `tests/subagent-driven-dev/` — tests removed subagent-driven-development skill
- [x] Remove `tests/opencode/` — tests for out-of-scope platform
- [x] Update `.claude-plugin/plugin.json` keywords — replaced Superpowers terms (tdd, debugging, collaboration) with Power Platform terms

Merge to main after cleanup is validated.

### 6. Design and build solution-strategy (Phase 1b)

**Design doc:** `pp-superpowers-solution-strategy.md` — written April 2 (Draft — pending approval).

**What solution-strategy does:** Refines solution packaging decisions from solution-discovery's `04-solution-packaging.md`. Paired with solution-discovery in Phase 1 because it directly operates on solution-discovery's output while context is fresh.

**Completed (April 2):**

- [x] **Write design doc** — `docs/pp-superpowers-solution-strategy.md` v1.0 draft. 10 sections: overview, mode architecture, state machine (7 stages with fast/full paths), conversation flow, output specs, validation rules, handoff contract, decision tree, decision log, open items.
- [x] **Create feature branch** — `feature/skill-solution-strategy`
- [x] **Build SKILL.md** — `skills/solution-strategy/SKILL.md` with frontmatter, plan mode hard-gate, prerequisites hard-gate, mode selection, companion file loading, state machine diagram (dot), stage-gate table, fast/full path logic, red flags, integration section.
- [x] **Build conversation-guide.md** — `skills/solution-strategy/conversation-guide.md` with all stage flows (INIT, ASSESS with decision tree, PACKAGING_DESIGN for full path, ENVIRONMENT_MAP, DEPLOYMENT_PLAN, REVIEW with cross-reference checks, COMPLETE with suggestion logic), UPDATE mode flow, enriched 04 template, state file schema.
- [x] **Update using-pp-superpowers** — added solution-strategy to skill routing table

**Remaining:**

- [x] **Live test (fast path)** — used existing Project Scheduler `.foundation/` (single-solution greenfield). All passed: fast path triggered correctly, abbreviated questions for ENVIRONMENT_MAP and DEPLOYMENT_PLAN, enriched 04 written with all new sections, state file created and updated per stage, plan mode hard-gate worked, REVIEW cross-reference checks ran, suggested application-design at COMPLETE. **Issue found:** timestamps used `T00:00:00Z` placeholders instead of real UTC values — fixed by adding explicit timestamp directive to conversation-guide.md.
- [x] **Live test (full path)** — used UPDATE mode to switch from single → multi-solution. All passed: UPDATE mode detected correctly, PACKAGING_DESIGN ran all 3 rounds (domain identification, solution definition, dependency validation), ISV round correctly skipped, ENVIRONMENT_MAP and DEPLOYMENT_PLAN ran full rounds, REVIEW cross-reference checks caught licensing advisory and no-test-environment advisory, enriched 04 written with Solution Dependencies section, timestamp fix confirmed (real UTC values), update record added to state file. **Minor observation:** state file `mode` field remained `"CREATE"` instead of `"UPDATE"` — non-blocking, update record documents the change correctly.
- [x] **Fix issues from live tests** — no blocking issues found
- [x] **Approve design doc** — status changed from Draft to Approved (April 2)
- [x] **Merge to main** — merged April 2, feature branch deleted

After solution-strategy is built and merged, Phase 1 is complete.

---

## Build Sequence (full plan)

From implementation plan v2.0 §4.2. Each phase depends on the one before it.

```
Phase 1 — Foundation                          ✓ COMPLETE
  solution-discovery     [BUILT, fully validated — April 2]
  solution-strategy      [BUILT, fully validated — April 2]

Phase 2 — Design Layer (parallel after Phase 1) ← YOU ARE HERE
  application-design     [BUILT, pending live test — April 2]
  schema-design          [BUILT, pending live test — April 2]

Phase 3 — Build Layer (parallel after Phase 2)
  ui-design              [design approved, not built]
  business-logic         [design approved, not built]
  security               [design not started]

Phase 4 — Lifecycle (parallel after Phase 3)
  integration            [design not started]
  alm-workflow           [design not started]
  environment-setup      [design not started]
```

---

## Design Document Status

| Document | Status | Version | Blocks Build Of |
|---|---|---|---|
| plugin-suite-design-roadmap | Approved | 1.0 | — |
| pp-superpowers-design-roadmap | Approved | 1.0 | — |
| pp-superpowers-solution-discovery | Approved | 1.0 | — (skill built) |
| pp-superpowers-application-design | Approved | 1.0 | Phase 2: application-design |
| pp-superpowers-schema-design | Approved | 1.0 | Phase 2: schema-design |
| pp-superpowers-ui-design | Approved | 1.0 | Phase 3: ui-design |
| pp-superpowers-business-logic | Approved | 1.0 | Phase 3: business-logic |
| pp-superpowers-implementation-plan | Approved | 2.0 | — (this tracker replaces its "what's next" role) |
| pp-superpowers-solution-strategy | Approved | 1.0 | — (skill built) |
| pp-superpowers-security | **Not started** | — | Phase 3: security |
| pp-superpowers-integration | **Not started** | — | Phase 4: integration |
| pp-superpowers-alm-workflow | **Not started** | — | Phase 4: alm-workflow |
| pp-superpowers-environment-setup | **Not started** | — | Phase 4: environment-setup |

---

## Known Gaps and Debt

Tracked items that are not blocking the immediate next action but must be addressed.

| # | Item | When to Address | Source |
|---|---|---|---|
| 1 | ~~`architecture-advisor` agent~~ — **resolved:** created `agents/architecture-advisor.md` | Done | next-session-prompt, April 2 live test |
| 2 | `tests/minimal-project/.foundation/` directory created but empty | Before Phase 2 starts — needed for validation baseline | implementation plan §5.2 |
| 3 | Session state resume without pp-memory — interim procedure undocumented | Document once RESUME mode is live-tested | implementation plan §10 |
| 4 | pp-meta marker format may require retroactive SKILL.md updates | When pp-meta design starts | implementation plan §10 |
| 5 | GitHub Issue templates (`fork-modification`, `skill-improvement`, `design-update`) not created | Before Phase 2 — volume increases | implementation plan §10 |
| 6 | Validation checkpoint automation (verifying output files exist, linting SKILL.md) | Evaluate during Phase 2 | implementation plan §10 |
| 7 | ~~`domain-modeler`, `solution-analyzer`, and future agents — global agents vs local prompt templates~~ — **resolved:** all Phase 2 agents created as global agent files in `agents/`, matching architecture-advisor pattern | Done | fork-modification-checklist |
| 8 | `using-git-worktrees/`, `finishing-a-development-branch/` — keep or adapt | During alm-workflow skill build | fork-modification-checklist |
| 9 | UPDATE mode live testing for solution-discovery | After CREATE mode is validated and a complete `.foundation/` exists | next-session-prompt |
| 10 | ~~Plan mode conflict~~ — **resolved:** HARD-GATE directive added to SKILL.md telling developer to exit plan mode before proceeding | Done | April 2 live test |
| 11 | pp-superpowers must NOT coexist with the marketplace `superpowers` plugin — the original plugin's `brainstorming` skill has an aggressive trigger that hijacks routing away from `solution-discovery`. Users must uninstall `superpowers@claude-plugins-official` before installing pp-superpowers. | Document in README.md during §5 fork cleanup | April 2 live test |

---

## Reference Documents

These documents are the authoritative source of truth for their domains. This tracker is a working view — when tracker and source conflict, the source document wins.

| Document | Role |
|---|---|
| `pp-superpowers-implementation-plan.md` | Build sequence, validation checkpoints, change protocol, cross-plugin phasing |
| `pp-superpowers-design-roadmap.md` | Fork transformation plan, skill inventory, target repo structure, agent inventory |
| `fork-modification-checklist.md` | Line-by-line fork changes (KEEP/REPLACE/REMOVE/ADD) with divergence analysis (D1–D9) |
| `design-status.md` | Replaced by the Design Document Status table above — keep in sync or deprecate |
| Individual skill specs (`pp-superpowers-[skill].md`) | Authoritative design for each skill's state machine, conversation flow, output format |

---

## Suite-Level Context (for reference)

**Plugin build order** (once pp-superpowers design is complete):  
pp-devenv → pp-meta → pp-memory → **pp-superpowers** → pp-research → pp-docs

pp-superpowers is the current focus. The other five plugins have their own design and implementation cycles. `dev-stub.sh` in the repo root provides fake `.pp-context/` data until pp-devenv is built.

---

## How to Use This File

**At session start:** Read this file. The "Current Position" and "Immediate Next Actions" sections tell you exactly what to work on.

**After completing a task:** Update the checkboxes and move "Current Position" to the next uncompleted action. Update "Last updated" date.

**When a new gap is discovered:** Add it to "Known Gaps and Debt" with a "When to Address" note.

**When a design document is approved:** Update the "Design Document Status" table.

**When a phase is complete:** Move the build sequence marker and archive completed actions into a "Completed" section at the bottom of this file if the file gets long.
