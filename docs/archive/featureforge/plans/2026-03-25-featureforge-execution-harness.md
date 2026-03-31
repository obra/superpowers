# FeatureForge Execution Harness Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 2
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md`
**Source Spec Revision:** 2
**Last Reviewed By:** plan-eng-review

**Goal:** Implement the Rust-owned execution harness inside `featureforge plan execution` so approved-plan execution becomes contract-driven, policy-driven, provenance-rich, and fail-closed without changing the outer FeatureForge workflow, while keeping the spec as the only source of public contract truth.

**Architecture:** The work lands in vertical slices. First extend the run-scoped execution state, storage, and observability surfaces; then add canonical local artifact contracts and gate enforcement; then bind the new macro-state engine to the current step-level commands; then wire workflow/operator, downstream gates, and skill prompts to the new runtime truth. The runtime remains authoritative for phase legality, policy acceptance, provenance, and state advancement, while skills emit candidate artifacts and consume operator handoffs inside that law.

**Tech Stack:** Rust CLI runtime (`clap`, `serde`, `schemars`), local markdown artifact parsing and fingerprinting, branch-scoped state under `~/.featureforge/projects/`, checked-in JSON schema parity tests, Rust integration tests with `cargo nextest`, Node-based codex-runtime contract tests

## Plan Contract

This plan owns **implementation order, task boundaries, and done criteria**. It does **not** redefine the public runtime contract. Public phases, artifact schemas, failure classes, reason codes, policy semantics, and cutover behavior are owned by the spec. If the plan and spec drift, the spec wins and the plan must be updated in the same change.

---

## Existing Capabilities / Built-ins to Reuse

- `src/contracts/packet.rs` already builds canonical task packets with approved plan/spec fingerprints and requirement traceability. The harness must reuse those packet fingerprints instead of inventing a second task-scope contract source.
- `src/contracts/evidence.rs` already parses execution evidence. Extend it to carry contract/evaluation/handoff provenance rather than replacing the evidence path with a second repo-visible artifact.
- `src/execution/state.rs` already owns `status`, `recommend`, `preflight`, `gate-review`, `gate-finish`, and the checked-in `plan-execution-status` schema writer. Extend that boundary instead of creating a second status surface.
- `src/execution/mutate.rs` already owns `begin`, `note`, `complete`, `reopen`, and `transfer`. Keep those commands as the micro-state layer and validate them against the new macro-state law.
- `src/workflow/status.rs` and `src/workflow/operator.rs` already route approved work into `execution_preflight` and downstream review/QA/release phases. Reuse those surfaces for harness-aware phase mapping rather than inventing a second operator entrypoint.
- `tests/plan_execution.rs`, `tests/workflow_runtime.rs`, `tests/packet_and_schema.rs`, and `tests/runtime_instruction_contracts.rs` already pin the runtime contract where this work will land. Extend those suites before adding new ad hoc test harnesses.
- `tests/codex-runtime/workflow-fixtures.test.mjs`, `tests/codex-runtime/eval-observability.test.mjs`, and `tests/codex-runtime/skill-doc-contracts.test.mjs` already pin workflow fixtures, observability output, and skill-doc/runtime alignment. Keep using them for release-facing contract drift.
- Skill templates and generated docs already exist under `skills/*`. Update templates and regenerate checked-in `SKILL.md` files in the same slice that changes runtime truth.

## Known Footguns / Constraints

- Do not add migration logic, fallback continuation logic, or dual-read execution behavior. The approved spec requires a hard cutover for active harness-governed execution.
- Keep authoritative harness artifacts local under `~/.featureforge/projects/`. Do not create new repo-visible authoritative spec or plan companions.
- Keep existing downstream review, QA, and release-doc artifact shapes canonical in v1. Fingerprint and index them when downstream truth depends on them.
- Keep authoritative execution branch-scoped. Same-branch multi-worktree sessions are one scope, and worktree identity is diagnostic metadata only.
- Keep `recommend` side-effect free and make `execution_preflight` the only policy-acceptance boundary.
- Preserve the existing step-level command family. The new harness adds macro-state law above it; it does not replace it.
- Preserve existing status fields while extending the schema so current consumers fail only on intentional contract changes.
- Use red-green-refactor inside every task. Refresh checked-in schema files and generated skill docs in the same task that changes their source.
- Keep detailed task sequencing in this plan, not in the spec, so the public contract and implementation order do not drift together.

## Cross-Task Invariants

These rules apply to every task in this plan:

- Runtime truth stays Rust-owned. Skills may draft candidate artifacts, but only runtime commands may create or advance authoritative harness state.
- Hard cutover remains in force. Do not add migration logic, dual-read behavior, or fallback continuation paths.
- Branch scope remains authoritative. Same-branch worktrees share one authoritative state, one dependency index, and one run-identity space.
- Artifact identity remains fingerprint-based. Do not let path-only, name-only, or browse-order lookup become authoritative.
- Downstream review, QA, and release-doc outputs keep their existing artifact shapes in v1; index them instead of cloning them into a second downstream artifact family.
- Public strings are centralized. Phase names, failure classes, reason codes, evaluator kinds, and gate names must come from shared runtime-owned constants, not ad hoc re-spellings.
- Generated artifacts ship with their source changes. Schema files, generated `SKILL.md` docs, and fixture expectations must be refreshed in the same task that changes the source contract.
- `src/execution/state.rs` remains orchestration glue after Task 1. Later harness law belongs in focused modules.

## Change Surface

- Execution runtime core: `src/execution/state.rs`, `src/execution/mutate.rs`, and new focused modules extracted under `src/execution/`
- Artifact contracts and evidence parsing: `src/contracts/harness.rs`, `src/contracts/evidence.rs`, `src/contracts/packet.rs`, `src/contracts/mod.rs`
- CLI and lib dispatch: `src/cli/plan_execution.rs`, `src/cli/mod.rs`, `src/lib.rs`
- Workflow/operator integration: `src/workflow/status.rs`, `src/workflow/operator.rs`
- Checked-in schema parity: `schemas/plan-execution-status.schema.json`
- Skill templates, prompts, and generated docs: `skills/executing-plans/*`, `skills/subagent-driven-development/*`, `skills/requesting-code-review/*`, `skills/qa-only/*`
- Rust and Node contract tests plus workflow fixtures under `tests/`

## Preconditions

- Start from the approved spec at `docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md` with `Spec Revision: 2`.
- Run all commands from the repo root so schema writers, skill-doc generation, and fixture-relative tests resolve the checked-in files correctly.
- Treat `schemas/plan-execution-status.schema.json` and generated `skills/*/SKILL.md` files as first-class artifacts that must stay in sync with the runtime changes that require them.
- Keep commits task-scoped. Do not mix later workflow/operator or skill-doc work into the earlier state and artifact tasks.
- Do not start a later task until the targeted suites for the current task are green.

## Execution Strategy

- Execute tasks in order. The artifact and gate slices depend on the run-scoped state model, and the workflow/operator slice depends on both.
- Build parser and gate correctness before binding new mutation behavior. The runtime must reject bad state before it tries to advance good state.
- After Task 1, keep `src/execution/state.rs` as orchestration and status glue only; new harness law added in later tasks must land in focused modules and be wired through delegation rather than accumulating in one file.
- Centralize machine-readable public literals in shared runtime-owned modules instead of re-spelling them across CLI handlers, schemas, fixtures, workflow text, and skill docs.
- Extract focused modules from `src/execution/state.rs` only when the extraction ships with live behavior and tests in the same task.
- Keep candidate-artifact generation and authoritative recording separate in both code and skill prompts from the first slice that introduces those concepts.
- Keep downstream review/QA/release-doc truth intact while the inner harness is under construction. Only wire the new freshness and provenance rules after the underlying dependency index and authoritative artifact model are green.
- Keep `status`, `execution_preflight`, `gate-review`, and `gate-finish` on a hot path that resolves from authoritative state plus fingerprint-addressed artifacts or dependency-index entries; reserve broad rescans and recovery reconciliation for explicit maintenance paths.

## Evidence Expectations

- Authoritative artifacts must be deterministic, canonical, and fingerprinted from canonical content.
- Candidate artifacts must be visibly distinct from authoritative artifacts on disk and in status output.
- Dirty-worktree `repo:` evidence that needs later reread must materialize durable whole-file `EvidenceArtifact` payloads, not fingerprint-only proofs.
- Fixtures must cover authoritative, stale, superseded, drifted, and candidate artifact states so the runtime contract is testable without live ad hoc state.
- Status, operator, and event surfaces must expose machine-readable identifiers and stable reason codes rather than prose-only diagnosis.
- Keep the full minimum failure-class taxonomy from the spec stable at implementation and test boundaries: `IllegalHarnessPhase`, `StaleProvenance`, `ContractMismatch`, `EvaluationMismatch`, `MissingRequiredHandoff`, `NonHarnessProvenance`, `BlockedOnPlanPivot`, `ConcurrentWriterConflict`, `UnsupportedArtifactVersion`, `NonAuthoritativeArtifact`, `IdempotencyConflict`, `RepoStateDrift`, `ArtifactIntegrityMismatch`, `PartialAuthoritativeMutation`, `AuthoritativeOrderingMismatch`, and `DependencyIndexMismatch`.
- Keep the spec's stable reason-code vocabulary explicit in code and tests rather than sampling only a few examples, including cases such as `blocked_on_plan_revision`, `missing_required_evidence`, `invalid_evidence_satisfaction_rule`, and write-authority or dependency-health diagnostics.
- Active state and status surfaces must point only at authoritative artifacts; candidate paths may be inspectable but never active.
- Evidence satisfaction semantics are runtime law, not evaluator-local convention; `all_of`, `any_of`, and `per_step` must stay stable through parsing, gate logic, and aggregate pass decisions.

## Validation Strategy

- Each task ends with targeted Rust tests and the relevant Node contract tests for the surfaces it changes.
- No task is done until checked-in schemas, generated docs, fixture payloads, and machine-readable strings match the spec revision this plan targets.
- The final regression gate for this plan is:
  - `cargo nextest run --test contracts_execution_harness --test execution_harness_state --test plan_execution --test workflow_runtime --test packet_and_schema --test runtime_instruction_contracts`
  - `node --test tests/codex-runtime/workflow-fixtures.test.mjs tests/codex-runtime/eval-observability.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`
- Do not claim the harness slice complete until the final regression gate is green from the repo root.

## Documentation Update Expectations

- Update skill templates and regenerate checked-in `SKILL.md` files in the same task that changes runtime-owned execution law.
- Keep workflow/operator wording aligned with the runtime’s public phases, reason codes, and downstream freshness states.
- Keep fixture README updates in the same task that adds or renames fixture families so contributors can see the intended authoritative versus candidate layout.

## Rollout Plan

- Land the runtime in vertical slices on the current branch: state and storage, artifact contracts, gates and mutations, preflight and policy, workflow/operator, then skill docs and fixtures.
- Do not route workflow/operator truth to the new harness phases until the state, artifact, gate, and transition slices are green in the same branch.
- Treat the hard cutover as complete only after the final regression gate proves that active execution rejects non-harness continuation and downstream gates reject stale or non-harness provenance.

## Rollback Plan

- If a task destabilizes the branch, revert the latest task-scoped commit before starting another slice.
- Restore checked-in schema or generated skill docs only through the matching revert, not by hand-editing drift back into place.
- Do not add fallback execution logic as a rollback shortcut. The rollback mechanism is reverting the slice that introduced the regression.

## Risks and Mitigations

- Large execution-state growth can make `src/execution/state.rs` unmaintainable. Extract focused modules only when the extraction lands with live behavior and tests in the same task.
- Candidate and authoritative artifact truth can drift apart. Introduce candidate-versus-authoritative markers and authoritative fingerprint verification before transition logic consumes the artifacts.
- Downstream gate regressions can hide behind the new inner loop. Keep existing downstream artifact shapes canonical and pin their freshness behavior in workflow/runtime tests.
- Skill prose can drift away from runtime truth. Update templates and generated docs in the same slice as the runtime changes and keep `tests/runtime_instruction_contracts.rs` green.

## Dependency Diagram

```text
Task 1  run-scoped state, storage, dependency index, status schema
   |
   v
