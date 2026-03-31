# Execution Begin Tracking Discipline Hardening

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Problem Statement

Execution preflight is runtime-owned and already fail-closed on unsafe workspaces, but the current `executing-plans` guidance does not state a hard sequencing rule between preflight acceptance and the first execution mutation (`begin`).

In practice, this allows an implementation agent to:

1. run `plan execution preflight`
2. start editing code/tests before any `begin`
3. make the workspace dirty before runtime tracking is initialized for the active step

When this happens, later preflight attempts can fail with dirty-worktree diagnostics, and execution tracking cannot be started cleanly without an explicit recovery sequence.

## Desired Outcome

After this change:

- execution skills explicitly prohibit code/test edits between successful preflight and the first `begin`
- the first runtime `begin` call is treated as mandatory before repo mutations for the active step
- docs warn that dirtying the workspace before `begin` can strand clean execution tracking
- retroactive tracking is documented as recovery-only, not as a normal execution path
- a short deterministic recovery recipe exists for this exact failure mode

## Requirement Index

- [REQ-001][behavior] `executing-plans` must explicitly state: after preflight succeeds, do not edit code/tests or mutate repo state until the first `begin` is recorded for the active step.
- [REQ-002][behavior] `executing-plans` must mark `begin` as a mandatory execution-tracking boundary, not a best-effort reminder.
- [REQ-003][behavior] `executing-plans` must add a hard warning that if the workspace becomes dirty before first `begin`, later preflight is expected to fail closed on workspace-safety checks and clean tracking start is blocked until reconciliation/isolation.
- [REQ-004][behavior] `executing-plans` must state that retroactive execution tracking is a recovery path only and must not be treated as normal workflow.
- [REQ-005][behavior] `executing-plans` must include a five-step dirty-before-begin recovery sequence: reconcile/isolate workspace; mint/confirm fresh preflight acceptance; read helper-backed plan status; record only truly completed steps via authoritative helper mutations; resume from task-boundary review gate before advancing.
- [REQ-006][behavior] `subagent-driven-development` should mirror the same begin-before-mutation and recovery warnings so runtime-owned execution skills stay contract-consistent.
- [REQ-007][behavior] The `.tmpl` sources are authoritative for these updates; generated `SKILL.md` outputs must be regenerated, not hand-edited.
- [REQ-008][verification] Skill-doc contract tests must fail if the new begin-before-mutation warning/recovery language regresses.
- [REQ-009][verification] Targeted workflow and topology tests should continue passing to prove this is doc-contract hardening, not runtime behavior drift.
- [REQ-010][behavior] Recovery guidance must bind to explicit helper-backed mutation discipline: read `status` first, only record factual completed steps via authoritative helper mutations, never infer completion from dirty workspace state, and resume through task-boundary review/verification gates before any next-task `begin`.
- [REQ-011][behavior] `executing-plans` and `subagent-driven-development` templates must carry semantically equivalent begin-before-mutation and recovery guardrail guidance, and contract tests must assert both surfaces to prevent wording drift.

## Scope

In scope:

- `skills/executing-plans/SKILL.md.tmpl` + regenerated `skills/executing-plans/SKILL.md`
- matching language in `skills/subagent-driven-development/SKILL.md.tmpl` + regenerated output
- `tests/codex-runtime/skill-doc-contracts.test.mjs` assertions for the new guardrail text

Out of scope:

- changing runtime preflight/begin command semantics in Rust
- introducing automatic retroactive reconciliation in runtime state
- relaxing any existing workspace-safety or fail-closed checks

## Approaches Considered

### Option A (Selected): Skill-Contract Hardening

Update execution skill guidance and enforce it with doc-contract tests.

Why selected:

- directly addresses the operator failure mode reported here
- minimal blast radius, fast to ship
- preserves current runtime invariants and avoids mixed behavioral rollout

### Option B: Runtime + Skill Hardening

Add runtime begin-time guards for dirty-before-begin plus skill changes.

Why not selected in this slice:

- broader surface and migration implications
- not required to remediate the immediate Copilot guidance gap
- can be a follow-on if incidents continue after doc-contract hardening

## Contract Update Detail

## `executing-plans` updates

Add explicit sequencing language in Step 1 / Helper-Owned Execution State:

- preflight acceptance alone does not authorize implementation edits
- first `begin` initializes active execution tracking for the step
- no code/test edits before that `begin` succeeds

Add warning language:

- dirty-before-begin can force fail-closed preflight on retry
- this is a workflow error state, not a normal branch of execution

Add recovery language (short runbook):

1. isolate or reconcile workspace (worktree/branch or commit/stash/reset-by-policy)
2. re-run preflight and confirm acceptance for current plan revision
3. run `featureforge plan execution status --plan <approved-plan-path>` and anchor recovery to helper-reported state
4. backfill runtime only with truly completed steps using authoritative helper mutations (no speculative completion, no inferred step truth from dirty diffs)
5. resume from task-boundary review + verification loop before next-task start

Add retroactive-tracking policy line:

- recovery-only, exceptional path
- agents must avoid planning around retroactive mutation of execution state

## `subagent-driven-development` parity

Mirror the same guardrails where that skill describes preflight and task dispatch, so one execution skill cannot contradict the other on begin-before-edit discipline.

## Error Handling and Edge Cases

- If the workspace is already dirty when preflight is first attempted, the skill should route to reconciliation/isolation before execution mutations.
- If edits were already made before first `begin`, the skill must switch to recovery flow and avoid pretending a clean start.
- If a user explicitly asks for a non-standard recovery approach, preserve fail-closed runtime constraints and require explicit acknowledgement that this is recovery mode.

