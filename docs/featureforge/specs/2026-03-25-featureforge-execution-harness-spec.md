# FeatureForge Execution Harness Orchestration

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review

## Summary

Add a Rust-owned execution harness inside `featureforge plan execution` that governs the post-approval implementation loop with explicit macro-phases, contract/evaluate/repair/handoff artifacts, adaptive evaluator and reset policies, branch-scoped authoritative state, and fail-closed intermediate gates. Preserve the existing outer workflow and existing downstream finish gates. Do **not** replace the planner, spec/plan approval flow, task packets, final code review, browser QA, release docs, or finish gate. Instead, make the Rust runtime own the long-running inner loop between `implementation_ready` and branch completion.

The intended result is:

- `featureforge workflow` still routes work from brainstorming through `implementation_ready`
- `featureforge plan execution` becomes a real long-running harness rather than a thin step tracker
- the runtime enforces chunk-level contract, execution, evaluation, repair/pivot, and handoff transitions
- existing skills become generator/evaluator implementations selected and constrained by runtime policy
- final review, browser QA, release documentation, and branch completion remain fail-closed downstream gates

## Document Contract

This spec is intentionally high-detail. Unless a section explicitly marks a name, field list, state name, command shape, or example as **representative**, concrete names in this document are normative for v1. Representative examples may be renamed during implementation only when the behavior contract remains unchanged.

This revision also draws a sharper line between **public compatibility surface** and **implementation detail**:

### Normative in v1

- the public harness phases
- the public CLI command family
- artifact families and required machine-readable fields
- failure classes and minimum reason-code vocabulary
- status/output fields called out as public
- policy snapshot semantics
- cutover behavior
- authoritative ordering and supersession rules

### Not normative in v1

- the exact retention-window duration
- the exact lease/lock implementation for write authority
- optional JSON mirrors derived from authoritative markdown artifacts
- internal sub-states or helper structs not exposed in CLI/status/operator surfaces
- heuristic thresholds used by `recommend`, as long as emitted public fields stay stable
- exact on-disk filename suffixes beyond the required project-root, branch-scoped, local-artifact model

## Problem

FeatureForge already has strong outer-workflow and provenance discipline, but the control plane becomes thin after plan approval. The repo already has:

- repo-visible specs and plans as source-of-truth documents
- task packets with plan/spec fingerprints and requirement traceability
- `featureforge plan execution` commands for status, recommendation, preflight, gates, and step mutation
- subagent-driven task execution with spec-compliance and code-quality review loops
- fail-closed final review and structured browser QA artifacts

What it does **not** yet have is a Rust-enforced inner loop that owns the post-approval execution lifecycle. Today, too much of that loop still lives in skill prose, late-stage review, or informal controller behavior.

Anthropic’s harness design for long-running apps provides the missing execution-layer shape:

- a planner/generator/evaluator split
- contract-first chunk execution
- separate skeptical evaluation against explicit criteria
- file-based handoffs for reset/resume boundaries
- repair-or-pivot behavior driven by evaluator results
- selective overhead: evaluator/reset loops where they help, simpler runs where they do not

FeatureForge should adopt those ideas at the execution layer while keeping its stronger existing workflow, plan, and provenance model.

## Desired Outcome

FeatureForge executes approved plans through a Rust-enforced harness with two layers of control:

1. **Outer workflow control** remains unchanged through spec approval, plan approval, and `implementation_ready`.
2. **Inner execution control** adds explicit macro-phases that keep long-running implementation on track:
   - prepare the workspace
   - draft and runtime-approve a chunk contract
   - execute only the scoped work for that contract
   - evaluate against explicit criteria
   - repair, pivot, or hand off when needed
   - pass through final review, browser QA, release docs, and finish gates

The end state is:

- execution policy is explicit and machine-readable
- contract/evaluation/handoff artifacts are first-class runtime inputs
- evaluator findings are granular enough to reopen or transfer work automatically
- chunking, evaluator frequency, and reset/handoff policy are adaptive rather than hardcoded
- the runtime, not skill prose, keeps the process on track

## Control Model Principles

The harness adds runtime-owned control without weakening the existing workflow.

- The outer workflow remains authoritative through `implementation_ready`.
- The Rust runtime is the execution law; skills are implementations operating inside that law.
- Chunk contracts are drafted by generators, but approval is runtime-owned through `gate-contract` and `record-contract`.
- Step-level execution primitives remain available only inside runtime-approved scope and legal harness phases.
- Authoritative harness state has one runtime-owned writer per active branch-scoped execution scope.
- Subagents may produce candidate artifacts but do not advance authoritative state directly.
- Human approval remains at spec approval, plan approval, downstream review/QA gates, finish readiness, and explicit escalation points.

## Goals

- Preserve the current outer workflow model up to `implementation_ready`.
- Add a persisted Rust-owned harness state machine under `featureforge plan execution`.
- Keep existing step-level execution primitives (`begin`, `note`, `complete`, `reopen`, `transfer`) as the micro-state layer.
- Add a chunk-scoped `ExecutionContract` artifact that bridges task packets and implementation.
- Add a normalized `EvaluationReport` artifact for all evaluator outputs.
- Add a normalized `ExecutionHandoff` artifact for resets, session changes, and blocked recovery.
- Extend execution status and recommend output to expose harness policy and harness progress.
- Normalize the existing skills as generator/evaluator implementations selected by runtime policy.
- Preserve fail-closed final review, QA, release docs, and finish readiness behavior.
- Add verification and fixture coverage for the new loop.
- Adopt the harness as the only supported active execution path once this design lands.

## Not In Scope

- Replacing the existing planning chain or changing the approval model before `implementation_ready`
- Replacing task packets as the core plan-to-task derivation artifact
- Making an evaluator mandatory on every run regardless of task difficulty
- Moving local execution-contract, evaluation, or handoff artifacts into repo-visible active docs
- Rewriting the existing skills from scratch when normalization is sufficient
- Implementing general-purpose parallel task execution beyond the current subagent strategy
- Adding model-specific token-window instrumentation as a hard requirement for resets
- Supporting mixed legacy/harness execution or fallback continuation paths inside `featureforge plan execution`
- Weakening or bypassing existing final review, QA, release-doc, or finish gates
- Introducing a second authoritative downstream artifact family for final review, browser QA, or release docs in v1

## Current-System Findings

The current repository is already architected around repo-visible spec and plan artifacts, task packets with requirement traceability, and a branch-scoped local artifact root under `~/.featureforge/projects/`. Execution starts only after an engineering-approved plan, and the current recommendation step only chooses between serial execution and same-session isolated subagent execution. That is a strong outer control plane, but it leaves the execution-layer loop under-modeled in Rust.

The existing runtime and skills already contain many of the necessary pieces:

