import assert from 'node:assert/strict';
import test from 'node:test';
import { reduceRun } from '../../lib/metrics/reducer.mjs';
import {
  RUN_ID, activeRunEvents, blockedRunEvents, makeEvent, makeRun, numberLines,
  passingRunEvents, SECOND_FINGERPRINT, toLines, validTaskDispatchPayload,
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

test('preserves identity and schema diagnostics without repairing sequence gaps', () => {
  const events = activeRunEvents();
  events[1] = makeEvent(2, 'plan_registered', { task_count: 1 }, { run_id: '20260818T120000Z-ffffffffff-7f31c9ab', event_id: '20260818T120000Z-ffffffffff-7f31c9ab:2' });
  events[2] = makeEvent(3, 'not_known', {}, { schema_version: 2 });
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics.map(d => d.code), [
    'EVENT_RUN_ID_MISMATCH', 'EVENT_SCHEMA_VERSION_UNSUPPORTED', 'EVENT_TYPE_UNSUPPORTED', 'SEQUENCE_GAP',
  ]);
  assert.equal(reduced.events.length, 1);
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

test('does not reduce passing events when run metadata is invalid', () => {
  const reduced = reduceRun(makeRun({ feature: '' }), toLines(passingRunEvents()));
  assert.deepEqual(reduced.diagnostics.map(d => d.code), ['RUN_FEATURE_INVALID']);
  assert.equal(reduced.events.length, 0);
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
      new_fingerprint: 'git-blob:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', reason_code: 'PLAN_CORRECTION',
    }),
    makeEvent(7, 'plan_task_superseded', {
      task_id: 'task-1', replacement_task_ids: ['task-2'],
      previous_fingerprint: 'git-blob:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      new_fingerprint: SECOND_FINGERPRINT, reason_code: 'PLAN_CORRECTION',
    }),
  );
  const reduced = reduceRun(makeRun(), toLines(events));
  assert.deepEqual(reduced.diagnostics, []);
  assert.equal(reduced.latestPlanFingerprint, SECOND_FINGERPRINT);
});
