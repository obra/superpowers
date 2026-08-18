import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test, { beforeEach } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RETENTION_TERMINAL_LIMIT } from '../../lib/metrics/constants.mjs';
import { renderMarkdown } from '../../lib/metrics/render-markdown.mjs';
import { applyRetention, writeReport } from '../../lib/metrics/store.mjs';
import {
  createRepo,
  makeRun,
  PLAN_PATH,
  seedLatestPassAndOlderBlockedRuns,
} from './fixtures.mjs';
import { resolvePlanIdentity } from '../../lib/metrics/paths.mjs';

const CLI_PATH = fileURLToPath(new URL('../../bin/superpowers.mjs', import.meta.url));
const runCliProcess = (cwd, args) => spawnSync(process.execPath, [CLI_PATH, ...args], {
  cwd,
  encoding: 'utf8',
});

let root;
let identity;
let reportPath;
beforeEach(t => {
  root = createRepo(t);
  ({ reportPath } = seedLatestPassAndOlderBlockedRuns(root));
  identity = resolvePlanIdentity(PLAN_PATH, { cwd: root });
});

test('--write creates deterministic nested Markdown then preserves unchanged bytes and mtime', () => {
  const expectedMarkdown = renderMarkdown(JSON.parse(runCliProcess(root, ['metrics', PLAN_PATH, '--json']).stdout));
  const first = runCliProcess(root, ['metrics', PLAN_PATH, '--write']);
  assert.equal(first.status, 0);
  assert.equal(readFileSync(reportPath, 'utf8'), expectedMarkdown);
  const firstMtime = statSync(reportPath).mtimeMs;

  const second = runCliProcess(root, ['metrics', PLAN_PATH, '--write']);
  assert.equal(second.status, 0);
  assert.equal(statSync(reportPath).mtimeMs, firstMtime);
});

test('default and --json reads create neither report nor report directories', t => {
  const cleanRoot = createRepo(t);
  const cleanReport = join(cleanRoot, 'docs/superpowers/reports/foo.md');
  assert.equal(runCliProcess(cleanRoot, ['metrics', PLAN_PATH]).status, 2);
  assert.equal(existsSync(cleanReport), false);
  assert.equal(existsSync(join(cleanRoot, 'docs/superpowers/reports')), false);

  seedLatestPassAndOlderBlockedRuns(cleanRoot);
  const json = runCliProcess(cleanRoot, ['metrics', PLAN_PATH, '--json']);
  assert.equal(json.status, 0);
  assert.doesNotThrow(() => JSON.parse(json.stdout));
  assert.equal(existsSync(cleanReport), false);
  assert.equal(existsSync(join(cleanRoot, 'docs/superpowers/reports')), false);
});

test('--json --write emits JSON and writes Markdown', () => {
  const result = runCliProcess(root, ['metrics', PLAN_PATH, '--json', '--write']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).run.run_id, '20260818T120000Z-latest');
  assert.equal(readFileSync(reportPath, 'utf8'), renderMarkdown(JSON.parse(result.stdout)));
});

test('write failure exits 2 and preserves existing report target', () => {
  mkdirSync(reportPath, { recursive: true });
  writeFileSync(join(reportPath, 'previous-report.md'), 'previous report\n');

  const result = runCliProcess(root, ['metrics', PLAN_PATH, '--write']);
  assert.equal(result.status, 2);
  assert.equal(readFileSync(join(reportPath, 'previous-report.md'), 'utf8'), 'previous report\n');
});

const classifiedRun = (runId, createdAt, outcome, lifecycleState = 'TERMINAL') => {
  const runDir = join(identity.metricsPlanRoot, runId);
  mkdirSync(runDir, { recursive: true });
  const metadata = makeRun({ run_id: runId, created_at: createdAt });
  writeFileSync(join(runDir, 'run.json'), `${JSON.stringify(metadata)}\n`);
  writeFileSync(join(runDir, 'events.jsonl'), '');
  return { run: { runDir, metadata }, model: { outcome, lifecycle_state: lifecycleState } };
};

test('retention keeps active and blocked plus five newest eligible terminal runs', () => {
  const active = classifiedRun('active-1', '2026-08-18T20:00:00.000Z', 'INCOMPLETE', 'ACTIVE');
  const blocked = classifiedRun('blocked-1', '2026-08-18T19:00:00.000Z', 'BLOCKED', 'RESUMABLE');
  const terminals = Array.from({ length: 7 }, (_, index) => classifiedRun(
    `pass-${index + 1}`,
    `2026-08-${String(10 + index).padStart(2, '0')}T12:00:00.000Z`,
    index % 2 === 0 ? 'PASS' : 'INCOMPLETE',
  ));

  const result = applyRetention(identity, [active, blocked, ...terminals], RETENTION_TERMINAL_LIMIT);
  assert.deepEqual(result.deleted.sort(), ['pass-1', 'pass-2']);
  assert(result.preserved.includes('active-1'));
  assert(result.preserved.includes('blocked-1'));
  assert.equal(existsSync(join(identity.metricsPlanRoot, 'pass-1')), false);
  assert.equal(existsSync(join(identity.metricsPlanRoot, 'pass-3')), true);
});

test('retention preserves unclassifiable and symlinked run directories', t => {
  const malformed = classifiedRun('malformed-1', '2026-08-18T12:00:00.000Z', 'PASS');
  malformed.diagnostics = [{ code: 'EVENT_JSON_INVALID' }];
  const target = classifiedRun('symlink-target', '2026-08-18T13:00:00.000Z', 'PASS');
  const symlinkPath = join(identity.metricsPlanRoot, 'symlink-1');
  symlinkSync(target.run.runDir, symlinkPath, 'junction');
  const symlink = { run: { runDir: symlinkPath, metadata: makeRun({ run_id: 'symlink-1' }) }, model: { outcome: 'PASS', lifecycle_state: 'TERMINAL' } };

  const result = applyRetention(identity, [malformed, symlink], RETENTION_TERMINAL_LIMIT);
  assert.deepEqual(result.deleted, []);
  assert.deepEqual(result.diagnostics.map(diagnostic => diagnostic.code).sort(), [
    'RETENTION_RUN_UNCLASSIFIABLE',
    'RETENTION_SYMLINK_REFUSED',
  ]);
  assert.equal(existsSync(malformed.run.runDir), true);
  assert.equal(lstatSync(symlinkPath).isSymbolicLink(), true);
});

test('writeReport does not replace byte-identical report', () => {
  const markdown = '# stable\n';
  const first = writeReport(identity, markdown);
  const firstMtime = statSync(first.reportPath).mtimeMs;
  const second = writeReport(identity, markdown);
  assert.deepEqual(first, { reportPath, changed: true });
  assert.deepEqual(second, { reportPath, changed: false });
  assert.equal(statSync(reportPath).mtimeMs, firstMtime);
});