- `featureforge plan execution` exposes `status`, `recommend`, `preflight`, `gate-review`, `gate-finish`, `begin`, `note`, `complete`, `reopen`, and `transfer`
- `TaskPacket` already carries `plan_path`, `plan_revision`, `plan_fingerprint`, source spec metadata, `task_number`, `task_title`, `requirement_ids`, and `packet_fingerprint`
- `PlanExecutionStatus` currently tracks `execution_mode`, `execution_fingerprint`, `evidence_path`, and active/blocking/resume task-step pointers
- `RecommendOutput` currently exposes only `recommended_skill`, `reason`, and `decision_flags`
- subagent-driven execution already runs a fresh implementer followed by spec-compliance review and then code-quality review before task completion
- final whole-diff review already fails closed against execution state and evidence provenance
- workflow-routed QA already writes structured pass/fail/blocked artifacts

Those pieces should be reused and normalized, not replaced.

## Public Compatibility Surface

The v1 compatibility surface is the smallest set of things other code, skills, or operators can rely on.

### Public commands

Existing commands remain:

- `status`
- `recommend`
- `preflight`
- `gate-review`
- `gate-finish`
- `begin`
- `note`
- `complete`
- `reopen`
- `transfer`

New commands are:

- `gate-contract`
- `record-contract`
- `gate-evaluator`
- `record-evaluation`
- `gate-handoff`
- `record-handoff`

### Public artifact families

- `ExecutionContract`
- `EvaluationReport`
- `ExecutionHandoff`
- `EvidenceArtifact`
- extended execution evidence/provenance written through the existing execution-evidence flow

### Public phase model

- `implementation_handoff`
- `execution_preflight`
- `contract_drafting`
- `contract_pending_approval`
- `contract_approved`
- `executing`
- `evaluating`
- `repairing`
- `pivot_required`
- `handoff_required`
- `final_review_pending`
- `qa_pending`
- `document_release_pending`
- `ready_for_branch_completion`

### Public machine-readable taxonomies

- failure classes from this spec’s minimum taxonomy
- reason codes from this spec’s minimum vocabulary
- stable evidence locator grammar and evidence kind vocabulary
- stable `satisfaction_rule` semantics

## Requirement Index

