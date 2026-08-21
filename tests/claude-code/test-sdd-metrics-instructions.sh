#!/usr/bin/env bash
set -euo pipefail

skill_file='skills/subagent-driven-development/SKILL.md'
reference_file='skills/subagent-driven-development/metrics-events.md'

grep -q 'metrics-events.md' "$skill_file"
grep -q 'Metrics run: <run-id>' "$skill_file"
grep -q 'run_started' "$reference_file"
grep -q 'task_implementation_review_result' "$reference_file"
grep -q 'task_quality_review_result' "$reference_file"
grep -q 'final_review_result' "$reference_file"
grep -q '## Operational action map' "$reference_file"
grep -q 'Controller only writes metrics' "$reference_file"
grep -q 'Never include prompts, source, diffs, secrets, command output' "$reference_file"
grep -q 'For definite append failure before any bytes' "$reference_file"
grep -q 'For uncertain write: inspect physical tail' "$reference_file"
grep -q 'node <plugin-root>/bin/superpowers.mjs metrics <plan-path>' "$reference_file"
grep -q 'Retain workspace, hand plan path and active run identity to finishing' "$reference_file"
! grep -q 'Delete this plan.s workspace' "$skill_file"

node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EVENT_TYPES } from './lib/metrics/constants.mjs';

const reference = await readFile('skills/subagent-driven-development/metrics-events.md', 'utf8');
const schema = await readFile('lib/metrics/schema-v1.mjs', 'utf8');
const table = reference.match(/^## Canonical event table\n([\s\S]*?)(?=^## |\Z)/m)?.[1];
assert.ok(table, 'metrics-events.md must contain a Canonical event table');
const documentedTypes = [...table.matchAll(/^\|\s*`([a-z_]+)`\s*\|/gm)].map(([, eventType]) => eventType);
assert.deepEqual(documentedTypes, EVENT_TYPES, 'canonical event table must match EVENT_TYPES exactly');

const rows = new Map([...table.matchAll(/^\|\s*`([a-z_]+)`\s*\|\s*(.*?)\s*\|$/gm)].map(([, eventType, row]) => [eventType, row]));
const validators = new Map([...schema.matchAll(/(\w+): (validate\w+Payload)/g)].map(([, eventType, validator]) => [eventType, validator]));
const quoted = source => [...source.matchAll(/'([^']+)'/g)].map(([, value]) => value);
for (const eventType of EVENT_TYPES) {
  const validator = validators.get(eventType);
  assert.ok(validator, `schema must map ${eventType} to a payload validator`);
  const start = schema.indexOf(`function ${validator}`);
  const end = schema.indexOf('\nfunction ', start + 1) === -1 ? schema.indexOf('\nconst PAYLOAD_VALIDATORS', start) : schema.indexOf('\nfunction ', start + 1);
  const body = schema.slice(start, end);
  const keys = body.match(/exactKeys\(payload, \[([^\]]*)\], \[([^\]]*)\]/);
  assert.ok(keys, `schema must declare payload keys for ${eventType}`);
  for (const key of quoted(keys[2])) assert.ok(rows.get(eventType).includes(`"${key}"`), `${eventType} reference must document required ${key}`);
  for (const key of quoted(keys[1])) assert.ok(rows.get(eventType).includes(`"${key}"`), `${eventType} reference must document allowed ${key}`);
  for (const [, field, values] of body.matchAll(/enumField\(payload, '([^']+)', \[([^\]]*)\]/g)) {
    assert.ok(rows.get(eventType).includes(`"${field}"`), `${eventType} reference must document enum field ${field}`);
    for (const value of quoted(values)) assert.ok(rows.get(eventType).includes(value), `${eventType} reference must document ${field}=${value}`);
  }
}
assert.ok(rows.get('fix_round_completed').includes('ADDRESSED') && rows.get('fix_round_completed').includes('NOT_ADDRESSED'), 'fix_round_completed must document finding result enums');

const actionMap = reference.match(/^## Operational action map\n([\s\S]*?)(?=^## |\Z)/m)?.[1];
assert.ok(actionMap, 'metrics-events.md must contain operational action map');
const task11Events = EVENT_TYPES.filter(eventType => !['final_test_result', 'run_passed'].includes(eventType));
for (const eventType of task11Events) assert.ok(actionMap.includes(`\`${eventType}\``), `operational map must cover ${eventType}`);
const compactMap = actionMap.replace(/\s+/g, ' ');
assert.match(compactMap, /Task 11 owns `run_blocked` only for genuine SDD blockers before handoff/);
assert.match(compactMap, /Task 12 owns `run_blocked` only for failures after handoff/);

const requires = (text, token) => assert.ok(text.includes(token), `missing ${token}`);
assert.throws(() => requires(rows.get('run_started').replace('NEW_PLAN', 'BROKEN'), 'NEW_PLAN'), /NEW_PLAN/);
assert.throws(() => requires(rows.get('run_started').replaceAll('trigger', 'broken'), 'trigger'), /trigger/);
assert.throws(() => requires(actionMap.replace('`run_started`', '`broken`'), '`run_started`'), /run_started/);
NODE
