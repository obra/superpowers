# Per-Task Review Gates in Execution Workflow

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Problem Statement
The execution workflow currently enforces review and finish gates only after all plan steps are complete. This allows execution to start Task N+1 immediately after Task N implementation steps complete, even when Task N has not passed an independent review loop and follow-on verification checkpoint.

That behavior weakens plan execution quality control because remediation can be deferred too late, cross-task risk can compound, and reviewers lose a clean per-task checkpoint.

## Desired Outcome
Enforce a strict task-boundary contract:
1. Implement all steps for the current task.
2. Run dedicated independent review for that task in a fresh-context subagent.
3. If review fails, reopen/remediate/re-review until green.
4. Use runtime cycle tracking and auto cycle-break when review/remediation churn reaches 3 cycles for the same task.
5. After review is green, run verification-before-completion for task-scoped verification evidence.
6. Only then allow execution to advance to the next task.
7. Keep the existing final whole-diff review gate before branch completion.

## Requirement Index
- [REQ-001][behavior] Runtime must block `plan execution begin` for Task `N+1` until Task `N` is task-closed under review-green plus verification-complete conditions.
- [REQ-002][behavior] Task closure truth must be authoritative-artifact derived (checked steps, completed attempts, dedicated-independent review receipts, and task-level verification receipt), not session-memory derived.
- [REQ-003][behavior] Per-task independent review must use dedicated-independent fresh context and fail closed on missing, stale, malformed, or non-independent provenance.
- [REQ-004][behavior] Per-task verification must require fresh verification-before-completion evidence and fail closed on missing or failed verification receipts.
- [REQ-005][behavior] Runtime cycle tracking and cycle-break logic must apply to per-task review/remediation loops with automatic cycle-break entry at three cycles for the same task.
- [REQ-006][behavior] Workflow/operator/status surfaces must expose deterministic task-boundary blocking diagnostics with reason-code parity across text/json/doctor/handoff surfaces.
- [REQ-007][behavior] Existing final whole-diff review gate must remain required after all tasks satisfy per-task closure gates.
- [REQ-008][behavior] Existing finish gating (`qa_pending`, `document_release_pending`, `ready_for_branch_completion`) must remain intact after final review.
- [REQ-009][behavior] Execution skills (`executing-plans`, `subagent-driven-development`) must reflect mandatory per-task review+verification loop ordering before next-task advancement.
- [REQ-010][behavior] Execution-phase subagent dispatch must not require per-dispatch user consent once execution is active under approved workflow control.
- [REQ-011][behavior] Legacy in-flight execution runs that predate task-verification receipts must fail closed with explicit migration diagnostics and deterministic recovery actions.
- [REQ-012][behavior] Contract tests must pin task-boundary gate enforcement, cycle-break behavior, final-review preservation, and updated skill-doc sequencing/consent language.

## Scope
- Runtime enforcement of per-task review + verification gate before cross-task advancement.
- Runtime/operator phase and diagnostics updates to surface task-boundary gate state.
- Execution skill contract updates (`executing-plans`, `subagent-driven-development`, related docs) to align with runtime enforcement.
- Explicit subagent dispatch policy change: execution-time review/implementation subagents are allowed without per-dispatch user consent once execution is in progress.
- Preserve existing final review gate as an additional downstream whole-diff checkpoint.

## Out of Scope
- Replacing final whole-diff review with task-only review.
- Changing approved plan/spec scope during remediation.
- Weakening existing authoritative artifact, provenance, or trust-boundary checks.

## Selected Approach (Option A)
Keep final review and add mandatory per-task green gates.

Why this approach:
- Catches defects earlier at each task boundary.
- Preserves cross-task/system-wide quality check at the end.
- Reuses existing runtime cycle tracking (`review_remediation`, `cycle_break`) instead of introducing parallel churn logic.

## Workflow Contract (Target Behavior)

### Task Lifecycle

```
(task N steps active)
  -> all task N steps complete
  -> task N review pending (independent fresh subagent)
  -> [pass] task N verification pending (verification-before-completion)
  -> [pass] task N ready/closed
  -> task N+1 may begin

  -> [fail review] reopen task N remediation
  -> review rerun (cycle count++)
  -> cycle 3 => cycle_break strategy state
```

### Hard Rule
Starting the first step of Task N+1 is blocked while Task N is not closed under:
- review green
- verification complete

### Task Closure Definition (Authoritative)
Task `N` is considered task-closed only when all of the following are true:
- Every step in Task `N` is checked and has a latest `Completed` evidence attempt.
- Every completed step in Task `N` has a valid dedicated-independent unit-review receipt bound to the same run identity and step checkpoint.
- A task-level verification receipt exists for Task `N`, marked pass, with fresh command evidence and the active strategy checkpoint fingerprint.

Task-closure must be derived from authoritative artifacts, never session memory.

## Runtime Changes
1. Add task-boundary readiness evaluation in execution runtime state.
- Compute the most recently active/completed task.
- Determine whether that task has satisfied:
  - required independent review receipt/provenance
  - verification-before-completion checkpoint for task closure

2. Enforce gate in `begin` transition.
- Reject `plan execution begin --task <next-task>` when prior task is not task-closed.
- Return structured failure (`ExecutionStateNotReady`) with explicit reason codes (for example `prior_task_review_not_green`, `prior_task_verification_missing`).

3. Keep cycle tracking runtime-owned and automatic.
- Continue using review-dispatch + reopen cycle accounting.
- Preserve auto `cycle_break` transition at cycle 3 per task.
- Do not require human replanning loopback for cycle-break entry.

4. Expose task gate state through workflow operator/phase surfaces.
- Add/route a task-level pending phase (or equivalent deterministic diagnostics) before `executing` advances to later tasks.
- Ensure shell/text/json parity for this surface.

