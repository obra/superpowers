# BUILD-TRACKER.md — pp-superpowers Central Build Plan

**Last updated:** April 2, 2026 (CREATE mode end-to-end test passed — all §1 and §2 items verified)  
**Purpose:** Single source of truth for build progress. Read this file at the start of every Claude Code session.

---

## Current Position

**Phase 1 — Foundation**  
**Active task:** Fork cleanup pass (§5)  
**Branch:** `main` (solution-discovery merged, feature branch deleted)

---

## Immediate Next Actions

Complete these in order. Check off in this file as each is done.

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

- [ ] Remove `.cursor-plugin/` — not in scope (note: plugin.json already updated to pp-superpowers identity)
- [ ] Remove `hooks-cursor.json` — not in scope
- [ ] Remove `gemini-extension.json`, `GEMINI.md` — not in scope
- [ ] Remove `package.json` — OpenCode npm support, not in scope
- [ ] Remove `docs/README.opencode.md`, `docs/README.codex.md` — not in scope
- [ ] Remove `RELEASE-NOTES.md` — Superpowers-specific
- [ ] Remove `agents/code-reviewer.md` — replaced by domain-specific agents later
- [ ] Remove remaining Superpowers skills: `writing-plans/`, `executing-plans/`, `subagent-driven-development/`, `test-driven-development/`, `systematic-debugging/`, `verification-before-completion/`, `requesting-code-review/`, `receiving-code-review/`, `dispatching-parallel-agents/`, `writing-skills/`
- [ ] Remove `docs/testing.md`, `docs/plans/`, `docs/superpowers/`
- [ ] Remove `tests/explicit-skill-requests/`, `tests/claude-code/`, `tests/brainstorm-server/`
- [ ] Keep (evaluate later): `using-git-worktrees/`, `finishing-a-development-branch/` — revisit during alm-workflow
- [ ] Update `.gitignore` — add `.pp-context/`, `.foundation/`, `.discovery-state.json`
- [ ] Rewrite `README.md` — pp-superpowers identity, skill inventory, Power Platform context

Merge to main after cleanup is validated.

### 6. Design and build solution-strategy (Phase 1b)

**Design doc:** `pp-superpowers-solution-strategy.md` — not started. Must be written and approved before building the skill.

**What solution-strategy does:** Refines solution packaging decisions from solution-discovery's `04-solution-packaging.md`. Paired with solution-discovery in Phase 1 because it directly operates on solution-discovery's output while context is fresh.

```bash
git checkout -b feature/skill-solution-strategy
```

After solution-strategy is built and merged, Phase 1 is complete.

---

## Build Sequence (full plan)

From implementation plan v2.0 §4.2. Each phase depends on the one before it.

```
Phase 1 — Foundation                          ← YOU ARE HERE
  solution-discovery     [BUILT, fully validated — end-to-end CREATE mode passed April 2]
  solution-strategy      [design not started]

Phase 2 — Design Layer (parallel after Phase 1)
  application-design     [design approved, not built]
  schema-design          [design approved, not built]

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
| pp-superpowers-solution-strategy | **Not started** | — | **Phase 1b: solution-strategy** |
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
| 7 | `domain-modeler`, `solution-analyzer`, and future agents — global agents vs local prompt templates | Decide per skill during that skill's build session | fork-modification-checklist |
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