Task 2  canonical harness artifacts and evidence semantics
   |
   v
Task 3  gate commands, authoritative recording, single-writer mutation
   |
   v
Task 4  macro-state transition engine bound to step-level commands
   |
   v
Task 5  recommend/preflight policy acceptance and hard cutover
   |
   v
Task 6  workflow/operator and downstream gate truth
   |
   v
Task 7  skill normalization and generated docs
   |
   v
Task 8  fixture matrix and full regression gate
```

## Requirement Coverage Matrix

- REQ-001 -> Task 6
- REQ-002 -> Task 1
- REQ-003 -> Task 4
- REQ-004 -> Task 2
- REQ-005 -> Task 4
- REQ-006 -> Task 2
- REQ-007 -> Task 2
- REQ-008 -> Task 1
- REQ-009 -> Task 4
- REQ-010 -> Task 3
- REQ-011 -> Task 4
- REQ-012 -> Task 5
- REQ-013 -> Task 5, Task 7
- REQ-014 -> Task 2
- REQ-015 -> Task 6, Task 7
- REQ-016 -> Task 4
- REQ-017 -> Task 6, Task 7
- REQ-018 -> Task 5, Task 6
- REQ-019 -> Task 8
- REQ-020 -> Task 7, Task 8
- REQ-021 -> Task 8
- REQ-022 -> Task 1
- REQ-023 -> Task 3
- REQ-024 -> Task 1, Task 6
- REQ-025 -> Task 3
- REQ-026 -> Task 2
- REQ-027 -> Task 2
- REQ-028 -> Task 3
- REQ-029 -> Task 3
- REQ-030 -> Task 2, Task 3
- REQ-031 -> Task 3
- REQ-032 -> Task 4
- REQ-033 -> Task 3, Task 4
- REQ-034 -> Task 3, Task 6, Task 7
- REQ-035 -> Task 3
- REQ-036 -> Task 1, Task 5
- REQ-037 -> Task 1, Task 6
- REQ-038 -> Task 1
- REQ-039 -> Task 1
- REQ-040 -> Task 1, Task 6
- REQ-041 -> Task 2, Task 3
- REQ-042 -> Task 2, Task 3
- REQ-043 -> Task 2, Task 3
- REQ-044 -> Task 2, Task 3
- REQ-045 -> Task 2, Task 3
- REQ-046 -> Task 2, Task 3
- REQ-047 -> Task 2, Task 3
- REQ-048 -> Task 2, Task 3
- REQ-049 -> Task 2, Task 3
- REQ-050 -> Task 2, Task 3
- REQ-051 -> Task 2
- REQ-052 -> Task 1, Task 3
- REQ-053 -> Task 1, Task 3, Task 6
- REQ-054 -> Task 6
- REQ-055 -> Task 1, Task 6
- REQ-056 -> Task 1, Task 5
- REQ-057 -> Task 5
- REQ-058 -> Task 1, Task 5
- REQ-059 -> Task 5
- REQ-060 -> Task 1, Task 3
- REQ-061 -> Task 1, Task 6

## Task 1: Establish Run-Scoped Harness State and Storage

**Spec Coverage:** REQ-002, REQ-008, REQ-022, REQ-024, REQ-036, REQ-037, REQ-038, REQ-039, REQ-040, REQ-052, REQ-053, REQ-055, REQ-056, REQ-058, REQ-060, REQ-061
**Task Outcome:** The runtime has the exact minimum public `HarnessPhase` set from the spec, a run-scoped harness state model with `execution_run_id`, run-scoped `authoritative_sequence`, frozen policy snapshots, dependency-index state, append-only authoritative artifact storage with authoritative-only active pointers, a documented retention-window default, evaluator-set arrays, aggregate evaluation state, retry and handoff fields, repo-state baseline and drift fields, downstream freshness plus last-indexed downstream fingerprints, and branch-scoped write-authority diagnostics plus machine-readable observability telemetry and minimum structured event fields exposed through `PlanExecutionStatus` and harness observability surfaces.
**Plan Constraints:**

- Keep authoritative state branch-scoped under the existing project artifact root.
- Preserve current `PlanExecutionStatus` fields while adding the new run-scoped fields and schema output.
- Keep `write_authority_worktree` diagnostic only; it must not participate in authoritative scope identity.
- Keep downstream freshness data machine-readable in status rather than synthesizing it only in operator prose.
- Keep policy snapshots immutable within one `execution_run_id`.
- Centralize branch-scoped harness path naming, state-file layout, and atomic publish helpers in the existing path/storage layer instead of scattering file-name construction across execution modules.
- Centralize machine-readable public literals as part of this foundation slice: keep failure classes in the existing diagnostics layer, keep `HarnessPhase` and adjacent state enums in shared execution modules, and keep reason-code and event-kind constants in the observability layer rather than duplicating string literals across runtime, schema, tests, fixtures, workflow output, or skill docs.
- Define the default retention window and telemetry field shapes in the runtime-owned state/observability layer instead of leaving them as fixture-only or operator-prose behavior.
- Track candidate-artifact dependencies explicitly enough that runtime pruning can preserve in-flight candidate contracts, evaluations, and handoffs while a controller still depends on them.
- Implement the minimum public `HarnessPhase` names exactly as specified instead of coalescing or renaming them in v1.
- Treat the full `PlanExecutionStatus` surface as normative work in this task, including evaluator-kind sets, aggregate evaluation state, retry and handoff fields, repo-state baseline and drift, dependency-index state, and last-indexed downstream fingerprints.
- Call out exact public status fields where they are easy to under-translate, including `latest_authoritative_sequence`, `active_contract_path`, `last_evaluation_report_path`, `last_evaluation_report_fingerprint`, `last_evaluation_evaluator_kind`, and `write_authority_holder`.
- Implement the minimum structured event payload surface explicitly, including `event_kind`, `timestamp`, transition-trigger detail, `execution_run_id`, `authoritative_sequence`, `source_plan_path`, `source_plan_revision`, `harness_phase`, `chunk_id`, `evaluator_kind`, `active_contract_fingerprint`, `evaluation_report_fingerprint`, `handoff_fingerprint`, `command_name`, `gate_name`, `failure_class`, and `reason_codes[]`.
- Keep authoritative artifacts append-only and ensure the active state file and status surfaces may reference only authoritative contract/report/handoff paths, never candidate artifacts.
- Make status readable before execution starts and without relying on a running skill to infer the current execution law.
- After this task, treat `src/execution/state.rs` as orchestration and status glue only; later tasks must add new harness law in extracted modules and delegate through `state.rs` rather than reopening it as the primary implementation bucket.
- Make normal `status`, `execution_preflight`, `gate-review`, and `gate-finish` reads resolve from authoritative state plus fingerprint-addressed artifacts or dependency-index entries rather than broad repo scans; reserve full reconciliation scans for explicit recovery or maintenance paths.
- Extract focused execution modules only when the extraction ships with live behavior and tests in this task.
**Open Questions:** none

**Files:**

- Create: `src/execution/harness.rs`
- Create: `src/execution/dependency_index.rs`
- Create: `src/execution/observability.rs`
- Create: `tests/execution_harness_state.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/execution/mod.rs`
- Modify: `src/paths/mod.rs`
- Modify: `schemas/plan-execution-status.schema.json`
- Modify: `tests/packet_and_schema.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/paths_identity.rs`
- Modify: `tests/workflow_runtime.rs`

- [x] **Step 1: Add red status and state tests in `tests/execution_harness_state.rs`, `tests/plan_execution.rs`, and `tests/workflow_runtime.rs` for the exact public phase set, run identity, `latest_authoritative_sequence`, authoritative-only active pointers, `active_contract_path`, `last_evaluation_report_path`, `last_evaluation_report_fingerprint`, `last_evaluation_evaluator_kind`, `write_authority_holder`, pre-start/non-skill-readable status, evaluator-kind arrays, aggregate evaluation state, retry and handoff fields, repo-state baseline and drift, downstream freshness plus last-indexed downstream fingerprints, frozen policy snapshots, stable minimum reason codes, and same-branch worktree diagnostics**
- [x] **Step 2: Add red schema-parity assertions in `tests/packet_and_schema.rs` for the expanded `plan-execution-status` schema**
- [x] **Step 3: Create `src/execution/harness.rs` with the exact minimum `HarnessPhase` enum from the spec, run-identity types, frozen policy snapshot types, and authoritative state structs**
- [x] **Step 4: Create `src/execution/dependency_index.rs` with the runtime-owned dependency graph model, index-health state, candidate-artifact dependency tracking, and retention-eligibility helpers**
- [x] **Step 5: Create `src/execution/observability.rs` with the minimum structured event payload fields, stable reason-code constants, evaluator-identity fields, and machine-readable telemetry/counter helpers for phase transitions, blocked-state entries by reason, gate failures, retry and pivot counts, authoritative mutation counts, evaluator outcomes, ordering gaps, replay outcomes, write-authority conflicts and reclaims, drift, integrity mismatches, and recovery**
- [x] **Step 6: Extend `src/paths/mod.rs` and `tests/paths_identity.rs` with branch-scoped harness state, dependency-index, and authoritative-artifact path helpers plus atomic-publish path coverage**
- [x] **Step 7: Thread the new state model through `src/execution/state.rs` and `src/execution/mod.rs` without removing the existing status fields**
- [x] **Step 8: Refresh `schemas/plan-execution-status.schema.json` through the existing schema writer path and make the schema-parity tests pass**
- [x] **Step 9: Run `cargo nextest run --test execution_harness_state --test plan_execution --test workflow_runtime --test packet_and_schema --test paths_identity` and fix failures until the slice is green**
- [x] **Step 10: Commit the slice with `git commit -m "feat: add execution harness state model"`**
## Task 2: Add Canonical Harness Artifact Contracts

**Spec Coverage:** REQ-004, REQ-006, REQ-007, REQ-014, REQ-026, REQ-027, REQ-030, REQ-041, REQ-042, REQ-043, REQ-044, REQ-045, REQ-046, REQ-047, REQ-048, REQ-049, REQ-050, REQ-051
**Task Outcome:** The repo has canonical markdown contracts for `ExecutionContract`, `EvaluationReport`, `ExecutionHandoff`, and `EvidenceArtifact`, with the full minimum v1 schemas treated as normative for all four artifact families, plus deterministic parsing, version checks, artifact-level `authoritative_sequence`, full spec/plan/task-packet provenance fields, explicit empty-list handling where the spec requires it, full handoff-schema coverage, full contract/report/evidence-artifact schema coverage, candidate-versus-authoritative markers, durable dirty-worktree evidence resolution rules, and extended execution evidence provenance fields.
**Plan Constraints:**

- Keep markdown authoritative and treat JSON mirrors as optional helpers rather than the v1 contract.
- Reject unsupported artifact versions fail closed instead of best-effort parsing.
- Resolve artifact-backed evidence by canonical fingerprint, not by path or filename.
- Preserve whole-file dirty-worktree evidence content when later reread is part of the contract.
- Keep `EvidenceArtifact` local under the project artifact root and out of repo-visible authoritative docs.
- Reuse task-packet provenance rather than inventing a second task-scope identifier family.
- Treat the full minimum `ExecutionContract` schema as normative in v1, including `contract_version`, `authoritative_sequence`, `source_plan_*`, `source_spec_*`, `source_task_packet_fingerprints[]`, `chunk_id`, `chunking_strategy`, `covered_steps[]`, `requirement_ids[]`, `criteria[]`, `non_goals[]`, `verifiers[]`, `evidence_requirements[]`, `retry_budget`, `pivot_threshold`, `reset_policy`, `generated_by`, `generated_at`, and `contract_fingerprint`, plus the minimum nested `criterion` and `evidence_requirement` field sets.
- Treat the full minimum `EvaluationReport` schema as normative in v1, including `report_version`, `authoritative_sequence`, `source_plan_*`, `source_contract_fingerprint`, `evaluator_kind`, `verdict`, `criterion_results[]`, `affected_steps[]`, `evidence_refs[]`, `recommended_action`, `summary`, `generated_by`, `generated_at`, and `report_fingerprint`, plus the minimum nested `criterion_result` and `evidence_ref` field sets.
- Treat the full minimum `EvidenceArtifact` schema as normative in v1, including `evidence_artifact_version`, `evidence_artifact_fingerprint`, `evidence_kind`, `source_locator`, `repo_state_baseline_head_sha`, `repo_state_baseline_worktree_fingerprint`, `relative_path`, `captured_content_fingerprint`, `generated_by`, `generated_at`, and the preserved payload body needed for durable reread.
- Preserve the approved-work boundary fields needed for later gate validation, including requirement and non-goal traceability back to the approved plan revision and task packets.
- Canonicalize accepted evidence locators before fingerprinting and reject path-only, ambiguous, unresolved, candidate-only, name-only, or otherwise non-canonical artifact targeting forms.
- Preserve explicit empty-list semantics where the spec requires them, including `evidence_requirements[]` and `evidence_requirement_ids[]` rather than silently omitting those fields.
- Treat the full `ExecutionHandoff` schema as normative, including `files_touched[]`, `workspace_notes`, `commands_run[]`, and `risks[]`.
- Reject operationally empty contracts fail closed, including empty scope, empty criteria, or empty verifier declarations.
- Preserve the artifact-level provenance and ordering contract explicitly, including `source_spec_*`, `source_plan_*`, `source_task_packet_fingerprints[]`, and per-artifact `authoritative_sequence` fields needed for stale-spec detection and within-run supersession.
- Preserve the stable `satisfaction_rule` semantics for `all_of`, `any_of`, and `per_step`; parser work must feed gate-time evidence enforcement rather than stopping at syntax validation.
- Preserve the durable-evidence resolution contract explicitly: repo-backed evidence must resolve against authoritative repo-state provenance, dirty-worktree reread must bind through authoritative `EvidenceArtifact` materialization when required, and later validation must reject missing, ambiguous, or non-authoritative durable evidence.
**Open Questions:** none

**Files:**

- Create: `src/contracts/harness.rs`
- Create: `tests/contracts_execution_harness.rs`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/valid-execution-contract.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/valid-evaluation-report.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/valid-execution-handoff.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/valid-evidence-artifact.md`
- Modify: `src/contracts/evidence.rs`
- Modify: `src/contracts/mod.rs`
- Modify: `src/contracts/packet.rs`
- Modify: `tests/packet_and_schema.rs`

