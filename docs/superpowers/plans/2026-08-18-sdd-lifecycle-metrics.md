# SDD Lifecycle Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable semantic SDD lifecycle events and a dependency-free
`superpowers metrics <plan>` command that renders trustworthy terminal, JSON,
and Markdown reports and integrates safely with branch finishing.

**Architecture:** SDD and finishing append versioned JSONL events without
requiring Node. Focused `.mjs` modules validate and reduce those events into one
model consumed by all renderers; the CLI owns lookup, output, writing, and
retention. Skill edits happen only after RED behavior baselines and are followed
by GREEN pressure tests and a real pilot lifecycle.

**Tech Stack:** Node.js ESM (`.mjs`) and standard-library modules only;
`node:test`; Bash for existing plugin packaging/static tests; Markdown skills;
Quorum in the separate `superpowers-evals` checkout for behavior evaluation.

**Spec:** `docs/superpowers/specs/2026-08-18-sdd-lifecycle-metrics-design.md`

## Global Constraints

- Runtime code has zero third-party dependencies and requires no network.
- Node is used for validation, reduction, rendering, report writing, and
  retention; Node is not required merely to append an event.
- Every runtime module shipped in plugin archives uses `.mjs`; packaged code
  cannot rely on a shipped `package.json` or `"type": "module"`.
- Persistent evidence lives at
  `.superpowers/metrics/<full-plan-path-without-.md>/<run-id>/`; temporary SDD
  files remain at `.superpowers/sdd/<plan-basename>/`.
- Event streams are append-only. Never repair, truncate, renumber, or infer a
  missing success event.
- Event payloads never store prompts, source, diffs, secrets, command output,
  or unrestricted reviewer prose.
- PASS requires accepted effective tasks, final tests PASS, final review PASS,
  no unresolved blocker, structurally valid evidence, and `run_passed`.
- CLI default behavior is read-only. Only `--write` creates/updates Markdown
  and runs retention; `--write` never commits.
- A PASS report commit is path-scoped and separate. BLOCKED and INCOMPLETE
  reports remain uncommitted.
- Retention preserves all active and BLOCKED runs plus the newest five other
  terminal runs per plan; malformed/unclassifiable and symlinked targets are
  never deleted.
- Core implementation follows RED-GREEN-REFACTOR. Skill wording follows
  `superpowers:writing-skills`: RED baselines and wording micro-tests precede
  skill edits.
- This is local-first work on `feat/sdd-metrics`. Do not push or open an
  upstream PR during plan execution.

## File Structure

### Superpowers repository

- `bin/superpowers.mjs` — executable package/checkout entry point.
- `lib/metrics/constants.mjs` — schema version, event names, enums, limits,
  retention constant.
- `lib/metrics/schema-v1.mjs` — run/event payload validation.
- `lib/metrics/paths.mjs` — Git root, canonical plan identity, fingerprint,
  storage/report paths.
- `lib/metrics/store.mjs` — run loading/selection, atomic report writing, safe
  retention.
- `lib/metrics/reducer.mjs` — JSONL parsing, deduplication, sequence and
  lifecycle state machines.
- `lib/metrics/model.mjs` — metric formulas, outcome precedence, reduced model.
- `lib/metrics/render-terminal.mjs` — compact terminal presentation.
- `lib/metrics/render-markdown.mjs` — deterministic tracked report.
- `lib/metrics/render-json.mjs` — stable machine-readable JSON.
- `lib/metrics/cli.mjs` — subcommand/options, I/O, exit statuses.
- `tests/metrics/fixtures.mjs` — canonical in-memory events and temporary Git
  repository setup.
- `tests/metrics/*.test.mjs` — focused unit, golden, CLI, retention, and E2E
  tests.
- `tests/metrics/golden/*` — byte-for-byte renderer expectations.
- `skills/subagent-driven-development/metrics-events.md` — runtime-neutral
  event-authoring recipes for controllers.
- `skills/subagent-driven-development/SKILL.md` — SDD instrumentation and
  delayed cleanup.
- `skills/finishing-a-development-branch/SKILL.md` — final tests, report,
  path-scoped commit, and cleanup sequence.
- `tests/claude-code/test-sdd-metrics-instructions.sh` — static instruction and
  schema-reference drift checks.
- `scripts/package-codex-plugin.sh` and
  `tests/codex/test-package-codex-plugin.sh` — ship and verify `bin/` + `lib/`.
- `scripts/sync-to-codex-plugin.sh` and
  `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` — preserve runtime in
  Codex marketplace sync.
- `package.json` and `README.md` — package bin mapping and manual CLI usage.
- `docs/superpowers/specs/2026-08-18-sdd-lifecycle-metrics-eval-results.md`
  — sanitized RED/GREEN/pilot results.

### Separate `superpowers-evals` checkout at `evals/`

- `src/setup-helpers/{sdd-fixtures.ts,registry.ts}` and
  `test/setup-helpers-sdd.test.ts` — deterministic blocked-resume seed and
  registration test.
- `scenarios/sdd-metrics-happy-path/{story.md,setup.sh,checks.sh}` — complete
  lifecycle and committed PASS report.
- `scenarios/sdd-metrics-resume/{story.md,setup.sh,checks.sh}` — same
  run ID/sequence after compaction-style resume.
- `scenarios/sdd-metrics-report-failure/{story.md,setup.sh,checks.sh}` — metrics
  degradation never blocks otherwise-valid development.
- `docs/experiments/2026-08-sdd-lifecycle-metrics.md` — sanitized campaign
  record with run IDs and negative results.

## Version 1 Payload Contracts

Task 1's `MINIMAL_PAYLOADS` and validators use these exact shapes; later tasks
and `metrics-events.md` use the same field and enum names:

```js
export const MINIMAL_PAYLOADS = {
  run_started: { trigger: 'NEW_PLAN' },
  run_resumed: { previous_outcome: 'BLOCKED', reason_code: 'WORKFLOW_RESUMED' },
  plan_registered: { task_count: 1 },
  preflight_completed: { result: 'PASS', diagnostic_codes: [] },
  task_registered: { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' },
  plan_task_added: {
    task_id: 'task-2', ordinal: 2, title: 'Added task', origin: 'ADDED',
    previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT,
    reason_code: 'PLAN_CORRECTION',
  },
  plan_task_changed: {
    task_id: 'task-1', ordinal: 1, title: 'Changed task',
    previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT,
    reason_code: 'PLAN_CORRECTION',
  },
  plan_task_superseded: {
    task_id: 'task-1', replacement_task_ids: ['task-2'],
    previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT,
    reason_code: 'PLAN_CORRECTION',
  },
  task_dispatched: {
    task_id: 'task-1', dispatch_id: 'dispatch-1', attempt: 1,
    dispatch_kind: 'IMPLEMENTATION',
  },
  task_implementation_completed: {
    task_id: 'task-1', status: 'DONE', commit_ids: ['abcdef0'],
  },
  task_test_result: {
    task_id: 'task-1', result: 'PASS', evidence_kind: 'COUNTS', passed: 1, total: 1,
  },
  task_implementation_review_result: {
    task_id: 'task-1', review_id: 'review-1', reviewer_verdict: 'PASS',
    gate_verdict: 'PASS', cannot_verify_count: 0, resolved_cannot_verify_count: 0,
  },
  task_quality_review_result: {
    task_id: 'task-1', review_id: 'review-1', verdict: 'APPROVED',
  },
  finding_raised: {
    finding_id: 'F-001', scope: 'TASK', task_id: 'task-1', category: 'QUALITY',
    severity: 'IMPORTANT', title: 'Missing boundary check', location: 'lib/example.mjs:10',
  },
  finding_resolved: { finding_id: 'F-001', resolution_code: 'FIX_VERIFIED', fix_round: 1 },
  finding_parked: { finding_id: 'F-001', ruling_code: 'DEFERRED_NON_BLOCKING', task_id: 'task-1' },
  fix_round_started: {
    task_id: 'task-1', round: 1, finding_ids: ['F-001'], dispatch_id: 'dispatch-fix-1',
  },
  fix_round_completed: {
    task_id: 'task-1', round: 1, review_id: 'review-fix-1',
    finding_results: [{ finding_id: 'F-001', verdict: 'ADDRESSED' }],
  },
  task_accepted: { task_id: 'task-1', acceptance_basis: 'REVIEW_CLEAN' },
  task_blocked: {
    task_id: 'task-1', reason_code: 'IMPLEMENTATION_BLOCKED', required_human_input: false,
  },
  human_intervention_required: {
    intervention_id: 'intervention-1', affected_task_ids: ['task-1'],
    reason_code: 'SECURITY_SENSITIVE_ACTION',
  },
  human_intervention_completed: {
    intervention_id: 'intervention-1', resolution_code: 'HUMAN_DECISION_RECEIVED',
  },
  final_review_result: { result: 'PASS', review_id: 'final-review-1', finding_ids: [] },
  final_test_result: {
    result: 'PASS', evidence_kind: 'COUNTS', passed: 146, total: 146,
  },
  run_passed: { basis: 'FINAL_TEST_AND_REVIEW_PASS' },
  run_blocked: { reason_code: 'FINAL_TEST_FAILED', task_ids: [] },
  run_incomplete: { reason_code: 'EVIDENCE_INVALID' },
};
```

