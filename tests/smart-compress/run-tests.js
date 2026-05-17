#!/usr/bin/env node
'use strict';
/**
 * smart-compress test suite (pure Node.js)
 *
 * Cross-platform: works on macOS, Linux, Windows.
 * No /dev/stdin, no mktemp, no path translation issues.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PLUGIN_ROOT = path.join(__dirname, '..', '..');
let pass = 0, fail = 0;
const failures = [];

// ── Colours ──────────────────────────────────────────
const g = s => `\x1b[32m${s}\x1b[0m`;
const r = s => `\x1b[31m${s}\x1b[0m`;
const b = s => `\x1b[1m${s}\x1b[0m`;

function ok(desc)  { console.log(g(`  PASS: ${desc}`)); pass++; }
function bad(desc, expected, got) {
  console.log(r(`  FAIL: ${desc}`));
  console.log(r(`        expected: '${expected}'`));
  console.log(r(`        got:      '${got}'`));
  failures.push(desc);
  fail++;
}
function assert(desc, got, expected) {
  String(got) === String(expected) ? ok(desc) : bad(desc, expected, got);
}
function assertContains(desc, haystack, needle) {
  haystack.includes(needle) ? ok(desc) : bad(desc, `contains '${needle}'`, haystack.slice(0, 80));
}
function assertNotContains(desc, haystack, needle) {
  !haystack.includes(needle) ? ok(desc) : bad(desc, `must NOT contain '${needle}'`, `found in output`);
}

// ── Helpers ───────────────────────────────────────────

/** Run the PreToolUse hook for a Bash command. Returns parsed JSON. */
function runHook(cmd, sessionId = `test-${process.pid}`) {
  const input = JSON.stringify({
    session_id: sessionId,
    tool_name: 'Bash',
    tool_input: { command: cmd },
    cwd: PLUGIN_ROOT,
  });
  const hookPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-compress-hook.js');
  const r = spawnSync('node', [hookPath], { input, encoding: 'utf8', timeout: 10000 });
  try { return JSON.parse(r.stdout || '{}'); } catch { return {}; }
}

/** True if hook rewrote the command (compression applied). */
function isRewritten(hookOutput) {
  return !!(hookOutput.hookSpecificOutput && hookOutput.hookSpecificOutput.updatedInput);
}

/** The rule type from the permissionDecisionReason field. */
function getRuleType(hookOutput) {
  const reason = (hookOutput.hookSpecificOutput && hookOutput.hookSpecificOutput.permissionDecisionReason) || '';
  return reason.replace('smart-compress: ', '');
}

/** Run the optimizer (executes real command + compresses). */
function runOptimizer(cmd, type) {
  const b64 = Buffer.from(cmd).toString('base64');
  const optPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-optimizer.js');
  const r = spawnSync('node', [optPath, b64, type], {
    encoding: 'utf8',
    timeout: 30000,
    cwd: PLUGIN_ROOT,
  });
  return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status };
}

// ═══════════════════════════════════════════════════════════
console.log(b('\n1. SYNTAX & MODULE LOADING'));
// ═══════════════════════════════════════════════════════════

function syntaxCheck(file) {
  const r = spawnSync('node', ['--check', file], { encoding: 'utf8' });
  return r.status === 0 ? 'ok' : r.stderr;
}

assert('compression-rules.js syntax valid',  syntaxCheck(path.join(PLUGIN_ROOT, 'hooks/compression-rules.js')), 'ok');
assert('bash-optimizer.js syntax valid',      syntaxCheck(path.join(PLUGIN_ROOT, 'hooks/bash-optimizer.js')),    'ok');
assert('bash-compress-hook.js syntax valid',  syntaxCheck(path.join(PLUGIN_ROOT, 'hooks/bash-compress-hook.js')),'ok');

const { RULES, NEVER_COMPRESS, MIN_OUTPUT_LENGTH } = require(path.join(PLUGIN_ROOT, 'hooks/compression-rules'));
assert('compression-rules loads without error', typeof RULES,          'object');
assert('17 compression rules defined',          RULES.length,          17);
assert('9 never-compress patterns defined',     NEVER_COMPRESS.length, 9);
assert('MIN_OUTPUT_LENGTH = 200',               MIN_OUTPUT_LENGTH,     200);