- [REQ-001][behavior] The current outer workflow remains authoritative through `implementation_ready`; the new harness is implemented under `featureforge plan execution`, not by replacing pre-implementation workflow routing.
- [REQ-002][behavior] The execution runtime adds a persisted `HarnessPhase` macro-state with legal transitions enforced in Rust.
- [REQ-003][behavior] Existing step-level execution primitives remain the micro-state layer inside the new harness; the runtime must validate them against the current macro-phase.
- [REQ-004][behavior] A new `ExecutionContract` artifact exists for each active chunk and includes source plan/spec/task-packet provenance, scoped steps, scoped requirement IDs, explicit criteria, non-goals, verifiers, evidence requirements, retry budget, pivot threshold, and reset policy.
- [REQ-005][behavior] Every active contract maps to a deterministic chunk of plan work; the runtime rejects `begin`, `complete`, `reopen`, or `transfer` operations that fall outside the currently active contract scope.
- [REQ-006][behavior] A new `EvaluationReport` artifact exists for evaluator outputs and includes evaluator kind, verdict, per-criterion results, requirement/step mappings, evidence references, affected tasks/steps, and recommended next action.
- [REQ-007][behavior] A new `ExecutionHandoff` artifact exists for session changes, adaptive resets, and blocked recovery, and includes active contract provenance, current phase, satisfied criteria, unresolved criteria, files touched, next action, risks, and workspace notes.
- [REQ-008][behavior] `PlanExecutionStatus` is extended to surface harness phase, chunk identity, chunking strategy, evaluator policy, reset policy, active contract fingerprint/path, last evaluation verdict, retry counters, pivot threshold, and handoff requirement state.
- [REQ-009][behavior] Execution evidence is extended so completed attempts can reference the active contract fingerprint, evaluation report fingerprint, evaluator verdict, failing criterion IDs when applicable, and handoff fingerprint when work resumed from a handoff.
- [REQ-010][behavior] The runtime adds fail-closed intermediate gates at least for contract validity, evaluator validity, and handoff validity, while preserving the existing fail-closed review and finish gates.
- [REQ-011][behavior] Evaluator outcomes drive runtime transitions: `pass` advances to the next chunk or final review; `fail` triggers repair inside budget; repeated `fail` beyond threshold triggers pivot or plan-update flow; `blocked` requires explicit unblock or handoff.
- [REQ-012][behavior] `featureforge plan execution recommend` is extended to return harness policy in addition to skill choice: chunking strategy, evaluator policy, reset policy, and required review stack.
- [REQ-013][behavior] The runtime treats existing execution skills as generator/evaluator implementations selected by policy rather than as free-standing execution laws.
- [REQ-014][behavior] Contract criteria and evaluator findings use stable criterion IDs with explicit mappings back to spec requirement IDs and covered plan steps.
- [REQ-015][behavior] `featureforge workflow operator` becomes harness-aware and exposes execution phases detailed enough to distinguish contracting, executing, evaluating, repairing, pivot-required, and handoff-required states.
- [REQ-016][behavior] Reset and handoff policy supports `none`, `chunk-boundary`, and `adaptive` modes; the runtime requires a valid handoff artifact whenever the active policy or state demands a reset/resume boundary.
- [REQ-017][behavior] Final code review, browser QA, release documentation, and finish readiness remain downstream authoritative gates and continue to fail closed.
- [REQ-018][behavior] Once the harness is enabled, active execution under `featureforge plan execution` uses only harness-governed artifacts; pre-harness execution evidence is not a supported continuation source.
- [REQ-019][verification] Verification covers state transitions, artifact parsing and provenance checks, invalidation cascades, operator routing, policy recommendation, hard-cutover behavior, and failure cases.
- [REQ-020][verification] Tests and fixtures prove that skills cannot advance execution past a failing contract, failing evaluation, or missing/invalid handoff.
- [REQ-021][verification] Tests prove that final review and finish readiness fail when unresolved harness failures, stale contract/evaluation provenance, or mismatched artifacts remain.
- [REQ-022][behavior] Runtime storage for harness artifacts stays under the existing `~/.featureforge/projects/` project artifact root and remains branch-scoped and reproducible.
- [REQ-023][behavior] Harness commands and gates expose a stable minimum machine-readable failure-class taxonomy covering at least illegal phase, stale provenance, contract mismatch, evaluation mismatch, missing required handoff, non-harness provenance, and blocked-on-plan-pivot execution.
- [REQ-024][behavior] The harness emits a minimum observability contract for phase transitions, gate outcomes, blocked states, and downstream gate rejections using structured events keyed by stable run, chunk, phase, contract, evaluation, and handoff identifiers.
- [REQ-025][behavior] The runtime enforces a single-writer authority for authoritative harness state per active branch-scoped execution scope; concurrent mutation attempts fail closed, and subagents may generate candidate artifacts but may not advance authoritative state directly.
- [REQ-026][behavior] Artifact parsers reject unknown or unsupported `contract_version`, `report_version`, `handoff_version`, and `evidence_artifact_version` values with a stable failure class; the runtime never best-effort parses unsupported artifact versions.
- [REQ-027][behavior] Candidate artifacts are marked or stored separately from authoritative artifacts; only runtime-recorded authoritative artifacts may satisfy gates, appear as active artifacts in status/state, or advance harness state.
- [REQ-028][behavior] Authoritative `record-contract`, `record-evaluation`, and `record-handoff` mutations are idempotent for identical replay against the same expected state; mismatched replay attempts fail closed and must not duplicate state transitions or side effects.
- [REQ-029][behavior] The runtime captures repo-state provenance for authoritative artifacts and fails closed on out-of-band HEAD or worktree drift when later authoritative mutations or downstream gates depend on that provenance, until the run is reconciled, reopened, or re-evaluated.
- [REQ-030][behavior] The runtime computes authoritative artifact fingerprints from deterministic canonical content, verifies them on every later read that matters to state/gates/review/finish, and fails closed if recorded fingerprints or on-disk authoritative artifact content no longer match.
- [REQ-031][behavior] Authoritative harness mutations commit atomically: each authoritative mutation either leaves the previously authoritative state intact or fully publishes its new authoritative artifact and state transition.
- [REQ-032][behavior] Provenance invalidation is deterministic: `reopen` stales the active chunk’s dependent evaluation, handoff, and downstream gate artifacts; contract pivot supersedes the active contract and all artifacts derived from it; plan pivot blocks the run and stales all execution-derived downstream provenance for the superseded approved plan revision.
- [REQ-033][behavior] Multi-evaluator aggregation is deterministic and fail-closed: every evaluator kind required by the active contract must produce an authoritative report for the active contract; chunk pass requires all required evaluator kinds to pass; any required `fail` prevents aggregate pass and drives repair/pivot logic; any required `blocked` prevents advancement until resolved.
- [REQ-034][behavior] Contract-level `verifiers[]` are inner-loop evaluator kinds only. Downstream gate modes such as `final_code_review` and `browser_qa` may emit normalized artifacts for provenance, but they remain downstream authoritative gates and do not participate in chunk pass aggregation.
- [REQ-035][behavior] `recommended_action` is bounded evaluator guidance, not execution law. `verdict`, phase legality, and runtime policy remain authoritative.
- [REQ-036][behavior] Run and chunk identity rollover is deterministic: `execution_run_id` remains stable across normal execution, repair, handoff, reopen, and contract pivot within the same approved plan revision and policy snapshot; plan-pivot re-entry through `execution_preflight` on a newly approved plan revision or an explicit policy reset boundary that adopts a different policy snapshot creates a new `execution_run_id`; `chunk_id` changes only when the active contract definition changes.
- [REQ-037][behavior] Evaluation-related observability is explicit: structured events and relevant status/operator outputs expose `evaluator_kind` whenever an evaluation artifact, evaluator result, or evaluator-driven transition/block is involved.
- [REQ-038][behavior] Authoritative ordering is runtime-owned and monotonic: authoritative contracts, evaluations, handoffs, and state transitions carry a monotonic authoritative sequence used for supersession, audit ordering, and replay safety.
- [REQ-039][behavior] `authoritative_sequence` is scoped to `execution_run_id`: it starts fresh for each new run, increases monotonically only within that run, and authoritative order is determined by the pair `(execution_run_id, authoritative_sequence)`.
- [REQ-040][behavior] `reason_codes[]` use a stable minimum taxonomy for blocked states and evaluator/runtime transitions, covering at least `waiting_on_required_evaluator`, `required_evaluator_failed`, `required_evaluator_blocked`, `handoff_required`, `repair_within_budget`, `pivot_threshold_exceeded`, `blocked_on_plan_revision`, `write_authority_conflict`, `repo_state_drift`, `stale_provenance`, `recovering_incomplete_authoritative_mutation`, `missing_required_evidence`, and `invalid_evidence_satisfaction_rule`.
- [REQ-041][behavior] Contract-declared `evidence_requirements[]` are fail-closed. Required evidence for the active contract must be satisfied by authoritative evidence refs traceable to the relevant criteria and covered steps before `gate-evaluator` or aggregate pass may succeed.
- [REQ-042][behavior] `evidence_requirements[].satisfaction_rule` uses a stable minimum vocabulary with deterministic runtime semantics. At minimum, the runtime must support `all_of`, `any_of`, and `per_step`, and reject unknown rule values fail closed.
- [REQ-043][behavior] `EvaluationReport.evidence_refs[]` uses a minimum machine-readable schema. At minimum, each evidence ref must declare `evidence_ref_id`, `kind`, `source`, `requirement_ids[]`, `covered_steps[]`, `evidence_requirement_ids[]`, and `summary`.
- [REQ-044][behavior] `EvaluationReport.evidence_refs[].kind` uses a stable minimum vocabulary with deterministic runtime meaning. At minimum, the runtime must support `code_location`, `command_output`, `test_result`, `artifact_ref`, and `browser_capture`.
- [REQ-045][behavior] `EvaluationReport.evidence_refs[].source` uses a stable minimum locator contract with kind-compatible shapes and canonical validation rules. At minimum, the runtime must support `repo:<relative_path>[#L<line>]`, `command_artifact:<artifact_ref>`, `test_artifact:<artifact_ref>`, `artifact:<artifact_ref>`, and `browser_artifact:<artifact_ref>`.
- [REQ-046][behavior] Artifact-backed evidence locators use a stable artifact-target contract. `<artifact_ref>` resolves by canonical artifact fingerprint; optional canonical path is supporting metadata only and must not determine artifact identity, supersession, or gate truth.
- [REQ-047][behavior] Repo-backed evidence locators use authoritative repo-state provenance. `repo:` locators resolve only against the authoritative repo-state baseline recorded for the relevant evaluation/run.
- [REQ-048][behavior] Repo-backed evidence may resolve against an authoritative worktree snapshot, not only clean committed `HEAD`, when the runtime can prove the exact baseline using authoritative repo-state provenance.
- [REQ-049][behavior] Dirty-worktree `repo:` evidence is durable. When repo-backed evidence depends on content not recoverable from clean committed `HEAD` alone, the runtime must preserve or materialize the exact provenance-bound content needed for later validation and downstream use.
- [REQ-050][behavior] Dirty-worktree `repo:` evidence uses whole-file durable snapshots when later reread is required.
- [REQ-051][behavior] Durable runtime-materialized evidence is first-class. When the runtime preserves dirty-worktree `repo:` evidence for later reread, it must materialize a first-class local `EvidenceArtifact` with stable fingerprinted identity and local reference semantics.
- [REQ-052][behavior] Local harness artifact retention is bounded and fail-closed. Active authoritative artifacts, candidate artifacts still needed for in-flight controller work, and any artifacts still required by current state, review, QA, release-doc, finish, or durable evidence reread dependencies must be retained.
- [REQ-053][behavior] Dependency truth is runtime-owned. The runtime maintains a dependency index/reference graph for authoritative artifacts, downstream gate inputs, and any active candidate-retention claims that matter to pruning or stale-cascade decisions.
- [REQ-054][behavior] Downstream gate outputs keep their existing artifact shapes in v1. When final review, browser QA, or release-doc outputs participate in stale-cascade, retention, or downstream gate truth, the runtime fingerprints and indexes those existing outputs as authoritative dependency inputs.
- [REQ-055][behavior] `PlanExecutionStatus` and operator output expose downstream gate freshness explicitly. At minimum, final review, browser QA, and release-doc status must distinguish `not_required`, `missing`, `fresh`, and `stale`, and expose the last indexed authoritative downstream artifact fingerprint when one exists.
- [REQ-056][behavior] The emitted execution policy tuple is run-scoped and frozen by default. `chunking_strategy`, `evaluator_policy`, `reset_policy`, and `review_stack[]` remain fixed for the life of an `execution_run_id`; they may change only through `execution_preflight` on a newly approved plan revision or an explicit runtime-owned policy reset boundary that mints a new `execution_run_id`.
- [REQ-057][behavior] `recommend` is advisory only. It may propose a candidate policy snapshot, but only `execution_preflight` may accept, persist, and activate the authoritative policy snapshot for an `execution_run_id`.
- [REQ-058][behavior] Accepted policy snapshots do not require a separate artifact family in v1. The authoritative accepted snapshot for an `execution_run_id` lives in authoritative state and structured policy-acceptance events.
- [REQ-059][behavior] `execution_preflight` is idempotent for exact replay. Replaying it against the same accepted policy snapshot, same approved plan revision, and same authoritative baseline returns the existing accepted result for that run and must not mint a second `execution_run_id`, duplicate policy-acceptance events, or reset run-scoped ordering.
- [REQ-060][behavior] Authoritative execution scope remains branch-scoped in v1, not worktree-scoped. Multiple local worktrees on the same branch share one authoritative harness state, dependency index, and run-identity space for that branch.
- [REQ-061][behavior] Write-authority conflict does not create a new public operator phase in v1. The operator keeps the current public phase and surfaces authority blockage through `next_action`, stable `reason_codes[]`, `write_authority_state`, `write_authority_holder`, and `write_authority_worktree` when known.

