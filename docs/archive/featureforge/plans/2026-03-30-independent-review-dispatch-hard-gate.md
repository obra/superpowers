# Independent Review Dispatch Hard Gate Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/2026-03-30-independent-review-dispatch-hard-gate-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Enforce explicit task-boundary `gate-review` dispatch as a hard runtime gate before next-task begin, with deterministic reason-code/operator parity and contract-pinned skill guidance.

**Architecture:** Keep dispatch truth runtime-owned by reusing existing strategy-checkpoint/task-dispatch-credit evidence; add begin-time dispatch gating that remains fail-closed, then align operator surfaces and skill contracts to the same canonical command-based boundary. Preserve existing review provenance, verification-before-completion, cycle-break handling, and final review/finish gates through targeted regression coverage.

**Tech Stack:** Rust runtime (`src/execution/*`, `src/workflow/*`), generated skill templates/docs, Rust workflow contract tests, Node skill-doc generation checks.

---

## Existing Capabilities / Built-ins to Reuse

- Existing begin-time task-boundary closure checks in `src/execution/state.rs`.
- Existing authoritative review dispatch checkpointing in `src/execution/transitions.rs`.
- Existing operator phase + next-step routing in `src/workflow/operator.rs`.
- Existing execution skill templates and generated docs (`skills/executing-plans`, `skills/subagent-driven-development`).
- Existing contract suites (`tests/plan_execution.rs`, `tests/workflow_runtime.rs`, `tests/runtime_instruction_contracts.rs`).

## Known Footguns / Constraints

- Do not create a parallel dispatch artifact surface; reuse authoritative runtime strategy-checkpoint lineage.
- Do not weaken fail-closed behavior with compatibility bypass flags or one-shot overrides.
- Do not drift wording between skill templates and generated docs; regenerate and contract-test in the same slice.
- Keep task-boundary dispatch reason-code parity across begin/status/phase/handoff/doctor surfaces.

## Requirement Coverage Matrix

- REQ-001 -> Task 1, Task 6
- REQ-002 -> Task 1, Task 4, Task 6
- REQ-003 -> Task 1, Task 2, Task 4, Task 6
- REQ-004 -> Task 1, Task 4, Task 6
- REQ-005 -> Task 1, Task 4, Task 6
- REQ-006 -> Task 1, Task 4, Task 6
- REQ-007 -> Task 3, Task 6
- REQ-008 -> Task 5, Task 6
- REQ-009 -> Task 2, Task 4, Task 6
- REQ-010 -> Task 4, Task 6
- REQ-011 -> Task 4, Task 6
- REQ-012 -> Task 4, Task 6
- REQ-013 -> Task 4, Task 6
- REQ-014 -> Task 1, Task 4, Task 6
- REQ-015 -> Task 1, Task 4, Task 6

## Execution Strategy

- Execute Task 1 serially. It hardens the runtime dispatch gate boundary before any downstream operator or contract surfaces consume new reason-code behavior.
- Execute Task 2 serially after Task 1. Operator and status guidance must mirror the exact runtime reason-code and remediation command behavior from Task 1.
- Execute Task 3 serially after Task 2. Execution skill templates must match the operator command contract before downstream contract assertions pin wording.
- Execute Task 4 serially after Task 3. Regression suites validate preserved execution gates against the integrated runtime and guidance changes from Tasks 1 through 3.
- Execute Task 5 serially after Task 4. Instruction-contract assertions should pin template and generated command wording only after runtime/operator semantics stabilize.
- Execute Task 6 serially after Task 5. Final verification is the ratification seam and must run after all prior slices land in one lane.

## Dependency Diagram

```text
Task 1 -> Task 2
Task 2 -> Task 3
Task 3 -> Task 4
Task 4 -> Task 5
Task 5 -> Task 6
```

## Task 1: Enforce Explicit `gate-review` Dispatch Proof in Begin Gate

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-014, REQ-015
**Task Outcome:** Next-task `begin` fails closed unless authoritative dispatch proof minted by explicit `gate-review` dispatch exists and matches latest prior-task completion lineage.
**Plan Constraints:**
- Reuse existing runtime strategy-checkpoint + dispatch-credit truth; do not create new artifact families.
- Keep fail-closed legacy behavior; do not add bypass flags/override markers.
**Open Questions:** none

