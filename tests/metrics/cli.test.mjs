import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import test, { beforeEach } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createRepo,
  PLAN_PATH,
  seedIncompleteRunThenChangePlan,
  seedLatestPassAndOlderBlockedRuns,
  snapshotFiles,
} from './fixtures.mjs';

const CLI_PATH = fileURLToPath(new URL('../../bin/superpowers.mjs', import.meta.url));
const runCliProcess = (cwd, args) => spawnSync(process.execPath, [CLI_PATH, ...args], {
  cwd,
  encoding: 'utf8',
});
const snapshotTree = root => snapshotFiles(root, { exclude: ['.git'], includeContents: true });

let root;
let olderRun;
let reportPath;
beforeEach(t => {
  root = createRepo(t);
  ({ olderRun, reportPath } = seedLatestPassAndOlderBlockedRuns(root));
});

test('default command selects latest run, prints terminal output, and is read-only', () => {
  const before = snapshotTree(root);
  const result = runCliProcess(root, ['metrics', PLAN_PATH]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Feature: foo[\s\S]*Outcome: PASS/);
  assert.equal(result.stderr, '');
  assert.deepEqual(snapshotTree(root), before);
});

test('--run selects a retained run and --json emits JSON only', () => {
  const result = runCliProcess(root, ['metrics', PLAN_PATH, '--run', olderRun, '--json']);
  assert.equal(JSON.parse(result.stdout).run.run_id, olderRun);
  assert.equal(result.stderr, '');
});

test('--write refuses a retained run that is not latest', () => {
  const result = runCliProcess(root, ['metrics', PLAN_PATH, '--run', olderRun, '--write']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--write.*latest run/i);
  assert.equal(existsSync(reportPath), false);
});

test('missing runs and invalid options exit 2 without writes', t => {
  const emptyRoot = createRepo(t);
  assert.equal(runCliProcess(emptyRoot, ['metrics', PLAN_PATH]).status, 2);
  assert.equal(runCliProcess(root, ['metrics', PLAN_PATH, '--wat']).status, 2);
});

test('incomplete evidence exits 1 and a changed plan emits a model warning', t => {
  const incompleteRoot = createRepo(t);
  seedIncompleteRunThenChangePlan(incompleteRoot);
  const result = runCliProcess(incompleteRoot, ['metrics', PLAN_PATH, '--json']);
  assert.equal(result.status, 1);
  assert.match(JSON.parse(result.stdout).warnings[0].code, /PLAN_FINGERPRINT_CHANGED/);
});

test('rejects repeated single-value flags', () => {
  const result = runCliProcess(root, ['metrics', PLAN_PATH, '--run', olderRun, '--run', olderRun]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--run.*once/i);
});
