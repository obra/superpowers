# Evidence Rebuild Command Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add a single command path to detect and rebuild stale or invalidated FeatureForge evidence in one pass.

**Architecture:** Add a new execution CLI command that shares existing reopen/complete primitives, reuses current provenance checks, and emits deterministic JSON/text outcomes.

**Tech Stack:** Rust CLI/runtime (`src/cli`, `src/execution`, `src/workflow`), Rust tests (`tests/plan_execution.rs`), existing workflow contract tooling.

---

## Change Surface
- `src/cli/plan_execution.rs` and any associated CLI parsing modules.
- `src/execution/state.rs` for candidate discovery and reason mapping.
- `src/execution/mutate.rs` for reopen/complete replay behavior.
- `src/cli/plan_execution.rs` and `src/workflow` reporting paths for result rendering.
- `tests/plan_execution.rs` and related fixtures under `tests/`.
- Plan/skill-doc generation helpers if command docs are generated.
- FeatureForge contract and workflow handoff surfaces as needed after approval.

## Preconditions
- Source spec must remain workflow-valid:
  - `**Workflow State:** CEO Approved`
  - `**Spec Revision:** 1`
  - `**Last Reviewed By:** plan-ceo-review`
- Parseable `## Requirement Index` exists in source spec.
- Runtime behavior remains default-branch safe for non-protected branch development.

## Existing Capabilities / Built-ins to Reuse
- `src/execution/mutate.rs` already defines reopen and complete transitions.
- `src/execution/state.rs` already validates attempt provenance and evidence drift (`validate_v2_evidence_provenance`).
- Existing command/output schemas and workflow phase/status surfaces already support structured summaries.
- Existing test harness and failure-class conventions in runtime tests can be reused.

## Known Footguns / Constraints
- Do not add any command bypass that marks steps as passing without explicit `complete` semantics.
- Do not mutate state in dry-run mode.
- Keep deterministic ordering while the slice remains serial-only.
- `--max-jobs` must currently fail closed for values above `1`; parallel replay is explicitly deferred.
- Preserve existing error handling semantics for commandless evidence paths.
- `--no-output` must suppress command stream capture while still preserving summary verification hash behavior.
- Keep explicit failure-class mapping for `session_not_found`, `scope_empty`, `artifact_read_error`, `verify_command_failed`, `target_race`, `state_transition_blocked`, and `serialization_error`.

## Requirement Coverage Matrix
- REQ-001 -> Task 1, Task 2, Task 5
- REQ-002 -> Task 1, Task 2, Task 5
- REQ-003 -> Task 2, Task 3
- REQ-004 -> Task 3, Task 5
- REQ-005 -> Task 3, Task 4, Task 5
- REQ-006 -> Task 1, Task 2, Task 5
- REQ-007 -> Task 2, Task 3
- REQ-008 -> Task 1, Task 2
- REQ-009 -> Task 2, Task 4, Task 5
- REQ-010 -> Task 4, Task 6
- REQ-011 -> Task 4, Task 5, Task 6

## Failure and Exit Mapping Alignment
- Early pre-execution failures (`session_not_found`, `scope_empty` / `scope_no_matches`) must return exit status `1` before any mutation.
- `0` indicates complete rebuild success or no-op.
- `1` indicates precondition/usage failure, including serialization failure.
- `2` indicates partial or mixed outcome with at least one failed target and no global precondition failure.
- `3` indicates strict/rebuild-blocked-all commandless state (manual-required for every planned target in strict mode).
- `artifact_read_error`, `verify_command_failed`, `state_transition_blocked`, and `target_race` are recoverable and remain per-target outcomes.
- In strict mode, `manual_required` is recoverable only when another target succeeds or fails in non-strict class; if all planned targets are strict manual-required then final exit is `3`.

## Execution Strategy
- Execute Task 1 serially. It establishes the command surface on `src/cli/plan_execution.rs`, which is also touched by Tasks 3 and 4.
- Execute Task 2 serially after Task 1. It prepares discovery-state models consumed by Task 3.
- Execute Task 3 serially after Task 2. It reuses execution transitions and command orchestration from earlier registration and discovery work.
- Task 3 execution must hold a deterministic sorted queue before applying concurrency; output rendering must be deterministic by that same key.
- Execute Task 4 serially after Task 3. It consumes outcomes from Tasks 2 and 3.
- Execute Task 5 serially after Task 4. It validates the end-to-end behavior from state selection through reporting.
- Execute Task 6 serially after Task 5. It is the reintegration seam for reporting, handoff, and workflow-routing readiness.