- [x] **Step 1: Add red parsing and validation tests in `tests/contracts_execution_harness.rs` for valid and invalid contract, evaluation, handoff, and evidence artifacts, including exact minimum-schema coverage for `ExecutionContract`, `EvaluationReport`, `ExecutionHandoff`, and `EvidenceArtifact`; approved-work traceability fields that `gate-contract` later validates against spec, plan, and task-packet provenance; artifact-level `authoritative_sequence`; full handoff-schema requirements; explicit empty-list handling; operationally empty contract rejection; stable `all_of` / `any_of` / `per_step` semantics; and unsupported `satisfaction_rule` cases that must surface the stable machine-readable failure or reason mapping**
- [x] **Step 2: Add red evidence-locator and durable-resolution tests in `tests/contracts_execution_harness.rs` for supported locator grammar, canonical fingerprint targets, authoritative repo-state baselines, locator canonicalization before fingerprinting, rejection of path-only, ambiguous, unresolved, candidate-only, or non-canonical artifact targeting, exact `evidence_ref` field validation, and durable dirty-worktree reread behavior through authoritative `EvidenceArtifact` resolution**
- [x] **Step 3: Extend `src/contracts/packet.rs` only where the harness needs reusable task-packet provenance helpers**
- [x] **Step 4: Implement the canonical artifact structs, parsers, canonical renderers, and fingerprint helpers in `src/contracts/harness.rs`**
- [x] **Step 5: Extend `src/contracts/evidence.rs` with contract, evaluation, handoff, and repo-state provenance fields for harness-written execution evidence**
- [x] **Step 6: Export the new contract module from `src/contracts/mod.rs` and keep the artifact readers testable without the CLI layer**
- [x] **Step 7: Check in representative valid harness artifact fixtures under `tests/codex-runtime/fixtures/workflow-artifacts/harness/`**
- [x] **Step 8: Run `cargo nextest run --test contracts_execution_harness --test packet_and_schema` and fix failures until the slice is green**
- [x] **Step 9: Commit the slice with `git commit -m "feat: add execution harness artifact contracts"`**
## Task 3: Implement Gates, Authority, and Authoritative Mutation Rules