**Files:**
- Modify: `src/execution/state.rs`
- Modify: `src/execution/transitions.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `tests/plan_execution.rs`

- [x] **Step 1: Add failing runtime tests for missing/stale dispatch-proof begin gating and no-bypass legacy behavior**
Run: `cargo test --test plan_execution task_boundary_begin_reports_task_cycle_break_active -- --nocapture`
Expected: Existing test coverage baseline for task-boundary begin gating is visible before new assertions.

- [x] **Step 2: Implement begin-time dispatch-proof checks using existing authoritative dispatch-checkpoint lineage**
Run: `cargo test --test plan_execution task_boundary_begin_reports_task_cycle_break_active -- --nocapture`
Expected: Existing begin-gate behavior still passes after introducing dispatch-proof checks.

- [x] **Step 3: Add deterministic missing/stale reason-code emissions and explicit `gate-review` remediation guidance**
Run: `cargo test --test plan_execution -- --nocapture`
Expected: Updated task-boundary begin-gate cases pass with `ExecutionStateNotReady` and exact reason codes `prior_task_review_dispatch_missing` / `prior_task_review_dispatch_stale`.

- [x] **Step 4: Ensure reopen/re-complete invalidates stale dispatch proof and re-requires explicit dispatch**
Run: `cargo test --test plan_execution gate_review_dispatch -- --nocapture`
Expected: Dispatch lineage invalidation and fresh-dispatch requirements are enforced.

- [x] **Step 5: Commit Task 1 changes**
```bash
git add src/execution/state.rs src/execution/transitions.rs src/execution/mutate.rs tests/plan_execution.rs
git commit -m "feat: enforce explicit gate-review dispatch proof at task boundaries"
```

## Task 2: Wire Exact Command Guidance Across Operator Surfaces

**Spec Coverage:** REQ-003, REQ-009
**Task Outcome:** Status/operator/handoff/doctor surfaces include deterministic missing/stale reason codes and exact runnable `gate-review` next-step command.
**Plan Constraints:**
- Keep wording stable and command-exact for downstream contract tests.
- Preserve existing phase routing semantics (`repairing` vs `executing` vs `final_review_pending`).
**Open Questions:** none

**Files:**
- Modify: `src/workflow/operator.rs`
- Modify: `src/workflow/status.rs`
- Test: `tests/workflow_runtime.rs`
- Test: `tests/workflow_shell_smoke.rs`

- [x] **Step 1: Add/extend failing tests for exact command guidance and reason-code parity across surfaces**
Run: `cargo test --test workflow_runtime workflow_phase_routes_task_boundary_blocked -- --nocapture`
Expected: Fails until updated next-step command and reason-code parity is implemented.

- [x] **Step 2: Update operator/status guidance to emit exact runnable `gate-review` command on dispatch-gate blocks**
Run: `cargo test --test workflow_runtime workflow_phase_routes_task_boundary_blocked -- --nocapture`
Expected: Updated workflow phase/handoff guidance passes for blocked task-boundary cases.

- [x] **Step 3: Validate shell-smoke parity for command text stability**
Run: `cargo test --test workflow_shell_smoke -- --nocapture`
Expected: Shell-smoke fixtures pass with updated command guidance.

- [x] **Step 4: Commit Task 2 changes**
```bash
git add src/workflow/operator.rs src/workflow/status.rs tests/workflow_runtime.rs tests/workflow_shell_smoke.rs
git commit -m "feat: expose exact gate-review next-step command for dispatch gates"
```

## Task 3: Update Execution Skill Templates with Explicit Dispatch Hard Gate

**Spec Coverage:** REQ-007
**Task Outcome:** Execution skill templates require explicit `featureforge plan execution gate-review --plan <approved-plan-path>` dispatch before any next-task begin.
**Plan Constraints:**
- Edit `.tmpl` sources only; regenerate checked-in `SKILL.md` outputs.
- Keep command wording exactly aligned with runtime/operator guidance.
**Open Questions:** none

**Files:**
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`