## Error and Rescue Map

| Trigger | Failure Class | Reason Code | Rescue Action | User-visible Result |
|---|---|---|---|---|
| Preflight rerun after edits-before-`begin` | `WorkspaceNotSafe` | `tracked_worktree_dirty` | Reconcile/isolate workspace; rerun preflight before any execution mutation | Explicit preflight block with remediation guidance |
| `begin` attempted without accepted preflight for plan revision | `ExecutionStateNotReady` | `n/a` (begin returns explicit failure message) | Run preflight for the exact approved plan revision, then retry `begin` | Explicit begin block before step activation |
| Recovery attempts to mark inferred completion from dirty diffs | `InvalidStepTransition` (policy-level for skill guidance) | `n/a` (policy-enforced via skill and review checks) | Use helper-backed `status`, then record only factual completed steps with authoritative helper mutations | Recovery blocked until factual evidence-backed state is recorded |
| Recovery tries to advance next task without review/verification closure | `ExecutionStateNotReady` | `prior_task_review_not_green` or `prior_task_verification_missing` | Resume task-boundary review + verification loop before next `begin` | Explicit task-boundary advancement block |

## Security and Trust Boundary Notes

| Threat | Likelihood | Impact | Mitigation in this slice | Audit Signal |
|---|---|---|---|---|
| False completion claims during recovery (marking unfinished steps complete) | Medium | High (corrupt execution truth, unsafe advancement) | Recovery guidance requires helper-backed `status` anchor and factual-only authoritative mutations; inferred completion from dirty diffs is explicitly forbidden | Review comments and contract-test assertions for recovery wording |
| Non-authoritative mutation attempts by implementer/reviewer subagents | Medium | High (execution-state trust boundary bypass) | Spec preserves helper-owned mutation model and requires guidance parity across execution skills | Existing helper-boundary contract tests plus updated skill-doc assertions |
| Replay/stale recovery instructions after workspace drift | Medium | Medium-High (stale provenance, incorrect recovery actions) | Recovery sequence requires fresh preflight acceptance and current helper `status` before any backfill mutation | Preflight diagnostics (`tracked_worktree_dirty`, related fail-closed checks) and status snapshots |

## Execution Tracking Start/Recovery Flow

```text
[engineering-approved plan]
         |
         v
 [execution preflight]
    | allowed=true
    v
 [first begin for active step] ----> [runtime tracking active]
    |
    +--> (shadow A) edit before begin -> workspace dirty
    |         |
    |         v
    |   [preflight rerun]
    |         |
    |         +--> blocked: tracked_worktree_dirty
    |                   |
    |                   v
    |          [reconcile/isolate workspace]
    |                   |
    |                   v
    |          [fresh preflight acceptance]
    |                   |
    |                   v
    |          [status anchor + factual-only mutation backfill]
    |                   |
    |                   v
    |          [task-boundary review + verification gate]
    |                   |
    |                   v
    |          [resume normal execution]
    |
    +--> (shadow B) begin without accepted preflight
    |         |
    |         v
    |   blocked: ExecutionStateNotReady
    |         |
    |         v
    |   run preflight for current plan revision, retry begin
    |
    +--> (shadow C) attempt inferred completion during recovery
              |
              v
      blocked by recovery policy (factual-only authoritative mutations)
```

## Observability Expectations

- Keep existing runtime reason-code truth authoritative (`tracked_worktree_dirty`, related preflight diagnostics).
- Skill text must reference this fail-closed posture without inventing alternate reason-code taxonomies.

## Test Plan (Acceptance)

1. `tests/codex-runtime/skill-doc-contracts.test.mjs` asserts `executing-plans` includes mandatory no-edit-before-first-`begin` wording after successful preflight.
2. `tests/codex-runtime/skill-doc-contracts.test.mjs` asserts `executing-plans` includes dirty-before-begin warning language tied to fail-closed preflight posture.
3. `tests/codex-runtime/skill-doc-contracts.test.mjs` asserts `executing-plans` marks retroactive tracking as recovery-only (not normal path).
4. `tests/codex-runtime/skill-doc-contracts.test.mjs` asserts `executing-plans` includes the five-step recovery recipe, including helper `status` anchoring and factual-only backfill wording.
5. `tests/codex-runtime/skill-doc-contracts.test.mjs` asserts `subagent-driven-development` carries semantically equivalent begin-before-mutation, recovery-only, and recovery-runbook constraints.
6. Existing execution-preflight and topology tests remain green (no runtime contract drift introduced).

## Risks and Mitigations

- Risk: wording drift between template and generated docs.
  - Mitigation: enforce template edit + regeneration + contract tests.
- Risk: one execution skill is hardened while the other remains ambiguous.
  - Mitigation: require parity updates in both execution-facing skills.
- Risk: agents still treat recovery as routine.
  - Mitigation: explicit “recovery-only” language and test assertions for it.

## Rollout and Rollback

- Rollout as documentation-contract patch with regenerated skills and test updates in one change.
- If wording causes confusion, rollback by reverting this documentation slice while preserving current runtime safety checks.

## Open Questions

- Should a follow-on runtime slice enforce begin-time repo-state invariants (defense in depth), or is skill-contract hardening sufficient after one release cycle of incident monitoring?

## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T13:40:07Z
**Review Mode:** hold_scope
**Reviewed Spec Revision:** 1
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** skipped
