import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  validateTransition,
  readSpecStatus,
  writeSpecStatus,
  LEGAL_TRANSITIONS,
} from '../../scripts/spec-status.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

test('validateTransition: draft → ratified is legal', () => {
  assert.equal(validateTransition('draft', 'ratified'), true);
});

test('validateTransition: draft → merged is illegal (skips ratified)', () => {
  assert.equal(validateTransition('draft', 'merged'), false);
});

test('validateTransition: ratified → implementing is legal', () => {
  assert.equal(validateTransition('ratified', 'implementing'), true);
});

test('validateTransition: implementing → draft is legal (regression)', () => {
  assert.equal(validateTransition('implementing', 'draft'), true);
});

test('validateTransition: merged → draft is illegal', () => {
  assert.equal(validateTransition('merged', 'draft'), false);
});

test('validateTransition: any non-terminal → rejected is legal', () => {
  for (const from of ['draft', 'ratified', 'implementing']) {
    assert.equal(validateTransition(from, 'rejected'), true, `from ${from}`);
  }
});

test('readSpecStatus: reads status from frontmatter', () => {
  const status = readSpecStatus(join(FIXTURES, 'spec-draft.md'));
  assert.equal(status, 'draft');
});

test('writeSpecStatus: updates frontmatter status field in place', () => {
  const src = join(FIXTURES, 'spec-draft.md');
  const tmp = join(FIXTURES, 'spec-tmp.md');
  copyFileSync(src, tmp);
  writeSpecStatus(tmp, 'ratified');
  const after = readSpecStatus(tmp);
  assert.equal(after, 'ratified');
  copyFileSync(src, tmp);  // cleanup
});

test('LEGAL_TRANSITIONS includes 4 non-terminal states', () => {
  for (const s of ['draft', 'ratified', 'implementing', 'merged']) {
    assert.ok(LEGAL_TRANSITIONS[s], `missing key: ${s}`);
  }
});
