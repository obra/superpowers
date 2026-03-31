# FeatureForge Session Entry Removal Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/2026-03-30-featureforge-session-entry-removal-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Remove session-entry gating and command surfaces from FeatureForge so workflow routing starts directly from artifact/runtime state with no session-entry prerequisite.

**Architecture:** Implement this as one hard-cutover slice across runtime, workflow routing, generated instructions, schemas, docs, and tests. First remove the runtime command/module and gate logic, then update output contracts and generated skill docs, then remove schema and gate-focused tests/docs, and finish with explicit anti-regression checks that fail closed if session-entry semantics reappear.

**Tech Stack:** Rust (`clap`, `serde`, `schemars`), Node-based skill-doc generation/tests, Rust integration tests (`cargo nextest`), checked-in markdown/runtime instruction surfaces

---

## Plan Contract

This plan defines implementation order and verification for removing session-entry from active FeatureForge surfaces. If this plan drifts from the approved spec, the approved spec wins and this plan must be updated in the same change.

## Existing Capabilities / Built-ins to Reuse

- `src/workflow/status.rs` and `src/workflow/operator.rs` already centralize route/phase semantics; remove session-entry branches there instead of creating fallback wrappers.
- `scripts/gen-skill-docs.mjs` already owns generated `using-featureforge` prose construction; remove bypass-gate generation there.
- Existing contract suites (`tests/runtime_instruction_contracts.rs`, `tests/using_featureforge_skill.rs`, `tests/codex-runtime/skill-doc-contracts.test.mjs`) already enforce wording and route behavior; tighten them to prevent reintroduction.
- Existing workflow schemas (`schemas/workflow-status.schema.json`, `schemas/workflow-resolve.schema.json`) provide the versioned output contract surface to carry explicit output-version changes.

## Known Footguns / Constraints

- This is a hard removal: no compatibility alias or migration shim for `featureforge session-entry`.
- Session-entry language remains valid only in archived docs (`docs/archive/**`) and historical execution evidence; active runtime/docs/tests must not depend on it.
- Output contract removals must not silently drift; schema/output version updates and release-note deltas are required in the same slice.
- `src/workflow/status.rs`, `src/workflow/operator.rs`, `tests/workflow_runtime.rs`, and `tests/using_featureforge_skill.rs` are shared hotspots and should be changed in ordered serial tasks.
- Generated skill docs must be regenerated in the same task that edits the corresponding template/generator logic.

## Cross-Task Invariants

- Use `featureforge:test-driven-development` for each task: add/update failing assertions first, then implement minimal changes.
- Keep `cargo clippy --all-targets --all-features -- -D warnings` clean.
- Do not weaken lint policy or add `#[allow(clippy::...)]` suppressions.
- Keep release-facing docs and output schemas aligned with runtime behavior in the same commit series.
- Add anti-regression assertions that fail if session-entry gate env keys, module wiring, or gate prose return.

## Change Surface

