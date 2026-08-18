# SDD Lifecycle Metrics — Design Spec

**Date:** 2026-08-18

**Status:** Proposed for human review

**Scope:** one feature-lifecycle report for a written plan executed with
`subagent-driven-development` (SDD)

## Problem

Superpowers can execute a written plan through task implementation, task
review, fix rounds, final review, and branch finishing, but it does not keep a
durable semantic record of that lifecycle. SDD's recovery ledger and review
artifacts live under `.superpowers/sdd/<plan-basename>/` and are deleted after a
successful final review. Git history remains, but it cannot reliably answer
workflow questions such as whether a task passed its initial review, how many
fix rounds completed, whether findings were parked, or whether execution
required human intervention.

The feature adds durable, local lifecycle evidence and a report command:

```text
superpowers metrics docs/superpowers/plans/foo.md
```

The report describes one feature run, not one report per skill. Version 1
instruments SDD around a written plan. The event envelope and reducer allow
later workflow stages to be added without interpreting transcripts or changing
the v1 metric definitions.

## Goals

- Record explicit semantic evidence at SDD lifecycle boundaries.
- Preserve that evidence after temporary SDD workspace cleanup and context
  compaction.
- Produce the same reduced model for terminal, Markdown, and JSON output.
- Report `PASS`, `BLOCKED`, and `INCOMPLETE` without inferring success from
  missing evidence.
- Keep event recording usable without Node.js and keep the Node reporting
  implementation dependency-free.
- Generate and separately commit a deterministic Markdown report for a
  successful lifecycle.
- Remain local, offline, and cross-harness at the event-recording boundary.

## Non-goals

- No report for brainstorming alone.
- No transcript, prompt, tool-log, source, diff, Git-history, or reviewer-prose
  scraping.
- No network service, telemetry, database, or third-party runtime dependency.
- No dashboard or interactive UI.
- No attempt to reconstruct semantic events for runs completed before this
  feature exists.
- No instrumentation of `executing-plans` or other workflows in version 1.
- No change to review policy, fix-round limits, task acceptance rules, or
  branch-integration choices except where lifecycle evidence must be recorded
  and SDD cleanup must move later.

## Current Repository Findings

The design was first discussed against v6.3.0. The current `dev` branch is
v6.3.0 plus an unrelated Code of Conduct update. The following repository facts
control the integration:

- `.codex-plugin/plugin.json` still declares `"hooks": {}`. Metrics therefore
  do not depend on a Codex hook.
- `.gitignore` already ignores all of `.superpowers/`. Local metrics storage
  needs no additional repository ignore entry.
- SDD currently uses a plan-scoped but basename-keyed temporary directory at
  `.superpowers/sdd/<plan-basename>/` and deletes it before invoking
  `finishing-a-development-branch`.
- A task has one task-review dispatch whose output contains two logical
  verdicts: spec compliance and task quality. The event model records those
  verdicts separately while preserving that they came from one review.
- A fix round is already defined as one fix dispatch followed by one scoped
  re-review, with at most five rounds per task.
- `finishing-a-development-branch` runs the final full test suite after SDD's
  final review. A complete PASS outcome therefore cannot be known at SDD's
  current cleanup point.
- The repository has no `superpowers` executable or package `bin` entry today.
- The established design-document roots are `docs/superpowers/specs/` and
  `docs/superpowers/plans/`. There is no existing lifecycle-report directory.
- The package is ESM, already uses Node standard-library test tooling, and has
  no runtime dependencies.

These facts do not invalidate the approved architecture. They require three
integration choices: add a real CLI entry point, establish
`docs/superpowers/reports/` beside the existing spec and plan roots, and defer
successful SDD scratch cleanup until the finishing workflow has recorded final
verification and attempted report generation.

## Architecture

```text
SDD controller and finishing workflow
    -> append canonical semantic events
    -> .superpowers/metrics/<mirrored-plan-path>/<run-id>/events.jsonl
    -> dependency-free Node validator and reducer
    -> one reduced lifecycle model
       -> terminal renderer
       -> JSON renderer
       -> Markdown renderer
    -> optional path-scoped report commit for PASS
```

The system has four boundaries:

1. **Instrumentation contract:** SDD and finishing write small, canonical JSON
   objects at named semantic milestones. Only the controller writes events;
   implementers and reviewers continue to return their existing reports.