## Dependency Diagram
```text
Task 1 -> Task 2
Task 2 -> Task 3
Task 3 -> Task 4
Task 4 -> Task 5
Task 5 -> Task 6
```

## Task 1: Add `plan execution rebuild-evidence` command shape and dry-run planning contract

**Spec Coverage:** REQ-002, REQ-006, REQ-008
**Task Outcome:** CLI exposes `plan execution rebuild-evidence` with deterministic argument parsing and no-state dry-run mode.
**Plan Constraints:**
- Keep CLI defaults exactly as spec defines.
- `--json` only affects rendering, not core behavior.

**Open Questions:** none

**Files:**
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/cli/mod.rs`
- Modify: `src/lib.rs`
- Test: `tests/plan_execution.rs`

- [x] **Step 1: Add failing test for new subcommand registration and flag parsing**
Run: `cargo test --test plan_execution -- rebuild_evidence_command_shape --exact`
Expected: FAIL because subcommand/flags are not recognized.

- [x] **Step 2: Add parser options for supported flags and scope resolution**
Implement `--all`, `--task`, `--step`, `--include-open`, `--skip-manual-fallback`, `--continue-on-error`, `--dry-run`, `--max-jobs`, `--no-output`, `--json`.
- Validate `--max-jobs` is a positive integer and defaults to `1`.
- Fail fast on invalid scope/session resolution before any mutation.
- Add parser-level help for `--no-output` behavior.
- Add `PlanExecutionCommand` and dispatch wiring in `src/lib.rs` to route `rebuild-evidence` into execution path.

- [x] **Step 3: Add no-mutation dry-run path**
In dry-run mode resolve candidates and render plan only without filesystem writes.

- [x] **Step 4: Add command-level usage and invalid-scope guard tests**
Run: `cargo test --test plan_execution -- rebuild_evidence_invalid_scope --exact`
Expected: usage-grade failure path.
- Add assertions for `session_not_found` and `scope_empty`/`scope_no_matches` mapped to non-mutating exit `1`.
- Include matched IDs when returning scope-empty diagnostics to satisfy recoverable scope guidance.

- [x] **Step 5: Run command-shape tests**
Run: `cargo test --test plan_execution -- rebuild_evidence_command_shape rebuild_evidence_invalid_scope --exact`
Expected: PASS.
- Add `--no-output` help and parser acceptance assertions.

## Task 2: Implement stale target discovery from authoritative evidence state

**Spec Coverage:** REQ-001, REQ-002, REQ-007, REQ-008
**Task Outcome:** Rebuild planner returns ordered candidates for invalidated/provenance-stale attempts and filtered scope.
**Plan Constraints:**
- Reuse existing provenance check functions.
- No heuristic changes outside existing state logic.

**Open Questions:** none

**Files:**
- Modify: `src/execution/state.rs`
- Modify: `src/diagnostics/mod.rs`
- Test: `tests/plan_execution.rs`

- [x] **Step 1: Add planner unit test with invalidation reasons and stale proofs**
Run: `cargo test --test plan_execution -- rebuild_candidate_discovery_stale_targets --exact`
Expected: FAIL with empty candidate list and no planner.

- [x] **Step 2: Add deterministic candidate model struct**
Add internal type for target identity, reason, source step/task, verification command presence, and candidate ordering key.
 - Candidate order key must be stable, deterministic, and independent of thread scheduling.

- [x] **Step 3: Implement selection rules**
- include latest attempts with meaningful invalidation reasons,
- include attempts failing provenance validation,
- include drifted proof targets,
- include open steps only for `--include-open`.
- If an individual artifact path is unreadable, append a recoverable `artifact_read_error` target outcome and continue planning remainder.
- Map new command-spec failure classes (`scope_no_matches`, `verify_command_failed`, `manual_required`, `target_race`, `state_transition_blocked`, `serialization_error`, `artifact_read_error`) to diagnosable outputs for reporting and exit mapping.
- Track `artifact_epoch` or attempt metadata to detect stale candidate rows when executed later in parallel.

- [x] **Step 4: Add scoped filtering for task/step selectors**
Support multiple `--task`/`--step` entries and validate exact match semantics.

- [x] **Step 5: Add boundary test for scope-only planning results**
Run: `cargo test --test plan_execution -- rebuild_candidate_filtering --exact`
Expected: target subset output matches scope input exactly.

## Task 3: Add replay executor using reopen + complete and command/manual fallback rules

**Spec Coverage:** REQ-003, REQ-004, REQ-005, REQ-007
**Task Outcome:** Every selected candidate must be replayed by invoking the existing `reopen` transition, then the existing `complete` transition, with controlled command rerun or manual-required handling.
**Plan Constraints:**
- Use existing `reopen` + `complete` request schemas and transition entry points.
- Preserve unchanged trust boundaries: no status flips or completion can occur outside existing `reopen`/`complete` transition paths.
- Preserve manual-required non-verifying path as explicit outcome.

**Open Questions:** none

**Files:**
- Modify: `src/execution/mutate.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/cli/plan_execution.rs`
- Test: `tests/plan_execution.rs`

- [x] **Step 1: Add failing test for one-command candidate replay**
Run: `cargo test --test plan_execution -- rebuild_executor_reopens_and_recompletes --exact`
Expected: FAIL because executor path missing.

- [x] **Step 2: Implement target-level execution loop with `--continue-on-error` support**
Each target transition independently captures status and can continue when allowed.
- Execute targets in stable order and capture target results by the same order key regardless of `--max-jobs`.
- Add target-level race simulation and recovery handling for `target_race` and `state_transition_blocked` classes.
- Use per-target execution CAS by attempt id and attempt-level re-read before each `reopen` call.
- On conflict (`target_race`, `state_transition_blocked`) re-read candidate row, retry once with bounded backoff, then mark recoverable failure if still conflicting.
- Add dedicated serial replay conflict coverage and explicit `--max-jobs > 1` rejection tests while bounded parallel replay remains deferred.
- [x] **Step 3: Implement verify-command path and command output capture**
Run and hash command summary when command exists.
- `--no-output` executes commands without stream capture while still producing deterministic verification summaries.
- Add explicit `verify_command_failed` outcome with failure class and deterministic summary status transitions.

- [x] **Step 4: Implement strict-mode manual fallback behavior**
- default: record manual-required and continue,
- strict: fail target with `manual_required` and respect continue-on-error policy.
- Add strict-mode mapping check where a batch blocked entirely by manual-required targets exits `3`.

- [x] **Step 5: Add state-transition conflict simulation test**
Run: `cargo test --test plan_execution -- rebuild_target_state_transition_blocked --exact`
Expected: Failure recorded with recoverable status.

## Task 4: Add deterministic output and no-op/exit-state reporting

**Spec Coverage:** REQ-009, REQ-010, REQ-011
**Task Outcome:** Command returns status codes and produces both text summary and JSON schema per spec.
**Plan Constraints:**
- JSON and text paths must report identical target counts.
- Keep output keys stable to support CI parsing.

**Open Questions:** none

**Files:**
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/workflow/status.rs`
- Test: `tests/plan_execution.rs`