**Spec Coverage:** REQ-010, REQ-023, REQ-025, REQ-028, REQ-029, REQ-030, REQ-031, REQ-033, REQ-034, REQ-035, REQ-041, REQ-042, REQ-043, REQ-044, REQ-045, REQ-046, REQ-047, REQ-048, REQ-049, REQ-050, REQ-052, REQ-053, REQ-060
**Task Outcome:** `gate-contract`, `gate-evaluator`, `gate-handoff`, and authoritative `record-*` flows enforce stable failure classes, single-writer authority, advisory-only `recommended_action` semantics, idempotent replay, repo-state drift checks, approved-work contradiction checks, chunking-strategy legality, shared atomic publication helpers for every authoritative mutation family, dependency-index updates, dependency-aware post-commit pruning, and deterministic all-required evaluator aggregation.
**Plan Constraints:**

- Gate commands must accept authoritative artifacts only.
- Keep write authority branch-scoped across same-branch worktrees and fail closed on concurrent mutation attempts.
- Reject replay mismatch instead of mutating authoritative state twice.
- Publish authoritative artifact files and authoritative state pointers atomically from the runtime contract perspective.
- Re-verify authoritative fingerprints on every later read that can drive state advancement, resume, gate satisfaction, review, or finish.
- Keep downstream gate modes out of chunk-level evaluator aggregation.
- Update the dependency index at the same authoritative truth boundary as the state mutation it describes.
- Validate `task`, `task-group`, and `whole-run` contract semantics at gate time, including consecutive task-group boundaries and whole-run coverage for remaining work.
- Make `gate-contract` reject contracts whose requirement scope or non-goals contradict the approved plan revision or task-packet provenance, not just stale provenance or malformed shape.
- Make `gate-contract` reject operationally empty contracts with empty scope, empty criteria, or empty verifier declarations before `contract_approved`.
- Run dependency-aware pruning only after successful authoritative mutation commit, and skip pruning when dependency truth is unhealthy instead of guessing.
- Preserve candidate artifacts still referenced by the active controller loop when post-commit pruning runs.
- Keep the `record-contract`, `record-evaluation`, and `record-handoff` transition semantics exact: `record-contract` advances `contract_pending_approval -> contract_approved`, `record-evaluation` auto-advances from `evaluating` according to the authoritative result, and `record-handoff` clears `handoff_required` only when the handoff satisfies the active policy.
- Make `record-evaluation` mutate authoritative retry counters and threshold state before fail-path routing decides `repairing` versus `pivot_required`.
- Keep the full minimum failure-class taxonomy explicit in code and tests: `IllegalHarnessPhase`, `StaleProvenance`, `ContractMismatch`, `EvaluationMismatch`, `MissingRequiredHandoff`, `NonHarnessProvenance`, `BlockedOnPlanPivot`, `ConcurrentWriterConflict`, `UnsupportedArtifactVersion`, `NonAuthoritativeArtifact`, `IdempotencyConflict`, `RepoStateDrift`, `ArtifactIntegrityMismatch`, `PartialAuthoritativeMutation`, `AuthoritativeOrderingMismatch`, and `DependencyIndexMismatch`.
- Make `gate-handoff` require concrete next-action and unresolved-criteria fields when the handoff is carrying unfinished work.
- Keep `recommended_action` advisory-only and legal-for-verdict; it may guide runtime choices only inside already-legal transitions and must never override verdict semantics, phase legality, retry budgets, or policy.
- Make `gate-handoff` validate the broader resume contract, including handoff legality for adaptive resets and the fresh-session continuation fields beyond just next action.
- Make `gate-evaluator` reject per-report inconsistencies including unexpected evaluator kinds, invalid criterion mappings, bad affected-step references, and `pass` verdicts that still conceal failing criteria or unsatisfied evidence.
- Treat direct subagent/helper attempts to invoke authoritative mutation commands as explicit failure cases, not just prompt violations.
- Apply `all_of`, `any_of`, and `per_step` evidence semantics at gate time, and supersede same-contract same-evaluator reports by higher `authoritative_sequence` before aggregate evaluation decisions.
- By the end of this task, extract reusable deterministic failure-path builders or fixture loaders into shared test support so replay-conflict, writer-conflict, repo-drift, artifact-integrity mismatch, and partial-authoritative-mutation cases are not re-synthesized ad hoc in every suite.
**Open Questions:** none