2. **Persistent run store:** immutable run identity plus an append-only JSONL
   stream live outside the temporary SDD workspace.
3. **Reducer:** Node validates envelopes, payloads, identities, sequences, and
   transitions, then calculates a single reduced model.
4. **Presentation and finishing:** renderers consume only the reduced model.
   The finishing workflow may write and commit the Markdown renderer's output;
   ordinary CLI use is read-only.

No renderer reads the SDD ledger or reviewer report. Those artifacts remain
useful for recovery and human inspection but are not metrics evidence.

## Runtime and Distribution Boundary

Node.js is used for CLI parsing, validation, reduction, calculations,
rendering, retention, and report writing. The implementation uses only Node
standard-library modules.

Node.js is not required to append an event. The SDD controller writes canonical
single-line JSON through the current harness's ordinary file-write capability.
Git, which SDD already requires, supplies the plan fingerprint. Event writing
does not invoke the metrics CLI and does not parse agent output.

The repository adds an executable `.mjs` entry point and a package `bin`
mapping. The explicit extension is required because current Codex plugin
archives intentionally omit `package.json`, so packaged runtime files cannot
rely on the repository's `"type": "module"` declaration:

```json
{
  "bin": {
    "superpowers": "./bin/superpowers.mjs"
  }
}
```

Installing or linking the package exposes the required `superpowers metrics`
command. A source-checkout fallback remains available as:

```text
node /path/to/superpowers/bin/superpowers.mjs metrics <plan-path>
```

SDD invokes the entry point by its repository/plugin-relative path rather than
assuming that a global PATH entry exists. Harness packaging tests must prove
that the new runtime files are included wherever the repository currently
packages Superpowers. Event capture remains useful in harnesses where the CLI
is not installed or Node is unavailable.

If Node is unavailable, SDD and branch finishing continue. The event stream is
left intact, the user receives the exact deferred command, and no report commit
is attempted. This is a reporting degradation, not a development blocker.

## Persistent Storage

For a repository-relative plan path
`docs/superpowers/plans/team/foo.md`, the local run store is:

```text
.superpowers/
  metrics/
    docs/
      superpowers/
        plans/
          team/
            foo/
              <run-id>/
                run.json
                events.jsonl
```

The storage key is the complete repository-relative plan path with POSIX `/`
separators and the final `.md` suffix removed. Mirroring the full path prevents
same-basename plans in different directories from colliding. Plan paths must
resolve inside the current Git worktree; absolute paths outside the worktree,
`..` traversal, symlink escapes, unsafe run IDs, and control characters are
rejected.

### `run.json`

`run.json` is created once and is immutable identity metadata:

```json
{
  "schema_version": 1,
  "run_id": "20260818T120000Z-a1b2c3d4e5f6-7f31c9ab",
  "workflow": "sdd",
  "feature": "foo",
  "plan_path": "docs/superpowers/plans/team/foo.md",
  "initial_plan_fingerprint": "git-blob:a1b2c3d4e5f6...",
  "created_at": "2026-08-18T12:00:00.000Z"
}
```

The run ID is opaque to consumers but restricted to a filesystem-safe ASCII
form. The initial implementation uses a UTC timestamp, a plan-fingerprint
prefix, and a random suffix. `feature` is the plan filename without its final
`.md` suffix; the full plan path remains the collision-proof identity. Identity
is validated against every event.

### `events.jsonl`

`events.jsonl` is append-only. Every physical line is exactly one UTF-8 JSON
object and ends with a newline. An interrupted or malformed line is retained;
the reducer diagnoses it and returns `INCOMPLETE` rather than silently
repairing or discarding evidence.

Only the controller appends lifecycle events. SDD does not dispatch parallel
implementers, so version 1 has one serialized writer. On resume, the controller
reads `run.json` and the end of `events.jsonl`, reuses the run ID, and continues
with the next sequence. The latest valid event, not conversation memory,
determines the resume point.

### Plan fingerprint

The canonical fingerprint is Git's blob object ID for the plan's raw bytes,
recorded as `git-blob:<hex>` and computed with `git hash-object --no-filters`.
This works in SHA-1 and SHA-256 repositories without Node and avoids line-ending
filter differences.