- [x] **Step 1: Add failing exit-code matrix test**
Run: `cargo test --test plan_execution -- rebuild_evidence_exit_statuses --exact`
Expected: Mapping verified for statuses 0..3:
- `0`: full success/no-op
- `1`: usage/precondition/serialization failure
- `2`: mixed or all-target failure without precondition/strict-all-manual conditions
- `3`: strict/manual-only all-fail case
- Reducer expectations:
  - If all targets are strict-mode `manual_required` => final `3`.
  - If any target fails with non-precondition failure class => `2`.
  - If precondition classes only => `1`.

- [x] **Step 2: Implement text output summary schema**
Include planned/rebuilt/manual/failed/noop counts.
- Keep output key ordering deterministic and include explicit failure classes for recoverable errors.

- [x] **Step 3: Implement JSON output schema**
Emit top-level and per-target fields exactly as spec.
- Ensure per-target `error` and `failure_class` are present where applicable.
- Treat serialization failure as `serialization_error` and map to exit status `1`.

- [x] **Step 4: Add no-op run test and partial-failure aggregation tests**
Run: `cargo test --test plan_execution -- rebuild_evidence_noop_and_partial_failures --exact`
Expected: PASS with explicit no-op and partial summary behavior.
- Include explicit `target_race` case, `verify_command_failed` partial case, strict/manual-only finalization status `3`, and unsupported parallel (`--max-jobs > 1`) rejection coverage.