**Files:**

- Create: `src/execution/authority.rs`
- Create: `src/execution/gates.rs`
- Modify: `src/execution/dependency_index.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/execution/mod.rs`
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/cli/mod.rs`
- Modify: `src/lib.rs`
- Modify: `tests/contracts_execution_harness.rs`
- Modify: `tests/execution_harness_state.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/support/workflow.rs`
- Modify: `tests/workflow_runtime.rs`

- [x] **Step 1: Add red CLI and runtime tests for `gate-contract`, `record-contract`, `gate-evaluator`, `record-evaluation`, `gate-handoff`, and `record-handoff`, including concurrent writer conflict, accepted identical replay, replay-conflict, direct subagent/helper mutation attempts, chunking-strategy legality, approved-work contradiction, operationally empty contract rejection, exact `record-*` auto-transition behavior, retry-counter mutation and threshold routing, advisory-only `recommended_action` legality, full handoff resume validation, gate-evaluator per-report legality checks, the full minimum failure-class taxonomy, and shared deterministic failure-path helpers in `tests/support/workflow.rs` for replay-conflict, writer-conflict, repo-drift, artifact-integrity mismatch, and partial-authoritative-mutation coverage**
- [x] **Step 2: Add red evaluator-aggregation tests for missing, failed, and blocked required evaluator kinds plus rejection of downstream gate modes inside contract-level `verifiers[]`, `missing_required_evidence`, stable `all_of` / `any_of` / `per_step` evidence semantics, same-contract evaluator supersession by higher `authoritative_sequence`, and related stable reason-code output**
- [x] **Step 3: Create `src/execution/authority.rs` with write-authority claim, release, reclaim, replay-detection, and atomic-publication helpers**
- [x] **Step 4: Create `src/execution/gates.rs` with gate validators, stable failure-class mapping, dependency-index-aware artifact checks, approved-work contradiction checks, operationally empty contract rejection, per-report evaluator legality checks, and chunking-strategy legality checks**
- [x] **Step 5: Extend `src/cli/plan_execution.rs`, `src/cli/mod.rs`, and `src/lib.rs` with the new gate and record subcommands plus explicit request/response types for contract, evaluation, and handoff flows**
- [x] **Step 6: Thread gate enforcement, read-time authoritative fingerprint verification, repo-state drift checks, authoritative recording, authoritative retry-counter mutation, and safe post-commit pruning through `src/execution/state.rs`, `src/execution/mutate.rs`, `src/execution/dependency_index.rs`, and `src/execution/mod.rs`**
- [x] **Step 7: Run `cargo nextest run --test contracts_execution_harness --test execution_harness_state --test plan_execution --test workflow_runtime` and fix failures until the slice is green**
- [x] **Step 8: Commit the slice with `git commit -m "feat: add execution harness gates and authority"`**
## Task 4: Bind the Macro-State Engine to Step-Level Execution

**Spec Coverage:** REQ-003, REQ-005, REQ-009, REQ-011, REQ-016, REQ-032, REQ-033
**Task Outcome:** The new macro-state engine governs `begin`, `note`, `complete`, `reopen`, and `transfer`, keeps execution inside the active contract scope, applies the same atomic publication and crash-recovery rules as the `record-*` flows, extends per-step evidence with full harness-written completion provenance, and applies deterministic invalidation cascades for reopen, contract pivot, and plan pivot.
**Plan Constraints:**

- Preserve the existing step-level command family and extend it rather than replacing it with a second tracker.
- Reject out-of-contract task or step targets before any authoritative mutation occurs.
- Keep `chunk_id` stable until the active contract definition changes.
- Drive reopen and both pivot kinds from the dependency index instead of ad hoc command-local invalidation logic.
- Keep required evaluator state blocking execution until the aggregate evaluation state is legal for advancement.
- Keep repair and handoff transitions inside the active contract or the next runtime-selected repair contract.
- Exercise `task`, `task-group`, and `whole-run` scopes in transition tests so the runtime cannot accidentally collapse into task-only chunk behavior.
- Route `begin`, `note`, `complete`, `reopen`, and `transfer` through the same runtime-owned atomic publication boundary and interrupted-mutation recovery model used by authoritative `record-*` commands.
- Enforce `reset_policy` as runtime law rather than descriptive metadata, including chunk-boundary handoff creation and deterministic adaptive handoff triggers.
- Make plan-pivot blocking surface the stable `blocked_on_plan_revision` reason code rather than a generic blocked state.
- Make `note --state Blocked|Interrupted` drive the documented macro-state implications instead of staying a passive log entry when runtime policy requires `handoff_required` or `pivot_required`.
- Validate write authority and stable failure-class mapping for `begin`, `note`, `complete`, `reopen`, and `transfer`, not just for `gate-*` and `record-*` commands.
**Open Questions:** none

**Files:**

- Create: `src/execution/transitions.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/contracts/evidence.rs`
- Modify: `tests/execution_harness_state.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/support/workflow.rs`

- [x] **Step 1: Add red transition tests for happy path, repair path, retry-budget versus pivot-threshold routing, blocked handoff path, chunk-boundary and adaptive-handoff triggers, `note --state Blocked|Interrupted` macro-state implications, pivot path with `blocked_on_plan_revision`, task/task-group/whole-run contract-scope rejection, step-command write-authority rejection, step-command stable failure classes, chunk-id rollover boundaries, step-level atomicity, interrupted-mutation recovery, and stale-cascade behavior in `tests/plan_execution.rs` and `tests/workflow_runtime.rs`**
- [x] **Step 2: Add red per-step evidence tests for source contract path, source evaluation fingerprint, evaluator verdict, source handoff fingerprint, repo-state provenance when applicable, and failing-criterion provenance in `tests/execution_harness_state.rs`**
- [x] **Step 3: Create `src/execution/transitions.rs` with the legal `HarnessPhase` transition table and macro-state guard helpers**
- [x] **Step 4: Bind `begin`, `note`, `complete`, `reopen`, and `transfer` to the transition rules, reset-policy handoff triggers, write-authority validation, stable failure-class mapping, and shared atomic-publication helpers in `src/execution/mutate.rs` and `src/execution/state.rs`**
- [x] **Step 5: Extend `src/contracts/evidence.rs` and `tests/support/workflow.rs` so reopened and repaired steps preserve the full harness provenance fields, including source contract path, source evaluation fingerprint, evaluator verdict, source handoff fingerprint, and repo-state provenance when applicable**
- [x] **Step 6: Run `cargo nextest run --test execution_harness_state --test plan_execution --test workflow_runtime` and fix failures until the slice is green**
- [x] **Step 7: Commit the slice with `git commit -m "feat: bind harness phases to execution steps"`**
## Task 5: Expand Recommend and Make Preflight the Policy Acceptance Boundary

**Spec Coverage:** REQ-012, REQ-013, REQ-018, REQ-036, REQ-056, REQ-057, REQ-058, REQ-059
**Task Outcome:** `recommend` preserves the existing skill-choice contract while returning the full proposed harness policy tuple, including `recommended_skill`, `reason`, `decision_flags`, and `policy_reason_codes[]`; `execution_preflight` becomes the sole policy-acceptance and runtime-owned resume boundary with exact-replay idempotency, legal new-run boundaries mint new run identities, required handoff and interrupted-mutation checks gate resume, and active execution rejects pre-harness continuation.
**Plan Constraints:**

- Keep `recommend` side-effect free.
- Preserve and test the existing `recommend` output contract while adding harness policy fields, so `recommended_skill`, `reason`, `decision_flags`, and `policy_reason_codes[]` remain stable and machine-readable.
- Mint a new `execution_run_id` only on a new approved plan revision or a recorded policy reset boundary that changes the accepted snapshot.
- Persist accepted policy snapshots in authoritative state and structured events only.
- Define exact `execution_preflight` replay using the approved plan revision, accepted policy snapshot, and authoritative baseline together; changes to any of the three must not be treated as idempotent replay.
- Allow `execution_preflight` to compute the accepted policy snapshot when no proposed snapshot is supplied, while keeping that computed snapshot subject to the same replay and acceptance rules.
- Reject pre-harness continuation instead of translating legacy execution evidence into harness truth.
- Keep recommended skill selection aligned with the accepted frozen policy fields for the active run.
- Reconcile or reclaim write authority inside `execution_preflight` before active execution may resume.
- Reject resume in `execution_preflight` when a required handoff is missing or malformed or when interrupted authoritative mutation recovery is still unresolved.
- Treat `execution_preflight` and startup recovery as dependency-aware maintenance points for pruning, retention-window enforcement, and pruning-skip diagnostics.
- Allow an explicit policy reset boundary only when no active contract is mid-execution, and record that boundary before a new run resumes under the changed policy snapshot.
- Preserve candidate artifacts still needed by the active controller loop when preflight or startup maintenance pruning runs.
**Open Questions:** none

**Files:**

- Modify: `src/execution/authority.rs`
- Modify: `src/execution/dependency_index.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/execution/observability.rs`
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/workflow/status.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `tests/execution_harness_state.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/workflow_shell_smoke.rs`

- [x] **Step 1: Add red recommend and preflight tests for preserved `recommended_skill` / `reason` / `decision_flags` output, `policy_reason_codes[]`, policy-tuple output, exact replay defined by plan revision plus accepted policy snapshot plus authoritative baseline, `execution_preflight` policy computation when no snapshot is supplied, legal new-run boundaries, illegal mid-chunk policy resets, required-handoff rejection, write-authority reconciliation, interrupted authoritative mutation recovery, candidate-artifact-safe pruning maintenance points, and hard-cutover rejection of pre-harness execution evidence**
- [x] **Step 2: Extend `src/execution/state.rs` and `src/execution/authority.rs` so `recommend` returns the preserved skill-choice fields plus the proposed chunking, evaluator, reset, review-stack, and policy-reason fields without mutating accepted state, emits distinct recommendation-proposal observability, and `execution_preflight` reconciles resume authority and computes policy when needed before exposing active execution**
- [x] **Step 3: Extend `src/execution/dependency_index.rs`, `src/execution/observability.rs`, and `src/cli/plan_execution.rs` so `execution_preflight` records accepted policy snapshots in reconstructive policy-acceptance events, explicit policy-reset boundaries, preflight replay and new-run outcomes keyed to the authoritative baseline, required-handoff or recovery blocks, maintenance pruning or pruning-skip outcomes, and new-run creation with stable event and telemetry fields distinct from recommendation proposals**
- [x] **Step 4: Update `src/workflow/status.rs`, `src/workflow/operator.rs`, and `tests/workflow_shell_smoke.rs` so preflight and cutover truth are routed from the accepted harness state instead of the old thin execution model**
- [x] **Step 5: Run `cargo nextest run --test execution_harness_state --test plan_execution --test workflow_runtime --test workflow_shell_smoke` and fix failures until the slice is green**
- [x] **Step 6: Commit the slice with `git commit -m "feat: make preflight accept execution policy"`**
## Task 6: Integrate Workflow Operator and Downstream Gate Truth

**Spec Coverage:** REQ-001, REQ-015, REQ-017, REQ-024, REQ-034, REQ-037, REQ-040, REQ-053, REQ-054, REQ-055, REQ-061
**Task Outcome:** Workflow phase, doctor, handoff, and downstream gate behavior become harness-aware, use the exact public phase model, surface stable evaluator identity and reason codes, compute downstream freshness from fingerprint-indexed review, QA, and release-doc inputs, and fail closed on downstream repo-drift and artifact-integrity mismatches without adding a new public writer-conflict phase.
**Plan Constraints:**

- Keep final review, browser QA, release docs, and finish readiness as downstream authoritative gates.
- Index existing downstream artifacts instead of cloning them into a second harness-owned artifact family.
- Surface writer conflict inside the current public phase via `next_action`, `reason_codes[]`, and write-authority metadata.
- Make text and JSON operator surfaces agree on phase, next action, evaluator identity, and downstream freshness.
- Keep dependency-index failure visible in operator output instead of hiding it inside generic gate text.
- Make `gate-review` and `gate-finish` fail closed on `RepoStateDrift` and `ArtifactIntegrityMismatch` when downstream approval depends on mismatched authoritative provenance.
- Make operator `next_action` explicitly cover plan-pivot blockage and incomplete-authoritative-mutation recovery instead of leaving those states implicit in reason text.
- Make `gate-review` and `gate-finish` stay closed on unresolved harness failures and stale or non-harness contract/evaluation provenance, not just downstream artifact freshness problems.
- Make `gate-review` and `gate-finish` reject candidate artifacts anywhere authoritative execution provenance is required.
**Open Questions:** none

**Files:**

- Modify: `src/workflow/status.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `src/execution/state.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Modify: `tests/codex-runtime/eval-observability.test.mjs`
- Modify: `tests/codex-runtime/fixtures/workflow-artifacts/README.md`

- [x] **Step 1: Add red workflow and downstream-gate tests for the exact harness-aware public phases, downstream freshness states, evaluator-kind visibility, writer-conflict visibility without a new phase, operator `next_action` for plan-pivot blockage and incomplete-authoritative-mutation recovery, unresolved harness failure rejection, stale or non-harness execution-provenance rejection, candidate-artifact rejection, and downstream `RepoStateDrift` / `ArtifactIntegrityMismatch` rejection**
- [x] **Step 2: Extend `src/workflow/status.rs` and `src/workflow/operator.rs` to map the exact new harness phases, full status surface, and downstream freshness fields into status, phase, doctor, and handoff outputs**
- [x] **Step 3: Extend `src/execution/state.rs` so final review, QA, release-doc, and finish gates read fingerprint-indexed downstream inputs from the dependency index and fail closed on unresolved harness failures, stale, non-harness, or candidate contract/evaluation provenance, downstream repo-drift, or artifact-integrity mismatch**
- [x] **Step 4: Update `tests/codex-runtime/workflow-fixtures.test.mjs`, `tests/codex-runtime/eval-observability.test.mjs`, and the fixture README to pin the new JSON and text surfaces**
- [x] **Step 5: Run `cargo nextest run --test plan_execution --test workflow_runtime` and `node --test tests/codex-runtime/workflow-fixtures.test.mjs tests/codex-runtime/eval-observability.test.mjs` until the slice is green**
- [x] **Step 6: Commit the slice with `git commit -m "feat: wire workflow operator into harness state"`**
## Task 7: Normalize Execution, Review, and QA Skills to the Harness

**Spec Coverage:** REQ-013, REQ-015, REQ-017, REQ-020, REQ-034
**Task Outcome:** Execution skills emit candidate contracts, evaluations, and handoffs inside runtime-approved scope, while review and QA skills stay downstream gates, checked-in evaluator references and exemplars remain aligned with those gate contracts, and the checked-in prompts and skill docs match the runtime-owned harness contract.
**Plan Constraints:**

- Skills may emit candidate artifacts, but they must not claim authoritative state transitions.
- Keep downstream review and QA outside chunk-level verifier aggregation.
- Regenerate checked-in `SKILL.md` files in the same task that changes template or prompt wording.
- Keep prompt wording grounded in runtime commands, stable artifact names, and runtime-owned gate boundaries.
- Preserve useful human-readable guidance while removing any prose that competes with runtime authority.
- Make direct `record-*` or step-mutation attempts by helpers/subagents an explicit anti-contract case in prompts and tests, not just an implied misuse.
**Open Questions:** none

**Files:**

- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/requesting-code-review/code-reviewer.md`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md`
- Modify: `qa/references/issue-taxonomy.md`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`