- [x] **Step 1: Add explicit stop-and-dispatch command sequencing to both templates**
Run: `rg -n "gate-review --plan <approved-plan-path>|only then begin Task" skills/executing-plans/SKILL.md.tmpl skills/subagent-driven-development/SKILL.md.tmpl`
Expected: Both templates contain explicit required command call before next-task begin.

- [x] **Step 2: Regenerate skill docs from templates**
Run: `node scripts/gen-skill-docs.mjs`
Expected: Generated `SKILL.md` files updated with no template drift errors.

- [x] **Step 3: Commit Task 3 changes**
```bash
git add skills/executing-plans/SKILL.md.tmpl skills/subagent-driven-development/SKILL.md.tmpl skills/executing-plans/SKILL.md skills/subagent-driven-development/SKILL.md
git commit -m "docs: require explicit gate-review dispatch command at task boundaries"
```

## Task 4: Add Runtime Contract Coverage for Dispatch-Gate Semantics and Preservation Invariants

**Spec Coverage:** REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015
**Task Outcome:** Runtime tests pin missing/stale dispatch-gate behavior, exact command guidance parity, and non-regression of provenance/verification/cycle-break/final-review/finish gates.
**Plan Constraints:**
- Preserve existing gate behavior while adding dispatch-specific assertions.
- Keep legacy behavior fail-closed without introducing bypass paths.
**Open Questions:** none

**Files:**
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/workflow_runtime_final_review.rs`

- [x] **Step 1: Add failing tests for missing vs stale dispatch reason-code split and explicit command remediation**
Run: `cargo test --test plan_execution task_boundary -- --nocapture`
Expected: New cases fail before implementation alignment, including exact failure class `ExecutionStateNotReady` and exact reason-code assertions for missing/stale dispatch gating.

- [x] **Step 2: Add preservation tests for review provenance, verification gate, cycle-break, and final-review/finish behavior**
Run: `cargo test --test workflow_runtime_final_review -- --nocapture`
Expected: Non-regression gates remain enforced with new dispatch gate semantics.

- [x] **Step 3: Add negative dispatch-proof tests proving non-`gate-review` workflow commands cannot satisfy REQ-006**
Run: `cargo test --test plan_execution gate_review_dispatch -- --nocapture`
Expected: Non-`gate-review` command paths do not mint equivalent post-completion dispatch proof; only explicit `featureforge plan execution gate-review --plan <approved-plan-path>` satisfies the dispatch gate.

- [x] **Step 4: Add no-bypass legacy coverage (no compatibility override allowed)**
Run: `cargo test --test plan_execution legacy -- --nocapture`
Expected: Legacy-in-flight paths fail closed without bypass.

- [x] **Step 5: Commit Task 4 changes**
```bash
git add tests/plan_execution.rs tests/workflow_runtime.rs tests/workflow_runtime_final_review.rs
git commit -m "test: pin explicit dispatch-gate behavior and preserved execution gates"
```

## Task 5: Strengthen Instruction Contract Tests for Explicit Command Wording

**Spec Coverage:** REQ-008
**Task Outcome:** Contract tests fail if execution skill templates or generated execution skills omit explicit `gate-review` command-based dispatch hard-gate wording.
**Plan Constraints:**
- Assertions must pin both sequencing and exact command string.
- Keep assertions resilient to unrelated text movement but strict on required contract wording.
**Open Questions:** none

**Files:**
- Modify: `tests/runtime_instruction_contracts.rs`

- [x] **Step 1: Add failing assertions for explicit command requirement in templates and generated execution skills**
Run: `cargo test --test runtime_instruction_contracts -- --nocapture`
Expected: Fails until template-derived and generated skill wording includes exact command call.

- [x] **Step 2: Add direct template wording check for explicit command in both execution templates**
Run: `rg -n \"featureforge plan execution gate-review --plan <approved-plan-path>\" skills/executing-plans/SKILL.md.tmpl skills/subagent-driven-development/SKILL.md.tmpl`
Expected: Both templates contain exact command wording before next-task begin.

- [x] **Step 3: Align assertions with updated generated skill text and rerun contracts**
Run: `cargo test --test runtime_instruction_contracts -- --nocapture`
Expected: Pass with exact command contract pinned.