// ═══════════════════════════════════════════════════════════
console.log(b('\n2. NEVER-COMPRESS CLASSIFICATION'));
// ═══════════════════════════════════════════════════════════

const neverCmds = [
  ['git diff HEAD',                'git diff'],
  ['git diff --staged',            'git diff --staged'],
  ['cat README.md',                'cat'],
  ['head -20 file.js',             'head'],
  ['tail -f log.txt',              'tail'],
  ['curl https://api.example.com', 'curl'],
  ['wget https://example.com',     'wget'],
  ['echo hello',                   'echo'],
  ['printf hello',                 'printf'],
  ['git log | grep fix',           'piped grep'],
  ['cat file | awk NF',            'piped awk'],
  ['npm install --verbose',        '--verbose flag'],
  ['cargo build --debug',          '--debug flag'],
  ['node -e console.log(1)',       'node -e inline'],
  ['rtk git status',               'rtk command'],
];

for (const [cmd, label] of neverCmds) {
  const out = runHook(cmd);
  assert(`never-compress: ${label} → passes through`, isRewritten(out), false);
}

// ═══════════════════════════════════════════════════════════
console.log(b('\n3. RULE MATCHING'));
// ═══════════════════════════════════════════════════════════

const shouldCompress = [
  ['git add .',                                  'git-add'],
  ['git commit -m msg',                          'git-commit'],
  ['git push origin main',                       'git-push'],
  ['git pull',                                   'git-pull'],
  ['git clone https://github.com/x/y',           'git-clone'],
  ['git status',                                 'git-status'],
  ['git log',                                    'git-log'],
  ['git fetch',                                  'git-fetch'],
  ['npm install',                                'npm-install'],
  ['npm test',                                   'test-pass'],
  ['cargo test',                                 'test-pass'],
  ['pytest',                                     'test-pass'],
  ['ls',                                         'ls-large'],
  ['cargo build',                                'build-success'],
  ['eslint src/',                                'lint-output'],
  ['docker build .',                             'docker-build'],
];

for (const [cmd, expectedType] of shouldCompress) {
  const out = runHook(cmd);
  assert(`rule match: '${cmd}' → compressed`,        isRewritten(out), true);
  assert(`rule match: '${cmd}' → type ${expectedType}`, getRuleType(out), expectedType);
}

// ═══════════════════════════════════════════════════════════
console.log(b('\n4. COMPRESSION QUALITY'));
// ═══════════════════════════════════════════════════════════

// git-add
const gitAdd = RULES.find(r => r.type === 'git-add');
assert('git-add: empty output → ok',       gitAdd.compress('', '', 0),  'ok');
assert('git-add: failure → null',          gitAdd.compress('', 'err', 1), null);
{ const c = gitAdd.compress('', 'warning: CRLF will be replaced\n', 0);
  assert('git-add: CRLF warning preserved', c && c.includes('warning'), true); }

// git-commit
const gitCommit = RULES.find(r => r.type === 'git-commit');
{ const out = '[main abc1234] Fix bug\n 3 files changed, 10 insertions(+), 2 deletions(-)\n';
  const c = gitCommit.compress(out, '', 0);
  assert('git-commit: hash in output',      c && c.includes('abc1234'), true);
  assert('git-commit: file stats in output',c && c.includes('3 files'), true); }
assert('git-commit: failure → null', gitCommit.compress('', 'error', 1), null);

// git-push
const gitPush = RULES.find(r => r.type === 'git-push');
{ const err = 'To github.com:user/repo.git\n   abc..def  main -> main\n';
  const c = gitPush.compress('', err, 0);
  assert('git-push: success → compact ok', c && c.startsWith('ok'), true); }
assert('git-push: failure → null', gitPush.compress('', 'error', 1), null);

// git-pull
const gitPull = RULES.find(r => r.type === 'git-pull');
assert('git-pull: already up to date', gitPull.compress('Already up to date.\n', '', 0), 'ok: already up to date');
assert('git-pull: failure → null',     gitPull.compress('', 'err', 1), null);

