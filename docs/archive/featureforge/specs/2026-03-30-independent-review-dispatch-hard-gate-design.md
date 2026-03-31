# Independent Review Dispatch Hard Gate at Task Boundaries

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Problem Statement
Execution guidance already says per-task independent review is required, and runtime already blocks `begin` for Task `N+1` when prior-task review or verification closure is missing. In practice, agents still miss the immediate enforcement point between task completion and next-task start.

The rough edge is timing clarity: the contract says independent review is required, but it does not currently encode a first-class hard gate that reads as "stop now and dispatch review before anything else." This leaves room for path-of-least-resistance behavior where the controller mentally queues review as a follow-up instead of treating it as the next mandatory action.

## Current Evidence
- Runtime `begin` gating checks prior-task closure in `src/execution/state.rs` (`require_prior_task_closure_for_begin`, `ensure_prior_task_review_closed`, `ensure_prior_task_verification_closed`).
- Execution-skill wording currently says "only then begin Task `N+1`" but does not enforce an explicit "STOP and dispatch now" command boundary in `skills/executing-plans/SKILL.md(.tmpl)` and `skills/subagent-driven-development/SKILL.md(.tmpl)`.
- Instruction contract coverage currently pins that weaker phrasing in `tests/runtime_instruction_contracts.rs`.

## Desired Outcome
Make the enforcement point unambiguous and fail-closed:
1. After task implementation steps complete, execution must enter a review-dispatch boundary state.
2. The controller must explicitly call `featureforge plan execution gate-review --plan <approved-plan-path>` to dispatch dedicated-independent fresh-context review before any next-task begin.
3. Runtime must block next-task begin if this dispatch boundary was not satisfied after the latest completed attempt of the prior task.
4. Skill docs and contract tests must pin the exact hard-gate language so drift is caught immediately.

## Hard Rule
After each task, STOP and dispatch a fresh-context dedicated-independent reviewer before any next-task begin; no exceptions.

## Requirement Index
- [REQ-001][behavior] Runtime must treat "review dispatch pending" as a first-class task-boundary gate state between task-step completion and next-task begin.
- [REQ-002][behavior] `plan execution begin --task <N+1>` must fail closed with `ExecutionStateNotReady` when Task `N` lacks authoritative post-completion review-dispatch evidence.
- [REQ-003][behavior] The failure reason codes for this condition must be deterministic (`prior_task_review_dispatch_missing` for absent evidence, `prior_task_review_dispatch_stale` for stale lineage) and flow through status/phase/handoff/doctor parity surfaces.
- [REQ-004][behavior] Review-dispatch evidence must reuse existing authoritative runtime strategy-checkpoint and task-dispatch-credit truth, bound to the current execution run identity and latest completed attempt lineage; stale dispatch evidence must not satisfy closure.
- [REQ-005][behavior] If Task `N` is reopened or re-completed after dispatch evidence is recorded, dispatch evidence must be invalidated and require a fresh dispatch before Task `N+1`.
- [REQ-006][behavior] The required dispatch action at task boundary is an explicit `featureforge plan execution gate-review --plan <approved-plan-path>` call; equivalent implicit/indirect dispatch paths must not satisfy this requirement.
- [REQ-007][behavior] Execution skills (`executing-plans`, `subagent-driven-development`) must include explicit hard-gate wording and imperative sequencing for this enforcement point, including the exact `gate-review` command call before next-task begin.
- [REQ-008][behavior] Skill contract tests must pin the exact stop-and-dispatch language in both template and generated docs.
- [REQ-009][behavior] When task-boundary dispatch gating blocks advancement, status/operator/handoff/doctor surfaces must include the exact runnable command `featureforge plan execution gate-review --plan <approved-plan-path>` in next-step guidance.
- [REQ-010][behavior] Existing independent review provenance checks (`dedicated-independent`, fresh context, fail-closed malformed/stale handling) remain required in addition to dispatch gating.
- [REQ-011][behavior] Existing per-task verification-before-completion gate remains required after review green and before next-task begin.
- [REQ-012][behavior] Existing cycle tracking and auto cycle-break behavior at three review/remediation cycles remain runtime-owned and unchanged.
- [REQ-013][behavior] Existing final whole-diff review gate and finish gates remain intact after all per-task boundaries are closed.
- [REQ-014][behavior] Legacy in-flight runs without dispatch evidence must fail closed with explicit diagnostics and deterministic recovery instructions (run authoritative review dispatch for the blocked task).
- [REQ-015][behavior] Runtime must not introduce temporary bypass flags, implicit fallback allowances, or one-shot override markers that skip review-dispatch gating for legacy in-flight runs.

