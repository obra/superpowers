# SDD lifecycle metrics events

Controller only writes metrics. Keep implementer and reviewer prompts/reports unchanged.

## Store and append recipe

1. Resolve `<plan-path>` to repository-relative POSIX path. Remove only final
   `.md`, mirror below `.superpowers/metrics/`, then append `<run-id>`.
   `docs/superpowers/plans/team/foo.md` maps to
   `.superpowers/metrics/docs/superpowers/plans/team/foo/<run-id>/`.
2. Create `run.json` once for new run:

```json
{"schema_version":1,"run_id":"<run-id>","workflow":"sdd","feature":"<plan filename without final .md>","plan_path":"<repo-relative plan path>","initial_plan_fingerprint":"git-blob:<40 lowercase hex>","created_at":"<ISO-8601 timestamp>"}
```

Every fingerprint is exactly `git-blob:` plus 40 lowercase hexadecimal
characters (`[a-f0-9]{40}`), from `git hash-object --no-filters`.

3. Create/append only `events.jsonl`. Each physical UTF-8 line is one JSON
   object ending in newline. Never rewrite, reorder, truncate, repair, or
   synthesize earlier lines.
4. Append each event with this envelope:

```json
{"schema_version":1,"event_id":"<run-id>:<sequence>","run_id":"<run-id>","sequence":<positive integer>,"timestamp":"<ISO-8601 timestamp>","workflow":"sdd","event_type":"<canonical type>","feature":"<feature>","plan_path":"<repo-relative plan path>","plan_fingerprint":"git-blob:<40 lowercase hex>","payload":{}}
```

5. Resume: read `run.json` and final physical lines of `events.jsonl`; reuse
   run ID. For uncertain append, retry only byte-identical same event
   ID/content after checking physical tail. Otherwise append `<last sequence +
   1>`. Before continuing blocked/incomplete run append `run_resumed`.

`next sequence N` means first new event has `sequence: N` and
`event_id: <run-id>:N`. `last sequence N` means next has `sequence: N + 1`.

Task IDs: `task-<positive integer>`; initial task uses plan number, added task
uses next unused ID. Findings: `F-001`, `F-002`, upward; reuse same ID through
rereview. One initial reviewer emits both review events with same `review_id`.

## Canonical event table

| Event | Exact payload template |
|---|---|
| `run_started` | `{"trigger":"NEW_PLAN"}` or `{"trigger":"MANUAL_START"}` |
| `run_resumed` | `{"previous_outcome":"BLOCKED|INCOMPLETE","reason_code":"UPPER_SNAKE_CASE"}` |
| `plan_registered` | `{"task_count":<non-negative integer>}` |
| `preflight_completed` | `{"result":"PASS|FAIL","diagnostic_codes":["<short code>"]}` |
| `task_registered` | `{"task_id":"task-N","ordinal":<non-negative integer>,"title":"<short label>","origin":"INITIAL|ADDED"}` |
| `plan_task_added` | `{"task_id":"task-N","ordinal":<non-negative integer>,"title":"<short label>","origin":"INITIAL|ADDED","previous_fingerprint":"git-blob:<40 lowercase hex>","new_fingerprint":"git-blob:<40 lowercase hex>","reason_code":"UPPER_SNAKE_CASE"}` |
| `plan_task_changed` | `{"task_id":"task-N","ordinal":<non-negative integer>,"title":"<short label>","previous_fingerprint":"git-blob:<40 lowercase hex>","new_fingerprint":"git-blob:<40 lowercase hex>","reason_code":"UPPER_SNAKE_CASE"}` |
| `plan_task_superseded` | `{"task_id":"task-N","replacement_task_ids":["task-M"],"previous_fingerprint":"git-blob:<40 lowercase hex>","new_fingerprint":"git-blob:<40 lowercase hex>","reason_code":"UPPER_SNAKE_CASE"}` |
| `task_dispatched` | `{"task_id":"task-N","dispatch_id":"<non-empty identifier, max 128 chars>","attempt":<non-negative integer>,"dispatch_kind":"IMPLEMENTATION|FIX|TAKEOVER"}` |
| `task_implementation_completed` | `{"task_id":"task-N","status":"DONE|DONE_WITH_CONCERNS","commit_ids":["<commit id>"]}` |
| `task_test_result` | `{"task_id":"task-N","result":"PASS|FAIL|UNKNOWN","evidence_kind":"COUNTS|EXIT_STATUS|UNINTERPRETABLE","passed":<optional non-negative integer>,"total":<optional non-negative integer>}` |
| `task_implementation_review_result` | `{"task_id":"task-N","review_id":"<non-empty identifier, max 128 chars>","reviewer_verdict":"PASS|FAIL|CANNOT_VERIFY","gate_verdict":"PASS|FAIL","cannot_verify_count":<non-negative integer>,"resolved_cannot_verify_count":<non-negative integer>}` |
| `task_quality_review_result` | `{"task_id":"task-N","review_id":"<same identifier>","verdict":"APPROVED|NEEDS_FIXES"}` |
| `finding_raised` | `{"finding_id":"F-001","scope":"TASK|FINAL","task_id":"task-N" optional,"category":"SPEC|QUALITY","severity":"CRITICAL|IMPORTANT|MINOR","title":"<sanitized short summary>","location":"<optional repo-relative path>"}` |
| `finding_resolved` | `{"finding_id":"F-001","resolution_code":"UPPER_SNAKE_CASE","fix_round":<integer at least 1>}` |
| `finding_parked` | `{"finding_id":"F-001","ruling_code":"UPPER_SNAKE_CASE","task_id":"task-N"}` |
| `fix_round_started` | `{"task_id":"task-N","round":<integer at least 1>,"finding_ids":["F-001"],"dispatch_id":"<non-empty identifier, max 128 chars>"}` |
| `fix_round_completed` | `{"task_id":"task-N","round":<integer at least 1>,"review_id":"<non-empty identifier, max 128 chars>","finding_results":[{"finding_id":"F-001","verdict":"ADDRESSED|NOT_ADDRESSED"}]}` |
| `task_accepted` | `{"task_id":"task-N","acceptance_basis":"UPPER_SNAKE_CASE"}` |
| `task_blocked` | `{"task_id":"task-N","reason_code":"UPPER_SNAKE_CASE","required_human_input":true|false}` |
| `human_intervention_required` | `{"intervention_id":"<non-empty identifier, max 128 chars>","affected_task_ids":["task-N"],"reason_code":"UPPER_SNAKE_CASE"}` |
| `human_intervention_completed` | `{"intervention_id":"<same id>","resolution_code":"UPPER_SNAKE_CASE"}` |
| `final_review_result` | `{"result":"PASS|FAIL","review_id":"<safe id>","finding_ids":["F-001"]}` |
| `final_test_result` | `{"result":"PASS|FAIL|UNKNOWN","evidence_kind":"COUNTS|EXIT_STATUS|UNINTERPRETABLE","passed":<optional non-negative integer>,"total":<optional non-negative integer>}` |
| `run_passed` | `{"basis":"UPPER_SNAKE_CASE"}` |
| `run_blocked` | `{"reason_code":"UPPER_SNAKE_CASE","task_ids":["task-N"] optional}` |
| `run_incomplete` | `{"reason_code":"UPPER_SNAKE_CASE"}` |