## Design Decisions

- **DEC-001** Keep the current outer workflow contract intact and add the new harness only after `implementation_ready`.
- **DEC-002** Model the execution harness as a macro-state machine layered on top of the current step-level micro-state.
- **DEC-003** Keep task packets as the base task contract; add chunk-level execution contracts rather than replacing packets.
- **DEC-004** Normalize the existing skill ecosystem instead of introducing a separate parallel evaluator stack.
- **DEC-005** Treat evaluator frequency and reset behavior as adaptive policy decisions, not fixed global rules.
- **DEC-006** Use spec requirement IDs as the backbone for criterion traceability across contracts, evaluator findings, and final review.
- **DEC-007** Keep local harness artifacts under `~/.featureforge/projects/` rather than adding more repo-visible authoritative files.
- **DEC-008** Preserve and reuse current fail-closed review and finish behavior instead of replacing it with a new completion model.
- **DEC-009** Treat harness rollout as a hard cutover for active execution; do not preserve a legacy continuation path inside `featureforge plan execution`.
- **DEC-010** Keep authoritative harness-state mutation controller-owned and runtime-mediated.
- **DEC-011** Make authoritative harness mutations atomic and crash-recoverable.
- **DEC-012** Make stale-provenance cascades explicit and deterministic.
- **DEC-013** Treat the active contract’s required evaluator set as an all-required runtime contract.
- **DEC-014** Preserve final review and QA as downstream authoritative gates even when their outputs can be normalized into evaluation-shaped provenance artifacts.
- **DEC-015** Keep evaluator `recommended_action` advisory under runtime-owned verdict and policy.
- **DEC-016** Keep run identity stable within one approved-plan execution and one frozen policy snapshot; mint a new run identity only when execution re-enters on a newly approved plan revision or an explicit policy reset boundary adopting a different snapshot.
- **DEC-017** Make evaluator identity first-class in observability and operator surfaces.
- **DEC-018** Make supersession and audit order derive from a runtime-owned monotonic sequence rather than timestamps, file paths, or arrival order.
- **DEC-019** Scope monotonic authoritative ordering to a single run identity so run rollover and sequence rollover stay aligned.
- **DEC-020** Treat `reason_codes[]` as a stable machine-readable vocabulary, not free-form labels.
- **DEC-021** Treat contract-declared evidence requirements as runtime-enforced pass criteria rather than evaluator-only narrative guidance.
- **DEC-022** Treat evidence satisfaction rules as stable runtime semantics.
- **DEC-023** Treat evidence references as machine-validated runtime inputs.
- **DEC-024** Treat evidence-reference kinds as stable runtime semantics.
- **DEC-025** Treat evidence-source locators as stable runtime contracts.
- **DEC-026** Treat artifact-backed evidence targets as fingerprint-addressed authoritative references rather than path-addressed pointers.
- **DEC-027** Treat repo-backed evidence as provenance-bound to authoritative repo state rather than live-worktree lookups.
- **DEC-028** Treat authoritative repo-backed evidence baseline as `HEAD` plus worktree snapshot provenance rather than clean-commit-only content.
- **DEC-029** Treat dirty-worktree repo evidence as a durable snapshot obligation, not just an identity-proof obligation.
- **DEC-030** Treat durable dirty-worktree repo evidence snapshots as whole-file preservation rather than span-only fragments.
- **DEC-031** Treat durable runtime-materialized evidence as a first-class local artifact family rather than an internal implementation detail.
- **DEC-032** Treat local harness artifact growth as bounded by runtime-owned retention rules rather than unbounded append-only accumulation.
- **DEC-033** Treat artifact dependency truth as a runtime-owned indexed graph rather than ad hoc inference at call sites.
- **DEC-034** Preserve existing downstream review/QA/release-doc artifact shapes and fingerprint/index them when they become authoritative dependency inputs.
- **DEC-035** Make downstream gate freshness first-class in status and operator surfaces.
- **DEC-036** Treat the emitted execution policy tuple as a frozen run-scoped snapshot rather than something the runtime may recompute underneath an active run.
- **DEC-037** Keep `recommend` side-effect free and make `execution_preflight` the sole policy-acceptance boundary.
- **DEC-038** Keep accepted policy snapshots in authoritative state plus structured events rather than introducing a separate local policy-artifact family in v1.
- **DEC-039** Treat `execution_preflight` like an idempotent control-plane commit point rather than a one-shot edge that mints a new run identity on every retry.
- **DEC-040** Keep authoritative harness scope branch-scoped across same-branch worktrees and use worktree identity only as diagnostic metadata.
- **DEC-041** Keep write-authority conflict inside the existing public phase model and surface it through next-action, reason-code, and holder metadata.