## Scope
- Runtime task-boundary gating enhancements for explicit review-dispatch enforcement.
- Reason-code and operator-surface updates for review-dispatch pending diagnostics.
- Execution skill wording hardening in both template and generated docs.
- Contract-test updates that pin hard-gate phrasing and reason-code behavior.

## Out of Scope
- Replacing dedicated-independent review provenance validation with dispatch-only validation.
- Removing or weakening per-task verification requirements.
- Replacing final whole-diff review with per-task-only review.
- Broad workflow redesign outside task-boundary review sequencing.

## NOT in Scope
- New orchestration command family for automatic end-to-end task closure.
- Net-new dispatch-receipt artifact type outside existing runtime strategy-checkpoint truth.
- UI, design-system, or frontend interaction changes.
- Policy exceptions or bypass affordances for legacy in-flight runs.

## What Already Exists
- Prior-task begin gating and fail-closed task-boundary checks in `src/execution/state.rs`.
- Runtime-owned review-dispatch strategy checkpointing and cycle tracking in `src/execution/transitions.rs`.
- Workflow phase routing that already surfaces task-boundary blocking in `src/workflow/operator.rs`.
- Skill-level per-task sequencing language and contract checks in `skills/*` and `tests/runtime_instruction_contracts.rs`.

## Dream State Delta

```text
CURRENT STATE
- Runtime blocks next-task begin on missing review/verification closure, but dispatch enforcement intent is partly implicit in wording/tests.

THIS SPEC
- Makes dispatch boundary explicit, command-addressable, reason-coded, and parity-tested across runtime/operator/skill surfaces.

12-MONTH IDEAL
- Task-boundary closure is fully deterministic, operator-guided by exact commands, and resilient to agent interpretation drift without introducing bypass channels.
```

## Approaches Considered

### Option A: Skill-Text-Only Hardening
Update execution skill wording/tests to explicitly say "STOP and dispatch review now," but do not change runtime gate semantics.

Pros:
- Smallest code change.
- Fastest rollout.

Cons:
- Still relies on controller compliance.
- Runtime cannot prove timing boundary was honored.

### Option B: Runtime Dispatch Gate + Skill Hardening (Selected)
Add authoritative "review dispatch pending" task-boundary gate semantics in runtime, plus explicit skill-language hardening and contract tests.

Pros:
- Converts guidance into enforceable behavior.
- Prevents silent drift between wording and runtime truth.
- Gives deterministic diagnostics when the boundary is missed.

Cons:
- Requires runtime and test changes across multiple surfaces.

### Option C: New High-Level Orchestration Command
Add a new command that atomically closes a task boundary (dispatch review, process result, verify) and only then allows advancement.

Pros:
- Simplifies controller decisions.

Cons:
- Highest scope and migration cost.
- Not required to close the immediate rough edge.

## Selected Approach (Option B)
Enforce a runtime-owned review-dispatch boundary and mirror it in explicit skill guidance.

This directly addresses the observed failure mode: the agent no longer has to infer the enforcement point from narrative wording because the runtime and docs both declare and enforce the same hard gate.
Dispatch proof should reuse existing runtime strategy-checkpoint lineage (`gate-review` dispatch tracking) rather than introducing a parallel artifact family.

## Workflow Contract (Target Behavior)

### Per-Task Boundary Sequence
1. Complete all implementation steps in Task `N`.
2. STOP progression.
3. Run authoritative review dispatch for Task `N` by calling:

```bash
featureforge plan execution gate-review --plan <approved-plan-path>
```

4. Run dedicated-independent fresh-context review loop for Task `N` (spec compliance then code quality where applicable).
5. If review fails, remediate and re-dispatch/re-review until green.
6. Run `verification-before-completion` for Task `N` and persist passing task verification receipt.
7. Only then permit `begin` for Task `N+1`.

### Fail-Closed Rule
Any attempt to start Task `N+1` without post-completion review dispatch + review closure + verification closure for Task `N` must fail with deterministic diagnostics.

### Task-Boundary State Machine (Normative)

