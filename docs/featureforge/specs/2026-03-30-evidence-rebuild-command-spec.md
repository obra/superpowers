# Auto-Rebuild Evidence Command for FeatureForge Runtime

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Problem Statement

Two sessions from 2026-03-29 show repeated evidence-rebuild loops after rebase and review churn:

- `docs/featureforge/execution-evidence/2026-03-29-per-task-review-gates-r1-evidence.md`
- `docs/featureforge/execution-evidence/2026-03-29-featureforge-project-memory-integration-r4-evidence.md`

Session evidence shows:
- 38 attempts in `per-task-review-gates-r1-evidence`, with 7 non-`N/A` invalidation reasons.
- 89 attempts in `featureforge-project-memory-integration-r4-evidence`, with 61 non-`N/A` invalidation reasons.

Observed recurring invalidation causes were `files_proven_drifted`, packet/fingerprint mismatch, and review/migration-driven file churn.

Manual recovery using repeated `reopen` + `complete` commands is currently the only path and does not scale when many steps are affected after one rebased or reviewed patch set.

## Desired Outcome

One command should detect and rebuild stale or invalidated evidence for all affected tasks/steps in a session in a deterministic, resumable pass.

## Requirement Index

- [REQ-001][behavior] The command must discover stale targets using existing evidence validity logic instead of introducing new proof heuristics.
- [REQ-002][behavior] Default command invocation must target all stale/rebuildable evidence in the active session.
- [REQ-003][behavior] Rebuild execution must reuse existing `reopen` and `complete` paths with unchanged trust boundaries.
- [REQ-004][behavior] A target with a stored verify command must re-run that command and capture verification summary.
- [REQ-005][behavior] A target without a stored command must surface as manual-required unless strict mode is disabled.
- [REQ-006][behavior] The command must support dry-run planning with no state changes.
- [REQ-007][behavior] Rebuild execution must be resumable and safe to re-run with partial completion.
- [REQ-008][behavior] Invalid CLI scope should fail early before any mutation.
- [REQ-009][behavior] No-op cases must return success with explicit summary.
- [REQ-010][workflow] Command output should support deterministic text and machine-readable JSON forms.
- [REQ-011][verify] Command output must include per-target outcome and reasonability suitable for rerun automation.

## Scope

FeatureForge execution runtime command surface, evidence rebuild orchestration, and reporting format.

## NOT in scope

- Generating missing verify commands for command-less evidence.
- Cross-session batch rebuild.
- Changing existing manual `reopen` or `complete` semantics.

## What already exists

- Existing invalidation and reopen transitions already exist in `src/execution/mutate.rs` and `src/execution/state.rs`.
- Evidence validity and drift checks already exist in `src/execution/state.rs::validate_v2_evidence_provenance`.
- Evidence command and completion persistence already exists in `plan execution complete` and can be reused through a rebuild replay path.
- Command/result schema already supports structured output patterns in existing status/operator surfaces.

## Selected Approach

Add a dedicated orchestration command that:
- computes a rebuild plan from authoritative state,
- executes that plan through existing runtime transitions,
- emits complete summary output suitable for rerun and CI automation.

## Workflow Contract

Target command:

`plan execution rebuild-evidence`

Supported forms:
- `plan execution rebuild-evidence --all`
- `plan execution rebuild-evidence --task <task_id>`
- `plan execution rebuild-evidence --step <task_id:step_id>`
- `plan execution rebuild-evidence --include-open`
- `plan execution rebuild-evidence --skip-manual-fallback`
- `plan execution rebuild-evidence --continue-on-error`
- `plan execution rebuild-evidence --dry-run`
- `plan execution rebuild-evidence --max-jobs <n>`
- `plan execution rebuild-evidence --no-output`
- `plan execution rebuild-evidence --json`

Runtime sequence:
1. Resolve scope and session.
2. Discover candidates from current provenance and invalidation state.
3. Emit dry-run plan if requested.
4. Rebuild each candidate in deterministic order.
5. Emit final text or JSON result.

Proposed data flow:

```text
input flags
  -> scope resolution
    -> candidate discovery (invalidation/provenance)
      -> dry-run? -> plan output
      -> executor
         -> reopen transition
         -> verify execution/manual marker
         -> complete transition
         -> result aggregation
```

Scope controls:
- `--all` is default and scans the full session.
- `--task` and `--step` narrow selection.
- `--include-open` adds active non-completed items to repair list.
- `--skip-manual-fallback` causes strict failure when commandless rebuild is required.
- `--continue-on-error` processes remaining targets after one target-level failure.
- `--max-jobs` is currently serial-only; `1` is supported and higher values fail closed until parallel replay lands.
- `--no-output` suppresses command stream capture.
- `--dry-run` never mutates state.
- `--json` switches reporting format.

