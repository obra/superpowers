import { execFileSync } from 'node:child_process';
import { lstatSync, realpathSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const CONTROL = /[\0-\x1F\x7F]/;
const STANDARD_PLAN_ROOT = 'docs/superpowers/plans/';

function defaultGit(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' });
}

function fail(message) {
  throw new Error(message);
}

function toPosix(path) {
  return path.split(sep).join('/');
}

function isOutside(relativePath) {
  return relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath);
}

export function resolvePlanIdentity(planArg, { cwd = process.cwd(), git = defaultGit } = {}) {
  if (typeof planArg !== 'string' || planArg.length === 0 || CONTROL.test(planArg)) fail('Plan path must be a non-empty control-character-free string');
  if (planArg.split(/[\\/]/).includes('..')) fail('Plan path traversal is not allowed');

  let root;
  try {
    root = realpathSync(String(git(['rev-parse', '--show-toplevel'], cwd)).trim());
  } catch {
    fail('Current directory is not inside a Git worktree');
  }

  const planCandidate = resolve(cwd, planArg);
  let planAbsolutePath;
  try {
    lstatSync(planCandidate);
    planAbsolutePath = realpathSync(planCandidate);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Plan path')) throw error;
    fail('Plan path does not exist');
  }

  const planRelativePath = relative(root, planAbsolutePath);
  if (isOutside(planRelativePath)) fail('Plan path must resolve inside the Git worktree');
  const planPath = toPosix(planRelativePath);
  if (CONTROL.test(planPath) || extname(planPath) !== '.md') fail('Plan path must name a Markdown file');

  const planKey = planPath.slice(0, -3);
  const feature = basename(planKey);
  const oid = String(git(['hash-object', '--no-filters', '--', planAbsolutePath], root)).trim();
  if (!/^[0-9a-f]{40,64}$/.test(oid)) fail('Git returned an invalid plan fingerprint');

  const reportKey = planPath.startsWith(STANDARD_PLAN_ROOT)
    ? planKey.slice(STANDARD_PLAN_ROOT.length)
    : planKey;
  const metricsPlanRoot = join(root, '.superpowers', 'metrics', ...planKey.split('/'));
  const reportPath = join(root, 'docs', 'superpowers', 'reports', ...reportKey.split('/')) + '.md';

  return {
    root,
    planAbsolutePath,
    planPath,
    planKey,
    feature,
    currentFingerprint: `git-blob:${oid}`,
    metricsPlanRoot,
    reportPath,
  };
}