```text
task_steps_active
  -> task_steps_completed
  -> gate_review_dispatched
  -> task_review_green
  -> task_verification_pass
  -> next_task_begin_allowed

Invalid transitions (must fail closed):
- task_steps_completed -> next_task_begin_allowed
  reason: prior_task_review_dispatch_missing
- gate_review_dispatched -> next_task_begin_allowed (without green review)
  reason: prior_task_review_not_green
- task_review_green -> next_task_begin_allowed (without verification pass)
  reason: prior_task_verification_missing
- any state -> next_task_begin_allowed when dispatch lineage is stale
  reason: prior_task_review_dispatch_stale
```

## Runtime Changes
1. Add explicit prior-task review-dispatch gate check in the task-boundary begin path before review/verification closure checks are considered satisfied.
2. Reuse and enforce authoritative dispatch evidence binding from existing runtime state:
   - execution run id
   - prior task number
   - prior task latest completion lineage anchor (attempt/packet/checkpoint provenance)
   - strategy checkpoint fingerprint and task dispatch credit lineage minted by `gate-review` dispatch
3. Do not introduce a new standalone dispatch-receipt artifact type; keep dispatch truth in existing runtime-owned authoritative state.
4. Restrict post-completion dispatch-proof minting to explicit `gate-review` command execution; other workflow commands must not implicitly mint equivalent proof.
5. Invalidate prior dispatch evidence when prior-task completion lineage changes (reopen/re-complete).
6. Emit dispatch diagnostics with `ExecutionStateNotReady` and stable remediation text:
   - `prior_task_review_dispatch_missing` when no authoritative post-completion dispatch evidence exists.
   - `prior_task_review_dispatch_stale` when dispatch evidence exists but does not match the latest completion lineage.
7. Reflect dispatch-pending state in status/operator surfaces with reason-code parity and clear next-action instructions, including the explicit `gate-review` command.
8. Preserve existing provenance/verification/cycle-break checks and ordering after dispatch gating passes.

## Skill and Contract Changes
1. Update `skills/executing-plans/SKILL.md.tmpl`:
   - add explicit imperative boundary text:
     - "After each task: STOP and dispatch dedicated-independent fresh-context review before any next-task begin."
   - require explicit dispatch command guidance before review loop:
     - `featureforge plan execution gate-review --plan <approved-plan-path>`
2. Update `skills/subagent-driven-development/SKILL.md.tmpl`:
   - mirror identical hard-gate imperative wording.
   - require the same explicit `gate-review` command call before review loop.
   - keep spec-review then code-quality ordering explicit.
3. Regenerate checked-in skill docs via `node scripts/gen-skill-docs.mjs`.
4. Strengthen `tests/runtime_instruction_contracts.rs` assertions to pin the hard-gate wording and dispatch-before-advance ordering.

## Error and Recovery Map
| Trigger | Failure Class | Reason Code | Required Recovery |
|---|---|---|---|
| Task `N+1` begin attempted before required `gate-review` dispatch for Task `N` | `ExecutionStateNotReady` | `prior_task_review_dispatch_missing` | run `featureforge plan execution gate-review --plan <approved-plan-path>` for Task `N`, then complete review loop |
| Dispatch evidence exists but is stale vs latest Task `N` completion lineage | `ExecutionStateNotReady` | `prior_task_review_dispatch_stale` | re-dispatch review for Task `N` against current lineage |
| Dispatch evidence malformed/unreadable | `MalformedExecutionState` | `task_review_dispatch_receipt_malformed` | regenerate canonical dispatch evidence via runtime command |
| Review not green after dispatch | `ExecutionStateNotReady` | `prior_task_review_not_green` | remediate/re-review until green |
| Verification missing after review green | `ExecutionStateNotReady` | `prior_task_verification_missing` | run verification-before-completion and persist passing receipt |

## Observability
- Add deterministic task-boundary reason codes for missing and stale dispatch evidence (`prior_task_review_dispatch_missing`, `prior_task_review_dispatch_stale`).
- Ensure task-boundary next-step guidance includes the exact runnable command `featureforge plan execution gate-review --plan <approved-plan-path>` when dispatch gating blocks advancement.
- Track and expose counts for:
  - begin attempts blocked by missing review dispatch
  - stale dispatch invalidations after reopen/re-complete
  - successful dispatch-to-begin transitions per task boundary

