# FeatureForge Workflow Boundary Hardening Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 10
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/2026-03-27-featureforge-workflow-boundary-hardening-design.md`
**Source Spec Revision:** 3
**Last Reviewed By:** plan-eng-review

**Goal:** Move the remaining workflow boundary trust out of prose and into runtime-owned contracts so plan writing, plan review, worktree-backed execution, unit review, and final review all fail closed while still driving the fastest safe execution path.

**Architecture:** Land the work in three phases. First ship the serial foundation that hardens session entry, the dedicated independent-subagent plan-fidelity review that must pass before `plan-eng-review`, and the parallel-first plan contract. Next create one explicit seam-extraction slice that carves new focused execution modules and test shards out of the shared runtime hot spots, then execute three disjoint worktree lanes in parallel: lease and downgrade artifacts, topology recommendation plus execution-skill orchestration, and dedicated final-review modules plus reviewer docs. Finish with two serial integration slices: Task 8 wires the execution-state and reconcile lanes back through shared runtime glue, and Task 9 wires status, final-review freshness, and finish gating onto that authoritative state. Task 10 then ratifies fixtures, generated docs, and the release-facing regression gate.

**Tech Stack:** Rust CLI runtime (`clap`, `serde`, `schemars`), local markdown contract parsing, workflow/plan/spec contract gates, checked-in JSON schemas, Rust integration tests with `cargo nextest`, Node codex-runtime fixture and skill-doc tests, generated FeatureForge skill docs

## Plan Contract

This plan owns implementation order, task boundaries, and done criteria. It does not redefine the approved workflow contract. If the approved spec and this plan drift, the approved spec wins and this plan must be updated in the same change.

---

## Existing Capabilities / Built-ins to Reuse

- `src/cli/session_entry.rs`, `src/cli/workflow.rs`, and `schemas/session-entry-resolve.schema.json` already define the runtime-owned session-entry surface. Extend that contract instead of inventing a second first-entry gate.
- `src/contracts/plan.rs`, `src/contracts/runtime.rs`, `src/cli/plan_contract.rs`, and `tests/contracts_spec_plan.rs` already own spec/plan contract parsing and linting. Reuse those surfaces for plan-fidelity and parallel-first plan metadata.
- `src/contracts/harness.rs`, `src/execution/authority.rs`, `src/execution/harness.rs`, `src/execution/gates.rs`, `src/execution/state.rs`, and `src/execution/observability.rs` already own execution artifacts, runtime state, gate logic, and operator/status output. Extend them instead of creating a second execution-state system.
- `skills/using-git-worktrees`, `skills/dispatching-parallel-agents`, `skills/executing-plans`, `skills/subagent-driven-development`, and `skills/requesting-code-review` already exist and should be normalized to the new runtime law instead of replaced.
- `tests/using_featureforge_skill.rs`, `tests/contracts_execution_harness.rs`, `tests/contracts_spec_plan.rs`, `tests/plan_execution.rs`, `tests/runtime_instruction_contracts.rs`, `tests/workflow_runtime.rs`, and `tests/workflow_shell_smoke.rs` already pin the boundary surfaces this slice changes. This plan deliberately shards new execution work into additional focused test files so later worktree lanes do not all edit the same giant shared suites.
- `tests/codex-runtime/fixtures/plan-contract/*.md`, `tests/codex-runtime/skill-doc-contracts.test.mjs`, `tests/codex-runtime/skill-doc-generation.test.mjs`, `tests/codex-runtime/workflow-fixtures.test.mjs`, and `tests/codex-runtime/eval-observability.test.mjs` already give us repo-native fixture and doc-contract coverage for the parser and generated skill docs.

## Known Footguns / Constraints

- This slice assumes a fresh-start version boundary. Do not add migration, grandfathering, or upgrade logic for in-flight plans, execution runs, or stale artifacts from earlier versions.
- Once implementation starts, the approved plan artifact stays fixed. Runtime may downgrade execution topology for the current run, but it must not rewrite the approved plan mid-run.
- Runtime learning from execution-time topology downgrades is execution-owned in this slice. It informs matching reruns and review context, not later planning as a mandatory input.
- Downgrade matching is stable and machine-readable: reuse the closed repo-wide primary reason enum from the approved spec and keep structured detail payloads fail-closed.
- Reconciliation is identity-preserving. Do not introduce cherry-pick-style “good enough” integration that breaks review-to-ship identity.
- Persisted task packets from plan revision 1 become stale when this rewrite lands. Treat this revision as a packet-regeneration boundary.
- `src/execution/state.rs`, `src/workflow/status.rs`, `src/workflow/operator.rs`, `tests/plan_execution.rs`, `tests/workflow_runtime.rs`, and `tests/workflow_shell_smoke.rs` are the main merge-conflict hotspots. This rewrite reserves them for Task 4 seam extraction and the serial Task 8 / Task 9 integration seam only.
- Generated `SKILL.md` files must be refreshed in the same task that changes their `.tmpl` source.

## Cross-Task Invariants

- Use `featureforge:test-driven-development` before writing implementation code in each task.
- Before claiming a task is done or cutting a task commit, use `featureforge:verification-before-completion` and keep the targeted suites green.
- Runtime-owned receipts, leases, downgrade records, and final-review truth must remain the only authoritative state for routing and finish legality.
- Skill docs may describe the law, but runtime and tests remain the source of truth.
- Worktree cleanup stays runtime-owned during execution; `featureforge:finishing-a-development-branch` remains a backstop, not the primary cleanup mechanism.
- Fresh-start semantics apply throughout: no compatibility shims for pre-hardening state.
- After Task 4, Tasks 5, 6, and 7 run in separate worktrees and may not edit files reserved for Task 8 or Task 9 integration.
- Task 8 is the only task allowed to re-open the shared execution-state and reconcile glue files after Task 4.
- Task 9 is the only task allowed to re-open the status, final-review freshness, and finish-gate glue files after Task 4.

## Change Surface

- Session-entry and workflow routing: `src/cli/session_entry.rs`, `src/cli/workflow.rs`, `schemas/session-entry-resolve.schema.json`, `skills/using-featureforge/SKILL.md.tmpl`, `skills/using-featureforge/SKILL.md`
- Plan contract and review routing: `src/contracts/plan.rs`, `src/contracts/runtime.rs`, `src/cli/plan_contract.rs`, `src/workflow/status.rs`, `schemas/workflow-status.schema.json`, `skills/using-featureforge/*`, `skills/writing-plans/*`, `skills/plan-eng-review/*`
- New focused execution modules for parallel ownership: `src/execution/topology.rs`, `src/execution/leases.rs`, `src/execution/final_review.rs`, `src/execution/harness.rs`, `src/execution/observability.rs`
- Shared execution-state and reconcile glue reserved for serial Task 8 reintegration: `src/execution/authority.rs`, `src/execution/dependency_index.rs`, `src/execution/gates.rs`, `src/execution/mod.rs`, `src/execution/mutate.rs`, `src/execution/state.rs`, `src/execution/transitions.rs`
- Status, final-review freshness, and finish-gate glue reserved for serial Task 9 reintegration: `src/workflow/status.rs`, `src/workflow/operator.rs`, `schemas/plan-execution-status.schema.json`, `skills/finishing-a-development-branch/*`
- Execution-skill normalization: `skills/executing-plans/*`, `skills/subagent-driven-development/*`, `skills/using-git-worktrees/*`, `skills/dispatching-parallel-agents/*`, `skills/finishing-a-development-branch/*`
- Final-review path: `skills/requesting-code-review/*`, `src/execution/final_review.rs`
- Focused new test shards: `tests/workflow_entry_shell_smoke.rs`, `tests/runtime_instruction_plan_review_contracts.rs`, `tests/runtime_instruction_parallel_plan_contracts.rs`, `tests/runtime_instruction_execution_contracts.rs`, `tests/runtime_instruction_review_contracts.rs`, `tests/plan_execution_topology.rs`, `tests/contracts_execution_leases.rs`, `tests/plan_execution_final_review.rs`, `tests/workflow_runtime_final_review.rs`
- Existing shared regression suites and codex-runtime fixtures under `tests/`

## Preconditions

- Start from the approved spec at `docs/featureforge/specs/2026-03-27-featureforge-workflow-boundary-hardening-design.md` with `Spec Revision: 3`.
- Run commands from the repo root so schema writers, skill-doc generation, and fixture-relative tests resolve checked-in files correctly.
- Treat this rewrite as plan revision 10; regenerate any persisted task packets before execution.
- Keep task commits scoped to one vertical slice at a time. Do not mix foundation, parallel-lane, integration, and ratification work into one commit.
- Do not start a later task until the targeted tests for the current task are green.

## Execution Strategy

- Execute Tasks 1, 2, and 3 serially. They all revise the approved entry, review, and plan-contract foundation that later execution work depends on.
- Execute Task 4 serially after Task 3. It is the only upfront seam-extraction slice and establishes lane-isolation boundaries before parallel lanes.
- After Task 4, create three worktrees and run Tasks 5, 6, and 7 in parallel:
  - Task 5 owns lease and downgrade artifact contracts plus observability helpers.
  - Task 6 owns topology recommendation and execution-skill orchestration.
  - Task 7 owns dedicated final-review modules and reviewer docs.
- Keep Tasks 5, 6, and 7 off the shared glue reserved for the serial seam:
  - Task 8 owns `src/execution/authority.rs`, `src/execution/dependency_index.rs`, `src/execution/gates.rs`, `src/execution/mutate.rs`, `src/execution/state.rs`, `src/execution/transitions.rs`, and `tests/plan_execution.rs`.
  - Task 9 owns `src/workflow/status.rs`, `src/workflow/operator.rs`, `schemas/plan-execution-status.schema.json`, `skills/finishing-a-development-branch/*`, `tests/workflow_runtime.rs`, `tests/workflow_runtime_final_review.rs`, and `tests/workflow_shell_smoke.rs`.
- Execute Task 8 serially after Tasks 5, 6, and 7. It is the execution-state and reconcile reintegration point.
- Execute Task 9 serially after Task 8. It is the status, final-review freshness, and finish-gate reintegration point.
- Execute Task 10 last as the release-facing parity and regression gate.

## Evidence Expectations

- New runtime-owned state must be fingerprinted, machine-readable, and testable from checked-in fixtures or deterministic runtime artifacts.
- The seam-extraction task must leave behind compile-visible module and test boundaries that let Tasks 5, 6, and 7 run in separate worktrees with mostly disjoint write sets.
- Downgrade records must always carry the closed primary reason class plus the shared structured detail payload:
  - `trigger_summary`
  - `affected_units`
  - `blocking_evidence.summary`
  - `blocking_evidence.references`
  - `operator_impact.severity`
  - `operator_impact.changed_or_blocked_stage`
  - `operator_impact.expected_response`
- Final-review deviation handling must point back to the authoritative downgrade records rather than prose-only summaries.
- Task 8 and Task 9 integration evidence must prove the shared glue consumes the lane-owned modules rather than re-implementing them inside the hot files.

## Validation Strategy

- Each task ends with the narrow Rust and Node suites for the surfaces it changes.
- Regenerate checked-in `SKILL.md` files in the same task that changes `.tmpl` sources.
- Run `featureforge plan contract lint --spec docs/featureforge/specs/2026-03-27-featureforge-workflow-boundary-hardening-design.md --plan docs/featureforge/plans/2026-03-27-featureforge-workflow-boundary-hardening.md` before handing the revised plan back to engineering review.
- The final regression gate for this plan is:
  - `node scripts/gen-skill-docs.mjs --check`
  - `node --test tests/codex-runtime/*.test.mjs`
  - `cargo nextest run --test contracts_spec_plan --test contracts_execution_harness --test using_featureforge_skill --test workflow_entry_shell_smoke --test runtime_instruction_plan_review_contracts --test runtime_instruction_parallel_plan_contracts --test runtime_instruction_execution_contracts --test runtime_instruction_review_contracts --test plan_execution_topology --test contracts_execution_leases --test plan_execution_final_review --test workflow_runtime_final_review --test plan_execution --test workflow_runtime --test workflow_shell_smoke`

## Documentation Update Expectations

- Update touched skill templates and generated skill docs in the same task.
- Keep workflow/operator wording aligned with runtime-owned reason classes, receipt truth, downgrade records, and finish gating.
- Keep plan-contract fixtures aligned with the parser expectations introduced in Task 3.
- Keep execution-skill docs aligned with the lane ownership model: worktree-backed parallel lanes first, shared-glue reintegration second.
- Add inline ASCII diagram comments in the hardest reintegration files when the task changes complex runtime flows. At minimum, Task 8 should leave a local diagram in `src/execution/state.rs` or `src/execution/gates.rs` for barrier reconcile and receipt-gating flow, and Task 9 should leave a local diagram in `src/workflow/status.rs` or `src/workflow/operator.rs` for final-review freshness and finish-gate routing.

## Rollout Plan

- Land Tasks 1 through 4 on the main branch in order.
- After Task 4, use separate worktrees for Tasks 5, 6, and 7 so each lane can move independently without shared-file churn.
- Merge Tasks 5 and 6 back before Task 8, then merge Task 7 before Task 9 so the serial seam stays split between execution-state integration and finish-gate integration.
- Assume fresh-start rollout semantics; this slice does not carry migration or grandfathering logic.

## Rollback Plan

- Revert the latest task-scoped slice instead of weakening the contract tests.
- Roll back an individual parallel lane by reverting its dedicated worktree commits before the serial integration task that consumes it.
- If Task 8 destabilizes the execution-state or reconcile glue, revert the Task 8 integration commit rather than patching around it with ad hoc fallbacks.
- If Task 9 destabilizes status, final-review freshness, or finish routing, revert the Task 9 integration commit rather than reopening the execution-state seam.
- Revert schema and generated-skill drift through the matching source change, not by hand-editing generated files alone.

## Risks and Mitigations

- The seam-extraction task could become a stealth behavior change.
  - Keep Task 4 explicitly behavior-preserving and pinned by shared-suite parity before starting the parallel lanes.
- Parallel lanes can drift if they reopen shared glue files.
  - Reserve the hot files for Task 8 and Task 9 only and call out the exact ownership split in the task constraints.
- Final integration can still become a bottleneck.
  - Keep Tasks 5, 6, and 7 narrowly scoped to new modules and focused tests so Task 8 and Task 9 are wiring work, not fresh feature invention.
- Skill prose can drift away from runtime truth.
  - Refresh generated docs in the same task and keep the focused doc-contract suites green.

## Dependency Diagram

```text
Task 1  first-entry gate coverage and routing hardening
   |
   v
Task 2  plan-fidelity receipt and routing gate
   |
   v
Task 3  parallel-first plan contract and engineering-review enforcement
   |
   v
Task 4  seam extraction and test sharding for parallel lane ownership
   +--> Task 5  lease+downgrade artifact lane
   |
   +--> Task 6  topology+skills orchestration lane
   |
   +--> Task 7  final-review+reviewer docs lane

Task 5 --> Task 8  execution-state and reconcile glue integration
Task 6 --> Task 8
Task 7 --> Task 8
Task 8 --> Task 9  status, final-review freshness, and finish-gate integration
Task 9 --> Task 10 fixture/doc parity and full regression gate
```

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1
- REQ-003 -> Task 1
- REQ-004 -> Task 3
- REQ-005 -> Task 3
- REQ-006 -> Task 2, Task 3
- REQ-007 -> Task 2
- REQ-008 -> Task 3
- REQ-033 -> Task 3
- REQ-034 -> Task 3
- REQ-009 -> Task 6, Task 8
- REQ-010 -> Task 6, Task 8
- REQ-011 -> Task 6, Task 8
- REQ-012 -> Task 5
- REQ-013 -> Task 5
- REQ-014 -> Task 5, Task 8, Task 9
- REQ-015 -> Task 8
- REQ-016 -> Task 8
- REQ-017 -> Task 8
- REQ-018 -> Task 8
- REQ-019 -> Task 8
- REQ-020 -> Task 8
- REQ-021 -> Task 8
- REQ-022 -> Task 8
- REQ-023 -> Task 8, Task 9
- REQ-024 -> Task 7
- REQ-025 -> Task 7, Task 9
- REQ-026 -> Task 7
- REQ-027 -> Task 4, Task 5, Task 6, Task 7, Task 8, Task 9
- REQ-028 -> Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10
- REQ-029 -> Task 5, Task 6, Task 8
- REQ-030 -> Task 5, Task 6, Task 8
- REQ-031 -> Task 5
- REQ-032 -> Task 5
- DEC-001 -> Task 4, Task 10
- DEC-002 -> Task 2, Task 7, Task 8, Task 9
- DEC-003 -> Task 3
- DEC-004 -> Task 6, Task 8
- DEC-005 -> Task 8
- DEC-006 -> Task 7, Task 9
- DEC-007 -> Task 8, Task 9
- DEC-008 -> Task 5
- DEC-009 -> Task 8
- DEC-010 -> Task 8
- DEC-011 -> Task 6, Task 8
- DEC-012 -> Task 7
- DEC-013 -> Task 5, Task 6
- DEC-014 -> Task 5, Task 6
- DEC-015 -> Task 5
- DEC-016 -> Task 5
- DEC-017 -> Task 5, Task 10
- DEC-018 -> Task 3, Task 4
- VERIFY-001 -> Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10
- VERIFY-002 -> Task 10
- NONGOAL-001 -> Task 10
- NONGOAL-002 -> Task 7
- NONGOAL-003 -> Task 5, Task 10

## Task 1: Enforce the First-Entry Session Gate

**Spec Coverage:** REQ-001, REQ-002, REQ-003, VERIFY-001
**Task Outcome:** Fresh-session intents that would otherwise jump into spec review, plan review, or execution-preflight work are forced through `featureforge session-entry resolve --message-file <path>` first, while existing enabled, bypassed, and explicit-reentry behavior stays intact.
**Plan Constraints:**
- Keep first-question ownership in the session-entry helper/runtime path.
- Preserve existing enabled, bypassed, malformed, and explicit-reentry semantics.
- Refresh generated `skills/using-featureforge/SKILL.md` in the same slice as the template change.
**Open Questions:** none

**Files:**
- Modify: `src/cli/session_entry.rs`
- Modify: `src/cli/workflow.rs`
- Modify: `schemas/session-entry-resolve.schema.json`
- Modify: `skills/using-featureforge/SKILL.md.tmpl`
- Modify: `skills/using-featureforge/SKILL.md`
- Modify: `tests/using_featureforge_skill.rs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Create: `tests/workflow_entry_shell_smoke.rs`
- Test: `tests/using_featureforge_skill.rs`
- Test: `tests/runtime_instruction_contracts.rs`
- Test: `tests/workflow_entry_shell_smoke.rs`

- [x] **Step 1: Add red supported-entry tests in `tests/using_featureforge_skill.rs` and `tests/workflow_entry_shell_smoke.rs` for fresh-session spec-review, plan-review, and execution-preflight intents that must all return the bypass prompt first**
- [x] **Step 2: Add red doc-contract assertions in `tests/runtime_instruction_contracts.rs` that reject `skills/using-featureforge` wording which allows later helpers to become the first surfaced gate**
- [x] **Step 3: Tighten `src/cli/session_entry.rs` and `src/cli/workflow.rs` so downstream routing cannot outrun `featureforge session-entry resolve --message-file <path>`**
- [x] **Step 4: Update `skills/using-featureforge/SKILL.md.tmpl`, regenerate `skills/using-featureforge/SKILL.md`, and regenerate `schemas/session-entry-resolve.schema.json` from the current helper contract**
- [x] **Step 5: Run `cargo nextest run --test using_featureforge_skill --test runtime_instruction_contracts --test workflow_entry_shell_smoke` and `node scripts/gen-skill-docs.mjs --check`, then fix failures until the slice is green**
- [x] **Step 6: Commit the slice with `git commit -m "feat: harden first-entry session gate"`**
## Task 2: Add the Independent Plan-Fidelity Gate

**Spec Coverage:** REQ-006, REQ-007, DEC-002, VERIFY-001
**Task Outcome:** `writing-plans` no longer hands straight into `plan-eng-review`; instead, routing and runtime require a passing plan-fidelity receipt from a dedicated independent subagent reviewer tied to the exact approved spec revision and current plan revision, and that reviewer must explicitly verify both requirement coverage and the draft plan's current execution-topology claims before engineering review becomes reachable.
**Plan Constraints:**
- Do not weaken the existing approved-spec prerequisite for plan writing.
- Keep plan-fidelity receipts runtime-owned rather than header-only or prose-only.
- Require reviewer provenance strong enough to prove the receipt came from a fresh-context reviewer distinct from both `writing-plans` and `plan-eng-review`.
- Make the fidelity gate substantive: the reviewer must check the spec `Requirement Index` and the draft plan's execution-topology claims, not just emit a pass token.
- Keep `plan-eng-review` a terminal plan-review stage rather than a recursive review chain.
**Open Questions:** none

**Files:**
- Modify: `src/contracts/plan.rs`
- Modify: `src/contracts/runtime.rs`
- Modify: `src/cli/workflow.rs`
- Modify: `src/workflow/status.rs`
- Modify: `schemas/workflow-status.schema.json`
- Modify: `skills/using-featureforge/SKILL.md.tmpl`
- Modify: `skills/using-featureforge/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `tests/contracts_spec_plan.rs`
- Modify: `tests/workflow_runtime.rs`
- Create: `tests/runtime_instruction_plan_review_contracts.rs`
- Test: `tests/contracts_spec_plan.rs`
- Test: `tests/workflow_runtime.rs`
- Test: `tests/runtime_instruction_plan_review_contracts.rs`

- [x] **Step 1: Add red routing and contract tests for missing, stale, mismatched, or non-independent plan-fidelity receipts in `tests/contracts_spec_plan.rs`, `tests/workflow_runtime.rs`, and `tests/runtime_instruction_plan_review_contracts.rs`, including cases where the dedicated reviewer did not verify the spec `Requirement Index` or the draft plan's current execution-topology claims**
- [x] **Step 2: Add the runtime-owned plan-fidelity receipt model in `src/contracts/plan.rs` and `src/contracts/runtime.rs`, including exact spec/plan revision binding, reviewer provenance that proves the receipt came from the dedicated independent reviewer stage, and enough receipt/result structure to prove the reviewer checked requirement coverage plus topology fidelity**
- [x] **Step 3: Gate `plan-eng-review` routing and status in `src/cli/workflow.rs` and `src/workflow/status.rs` on the matching pass receipt from that dedicated independent reviewer stage**
- [x] **Step 4: Update `skills/using-featureforge/*` so draft-plan routing points to the dedicated independent subagent plan-fidelity review instead of directly to `plan-eng-review`; update `skills/writing-plans/*` so the workflow explicitly dispatches or resumes that reviewer and requires a substantive spec-to-plan fidelity check; update `skills/plan-eng-review/*` so engineering review refuses to start without that receipt; then regenerate the checked-in skill docs**
- [x] **Step 5: Regenerate `schemas/workflow-status.schema.json`, then run `cargo nextest run --test contracts_spec_plan --test workflow_runtime --test runtime_instruction_plan_review_contracts` plus `node scripts/gen-skill-docs.mjs --check`**
- [x] **Step 6: Commit the slice with `git commit -m "feat: gate plan review on fidelity receipts"`**
## Task 3: Make the Approved Plan Contract Parallel-First

**Spec Coverage:** REQ-004, REQ-005, REQ-008, REQ-033, REQ-034, DEC-003, DEC-018, VERIFY-001
**Task Outcome:** Approved plans become parseable parallel-first artifacts with dependency truth, write-scope truth, workspace expectations, fastest-safe topology, explicit serial-hazard reasoning, and concrete lane-ownership guidance; `writing-plans` teaches clean lane decomposition, the dedicated plan-fidelity reviewer can compare the plan's topology claims against the spec before `plan-eng-review`, and `plan-eng-review` rejects both “correct but serial-by-default” plans and fake-parallel plans that still collide on hotspot files without an explicit serial seam.
**Plan Constraints:**
- Keep the plan contract minimal and machine-checkable.
- Do not let serial execution remain an implicit fallback in approved plans.
- Require planners to describe concrete task/file ownership or an explicit serial seam around shared hotspot files.
- Make reviewer pressure tests fail closed when claimed parallel lanes still depend on unspecified reintegration or overlapping hotspot files.
- Keep `**Open Questions:** none` enforceable per task in engineering-approved plans.
**Open Questions:** none

**Files:**
- Modify: `src/contracts/plan.rs`
- Modify: `src/contracts/runtime.rs`
- Modify: `src/cli/plan_contract.rs`
- Modify: `schemas/plan-contract-analyze.schema.json`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `tests/contracts_spec_plan.rs`
- Create: `tests/runtime_instruction_parallel_plan_contracts.rs`
- Modify: `tests/codex-runtime/fixtures/plan-contract/valid-plan.md`
- Modify: `tests/codex-runtime/fixtures/plan-contract/overlapping-write-scopes-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/valid-serialized-plan.md`
- Create: `tests/codex-runtime/fixtures/plan-contract/fake-parallel-hotspot-plan.md`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/contracts_spec_plan.rs`
- Test: `tests/runtime_instruction_parallel_plan_contracts.rs`
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add red contract tests and fixture cases for missing dependency truth, missing write scope, missing workspace expectations, unjustified serial work, and plans that claim parallel lanes without either disjoint ownership or an explicit serial seam around hotspot files**
- [x] **Step 2: Extend `src/contracts/plan.rs`, `src/contracts/runtime.rs`, `src/cli/plan_contract.rs`, and `schemas/plan-contract-analyze.schema.json` to parse and lint the parallel-first fields plus the concrete lane-ownership and serial-seam requirements needed for review pressure tests**
- [x] **Step 3: Update `skills/writing-plans/*` so planners must describe clean lane decomposition, hotspot-file handling, and explicit reintegration seams; update `skills/plan-eng-review/*` so reviewers pressure-test claimed parallelism against the concrete task/file ownership model and fail plans that are only parallel on paper; then regenerate the checked-in skill docs**
- [x] **Step 4: Refresh the plan-contract fixtures in `tests/codex-runtime/fixtures/plan-contract/`, including one invalid fake-parallel hotspot example and the skill-doc contract test expectations**
- [x] **Step 5: Run `cargo nextest run --test contracts_spec_plan --test runtime_instruction_parallel_plan_contracts` and `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`, then fix failures until the slice is green**
- [x] **Step 6: Commit the slice with `git commit -m "feat: require parallel-first approved plans"`**
## Task 4: Prepare Parallel Lane Ownership

**Spec Coverage:** REQ-027, REQ-028, DEC-001, VERIFY-001
**Task Outcome:** Shared runtime hot spots are extracted into dedicated modules and focused test shards so later worktree lanes can land mostly disjoint changes, while the remaining shared glue is explicitly reserved for the serial Task 8 / Task 9 integration seam.
**Plan Constraints:**
- Keep this slice behavior-preserving except where extraction is required to preserve compile/test parity.
- After this task, reserve `src/execution/authority.rs`, `src/execution/dependency_index.rs`, `src/execution/gates.rs`, `src/execution/mutate.rs`, `src/execution/state.rs`, `src/execution/transitions.rs`, and `tests/plan_execution.rs` for Task 8 only.
- After this task, reserve `src/workflow/status.rs`, `src/workflow/operator.rs`, `schemas/plan-execution-status.schema.json`, `skills/finishing-a-development-branch/*`, `tests/workflow_runtime.rs`, `tests/workflow_runtime_final_review.rs`, and `tests/workflow_shell_smoke.rs` for Task 9 only.
- Create compile-visible module homes for topology, lease+downgrade, and final-review work before starting parallel worktrees.
**Open Questions:** none

**Files:**
- Create: `src/execution/topology.rs`
- Create: `src/execution/leases.rs`
- Create: `src/execution/final_review.rs`
- Modify: `src/execution/mod.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/workflow/status.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Create: `tests/plan_execution_topology.rs`
- Create: `tests/contracts_execution_leases.rs`
- Create: `tests/plan_execution_final_review.rs`
- Create: `tests/workflow_runtime_final_review.rs`
- Create: `tests/runtime_instruction_execution_contracts.rs`
- Create: `tests/runtime_instruction_review_contracts.rs`
- Test: `tests/plan_execution.rs`
- Test: `tests/workflow_runtime.rs`
- Test: `tests/workflow_shell_smoke.rs`
- Test: `tests/plan_execution_topology.rs`
- Test: `tests/contracts_execution_leases.rs`
- Test: `tests/plan_execution_final_review.rs`
- Test: `tests/workflow_runtime_final_review.rs`

- [x] **Step 1: Extract shared helpers and placeholder state structures out of `src/execution/state.rs`, `src/workflow/status.rs`, and `src/workflow/operator.rs` into the new focused execution modules without changing approval behavior yet**
- [x] **Step 2: Shard the shared regression suites by moving topology, lease-contract, and final-review-specific cases into the new focused test files while keeping the old shared suites compiling**
- [x] **Step 3: Wire `src/execution/mod.rs` to expose the new module boundaries and prove the repo still builds with the shared glue reserved for a later integration task**
- [x] **Step 4: Run `cargo nextest run --test plan_execution --test workflow_runtime --test workflow_shell_smoke --test plan_execution_topology --test contracts_execution_leases --test plan_execution_final_review --test workflow_runtime_final_review`, then fix parity regressions until the extraction slice is green**
- [x] **Step 5: Confirm Tasks 5, 6, and 7 now have disjoint write sets and create separate worktrees for those lanes**
- [x] **Step 6: Commit the slice with `git commit -m "refactor: prepare parallel ownership seams"`**
## Task 5: Lane A - Implement Worktree Lease and Downgrade Artifact Modules

**Spec Coverage:** REQ-012, REQ-013, REQ-014, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, DEC-008, DEC-013, DEC-014, DEC-015, DEC-016, DEC-017, VERIFY-001, NONGOAL-003
**Task Outcome:** Runtime has focused, authoritative lease and downgrade artifact modules with closed reason classes, shared structured detail payloads, rerun-guidance rules, and observability helpers, ready for Task 8 to wire into shared execution state.
**Plan Constraints:**
- This lane owns `src/contracts/harness.rs`, `src/contracts/mod.rs`, `src/execution/leases.rs`, and `src/execution/observability.rs`.
- Do not edit files reserved for Task 8 integration.
- Keep rerun matching keyed on the closed primary reason class only; detail stays diagnostic.
**Open Questions:** none

**Files:**
- Modify: `src/contracts/harness.rs`
- Modify: `src/contracts/mod.rs`
- Modify: `src/execution/leases.rs`
- Modify: `src/execution/observability.rs`
- Modify: `tests/contracts_execution_harness.rs`
- Modify: `tests/contracts_execution_leases.rs`
- Test: `tests/contracts_execution_harness.rs`
- Test: `tests/contracts_execution_leases.rs`

- [x] **Step 1: Add red contract tests in `tests/contracts_execution_harness.rs` and `tests/contracts_execution_leases.rs` for lease lifecycle states, downgrade reason classes, structured detail validation, and rerun-guidance persistence**
- [x] **Step 2: Extend `src/contracts/harness.rs` and `src/contracts/mod.rs` with `WorktreeLease`, downgrade-record, reason-class, and structured-detail contracts**
- [x] **Step 3: Implement focused lease and downgrade helpers in `src/execution/leases.rs` and `src/execution/observability.rs` without reopening shared runtime glue**
- [x] **Step 4: Run `cargo nextest run --test contracts_execution_harness --test contracts_execution_leases`, then fix failures until the lane is green**
- [x] **Step 5: Commit the lane in its dedicated worktree with `git commit -m "feat: add lease and downgrade artifact modules"`**
## Task 6: Lane B - Implement Topology Recommendation and Execution Skill Orchestration

**Spec Coverage:** REQ-009, REQ-010, REQ-011, REQ-027, REQ-028, REQ-029, REQ-030, DEC-004, DEC-011, DEC-013, DEC-014, VERIFY-001
**Task Outcome:** Topology recommendation, isolated-worktree preference, downgrade-aware recommendation inputs, and execution-skill docs all line up in focused modules and tests without reopening the shared runtime glue, ready for Task 8 execution-state integration.
**Plan Constraints:**
- This lane owns `src/cli/plan_execution.rs`, `src/execution/harness.rs`, `src/execution/topology.rs`, and the execution-skill docs.
- Do not edit files reserved for Task 8 integration.
- Keep recommendation and skill-doc work aligned to the same lane-owned topology vocabulary.
**Open Questions:** none

**Files:**
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/execution/harness.rs`
- Modify: `src/execution/topology.rs`
- Modify: `skills/dispatching-parallel-agents/SKILL.md.tmpl`
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/using-git-worktrees/SKILL.md.tmpl`
- Modify: `skills/using-git-worktrees/SKILL.md`
- Modify: `tests/plan_execution_topology.rs`
- Modify: `tests/runtime_instruction_execution_contracts.rs`
- Test: `tests/plan_execution_topology.rs`
- Test: `tests/runtime_instruction_execution_contracts.rs`

- [x] **Step 1: Add red topology and execution-doc tests in `tests/plan_execution_topology.rs` and `tests/runtime_instruction_execution_contracts.rs` for worktree-backed parallel recommendation, conservative fallback, and downgrade-history reuse**
- [x] **Step 2: Implement topology selection and recommendation helpers in `src/execution/topology.rs`, `src/execution/harness.rs`, and `src/cli/plan_execution.rs`**
- [x] **Step 3: Update the execution-facing skill templates so they follow the runtime-selected topology and worktree-first orchestration model, then regenerate the checked-in skill docs**
- [x] **Step 4: Run `cargo nextest run --test plan_execution_topology --test runtime_instruction_execution_contracts` and `node scripts/gen-skill-docs.mjs --check`, then fix failures until the lane is green**
- [x] **Step 5: Commit the lane in its dedicated worktree with `git commit -m "feat: add topology recommendation lane"`**
## Task 7: Lane C - Implement Dedicated Final-Review Modules and Reviewer Docs

**Spec Coverage:** REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, DEC-002, DEC-006, DEC-012, VERIFY-001, NONGOAL-002
**Task Outcome:** Dedicated final-review receipt helpers, reviewer-doc rules, and focused final-review tests exist in lane-owned files, ready for Task 9 to wire into shared finish routing.
**Plan Constraints:**
- This lane owns `src/execution/final_review.rs` and `skills/requesting-code-review/*`.
- Do not edit `skills/finishing-a-development-branch/*` or files reserved for Task 8 integration.
- Keep final whole-diff review independent and non-recursive.
**Open Questions:** none

**Files:**
- Modify: `src/execution/final_review.rs`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/requesting-code-review/code-reviewer.md`
- Modify: `tests/plan_execution_final_review.rs`
- Modify: `tests/workflow_runtime_final_review.rs`
- Modify: `tests/runtime_instruction_review_contracts.rs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/plan_execution_final_review.rs`
- Test: `tests/workflow_runtime_final_review.rs`
- Test: `tests/runtime_instruction_review_contracts.rs`
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add red runtime and doc-contract tests for dedicated final-review receipts, stale-review rejection, and deviation-aware final pass requirements**
- [x] **Step 2: Implement dedicated-review receipt helpers and deviation-binding logic in `src/execution/final_review.rs`**
- [x] **Step 3: Update `skills/requesting-code-review/*` so the reviewer path is always dedicated and deviation-aware when runtime recorded topology downgrades, then regenerate the checked-in skill docs**
- [x] **Step 4: Run `cargo nextest run --test plan_execution_final_review --test workflow_runtime_final_review --test runtime_instruction_review_contracts`, `node scripts/gen-skill-docs.mjs --check`, and `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`, then fix failures until the lane is green**
- [x] **Step 5: Commit the lane in its dedicated worktree with `git commit -m "feat: add dedicated final-review lane"`**
## Task 8: Integrate Shared Runtime Execution-State and Reconcile Glue

**Spec Coverage:** REQ-009, REQ-010, REQ-011, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-027, REQ-028, REQ-029, REQ-030, DEC-002, DEC-004, DEC-005, DEC-007, DEC-009, DEC-010, DEC-011, VERIFY-001
**Task Outcome:** The shared execution-state and reconcile glue consumes the Task 5 and Task 6 lane-owned modules to enforce independent unit-review receipts, identity-preserving reconcile, barrier cleanup, and dependency release end to end before any finish-routing work begins.
**Plan Constraints:**
- Task 8 is the only task allowed to edit the shared execution-state and reconcile glue files after Task 4.
- Treat Tasks 5 and 6 as imported module owners; do not re-implement their logic inline in the hot files.
- Do not reopen `src/workflow/status.rs`, `src/workflow/operator.rs`, `schemas/plan-execution-status.schema.json`, `skills/finishing-a-development-branch/*`, `tests/workflow_runtime.rs`, or `tests/workflow_shell_smoke.rs`; those belong to Task 9.
- Leave an inline ASCII diagram comment in `src/execution/state.rs` or `src/execution/gates.rs` showing the barrier reconcile and unit-receipt release flow after this task lands.
**Open Questions:** none

**Files:**
- Modify: `src/execution/authority.rs`
- Modify: `src/execution/dependency_index.rs`
- Modify: `src/execution/gates.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/execution/transitions.rs`
- Modify: `tests/plan_execution.rs`
- Test: `tests/plan_execution.rs`

- [x] **Step 1: Merge the Task 5 and Task 6 lane branches back into the active branch and add red execution-state tests in `tests/plan_execution.rs` for barrier reconcile, stale receipt invalidation, dependency release, and identity-preserving checkpoint integration**
- [x] **Step 2: Wire `src/execution/authority.rs`, `src/execution/dependency_index.rs`, `src/execution/gates.rs`, `src/execution/mutate.rs`, `src/execution/state.rs`, and `src/execution/transitions.rs` to the lane-owned modules instead of re-embedding their logic, and add the promised inline ASCII diagram comment in `src/execution/state.rs` or `src/execution/gates.rs` for the barrier reconcile and receipt-gating flow**
- [x] **Step 3: Run `cargo nextest run --test plan_execution`, then fix execution-state integration failures until the slice is green**
- [x] **Step 4: Commit the slice with `git commit -m "feat: integrate execution-state hardening lanes"`**
## Task 9: Integrate Status, Final-Review Freshness, and Finish Gating

**Spec Coverage:** REQ-014, REQ-023, REQ-025, REQ-027, REQ-028, DEC-002, DEC-006, DEC-007, VERIFY-001
**Task Outcome:** Status/operator output, final-review freshness, shell-smoke handoff, and branch-completion gating all consume the authoritative runtime truth from Task 8 and the dedicated final-review lane from Task 7.
**Plan Constraints:**
- Task 9 is the only task allowed to edit the status, operator, final-review freshness, and finish-gate glue files after Task 4.
- Treat Task 7 as the imported final-review owner and Task 8 as the imported execution-state owner; do not reopen Task 8-owned execution-state files here.
- Keep `skills/finishing-a-development-branch/*` aligned to runtime-owned finish-gate truth, not manual cleanup conventions.
- Leave an inline ASCII diagram comment in `src/workflow/status.rs` or `src/workflow/operator.rs` showing final-review freshness and finish-gate routing after this task lands.
**Open Questions:** none

**Files:**
- Modify: `src/workflow/status.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `schemas/plan-execution-status.schema.json`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/workflow_runtime_final_review.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Test: `tests/workflow_runtime.rs`
- Test: `tests/workflow_runtime_final_review.rs`
- Test: `tests/workflow_shell_smoke.rs`

- [x] **Step 1: Merge the Task 7 lane branch after Task 8 is green and add red workflow/status tests in `tests/workflow_runtime.rs`, `tests/workflow_runtime_final_review.rs`, and `tests/workflow_shell_smoke.rs` for dedicated final-review routing, freshness rejection, finish gating, and authoritative status/operator exposure**
- [x] **Step 2: Update `src/workflow/status.rs`, `src/workflow/operator.rs`, `schemas/plan-execution-status.schema.json`, and `skills/finishing-a-development-branch/*` so status, handoff, and finish gating trust the new runtime truth, and add the promised inline ASCII diagram comment in `src/workflow/status.rs` or `src/workflow/operator.rs` for final-review freshness and finish-gate routing**
- [x] **Step 3: Regenerate `schemas/plan-execution-status.schema.json` from the updated runtime contract instead of hand-editing the generated schema**
- [x] **Step 4: Run `cargo nextest run --test workflow_runtime --test workflow_runtime_final_review --test workflow_shell_smoke` and `node scripts/gen-skill-docs.mjs --check`, then fix finish-routing integration failures until the slice is green**
- [x] **Step 5: Commit the slice with `git commit -m "feat: integrate finish-gate hardening lane"`**
## Task 10: Ratify Fixtures, Docs, and the Full Regression Gate

**Spec Coverage:** VERIFY-001, VERIFY-002, DEC-001, DEC-017, NONGOAL-001, NONGOAL-003
**Task Outcome:** The full hardening slice is ratified as one coherent delivery: remaining fixtures, generated docs, and release-facing test commands all reflect the approved workflow contract, and the full regression gate is green from the repo root.
**Plan Constraints:**
- Do not broaden the slice beyond the approved spec.
- Keep the fresh-start assumption explicit; do not add migration fixtures or compatibility shims here.
- Use this task only to close parity gaps left by the earlier serial and parallel slices.
**Open Questions:** none

**Files:**
- Modify: `tests/codex-runtime/eval-observability.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Modify: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Modify: `tests/codex-runtime/fixtures/plan-contract/valid-plan.md`
- Modify: `tests/codex-runtime/fixtures/plan-contract/valid-serialized-plan.md`
- Test: `tests/codex-runtime/eval-observability.test.mjs`
- Test: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `tests/codex-runtime/workflow-fixtures.test.mjs`

- [x] **Step 1: Refresh any remaining codex-runtime fixtures and doc-generation expectations that still reflect pre-hardening workflow behavior**
- [x] **Step 2: Run `node scripts/gen-skill-docs.mjs --check` and `node --test tests/codex-runtime/*.test.mjs`, then fix remaining fixture or doc-contract failures**
- [x] **Step 3: Run `cargo nextest run --test contracts_spec_plan --test contracts_execution_harness --test using_featureforge_skill --test workflow_entry_shell_smoke --test runtime_instruction_plan_review_contracts --test runtime_instruction_parallel_plan_contracts --test runtime_instruction_execution_contracts --test runtime_instruction_review_contracts --test plan_execution_topology --test contracts_execution_leases --test plan_execution_final_review --test workflow_runtime_final_review --test plan_execution --test workflow_runtime --test workflow_shell_smoke` and fix any remaining Rust regressions**
- [x] **Step 4: Commit the slice with `git commit -m "test: ratify workflow boundary hardening regression gate"`**
## NOT in Scope

- Migration or grandfathering logic for in-flight plans, stale task packets, or older execution runs is excluded because this slice keeps the approved fresh-start boundary.
- Browser-visible UI, browser QA routing, or Playwright coverage is excluded because the change surface remains CLI/runtime and generated-skill-doc only.
- A new execution service, background worker, or second authoritative state store is excluded because the approved spec requires runtime-owned local contracts layered onto the existing Rust surfaces.
- Reopening or mutating the approved plan during implementation is excluded because execution-time topology adaptation is runtime-owned, not planning-owned.

## What Already Exists

- `src/cli/session_entry.rs`, `src/cli/workflow.rs`, and `schemas/session-entry-resolve.schema.json` already own the first-entry routing contract, so Tasks 1 through 3 extend those paths instead of adding a parallel bootstrap.
- `src/contracts/plan.rs`, `src/contracts/runtime.rs`, and `src/cli/plan_contract.rs` already parse and validate spec/plan law, so the planning and review hardening stays additive to the current contract surface.
- `src/execution/authority.rs`, `src/execution/harness.rs`, `src/execution/gates.rs`, `src/execution/state.rs`, and `src/workflow/status.rs` already own the runtime state and operator routing this slice hardens, so the plan reuses those hot paths instead of creating a second execution engine.
- Existing skill families for worktrees, parallel dispatch, execution, and code review already exist under `skills/*`, so the plan normalizes them to runtime truth instead of introducing replacement workflows.
- Existing Rust and Node contract suites already pin the main boundaries, so the plan mostly shards focused tests out of shared suites rather than inventing a separate test harness.

## Failure Modes

- A draft plan reaches `plan-eng-review` without a passing independent plan-fidelity receipt. Covered by Tasks 2 and 3 contract tests; error handling is explicit fail-closed routing, and the user sees a blocked workflow state rather than silent advancement.
- A supposedly parallel slice turns out to have overlapping write scope or a bad dependency edge. Covered by Tasks 4, 6, and 8 topology and execution-state tests; error handling is runtime downgrade plus recorded reason/detail, and the operator sees the degraded execution posture explicitly.
- A reviewed unit cannot reconcile back onto the active branch without breaking identity-preserving merge rules. Covered by Task 8 execution-state tests; error handling is hard block plus required re-review, and the operator sees a reason-coded reconcile failure instead of silent rewrite.
- A temporary worktree is not reconciled and cleaned up at the first safe barrier. Covered by Tasks 5 and 8 lease/gate tests; error handling is runtime-owned lease tracking with finish blocking, and the user sees an explicit cleanup/block condition.
- Final review becomes stale after later work lands or after a runtime topology downgrade. Covered by Tasks 7 and 9 final-review freshness tests; error handling is fail-closed final gating, and the user sees a stale-review block instead of false readiness.
- Skill-doc or finish-skill prose drifts away from runtime-owned finish truth. Covered by Tasks 7, 9, and 10 doc-contract and generated-doc checks; failures stay loud and contract-visible rather than silently misleading operators.

## TODOS.md Review

- No new deferred work was strong enough to justify a separate `TODOS.md` entry; the review findings all tightened the approved execution plan directly.

## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-27T15:29:18Z
**Review Mode:** big_change
**Reviewed Plan Revision:** 10
**Critical Gaps:** 0
**Browser QA Required:** no
**Test Plan Artifact:** `/Users/dmulcahey/.featureforge/projects/dmulcahey-superpowers/dmulcahey-dm-todos-8379a7a81017-test-plan-20260327-112311.md`
**Outside Voice:** fresh-context-subagent