## Affected Surfaces

The implementation directly affects at least these areas:

- `src/execution/state.rs`
- `src/execution/mutate.rs`
- `src/execution/*` new focused modules (`harness`, `authority`, `gates`, `transitions`, `dependency_index`, `observability`)
- `src/cli/plan_execution.rs`
- `src/workflow/operator.rs`
- `src/workflow/status.rs`
- `src/contracts/packet.rs` and adjacent execution/provenance models
- `src/contracts/evidence.rs`
- local artifact parsing and fingerprinting helpers
- `skills/subagent-driven-development/*`
- `skills/executing-plans/*`
- `skills/requesting-code-review/*`
- `skills/qa-only/*`
- shared review/QA references and exemplars
- tests for workflow runtime, operator routing, and plan execution
- `tests/codex-runtime/fixtures/workflow-artifacts/` and related fixture contracts

## Architecture

### 1. Boundary between workflow routing and execution orchestration

The current workflow contract remains:

```text
brainstorming
  -> plan-ceo-review
  -> writing-plans
  -> plan-eng-review
  -> implementation_ready
```

The new harness begins only after the approved plan reaches `implementation_ready`.

```text
implementation_ready
  -> execution_preflight
  -> execution_harness
       -> contract
       -> execute
       -> evaluate
       -> repair | pivot | handoff
  -> final_review
  -> browser_qa (when required)
  -> release_docs
  -> branch_completion
```

### 2. Macro-state machine

The runtime owns a persisted `HarnessPhase` enum with the public phase set defined earlier. Internal helper sub-states may exist, but they must not leak into public compatibility surfaces.

`contract_pending_approval` means a drafted contract is waiting for runtime validation and recording through `gate-contract` and `record-contract`. It is **not** a human approval stop unless another escalation path has already blocked the run.

The phase machine must enforce these invariants:

- exactly one active public phase exists per active run
- only `contract_approved`, `executing`, or `repairing` may have active begun work
- `evaluating` must not allow new step execution until the evaluation result is recorded
- `handoff_required` blocks normal execution until a valid handoff is recorded and accepted
- `final_review_pending` is reachable only when all plan steps are resolved and all contract/evaluation obligations for the active policy are satisfied

Recommended transition model:

```text
implementation_handoff
  -> execution_preflight
  -> contract_drafting
  -> contract_pending_approval
  -> contract_approved
  -> executing
  -> evaluating
       pass -> contract_drafting (next chunk) | final_review_pending
       fail -> repairing
       fail over threshold -> pivot_required
       blocked -> handoff_required
  -> repairing -> executing
  -> pivot_required -> contract_drafting (contract pivot) | blocked pending approved plan revision (plan pivot)
  -> handoff_required -> execution_preflight | contract_drafting | contract_approved
  -> final_review_pending -> qa_pending | document_release_pending | ready_for_branch_completion
```

### 3. Micro-state model

Do **not** discard the existing step-level mechanics. `begin`, `note`, `complete`, `reopen`, and `transfer` remain the micro-state layer; the harness validates them against the macro-state and active contract scope.

Step-level rules:

- `begin` is allowed only when the macro-state is `contract_approved`, `executing`, or `repairing`
- `complete` is allowed only for a step inside the active contract scope
- `reopen` deterministically invalidates dependent evaluation, handoff, and downstream provenance
- `transfer` is allowed only when the resulting ownership remains inside the active chunk or a runtime-selected repair chunk
- `note --state Blocked|Interrupted` remains legal for step-level problems, but runtime policy decides whether that also forces `handoff_required` or `pivot_required`

### 4. Chunking model

The harness supports these chunking strategies:

- `task`
- `task-group`
- `whole-run`

Each contract declares:

- `chunk_id`
- `chunking_strategy`
- exact covered tasks and steps
- exact source task-packet fingerprint set
- exact requirement IDs in scope

Identity rules:

- `chunk_id` remains stable across step execution, repair, handoff, and reopen while the active contract definition is unchanged
- a new `chunk_id` is minted when the runtime activates a different contract definition, including next-chunk advancement or contract pivot
- `chunk_id` does not change merely because a new evaluation report or handoff artifact is recorded against the same active contract definition

### 5. `ExecutionContract`

Purpose: bridge approved plan + task packets into a scoped, testable, runtime-governed chunk contract.

Minimum schema:

```text
contract_version
authoritative_sequence
source_plan_path
source_plan_revision
source_plan_fingerprint
source_spec_path
source_spec_revision
source_spec_fingerprint
source_task_packet_fingerprints[]
chunk_id
chunking_strategy
covered_steps[]
requirement_ids[]
criteria[]
non_goals[]
verifiers[]
evidence_requirements[]
retry_budget
pivot_threshold
reset_policy
generated_by
generated_at
contract_fingerprint
```

Each criterion includes at least:

```text
criterion_id
title
description
requirement_ids[]
covered_steps[]
verifier_types[]
threshold
notes
```

Each evidence requirement includes at least:

```text
evidence_requirement_id
kind
requirement_ids[]
covered_steps[]
satisfaction_rule
notes
```

`satisfaction_rule` minimum vocabulary:

- `all_of`
- `any_of`
- `per_step`

Contract rules:

- contracts derive from the exact approved plan revision and matching task-packet provenance
- unsupported `contract_version` is rejected fail closed
- candidate contracts may exist, but only authoritative contracts recorded by the runtime may satisfy `gate-contract`, become active, or advance state
- stale plan/spec/task-packet provenance is rejected
- empty scope, empty criteria, or empty verifier declarations are rejected
- `verifiers[]` is the required inner-loop evaluator-kind set for the active contract
- downstream gate modes such as `final_code_review` and `browser_qa` must not appear in `verifiers[]`
- explicit empty `evidence_requirements[]` is required when no additional evidence is needed

### 6. `EvaluationReport`

Purpose: normalized evaluator output for inner-loop evaluators and, where useful for provenance, normalized downstream artifacts.

Minimum schema:

```text
report_version
authoritative_sequence
source_plan_path
source_plan_revision
source_plan_fingerprint
source_contract_fingerprint
evaluator_kind
verdict                # pass | fail | blocked
criterion_results[]
affected_steps[]
evidence_refs[]
recommended_action     # continue | repair | pivot | escalate | handoff
summary
generated_by
generated_at
report_fingerprint
```

Each criterion result includes at least:

```text
criterion_id
status                 # pass | fail | blocked
requirement_ids[]
covered_steps[]
finding
evidence_refs[]
severity
```