## Test Plan (Acceptance)
1. Runtime rejects `begin` for Task `N+1` when Task `N` is completed but review dispatch evidence is missing.
2. Runtime rejects `begin` for Task `N+1` when dispatch evidence exists but predates the latest Task `N` completion lineage.
3. Runtime accepts `begin` for Task `N+1` only after explicit `gate-review` dispatch evidence is present and review + verification closures pass.
4. Status/operator/doctor/handoff surfaces expose `prior_task_review_dispatch_missing` and `prior_task_review_dispatch_stale` with consistent task-boundary messaging plus the exact runnable `featureforge plan execution gate-review --plan <approved-plan-path>` next-step command.
5. Skill-template and generated-doc contract tests pin explicit stop-and-dispatch phrasing plus the required `featureforge plan execution gate-review --plan <approved-plan-path>` command call.
6. Runtime tests prove non-`gate-review` workflow commands do not mint equivalent post-completion dispatch proof.
7. Existing per-task review provenance checks, verification checks, cycle-break behavior, and final-review/finish gates remain passing.

## Diagnostics Appendix (Normative)

The following payload shapes are normative examples for dispatch-gate diagnostics and should be used as contract-test fixtures.

### A. Begin failure: missing dispatch evidence

```json
{
  "error_class": "ExecutionStateNotReady",
  "reason_codes": ["prior_task_review_dispatch_missing"],
  "message": "Task 2 may not begin because Task 1 is missing required gate-review dispatch evidence.",
  "next_step": "featureforge plan execution gate-review --plan docs/featureforge/plans/<approved-plan>.md"
}
```

### B. Begin failure: stale dispatch evidence

```json
{
  "error_class": "ExecutionStateNotReady",
  "reason_codes": ["prior_task_review_dispatch_stale"],
  "message": "Task 2 may not begin because Task 1 dispatch evidence is stale relative to the latest completion lineage.",
  "next_step": "featureforge plan execution gate-review --plan docs/featureforge/plans/<approved-plan>.md"
}
```

### C. Status/operator parity: blocked task-boundary view

```json
{
  "phase": "repairing",
  "blocking_task": 1,
  "reason_codes": ["prior_task_review_dispatch_missing"],
  "next_step": "featureforge plan execution gate-review --plan docs/featureforge/plans/<approved-plan>.md"
}
```

Contract expectations:
- exact reason-code parity across begin/status/phase/handoff/doctor surfaces
- next-step command string equality with the canonical `gate-review` command form
- no alternate reason-code aliasing for the same blocking condition

## Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Tested? | User Sees? | Logged? |
|---|---|---|---|---|---|
| `plan execution begin` task-boundary gate | missing dispatch evidence | Y | Y | explicit block + runnable `gate-review` command | Y |
| `plan execution begin` task-boundary gate | stale dispatch lineage | Y | Y | explicit block + runnable `gate-review` command | Y |
| `plan execution begin` task-boundary gate | dispatch proof malformed | Y | Y | explicit block with remediation guidance | Y |
| `plan execution begin` task-boundary gate | review not green after dispatch | Y | Y | explicit block on review closure | Y |
| `plan execution begin` task-boundary gate | verification missing after review green | Y | Y | explicit block on verification closure | Y |
| `workflow status/phase/handoff/doctor` surfaces | dispatch-gate reason-code drift across surfaces | Y | Y | consistent reason code + runnable command | Y |
| legacy in-flight execution restart | missing dispatch proof in historical state | Y | Y | explicit fail-closed block (no bypass) | Y |

CRITICAL GAP rule for this spec slice:
- Any row where `Rescued?=N`, `Tested?=N`, and `User Sees?=silent` blocks approval.

## Risks and Mitigations
- Risk: duplicate or conflicting task-boundary checks.
  - Mitigation: centralize dispatch/review/verification boundary evaluation in shared runtime helpers.
- Risk: false positives on dispatch staleness due to lineage anchor selection.
  - Mitigation: bind staleness to canonical latest completed attempt provenance and add explicit regression fixtures.
- Risk: guidance drift between templates and generated docs.
  - Mitigation: keep contract tests on generated docs and enforce regeneration in verification.

## Rollout and Rollback
- Rollout as one atomic slice: runtime checks + reason-code surfaces + skill template updates + regenerated docs + contract tests.
- Compatibility policy: no temporary bypass flag, no one-shot override marker, and no implicit fallback that skips dispatch gating.
- Rollback by reverting dispatch-specific gate checks and wording while retaining existing per-task review/verification gates and final review requirements.
- Release guard: do not ship runtime dispatch gating without matching skill/docs/test updates in the same release.

## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T14:49:44Z
**Review Mode:** selective_expansion
**Reviewed Spec Revision:** 1
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** skipped