Candidate detection:
- Latest attempt is explicitly invalidated with actionable reason.
- Attempt fails current packet/provenance validation and is therefore stale.
- Target file proofs show drift.
- Explicit open/reopened targets are only included when `--include-open` is set.

Execution semantics:
1. Call reopen transition for the selected latest completed attempt.
2. If prior evidence has command, execute command and capture result.
3. Call complete transition with refreshed file proofs and verification summary.
4. Record attempt output and final status.

Manual fallback semantics:
- If no verify command exists, commandless target is marked manual-required.
- Default mode records manual-required result and continues.
- Strict mode (`--skip-manual-fallback`) marks target as failed and applies normal continue-on-error policy.

## Exit Status

- `0`: success with full rebuild or no-op.
- `1`: usage or precondition failure.
- `2`: partial success with at least one target failure.
- `3`: planned rebuilds exist but strict mode blocked all commandless rebuilds.

## Data and Invariants

- No history mutation outside existing valid state transitions.
- No synthetic pass: completion semantics remain exactly as manual `complete`.
- Evidence ordering remains deterministic within each invocation.
- Commandless targets cannot be marked passing without explicit manual evidence input.

## Error and Rescue Map

| Trigger | Reason Code | Recovery |
|---|---|---|
| Session missing | `session_not_found` | run from valid session root or pass session reference |
| Invalid filter | `scope_no_matches` | rerun with valid `--task`/`--step` values |
| Stale target changed during run | `target_race` | rerun command with `--max-jobs 1` |
| No command available | `manual_required` | rerun with manual evidence or remove strict mode |
| Command failed | `verify_command_failed` | fix command environment and retry |
| State transition rejected | `state_transition_blocked` | rerun after previous step settles |

## Error & Rescue Registry

| Method | Failure mode | Exception class | Rescued | Rescue action | User impact |
|---|---|---|---|---|---|
| Scope resolution | no tasks/steps after filter resolution | `scope_empty` | yes | show usage-grade error and matched IDs | immediate stop before mutation |
| Candidate discovery | state artifact unreadable | `artifact_read_error` | partial (skip target) | proceed with remaining targets and include failures | partial summary |
| Target reopen+complete | precondition fail | `state_transition_blocked` | yes | retry target later if `--continue-on-error` enabled | partial summary |
| Command rerun | command exit non-zero | `verify_command_failed` | yes | mark failed and continue by policy | failure entry |
| Result serialization | output encoding failure | `serialization_error` | no | return command-level error and suggest `--json` retry disabled | requires rerun |

## Failure Modes Registry

CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES? | LOGGED?
---|---|---|---|---|---
Candidate planner | commandless target encountered in strict mode | Y | Y | `manual_required` with count summary | Y
Reopen+complete replay loop | race between concurrent execution runs | Y | Y | `target_race` + retry guidance | Y
JSON reporting | schema mismatch in nested command summaries | N | Y | command error message | Y
No-op execution | stale set becomes empty before run | Y | Y | explicit no-op with reason code | Y

## JSON Output Fields

Top-level fields:
- `session_root`
- `dry_run`
- `filter`
- `scope`
- `counts` (`planned`, `rebuilt`, `manual`, `failed`, `noop`)
- `duration_ms`
- `targets`

Each target record must include:
- `task_id`
- `step_id`
- `target_kind`
- `pre_invalidation_reason`
- `status` (`planned|rebuilt|manual_required|failed|noop`)
- `verify_mode` (`command|manual`)
- `verify_command`
- `attempt_id_before`
- `attempt_id_after`
- `verification_hash`
- `error`

## Verification Requirements

- [VERIFY-001] In stale sessions, one invocation rebuilds all actionable targets.
- [VERIFY-002] Dry-run produces the same candidate list with no session mutation.
- [VERIFY-003] Mix of command-backed and commandless targets is handled with clear per-target outcomes.
- [VERIFY-004] Repeated invocation after successful run reports no-op.
- [VERIFY-005] With `--continue-on-error`, failure of one target does not prevent other targets from rebuilding.

## Dream state delta

- Event-driven rebuild jobs can auto-retry transient command failures with bounded retries.
- Rebuild plans can be checkpointed and shared in CI for deterministic replay across agents.
- A long-term evidence-healing dashboard tracks stale target volume and mean time to recovery per command class.

## Risks

- Rebuild of command-backed targets may fail if environment dependencies changed after rebase.
- If bounded parallel replay is added later, output ordering and conflict handling will need another contract pass.
- Manual-required targets remain process debt unless captured outside command path.

## Rollout Plan

- Add subcommand, parser, and dry-run mode.
- Implement candidate discovery and planner output.
- Implement deterministic rebuild executor with reopen+complete.
- Add JSON/text reporting and exit status mapping.
- Add focused runtime tests for candidate discovery, dry-run, manual fallback, concurrency boundary, and partial-failure resume.

## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T16:14:00Z
**Review Mode:** hold_scope
**Reviewed Spec Revision:** 1
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** skipped