Each evidence ref includes at least:

```text
evidence_ref_id
kind
source
requirement_ids[]
covered_steps[]
evidence_requirement_ids[]
summary
```

`kind` minimum vocabulary:

- `code_location`
- `command_output`
- `test_result`
- `artifact_ref`
- `browser_capture`

`source` minimum locator grammar:

- `repo:<relative_path>[#L<line>]`
- `command_artifact:<artifact_ref>`
- `test_artifact:<artifact_ref>`
- `artifact:<artifact_ref>`
- `browser_artifact:<artifact_ref>`

Evaluation rules:

- unsupported `report_version` is rejected fail closed
- candidate reports may exist, but only authoritative reports recorded by the runtime may satisfy `gate-evaluator`, update retry state, or drive phase transitions
- the report must cite the exact active contract fingerprint it evaluated
- every failing or blocked criterion identifies requirement IDs and steps
- `recommended_action` remains advisory; it cannot override verdict, phase legality, retry budget, or runtime policy
- reports whose evidence refs are malformed, unsupported, unresolved, non-canonical, or inconsistent with the active contract are rejected
- downstream gate outputs may be normalized into this schema for provenance, but they do not satisfy `gate-evaluator` and do not participate in chunk-pass aggregation

### 7. `ExecutionHandoff`

Purpose: represent a real reset/resume boundary rather than an in-session summary.

Minimum schema:

```text
handoff_version
authoritative_sequence
source_plan_path
source_plan_revision
source_contract_fingerprint
harness_phase
chunk_id
satisfied_criteria[]
open_criteria[]
open_findings[]
files_touched[]
next_action
workspace_notes
commands_run[]
risks[]
generated_by
generated_at
handoff_fingerprint
```

Handoff rules:

- unsupported `handoff_version` is rejected fail closed
- candidate handoffs may exist, but only authoritative handoffs recorded by the runtime may satisfy `gate-handoff`, clear `handoff_required`, or reopen execution
- a handoff is required whenever the active policy is `chunk-boundary` and a chunk ends
- a handoff is required whenever the runtime enters `handoff_required`
- adaptive policy may also require handoffs on repeated failures or explicit session separation
- preflight rejects resume when a required handoff is missing or malformed
- a handoff must name one concrete next action

### 8. `EvidenceArtifact`

Purpose: hold durable runtime-materialized evidence when dirty-worktree `repo:` evidence or other local captures must remain re-readable later.

Minimum schema:

```text
evidence_artifact_version
evidence_artifact_fingerprint
evidence_kind
source_locator
repo_state_baseline_head_sha
repo_state_baseline_worktree_fingerprint
relative_path
captured_content_fingerprint
generated_by
generated_at
```

Rules:

- unsupported `evidence_artifact_version` is rejected fail closed
- authoritative fingerprints are computed from canonical metadata plus preserved payload content
- candidate evidence artifacts may exist, but only authoritative runtime-materialized `EvidenceArtifact` artifacts may satisfy durable reread requirements
- dirty-worktree `repo:` evidence requiring durability resolves through exactly one matching authoritative `EvidenceArtifact`

### 9. Status model

`PlanExecutionStatus` is extended with at least the following additional fields:

```text
execution_run_id
latest_authoritative_sequence
harness_phase
chunk_id
chunking_strategy
evaluator_policy
reset_policy
review_stack[]
active_contract_path
active_contract_fingerprint
required_evaluator_kinds[]
completed_evaluator_kinds[]
pending_evaluator_kinds[]
non_passing_evaluator_kinds[]
aggregate_evaluation_state
last_evaluation_report_path
last_evaluation_report_fingerprint
last_evaluation_evaluator_kind
last_evaluation_verdict
current_chunk_retry_count
current_chunk_retry_budget
current_chunk_pivot_threshold
handoff_required
open_failed_criteria[]
write_authority_state
write_authority_holder
write_authority_worktree
repo_state_baseline_head_sha
repo_state_baseline_worktree_fingerprint
repo_state_drift_state
dependency_index_state
final_review_state
browser_qa_state
release_docs_state
last_final_review_artifact_fingerprint
last_browser_qa_artifact_fingerprint
last_release_docs_artifact_fingerprint
```

Status rules:

- status remains readable before execution starts and without relying on a running skill to infer the current law
- same-branch multi-worktree sessions remain one authoritative execution scope; worktree identity is diagnostic only
- `required_evaluator_kinds[]`, `completed_evaluator_kinds[]`, `pending_evaluator_kinds[]`, `non_passing_evaluator_kinds[]`, and `aggregate_evaluation_state` refer only to the active contract’s inner-loop evaluator set
- `chunking_strategy`, `evaluator_policy`, `reset_policy`, and `review_stack[]` are the authoritative policy snapshot for the active `execution_run_id` and must not drift mid-run
- `final_review_state`, `browser_qa_state`, and `release_docs_state` use the stable `not_required | missing | fresh | stale` vocabulary
- `latest_authoritative_sequence` resets when a new `execution_run_id` is minted

### 10. Evidence, provenance, invalidation, and dependency truth

Current execution evidence already records per-step attempts, file proofs, verification summary, packet fingerprint, and HEAD/base SHA. Extend that provenance rather than replacing it.

Each completed attempt written by the harness must be able to reference:

- active contract fingerprint and source contract path
- source evaluation report fingerprint when completion follows repair/evaluation
- evaluator verdict that justified continuation
- failing criterion IDs being addressed during repair
- source handoff fingerprint when the session resumed from a required handoff
- source HEAD SHA and worktree fingerprint or equivalent repo-state snapshot identifier when provenance matters

Invalidation rules:

- the runtime-owned dependency index/reference graph is authoritative for stale-cascade and pruning decisions
- `reopen` stales dependent evaluation, handoff, and downstream artifacts for the reopened provenance chain
- contract pivot supersedes the active contract and stales artifacts derived from it
- plan pivot blocks execution and stales all execution-derived downstream provenance for the superseded approved plan revision
- stale artifacts remain preserved for audit/debugging until dependency-aware retention rules allow pruning

Repo-state drift rules:

- authoritative artifacts whose later use depends on repo-state provenance capture relevant HEAD/worktree identity
- later authoritative mutations and downstream gates compare current repo state against the authoritative provenance they depend on
- drift fails closed until the run is reconciled, reopened, or re-evaluated

Dependency truth rules:

- the runtime owns a dependency index/reference graph
- invalidation, gate truth, and pruning eligibility use that graph rather than ad hoc inference
- if the dependency index is missing, malformed, or inconsistent with authoritative state, the runtime skips pruning and fails closed for any command or gate that requires dependency truth

### 11. Intermediate gates

`gate-contract` validates:

- current phase legality
- plan/spec/task-packet provenance
- real plan task/step coverage
- non-empty criteria and valid requirement/step mapping
- valid inner-loop `verifiers[]`
- valid `evidence_requirements[]`

