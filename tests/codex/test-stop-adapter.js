#!/usr/bin/env node
/**
 * Unit tests — hooks/codex/stop-adapter.js
 *
 * Tests loop-guard behavior, continuation-prompt output shape, and reminder
 * logic. Uses a temporary git repo to simulate changed files.
 *
 * Run: node tests/codex/test-stop-adapter.js
 * No dependencies beyond Node.js stdlib.
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const { evaluatePayload } = require('../../hooks/codex/stop-adapter');

let passed = 0;
let failed = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

function runAdapter(payload, cwd) {
  return evaluatePayload({ cwd, ...payload });
}

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-test-'));
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'ignore' });
  // Initial commit so HEAD exists
  fs.writeFileSync(path.join(dir, 'README.md'), '# test');
  execSync('git add README.md', { cwd: dir, stdio: 'ignore' });
  execSync('git commit -m "init"', { cwd: dir, stdio: 'ignore' });
  return dir;
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

// ── Loop guard ────────────────────────────────────────────────────────────────

console.log('\nLoop guard (stop_hook_active)');

test('stop_hook_active: true → returns {} immediately', () => {
  const dir = makeTempRepo();
  try {
    const result = runAdapter({ stop_hook_active: true }, dir);
    assert.deepStrictEqual(result, {},
      `Expected {} but got: ${JSON.stringify(result)}`);
  } finally { cleanup(dir); }
});

test('stop_hook_active: false → proceeds normally', () => {
  const dir = makeTempRepo();
  try {
    // No uncommitted changes → no reminders → {}
    const result = runAdapter({ stop_hook_active: false }, dir);
    // Either {} or { systemMessage: ... } are valid — just must not throw
    assert.ok(typeof result === 'object', 'Expected an object');
  } finally { cleanup(dir); }
});

test('stop_hook_active: "true" (string) → NOT treated as active (strict ===)', () => {
  // The adapter uses === true, so string "true" should not suppress reminders
  const dir = makeTempRepo();
  try {
    const result = runAdapter({ stop_hook_active: 'true' }, dir);
    // Should proceed (not bail early) — result is an object
    assert.ok(typeof result === 'object');
  } finally { cleanup(dir); }
});

// ── No git repo → returns {} ──────────────────────────────────────────────────

console.log('\nNon-git directory');

test('Non-git cwd → returns {} (no git, no inference possible)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-nogit-'));
  try {
    const result = runAdapter({ stop_hook_active: false }, dir);
    assert.deepStrictEqual(result, {});
  } finally { cleanup(dir); }
});

// ── No uncommitted changes → no reminders ────────────────────────────────────

console.log('\nClean working tree');

test('Clean repo (no changes) → returns {}', () => {
  const dir = makeTempRepo();
  try {
    const result = runAdapter({ stop_hook_active: false }, dir);
    assert.deepStrictEqual(result, {});
  } finally { cleanup(dir); }
});

// ── TDD reminder ──────────────────────────────────────────────────────────────

console.log('\nTDD reminder');

test('Source file modified, no test file → block reason with TDD reminder', () => {
  const dir = makeTempRepo();
  try {
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hello")');
    // Don't stage — git diff --name-only picks up unstaged changes too
    const result = runAdapter({ stop_hook_active: false }, dir);
    assert.strictEqual(result.decision, 'block', `Expected decision=block, got: ${JSON.stringify(result)}`);
    assert.ok(result.reason, `Expected reason, got: ${JSON.stringify(result)}`);
    assert.ok(result.reason.toLowerCase().includes('tdd'),
      `Expected TDD mention in: ${result.reason}`);
  } finally { cleanup(dir); }
});

test('Source file + test file both modified → no TDD reminder', () => {
  const dir = makeTempRepo();
  try {
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hello")');
    fs.writeFileSync(path.join(dir, 'index.test.js'), 'test("x", () => {})');
    const result = runAdapter({ stop_hook_active: false }, dir);
    // May have other reminders (commit count) but not TDD
    if (result.reason) {
      assert.ok(!result.reason.toLowerCase().includes('tdd reminder'),
        `Unexpected TDD reminder: ${result.reason}`);
    }
  } finally { cleanup(dir); }
});

test('Source file + tests/codex/test-*.js file modified → no TDD reminder', () => {
  const dir = makeTempRepo();
  try {
    fs.mkdirSync(path.join(dir, 'tests', 'codex'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hello")');
    fs.writeFileSync(path.join(dir, 'tests', 'codex', 'test-stop-reminders.js'), '// regression');
    const result = runAdapter({ stop_hook_active: false }, dir);
    if (result.reason) {
      assert.ok(!result.reason.toLowerCase().includes('tdd reminder'),
        `Unexpected TDD reminder with test-*.js naming: ${result.reason}`);
    }
  } finally { cleanup(dir); }
});

// ── Commit reminder ───────────────────────────────────────────────────────────

console.log('\nCommit reminder');

test('5+ uncommitted files → block reason with commit reminder', () => {
  const dir = makeTempRepo();
  try {
    for (let i = 0; i < 6; i++) {
      fs.writeFileSync(path.join(dir, `file${i}.js`), `// ${i}`);
    }
    const result = runAdapter({ stop_hook_active: false }, dir);
    assert.strictEqual(result.decision, 'block', `Expected decision=block, got: ${JSON.stringify(result)}`);
    assert.ok(result.reason, 'Expected reason');
    assert.ok(result.reason.toLowerCase().includes('commit'),
      `Expected commit reminder in: ${result.reason}`);
  } finally { cleanup(dir); }
});

test('4 uncommitted files → no commit reminder', () => {
  const dir = makeTempRepo();
  try {
    for (let i = 0; i < 4; i++) {
      fs.writeFileSync(path.join(dir, `file${i}.js`), `// ${i}`);
    }
    const result = runAdapter({ stop_hook_active: false }, dir);
    if (result.reason) {
      assert.ok(!result.reason.toLowerCase().includes('commit reminder'),
        `Unexpected commit reminder with only 4 files: ${result.reason}`);
    }
  } finally { cleanup(dir); }
});

// ── Decision log reminder ─────────────────────────────────────────────────────

console.log('\nDecision log reminder');

test('SKILL.md modified (uncommitted) → block reason with decision log reminder', () => {
  const dir = makeTempRepo();
  try {
    fs.mkdirSync(path.join(dir, 'skills', 'my-skill'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'skills', 'my-skill', 'SKILL.md'), '---\nname: test\n---\n# test');
    const result = runAdapter({ stop_hook_active: false }, dir);
    assert.strictEqual(result.decision, 'block', `Expected decision=block, got: ${JSON.stringify(result)}`);
    assert.ok(result.reason, 'Expected reason');
    assert.ok(result.reason.toLowerCase().includes('decision log'),
      `Expected decision log reminder in: ${result.reason}`);
  } finally { cleanup(dir); }
});

test('SKILL.md modified for project that already has session-log [saved] → still fires', () => {
  // This was the bug: the old code suppressed the reminder if lastSaved was non-null.
  // The fix: fire whenever significant files are uncommitted, regardless of prior history.
  const dir = makeTempRepo();
  try {
    // Write a session-log with a prior [saved] entry
    fs.writeFileSync(path.join(dir, 'session-log.md'),
      '## 2026-01-01 12:00 [saved]\nGoal: prior work\n\n');
    // Modify a significant file
    fs.mkdirSync(path.join(dir, 'skills', 'test'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'skills', 'test', 'SKILL.md'), '---\nname: test\n---');
    const result = runAdapter({ stop_hook_active: false }, dir);
    assert.strictEqual(result.decision, 'block', `Expected decision=block, got: ${JSON.stringify(result)}`);
    assert.ok(result.reason, `Expected reason even with prior [saved] entry`);
    assert.ok(result.reason.toLowerCase().includes('decision log'),
      `Expected decision log reminder: ${result.reason}`);
  } finally { cleanup(dir); }
});

// ── Output shape ──────────────────────────────────────────────────────────────

console.log('\nOutput shape');

test('When reminders present: output uses block reason, not Stop hookSpecificOutput fields', () => {
  const dir = makeTempRepo();
  try {
    fs.writeFileSync(path.join(dir, 'index.js'), 'x');
    const result = runAdapter({ stop_hook_active: false }, dir);
    if (result.reason) {
      assert.strictEqual(result.decision, 'block');
      assert.strictEqual(typeof result.reason, 'string');
      assert.ok(!result.hookSpecificOutput,
        'Should not use hookSpecificOutput shape for Stop event');
      assert.ok(!result.additionalContext,
        'Should not use additionalContext for Stop event');
      assert.ok(!result.systemMessage,
        'Should not use systemMessage for Stop continuation path');
    }
  } finally { cleanup(dir); }
});

// ── Reminder dedupe (Codex UX) ───────────────────────────────────────────────

console.log('\nReminder dedupe');

test('Same reminder state in same session is emitted once', () => {
  const dir = makeTempRepo();
  try {
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hello")');

    const first = runAdapter({ stop_hook_active: false, session_id: 'sess-1' }, dir);
    assert.strictEqual(first.decision, 'block', `Expected first reminder block, got: ${JSON.stringify(first)}`);

    const second = runAdapter({ stop_hook_active: false, session_id: 'sess-1' }, dir);
    assert.deepStrictEqual(second, {},
      `Expected duplicate reminder suppression, got: ${JSON.stringify(second)}`);
  } finally { cleanup(dir); }
});

test('Reminder re-emits in same session when underlying state changes', () => {
  const dir = makeTempRepo();
  try {
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hello")');
    const first = runAdapter({ stop_hook_active: false, session_id: 'sess-2' }, dir);
    assert.strictEqual(first.decision, 'block', `Expected first reminder block, got: ${JSON.stringify(first)}`);

    const second = runAdapter({ stop_hook_active: false, session_id: 'sess-2' }, dir);
    assert.deepStrictEqual(second, {},
      `Expected duplicate reminder suppression, got: ${JSON.stringify(second)}`);

    // New dirty file changes reminder payload (source file count increases).
    fs.writeFileSync(path.join(dir, 'another.js'), 'console.log("changed")');
    const third = runAdapter({ stop_hook_active: false, session_id: 'sess-2' }, dir);
    assert.strictEqual(third.decision, 'block',
      `Expected reminder to re-emit after state change, got: ${JSON.stringify(third)}`);
  } finally { cleanup(dir); }
});

test('Same reminder state without session_id is emitted once per cwd/day', () => {
  const dir = makeTempRepo();
  try {
    fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hello")');

    const first = runAdapter({ stop_hook_active: false }, dir);
    assert.strictEqual(first.decision, 'block', `Expected first reminder block, got: ${JSON.stringify(first)}`);

    const second = runAdapter({ stop_hook_active: false }, dir);
    assert.deepStrictEqual(second, {},
      `Expected duplicate reminder suppression without session_id, got: ${JSON.stringify(second)}`);
  } finally { cleanup(dir); }
});

// ── Result ────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`stop-adapter: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
