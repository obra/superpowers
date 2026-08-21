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

node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EVENT_TYPES } from './lib/metrics/constants.mjs';

const reference = await readFile('skills/subagent-driven-development/metrics-events.md', 'utf8');
const table = reference.match(/^## Canonical event table\n([\s\S]*?)(?=^## |\Z)/m)?.[1];
assert.ok(table, 'metrics-events.md must contain a Canonical event table');
const documentedTypes = [...table.matchAll(/^\|\s*`([a-z_]+)`\s*\|/gm)].map(([, eventType]) => eventType);
assert.deepEqual(documentedTypes, EVENT_TYPES, 'canonical event table must match EVENT_TYPES exactly');
NODE