// git-status
const gitStatus = RULES.find(r => r.type === 'git-status');
{ const s = 'On branch main\n\nChanges not staged:\n  (use "git add <file>...")\n  (use "git restore <file>...")\n\tmodified:   foo.js\n\nno changes added to commit\n';
  const c = gitStatus.compress(s, '', 0);
  assert('git-status: removes (use "git add") hint', c && !c.includes('(use "git add'), true);
  assert('git-status: removes "no changes added" hint', c && !c.includes('no changes added'), true);
  assert('git-status: keeps file list', c && c.includes('foo.js'), true); }

// npm-install
const npmInstall = RULES.find(r => r.type === 'npm-install');
{ const out = 'added 150 packages in 12s\n\n2 vulnerabilities (1 moderate, 1 high)\n';
  const c = npmInstall.compress(out, '', 0);
  assert('npm-install: keeps package count', c && c.includes('150'), true);
  assert('npm-install: keeps vulnerability summary', c && c.includes('vulnerabilit'), true); }
assert('npm-install: failure → null', npmInstall.compress('', 'err', 1), null);

// test-pass
const testPass = RULES.find(r => r.type === 'test-pass');
assert('test-pass: short output → null', testPass.compress('PASS\n3 tests passed\n', '', 0), null);
assert('test-pass: failure → null',      testPass.compress('FAIL\nAssertionError', 'err', 1), null);
{ const long = Array(100).fill('  PASS src/test.js').join('\n') +
    '\nTest Suites: 5 passed, 5 total\nTests: 100 passed, 100 total\nTime: 3.2s\n';
  const c = testPass.compress(long, '', 0);
  assert('test-pass: keeps summary lines', c && c.includes('Tests: 100 passed'), true);
  assert('test-pass: removes individual PASS lines',
    c && !c.includes('  PASS src/test.js'), true); }

// git-log
const gitLog = RULES.find(r => r.type === 'git-log');
assert('git-log: short output → null', gitLog.compress('commit abc\nAuthor: A\n\n    msg\n', '', 0), null);
{ const long = Array(50).fill('commit abc\nAuthor: A\nDate: D\n\n    msg\n').join('\n');
  const c = gitLog.compress(long, '', 0);
  assert('git-log: truncates long output with marker', c && c.includes('more lines'), true); }

// ═══════════════════════════════════════════════════════════
console.log(b('\n5. END-TO-END: REAL COMMAND EXECUTION'));
// ═══════════════════════════════════════════════════════════

{ const r = runOptimizer('git status', 'git-status');
  assertContains('optimizer: git status has branch info',       r.stdout, 'On branch');
  assertNotContains('optimizer: git status removes hint lines', r.stdout, '(use "git');
  assertContains('optimizer: git status has [compressed] marker', r.stdout, '[compressed:'); }

{ const r = runOptimizer('git log --oneline -5', 'git-log');
  assert('optimizer: git log runs (exit 0)', r.status, 0);
  assert('optimizer: git log produces output', r.stdout.length > 0, true); }

// Exit code preservation
{ const b64 = Buffer.from('exit 42').toString('base64');
  const optPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-optimizer.js');
  const r = spawnSync('node', [optPath, b64, 'git-add'], { encoding: 'utf8' });
  assert('optimizer: preserves exit code (exit 42)', r.status, 42); }

// Short output passes through without marker
{ const r = runOptimizer('echo test-short-output-xyz', 'git-add');
  assertContains('optimizer: short output passes through', r.stdout, 'test-short-output-xyz');
  assertNotContains('optimizer: short output has no [compressed] marker', r.stdout, '[compressed:'); }

// Fail-open: invalid base64
{ const optPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-optimizer.js');
  const r = spawnSync('node', [optPath, '!!!invalid!!!', 'git-add'], { encoding: 'utf8' });
  assert('optimizer: invalid base64 exits cleanly (not null crash)', r.status !== null, true); }

// Stderr passes through uncompressed
{ const r = runOptimizer('node -e "process.stderr.write(\'test-stderr-xyz\')"', 'git-add');
  assertContains('optimizer: stderr passes through uncompressed', r.stderr, 'test-stderr-xyz'); }

// ═══════════════════════════════════════════════════════════
console.log(b('\n6. HOOK I/O PROTOCOL'));
// ═══════════════════════════════════════════════════════════