`run.json` preserves the initial fingerprint. `plan_task_added`,
`plan_task_changed`, and `plan_task_superseded` events carry both the previous
and new fingerprints, so the reducer can identify the latest explicitly
registered plan revision. The CLI compares the current plan fingerprint with
that latest recorded fingerprint. A difference produces a warning in every
output format but does not select a different run or change the reduced
outcome.

## Event Envelope

Every event has the following fields:

```json
{
  "schema_version": 1,
  "event_id": "20260818T120000Z-a1b2c3d4e5f6-7f31c9ab:17",
  "run_id": "20260818T120000Z-a1b2c3d4e5f6-7f31c9ab",
  "sequence": 17,
  "timestamp": "2026-08-18T12:34:56.789Z",
  "workflow": "sdd",
  "event_type": "task_accepted",
  "feature": "foo",
  "plan_path": "docs/superpowers/plans/team/foo.md",
  "plan_fingerprint": "git-blob:a1b2c3d4e5f6...",
  "payload": {}
}
```

Rules:

- Sequences start at 1 and increase by one.
- `event_id` is `<run-id>:<sequence>`. Re-appending the identical event after
  an uncertain write is therefore deduplicable.
- An identical duplicate event ID is ignored after validation. The same ID or
  sequence with different content is contradictory evidence and makes the run
  `INCOMPLETE`.
- A missing sequence makes the run `INCOMPLETE`; the reducer does not close
  gaps by renumbering.
- Identity fields must match `run.json` and the accepted plan revision.
- Unknown schema versions or event types make the run `INCOMPLETE`. A newer
  reducer can add event types without letting an older reducer invent PASS.
- Payloads are type-specific, reject unknown fields, and have conservative
  string and collection limits.
- Payloads contain IDs, enums, counts, paths, short finding summaries, and
  reason codes. They never contain prompts, source code, diffs, secrets,
  command output, or unrestricted reviewer text.

The machine-readable schema and the SDD authoring reference are separate
files because one is executable validation and the other is behavior-shaping
guidance. A consistency test ensures that their schema version, event names,
required fields, and enum values do not drift.

## Version 1 Events

### Run and plan events

| Event | Required payload | Meaning |
|---|---|---|
| `run_started` | `trigger` | Opens a new active SDD run. |
| `run_resumed` | `previous_outcome`, `reason_code` | Reopens the same active, blocked, or incomplete run. A passed run cannot resume. |
| `plan_registered` | `task_count` | Registers the initial plan revision before task execution. |
| `preflight_completed` | `result`, `diagnostic_codes` | Records the SDD preflight table result. `result` is `PASS` or `FAIL`. |
| `task_registered` | `task_id`, `ordinal`, `title`, `origin` | Adds one initial effective plan task. One event is emitted per task. |
| `plan_task_added` | task identity plus `previous_fingerprint`, `new_fingerprint`, `reason_code` | Adds a legitimate task after plan registration. |
| `plan_task_changed` | `task_id`, changed metadata, both fingerprints, `reason_code` | Changes an undispatched task while preserving its identity. |
| `plan_task_superseded` | `task_id`, `replacement_task_ids`, both fingerprints, `reason_code` | Removes a task from the effective registry. Replacements are registered or added separately. |

`plan_task_changed` is valid only before the task's first dispatch. A material
change after dispatch must supersede the old task and add a new stable task ID;
otherwise prior review evidence would be reinterpreted retroactively.
Initial task IDs are `task-<plan-number>`. Added tasks take the next unused
positive integer and keep that ID for the rest of the run. Task titles are
short plan labels, not copied task bodies.

### Task execution and review events

