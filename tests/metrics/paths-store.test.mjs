import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { resolvePlanIdentity } from '../../lib/metrics/paths.mjs';
import { loadRunDirectory, selectRun } from '../../lib/metrics/store.mjs';
import { makeRun, makeStoredRun, PLAN_PATH } from './fixtures.mjs';

export function createRepo(t) {
  const root = mkdtempSync(join(tmpdir(), 'superpowers-metrics-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Metrics Test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'metrics@example.test'], { cwd: root });
  mkdirSync(join(root, 'docs/superpowers/plans/team'), { recursive: true });
  writeFileSync(join(root, 'docs/superpowers/plans/team/foo.md'), '# Foo\n');
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  return root;
}

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
  assert.equal(identity.reportPath, join(root, 'docs/superpowers/reports/docs/plans/foo.md'));
});

test('rejects traversal, symlink escape, missing plans, and non-git cwd', (t) => {
  const root = createRepo(t);
  symlinkSync(tmpdir(), join(root, 'escape-link.md'), 'junction');
  for (const input of ['../outside.md', 'escape-link.md', 'missing.md']) {
    assert.throws(() => resolvePlanIdentity(input, { cwd: root }));
  }
  const nonGit = mkdtempSync(join(tmpdir(), 'superpowers-non-git-'));
  t.after(() => rmSync(nonGit, { recursive: true, force: true }));
  assert.throws(() => resolvePlanIdentity('plan.md', { cwd: nonGit }));
});

test('selects newest created_at with run id tie-break and validates --run ownership', () => {
  const runs = [
    makeStoredRun({ run_id: 'run-a', created_at: '2026-08-18T10:00:00.000Z' }),
    makeStoredRun({ run_id: 'run-b', created_at: '2026-08-18T10:00:00.000Z' }),
  ];
  const selected = selectRun(runs, null, PLAN_PATH);
  assert.equal(selected.metadata.run_id, 'run-b');
  const foreign = makeStoredRun({
    run_id: 'run-for-another-plan',
    plan_path: 'docs/superpowers/plans/other.md',
  });
  assert.throws(() => selectRun([...runs, foreign], foreign.metadata.run_id, PLAN_PATH), /does not belong/);
  assert.throws(() => selectRun([foreign, ...runs], null, PLAN_PATH), /does not belong/);
});

test('loads metadata and retains malformed JSONL physical lines', (t) => {
  const root = createRepo(t);
  const runDir = join(root, '.superpowers/metrics/docs/superpowers/plans/foo/run-a');
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, 'run.json'), `${JSON.stringify(makeRun({ run_id: 'run-a' }))}\n`);
  writeFileSync(join(runDir, 'events.jsonl'), '{"sequence":1}\nnot json\n');
  const loaded = loadRunDirectory(runDir);
  assert.deepEqual(loaded.metadataDiagnostics, []);
  assert.deepEqual(loaded.eventLines, [
    { lineNumber: 1, text: '{"sequence":1}' },
    { lineNumber: 2, text: 'not json' },
  ]);
});
