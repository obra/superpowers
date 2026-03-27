# Workflow Artifact Fixtures

These fixtures preserve the workflow-header contract used by
`tests/runtime_instruction_contracts.rs`.

Most fixtures were extracted from the historical workflow documents
present at `108c0e8`, before `ce106d0` removed
`docs/featureforge/specs/` and `docs/featureforge/plans/`.
The stale source-spec path case is a small synthetic addition that
models the newer governance edge case.

Only the minimum content needed by the test is kept here:

- title
- workflow-state header lines
- source-spec header line for plan fixtures
- Requirement Index and Requirement Coverage Matrix structure where sequencing coverage needs it
- canonical `## Task N:` plus parseable `**Files:**` blocks where execution-stage sequencing coverage needs it
- a stale source-spec path case where a newer approved spec path exists at the same revision
- a full approved-plan-contract pair with `Plan Revision`, `Execution Mode`, `Requirement Coverage Matrix`, and canonical task structure for route-time hardening coverage
- harness-aware downstream phase expectations anchored on `final_review_pending`, `qa_pending`, `document_release_pending`, and `ready_for_branch_completion`
- downstream freshness/status surfaces for final review, browser QA, and release docs, including indexed fingerprint fields
- evaluator-kind visibility where workflow runtime/operator tests expose status metadata
- fixture-level text/JSON operator parity hooks for downstream freshness and evaluator/reason metadata
- writer-conflict visibility through `next_action`, `reason_codes`, and write-authority metadata without introducing a dedicated public writer-conflict phase

This keeps the sequencing test self-contained and avoids coupling it to
repository-root documentation that may be reorganized or deleted.

## Observability Matrix (Planned Slice)

This README-only slice documents missing runtime `event_kind` literals that
the harness fixture/status families will cover next. It mirrors the
`OBSERVABILITY_CASES` family model in
`tests/codex-runtime/eval-observability.test.mjs`.

| Observability family (from tests) | Planned harness fixture/status family | Missing runtime `event_kind` literals to cover |
| --- | --- | --- |
| `proposal_policy` | execution preflight recommendation/policy acceptance states | `recommendation_proposed`, `policy_accepted` |
| `gate_result` | gate outcome statuses for `gate-contract`, `gate-evaluator`, `gate-handoff`, `gate-review`, `gate-finish` | `gate_result` |
| `blocked_state` | blocked entry/exit transitions (`handoff_required` -> `executing`) | `blocked_state_entered`, `blocked_state_cleared` |
| `replay_outcome` | replay acceptance/conflict reconciliation statuses | `replay_accepted`, `replay_conflict` |
| `repo_state_drift` | repo drift detection/reconciliation statuses | `repo_state_drift_detected`, `repo_state_reconciled` |
| `artifact_integrity_mismatch` | artifact integrity mismatch status | `integrity_mismatch_detected` |
| `partial_authoritative_mutation_recovery` | partial authoritative mutation recovery status family | `partial_mutation_recovered`, `authoritative_mutation_recorded` |
| `downstream_gate_rejection` | downstream provenance rejection statuses | `downstream_gate_rejected` |
| `dependency_index_pruning_skip` | dependency-index pruning skip/status continuity family | `ordering_gap_detected`, `authoritative_mutation_recorded` |
| `write_authority` | write-authority conflict/reclaim lifecycle statuses | `write_authority_reclaimed` |

Notes:
- `authoritative_mutation_recorded` is intentionally shared across
  `partial_authoritative_mutation_recovery` and
  `dependency_index_pruning_skip`.
- This section is a planning map only; fixture files and runtime wiring are
  intentionally out of scope for this slice.
