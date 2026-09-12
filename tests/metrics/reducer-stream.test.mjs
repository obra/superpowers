import assert from 'node:assert/strict';
import test from 'node:test';
import { reduceRun } from '../../lib/metrics/reducer.mjs';
import { buildReducedModel } from '../../lib/metrics/model.mjs';
import {
  RUN_ID, activeRunEvents, blockedRunEvents, makeEvent, makeRun, numberLines,
  passingRunEvents, SECOND_FINGERPRINT, FINGERPRINT, nineTaskPassEvents, toLines, validTaskDispatchPayload,
} from './fixtures.mjs';

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

test('deduplicates a byte-identical retry of the same event id', () => {
  const first = makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' });
  const reduced = reduceRun(makeRun(), toLines([first, first]));
  assert.deepEqual(reduced.diagnostics, []);
});

test('rejects a non-byte-identical retry of the same event id', () => {
  const event = makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' });
  const original = JSON.stringify(event);
  const reordered = JSON.stringify(Object.fromEntries(Object.entries(event).reverse()));
  const reduced = reduceRun(makeRun(), numberLines([original, reordered]));

  assert.deepEqual(reduced.diagnostics.map(diagnostic => diagnostic.code), ['EVENT_ID_CONFLICT']);
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

test('preserves identity and schema diagnostics without repairing sequence gaps', () => {
  const events = activeRunEvents();
  events[1] = makeEvent(2, 'plan_registered', { task_count: 1 }, { run_id: '20260818T120000Z-ffffffffff-7f31c9ab', event_id: '20260818T120000Z-ffffffffff-7f31c9ab:2' });
  events[2] = makeEvent(3, 'not_known', {}, { schema_version: 2 });
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics.map(d => d.code), [
    'EVENT_RUN_ID_MISMATCH', 'EVENT_SCHEMA_VERSION_UNSUPPORTED', 'EVENT_TYPE_UNSUPPORTED', 'SEQUENCE_GAP',
  ]);
});

test('requires sequence one and exactly one run_started event', () => {
  const firstIsTwo = reduceRun(makeRun(), toLines([
    makeEvent(2, 'run_started', { trigger: 'NEW_PLAN' }),
  ]));
  const twiceStarted = reduceRun(makeRun(), toLines([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'run_started', { trigger: 'MANUAL_START' }),
  ]));
  assert.deepEqual(firstIsTwo.diagnostics.map(d => d.code), ['SEQUENCE_INITIAL_INVALID']);
  assert.deepEqual(twiceStarted.diagnostics.map(d => d.code), ['RUN_STARTED_DUPLICATE']);
});

test('requires a passing preflight before dispatch and a resume after failed preflight', () => {
  const beforePass = activeRunEvents().slice(0, 3);
  beforePass.push(makeEvent(4, 'task_dispatched', validTaskDispatchPayload()));
  const failed = activeRunEvents().slice(0, 3);
  failed.push(
    makeEvent(4, 'preflight_completed', { result: 'FAIL', diagnostic_codes: ['BAD_PLAN'] }),
    makeEvent(5, 'run_resumed', { previous_outcome: 'INCOMPLETE', reason_code: 'WORKFLOW_RESUMED' }),
    makeEvent(6, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] }),
    makeEvent(7, 'task_dispatched', validTaskDispatchPayload()),
  );
  assert.deepEqual(reduceRun(makeRun(), toLines(beforePass)).diagnostics.map(d => d.code), ['PREFLIGHT_PASS_REQUIRED']);
  assert.deepEqual(reduceRun(makeRun(), toLines(failed)).diagnostics.map(d => d.code), []);
});

test('requires passing final review and test evidence before run_passed', () => {
  const events = activeRunEvents();
  events.push(makeEvent(5, 'run_passed', { basis: 'FINAL_TEST_AND_REVIEW_PASS' }));
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics.map(d => d.code), ['RUN_PASS_PREREQUISITES_MISSING']);
  assert.equal(reduced.state.explicit_outcome, null);
  assert.equal(reduced.state.lifecycle_state, 'ACTIVE');
});