Closed enums are:

- trigger: `NEW_PLAN`, `MANUAL_START`;
- origin: `INITIAL`, `ADDED`;
- preflight/result: `PASS`, `FAIL`;
- dispatch kind: `IMPLEMENTATION`, `FIX`, `TAKEOVER`;
- implementation status: `DONE`, `DONE_WITH_CONCERNS`;
- evidence kind: `COUNTS`, `EXIT_STATUS`, `UNINTERPRETABLE`;
- spec reviewer verdict: `PASS`, `FAIL`, `CANNOT_VERIFY`;
- spec gate verdict: `PASS`, `FAIL`;
- quality verdict: `APPROVED`, `NEEDS_FIXES`;
- scope: `TASK`, `FINAL`; category: `SPEC`, `QUALITY`; severity:
  `CRITICAL`, `IMPORTANT`, `MINOR`;
- finding rereview verdict: `ADDRESSED`, `NOT_ADDRESSED`;
- final test result: `PASS`, `FAIL`, `UNKNOWN`; final review result: `PASS`,
  `FAIL`.

Reason-code fields are bounded uppercase snake case (`^[A-Z][A-Z0-9_]{0,63}$`)
rather than a frozen vocabulary in v1. This preserves diagnostic extensibility
without permitting unrestricted prose.

---

### Task 1: Versioned schema and canonical fixtures

**Files:**

- Create: `lib/metrics/constants.mjs`
- Create: `lib/metrics/schema-v1.mjs`
- Create: `tests/metrics/fixtures.mjs`
- Create: `tests/metrics/schema.test.mjs`

**Interfaces:**

- Produces: `SCHEMA_VERSION`, `EVENT_TYPES`, `validateRunMetadata(input)`, and
  `validateEvent(input, lineNumber)`.
- Validation result shape:
  `{ value: object | null, diagnostics: Array<{code,message,line?,sequence?}> }`.
- Later tasks consume only validated values; validation never mutates input.

- [ ] **Step 1: Write the failing schema tests**

Create fixtures with these exact helpers:

```js
export const RUN_ID = '20260818T120000Z-a1b2c3d4e5f6-7f31c9ab';
export const PLAN_PATH = 'docs/superpowers/plans/foo.md';
export const FINGERPRINT = `git-blob:${'a'.repeat(40)}`;
export const SECOND_FINGERPRINT = `git-blob:${'b'.repeat(40)}`;

export function makeRun(overrides = {}) {
  return {
    schema_version: 1,
    run_id: RUN_ID,
    workflow: 'sdd',
    feature: 'foo',
    plan_path: PLAN_PATH,
    initial_plan_fingerprint: FINGERPRINT,
    created_at: '2026-08-18T12:00:00.000Z',
    ...overrides,
  };
}

export function makeEvent(sequence, event_type, payload = {}, overrides = {}) {
  return {
    schema_version: 1,
    event_id: `${RUN_ID}:${sequence}`,
    run_id: RUN_ID,
    sequence,
    timestamp: `2026-08-18T12:${String(sequence).padStart(2, '0')}:00.000Z`,
    workflow: 'sdd',
    event_type,
    feature: 'foo',
    plan_path: PLAN_PATH,
    plan_fingerprint: FINGERPRINT,
    payload,
    ...overrides,
  };
}
```

In `schema.test.mjs`, assert:

```js
test('accepts canonical run metadata', () => {
  assert.deepEqual(validateRunMetadata(makeRun()).diagnostics, []);
});

test('rejects unknown run fields and unsafe run ids', () => {
  const result = validateRunMetadata(makeRun({ run_id: '../escape', extra: 1 }));
  assert.deepEqual(result.diagnostics.map(d => d.code), [
    'RUN_UNKNOWN_FIELD',
    'RUN_ID_INVALID',
  ]);
});

test('accepts every v1 event type with its minimal payload', () => {
  for (const [eventType, payload] of Object.entries(MINIMAL_PAYLOADS)) {
    assert.deepEqual(validateEvent(makeEvent(1, eventType, payload), 1).diagnostics, []);
  }
});

test('rejects unknown versions, event types, payload fields, and prose overflow', () => {
  const event = makeEvent(1, 'finding_raised', {
    finding_id: 'F-001', scope: 'TASK', task_id: 'task-1', category: 'QUALITY',
    severity: 'IMPORTANT', title: 'x'.repeat(241), surprise: true,
  }, { schema_version: 2 });
  assert.deepEqual(validateEvent(event, 7).diagnostics.map(d => d.code), [
    'EVENT_SCHEMA_VERSION_UNSUPPORTED',
    'PAYLOAD_UNKNOWN_FIELD',
    'FINDING_TITLE_TOO_LONG',
  ]);
});
```

`MINIMAL_PAYLOADS` must contain all 27 event names from the spec, including
both task review dimensions and both human-intervention events.

- [ ] **Step 2: Run the schema test and verify RED**

Run: `node --test tests/metrics/schema.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/metrics/schema-v1.mjs`.

- [ ] **Step 3: Implement constants and strict validators**

Define exact public constants:

```js
export const SCHEMA_VERSION = 1;
export const RETENTION_TERMINAL_LIMIT = 5;
export const MAX_FINDING_TITLE = 240;
export const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
export const TASK_ID_RE = /^task-[1-9][0-9]*$/;
export const FINDING_ID_RE = /^F-[0-9]{3,}$/;
export const EVENT_TYPES = Object.freeze([
  'run_started', 'run_resumed', 'plan_registered', 'preflight_completed',
  'task_registered', 'plan_task_added', 'plan_task_changed',
  'plan_task_superseded', 'task_dispatched',
  'task_implementation_completed', 'task_test_result',
  'task_implementation_review_result', 'task_quality_review_result',
  'finding_raised', 'finding_resolved', 'finding_parked',
  'fix_round_started', 'fix_round_completed', 'task_accepted', 'task_blocked',
  'human_intervention_required', 'human_intervention_completed',
  'final_review_result', 'final_test_result', 'run_passed', 'run_blocked',
  'run_incomplete',
]);
```

Make the test assert `EVENT_TYPES.length === 27` so future prose counts cannot
drift. Implement one payload validator per event
type using small helpers for exact keys, strings, enums, integer counts, arrays,
timestamps, fingerprints, and repository-relative paths. Sort diagnostics by
field traversal order so golden assertions are stable.

- [ ] **Step 4: Run schema tests and syntax checks**

Run: `node --test tests/metrics/schema.test.mjs`

Expected: PASS with 0 failures.