- [x] **Step 1: Add red runtime-instruction and skill-doc tests for candidate artifact emission, forbidden direct authoritative mutation attempts by helpers/subagents, authoritative recording boundaries, downstream gate boundaries, checked-in evaluator references/exemplars, and harness-aware handoff wording**
- [x] **Step 2: Update the execution skill templates and subagent prompts to emit candidate contracts, evaluations, and handoffs that match the approved runtime contract**
- [x] **Step 3: Update the review and QA skill templates plus their checked-in reference/exemplar docs so they stay downstream gates and consume harness provenance without entering chunk-level verifier aggregation**
- [x] **Step 4: Regenerate the checked-in `SKILL.md` files and verify the generated docs match the updated templates**
- [x] **Step 5: Run `cargo nextest run --test runtime_instruction_contracts` and `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs` until the slice is green**
- [x] **Step 6: Commit the slice with `git commit -m "docs: align execution skills with harness runtime"`**
## Task 8: Finish the Fixture Matrix and Full Regression Gate

**Spec Coverage:** REQ-019, REQ-020, REQ-021
**Task Outcome:** Rust and Node fixture suites cover happy path, repair, pivot, handoff, cutover, candidate-versus-authoritative boundaries, stale contract/evaluation cases, non-harness provenance rejection, repo-state drift, incomplete authoritative mutation, dependency-index mismatch, retention eligibility and maintenance behavior, downstream freshness, and distinct observability event families plus telemetry surfaces so the approved harness contract is pinned end to end.
**Plan Constraints:**

