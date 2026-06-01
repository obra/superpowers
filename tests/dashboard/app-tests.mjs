// Node-runnable unit tests for dashboard/assets/app.js pure helpers.
//
// We load app.js into a sandbox with a `window` shim, then exercise
// the functions exposed on `SuperpowersDashboard`. This intentionally
// avoids the DOM-only entrypoints (initLanding / initSkillPage) — those
// are validated manually via the smoke procedure in dashboard/README.md.
//
// Run:
//   node tests/dashboard/app-tests.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSrc = readFileSync(
  join(__dirname, '..', '..', 'dashboard', 'assets', 'app.js'),
  'utf8'
);

const sandbox = { window: {}, console: console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(appSrc, sandbox);

const D = sandbox.window.SuperpowersDashboard;
if (!D) {
  console.error('FAIL: SuperpowersDashboard was not exported on window.');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (e) {
    failed++;
    console.error('  FAIL ' + name);
    console.error('       ' + (e && e.message));
    if (e && e.stack) console.error(e.stack.split('\n').slice(1, 4).join('\n'));
  }
}

function deepEqJson(a, b) {
  assert.equal(JSON.stringify(a), JSON.stringify(b));
}

console.log('parseJsonl');
test('parses one row per non-blank line', function () {
  const text = '{"a":1}\n{"b":2}\n';
  const rows = D.parseJsonl(text);
  deepEqJson(rows, [{ a: 1 }, { b: 2 }]);
});
test('skips blank and whitespace-only lines', function () {
  const text = '{"a":1}\n\n   \n{"b":2}\n';
  const rows = D.parseJsonl(text);
  assert.equal(rows.length, 2);
});
test('strips a leading BOM', function () {
  const text = '\uFEFF{"a":1}\n';
  deepEqJson(D.parseJsonl(text), [{ a: 1 }]);
});
test('skips unparseable lines without throwing', function () {
  const text = '{"a":1}\nnot-json\n{"b":2}\n';
  const rows = D.parseJsonl(text);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].b, 2);
});
test('returns [] for empty input', function () {
  deepEqJson(D.parseJsonl(''), []);
  deepEqJson(D.parseJsonl(null), []);
});

console.log('computeBiggestDrop');
test('returns null when fewer than two ok rows', function () {
  assert.equal(D.computeBiggestDrop([], 10), null);
  assert.equal(D.computeBiggestDrop([{ status: 'ok', headline_score: 50 }], 10), null);
  assert.equal(D.computeBiggestDrop(
    [{ status: 'error', headline_score: null }, { status: 'ok', headline_score: 50 }], 10), null);
});
test('ignores error rows entirely', function () {
  const rows = [
    { status: 'ok', headline_score: 80, short_sha: 'a' },
    { status: 'error', headline_score: null, short_sha: 'b' },
    { status: 'ok', headline_score: 60, short_sha: 'c' },
  ];
  const drop = D.computeBiggestDrop(rows, 10);
  assert.equal(drop.delta, -20);
  assert.equal(drop.short_sha, 'c');
});
test('returns the most negative delta in the window', function () {
  const rows = [
    { status: 'ok', headline_score: 90, short_sha: 'a' },
    { status: 'ok', headline_score: 80, short_sha: 'b' },
    { status: 'ok', headline_score: 50, short_sha: 'c' },
    { status: 'ok', headline_score: 55, short_sha: 'd' },
  ];
  const drop = D.computeBiggestDrop(rows, 10);
  assert.equal(drop.short_sha, 'c');
  assert.equal(drop.delta, -30);
});
test('respects the windowSize parameter', function () {
  const rows = [
    { status: 'ok', headline_score: 90, short_sha: 'a' },
    { status: 'ok', headline_score: 10, short_sha: 'b' }, // big drop a→b
    { status: 'ok', headline_score: 15, short_sha: 'c' },
    { status: 'ok', headline_score: 12, short_sha: 'd' }, // -3 c→d
  ];
  // With window=2 we only see b→c (+5) and c→d (-3); only -3 is a drop.
  const drop = D.computeBiggestDrop(rows, 2);
  assert.equal(drop.delta, -3);
  assert.equal(drop.short_sha, 'd');
});
test('returns null when no negative deltas exist', function () {
  const rows = [
    { status: 'ok', headline_score: 50, short_sha: 'a' },
    { status: 'ok', headline_score: 75, short_sha: 'b' },
  ];
  assert.equal(D.computeBiggestDrop(rows, 10), null);
});

