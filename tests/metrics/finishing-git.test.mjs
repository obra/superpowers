import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const REPORT = 'docs/superpowers/reports/foo.md';
const SUBJECT = 'docs(metrics): update foo report';
const CANONICAL_REPORT = '# Lifecycle report: foo\n';

const paths = output => output.split('\n').filter(Boolean).map(path => path.replaceAll('\\', '/')).sort();

function commitPaths(root, ref) {
  return paths(execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', ref], {
    cwd: root,
    encoding: 'utf8',
  }));
}

function stagedPaths(root) {
  return paths(execFileSync('git', ['diff', '--cached', '--name-only'], {
    cwd: root,
    encoding: 'utf8',
  }));
}

function unstagedPaths(root) {
  return paths(execFileSync('git', ['diff', '--name-only'], {
    cwd: root,
    encoding: 'utf8',
  }));
}

function git(root, argv) {
  return execFileSync('git', argv, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
}

function createRepository(t) {
  const root = mkdtempSync(join(tmpdir(), 'superpowers-finishing-git-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'user.name', 'Metrics Test']);
  git(root, ['config', 'user.email', 'metrics@example.test']);
  writeFileSync(join(root, 'tracked.txt'), 'base\n');
  writeFileSync(join(root, 'unrelated-unstaged.txt'), 'base\n');
  git(root, ['add', '.']);
  git(root, ['commit', '-qm', 'fixture']);

  writeFileSync(join(root, 'unrelated-staged.txt'), 'staged\n');
  git(root, ['add', 'unrelated-staged.txt']);
  writeFileSync(join(root, 'unrelated-unstaged.txt'), 'changed\n');
  mkdirSync(join(root, 'docs/superpowers/reports'), { recursive: true });
  writeFileSync(join(root, REPORT), CANONICAL_REPORT);
  return root;
}

function commitReport(root) {
  git(root, ['add', '--', REPORT]);
  git(root, ['commit', '--only', '-m', SUBJECT, '--', REPORT]);
}

function reportChanged(root) {
  return git(root, ['status', '--porcelain', '--', REPORT]).trim() !== '';
}

function commitChangedReport(root) {
  if (!reportChanged(root)) return false;
  commitReport(root);
  return true;
}

function assertFailedCommitState(root) {
  assert.equal(existsSync(join(root, REPORT)), true);
  assert.deepEqual(stagedPaths(root).filter(path => path.startsWith('unrelated-')), ['unrelated-staged.txt']);
  assert.deepEqual(unstagedPaths(root).filter(path => path.startsWith('unrelated-')), ['unrelated-unstaged.txt']);
  const subjects = git(root, ['log', '--format=%s', '--all']).split('\n').filter(Boolean);
  assert.equal(subjects.includes(SUBJECT), false);
}

test('scoped porcelain makes dirty canonical report candidate and clean canonical skips', t => {
  const root = createRepository(t);
  assert.equal(reportChanged(root), true);

  git(root, ['add', '--', REPORT]);
  git(root, ['commit', '--only', '-m', 'fixture canonical report', '--', REPORT]);
  assert.equal(reportChanged(root), false);
  assert.equal(commitChangedReport(root), false);

  writeFileSync(join(root, REPORT), '# stale report\n');
  git(root, ['add', '--', REPORT]);
  git(root, ['commit', '--only', '-m', 'fixture stale report', '--', REPORT]);
  writeFileSync(join(root, REPORT), CANONICAL_REPORT);
  assert.equal(reportChanged(root), true);
  assert.equal(commitChangedReport(root), true);
  assert.equal(reportChanged(root), false);
});

test('commits only generated lifecycle report without touching unrelated work', t => {
  const root = createRepository(t);

  commitReport(root);

  assert.equal(git(root, ['log', '-1', '--format=%s']).trim(), SUBJECT);
  assert.deepEqual(commitPaths(root, 'HEAD'), ['docs/superpowers/reports/foo.md']);
  assert.deepEqual(stagedPaths(root), ['unrelated-staged.txt']);
  assert.deepEqual(unstagedPaths(root), ['unrelated-unstaged.txt']);
});

test('missing Git identity leaves report and unrelated work unchanged', t => {
  const root = createRepository(t);
  git(root, ['config', 'user.name', '']);
  git(root, ['config', 'user.email', '']);

  assert.throws(() => commitReport(root));

  assertFailedCommitState(root);
});

test('commit-hook failure leaves report and unrelated work unchanged', t => {
  const root = createRepository(t);
  const hook = join(root, '.git/hooks/pre-commit');
  writeFileSync(hook, '#!/bin/sh\nexit 1\n');
  chmodSync(hook, 0o755);

  assert.throws(() => commitReport(root));

  assertFailedCommitState(root);
});
