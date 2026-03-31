# FeatureForge Release Notes

## v1.6.0 - 2026-03-30

Independent-review dispatch hard-gate release focused on explicit task-boundary review dispatch proof, exact operator guidance, and release ratification for the new execution contract.

- breaking contract delta: remove `featureforge session-entry`, strict gate env exports, and active session-entry schema or CLI surfaces from the supported runtime/docs contract
- workflow routing now ignores legacy session-entry decision files and gate env inputs; `using-featureforge` and `featureforge workflow` route directly from repo-visible artifacts

### Breaking Output Contract Changes

- `workflow phase --json`: remove top-level `session_entry`; remove `phase` values `needs_user_choice` and `bypassed`; remove `next_action` values `session_entry_gate` and `continue_outside_featureforge`; new `schema_version` is `2`
- `workflow doctor --json`: remove top-level `session_entry`; remove `phase` values `needs_user_choice` and `bypassed`; remove `next_action` values `session_entry_gate` and `continue_outside_featureforge`; new `schema_version` is `2`
- `workflow handoff --json`: remove top-level `session_entry`; remove `phase` values `needs_user_choice` and `bypassed`; remove `next_action` values `session_entry_gate` and `continue_outside_featureforge`; new `schema_version` is `2`
- `workflow status --refresh` JSON: remove strict-gate `status` outcomes `needs_user_choice` and `bypassed`; remove strict-gate `reason_codes` `session_entry_unresolved` and `session_entry_bypassed`; retained route `schema_version` is `3`

- enforce explicit `featureforge plan execution gate-review --plan <approved-plan-path>` dispatch proof at task boundaries before next-task begin can proceed
- keep task-boundary fail-closed behavior for stale or missing dispatch lineage, non-independent review receipts, and missing task verification receipts
- align workflow operator surfaces and execution skill docs on the exact runnable `gate-review` command text for blocked task-boundary remediation
- harden execution guidance so repo-writing work records runtime begin before mutation and treats backfill as recovery-only workflow repair
- expand runtime, workflow, final-review, and instruction-contract coverage for dispatch hard-gate semantics and preserved final-review behavior
- refresh checked-in repo runtime binaries and darwin/windows prebuilt artifacts for `1.6.0`

## v1.5.0 - 2026-03-29

Project-memory release focused on adding an optional supportive-memory skill and tightening explicit memory routing so workflow authority stays intact.

- add `featureforge:project-memory` with checked-in authority-boundary guidance, examples, and reference templates for `docs/project_notes/*`
- seed `docs/project_notes/` with concise repo-visible memory files and a maintenance README that keeps memory supportive, inspectable, and non-authoritative
- route explicit memory-oriented requests through `using-featureforge` without letting project-memory outrank active workflow owners or approved artifacts
- add narrow project-memory consult hooks to `writing-plans`, `document-release`, and `systematic-debugging` so supportive repo notes can be consulted without turning into a protocol block
- expand Node and Rust contract coverage for project-memory discovery, repo-safety wording, route precedence, provenance, and fail-closed negative cases
- refresh checked-in repo runtime binaries and darwin/windows prebuilt artifacts for `1.5.0`

## v1.4.0 - 2026-03-29

Task-boundary review-gating release focused on mandatory per-task independent review loops, task verification, and execution-phase delegation ergonomics.

- enforce task-boundary `gate-review` checks before each task can close, with fresh-context independent reviewer provenance validation
- block next-task advancement until the current task has a green review result and a recorded task verification receipt
- add runtime-validated review/verification receipt shape checks and status reason-codes for malformed or non-independent task-boundary artifacts
- enforce cycle tracking at task boundaries and fail closed with `task_cycle_break_active` semantics when remediation churn exceeds configured limits
- authorize execution-phase implementation and review subagent dispatch without per-dispatch user-consent prompts once execution has started
- expand workflow/runtime and shell-smoke regressions for task-boundary review gates, stale binding rejection, and final-review coexistence guarantees
- refresh checked-in repo runtime binaries and darwin/windows prebuilt artifacts for `1.4.0`

## v1.3.0 - 2026-03-29

Session-entry gating release focused on strict consent-first routing and thread-scoped entry decisions.

- enforce an optional strict first-entry session gate in workflow status resolution via `FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY=1`
- fail closed before normal workflow routing whenever session entry is unresolved, including explicit `bypassed` handling
- keep session-entry decisions per thread/session key (`FEATUREFORGE_SESSION_KEY`/parent process fallback), not global
- update generated `using-featureforge` helper instructions to export strict gate env and resolve bypass choice before `workflow status --refresh`
- expand workflow/runtime contract tests for strict unresolved, enabled, bypassed, and per-session isolation scenarios
- refresh checked-in repo runtime binaries and darwin/windows prebuilt artifacts for `1.3.0`

## v1.2.0 - 2026-03-28

Execution-runtime hardening release focused on authoritative strategy checkpoints, review-cycle control, and stricter finish-gate provenance contracts.

- route `plan execution recommend` and downstream workflow surfaces through runtime-owned topology/strategy contracts instead of legacy heuristic seams
- add runtime-owned strategy checkpoints (`initial_dispatch`, `review_remediation`, and cycle-break enforcement) with dispatch/reopen tracking and churn guardrails
- require authoritative strategy-checkpoint fingerprint binding in final-review receipts and dedicated reviewer artifacts
- fail closed on authoritative late-gate provenance gaps, including QA `Source Test Plan` symlink-path rejection and stricter canonical artifact checks
- remove legacy pre-harness workflow handoff compatibility paths and tighten fail-closed routing behavior
- expand workflow/runtime/final-review regression coverage for authoritative provenance routing, reviewer binding, and cycle-tracking semantics
- refresh checked-in repo runtime binaries and darwin/windows prebuilt artifacts for `1.2.0`

## v1.1.0 - 2026-03-27

Execution-harness release focused on authoritative workflow truth, durable provenance, and release-ready runtime packaging.

- honor recorded authoritative final-review and downstream finish provenance instead of newer same-branch decoys
- fail `gate-review` closed on stale or missing authoritative late-gate truth
- persist a durable authoritative dependency index on record mutations and fail closed if publishing it breaks
- emit the first production observability sink for authoritative mutations with a persisted counter
- rebuild the repo-root runtime binary and checked-in darwin/windows prebuilt artifacts for `1.1.0`

## v1.0.0 - 2026-03-24

Initial standalone FeatureForge release.

- reset the product version to `1.0.0`
- standardize the supported runtime surface on the canonical `featureforge` binary
- move active skill namespaces to `featureforge:<skill>` and the entry router to `using-featureforge`
- move runtime and install state to `~/.featureforge/`
- move the repo-local default config to `.featureforge/config.yaml`
- preserve historical project documents under `docs/archive/`
- remove wrapper and shim entrypoints from the supported product surface