| Event | Required payload | Meaning |
|---|---|---|
| `task_dispatched` | `task_id`, `dispatch_id`, `attempt`, `dispatch_kind` | Dispatches one plan task. Batched work shares a `dispatch_id` but still emits one event per task. |
| `task_implementation_completed` | `task_id`, `status`, `commit_ids` | Records `DONE` or `DONE_WITH_CONCERNS` from the implementer. |
| `task_test_result` | `task_id`, `result`, optional reliable counts | Records the task-scoped test evidence without contributing to the headline test total. |
| `task_implementation_review_result` | `task_id`, `review_id`, `reviewer_verdict`, `gate_verdict`, cannot-verify counts | Records the combined review's spec-compliance verdict and the controller's resolution of any cannot-verify items. |
| `task_quality_review_result` | `task_id`, `review_id`, `verdict` | Records the same review's quality verdict: `APPROVED` or `NEEDS_FIXES`. |
| `finding_raised` | stable finding fields | Introduces one unique finding. |
| `finding_resolved` | `finding_id`, `resolution_code`, `fix_round` | Closes a finding after verified remediation. |
| `finding_parked` | `finding_id`, `ruling_code`, `task_id` | Explicitly parks a finding after adjudication. |
| `fix_round_started` | `task_id`, `round`, `finding_ids`, `dispatch_id` | Opens one fix-dispatch and rereview cycle. |
| `fix_round_completed` | `task_id`, `round`, `review_id`, per-finding verdicts | Completes the cycle after scoped rereview. |
| `task_accepted` | `task_id`, `acceptance_basis` | Moves an effective task to the completed state. |
| `task_blocked` | `task_id`, `reason_code`, `required_human_input` | Marks the task's latest effective state blocked. |
| `human_intervention_required` | `intervention_id`, `affected_task_ids`, `reason_code` | Records only input that blocks or determines execution. |
| `human_intervention_completed` | `intervention_id`, `resolution_code` | Records resumption after that required input. |

The current single task reviewer produces both review-result events with the
same `review_id`. `reviewer_verdict` is `PASS`, `FAIL`, or `CANNOT_VERIFY`;
`gate_verdict` is `PASS` or `FAIL` after the controller resolves every
cannot-verify item as the current skill requires. A real gap becomes a stable
finding. Missing either review-result event or leaving a cannot-verify item
unresolved is incomplete evidence. A scoped rereview is represented by
`fix_round_completed`; it refers to existing finding IDs rather than raising
the same finding again.

A finding has:

- `finding_id`: stable within the run;
- `scope`: `TASK` or `FINAL`;
- optional `task_id`;
- `category`: `SPEC` or `QUALITY`;
- `severity`: `CRITICAL`, `IMPORTANT`, or `MINOR`;
- `title`: a short sanitized summary;
- optional repository-relative `location`.

The controller assigns finding IDs in first-seen order (`F-001`, `F-002`,
and so on) and carries those IDs into every fix round and rereview.

Severity and identity are immutable. Raising the same finding ID again does
not increment metrics; conflicting details for that ID make the run
`INCOMPLETE`. Rereviews resolve, park, or leave the existing ID open.

Routine user observation, status requests, and voluntary comments do not emit
`human_intervention_required`. The event is reserved for input without which
the controller cannot or must not proceed, and it explicitly names the tasks
whose execution it determined.

### Finalization events

| Event | Required payload | Meaning |
|---|---|---|
| `final_review_result` | `result`, `review_id`, finding IDs | Records `PASS` or `FAIL` from the whole-branch review. |
| `final_test_result` | `result`, optional reliable counts, `evidence_kind` | Records the finishing workflow's one full verification suite. |
| `run_passed` | `basis` | Closes a run only after valid final-review and final-test PASS evidence. |
| `run_blocked` | `reason_code`, optional task IDs | Records a workflow blocker or failed final verification. |
| `run_incomplete` | `reason_code` | Explicitly records that the controller knows required evidence is unavailable or contradictory. |

`final_test_result.result` is `PASS`, `FAIL`, or `UNKNOWN`.
`evidence_kind` is `COUNTS`, `EXIT_STATUS`, or `UNINTERPRETABLE`. Counts are
accepted only when the runner reliably reports them and satisfy
`0 <= passed <= total`. Per-task test results are never summed.

## Transition Validation

The reducer validates transitions independently for the run, every effective
task, every fix round, every finding, and every human intervention.

Key rules are:

- A run begins with `run_started`, followed by one `plan_registered`, one
  `task_registered` per initial task, and at least one `preflight_completed`
  before the first task dispatch. The registered task count must match.
- A failed preflight cannot lead directly to task dispatch. It must lead to a
  blocked/incomplete outcome or a valid resume and a later passing preflight.
- A task moves through registered, dispatched, implementation completed,
  initial review, optional fix rounds, and accepted. `task_accepted` requires
  a spec gate PASS, quality APPROVED, and no open Critical or Important
  finding.
- A blocked task may be dispatched again only after `run_resumed`. Its latest
  state determines the blocked-task metric.
- Fix-round numbers start at 1, increase without gaps per task, and complete
  only after their corresponding start. The current SDD limit of five is
  validated.