console.log('buildCommitUrl');
test('builds a github.com commit url from repository + sha', function () {
  assert.equal(
    D.buildCommitUrl('owner/repo', 'abc123'),
    'https://github.com/owner/repo/commit/abc123'
  );
});
test('returns null when repository or sha is missing', function () {
  assert.equal(D.buildCommitUrl('', 'abc'), null);
  assert.equal(D.buildCommitUrl('owner/repo', ''), null);
  assert.equal(D.buildCommitUrl(null, null), null);
});

console.log('validateSkillName');
test('accepts lowercase, digits, hyphen, underscore', function () {
  assert.equal(D.validateSkillName('code-review', null), true);
  assert.equal(D.validateSkillName('threat_modeling', null), true);
  assert.equal(D.validateSkillName('foo123', null), true);
});
test('rejects path traversal and slashes', function () {
  assert.equal(D.validateSkillName('../etc/passwd', null), false);
  assert.equal(D.validateSkillName('foo/bar', null), false);
  assert.equal(D.validateSkillName('foo bar', null), false);
});
test('rejects when not in allowlist', function () {
  const ok  = D.validateSkillName('code-review', ['code-review', 'threat-modeling']);
  const bad = D.validateSkillName('not-real',    ['code-review', 'threat-modeling']);
  assert.equal(ok, true);
  assert.equal(bad, false);
});
test('rejects empty/null/non-string', function () {
  assert.equal(D.validateSkillName('', null), false);
  assert.equal(D.validateSkillName(null, null), false);
  assert.equal(D.validateSkillName(undefined, null), false);
  assert.equal(D.validateSkillName(42, null), false);
});

console.log('buildSparklinePath');
test('returns null for empty input', function () {
  assert.equal(D.buildSparklinePath([], 200, 36), null);
  assert.equal(D.buildSparklinePath([null, null], 200, 36), null);
});
test('emits a path that starts with M and uses L for connectors', function () {
  const r = D.buildSparklinePath([10, 20, 30, 40], 200, 36);
  assert.ok(r);
  assert.ok(r.path.startsWith('M'));
  assert.ok(r.path.includes('L'));
  assert.ok(r.lastPoint && typeof r.lastPoint.x === 'number');
});
test('breaks the path across null values (error gap)', function () {
  const r = D.buildSparklinePath([10, 20, null, 40], 200, 36);
  // After the null, the next segment starts with another M.
  const ms = (r.path.match(/M/g) || []).length;
  assert.equal(ms, 2);
});

console.log('formatDelta / deltaClass');
test('formats positive, negative, zero, and null', function () {
  assert.equal(D.formatDelta(0), '=');
  assert.equal(D.formatDelta(1.5), '\u25B2 +1.50');
  assert.equal(D.formatDelta(-2.25), '\u25BC -2.25');
  assert.equal(D.formatDelta(null), '');
});
test('delta class reflects sign', function () {
  assert.equal(D.deltaClass(5), 'delta-up');
  assert.equal(D.deltaClass(-5), 'delta-down');
  assert.equal(D.deltaClass(0), 'delta-flat');
  assert.equal(D.deltaClass(null), 'delta-flat');
});

console.log('relativeTime');
test('returns "Ns ago" for very recent timestamps', function () {
  const r = D.relativeTime(new Date(Date.now() - 15000).toISOString());
  assert.ok(/s ago$/.test(r), 'got ' + r);
});
test('returns empty for invalid input', function () {
  assert.equal(D.relativeTime(''), '');
  assert.equal(D.relativeTime('not-a-date'), '');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