- Add fixture-backed cases for authoritative and stale artifact states, not prose-only examples.
- Keep the full regression gate split between Rust runtime suites and Node contract suites.
- Refresh fixture README text in the same task that adds or renames fixture families.
- Do not mark this task complete until the full regression gate from `Validation Strategy` is green from the repo root.
- Keep fixture paths deterministic and repo-relative so they can be referenced from plan execution and workflow tests without ad hoc tempdir discovery.
- Include explicit candidate/non-authoritative and non-harness provenance fixtures, because the spec makes those fail-closed boundaries load-bearing rather than optional.
- Include observability cases for proposal versus policy-acceptance, replay outcomes, repo-state drift, integrity mismatch, partial-mutation recovery, and dependency-index pruning-skip events instead of assuming the event surface will be covered incidentally.
- Include telemetry/counter assertions for conflict, replay, drift, integrity-mismatch, recovery, and pruning outcomes so the implementation cannot satisfy observability with events alone.
- Include the full required event-family matrix, including phase-transition prev/next pairs, gate-result events for every gate, blocked-state entry and exit events, write-authority conflict and reclaim events, and downstream gate rejection events.
- Include minimum event-field assertions and the full telemetry-dimension matrix, not just event-family presence.
**Open Questions:** none

**Files:**

- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/pivot-required-status.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/handoff-required-status.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/candidate-execution-contract.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/candidate-evaluation-report.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/candidate-execution-handoff.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/stale-execution-contract.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/stale-evaluation-report.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/repo-state-drift-status.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/partial-authoritative-mutation-status.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/dependency-index-mismatch-status.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/dependency-index-clean.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/dependency-index-stale.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/dependency-index-malformed.json`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/non-harness-review-artifact.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/indexed-final-review-artifact.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/indexed-browser-qa-artifact.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/indexed-release-doc-artifact.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/retention-prunable-stale-artifact.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/harness/retention-active-authoritative-artifact.md`
- Modify: `tests/contracts_execution_harness.rs`
- Modify: `tests/execution_harness_state.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/packet_and_schema.rs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/support/workflow.rs`
- Modify: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Modify: `tests/codex-runtime/eval-observability.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/fixtures/workflow-artifacts/README.md`