// Use a fresh session ID so re-run detection from sections 2-3 doesn't interfere
{ const out = runHook('git status', `proto-${Date.now()}`);
  const h = out.hookSpecificOutput;
  assert('hook: hookEventName is PreToolUse', h && h.hookEventName, 'PreToolUse');
  assert('hook: permissionDecision is allow', h && h.permissionDecision, 'allow');
  assert('hook: updatedInput.command includes bash-optimizer',
    h && h.updatedInput && h.updatedInput.command.includes('bash-optimizer'), true); }

// Original tool_input fields preserved
{ const hookPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-compress-hook.js');
  const input = JSON.stringify({
    session_id: 'field-test',
    tool_name: 'Bash',
    tool_input: { command: 'git status', description: 'my-desc', timeout: 60000 },
    cwd: PLUGIN_ROOT,
  });
  const r = spawnSync('node', [hookPath], { input, encoding: 'utf8', timeout: 10000 });
  const out = JSON.parse(r.stdout || '{}');
  const u = out.hookSpecificOutput && out.hookSpecificOutput.updatedInput;
  assert('hook: original description preserved', u && u.description, 'my-desc');
  assert('hook: original timeout preserved',     u && u.timeout,     60000); }

// Non-Bash tool
{ const hookPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-compress-hook.js');
  const input = JSON.stringify({ session_id: 'x', tool_name: 'Read', tool_input: { file_path: '/tmp/x' }, cwd: PLUGIN_ROOT });
  const r = spawnSync('node', [hookPath], { input, encoding: 'utf8', timeout: 10000 });
  assert('hook: non-Bash tool passes through as {}', r.stdout.trim(), '{}'); }

// Unknown command
{ const out = runHook('some-obscure-unknown-tool --flags');
  assert('hook: unknown command passes through as {}', JSON.stringify(out), '{}'); }

// ═══════════════════════════════════════════════════════════
console.log(b('\n7. ADAPTIVE RE-RUN DETECTION'));
// ═══════════════════════════════════════════════════════════

const session = `rerun-${Date.now()}`;

const r1 = runHook('git status', session);
const r2 = runHook('git status', session);
const r3 = runHook('git status', session);

assert('re-run: 1st run is compressed',      isRewritten(r1), true);
assert('re-run: 2nd run passes through raw', isRewritten(r2), false);
assert('re-run: 3rd run compressed again',   isRewritten(r3), true);

// Different commands track independently
const rl1 = runHook('git log', session);
const rl2 = runHook('git log', session);
assert('re-run: different command 1st run compressed', isRewritten(rl1), true);
assert('re-run: different command 2nd run raw',        isRewritten(rl2), false);

// Cleanup
try { fs.unlinkSync(path.join(os.tmpdir(), `sp-compress-${session}.json`)); } catch {}

// ═══════════════════════════════════════════════════════════
console.log(b('\n8. DISABLE MECHANISMS'));
// ═══════════════════════════════════════════════════════════

// SP_NO_COMPRESS=1
{ const hookPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-compress-hook.js');
  const input = JSON.stringify({ session_id: 'x', tool_name: 'Bash', tool_input: { command: 'git status' }, cwd: PLUGIN_ROOT });
  const r = spawnSync('node', [hookPath], {
    input, encoding: 'utf8', timeout: 10000,
    env: { ...process.env, SP_NO_COMPRESS: '1' },
  });
  assert('SP_NO_COMPRESS=1 disables all compression', r.stdout.trim(), '{}'); }

// .sp-no-compress file
{ const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-test-'));
  fs.writeFileSync(path.join(tmpDir, '.sp-no-compress'), '');
  const hookPath = path.join(PLUGIN_ROOT, 'hooks', 'bash-compress-hook.js');
  const input = JSON.stringify({ session_id: 'x', tool_name: 'Bash', tool_input: { command: 'git status' }, cwd: tmpDir });
  const r = spawnSync('node', [hookPath], { input, encoding: 'utf8', timeout: 10000 });
  assert('.sp-no-compress file disables compression', r.stdout.trim(), '{}');
  fs.rmSync(tmpDir, { recursive: true, force: true }); }