- CLI/runtime removal: `src/cli/mod.rs`, `src/lib.rs`, `src/compat/argv0.rs`, `src/cli/session_entry.rs` (delete), `src/session_entry/mod.rs` (delete)
- Workflow routing/output contracts: `src/workflow/status.rs`, `src/workflow/operator.rs`, `schemas/workflow-status.schema.json`, `schemas/workflow-resolve.schema.json`
- Generated skill/runtime instructions: `scripts/gen-skill-docs.mjs`, `skills/using-featureforge/SKILL.md.tmpl`, `skills/using-featureforge/SKILL.md`
- Session-entry schema surface: `schemas/session-entry-resolve.schema.json` (delete), `tests/packet_and_schema.rs`
- Docs/evals: `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, `docs/testing.md`, `tests/evals/README.md`, `tests/evals/using-featureforge-routing.scenarios.md`, `RELEASE-NOTES.md`
- Test suites: `tests/cli_parse_boundary.rs`, `tests/workflow_runtime.rs`, `tests/workflow_shell_smoke.rs`, `tests/workflow_entry_shell_smoke.rs`, `tests/workflow_runtime_final_review.rs`, `tests/using_featureforge_skill.rs`, `tests/runtime_instruction_contracts.rs`, `tests/codex-runtime/gen-skill-docs.unit.test.mjs`, `tests/codex-runtime/skill-doc-contracts.test.mjs`

## Preconditions

- Approved source spec exists at `docs/featureforge/specs/2026-03-30-featureforge-session-entry-removal-design.md` with:
  - `**Workflow State:** CEO Approved`
  - `**Spec Revision:** 1`
  - `**Last Reviewed By:** plan-ceo-review`
- Rust and Node toolchains are available for `cargo`, `cargo nextest`, and `node --test`.
- Packaged helper binary is available at `~/.featureforge/install/bin/featureforge`.

## Evidence Expectations

- Deleted runtime/session-entry files are absent from active crate wiring.
- Workflow output payloads and schemas reflect removed session-entry fields/enums and explicit version deltas.
- Generated `skills/using-featureforge/SKILL.md` contains no session-entry gate section or strict gate env export.
- `schemas/session-entry-resolve.schema.json` is removed from active schema checks.
- Contract tests fail closed on any reintroduction of session-entry gate semantics in active runtime/docs/templates.

## Validation Strategy

- Task-level targeted suites per task below.
- Final gate:
  - `node scripts/gen-skill-docs.mjs --check`
  - `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/gen-skill-docs.unit.test.mjs`
  - `cargo clippy --all-targets --all-features -- -D warnings`
  - `cargo nextest run --test runtime_instruction_contracts --test using_featureforge_skill --test workflow_runtime --test workflow_runtime_final_review --test workflow_shell_smoke --test workflow_entry_shell_smoke --test cli_parse_boundary --test packet_and_schema`

## Documentation Update Expectations

- Active docs must no longer describe `featureforge session-entry` as an entry requirement.
- `using-featureforge` generated docs must reflect direct workflow routing without bypass prompt language.
- `RELEASE-NOTES.md` must include a “breaking output contract changes” section listing removed command/output semantics and updated output versions.
- Archived docs under `docs/archive/**` remain unchanged.

## Rollout Plan

- Land tasks in serial order to avoid hotspot churn and ensure contract deltas stay coherent.
- Keep runtime removal and test/doc contract updates in the same implementation slice.
- Ship as pre-adoption hard cutover (no migration shims).

## Rollback Plan

- Revert the full removal slice if critical regressions appear.
- Do not partially reintroduce gate behavior; rollback should restore the prior coherent contract set.
- If only doc/schema drift occurs, revert offending commit and re-run full contract gates.

## Risks and Mitigations

- Risk: Hidden dependencies on session-entry fields in workflow tests or tooling.
  - Mitigation: explicit output-delta tests and schema/version updates in same slice.
- Risk: Generator/template drift re-adds gate prose.
  - Mitigation: Node contract tests reject gate env/prose references.
- Risk: Runtime reintroduction of path/module references over time.
  - Mitigation: static anti-regression checks in active instruction/runtime contract suites.

## Execution Strategy

- Execute Task 1 serially. Establishes CLI/runtime deletion boundaries and removes session-entry wiring that later routing/test tasks assume is absent.
- Execute Task 2 serially after Task 1. Applies workflow output-contract removals and version deltas that must build on the post-removal runtime state.
- Execute Task 3 serially after Task 2. Regenerates and revalidates `using-featureforge` contract text against the updated workflow/output semantics.
- Execute Task 4 serially after Task 3. Removes the session-entry schema artifact only after generator/runtime contract changes are settled.
- Execute Task 5 serially after Task 4. Rewrites runtime-instruction/eval/test contracts against the finalized removed surfaces and schema state.
- Execute Task 6 serially after Task 5. Finalizes release/docs deltas and runs the full regression gate on the integrated contract set.

## Dependency Diagram

```text
Task 1 -> Task 2
Task 2 -> Task 3
Task 3 -> Task 4
Task 4 -> Task 5
Task 5 -> Task 6
```

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 2
- REQ-003 -> Task 2
- REQ-004 -> Task 3
- REQ-005 -> Task 4
- REQ-006 -> Task 5, Task 6
- REQ-007 -> Task 5
- REQ-008 -> Task 3, Task 5
- REQ-009 -> Task 2, Task 6
- REQ-010 -> Task 3, Task 5
- REQ-011 -> Task 1, Task 5

## Task 1: Remove Session-Entry CLI and Runtime Module Surfaces

**Spec Coverage:** REQ-001, REQ-011  
**Task Outcome:** The `featureforge session-entry` command family and runtime module wiring are removed from active runtime surfaces.  
**Plan Constraints:**
- No compatibility alias or migration shim.
- Keep parse-boundary behavior as default unknown command handling.
**Open Questions:** none

**Files:**
- Modify: `src/cli/mod.rs`
- Modify: `src/lib.rs`
- Modify: `src/compat/argv0.rs`
- Delete: `src/cli/session_entry.rs`
- Delete: `src/session_entry/mod.rs`
- Modify: `tests/cli_parse_boundary.rs`
- Test: `tests/cli_parse_boundary.rs`

- [x] **Step 1: Add red parse-boundary assertions in `tests/cli_parse_boundary.rs` for removed `session-entry` command surface**
- [x] **Step 2: Run targeted test and confirm red state**
Run: `cargo nextest run --test cli_parse_boundary`  
Expected: fail on old command assumptions
- [x] **Step 3: Remove CLI wiring, module exports, argv0 alias, and delete `session_entry` source files**
- [x] **Step 4: Re-run parse-boundary suite and confirm green**
Run: `cargo nextest run --test cli_parse_boundary`  
Expected: pass with unknown-command behavior for `session-entry`
- [x] **Step 5: Commit**
```bash
git add src/cli/mod.rs src/lib.rs src/compat/argv0.rs tests/cli_parse_boundary.rs
git rm src/cli/session_entry.rs src/session_entry/mod.rs
git commit -m "refactor: remove session-entry command surfaces"
```

## Task 2: Remove Session-Entry Routing Semantics and Version Output Contracts

**Spec Coverage:** REQ-002, REQ-003, REQ-009  
**Task Outcome:** Workflow route/phase/doctor/handoff outputs no longer carry session-entry semantics, and changed output families include explicit version signaling/schema updates.  
**Plan Constraints:**
- Remove `needs_user_choice` / `bypassed` gate-only phase/action/status outcomes.
- Remove strict gate reason codes and diagnostics.
- Explicitly remove `next_action` values `session_entry_gate` and `continue_outside_featureforge`.
- Explicitly remove session-entry gate text from `workflow next`, `workflow artifacts`, `workflow explain`, and text `phase` / `doctor` / `handoff`.
- Apply explicit output-version/schema updates in the same slice.
- Add fail-closed tests that assert changed output families carry the expected schema/version identifiers.
**Open Questions:** none

**Files:**
- Modify: `src/workflow/status.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `schemas/workflow-status.schema.json`
- Modify: `schemas/workflow-resolve.schema.json`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Modify: `tests/workflow_runtime_final_review.rs`
- Test: `tests/workflow_runtime.rs`
- Test: `tests/workflow_shell_smoke.rs`
- Test: `tests/workflow_runtime_final_review.rs`

- [x] **Step 1: Add red workflow output assertions for removed `session_entry` fields, removed gate-only phase/actions (`session_entry_gate`, `continue_outside_featureforge`), removed strict-gate reason codes, and removal of session-entry gate prose from text command outputs**
- [x] **Step 2: Run targeted workflow suites and confirm red state**
Run: `cargo nextest run --test workflow_runtime --test workflow_shell_smoke --test workflow_runtime_final_review`  
Expected: fail on prior gate semantics
- [x] **Step 3: Remove session-entry branches/fields from status/operator, update output version/schema files for changed families, and add explicit version assertions in tests for each changed output family**
- [x] **Step 4: Re-run targeted workflow suites and confirm green**
Run: `cargo nextest run --test workflow_runtime --test workflow_shell_smoke --test workflow_runtime_final_review`  
Expected: pass with direct non-gated routing model
- [x] **Step 5: Commit**
```bash
git add src/workflow/status.rs src/workflow/operator.rs schemas/workflow-status.schema.json schemas/workflow-resolve.schema.json tests/workflow_runtime.rs tests/workflow_shell_smoke.rs tests/workflow_runtime_final_review.rs
git commit -m "refactor: drop session-entry routing states and update output contracts"
```

## Task 3: Remove Bypass-Gate Generation and Add Reintroduction Guards

**Spec Coverage:** REQ-004, REQ-008, REQ-010  
**Task Outcome:** Generated `using-featureforge` instructions contain no session-entry bypass gate, and contract tests fail if gate env/prose semantics are reintroduced.  
**Plan Constraints:**
- Remove bypass gate generation from source, not only generated output.
- Regenerate checked-in `skills/using-featureforge/SKILL.md` in this task.
- Add negative checks for removed env keys and gate prose.
- Named env-key checks must explicitly include `FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY`, `FEATUREFORGE_SPAWNED_SUBAGENT`, and `FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN`.
**Open Questions:** none

**Files:**
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `skills/using-featureforge/SKILL.md.tmpl`
- Modify: `skills/using-featureforge/SKILL.md`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/using_featureforge_skill.rs`
- Test: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/using_featureforge_skill.rs`

- [x] **Step 1: Add red Node/Rust assertions that fail when session-entry gate sections appear or when named env keys (`FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY`, `FEATUREFORGE_SPAWNED_SUBAGENT`, `FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN`) appear in active generated surfaces**
- [x] **Step 2: Run targeted suites and confirm red state**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`  
Expected: fail on old gate content assumptions
- [x] **Step 3: Remove bypass-gate builder/template insertion from generator/template and regenerate skill docs**
Run: `node scripts/gen-skill-docs.mjs`
- [x] **Step 4: Re-run targeted Node and Rust suites and confirm green**
Run: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`  
Run: `cargo nextest run --test using_featureforge_skill`  
Expected: pass with no bypass-gate contract in active skill docs
- [x] **Step 5: Commit**
```bash
git add scripts/gen-skill-docs.mjs skills/using-featureforge/SKILL.md.tmpl skills/using-featureforge/SKILL.md tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/using_featureforge_skill.rs
git commit -m "docs: remove using-featureforge bypass-gate generation"
```

## Task 4: Remove Session-Entry Schema Surface

**Spec Coverage:** REQ-005  
**Task Outcome:** `schemas/session-entry-resolve.schema.json` is removed from active schema surfaces and parity tests.  
**Plan Constraints:**
- Remove schema as active contract artifact.
- Keep other schema parity tests intact.
**Open Questions:** none

**Files:**
- Delete: `schemas/session-entry-resolve.schema.json`
- Modify: `tests/packet_and_schema.rs`
- Test: `tests/packet_and_schema.rs`

- [x] **Step 1: Add red schema parity assertions reflecting absence of session-entry schema artifact**
- [x] **Step 2: Run targeted schema suite and confirm red state**
Run: `cargo nextest run --test packet_and_schema`  
Expected: fail while old schema is still expected
- [x] **Step 3: Remove checked-in schema artifact and update parity checks**
- [x] **Step 4: Re-run targeted schema suite and confirm green**
Run: `cargo nextest run --test packet_and_schema`  
Expected: pass without session-entry schema dependency
- [x] **Step 5: Commit**
```bash
git add tests/packet_and_schema.rs
git rm schemas/session-entry-resolve.schema.json
git commit -m "test: remove session-entry schema parity surface"
```

## Task 5: Rewrite Runtime/Instruction Contracts and Evals to Non-Gated Routing

**Spec Coverage:** REQ-007, REQ-008, REQ-010, REQ-011  
**Task Outcome:** Active test/eval/instruction surfaces validate direct workflow routing with no session-entry prerequisites and reject reintroduced session-entry module/path references.  
**Plan Constraints:**
- Preserve archive references; guard only active runtime/docs/templates.
- Remove gate-seeding behavior from workflow smoke fixtures.
- Add static anti-regression checks for legacy gate path/module strings outside archive scope.
- Add explicit anti-regression checks for named env keys (`FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY`, `FEATUREFORGE_SPAWNED_SUBAGENT`, `FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN`) across runtime-instruction and contract surfaces.
**Open Questions:** none

**Files:**
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/workflow_entry_shell_smoke.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Modify: `tests/evals/README.md`
- Modify: `tests/evals/using-featureforge-routing.scenarios.md`
- Test: `tests/runtime_instruction_contracts.rs`
- Test: `tests/workflow_entry_shell_smoke.rs`
- Test: `tests/workflow_shell_smoke.rs`

- [x] **Step 1: Add red contract assertions for non-gated entry behavior and anti-regression checks against gate module/path reintroduction**
- [x] **Step 2: Run targeted suites and confirm red state**
Run: `cargo nextest run --test runtime_instruction_contracts --test workflow_entry_shell_smoke --test workflow_shell_smoke`  
Expected: fail on old gate expectations
- [x] **Step 3: Update runtime-instruction and eval docs/tests to direct-routing semantics and remove session-entry seeding requirements**
- [x] **Step 4: Re-run targeted suites and confirm green**
Run: `cargo nextest run --test runtime_instruction_contracts --test workflow_entry_shell_smoke --test workflow_shell_smoke`  
Expected: pass under no-gate contracts
- [x] **Step 5: Commit**
```bash
git add tests/runtime_instruction_contracts.rs tests/workflow_entry_shell_smoke.rs tests/workflow_shell_smoke.rs tests/evals/README.md tests/evals/using-featureforge-routing.scenarios.md
git commit -m "test: enforce non-gated workflow entry contracts"
```

## Task 6: Align Active Docs and Release Notes, Then Run Final Regression Gate

**Spec Coverage:** REQ-006, REQ-009  
**Task Outcome:** Active docs and release notes match the hard-removal contract, and the final validation matrix is green.  
**Plan Constraints:**
- Keep archived historical docs untouched.
- Include explicit release-note delta for removed command/output contracts.
- Final gate must include strict clippy and targeted contract suites.
**Open Questions:** none

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Test: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/runtime_instruction_contracts.rs`
- Test: `tests/using_featureforge_skill.rs`
- Test: `tests/workflow_runtime.rs`
- Test: `tests/workflow_runtime_final_review.rs`
- Test: `tests/workflow_shell_smoke.rs`
- Test: `tests/workflow_entry_shell_smoke.rs`
- Test: `tests/cli_parse_boundary.rs`
- Test: `tests/packet_and_schema.rs`

- [x] **Step 1: Add/adjust doc assertions in contract suites for active README/testing surfaces with no session-entry gate language**
- [x] **Step 2: Update active docs and `RELEASE-NOTES.md` with explicit breaking output contract deltas**
- [x] **Step 3: Run final validation gate and fix failures until fully green**
Run: `node scripts/gen-skill-docs.mjs --check`  
Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/gen-skill-docs.unit.test.mjs`  
Run: `cargo clippy --all-targets --all-features -- -D warnings`  
Run: `cargo nextest run --test runtime_instruction_contracts --test using_featureforge_skill --test workflow_runtime --test workflow_runtime_final_review --test workflow_shell_smoke --test workflow_entry_shell_smoke --test cli_parse_boundary --test packet_and_schema`  
Expected: all pass
- [ ] **Step 4: Commit final integration slice**

  **Execution Note:** Interrupted - Final review found missing explicit workflow JSON version signaling and missing release-note breaking contract detail.
```bash
git add README.md docs/README.codex.md docs/README.copilot.md docs/testing.md RELEASE-NOTES.md
git commit -m "docs: finalize session-entry removal rollout contracts"
```

## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T14:09:34Z
**Review Mode:** small_change
**Reviewed Plan Revision:** 1
**Critical Gaps:** 0
**Browser QA Required:** no
**Test Plan Artifact:** `/Users/davidmulcahey/.featureforge/projects/dmulcahey-featureforge/davidmulcahey-current-test-plan-20260330-140813.md`
**Outside Voice:** fresh-context-subagent
