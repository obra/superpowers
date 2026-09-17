import assert from 'node:assert/strict';
import test from 'node:test';
import { PAYLOAD_CONTRACTS, validateRunMetadata, validateEvent } from '../../lib/metrics/schema-v1.mjs';
import { EVENT_TYPES } from '../../lib/metrics/constants.mjs';
import { makeRun, makeEvent, MINIMAL_PAYLOADS } from './fixtures.mjs';

test('accepts canonical run metadata', () => assert.deepEqual(validateRunMetadata(makeRun()).diagnostics, []));
test('accepts SHA-1 and SHA-256 Git blob fingerprints consistently', () => {
  for (const fingerprint of [`git-blob:${'a'.repeat(40)}`, `git-blob:${'b'.repeat(64)}`]) {
    assert.deepEqual(validateRunMetadata(makeRun({ initial_plan_fingerprint: fingerprint })).diagnostics, [], fingerprint);
    assert.deepEqual(validateEvent(makeEvent(1, 'run_started', MINIMAL_PAYLOADS.run_started, { plan_fingerprint: fingerprint }), 1).diagnostics, [], fingerprint);
  }
});
test('rejects unknown run fields and unsafe run ids', () => {
  const result = validateRunMetadata(makeRun({ run_id: '../escape', extra: 1 }));
  assert.deepEqual(result.diagnostics.map(d => d.code), ['RUN_UNKNOWN_FIELD', 'RUN_ID_INVALID']);
});
test('event catalog has 27 entries', () => assert.equal(EVENT_TYPES.length, 27));
test('exports one frozen payload contract for every event type', () => {
  assert.deepEqual(Object.keys(PAYLOAD_CONTRACTS), EVENT_TYPES);
  assert.ok(Object.isFrozen(PAYLOAD_CONTRACTS));
  assert.deepEqual(PAYLOAD_CONTRACTS.task_test_result, {
    allowed: ['task_id', 'result', 'evidence_kind', 'passed', 'total'],
    required: ['task_id', 'result', 'evidence_kind'],
    optional: ['passed', 'total'],
    enums: { result: ['PASS', 'FAIL', 'UNKNOWN'], evidence_kind: ['COUNTS', 'EXIT_STATUS', 'UNINTERPRETABLE'] },
  });
  assert.deepEqual(PAYLOAD_CONTRACTS.fix_round_completed.enums['finding_results[].verdict'], ['ADDRESSED', 'NOT_ADDRESSED']);
});
test('accepts every v1 event type with its minimal payload', () => {
  for (const [eventType, payload] of Object.entries(MINIMAL_PAYLOADS)) assert.deepEqual(validateEvent(makeEvent(1, eventType, payload), 1).diagnostics, []);
});
test('rejects payload fields outside each event contract', () => {
  const result = validateEvent(makeEvent(1, 'run_started', { trigger: 'NEW_PLAN', task_id: 'task-1' }), 1);
  assert.deepEqual(result.diagnostics.map(d => d.code), ['PAYLOAD_UNKNOWN_FIELD']);
});
test('keeps contract diagnostics before event-specific field diagnostics', () => {
  const payload = {
    task_id: 'bad-task',
    result: 'NOPE',
    evidence_kind: 'COUNTS',
    unrelated_field: true,
  };
  const result = validateEvent(makeEvent(1, 'task_test_result', payload), 1);

  assert.deepEqual(result.diagnostics.map(diagnostic => diagnostic.code), [
    'PAYLOAD_UNKNOWN_FIELD',
    'RESULT_INVALID',
    'PAYLOAD_TASK_ID_INVALID',
    'PAYLOAD_COUNTS_REQUIRED',
  ]);
});
test('requires event id to bind run id and sequence', () => {
  const result = validateEvent(makeEvent(1, 'run_started', MINIMAL_PAYLOADS.run_started, { event_id: 'other-run:9' }), 1);
  assert.deepEqual(result.diagnostics.map(d => d.code), ['EVENT_ID_INVALID']);
});
test('rejects unrelated payload fields for every event contract', () => {
  for (const [eventType, payload] of Object.entries(MINIMAL_PAYLOADS)) {
    const result = validateEvent(makeEvent(1, eventType, { ...payload, unrelated_field: true }), 1);
    assert.equal(result.diagnostics.filter(d => d.code === 'PAYLOAD_UNKNOWN_FIELD').length, 1, eventType);
  }
});
test('rejects missing, malformed, unsafe, and wrong-sequence event ids', () => {
  for (const event_id of [undefined, '', '../escape:1', 'other-run:1', `${makeEvent(1, 'run_started').run_id}:2`]) {
    const overrides = event_id === undefined ? { event_id: undefined } : { event_id };
    const result = validateEvent(makeEvent(1, 'run_started', MINIMAL_PAYLOADS.run_started, overrides), 1);
    assert.deepEqual(result.diagnostics.map(d => d.code), ['EVENT_ID_INVALID'], String(event_id));
  }
});
test('unknown event type never throws', () => {
  const result = validateEvent(makeEvent(1, '__proto__', {}), 1);
  assert.deepEqual(result.diagnostics.map(d => d.code), ['EVENT_TYPE_UNSUPPORTED']);
});
test('rejects unknown versions, event types, payload fields, and prose overflow', () => {
  const event = makeEvent(1, 'finding_raised', { finding_id: 'F-001', scope: 'TASK', task_id: 'task-1', category: 'QUALITY', severity: 'IMPORTANT', title: 'x'.repeat(241), surprise: true }, { schema_version: 2 });
  assert.deepEqual(validateEvent(event, 7).diagnostics.map(d => d.code), ['EVENT_SCHEMA_VERSION_UNSUPPORTED', 'PAYLOAD_UNKNOWN_FIELD', 'FINDING_TITLE_TOO_LONG']);
});
test('requires test counts exactly when evidence kind is COUNTS', () => {
  for (const eventType of ['task_test_result', 'final_test_result']) {
    const counts = eventType === 'task_test_result'
      ? { task_id: 'task-1', result: 'PASS', evidence_kind: 'COUNTS' }
      : { result: 'PASS', evidence_kind: 'COUNTS' };
    assert.ok(validateEvent(makeEvent(1, eventType, counts), 1).diagnostics.some(d => d.code === 'PAYLOAD_COUNTS_REQUIRED'), eventType);
  }
});
test('rejects test counts for non-COUNTS evidence kinds', () => {
  for (const eventType of ['task_test_result', 'final_test_result']) {
    for (const evidence_kind of ['EXIT_STATUS', 'UNINTERPRETABLE']) {
      const payload = eventType === 'task_test_result'
        ? { task_id: 'task-1', result: 'PASS', evidence_kind, passed: 1, total: 1 }
        : { result: 'PASS', evidence_kind, passed: 1, total: 1 };
      assert.ok(validateEvent(makeEvent(1, eventType, payload), 1).diagnostics.some(d => d.code === 'PAYLOAD_COUNTS_FORBIDDEN'), `${eventType}/${evidence_kind}`);
    }
  }
});