Run: `node --check lib/metrics/constants.mjs && node --check lib/metrics/schema-v1.mjs`

Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics/constants.mjs lib/metrics/schema-v1.mjs tests/metrics/fixtures.mjs tests/metrics/schema.test.mjs
git commit -m "feat(metrics): validate lifecycle events"
```

---

### Task 2: Canonical plan paths and persistent run loading

**Files:**

- Create: `lib/metrics/paths.mjs`
- Create: `lib/metrics/store.mjs`
- Create: `tests/metrics/paths-store.test.mjs`
- Modify: `tests/metrics/fixtures.mjs`

**Interfaces:**

- Consumes: Task 1 validators and constants.
- Produces:
  `resolvePlanIdentity(planArg, {cwd, git})`,
  `loadRunDirectory(runDir)`,
  `listRuns(identity)`, and
  `selectRun(runs, requestedRunId)`.
- `resolvePlanIdentity` returns
  `{root,planAbsolutePath,planPath,planKey,feature,currentFingerprint,metricsPlanRoot,reportPath}`.

- [ ] **Step 1: Add a temporary Git repository fixture**

Use only Node standard-library calls and Git subprocesses:

```js
export function createRepo(t) {
  const root = mkdtempSync(join(tmpdir(), 'superpowers-metrics-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Metrics Test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'metrics@example.test'], { cwd: root });
  mkdirSync(join(root, 'docs/superpowers/plans/team'), { recursive: true });
  writeFileSync(join(root, 'docs/superpowers/plans/team/foo.md'), '# Foo\n');
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  return root;
}
```

- [ ] **Step 2: Write failing path/store tests**

Cover these exact cases:

```js
test('mirrors the full plan path and uses the concise report convention', (t) => {
  const root = createRepo(t);
  const identity = resolvePlanIdentity('docs/superpowers/plans/team/foo.md', { cwd: root });
  assert.equal(identity.planKey, 'docs/superpowers/plans/team/foo');
  assert.equal(identity.feature, 'foo');
  assert.equal(identity.reportPath, join(root, 'docs/superpowers/reports/team/foo.md'));
  assert.match(identity.currentFingerprint, /^git-blob:[0-9a-f]{40,64}$/);
});

test('uses collision-proof fallback reports outside the standard plan root', (t) => {
  const root = createRepo(t);
  mkdirSync(join(root, 'docs/plans'), { recursive: true });
  writeFileSync(join(root, 'docs/plans/foo.md'), '# Foo\n');
  const identity = resolvePlanIdentity('docs/plans/foo.md', { cwd: root });
  assert.equal(identity.reportPath,
    join(root, 'docs/superpowers/reports/docs/plans/foo.md'));
});

test('rejects traversal, symlink escape, missing plans, and non-git cwd', (t) => {
  const root = createRepo(t);
  symlinkSync(tmpdir(), join(root, 'escape-link.md'));
  for (const input of ['../outside.md', 'escape-link.md', 'missing.md']) {
    assert.throws(() => resolvePlanIdentity(input, { cwd: root }));
  }
});

test('selects newest created_at with run id tie-break and validates --run ownership', () => {
  const runs = [
    makeStoredRun({ run_id: 'run-a', created_at: '2026-08-18T10:00:00.000Z' }),
    makeStoredRun({ run_id: 'run-b', created_at: '2026-08-18T10:00:00.000Z' }),
  ];
  const selected = selectRun(runs, null);
  assert.equal(selected.metadata.run_id, 'run-b');
  const foreign = makeStoredRun({
    run_id: 'run-for-another-plan',
    plan_path: 'docs/superpowers/plans/other.md',
  });
  assert.throws(() => selectRun([...runs, foreign], foreign.metadata.run_id), /does not belong/);
});
```

Define `makeStoredRun(overrides)` in `tests/metrics/fixtures.mjs`; it returns a
fully valid `{runDir,metadata,eventLines}` object for the fixture plan and
applies only the supplied metadata overrides.

Also assert `loadRunDirectory` retains malformed JSONL text and returns its
physical line numbers rather than dropping it.

- [ ] **Step 3: Run path/store tests and verify RED**

Run: `node --test tests/metrics/paths-store.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/metrics/paths.mjs`.

- [ ] **Step 4: Implement safe path and read-only store functions**

Use `execFileSync('git', ...)` argument arrays, `realpathSync`, `relative`, and
`lstatSync`. Never interpolate a plan path into a shell command. Compute the
fingerprint with:

```js
const oid = git(['hash-object', '--no-filters', '--', planAbsolutePath], root).trim();
const currentFingerprint = `git-blob:${oid}`;
```

`loadRunDirectory` reads `run.json` and `events.jsonl`, validates metadata, and
returns `{runDir, metadata, metadataDiagnostics, eventLines}` where every event
line is `{lineNumber, text}`. It does not reduce or rewrite events.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/metrics/paths-store.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 6: Commit**

```bash
git add lib/metrics/paths.mjs lib/metrics/store.mjs tests/metrics/fixtures.mjs tests/metrics/paths-store.test.mjs
git commit -m "feat(metrics): load plan-scoped runs"
```

---

### Task 3: Stream integrity and run-level transition reducer

**Files:**

- Create: `lib/metrics/reducer.mjs`
- Create: `tests/metrics/reducer-stream.test.mjs`
- Modify: `tests/metrics/fixtures.mjs`

**Interfaces:**

- Consumes: validated metadata and physical event lines.
- Produces: `reduceRun(metadata, eventLines)` returning
  `{events,state,tasks,findings,interventions,latestPlanFingerprint,diagnostics}`.
- `state` includes `lifecycle_state`, `explicit_outcome`, `final_review`, and
  `final_test` independently; Task 5 calculates the report outcome.

- [ ] **Step 1: Write failing stream-integrity tests**

Assert these behaviors with complete event JSON lines:

```js
test('deduplicates a byte-identical retry of the same event id', () => {
  const first = makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' });
  const reduced = reduceRun(makeRun(), toLines([first, first]));
  assert.equal(reduced.events.length, 1);
  assert.deepEqual(reduced.diagnostics, []);
});

test('diagnoses conflicting ids, conflicting sequences, gaps, and malformed JSON', () => {
  const lines = [
    JSON.stringify(makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' })),
    JSON.stringify(makeEvent(1, 'plan_registered', { task_count: 1 }, { event_id: `${RUN_ID}:different` })),
    '{broken',
    JSON.stringify(makeEvent(4, 'run_incomplete', { reason_code: 'EVIDENCE_GAP' })),
  ];
  assert.deepEqual(reduceRun(makeRun(), numberLines(lines)).diagnostics.map(d => d.code), [
    'SEQUENCE_CONFLICT', 'EVENT_JSON_INVALID', 'SEQUENCE_GAP',
  ]);
});

test('requires resume before events after blocked or incomplete and forbids resume after pass', () => {
  assert.deepEqual(reduceRun(makeRun(), blockedWithoutResume).diagnostics.map(d => d.code), [
    'RUN_RESUME_REQUIRED',
  ]);
  assert.deepEqual(reduceRun(makeRun(), passThenResume).diagnostics.map(d => d.code), [
    'RUN_PASS_IMMUTABLE',
  ]);
});
```

Before the tests, define these fixture helpers explicitly:

```js
const toLines = events => events.map((event, index) => ({
  lineNumber: index + 1,
  text: JSON.stringify(event),
}));
const numberLines = lines => lines.map((text, index) => ({lineNumber: index + 1, text}));
const blockedPrefix = blockedRunEvents();
const passedPrefix = passingRunEvents();
const blockedWithoutResume = toLines(blockedPrefix.concat(
  makeEvent(blockedPrefix.at(-1).sequence + 1, 'task_dispatched', validTaskDispatchPayload()),
));
const passThenResume = toLines(passedPrefix.concat(
  makeEvent(passedPrefix.at(-1).sequence + 1, 'run_resumed', {
    previous_outcome: 'BLOCKED', reason_code: 'WORKFLOW_RESUMED',
  }),
));
```

`blockedRunEvents()` and `passingRunEvents()` return complete valid event
objects, so the appended events test transitions rather than gaps.
`validTaskDispatchPayload()` returns the Task 1 canonical `task_dispatched`
payload with a new attempt/dispatch ID appropriate to the prefix.

Also cover identity mismatch, unknown schema/type propagation, initial sequence
not 1, two `run_started` events, task dispatch before passing preflight, failed
preflight followed by resume + PASS, and terminal event prerequisites.

- [ ] **Step 2: Run reducer stream tests and verify RED**

Run: `node --test tests/metrics/reducer-stream.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/metrics/reducer.mjs`.

- [ ] **Step 3: Implement parsing, deduplication, and run state**

Use explicit reducers keyed by `event_type`; no dynamic evaluation. Preserve all
diagnostics and continue reducing only events whose envelope/payload is valid.
Track `nextSequence`, a map of canonical JSON by event ID, a map of event ID by
sequence, run phase, latest accepted plan fingerprint, and preflight state.

The reducer must never set PASS. It records terminal evidence only:

```js
state.explicit_outcome = 'PASS' | 'BLOCKED' | 'INCOMPLETE' | null;
state.lifecycle_state = 'ACTIVE' | 'RESUMABLE' | 'TERMINAL';
state.final_review = 'PASS' | 'FAIL' | 'NOT_RUN';
state.final_test = { result: 'PASS' | 'FAIL' | 'UNKNOWN', evidence_kind, passed, total };
```

- [ ] **Step 4: Run focused reducer tests**

Run: `node --test tests/metrics/reducer-stream.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics/reducer.mjs tests/metrics/reducer-stream.test.mjs tests/metrics/fixtures.mjs
git commit -m "feat(metrics): reduce lifecycle streams"
```

---

### Task 4: Effective tasks, reviews, fix rounds, findings, and intervention state

**Files:**

- Modify: `lib/metrics/reducer.mjs`
- Create: `tests/metrics/reducer-tasks.test.mjs`
- Modify: `tests/metrics/fixtures.mjs`

**Interfaces:**

- Extends Task 3's reduced state; no new public entry point.
- Task state shape is
  `{task_id,ordinal,title,effective,state,reached_review,initial_spec_gate,initial_quality,fix_rounds,human_intervention_required}`.
- Finding state shape is
  `{finding_id,scope,task_id,category,severity,title,location,disposition}`.

- [ ] **Step 1: Write failing task-state tests**

Build complete streams and assert:

```js
test('keeps one state per task when a dispatch batches plan tasks', () => {
  const reduced = reduceRun(makeRun(), validBatchedTaskEvents());
  assert.deepEqual([...reduced.tasks.keys()], ['task-1', 'task-2']);
  assert.equal(reduced.tasks.get('task-1').dispatch_id, 'dispatch-a');
  assert.equal(reduced.tasks.get('task-2').dispatch_id, 'dispatch-a');
});

test('applies additions and supersession and rejects post-dispatch mutation', () => {
  assert.deepEqual(effectiveIds(validAdjustedPlanEvents()), ['task-2', 'task-3']);
  assert.equal(diagnosticCodes(invalidPostDispatchChange()), 'PLAN_TASK_CHANGE_AFTER_DISPATCH');
});

test('requires paired review results and resolved cannot-verify items', () => {
  assert.equal(diagnosticCodes(missingQualityReview()), 'TASK_REVIEW_PAIR_INCOMPLETE');
  assert.equal(diagnosticCodes(unresolvedCannotVerify()), 'TASK_REVIEW_CANNOT_VERIFY_OPEN');
});

test('counts a finding once across fix rereviews and enforces five-round cap', () => {
  const reduced = reduceRun(makeRun(), findingAcrossRereviews());
  assert.equal(reduced.findings.size, 1);
  assert.equal(reduced.tasks.get('task-1').fix_rounds, 2);
  assert.equal(diagnosticCodes(sixFixRounds()), 'FIX_ROUND_LIMIT_EXCEEDED');
});
```

Add these test-only adapters above the cases so every assertion has a concrete
input contract:

```js
const effectiveIds = events => [...reduceRun(makeRun(), events).tasks.values()]
  .filter(task => task.effective)
  .map(task => task.task_id);
const diagnosticCodes = events => reduceRun(makeRun(), events).diagnostics
  .map(diagnostic => diagnostic.code)
  .join(',');
```

Each named builder (`validBatchedTaskEvents`, `validAdjustedPlanEvents`,
`invalidPostDispatchChange`, `missingQualityReview`,
`unresolvedCannotVerify`, `findingAcrossRereviews`, and `sixFixRounds`) lives
in `tests/metrics/fixtures.mjs` and returns numbered physical event lines, not
bare event objects.

Also cover changed-undispatched task, superseded accepted task exclusion,
finding detail conflict, resolve-before-raise, parked-and-resolved conflict,
blocked->resume->accepted, intervention attribution to only named tasks, and
`task_accepted` with an open Critical/Important finding.

- [ ] **Step 2: Run task reducer tests and verify RED**

Run: `node --test tests/metrics/reducer-tasks.test.mjs`

Expected: FAIL because Task 3 does not yet create task/finding state.

- [ ] **Step 3: Implement task/finding/intervention reducers**

Use per-entity state machines and named transition functions:

```js
applyTaskEvent(context, event);
applyFindingEvent(context, event);
applyInterventionEvent(context, event);
applyPlanAdjustment(context, event);
```

Assign no IDs in the reducer; it validates stable IDs supplied by the event
stream. `plan_task_changed` preserves a task ID only before dispatch.
`fix_round_completed` increments the task count only after a matching start and
records per-finding dispositions without raising new findings.

- [ ] **Step 4: Run all reducer tests**

Run: `node --test tests/metrics/reducer-stream.test.mjs tests/metrics/reducer-tasks.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics/reducer.mjs tests/metrics/reducer-tasks.test.mjs tests/metrics/fixtures.mjs
git commit -m "feat(metrics): track task review state"
```

---

### Task 5: Reduced outcome and metric formulas

**Files:**

- Create: `lib/metrics/model.mjs`
- Create: `tests/metrics/model.test.mjs`
- Modify: `tests/metrics/fixtures.mjs`

**Interfaces:**

- Consumes: Task 4 reduction plus current plan fingerprint.
- Produces: `buildReducedModel(reduction, {currentPlanFingerprint})`.
- Percentage values are `{value: number | null, display: string,
  unavailable_reason: string | null}`; JSON never encodes `UNKNOWN` as zero.

- [ ] **Step 1: Write failing formula and outcome tests**

Cover exact examples:

```js
test('calculates the approved headline metrics', () => {
  const model = buildReducedModel(reduceRun(makeRun(), nineTaskPassEvents()), {
    currentPlanFingerprint: FINGERPRINT,
  });
  assert.equal(model.outcome, 'PASS');
  assert.equal(model.metrics.tasks, 9);
  assert.equal(model.metrics.completed, 9);
  assert.equal(model.metrics.first_pass_success.display, '77.8%');
  assert.equal(model.metrics.autonomous_completion.display, '100.0%');
  assert.equal(model.metrics.fix_rounds, 3);
  assert.equal(model.metrics.fix_rounds_per_task.display, '0.33');
  assert.equal(model.metrics.critical_findings, 0);
  assert.equal(model.metrics.important_findings, 4);
  assert.equal(model.metrics.parked_findings, 1);
  assert.equal(model.final_test.display, '146/146');
});

test('uses UNKNOWN for empty denominators and absent final verification', () => {
  assert.equal(model.metrics.first_pass_success.display, 'UNKNOWN');
  assert.equal(model.metrics.fix_rounds_per_task.display, 'UNKNOWN');
  assert.equal(model.final_test.display, 'UNKNOWN');
  assert.equal(model.final_review, 'NOT_RUN');
});

test('applies INCOMPLETE over BLOCKED over PASS precedence', () => {
  assert.equal(modelFor(malformedBlockedEvents()).outcome, 'INCOMPLETE');
  assert.equal(modelFor(validFailedFinalTests()).outcome, 'BLOCKED');
  assert.equal(modelFor(validFailedFinalReview()).outcome, 'BLOCKED');
  assert.equal(modelFor(validUnresolvedWorkflowBlocker()).outcome, 'BLOCKED');
  assert.equal(modelFor(absenceOfFailureOnly()).outcome, 'INCOMPLETE');
});
```

Also assert cumulative unique severity counts include resolved/parked findings,
blocked task latest state, resumed task no longer blocked, only completed fix
rounds count, only final tests supply headline counts, and current fingerprint
mismatch yields a warning without changing outcome.

Add a mixed-task fixture that proves the denominators independently: six
effective tasks, four accepted, three reached review, two accepted on their
initial paired review without any fix round, one required-human-intervention
task, and two completed fix cycles. Assert `Completed = 4`, first-pass
`66.7%` (`2/3`), autonomous completion `50.0%` (`3/6`), fix rounds `2`, and
fix rounds/task `0.67` (`2/3`). Routine observation emits no intervention
event and therefore does not change the autonomous numerator.

- [ ] **Step 2: Run model tests and verify RED**

Run: `node --test tests/metrics/model.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/metrics/model.mjs`.

- [ ] **Step 3: Implement the pure reduced model builder**

Use one-decimal percentages and two-decimal round ratios. Return stable arrays
sorted by ordinal/task ID and first-seen finding order. Keep
`lifecycle_state` independent from `outcome` so active runs are retention-safe
while rendering INCOMPLETE.

- [ ] **Step 4: Run model and reducer tests**

Run: `node --test tests/metrics/model.test.mjs tests/metrics/reducer-*.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics/model.mjs tests/metrics/model.test.mjs tests/metrics/fixtures.mjs
git commit -m "feat(metrics): calculate lifecycle metrics"
```

---

### Task 6: Shared terminal, Markdown, and JSON rendering

**Files:**

- Create: `lib/metrics/render-terminal.mjs`
- Create: `lib/metrics/render-markdown.mjs`
- Create: `lib/metrics/render-json.mjs`
- Create: `tests/metrics/renderers.test.mjs`
- Create: `tests/metrics/golden/pass-terminal.txt`
- Create: `tests/metrics/golden/pass-report.md`
- Create: `tests/metrics/golden/pass.json`
- Create: `tests/metrics/golden/blocked-report.md`
- Create: `tests/metrics/golden/incomplete-report.md`

**Interfaces:**

- Consumes: Task 5 reduced model only.
- Produces: `renderTerminal(model)`, `renderMarkdown(model)`, and
  `renderJson(model)`; each returns a string ending in one newline.

- [ ] **Step 1: Write failing byte-for-byte renderer tests**

In `tests/metrics/fixtures.mjs`, export `passModel()`, `blockedModel()`, and
`incompleteModel()` as complete reduced models built through Task 5. Define the
golden reader in the test as:

```js
const readGolden = name => readFileSync(
  new URL(`./golden/${name}`, import.meta.url),
  'utf8',
);
```

```js
for (const fixture of [
  ['pass-terminal.txt', renderTerminal, passModel()],
  ['pass-report.md', renderMarkdown, passModel()],
  ['pass.json', renderJson, passModel()],
  ['blocked-report.md', renderMarkdown, blockedModel()],
  ['incomplete-report.md', renderMarkdown, incompleteModel()],
]) {
  test(`matches ${fixture[0]}`, () => {
    assert.equal(fixture[1](fixture[2]), readGolden(fixture[0]));
  });
}

test('rendering is deterministic and does not expose raw events', () => {
  const first = renderMarkdown(passModel());
  assert.equal(renderMarkdown(passModel()), first);
  assert.doesNotMatch(first, /events\.jsonl|prompt|diff --git|command output/i);
});
```

The PASS terminal golden must exactly match the spec's headline layout. The
BLOCKED golden lists blocked tasks and stable finding IDs. The INCOMPLETE golden
lists diagnostic code plus line/sequence and never prints raw malformed text.

- [ ] **Step 2: Run renderer tests and verify RED**

Run: `node --test tests/metrics/renderers.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for the render modules.

- [ ] **Step 3: Implement presentation-only renderers**

Use a small shared `rows(model)` helper inside the terminal module and explicit
Markdown sections. JSON uses a recursive stable-key serializer; it serializes
the reduced model, not renderer-specific values. Do not read files or
recalculate metrics in renderers.

- [ ] **Step 4: Run renderer tests**

Run: `node --test tests/metrics/renderers.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics/render-*.mjs tests/metrics/renderers.test.mjs tests/metrics/golden
git commit -m "feat(metrics): render lifecycle reports"
```

---

### Task 7: Read-only CLI, run selection, and plan-hash warning

**Files:**

- Create: `lib/metrics/cli.mjs`
- Create: `bin/superpowers.mjs`
- Create: `tests/metrics/cli.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: Tasks 2–6.
- Produces: `runCli(argv, io)` and executable command
  `superpowers metrics <plan-path> [--run ID] [--json] [--write]`.
- `io` is `{cwd,stdout,stderr}` for tests; CLI returns 0, 1, or 2.

- [ ] **Step 1: Write failing CLI tests against temporary repositories**

Spawn `process.execPath` with `bin/superpowers.mjs` and assert:

```js
const CLI_PATH = fileURLToPath(new URL('../../bin/superpowers.mjs', import.meta.url));
const runCliProcess = (cwd, args) => spawnSync(process.execPath, [CLI_PATH, ...args], {
  cwd,
  encoding: 'utf8',
});
const snapshotTree = root => snapshotFiles(root, {
  exclude: ['.git'],
  includeContents: true,
});

let root;
let olderRun;
let reportPath;
beforeEach(t => {
  root = createRepo(t);
  ({olderRun, reportPath} = seedLatestPassAndOlderBlockedRuns(root));
});
```

Implement `snapshotFiles` in `tests/metrics/fixtures.mjs` with sorted,
repository-relative POSIX paths, file type/mode/content, and no timestamps.
`seedLatestPassAndOlderBlockedRuns(root)` writes two valid Task 1 run stores
for `PLAN_PATH`, returns the older ID plus canonical report path, and makes the
PASS run newer by `created_at` rather than filesystem mtime.
`seedIncompleteRunThenChangePlan(root)` writes one valid but nonterminal stream,
then changes the plan bytes without adding a plan-adjustment event.

```js
test('default command selects latest run, prints terminal output, and is read-only', () => {
  const before = snapshotTree(root);
  const result = runCliProcess(root, ['metrics', PLAN_PATH]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Feature: foo[\s\S]*Outcome: PASS/);
  assert.equal(result.stderr, '');
  assert.deepEqual(snapshotTree(root), before);
});

test('--run selects a retained run and --json emits JSON only', () => {
  const result = runCliProcess(root, ['metrics', PLAN_PATH, '--run', olderRun, '--json']);
  assert.equal(JSON.parse(result.stdout).run.run_id, olderRun);
  assert.equal(result.stderr, '');
});

test('--write refuses a retained run that is not latest', () => {
  const result = runCliProcess(root, ['metrics', PLAN_PATH, '--run', olderRun, '--write']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--write.*latest run/i);
  assert.equal(existsSync(reportPath), false);
});

test('missing runs and invalid options exit 2 without writes', (t) => {
  const emptyRoot = createRepo(t);
  assert.equal(runCliProcess(emptyRoot, ['metrics', PLAN_PATH]).status, 2);
  assert.equal(runCliProcess(root, ['metrics', PLAN_PATH, '--wat']).status, 2);
});

test('incomplete evidence exits 1 and a changed plan emits a model warning', (t) => {
  const incompleteRoot = createRepo(t);
  seedIncompleteRunThenChangePlan(incompleteRoot);
  const result = runCliProcess(incompleteRoot, ['metrics', PLAN_PATH, '--json']);
  assert.equal(result.status, 1);
  assert.match(JSON.parse(result.stdout).warnings[0].code, /PLAN_FINGERPRINT_CHANGED/);
});
```

- [ ] **Step 2: Run CLI tests and verify RED**

Run: `node --test tests/metrics/cli.test.mjs`

Expected: FAIL because `bin/superpowers.mjs` does not exist.

- [ ] **Step 3: Implement parser and executable**

`bin/superpowers.mjs` contains only the shebang, import, call, and exit status:

```js
#!/usr/bin/env node
import { runCli } from '../lib/metrics/cli.mjs';

const status = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: process.stdout,
  stderr: process.stderr,
});
process.exitCode = status;
```

Add:

```json
"bin": {
  "superpowers": "./bin/superpowers.mjs"
}
```

Mark the entry point executable before running or staging it:

```bash
chmod +x bin/superpowers.mjs
```

The parser accepts options in any order after the plan path, rejects repeated
single-value flags, and rejects `--write --run ID` when ID is not latest.
Operational errors print one concise `superpowers metrics: ...` line to stderr.

- [ ] **Step 4: Run CLI tests and command smoke checks**

Run: `node --test tests/metrics/cli.test.mjs`

Expected: PASS with 0 failures.

Run: `node bin/superpowers.mjs metrics --help`

Expected: usage text and exit 0.

- [ ] **Step 5: Commit**

```bash
git add bin/superpowers.mjs lib/metrics/cli.mjs package.json tests/metrics/cli.test.mjs
git commit -m "feat(metrics): add lifecycle report CLI"
```

---

### Task 8: Markdown writing and conservative retention

**Files:**

- Modify: `lib/metrics/store.mjs`
- Modify: `lib/metrics/cli.mjs`
- Create: `tests/metrics/write-retention.test.mjs`

**Interfaces:**

- Produces: `writeReport(identity, markdown)` and
  `applyRetention(identity, classifiedRuns, limit = RETENTION_TERMINAL_LIMIT)`.
- `writeReport` returns `{reportPath, changed}` and uses same-directory temp +
  rename for atomic replacement.
- `applyRetention` returns `{deleted, preserved, diagnostics}`.

- [ ] **Step 1: Write failing report and retention tests**

```js
test('--write creates the nested report deterministically then preserves it unchanged', () => {
  const first = runCliProcess(root, ['metrics', PLAN_PATH, '--write']);
  assert.equal(first.status, 0);
  assert.equal(readFileSync(reportPath, 'utf8'), expectedMarkdown);
  const firstStat = statSync(reportPath).mtimeMs;
  const second = runCliProcess(root, ['metrics', PLAN_PATH, '--write']);
  assert.equal(second.status, 0);
  assert.equal(statSync(reportPath).mtimeMs, firstStat);
});

test('retention keeps all active and blocked plus five newest pass/incomplete runs', () => {
  const result = applyRetention(identity, runs, 5);
  assert.deepEqual(result.deleted.sort(), ['pass-1', 'pass-2']);
  assert(result.preserved.includes('active-1'));
  assert(result.preserved.includes('blocked-1'));
});

test('retention preserves malformed, unclassifiable, and symlinked run directories', () => {
  const result = applyRetention(identity, unsafeRuns, 5);
  assert.deepEqual(result.deleted, []);
  assert.deepEqual(result.diagnostics.map(d => d.code).sort(), [
    'RETENTION_RUN_UNCLASSIFIABLE', 'RETENTION_SYMLINK_REFUSED',
  ]);
});
```

Also prove default and `--json` without `--write` do not create directories,
`--json --write` emits JSON and writes Markdown, and a write failure exits 2
without damaging an existing report.

- [ ] **Step 2: Run write/retention tests and verify RED**

Run: `node --test tests/metrics/write-retention.test.mjs`

Expected: FAIL because `writeReport`/`applyRetention` are not exported.

- [ ] **Step 3: Implement atomic writing and explicit-target retention**

Before deletion, require: directory is a direct child of the validated plan
root, basename equals validated run ID, `lstat` says directory and not symlink,
metadata/reduction classify it safely, and it is not active/BLOCKED. Delete one
explicit path with `rmSync(target, {recursive:true})`; never use a glob.

- [ ] **Step 4: Run all deterministic metrics tests**

Run: `node --test tests/metrics/*.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics/store.mjs lib/metrics/cli.mjs tests/metrics/write-retention.test.mjs
git commit -m "feat(metrics): write reports and retain runs"
```

---

### Task 9: Ship the CLI runtime in Codex packages and document manual use

**Files:**

- Modify: `scripts/package-codex-plugin.sh`
- Modify: `tests/codex/test-package-codex-plugin.sh`
- Modify: `scripts/sync-to-codex-plugin.sh`
- Modify: `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`
- Modify: `README.md`

**Interfaces:**

- Consumes: Task 7 `bin/` and Tasks 1–8 `lib/metrics/`.
- Produces: archives/synced plugins containing both paths while still excluding
  `package.json`; `node bin/superpowers.mjs` works because every module is
  explicit `.mjs`.

- [ ] **Step 1: Write failing package assertions**

In `test-package-codex-plugin.sh`, remove `^lib/` from the unexpected pattern
and add:

```bash
assert_contains "$archive_paths" "bin/superpowers.mjs" "archive includes metrics CLI"
assert_contains "$archive_paths" "lib/metrics/cli.mjs" "archive includes metrics runtime"
if [[ -x "$extracted/bin/superpowers.mjs" ]]; then
  pass "archive preserves metrics CLI executable mode"
else
  fail "archive preserves metrics CLI executable mode"
fi
```

Extend the sync-test fixture with tracked `bin/superpowers.mjs` and
`lib/metrics/cli.mjs`, then assert the preview/apply destination contains both.

- [ ] **Step 2: Run packaging tests and verify RED**

Run: `bash tests/codex/test-package-codex-plugin.sh`

Expected: FAIL because the archive omits `bin/` and `lib/`.

Run: `bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`

Expected: FAIL because sync excludes `lib/`.

- [ ] **Step 3: Include runtime paths with minimal packaging changes**

Add `bin` and `lib` to the `git archive` path list in
`package-codex-plugin.sh`, remove `^lib/` from its unexpected-path check, and
update usage prose. Remove only `"/lib/"` from sync `EXCLUDES`; keep
`/package.json`, `/scripts`, `/tests`, and `/docs` excluded.

- [ ] **Step 4: Add README usage and degradation text**

Document:

```text
superpowers metrics docs/superpowers/plans/foo.md
superpowers metrics docs/superpowers/plans/foo.md --json
superpowers metrics docs/superpowers/plans/foo.md --write
```

State that package install/link exposes the command, plugin workflows invoke
the shipped relative entry point, events remain available without Node, and
the command is local/offline.

- [ ] **Step 5: Run packaging and syntax gates**

Run: `bash tests/codex/test-package-codex-plugin.sh`

Expected: PASS.

Run: `bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`

Expected: PASS.

Run: `node --check bin/superpowers.mjs && find lib/metrics -name '*.mjs' -print0 | xargs -0 -n1 node --check`

Expected: all exit 0.

- [ ] **Step 6: Commit**

```bash
git add scripts/package-codex-plugin.sh scripts/sync-to-codex-plugin.sh \
  tests/codex/test-package-codex-plugin.sh \
  tests/codex-plugin-sync/test-sync-to-codex-plugin.sh README.md
git commit -m "build(metrics): ship report runtime"
```

---

### Task 10: Create behavior scenarios and capture RED baselines before skill edits

**Files (separate `evals/` repository):**

- Modify: `src/setup-helpers/sdd-fixtures.ts`
- Modify: `src/setup-helpers/registry.ts`
- Modify: `test/setup-helpers-sdd.test.ts`
- Create: `scenarios/sdd-metrics-happy-path/story.md`
- Create: `scenarios/sdd-metrics-happy-path/setup.sh`
- Create: `scenarios/sdd-metrics-happy-path/checks.sh`
- Create: `scenarios/sdd-metrics-resume/story.md`
- Create: `scenarios/sdd-metrics-resume/setup.sh`
- Create: `scenarios/sdd-metrics-resume/checks.sh`
- Create: `scenarios/sdd-metrics-report-failure/story.md`
- Create: `scenarios/sdd-metrics-report-failure/setup.sh`
- Create: `scenarios/sdd-metrics-report-failure/checks.sh`
- Create: `docs/experiments/2026-08-sdd-lifecycle-metrics.md`

**Interfaces:**

- Produces: three validated Quorum scenarios and recorded RED run IDs.
- Produces setup helper `scaffold_sdd_metrics_blocked_resume` for a valid,
  reproducible blocked-resume starting state.
- This task modifies no Superpowers skill. If `evals/` is absent, clone
  `https://github.com/prime-radiant-inc/superpowers-evals.git` there and read
  its `AGENTS.md` plus `docs/scenario-authoring.md` before editing.

- [ ] **Step 1: Prepare and statically verify the eval checkout**

Run: `cd evals && bun install && bun run check && bun run quorum check`

Expected: all PASS before adding scenarios. Live runs remain trusted-maintainer
operations and require explicit credentials; never add them to public CI.

- [ ] **Step 2: Scaffold the three scenarios**

Run:

```bash
cd evals
bun run quorum new sdd-metrics-happy-path
bun run quorum new sdd-metrics-resume
bun run quorum new sdd-metrics-report-failure
```

Each `story.md` must give the Gauntlet-Agent an exact opening message, neutral
answers, a stop condition, and acceptance criteria. Use these observable gates:

- happy path: one elicited two-task plan completes; canonical run/events files
  exist; `node <superpowers-root>/bin/superpowers.mjs metrics <plan> --json`
  returns PASS; tracked report exists in a separate commit before the agent
  selects “keep branch as-is”.
- resume: helper fixture begins with a valid blocked run ending at sequence N and an
  SDD ledger naming its run ID; the agent resumes the same directory, first new
  event is N+1 `run_resumed`, and no second run directory appears.
- report failure: create a regular file at `docs/superpowers/reports` so nested
  report creation fails deterministically with `ENOTDIR`, while event
  storage remains writable; the agent surfaces the report failure, preserves
  events, and still reaches the existing finishing choice after green code
  tests/review.

Happy-path and report-failure `setup.sh` use
`setup-helpers run scaffold_sdd_yagni_plan`. Resume uses
`setup-helpers run scaffold_sdd_metrics_blocked_resume`. Implement that helper
by reusing the YAGNI project/plan scaffold, then seed the plan-scoped progress
ledger with `Metrics run: <run-id>`, a valid `run.json`, and valid JSONL ending
in `run_blocked` at sequence N. Register the exact snake-case name and add a
setup-helper unit test that invokes the shipped metrics CLI to validate the
seeded run before Quorum uses it. Every `checks.sh` contains only `pre()` and
`post()`, is non-executable, guards Node with `requires-tool node`, and asserts
filesystem/Git outcomes independently of the story grader.

- [ ] **Step 3: Validate scenario structure**

Run: `cd evals && bun run quorum check`

Expected: PASS, including all three new scenario directories.

- [ ] **Step 4: Run RED against the pre-skill commit**

Create a temporary worktree at the Task 9 commit (the runtime exists, but the
SDD/finishing skills are still unmodified), then run each scenario with the
configured coding agent:

```bash
METRICS_FEATURE_ROOT=$(git rev-parse --show-toplevel)
METRICS_BASELINE_SHA=$(git rev-parse HEAD)
METRICS_BASELINE_PARENT=$(mktemp -d)
METRICS_BASELINE_ROOT="$METRICS_BASELINE_PARENT/superpowers"
git worktree add --detach "$METRICS_BASELINE_ROOT" "$METRICS_BASELINE_SHA"
cd "$METRICS_FEATURE_ROOT/evals"
SUPERPOWERS_ROOT="$METRICS_BASELINE_ROOT" bun run quorum run scenarios/sdd-metrics-happy-path --coding-agent codex
SUPERPOWERS_ROOT="$METRICS_BASELINE_ROOT" bun run quorum run scenarios/sdd-metrics-resume --coding-agent codex
SUPERPOWERS_ROOT="$METRICS_BASELINE_ROOT" bun run quorum run scenarios/sdd-metrics-report-failure --coding-agent codex
cd "$METRICS_FEATURE_ROOT"
git worktree remove "$METRICS_BASELINE_ROOT"
rmdir "$METRICS_BASELINE_PARENT"
```

Expected: graded FAIL because current SDD/finishing emits no lifecycle events.
An indeterminate run is an environment/scenario defect to triage, not RED
evidence. If a scenario unexpectedly passes, tighten its independent checks
before changing skill text.

- [ ] **Step 5: Record and commit RED evidence in the eval repo**

The experiment note records scenario name, coding agent/model/harness version,
Superpowers SHA, run ID, final verdict, exact missing behavior, and scenario
fixes. Do not commit raw `results/`.

```bash
cd evals
git add src/setup-helpers/sdd-fixtures.ts src/setup-helpers/registry.ts \
  test/setup-helpers-sdd.test.ts scenarios/sdd-metrics-* \
  docs/experiments/2026-08-sdd-lifecycle-metrics.md
git commit -m "test(sdd): add lifecycle metrics scenarios"
```

---

### Task 11: Add runtime-neutral SDD event recipes and instrument SDD

**Files:**

- Create: `skills/subagent-driven-development/metrics-events.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Create: `tests/claude-code/test-sdd-metrics-instructions.sh`

**Interfaces:**

- Consumes: Task 1 schema names and Task 10 observed RED failures.
- Produces: controller-authored `run.json`/`events.jsonl`, ledger line
  `Metrics run: <run-id>`, and final-review evidence; does not alter implementer
  or reviewer prompt contracts.

- [ ] **Step 1: Write failing static contract tests**

The shell test asserts:

```bash
grep -q 'metrics-events.md' skills/subagent-driven-development/SKILL.md
grep -q 'Metrics run: <run-id>' skills/subagent-driven-development/SKILL.md
grep -q 'run_started' skills/subagent-driven-development/metrics-events.md
grep -q 'task_implementation_review_result' skills/subagent-driven-development/metrics-events.md
grep -q 'task_quality_review_result' skills/subagent-driven-development/metrics-events.md
grep -q 'final_review_result' skills/subagent-driven-development/metrics-events.md
```

Add a Node consistency assertion that extracts backticked event names from the
reference's canonical table and deep-compares them to `EVENT_TYPES`.

- [ ] **Step 2: Run the static test and verify RED**

Run: `bash tests/claude-code/test-sdd-metrics-instructions.sh`

Expected: FAIL because the reference and skill wiring do not exist.

- [ ] **Step 3: Micro-test the event recipe wording before editing the skill**

Run at least five fresh-context no-guidance controls and five candidate-recipe
samples for: new run initialization, one initial review with two verdicts,
finding reuse through rereview, and blocked resume. Manually score exact JSON
shape, sequence, stable IDs, forbidden-content absence, and continuation after
recording failure. Include Node-unavailable finalization in both groups and
require the candidate to preserve events, continue SDD, and print exactly the
deferred command `node <plugin-root>/bin/superpowers.mjs metrics <plan-path>`.
Keep only wording that improves convergence over control. Record all five
control and five candidate outcomes per case in the sanitized experiment note.

- [ ] **Step 4: Write the canonical authoring reference**

`metrics-events.md` contains:

- exact `run.json` shape and path-mirroring recipe;
- one-line envelope template with `event_id = <run-id>:<sequence>`;
- all 27 payload templates and enum values;
- task IDs `task-<positive integer>` and findings `F-001` upward;
- resume recipe: read run metadata + last physical lines, retry only an
  identical uncertain event, otherwise append next sequence;
- bounded data rules and explicit forbidden fields;
- failure recipe: ledger the failure, continue development, never fabricate a
  replacement success event;
- Node-unavailable deferred command using the shipped relative
  `bin/superpowers.mjs`.

- [ ] **Step 5: Add minimal SDD attachment points**

Without rewording unrelated tuned prose, add recipes at setup, dispatch/report,
review, fix round, acceptance/blocking, final review, and handoff. SDD retains
its plan workspace after final-review PASS, passes plan/run identity into
`finishing-a-development-branch`, and deletes nothing before finishing. A
genuine SDD blocker writes a BLOCKED report when possible and preserves the SDD
workspace.

- [ ] **Step 6: Run deterministic/static gates**

Run: `bash tests/claude-code/test-sdd-metrics-instructions.sh`

Expected: PASS.

Run: `node --test tests/metrics/*.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 7: Commit**

```bash
git add skills/subagent-driven-development/metrics-events.md skills/subagent-driven-development/SKILL.md tests/claude-code/test-sdd-metrics-instructions.sh
git commit -m "feat(sdd): record lifecycle events"
```

---

### Task 12: Integrate final verification, report commit, and cleanup into finishing

**Files:**

- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `tests/claude-code/test-sdd-metrics-instructions.sh`
- Create: `tests/metrics/finishing-git.test.mjs`

**Interfaces:**

- Consumes: active metrics plan/run identity from Task 11 and Task 7 CLI.
- Produces: `final_test_result`, terminal run event, report write, optional
  separate PASS report commit, and delayed SDD workspace cleanup.
- Existing finishing menus and branch/worktree cleanup behavior remain exact.

- [ ] **Step 1: Extend the static test with failing finishing-order assertions**

Require the finishing skill to contain the active-run branch and verify the
relative order of these markers by line number: `final_test_result`,
`run_passed`, `--write --json`, `git commit --only`, SDD workspace removal,
then `Present Options`. Also assert failure branches contain `run_blocked`, keep
the report uncommitted, and preserve the workspace after failed final tests.

- [ ] **Step 2: Run the static instruction test and verify RED**

Run: `bash tests/claude-code/test-sdd-metrics-instructions.sh`

Expected: FAIL because finishing has no metrics branch or ordering markers.

- [ ] **Step 3: Add finishing instrumentation after the existing full test command**

For an active SDD metrics run:

1. append `final_test_result` with counts only when reliable;
2. on test failure append `run_blocked`, invoke CLI `--write`, leave report
   uncommitted, preserve SDD workspace, and stop under current rules;
3. on test success + final-review PASS append `run_passed`;
4. run `node <plugin-root>/bin/superpowers.mjs metrics <plan> --write --json`;
5. if JSON outcome is PASS and report changed, commit only the report with
   `git commit --only -m "docs(metrics): update <feature> report" -- <report>`;
6. report write/commit/Node failures visibly without suppressing the existing
   integration menu;
7. delete only the named SDD plan workspace after event persistence and report
   attempt when development itself is complete.

The skill must say that routine non-SDD finishing has no metrics branch and
follows its current steps unchanged.

- [ ] **Step 4: Add and run a Git-isolation compatibility test**

In a temporary repository, create an unrelated staged file, unrelated unstaged
file, and generated report. Execute the exact `git commit --only` sequence from
the skill, then assert:

```js
assert.deepEqual(commitPaths(root, 'HEAD'), ['docs/superpowers/reports/foo.md']);
assert.deepEqual(stagedPaths(root), ['unrelated-staged.txt']);
assert.deepEqual(unstagedPaths(root), ['unrelated-unstaged.txt']);
```

Define these test helpers with `execFileSync('git', argv, {cwd: root})` only:
`commitPaths` parses `git diff-tree --no-commit-id --name-only -r <ref>`,
`stagedPaths` parses `git diff --cached --name-only`, and `unstagedPaths`
parses `git diff --name-only`; each filters blank lines and sorts POSIX paths.

Also simulate missing Git identity/commit-hook failure and assert the report
still exists, unrelated index state is unchanged, and no success-report commit
exists. Run: `node --test tests/metrics/finishing-git.test.mjs`.

Expected: PASS with the exact subject `docs(metrics): update foo report`.

- [ ] **Step 5: Run deterministic gates**

Run: `node --test tests/metrics/finishing-git.test.mjs tests/metrics/*.test.mjs`

Expected: PASS with 0 failures.

Run: `bash tests/claude-code/test-sdd-metrics-instructions.sh`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md tests/claude-code/test-sdd-metrics-instructions.sh tests/metrics/finishing-git.test.mjs
git commit -m "feat(metrics): finalize SDD reports"
```

---

### Task 13: GREEN evals, cross-platform checks, and real pilot lifecycle

**Files:**

- Create: `docs/superpowers/specs/2026-08-18-sdd-lifecycle-metrics-eval-results.md`
- Modify: `evals/docs/experiments/2026-08-sdd-lifecycle-metrics.md` in the
  separate eval repository.

**Interfaces:**

- Consumes: all prior tasks and Task 10 RED run IDs.
- Produces: release-reviewable behavior evidence and a verified pilot report;
  raw transcripts/results remain ignored and private.

- [ ] **Step 1: Run complete deterministic verification**

Run:

```bash
node --test tests/metrics/*.test.mjs
bash tests/claude-code/test-sdd-workspace.sh
bash tests/claude-code/test-sdd-metrics-instructions.sh
bash tests/codex/test-package-codex-plugin.sh
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
bash scripts/lint-shell.sh
```

Expected: every command PASS with zero failures and pristine output.

- [ ] **Step 2: Run Windows compatibility checks**

On Windows Node.js, run the metrics suite and CLI E2E tests with a plan path
containing spaces. Record Node/Windows versions and confirm POSIX plan paths,
UTF-8 table output, Git subprocess argument handling, and report paths. A
missing Windows environment is an explicit unverified compatibility item, not
a claimed pass.

- [ ] **Step 3: Run GREEN behavior scenarios**

```bash
METRICS_FEATURE_ROOT=$(git rev-parse --show-toplevel)
cd "$METRICS_FEATURE_ROOT/evals"
SUPERPOWERS_ROOT="$METRICS_FEATURE_ROOT" bun run quorum run scenarios/sdd-metrics-happy-path --coding-agent codex
SUPERPOWERS_ROOT="$METRICS_FEATURE_ROOT" bun run quorum run scenarios/sdd-metrics-resume --coding-agent codex
SUPERPOWERS_ROOT="$METRICS_FEATURE_ROOT" bun run quorum run scenarios/sdd-metrics-report-failure --coding-agent codex
```

Expected: all final verdicts PASS. Triage non-pass with the eval repository's
current triage guide before changing skill wording. Re-run any changed scenario
against both baseline and feature to preserve RED/GREEN evidence.

- [ ] **Step 4: Run existing SDD regression scenarios**

Use the current scenario names returned by `bun run quorum list`; at minimum run
the existing quality-defect, YAGNI/spec-constraint, broken-plan, and finishing
scenarios supported by the selected coding agent. Expected: all PASS. Record
the exact names and run IDs rather than claiming a broad suite not run.

- [ ] **Step 5: Perform one real local pilot lifecycle**

Execute a small two-task implementation plan through real SDD and finishing.
Verify from persistent artifacts and Git:

```bash
node bin/superpowers.mjs metrics <pilot-plan> --json
node bin/superpowers.mjs metrics <pilot-plan>
git show --stat --oneline HEAD
test ! -d .superpowers/sdd/<pilot-plan-basename>
test -f .superpowers/metrics/<mirrored-pilot-plan>/<run-id>/events.jsonl
test -f docs/superpowers/reports/<pilot-report>.md
```

Expected: JSON/terminal/Markdown agree; outcome PASS; report is the only file in
its separate commit; events survive SDD cleanup; default CLI invocation changes
no file.

- [ ] **Step 6: Write sanitized evidence documents**

The Superpowers eval-results document contains: environment table; deterministic
commands and counts; RED vs GREEN scenario verdicts/run IDs; wording micro-test
sample counts and manual scoring; regression results; pilot paths/commit; Node
absence/report failure evidence; Windows result or explicit gap; no raw prompts,
transcripts, secrets, or unrestricted reviewer text.
Include the Node-unavailable five-control/five-candidate micro-test results and
the exact deferred command as the V1 degradation evidence; a separate live
Quorum run without Node is not required unless the local harness can provide it
reproducibly.

- [ ] **Step 7: Commit evidence in each repository**

```bash
git add docs/superpowers/specs/2026-08-18-sdd-lifecycle-metrics-eval-results.md
git commit -m "test(metrics): document lifecycle evals"
```

In `evals/`, commit only the sanitized experiment note and scenario changes;
never commit `results/`.

- [ ] **Step 8: Review the complete diff with the human partner**

Show `git diff dev...HEAD`, the commit list, deterministic verification output,
and sanitized eval evidence. Do not push or open a PR. Upstream consideration
requires a separate duplicate-PR search, real experienced-failure evidence,
full PR template, environment/plugin disclosure, and explicit human approval.