- A finding must exist before it is resolved, parked, or referenced by a fix
  round. It cannot be both resolved and parked.
- A superseded task is excluded from effective-task denominators. Events that
  continue its execution after supersession are invalid.
- `run_passed` requires all effective tasks accepted, final tests PASS, final
  review PASS, no unresolved workflow blocker, and no structural diagnostics.
- `run_blocked` is valid for failed final tests, the current SDD stop
  conditions, or tasks whose latest state is blocked.
- Events may continue after `run_blocked` or `run_incomplete` only through an
  explicit `run_resumed`. `run_passed` is immutable.

Malformed JSON, schema errors, missing sequences, identity conflicts, invalid
transitions, and contradictory terminal evidence add diagnostics and force the
reduced outcome to `INCOMPLETE`. The reducer never edits the event log and
never infers missing success events.

Outcome precedence is:

1. structural evidence error or explicit `run_incomplete` -> `INCOMPLETE`;
2. valid blocking evidence or failed final tests -> `BLOCKED`;
3. complete success evidence and `run_passed` -> `PASS`;
4. otherwise -> `INCOMPLETE` with missing-evidence diagnostics.

The reduced model also keeps `lifecycle_state` (`ACTIVE`, `TERMINAL`, or
`RESUMABLE`) separate from the report outcome. An in-progress run therefore
reports `INCOMPLETE` because success evidence is not complete while retention
still recognizes it as active and never deletes it.

## Metric Definitions

All metrics are calculated from the validated reduced state.

### Tasks and completed

The effective registry starts with `task_registered` events and applies valid
add, change, and supersede events in sequence.

- **Tasks:** number of effective tasks after adjustments.
- **Completed:** effective tasks whose latest state is accepted.

A batched dispatch does not alter the registry: each plan task keeps its own
ID, state, review evidence, and denominator membership.

### First-pass success

```text
effective tasks accepted after their initial review and before any fix round
----------------------------------------------------------------------------
                effective tasks that reached a valid initial review
```

A task with only Minor findings can pass initially if both review verdicts
permit acceptance and no fix round starts. If the denominator is zero, the
value is `UNKNOWN`, not zero percent.

### Autonomous completion

```text
effective tasks accepted with no attributed human_intervention_required event
-----------------------------------------------------------------------------
                         total effective tasks
```

An intervention counts only for its `affected_task_ids`. Observation and
optional advice do not affect the metric. If there are no effective tasks, the
value is `UNKNOWN`.

### Fix rounds

- **Fix rounds:** total valid `fix_round_completed` events for effective tasks.
- **Fix rounds/task:** completed fix rounds divided by effective tasks that
  reached a valid initial review.

Started but uncompleted rounds remain visible in diagnostics but do not count
as completed fix rounds. A zero denominator produces `UNKNOWN`.

### Findings

- **Critical findings:** cumulative unique Critical finding IDs.
- **Important findings:** cumulative unique Important finding IDs.
- **Parked findings:** unique finding IDs whose latest valid disposition is
  parked, regardless of severity.

Resolved and parked findings remain in cumulative severity counts. Parked is a
subset/disposition, not an added severity count.

### Blocked tasks

**Blocked tasks** is the number of effective tasks whose latest valid state is
blocked. A task that resumes and is later accepted is no longer blocked.

### Tests

The headline comes only from `final_test_result`:

- reliable counts and PASS -> `<passed>/<total>`;
- exit-status-only PASS -> `PASS`;
- FAIL -> `FAIL`;
- absent or uninterpretable -> `UNKNOWN`.

### Final review

The headline is `PASS`, `FAIL`, or `NOT_RUN`. `NOT_RUN` means no valid
`final_review_result` exists.

## Reduced Model

The reducer returns one versioned object containing:

- run, feature, workflow, plan, fingerprints, and timestamps;
- outcome and terminal evidence;
- the headline metrics and explicit unavailable reasons;
- effective and superseded task states;
- unique findings and their dispositions;
- final verification evidence;
- plan-hash warnings;
- structural diagnostics;
- reporting/commit metadata when invoked by finishing.

Renderers do not recalculate values. JSON output serializes this model with
stable key ordering. Terminal and Markdown renderers format its values.

## CLI