test('requires a resume after failed preflight before later preflight evidence', () => {
  const events = activeRunEvents().slice(0, 3);
  events.push(
    makeEvent(4, 'preflight_completed', { result: 'FAIL', diagnostic_codes: ['BAD_PLAN'] }),
    makeEvent(5, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] }),
  );
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics.map(d => d.code), ['RUN_RESUME_REQUIRED']);
  assert.equal(reduced.state.lifecycle_state, 'RESUMABLE');
});

test('requires accepted passing preflight evidence before run_passed', () => {
  const events = activeRunEvents().slice(0, 3);
  events.push(
    makeEvent(4, 'final_review_result', { result: 'PASS', review_id: 'final-review-1', finding_ids: [] }),
    makeEvent(5, 'final_test_result', { result: 'PASS', evidence_kind: 'COUNTS', passed: 1, total: 1 }),
    makeEvent(6, 'run_passed', { basis: 'FINAL_TEST_AND_REVIEW_PASS' }),
  );
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics.map(d => d.code), ['RUN_PASS_PREREQUISITES_MISSING']);
  assert.equal(reduced.state.explicit_outcome, null);
});

test('rejects PASS when plan registration has no matching initial task evidence', () => {
  const events = [
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] }),
    makeEvent(4, 'final_review_result', { result: 'PASS', review_id: 'final-review-1', finding_ids: [] }),
    makeEvent(5, 'final_test_result', { result: 'PASS', evidence_kind: 'COUNTS', passed: 1, total: 1 }),
    makeEvent(6, 'run_passed', { basis: 'FINAL_TEST_AND_REVIEW_PASS' }),
  ];
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.ok(reduced.diagnostics.some(diagnostic => diagnostic.code === 'INITIAL_TASK_COUNT_MISMATCH'));
  assert.equal(reduced.state.explicit_outcome, null);
  assert.equal(buildReducedModel(reduced).outcome, 'INCOMPLETE');
});

test('rejects duplicate plan registration and mismatched event identity before PASS', () => {
  const duplicate = activeRunEvents();
  duplicate.splice(2, 0, makeEvent(3, 'plan_registered', { task_count: 1 }));
  duplicate[3] = makeEvent(4, 'task_registered', { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' });
  duplicate[4] = makeEvent(5, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] });
  assert.ok(reduceRun(makeRun(), toLines(duplicate)).diagnostics.some(diagnostic => diagnostic.code === 'PLAN_REGISTERED_DUPLICATE'));

  const forged = nineTaskPassEvents().map(line => JSON.parse(line.text));
  forged[3] = { ...forged[3], feature: 'other', plan_path: 'docs/superpowers/plans/other.md', plan_fingerprint: SECOND_FINGERPRINT };
  const reduced = reduceRun(makeRun(), toLines(forged));
  assert.deepEqual(reduced.diagnostics[0].code, 'EVENT_FEATURE_MISMATCH');
  assert.equal(buildReducedModel(reduced).outcome, 'INCOMPLETE');
});

test('rejects each event identity mismatch without applying the event', () => {
  const cases = [
    ['feature', 'other', 'EVENT_FEATURE_MISMATCH'],
    ['plan_path', 'docs/superpowers/plans/other.md', 'EVENT_PLAN_PATH_MISMATCH'],
    ['plan_fingerprint', SECOND_FINGERPRINT, 'EVENT_PLAN_FINGERPRINT_MISMATCH'],
  ];

  for (const [field, value, expectedCode] of cases) {
    const events = activeRunEvents();
    const preflightIndex = events.findIndex(event => event.event_type === 'preflight_completed');
    events[preflightIndex] = { ...events[preflightIndex], [field]: value };
    events.push(makeEvent(4, 'task_dispatched', validTaskDispatchPayload()));
    const reduced = reduceRun(makeRun(), toLines(events));

    assert.deepEqual(reduced.diagnostics.map(diagnostic => diagnostic.code), [expectedCode, 'PREFLIGHT_PASS_REQUIRED'], field);
    assert.equal(reduced.tasks.get('task-1').dispatched, false, field);
  }
});