5. Add explicit task-gate status surface.
- Extend status/operator surfaces with deterministic task-boundary diagnostics:
  - `task_boundary_blocked_task` (task number currently blocking advancement)
  - `task_boundary_block_reason` (`review_pending` | `verification_pending` | `cycle_breaking`)
  - reason-code parity between execution status, workflow phase, and doctor/handoff views

6. Preserve final whole-diff review and finish gates.
- Existing `final_review_pending` behavior remains required after all tasks are task-closed.

7. Legacy run compatibility policy.
- Do not silently fail-open.
- If an older in-flight execution run lacks new task-verification receipts, emit an explicit legacy-policy diagnostic and require one of:
  - backfill task verification receipt from fresh verification command evidence, or
  - explicit runtime migration marker proving equivalent verification provenance.

## Skill/Contract Changes
1. `skills/executing-plans/SKILL.md(.tmpl)`
- Replace final-only sequencing with per-task loop:
  - complete task steps
  - run independent task review (fresh subagent)
  - remediate/re-review until green
  - run verification-before-completion
  - then advance
- Keep Step 3 final review gate for whole diff.

2. `skills/subagent-driven-development/SKILL.md(.tmpl)`
- Align with enforced per-task review/verification gate.
- Clarify the runtime-owned cycle-break path at task boundaries.

3. Subagent consent policy text in execution-facing skills.
- Remove per-dispatch user-consent requirement for subagent use during approved execution flows.
- State that approved execution stage authorizes runtime-selected subagent dispatch.
- This policy change is limited to execution-phase subagents dispatched by workflow-owned execution skills; non-execution ad-hoc delegation rules remain unchanged.

## Independent Review Requirements
Per-task review must be:
- dedicated-independent
- fresh context (not inherited implementation session history)
- traceable to task packet/task checkpoint artifacts
- pass/fail explicit

Task closure is blocked on missing, stale, or non-independent review provenance.

## Verification Requirements
After review green and before task closure:
- run verification-before-completion workflow for task-scoped checks
- require fresh command evidence (no inferred pass)
- block next-task start on missing/failed verification

### Verification Receipt Contract
Task-level verification receipts must include:
- `Source Plan` + `Source Plan Revision`
- `Execution Run ID`
- `Task Number`
- `Strategy Checkpoint Fingerprint`
- `Verification Commands`
- `Verification Results`
- `Result: pass|fail`
- `Generated By` and `Generated At`

Missing or malformed required fields fail closed at task boundary.

## Error Handling and Edge Cases
- If review artifacts are unreadable/malformed: fail closed on task closure.
- If a review fails and remediation reopens work: prior green state is invalidated.
- If cycle-break is active: execution remains in remediation strategy until runtime-owned conditions allow continuation.
- If execution restarts from persisted state: task-boundary gate must be recomputed from authoritative state, not transient session assumptions.

## Error/Rescue Map
| Trigger | Failure Class | Reason Code | Required Recovery |
|---|---|---|---|
| Task N review missing when Task N+1 begins | `ExecutionStateNotReady` | `prior_task_review_not_green` | run independent review loop for Task N until green |
| Task N verification missing when Task N+1 begins | `ExecutionStateNotReady` | `prior_task_verification_missing` | run verification-before-completion and persist task verification receipt |
| Reviewer provenance not independent | `StaleProvenance` | `task_review_not_independent` | re-run review in fresh dedicated subagent and replace receipt |
| Cycle threshold reached | `ExecutionStateNotReady` | `task_cycle_break_active` | follow cycle-break remediation topology before retry |
| Task verification receipt malformed | `MalformedExecutionState` | `task_verification_receipt_malformed` | regenerate canonical task verification receipt |

## Observability
- Add reason-code coverage for task-boundary blocks.
- Emit phase/next-action diagnostics that clearly indicate review-pending vs verification-pending vs remediation/cycle-break.
- Preserve strategy checkpoint fingerprint traceability through per-task review receipts.
- Add counters for:
  - blocked cross-task begin attempts (by reason code)
  - per-task review retries
  - per-task verification retries
  - cycle-break entries triggered at task boundaries

## Test Plan (Acceptance)
1. Runtime blocks `begin` on Task N+1 when Task N review is missing.
2. Runtime blocks `begin` on Task N+1 when Task N verification is missing.
3. Runtime allows `begin` on Task N+1 only after Task N review green + verification complete.
4. Three review/remediation cycles on same task auto-enter `cycle_break`.
5. Operator phase/next-action surfaces new task-boundary gate state deterministically.
6. Existing final review and finish gates still execute after all task-boundary gates pass.
7. Skill-doc contract tests pin updated per-task sequencing and subagent consent behavior.
8. Non-independent review receipts fail task closure with explicit provenance diagnostics.
9. Malformed task verification receipts fail task closure with deterministic reason codes.
10. Legacy in-flight run handling follows explicit migration policy and never silently bypasses task gates.

## Risks and Mitigations
- Risk: duplicated review logic between task-level and final-level flows.
  - Mitigation: centralize gate checks in runtime helpers and reuse provenance validators.
- Risk: accidental weakening of authoritative artifact checks while adding task gate.
  - Mitigation: fail-closed defaults and targeted regression tests around stale/malformed artifacts.
- Risk: execution friction from stricter gating.
  - Mitigation: clear diagnostics and next-action guidance for remediation loop.

## Rollout and Rollback
- Rollout via feature branch with targeted runtime + skill + contract tests.
- If regressions appear, rollback by reverting per-task begin-block logic and related skill changes while preserving existing final review gate behavior.
- Rollout guard: gate behavior is activated only when workflow artifacts and skill docs are updated together in the same release to avoid mixed-contract sessions.
