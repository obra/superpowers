#!/usr/bin/env node
/**
 * Unit tests — hooks/subagent-guard.js
 *
 * Verifies:
 *   - Skill invocation detection (action verbs + skill names)
 *   - Expanded action verb coverage (activate, trigger, execute, launch, spawn, start)
 *   - Skill tool invocation detection
 *   - False positive avoidance (bare mentions without action verbs)
 *   - SKILL_NAMES completeness (includes new skills)
 *   - Output shape: decision=block + reason string
 *
 * Run: node tests/codex/test-subagent-guard.js
 * No dependencies beyond Node.js stdlib.
 *
 * Note: subagent-guard.js uses stdin event-based parsing (not async iterator),
 * so we test by spawning it as a child process with piped stdin.
 */

'use strict';

const assert = require('assert');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const HOOK_PATH = path.join(__dirname, '..', '..', 'hooks', 'subagent-guard.js');
const source = fs.readFileSync(HOOK_PATH, 'utf8');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  \u2713 ${label}`);
    passed++;
  } catch (err) {
    console.error(`  \u2717 ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

/**
 * Run subagent-guard.js with a given last_assistant_message.
 * Returns parsed JSON output.
 */
function runGuard(lastMessage) {
  const input = JSON.stringify({
    last_assistant_message: lastMessage,
    agent_id: 'test-agent',
    agent_type: 'test',
  });
  try {
    const output = execSync(`node "${HOOK_PATH}"`, {
      input,
      encoding: 'utf8',
      timeout: 5000,
    });
    return JSON.parse(output.trim());
  } catch (err) {
    // execSync throws on non-zero exit, but the hook should always exit 0
    if (err.stdout) return JSON.parse(err.stdout.trim());
    throw err;
  }
}

// ── SKILL_NAMES completeness ─────────────────────────────────────────────────

console.log('\nSKILL_NAMES completeness');

test('Includes original 21 skills', () => {
  const originals = [
    'using-superpowers', 'brainstorming', 'deliberation', 'writing-plans',
    'executing-plans', 'subagent-driven-development', 'systematic-debugging',
    'test-driven-development', 'verification-before-completion', 'token-efficiency',
    'context-management', 'dispatching-parallel-agents', 'requesting-code-review',
    'receiving-code-review', 'finishing-a-development-branch', 'error-recovery',
    'frontend-design', 'claude-md-creator', 'self-consistency-reasoner',
    'using-git-worktrees', 'premise-check',
  ];
  for (const name of originals) {
    assert.ok(source.includes(`'${name}'`), `Missing original skill: ${name}`);
  }
});

test('Includes red-team skill', () => {
  assert.ok(source.includes("'red-team'"), 'Missing red-team skill');
});

test('Includes new refactoring skill', () => {
  assert.ok(source.includes("'refactoring'"), 'Missing refactoring skill');
});

test('Includes new performance-investigation skill', () => {
  assert.ok(source.includes("'performance-investigation'"), 'Missing performance-investigation skill');
});

test('Includes new dependency-management skill', () => {
  assert.ok(source.includes("'dependency-management'"), 'Missing dependency-management skill');
});

test('Includes new vercel-react-best-practices skill', () => {
  assert.ok(source.includes("'vercel-react-best-practices'"), 'Missing vercel-react-best-practices skill');
});

// ── Action verb coverage ─────────────────────────────────────────────────────

console.log('\nAction verb coverage');

test('Original verbs: invoking, using, running, calling', () => {
  assert.ok(source.includes('invoking?'), 'Missing invoke/invoking');
  assert.ok(source.includes('using'), 'Missing using');
  assert.ok(source.includes('running?'), 'Missing run/running');
  assert.ok(source.includes('called?'), 'Missing call/called');
  assert.ok(source.includes('calling'), 'Missing calling');
});

test('New verbs: activate, trigger, execute, launch, spawn, start', () => {
  assert.ok(source.includes('activat'), 'Missing activate/activating');
  assert.ok(source.includes('trigger'), 'Missing trigger/triggering');
  assert.ok(source.includes('execut'), 'Missing execute/executing');
  assert.ok(source.includes('launch'), 'Missing launch/launching');
  assert.ok(source.includes('spawn'), 'Missing spawn/spawning');
  assert.ok(source.includes('start'), 'Missing start/starting');
});