- [x] **Step 1: Add red fixture-backed cases for happy path, repair path, pivot path, handoff path, hard cutover, authoritative and candidate contract/evaluation/handoff artifacts, stale contract/evaluation cases, non-harness provenance, repo-state drift, incomplete authoritative mutation, dependency-index clean/stale/malformed cases, downstream indexed-gate inputs, candidate-artifact-safe retention, active authoritative retention, safely-prunable stale retention, and retention eligibility**
- [x] **Step 2: Add red observability cases for phase-transition prev/next and trigger-detail events, proposal versus policy-acceptance, gate-result events for every gate, blocked-state entry and exit events, write-authority conflict and reclaim events, accepted replay versus replay-conflict, repo-state drift detection and reconciliation, artifact-integrity mismatch, partial-authoritative-mutation recovery, downstream gate rejection events, dependency-index pruning-skip events, minimum event payload fields including `event_kind` and `timestamp`, and machine-readable telemetry/counter surfaces for phase transitions, blocked-state entries by reason, authoritative mutation counts, gate failures, retry and pivot counts, evaluator outcomes, ordering gaps, replay outcomes, write-authority conflicts and reclaims, drift, integrity mismatches, and recovery**
- [x] **Step 3: Check in the new harness fixture payloads under `tests/codex-runtime/fixtures/workflow-artifacts/harness/` and document their intended authoritative, candidate, stale, non-harness, drifted, interrupted-mutation, dependency-index, and downstream-indexed states**
- [x] **Step 4: Extend `tests/support/workflow.rs` so Rust tests can load and compare the new harness fixture families without ad hoc parsing**
- [x] **Step 5: Run `cargo nextest run --test contracts_execution_harness --test execution_harness_state --test plan_execution --test workflow_runtime --test packet_and_schema --test runtime_instruction_contracts` and fix failures until the Rust gate is green**
- [x] **Step 6: Run `node --test tests/codex-runtime/workflow-fixtures.test.mjs tests/codex-runtime/eval-observability.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs` and fix failures until the Node gate is green**
- [x] **Step 7: Run the full regression gate from `Validation Strategy` and keep fixing failures until the entire harness plan is green**
- [x] **Step 8: Commit the slice with `git commit -m "test: add execution harness regression matrix"`**
## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-26T14:34:23Z
**Review Mode:** small_change
**Reviewed Plan Revision:** 2
**Critical Gaps:** 0
**Browser QA Required:** no
**Test Plan Artifact:** `/Users/dmulcahey/.featureforge/projects/dmulcahey-superpowers/dmulcahey-dm-workflow-enhancement-f8fb7449491f-test-plan-20260326-143423.md`
**Outside Voice:** skipped