For `COUNTS`, emit `passed` and `total`, with `0 <= passed <= total`; for
`EXIT_STATUS`/`UNINTERPRETABLE`, omit both. Omit optional fields; never emit
placeholder prose or unknown fields.

## Operational action map

- New setup: create `run.json`, then append `run_started`, `plan_registered`,
  one `task_registered` per initial task, then `preflight_completed`; dispatch
  only after preflight `PASS`.
- Resumed setup: read metadata/tail, append `run_resumed`, then record later
  preflight/task work using next physical sequence.
- Dispatch/report/test: before implementer append `task_dispatched`; on report
  append `task_implementation_completed`; append `task_test_result` only for
  task-scoped evidence.
- Paired initial review: after one reviewer returns both verdicts, append
  `task_implementation_review_result` then `task_quality_review_result` with
  same `review_id`; resolve cannot-verify items before acceptance.
- Findings/fix: append `finding_raised` once; each fix cycle appends
  `fix_round_started`, `fix_round_completed`, then `finding_resolved` or
  `finding_parked` using existing IDs.
- Acceptance/blocking/intervention: accept only after passing paired review and
  no open Critical/Important finding; append `task_accepted`. For genuine
  blocker append `task_blocked` and `run_blocked`; append intervention required/
  completed events only for input that determines execution.
- Final review/handoff: append final findings and `final_review_result`. Retain workspace, hand plan path and active run identity to finishing. Task 12 owns
  `final_test_result`, `run_passed`/`run_blocked`, report persistence, and
  eventual workspace cleanup.

## Failure and data rules

Payload templates are controller authoring contracts. Structural validator checks
shape/bounds; it is not semantic secret or DLP detection. Payloads contain only
IDs, allowed enums, counts, repository-relative paths,
short sanitized finding titles, and reason codes. Never include prompts, source, diffs, secrets, command output, reviewer text, tool logs, transcripts, absolute paths, uncontrolled user text, or invented evidence.

For definite append failure before any bytes: ledger/surface failure, consume no
sequence, append no replacement event, continue SDD, and never fabricate PASS.
For uncertain write: inspect physical tail; retry only byte-identical same event
ID/content, otherwise use next physical sequence. Missing/invalid evidence is
`INCOMPLETE`, never inferred success.

If Node unavailable at finalization, preserve appended events, continue
SDD/finishing, skip report write/commit, and print exactly:

```text
node <plugin-root>/bin/superpowers.mjs metrics <plan-path>
```