## Task 5: Add runtime regression and contract tests for discover/replay/repair flow

**Spec Coverage:** REQ-001, REQ-002, REQ-004, REQ-006, REQ-009, REQ-011
**Task Outcome:** Regression coverage exists for stale discovery, dry-run parity, and resumable behavior under partial failure.
**Plan Constraints:**
- Keep fixtures realistic and replayable from local session artifacts.
- Avoid broad snapshot comparisons where deterministic IDs vary.

**Open Questions:** none

**Files:**
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`

- [x] **Step 1: Create regression fixture for stale command-backed targets**
Use deterministic session inputs with mixed drift and commandless scenarios.
- Include at least one `rebuild_evidence_*` test entrypoint per command path in new/updated `tests/plan_execution.rs`.

- [x] **Step 2: Add dry-run parity test**
Run: `cargo test --test plan_execution -- rebuild_evidence_dry_run_is_noop --exact`
Expected: zero mutation and full candidate parity.
- Add `--no-output` no-op mode to prove no mutation plus parity of output schema.

- [x] **Step 3: Add partial failure and resume test**
Run: `cargo test --test plan_execution -- rebuild_evidence_partial_failure_resume --exact`
Expected: failures isolated and successful targets committed.
- Add recovery coverage for `artifact_read_error`, `verify_command_failed`, `state_transition_blocked`, and `target_race` under continue-on-error.

- [x] **Step 4: Add command output schema test for structured parsing**
Run: `cargo test --test plan_execution -- rebuild_evidence_json_schema --exact`
Expected: exact shape and stable keys.

## Task 6: Documentation and handoff preparation

**Spec Coverage:** REQ-010, REQ-011
**Task Outcome:** Plan artifacts and generated docs remain synchronized and runtime handoff surfaces are prepared for next review stage.
**Plan Constraints:**
- Regenerate generated skill docs only if command-facing SKILL templates were edited.
- Keep workflow state transition artifacts coherent.

**Open Questions:** none

**Files:**
- Test: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Modify: `docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md`
- Modify: `docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md`

- [x] **Step 1: Align any docs generated from templates after implementation changes**
Run: `node scripts/gen-skill-docs.mjs`
Expected: docs updated and consistent.

- [x] **Step 2: Run plan-spec contract lint against spec and plan**
Run: `~/.featureforge/install/bin/featureforge plan contract lint --spec docs/featureforge/specs/2026-03-30-evidence-rebuild-command-spec.md --plan docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md`
Expected: pass.

- [x] **Step 3: Sync plan artifact for workflow routing**
Run: `~/.featureforge/install/bin/featureforge workflow sync --artifact plan --path docs/featureforge/plans/2026-03-30-evidence-rebuild-command.md`
Expected: status advances to plan-aware routing state.

## NOT in scope

- Generating missing verify commands for commandless evidence targets.
- Cross-session batch rebuild and external orchestration across multiple sessions.
- Changing existing manual `reopen`/`complete` trust semantics.

## What already exists

- Evidence invalidation and provenance validation in `src/execution/state.rs` already support `files_proven_drifted` and packet/fingerprint drift detection.
- Existing reopen/complete transitions in `src/execution/mutate.rs` already preserve trust boundaries for state mutation.
- Existing command/output schema surfaces already support structured reporting via `src/cli/plan_execution.rs` and workflow status surfaces.

## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T19:58:00Z
**Review Mode:** small_change
**Reviewed Plan Revision:** 1
**Critical Gaps:** 0
**Browser QA Required:** no
**Test Plan Artifact:** N/A
**Outside Voice:** fresh-context-subagent