```text
superpowers metrics <plan-path>
superpowers metrics <plan-path> --write
superpowers metrics <plan-path> --run <run-id>
superpowers metrics <plan-path> --json
```

Behavior:

- Resolve the Git root and canonical repository-relative plan path.
- Locate runs only under that plan's mirrored storage key.
- Select the newest run by validated `run.json.created_at`, with run ID as a
  deterministic tie-breaker. Filesystem modification time is not identity.
- `--run` selects that exact retained run and verifies its metadata still
  names the supplied plan.
- No matching run is a clear error and does not create files.
- Default output is the compact terminal report and is read-only.
- `--json` writes only valid JSON to stdout. Warnings and diagnostics live in
  the model; operational errors go to stderr.
- `--write` writes the deterministic Markdown report and may perform local
  retention afterward. It does not commit.
- `--json --write` writes the Markdown file and emits the reduced JSON model.
- `--write --run <id>` is accepted only when `<id>` is the latest run. This
  prevents an old retained run from silently replacing the canonical report.
- Unknown options and incompatible combinations produce usage errors.

Exit status is 0 when a structurally valid PASS or BLOCKED report is produced,
1 when an INCOMPLETE report is produced, and 2 for usage, lookup, I/O, or
rendering failure. Callers inspect the reduced outcome rather than treating
every non-PASS lifecycle as a command failure.

The argument parser dispatches subcommands so later formats and filters can be
added without changing the metrics reducer.

## Markdown Report Location

The repository currently has `docs/superpowers/specs/` and
`docs/superpowers/plans/` but no report convention. This feature establishes
`docs/superpowers/reports/` as the sibling root.

For plans under `docs/superpowers/plans/`, preserve the path below `plans/`:

```text
docs/superpowers/plans/foo.md
  -> docs/superpowers/reports/foo.md

docs/superpowers/plans/team/foo.md
  -> docs/superpowers/reports/team/foo.md
```

For a plan outside that root, preserve its full repository-relative path below
the report root, without the final `.md` suffix:

```text
docs/plans/foo.md
  -> docs/superpowers/reports/docs/plans/foo.md
```

This fallback avoids basename collisions while keeping the normal Superpowers
plan path concise. Parent directories are created only with `--write`.

## Presentation

Terminal output begins with the balanced headline table:

```text
Feature: foo
Outcome: PASS
Plan: docs/superpowers/plans/foo.md
Run: 20260818T120000Z-a1b2c3d4e5f6-7f31c9ab
─────────────────────────────────
Tasks                         9
Completed                     9
First-pass success        77.8%
Autonomous completion    100.0%
Fix rounds                   3
Fix rounds/task            0.33
Critical findings             0
Important findings            4
Blocked tasks                 0
Parked findings               1
Tests passed            146/146
Final review               PASS
```

After the table, terminal and Markdown output include only applicable detail:

- plan-fingerprint warnings;
- blocked task IDs, titles, and reason codes;
- findings by stable ID, severity, disposition, short title, and location;
- concise INCOMPLETE diagnostics with sequence/line references;
- deferred-render or report-commit failure information.

Markdown adds run timestamps and workflow identity but does not dump raw
events, prompts, diffs, or reviewer reports. Rendering is deterministic: the
same reduced run produces byte-identical Markdown, so repeated `--write` calls
do not create noisy diffs.

## Automatic Finalization

The current cleanup order changes because final test evidence exists only in
`finishing-a-development-branch`.

### SDD handoff

After the final whole-branch review and its one fix wave:

1. Emit final-review findings and `final_review_result`.
2. If a genuine SDD blocker remains, emit task/run blocking evidence, generate
   a BLOCKED report when Node is available, leave it uncommitted, preserve the
   SDD workspace, and stop under the existing SDD rules.
3. If final review passes, retain the SDD workspace temporarily and invoke
   `finishing-a-development-branch` with the active metrics run identity.

### Finishing workflow

Before presenting branch-integration choices:

1. Run the existing full test suite once.
2. Append `final_test_result`.
3. On test failure, append `run_blocked`, write a BLOCKED report when possible,
   leave it uncommitted, preserve the SDD workspace, report the failure, and
   stop as the current skill already requires.
4. On test success with final-review PASS, append `run_passed`.
5. Invoke metrics report generation with `--write`.
6. If the reduced outcome is PASS, stage only the generated report and create
   a separate commit with subject `docs(metrics): update <feature> report`.