`gate-evaluator` validates:

- active-contract match
- expected evaluator kind
- valid criterion IDs
- valid verdict
- legal `recommended_action`
- valid affected-step references
- valid evidence ref schema, kinds, locators, and satisfaction semantics
- satisfaction of required contract evidence obligations

`gate-handoff` validates:

- handoff is required or explicitly being recorded
- active-contract match
- concrete next action and unresolved-criteria fields when work remains open
- legal resume path for current state/policy

Preserve existing `gate-review` and `gate-finish` behavior, but extend them to fail closed on unresolved harness failures, stale or non-harness contract/evaluation provenance, repo-state drift, artifact-integrity mismatch, and candidate-artifact misuse.

### 12. Multi-evaluator aggregation and transitions

Aggregation rules:

- the active contract’s `verifiers[]` defines the required evaluator-kind set for the active chunk
- downstream gate modes in `review_stack[]` do not participate in chunk-level aggregate evaluation
- aggregate precedence is deterministic: `blocked > fail > pending > pass`
- aggregate pass requires an authoritative passing report from every required evaluator kind

Transition rules:

- `pass` -> next chunk or `final_review_pending`
- `fail` -> increment retry counter, then `repairing` or `pivot_required`
- `blocked` -> `handoff_required` or equivalent runtime-blocked state
- `pivot_required` supports both contract pivot and plan pivot
- plan pivot blocks execution pending a newly approved plan revision and requires re-entry through `execution_preflight`

### 13. Policy engine

Extended `recommend` output includes:

```text
recommended_skill
reason
decision_flags
chunking_strategy
evaluator_policy
reset_policy
review_stack[]
policy_reason_codes[]
```

Policy rules:

- `recommend` is proposal-only and side-effect free
- `execution_preflight` is the only policy-acceptance boundary
- accepted policy lives in authoritative state plus structured policy-acceptance events
- exact replay of `execution_preflight` against the same approved plan revision, accepted policy snapshot, and authoritative baseline is idempotent
- materially different accepted inputs either create a legal new run or fail closed
- policy resets are legal only when no active contract is mid-execution and must mint a new `execution_run_id`

### 14. Operator integration

Recommended public mapping:

- `implementation_handoff`
- `execution_preflight`
- `contracting`
- `executing`
- `evaluating`
- `repairing`
- `pivot_required`
- `handoff_required`
- existing downstream `review_blocked`, `qa_pending`, `document_release_pending`, and `ready_for_branch_completion`

Operator rules:

- `next_action` distinguishes contract, evaluation, repair, pivot, handoff, and downstream freshness causes
- evaluator-driven states expose the relevant `evaluator_kind`
- write-authority conflict stays inside the current public phase and is surfaced via metadata and `write_authority_conflict`
- text and JSON operator surfaces agree on phase, next action, evaluator identity, and downstream freshness

### 15. Skill normalization

Generator modes:

- `featureforge:executing-plans`
- `featureforge:subagent-driven-development`

Inner-loop evaluator modes:

- `spec_compliance`
- `code_quality`

Downstream gate modes:

- `final_code_review`
- `browser_qa`

Skill rules:

- skills may emit candidate contracts, evaluations, and handoffs
- skills must not claim authoritative state transitions
- runtime commands are the only authoritative promotion boundary
- downstream review and QA stay downstream gates even when their outputs are normalized for provenance

### 16. Storage, authority, retention, and recovery

Artifacts remain local under the existing project-scoped artifact root. Exact filename suffixes may vary, but the contract is branch-scoped local storage under `~/.featureforge/projects/{repo_slug}/`.

Rules:

- same-branch worktrees share one authoritative state and artifact namespace
- active state may reference only authoritative artifacts
- candidate and authoritative artifacts must be distinguishable on disk and in parsers
- authoritative mutations commit atomically
- startup/preflight recovery detects and reconciles incomplete authoritative mutations before execution resumes
- retention is dependency-aware and bounded; active or still-dependent artifacts are never pruned

### 17. Failure-class taxonomy

Minimum machine-readable failure classes:

- `IllegalHarnessPhase`
- `StaleProvenance`
- `ContractMismatch`
- `EvaluationMismatch`
- `MissingRequiredHandoff`
- `NonHarnessProvenance`
- `BlockedOnPlanPivot`
- `ConcurrentWriterConflict`
- `UnsupportedArtifactVersion`
- `NonAuthoritativeArtifact`
- `IdempotencyConflict`
- `RepoStateDrift`
- `ArtifactIntegrityMismatch`
- `PartialAuthoritativeMutation`
- `AuthoritativeOrderingMismatch`
- `DependencyIndexMismatch`

These names are normative minimums for v1.

### 18. Cutover model

This harness is a hard cutover for active execution under `featureforge plan execution`.

- once enabled, `featureforge plan execution` reads and writes only harness-governed artifacts for active execution
- pre-harness execution evidence is not a supported continuation source
- status, operator routing, and downstream gates fail closed when required harness artifacts are missing, malformed, non-harness, or stale
- final review, browser QA, release docs, and finish readiness trust only harness provenance for the active execution path

### 19. Observability contract

Minimum structured event fields:

```text
event_kind
timestamp
execution_run_id
authoritative_sequence
source_plan_path
source_plan_revision
harness_phase
chunk_id
evaluator_kind
active_contract_fingerprint
evaluation_report_fingerprint
handoff_fingerprint
command_name
gate_name
failure_class
reason_codes[]
```

Minimum reason-code vocabulary:

- `waiting_on_required_evaluator`
- `required_evaluator_failed`
- `required_evaluator_blocked`
- `handoff_required`
- `repair_within_budget`
- `pivot_threshold_exceeded`
- `blocked_on_plan_revision`
- `write_authority_conflict`
- `repo_state_drift`
- `stale_provenance`
- `recovering_incomplete_authoritative_mutation`
- `missing_required_evidence`
- `invalid_evidence_satisfaction_rule`

Required observable event families include phase transitions, gate results, blocked-state entry/exit, writer-conflict and reclaim, accepted replay versus replay conflict, repo-state drift and reconciliation, integrity mismatch, partial-mutation recovery, downstream-gate rejection, recommendation proposal, and policy acceptance.

## Verification Strategy

Required automated coverage includes:

1. state transitions for pass, fail, repair, pivot, handoff, and multi-evaluator aggregation
2. artifact parsing and validation for contract, evaluation, handoff, and evidence artifacts
3. command legality and replay behavior
4. invalidation-cascade behavior for reopen, contract pivot, and plan pivot
5. operator/status routing behavior and downstream freshness exposure
6. hard-cutover rejection of legacy/non-harness continuation
7. repo-state drift behavior
8. observability contract behavior
9. single-writer and authority-boundary behavior
10. fixture-backed coverage for authoritative, candidate, stale, drifted, dependency-mismatch, and downstream-indexed states