test('rejects a plan adjustment that does not extend the accepted revision', () => {
  const events = activeRunEvents();
  events.push(makeEvent(5, 'plan_task_added', {
    task_id: 'task-2', ordinal: 2, title: 'Added task', origin: 'ADDED',
    previous_fingerprint: SECOND_FINGERPRINT, new_fingerprint: FINGERPRINT, reason_code: 'PLAN_CORRECTION',
  }, { plan_fingerprint: SECOND_FINGERPRINT }));
  const reduced = reduceRun(makeRun(), toLines(events));

  assert.deepEqual(reduced.diagnostics.map(diagnostic => diagnostic.code), ['PLAN_ADJUSTMENT_PREVIOUS_FINGERPRINT_MISMATCH']);
  assert.equal(reduced.latestPlanFingerprint, FINGERPRINT);
  assert.equal(reduced.tasks.has('task-2'), false);
});

test('requires plan registration before initial task registration', () => {
  const task = { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' };
  const beforePlan = reduceRun(makeRun(), toLines([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'task_registered', task),
  ]));
  assert.deepEqual(beforePlan.diagnostics.map(diagnostic => diagnostic.code), ['INITIAL_TASK_REGISTRATION_PLAN_REQUIRED']);
  assert.equal(beforePlan.tasks.size, 0);
});

test('rejects plan registration after preflight without retaining it', () => {
  const task = { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' };
  const latePlan = reduceRun(makeRun(), toLines([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] }),
    makeEvent(3, 'plan_registered', { task_count: 1 }),
    makeEvent(4, 'task_registered', task),
  ]));
  assert.deepEqual(latePlan.diagnostics.map(diagnostic => diagnostic.code), [
    'PLAN_REGISTERED_REQUIRED',
    'PLAN_REGISTERED_ORDER_INVALID',
    'INITIAL_TASK_REGISTRATION_PLAN_REQUIRED',
  ]);
  assert.equal(latePlan.tasks.size, 0);
});