7. Delete only this plan's temporary SDD workspace after event persistence and
   the report attempt. A Node/render/commit failure remains visible but does
   not change implementation correctness or suppress the normal integration
   menu.

The report commit is path-scoped. It must not include unrelated staged or
unstaged changes and must preserve the existing index. If the report is
byte-identical and no commit is needed, finishing reports that fact and
continues.

If report generation reduces to INCOMPLETE despite successful code tests and
review, the report is written when possible but not committed. The finishing
workflow reports diagnostics, cleans up its plan's temporary SDD workspace
because persistent events survive, and continues to the integration menu.
Metrics failure must not convert completed development into a blocked branch.

If Node is unavailable, finishing appends the terminal semantic events,
explains how to run the deferred command later, skips report writing and
commit, cleans up the temporary SDD workspace after event persistence, and
continues.

## Retention

Retention is local-store hygiene, never evidence reconstruction. It runs only
after a successful `--write`, including automatic finalization; ordinary
read-only CLI use never deletes files.

For each plan, retention preserves:

- every active run;
- every run whose latest valid outcome is BLOCKED;
- the five newest remaining terminal runs (`PASS` or `INCOMPLETE`).

This can retain more than five total runs when blocked or active runs exist,
which is intentional. A resumed blocked/incomplete run keeps its run ID and
directory; it is not copied into a new run. Cleanup first fully validates a run
directory and refuses to delete an unclassifiable or malformed run. Deletion
targets one explicit validated run directory at a time and never follows
symlinks.

The retention count is one named constant/configuration value in the storage
module so a later configuration interface does not change reducer behavior.

## Failure Behavior

| Failure | Behavior |
|---|---|
| Event append fails | Record the failure in the SDD ledger/user-facing status when possible; continue development; later report is INCOMPLETE if evidence is missing. |
| Node unavailable | Preserve events, defer rendering, continue SDD/finishing. |
| Malformed event or invalid transition | Produce INCOMPLETE with line/sequence diagnostics; never infer PASS. |
| Plan fingerprint changed | Warn in terminal/Markdown/JSON; still reduce the selected run. |
| Final tests fail | Produce BLOCKED; do not create a success commit. |
| Final review fails or a workflow blocker remains | Produce BLOCKED; do not create a success commit. |
| Report write fails | Keep events, show path and error, continue branch finishing when development itself is complete. |
| Git report commit fails | Keep the generated report, preserve unrelated index state, explain the failure, continue branch finishing. |
| Retention classification is uncertain | Preserve the run and report a diagnostic; never guess-delete. |
| No run matches the plan | Exit 2 with a clear error and no filesystem changes. |

## Component Boundaries

The implementation plan may refine filenames, but it must preserve these
single-responsibility units:

- **CLI entry point:** subcommand/option parsing, stdout/stderr, exit codes.
- **Path and store module:** repository root, canonical plan path, run lookup,
  report path, safe retention targets.
- **Schema module:** envelope and typed payload validation for version 1.
- **Transition reducer:** deduplication, sequences, run/task/finding state,
  diagnostics.
- **Metrics calculator:** pure functions over validated reduced state.
- **Terminal, JSON, and Markdown renderers:** presentation only.
- **Finishing integration:** event append, report invocation, path-scoped
  commit, and cleanup ordering.
- **SDD authoring reference:** exact event recipes and payload enums used by
  the controller, kept out of the main skill when it would make the frequently
  loaded document substantially larger.

The reducer and calculator must be importable without invoking the CLI, and
renderers must be testable with in-memory reduced models.

## Verification

### Test-driven implementation

Production code follows `superpowers:test-driven-development`: each behavior
gets a failing test first, the failure is observed for the expected reason,
minimal code makes it pass, and refactoring keeps the suite green.

### Unit tests

- envelope and every payload schema;
- unknown versions/types and field limits;
- event and sequence deduplication/conflicts/gaps;
- run, task, finding, fix-round, intervention, and terminal transitions;
- effective task additions, pre-dispatch changes, and supersession;
- initial-review pairing from the current combined task reviewer;
- first-pass, autonomous-completion, and fix-round denominator edge cases;
- stable finding counts across rereviews and dispositions;
- blocked/resumed/incomplete/pass runs;
- final-test count and exit-status interpretations;
- plan-path mirroring, traversal/symlink rejection, and hash warnings;
- safe retention, including more than five blocked runs.

