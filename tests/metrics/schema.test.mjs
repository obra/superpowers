import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRunMetadata, validateEvent } from '../../lib/metrics/schema-v1.mjs';
import { EVENT_TYPES } from '../../lib/metrics/constants.mjs';
import { makeRun, makeEvent, MINIMAL_PAYLOADS } from './fixtures.mjs';

test('accepts canonical run metadata', () => assert.deepEqual(validateRunMetadata(makeRun()).diagnostics, []));
test('rejects unknown run fields and unsafe run ids', () => {
  const result = validateRunMetadata(makeRun({ run_id: '../escape', extra: 1 }));
  assert.deepEqual(result.diagnostics.map(d => d.code), ['RUN_UNKNOWN_FIELD', 'RUN_ID_INVALID']);
});
test('event catalog has 27 entries', () => assert.equal(EVENT_TYPES.length, 27));
test('accepts every v1 event type with its minimal payload', () => {
  for (const [eventType, payload] of Object.entries(MINIMAL_PAYLOADS)) assert.deepEqual(validateEvent(makeEvent(1, eventType, payload), 1).diagnostics, []);
});
test('rejects payload fields outside each event contract', () => {
  const result = validateEvent(makeEvent(1, 'run_started', { trigger: 'NEW_PLAN', task_id: 'task-1' }), 1);
  assert.deepEqual(result.diagnostics.map(d => d.code), ['PAYLOAD_UNKNOWN_FIELD']);
});
test('requires event id to bind run id and sequence', () => {
  const result = validateEvent(makeEvent(1, 'run_started', MINIMAL_PAYLOADS.run_started, { event_id: 'other-run:9' }), 1);
  assert.deepEqual(result.diagnostics.map(d => d.code), ['EVENT_ID_INVALID']);
});
test('rejects unknown versions, event types, payload fields, and prose overflow', () => {
  const event = makeEvent(1, 'finding_raised', { finding_id: 'F-001', scope: 'TASK', task_id: 'task-1', category: 'QUALITY', severity: 'IMPORTANT', title: 'x'.repeat(241), surprise: true }, { schema_version: 2 });
  assert.deepEqual(validateEvent(event, 7).diagnostics.map(d => d.code), ['EVENT_SCHEMA_VERSION_UNSUPPORTED', 'PAYLOAD_UNKNOWN_FIELD', 'FINDING_TITLE_TOO_LONG']);
});