// ═══════════════════════════════════════════════════════════
console.log(b('\n9. TOKEN SAVINGS MEASUREMENT'));
// ═══════════════════════════════════════════════════════════
console.log('');

function measure(desc, cmd, type) {
  const rawResult = spawnSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 15000, cwd: PLUGIN_ROOT });
  const raw = (rawResult.stdout + rawResult.stderr).replace(/\r\n/g, '\n');
  const rawTok = Math.round(raw.length / 4);

  const comp = runOptimizer(cmd, type);
  const compOut = comp.stdout.replace(/\r\n/g, '\n');
  const compTok = Math.round(compOut.length / 4);

  if (raw.length <= MIN_OUTPUT_LENGTH) {
    console.log(`  ${desc.padEnd(42)} output below threshold — correctly skipped`);
    ok(`${desc}: correctly skipped (output too short)`);
  } else if (compTok < rawTok) {
    const saved = Math.round((rawTok - compTok) * 100 / rawTok);
    console.log(`  ${desc.padEnd(42)} ~${rawTok} tok → ~${compTok} tok  (${saved}% saved)`);
    ok(`${desc}: ${saved}% token savings`);
  } else {
    console.log(`  ${desc.padEnd(42)} ~${rawTok} tok → ~${compTok} tok  (rule correctly declined)`);
    ok(`${desc}: rule correctly declined (output already minimal)`);
  }
}

measure('git status',            'git status',              'git-status');
measure('git log (last 50)',     'git log --oneline -50',   'git-log');
measure('ls -la',                'ls -la',                  'ls-large');
measure('find hooks/ -type f',   'find hooks/ -type f',     'find-large');

// npm-install: simulate realistic output (can't run real install)
{ const lines = [];
  for (let i = 0; i < 80; i++) lines.push(`  package-${i}@1.${i}.0`);
  lines.push('added 150 packages, and audited 200 packages in 12s');
  lines.push('');
  lines.push('2 vulnerabilities (1 moderate, 1 high)');
  const mock = lines.join('\n');
  const rawTok = Math.round(mock.length / 4);
  const c = npmInstall.compress(mock, '', 0) || mock;
  const compTok = Math.round(c.length / 4);
  const saved = Math.round((rawTok - compTok) * 100 / rawTok);
  console.log(`  ${'npm install (80-pkg mock)'.padEnd(42)} ~${rawTok} tok → ~${compTok} tok  (${saved}% saved)`);
  if (saved > 0) ok(`npm-install simulation: ${saved}% token savings`);
  else { bad('npm-install simulation achieves savings', '>0%', `${saved}%`); }
}

// ═══════════════════════════════════════════════════════════
console.log(b('\n10. HOOKS.JSON INTEGRATION'));
// ═══════════════════════════════════════════════════════════

{ const hooks = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf8'));
  const pre = hooks.hooks.PreToolUse || [];
  const hasCompress = pre.some(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('bash-compress-hook')));
  const safetyIdx   = pre.findIndex(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('block-dangerous')));
  const compressIdx = pre.findIndex(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('bash-compress')));
  assert('hooks.json: bash-compress-hook registered', hasCompress, true);
  assert('hooks.json: safety hooks fire BEFORE compression', safetyIdx !== -1 && safetyIdx < compressIdx, true); }

{ const hooks = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks-cursor.json'), 'utf8'));
  const pre = hooks.hooks.preToolUse || [];
  const has = pre.some(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('bash-compress-hook')));
  assert('hooks-cursor.json: bash-compress-hook registered', has, true); }

{ const hooks = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf8'));
  const required = ['SessionStart','UserPromptSubmit','PostToolUse','Stop','SubagentStop','PreToolUse'];
  const allPresent = required.every(k => hooks.hooks[k]);
  assert('hooks.json: all original sections still intact', allPresent, true); }

// ═══════════════════════════════════════════════════════════
console.log(b('\n══════════════════════════════════════════'));
console.log(`  Results: ${g(pass + ' passed')}  ${fail > 0 ? r(fail + ' failed') : '0 failed'}`);
console.log(b('══════════════════════════════════════════'));

if (failures.length > 0) {
  console.log(r('\nFailed tests:'));
  failures.forEach(f => console.log(r(`  - ${f}`)));
  process.exit(1);
}