// ── Skill tool detection patterns ────────────────────────────────────────────

console.log('\nSkill tool detection');

test('Detects Skill() function call pattern', () => {
  assert.ok(source.includes('Skill\\s*\\(\\s*'), 'Missing Skill() invocation pattern');
});

test('Detects skill: key pattern', () => {
  assert.ok(source.includes('skill:\\s*'), 'Missing skill: key pattern');
});

// ── Violation detection (end-to-end via child process) ───────────────────────

console.log('\nViolation detection (end-to-end)');

test('Blocks "I\'m using the brainstorming skill"', () => {
  const result = runGuard("I'm using the brainstorming skill to help with this.");
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "Invoke the superpowers-prepared skill"', () => {
  const result = runGuard('Invoke the superpowers-prepared using-superpowers skill.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "I activated the systematic-debugging skill"', () => {
  const result = runGuard('I activated the systematic-debugging skill to investigate.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "triggering the test-driven-development skill"', () => {
  const result = runGuard('I am triggering the test-driven-development skill now.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "executing the context-management skill"', () => {
  const result = runGuard('Let me try executing the context-management skill.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "launching the frontend-design skill"', () => {
  const result = runGuard('I am launching the frontend-design skill for this UI work.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "spawning the refactoring skill"', () => {
  const result = runGuard('I will be spawning the refactoring skill to restructure.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "starting the performance-investigation skill"', () => {
  const result = runGuard('Starting the performance-investigation skill to profile.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "calling the dependency-management skill"', () => {
  const result = runGuard('I am calling the dependency-management skill for updates.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

test('Blocks "using the vercel-react-best-practices skill"', () => {
  const result = runGuard('I am using the vercel-react-best-practices skill to optimize this React component.');
  assert.strictEqual(result.decision, 'block', `Expected block, got: ${JSON.stringify(result)}`);
});

// ── False positive avoidance ─────────────────────────────────────────────────

console.log('\nFalse positive avoidance');

test('Does NOT block bare skill name mention without action verb', () => {
  const result = runGuard('The brainstorming skill exists in this codebase. I read it.');
  assert.deepStrictEqual(result, {}, `Bare mention should not block: ${JSON.stringify(result)}`);
});

test('Does NOT block file path containing skill name', () => {
  const result = runGuard('I read the file at skills/systematic-debugging/SKILL.md');
  assert.deepStrictEqual(result, {}, `File path should not block: ${JSON.stringify(result)}`);
});

test('Does NOT block normal task completion messages', () => {
  const result = runGuard('I have completed the refactoring task. All tests pass. Here is the summary of changes made.');
  assert.deepStrictEqual(result, {}, `Normal message should not block: ${JSON.stringify(result)}`);
});

test('Does NOT block empty messages', () => {
  const result = runGuard('');
  assert.deepStrictEqual(result, {}, 'Empty message should not block');
});

// ── Output shape ─────────────────────────────────────────────────────────────

console.log('\nOutput shape');

test('Block output has decision and reason fields', () => {
  const result = runGuard("I'm using the brainstorming skill.");
  assert.strictEqual(result.decision, 'block');
  assert.strictEqual(typeof result.reason, 'string');
  assert.ok(result.reason.includes('SKILL LEAKAGE DETECTED'), `Reason should mention leakage: ${result.reason}`);
});

test('Allow output is empty object', () => {
  const result = runGuard('I completed the task using Read and Edit tools.');
  assert.deepStrictEqual(result, {});
});

test('Handles invalid JSON input gracefully', () => {
  try {
    const output = execSync(`echo "not json" | node "${HOOK_PATH}"`, {
      encoding: 'utf8',
      timeout: 5000,
    });
    const result = JSON.parse(output.trim());
    assert.deepStrictEqual(result, {}, 'Invalid JSON should produce {}');
  } catch (err) {
    if (err.stdout) {
      const result = JSON.parse(err.stdout.trim());
      assert.deepStrictEqual(result, {});
    }
  }
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`subagent-guard: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