### Golden tests

Golden fixtures cover terminal, Markdown, and JSON output for:

- PASS with reliable test counts;
- PASS with exit-status-only tests;
- BLOCKED with tasks/findings;
- INCOMPLETE with malformed/contradictory evidence;
- UNKNOWN denominators and `NOT_RUN` final review;
- plan fingerprint warning.

### Temporary-repository end-to-end tests

- exact and latest run lookup;
- explicit run selection and mismatch rejection;
- read-only default behavior;
- deterministic report writing and nested report paths;
- operation after `.superpowers/sdd/<plan>/` deletion;
- PASS, BLOCKED, and INCOMPLETE outcomes and exit statuses;
- path-scoped PASS commit with unrelated staged/unstaged changes preserved;
- commit failure leaves the report intact;
- no commit for BLOCKED or INCOMPLETE;
- Node-unavailable/deferred-render instructions at the skill boundary;
- retention after write and safe preservation of active, blocked, malformed,
  and symlinked directories.

### Compatibility checks

- Linux and WSL paths and executable behavior;
- Windows Node.js path normalization, UTF-8 output, and spawn behavior;
- all current packaging/sync tests include the CLI and metrics runtime files;
- supported harnesses can append the canonical JSONL recipes without Node;
- no network access is used.

### Skill behavior evaluation

The SDD and finishing changes are behavior-shaping code and follow
`superpowers:writing-skills`:

1. Run fresh-session RED baselines without the new instructions and document
   the exact omissions or malformed events.
2. Micro-test each event-writing recipe against a no-guidance control with at
   least five fresh-context repetitions per variant, manually scoring every
   event.
3. Add only guidance required by observed failures, using structural recipes
   and required output slots for omitted/misshaped events rather than broad
   prohibition lists.
4. Run GREEN pressure scenarios covering compaction resume, batched tasks,
   review failure and fix rounds, blocked/human-input flows, Node absence,
   final-test failure, malformed prior events, and report-commit failure.
5. Perform a real pilot SDD lifecycle and verify the event stream, reduced
   model, report, cleanup timing, and separate commit end to end.

The PR/evaluation record must show before/after results, exact harness/model
versions, and adversarial failures. Unit tests alone are not evidence that
agents reliably emit the events.

## Contribution and Rollout Constraints

- The change targets `dev` and remains one lifecycle-metrics concern.
- The current authorization is local workflow improvement. The repository
  facts prove that semantic lifecycle evidence is unavailable after SDD
  cleanup, but they do not by themselves satisfy upstream's requirement for a
  specific experienced failure. Before an upstream PR, document the real
  session, failed user experience, and exact evidence that motivated it; do
  not describe the local design exercise as production failure evidence.
- It adds no third-party service or dependency.
- Skill edits preserve tuned language except for the minimum lifecycle
  attachment and cleanup changes proven by evals.
- Before any upstream PR, search open and closed PRs for metrics, telemetry,
  SDD event logging, reporting, and CLI prior art.
- The complete diff and eval evidence must receive human review before a PR.
- Any later PR identifies the model, harness/version, every installed plugin,
  and the human reviewer, and completes every PR-template section.

Version 1 can ship locally on `feat/sdd-metrics` after its implementation plan,
tests, skill evals, and pilot pass. Upstream submission is a separate decision.

## Acceptance Criteria

The design is implemented only when all of the following are true:

- A real SDD run produces persistent, canonical events without needing Node to
  record them.
- Context compaction and blocked-run resume continue the same run and sequence.
- `superpowers metrics <plan>` works after SDD scratch cleanup and is read-only
  unless `--write` is supplied.
- Terminal, JSON, and Markdown outputs agree because they share one reduced
  model.
- Metric formulas and PASS/BLOCKED/INCOMPLETE rules match this specification.
- Missing or contradictory evidence can never produce PASS.
- A successful finishing flow records final tests, writes the report, and
  creates only the separate report commit.
- BLOCKED and INCOMPLETE reports remain uncommitted and inspectable.
- Node/report/commit failures are visible without halting otherwise-complete
  development.
- Retention preserves every active and blocked run and the five newest other
  terminal runs per plan.
- Deterministic tests, cross-platform checks, skill RED/GREEN evals, and a real
  pilot lifecycle pass.