test('rejects ADDED origin for initial task registration without mutation', () => {
  const task = { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' };
  const wrongOrigin = reduceRun(makeRun(), toLines([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', { ...task, origin: 'ADDED' }),
  ]));
  assert.deepEqual(wrongOrigin.diagnostics.map(diagnostic => diagnostic.code), ['INITIAL_TASK_ORIGIN_INVALID']);
  assert.equal(wrongOrigin.tasks.size, 0);
});

test('rejects duplicate initial task registration without replacing the task', () => {
  const task = { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' };
  const duplicate = reduceRun(makeRun(), toLines([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', task),
    makeEvent(4, 'task_registered', task),
  ]));
  assert.deepEqual(duplicate.diagnostics.map(diagnostic => diagnostic.code), ['TASK_REGISTERED_DUPLICATE']);
  assert.equal(duplicate.tasks.size, 1);
  assert.equal(duplicate.tasks.get('task-1').title, 'First task');
});

test('rejects initial task registration after preflight without mutation', () => {
  const task = { task_id: 'task-1', ordinal: 1, title: 'First task', origin: 'INITIAL' };
  const tooLate = reduceRun(makeRun(), toLines([
    makeEvent(1, 'run_started', { trigger: 'NEW_PLAN' }),
    makeEvent(2, 'plan_registered', { task_count: 1 }),
    makeEvent(3, 'task_registered', task),
    makeEvent(4, 'preflight_completed', { result: 'PASS', diagnostic_codes: [] }),
    makeEvent(5, 'task_registered', { ...task, task_id: 'task-2', ordinal: 2 }),
  ]));
  assert.deepEqual(tooLate.diagnostics.map(diagnostic => diagnostic.code), ['INITIAL_TASK_REGISTRATION_TOO_LATE']);
  assert.deepEqual([...tooLate.tasks.keys()], ['task-1']);
});

test('run_incomplete makes the run resumable and rejects later events', () => {
  const events = activeRunEvents();
  events.push(
    makeEvent(5, 'run_incomplete', { reason_code: 'EVIDENCE_GAP' }),
    makeEvent(6, 'task_dispatched', validTaskDispatchPayload()),
  );
  const reduced = reduceRun(makeRun(), toLines(events));

  assert.deepEqual(reduced.diagnostics.map(diagnostic => diagnostic.code), ['RUN_RESUME_REQUIRED']);
  assert.equal(reduced.state.lifecycle_state, 'RESUMABLE');
  assert.equal(reduced.state.explicit_outcome, 'INCOMPLETE');
  assert.equal(reduced.tasks.get('task-1').dispatched, false);
});

test('run_resumed reopens an incomplete run and allows task dispatch', () => {
  const events = activeRunEvents();
  events.push(
    makeEvent(5, 'run_incomplete', { reason_code: 'EVIDENCE_GAP' }),
    makeEvent(6, 'run_resumed', { previous_outcome: 'INCOMPLETE', reason_code: 'WORKFLOW_RESUMED' }),
    makeEvent(7, 'task_dispatched', validTaskDispatchPayload()),
  );
  const reduced = reduceRun(makeRun(), toLines(events));

  assert.deepEqual(reduced.diagnostics, []);
  assert.equal(reduced.state.lifecycle_state, 'ACTIVE');
  assert.equal(reduced.state.explicit_outcome, null);
  assert.equal(reduced.tasks.get('task-1').dispatched, true);
});

test('does not reduce passing events when run metadata is invalid', () => {
  const reduced = reduceRun(makeRun({ feature: '' }), toLines(passingRunEvents()));
  assert.deepEqual(reduced.diagnostics.map(d => d.code), ['RUN_FEATURE_INVALID']);
  assert.equal(reduced.state.explicit_outcome, null);
  assert.equal(reduced.state.lifecycle_state, 'ACTIVE');
});

test('uses new plan fingerprints from accepted plan adjustments', () => {
  const events = activeRunEvents();
  events.push(
    makeEvent(5, 'plan_task_added', {
      task_id: 'task-2', ordinal: 2, title: 'Added task', origin: 'ADDED',
      previous_fingerprint: 'git-blob:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION',
    }),
    makeEvent(6, 'plan_task_changed', {
      task_id: 'task-1', ordinal: 1, title: 'Changed task',
      previous_fingerprint: SECOND_FINGERPRINT,
      new_fingerprint: FINGERPRINT, reason_code: 'PLAN_CORRECTION',
    }, { plan_fingerprint: SECOND_FINGERPRINT }),
    makeEvent(7, 'plan_task_superseded', {
      task_id: 'task-1', replacement_task_ids: ['task-2'],
      previous_fingerprint: FINGERPRINT,
      new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION',
    }),
  );
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics, []);
  assert.equal(reduced.latestPlanFingerprint, SECOND_FINGERPRINT);
});

test('rejects a plan adjustment whose envelope does not attest its previous revision', () => {
  const events = activeRunEvents();
  events.push(makeEvent(5, 'plan_task_added', {
    task_id: 'task-2', ordinal: 2, title: 'Added task', origin: 'ADDED',
    previous_fingerprint: FINGERPRINT, new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION',
  }, { plan_fingerprint: SECOND_FINGERPRINT }));
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics.map(diagnostic => diagnostic.code), ['PLAN_ADJUSTMENT_ENVELOPE_FINGERPRINT_MISMATCH']);
  assert.equal(reduced.latestPlanFingerprint, FINGERPRINT);
  assert.equal(reduced.tasks.has('task-2'), false);
});