The detailed task order belongs to the implementation plan, not this spec.

## Risks and Mitigations

- **Too much scaffolding for strong models.** Mitigation: keep evaluator and reset overhead policy-driven and removable.
- **Artifact overhead becomes noisy.** Mitigation: keep artifacts local, structured, append-only, and scoped to the smallest useful chunk.
- **Evaluator quality is too lenient or too noisy.** Mitigation: normalize outputs, use explicit criteria, and add exemplars/rubrics.
- **Runtime and skill prose diverge.** Mitigation: make the Rust state machine authoritative and gate illegal transitions fail closed.
- **Hard cutover lands before the harness covers every dependency.** Mitigation: complete contract/evaluator/handoff/downstream/cutover verification before enabling the harness path.
- **The harness fails closed but remains opaque.** Mitigation: require structured observability before considering the harness complete.
- **Controllers or subagents race authoritative state.** Mitigation: enforce single-writer authority and deterministic reclaim.
- **Same-branch worktrees silently fork authoritative truth.** Mitigation: keep state branch-scoped and worktree identity diagnostic only.
- **Replay duplicates authoritative mutations.** Mitigation: make `record-*` idempotent for identical replay and reject mismatched replay.
- **Out-of-band repo drift invalidates provenance.** Mitigation: capture repo-state provenance and fail closed until reconciliation or re-evaluation.
- **Authoritative artifacts are edited on disk after recording.** Mitigation: canonical fingerprints are re-verified on later authoritative reads.
- **Final review/finish truth becomes weaker after adding intermediate artifacts.** Mitigation: extend downstream gates rather than bypassing them.
- **Crash or torn write leaves half-published state.** Mitigation: atomic publication plus recovery detection before resume.
- **Reopen or pivot invalidates only part of the evidence chain.** Mitigation: make stale-provenance cascades deterministic and dependency-index-backed.
- **A passing report from one evaluator masks missing or failing required evaluators.** Mitigation: all-required deterministic aggregation.
- **Downstream review/QA is double-counted as chunk evaluation.** Mitigation: keep contract-level `verifiers[]` limited to inner-loop evaluator kinds.
- **`recommended_action` becomes a second control plane.** Mitigation: keep it advisory only.
- **Policy fields drift mid-run.** Mitigation: freeze the policy tuple per `execution_run_id`.
- **Dependency truth is inferred differently by different entry points.** Mitigation: maintain a runtime-owned dependency index and fail closed when it is unhealthy.

## Acceptance Criteria

The work is complete only when all of the following are true:

1. The current outer workflow still routes work to `implementation_ready` exactly as before.
2. `featureforge plan execution status --plan ...` exposes harness phase, current policy, active contract, aggregate evaluator state, and downstream freshness.
3. The runtime enforces legal macro-state transitions in Rust rather than relying on skill prose.
4. The runtime rejects step execution outside the active contract scope.
5. Contract approval is runtime-owned and impossible without successful `gate-contract` validation against matching plan/spec/task-packet provenance.
6. Evaluator results are normalized into a common report model with per-criterion findings tied to requirement IDs and steps.
7. Evaluation failure automatically drives repair, pivot, or handoff transitions according to runtime policy.
8. Handoff-required execution cannot resume without a valid authoritative handoff artifact.
9. `recommend` returns policy beyond just skill choice but does not mutate authoritative state.
10. `execution_preflight` is the only policy-acceptance boundary and is idempotent for exact replay.
11. Existing generator and evaluator skills operate through the normalized contract rather than as free-form execution law.
12. Final code review, browser QA, release docs, and finish readiness remain fail-closed and are aware of stale harness provenance.
13. Active execution under `featureforge plan execution` uses only harness-governed artifacts; pre-harness execution evidence is not a supported continuation path.
14. Harness commands and gates emit the stable minimum failure-class taxonomy rather than relying on free-form error text.
15. The runtime emits the minimum structured observability contract with stable run/chunk/phase/artifact identifiers.
16. Only one controller may mutate authoritative harness state for an active branch-scoped execution scope at a time.
17. Unknown or unsupported artifact versions are rejected fail closed.
18. Candidate artifacts are distinct from authoritative artifacts and cannot satisfy authoritative gates.
19. Identical authoritative replay is safe and side-effect free; mismatched replay fails closed.
20. Repo-state drift and artifact-integrity mismatch fail closed until reconciled.
21. Reopen, contract pivot, and plan pivot apply deterministic stale-provenance cascades.
22. Required evaluator kinds aggregate deterministically and fail closed.
23. Contract-level `verifiers[]` remain limited to inner-loop evaluator kinds; downstream gate modes do not participate in chunk pass aggregation.
24. Contract-declared evidence requirements are enforced fail closed under the stable `all_of | any_of | per_step` semantics.
25. Artifact-backed evidence resolves by canonical fingerprint, and repo-backed evidence resolves by authoritative repo-state provenance.
26. Dirty-worktree durable evidence is preserved as authoritative whole-file `EvidenceArtifact` content when reread is required.
27. The runtime-owned dependency index determines invalidation, pruning eligibility, and downstream gate truth.
28. Existing downstream review/QA/release-doc artifact shapes remain canonical in v1 and are fingerprint/index inputs rather than duplicated artifact families.
29. `execution_run_id` and `authoritative_sequence` obey the run-scoped ordering and rollover rules from this spec.
30. The workflow operator exposes harness-aware public phases and next actions that distinguish contracting, evaluating, repairing, pivot-required, and handoff-required states.

## ASCII Diagrams

### Control boundary

```text
repo-visible workflow
  brainstorming
    -> spec review
    -> plan writing
    -> plan review
    -> implementation_ready
                         |
                         v
local execution harness (Rust-owned)
  preflight
    -> contract
    -> execute
    -> evaluate
       -> repair
       -> pivot
       -> handoff
    -> final review
    -> QA
    -> release docs
    -> finish
```

### Provenance chain

```text
approved spec
   + approved plan
        -> task packet(s)
            -> execution contract
                -> execution evidence
                -> evaluation report(s)
                -> handoff (if needed)
                    -> final code review
                    -> QA result
                    -> release docs
                    -> finish gate
```

### Dependency truth and stale-cascade

```text
authoritative state
  -> active contract fingerprint
  -> active evaluation fingerprint(s)
  -> active handoff fingerprint
  -> indexed downstream fingerprints
  -> dependency index / reference graph
       |
       +--> execution artifacts
       +--> evidence artifacts
       +--> downstream review / QA / release-doc inputs
       +--> retention-protected stale artifacts

runtime event
  reopen | contract pivot | plan pivot | downstream refresh | prune check
       |
       v
dependency index is authoritative
  -> compute affected artifact set
  -> mark stale / superseded artifacts
  -> update downstream freshness states
  -> preserve still-dependent artifacts
  -> allow pruning only after no active dependency remains
```