- [x] **Step 4: Commit Task 5 changes**
```bash
git add tests/runtime_instruction_contracts.rs
git commit -m "test: enforce explicit gate-review dispatch command in skill contracts"
```

## Task 6: End-to-End Verification and Release-Facing Sanity

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015
**Task Outcome:** Full targeted verification passes and evidence is ready for independent plan-fidelity review and subsequent engineering review.
**Plan Constraints:**
- Verify both runtime and skill-doc contracts before review handoff.
- Keep this task validation-focused; no scope expansion.
**Open Questions:** none

**Files:**
- Modify: `docs/featureforge/plans/2026-03-30-independent-review-dispatch-hard-gate.md`

- [x] **Step 1: Run skill-doc regeneration and contract checks**
Run: `node scripts/gen-skill-docs.mjs && node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS with no skill-doc contract drift.

- [x] **Step 2: Run Rust gate suites for execution/runtime/instruction contracts**
Run: `cargo test --test plan_execution --test workflow_runtime --test workflow_runtime_final_review --test runtime_instruction_contracts -- --nocapture`
Expected: PASS across task-boundary dispatch gate and preserved gate behavior.

- [x] **Step 3: Run lint bar for touched Rust surfaces**
Run: `cargo clippy --all-targets --all-features -- -D warnings`
Expected: PASS with zero warnings.

- [x] **Step 4: Commit verification and final plan-body updates**
```bash
git add docs/featureforge/plans/2026-03-30-independent-review-dispatch-hard-gate.md
git commit -m "chore: complete verification pass for dispatch hard-gate rollout"
```

## Risks and Mitigations

- Risk: False positives in stale-dispatch detection due to lineage anchor mismatch.
  - Mitigation: Anchor checks to latest completed attempt packet/checkpoint provenance and add stale-lineage fixtures.
- Risk: Wording drift between runtime guidance and skill docs.
  - Mitigation: Pin exact command text in both generated docs and Rust instruction-contract tests.
- Risk: Regressing existing execution gates while inserting dispatch checks.
  - Mitigation: Preserve and rerun dedicated final-review, verification, cycle-break, and provenance regression suites.

## Validation Strategy

- Fail-first targeted tests for each new dispatch-gate contract slice.
- Regenerate and contract-validate skill docs in same change set.
- Run workflow runtime + execution gate suites before claiming readiness.
- Keep clippy warning-clean for all touched Rust surfaces.

## Rollout Plan

1. Land runtime dispatch-gate changes + tests.
2. Land operator parity updates + tests.
3. Land skill template/doc updates + instruction contract assertions.
4. Run full verification matrix.
5. Produce independent plan-fidelity review artifact and record receipt before engineering review.

## Rollback Plan

1. Revert dispatch-specific begin-gate additions and command-text strictness.
2. Revert skill-template command hard-gate wording if coupled runtime changes are reverted.
3. Keep pre-existing per-task review/verification/final-review gates intact.
4. Re-run affected runtime/instruction suites to confirm restored baseline behavior.

## NOT in scope

- Implementing runtime/code/test changes from this plan; execution remains owned by execution skills.
- Introducing compatibility bypass flags, override markers, or non-command alternate dispatch credit paths.
- Adding new workflow stages or new artifact families beyond existing runtime-owned dispatch/checkpoint evidence.

## What already exists

- Runtime-owned begin gate and dispatch-checkpoint surfaces in `src/execution/state.rs` and `src/execution/transitions.rs`.
- Operator/status/handoff routing surfaces in `src/workflow/operator.rs` and `src/workflow/status.rs`.
- Execution skill template and generated-doc surfaces under `skills/executing-plans/*` and `skills/subagent-driven-development/*`.
- Contract suites already covering this boundary in `tests/plan_execution.rs`, `tests/workflow_runtime.rs`, `tests/workflow_runtime_final_review.rs`, and `tests/runtime_instruction_contracts.rs`.

## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T15:10:41Z
**Review Mode:** big_change
**Reviewed Plan Revision:** 1
**Critical Gaps:** 0
**Browser QA Required:** no
**Test Plan Artifact:** `/Users/davidmulcahey/.featureforge/projects/dmulcahey-featureforge/davidmulcahey-current-test-plan-20260330-111019.md`
**Outside Voice:** fresh-context-subagent
