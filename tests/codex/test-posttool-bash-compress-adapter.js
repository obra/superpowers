#!/usr/bin/env node
/**
 * Unit tests — hooks/codex/posttool-bash-compress-adapter.js
 */

'use strict';

const assert = require('assert');

const {
  evaluatePayload,
  extractToolResult,
} = require('../../hooks/codex/posttool-bash-compress-adapter');

let passed = 0;
let failed = 0;

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

function longLines(prefix, count) {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`).join('\n');
}

function isAllowed(result) {
  assert.deepStrictEqual(result, {}, `Expected allow/fail-open but got: ${JSON.stringify(result)}`);
}

function isBlocked(result) {
  assert.strictEqual(result.decision, 'block', `Expected decision=block, got: ${JSON.stringify(result)}`);
  assert.strictEqual(result.continue, false, `Expected continue=false, got: ${JSON.stringify(result)}`);
  assert.ok(typeof result.reason === 'string' && result.reason.length > 0, 'Expected non-empty reason');
  assert.deepStrictEqual(result.hookSpecificOutput?.hookEventName, 'PostToolUse',
    `Expected PostToolUse hookSpecificOutput, got: ${JSON.stringify(result)}`);
  assert.ok(typeof result.hookSpecificOutput?.additionalContext === 'string' &&
    result.hookSpecificOutput.additionalContext.length > 0,
  'Expected PostToolUse additionalContext');
}

console.log('\nNon-Bash / fail-open');

test('Non-Bash tool → allow', () => {
  isAllowed(evaluatePayload({
    tool_name: 'Read',
    tool_input: { file_path: 'README.md' },
  }));
});

test('Empty command → allow', () => {
  isAllowed(evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: '' },
  }));
});

test('No matching compression rule → allow', () => {
  isAllowed(evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: 'echo hello world' },
    tool_response: { stdout: longLines('hello', 80), stderr: '', exit_code: 0 },
  }));
});

test('NEVER_COMPRESS command → allow', () => {
  isAllowed(evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: 'cat README.md' },
    tool_response: { stdout: longLines('file', 80), stderr: '', exit_code: 0 },
  }));
});

test('User-filtered command with pipe → allow', () => {
  isAllowed(evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: 'find . -type f | sort' },
    tool_response: { stdout: longLines('./src/file.ts', 120), stderr: '', exit_code: 0 },
  }));
});

test('Short output → allow', () => {
  isAllowed(evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: 'git status' },
    tool_response: { stdout: 'On branch main\nnothing to commit\n', stderr: '', exit_code: 0 },
  }));
});

console.log('\nTool-response parsing');

test('Stringified JSON tool_response is parsed', () => {
  const parsed = extractToolResult(JSON.stringify({
    stdout: 'ok\n',
    stderr: 'warn\n',
    exit_code: 3,
  }));

  assert.deepStrictEqual(parsed, {
    stdout: 'ok\n',
    stderr: 'warn\n',
    exitCode: 3,
  });
});

test('Nested response object is parsed', () => {
  const parsed = extractToolResult({
    response: {
      output: 'nested output\n',
      status: '0',
    },
  });

  assert.deepStrictEqual(parsed, {
    stdout: 'nested output\n',
    stderr: '',
    exitCode: 0,
  });
});

console.log('\nCompression behavior');

test('Large find output → compressed replacement', () => {
  const result = evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: 'find . -type f' },
    tool_response: {
      stdout: longLines('./src/file.ts', 120),
      stderr: '',
      exit_code: 0,
    },
  });

  isBlocked(result);
  assert.match(result.reason, /\[smart-compress]/);
  assert.match(result.reason, /\[compressed:\s+\d+->\d+\s+lines \| find-large]/);
});

test('Passing test run → compressed replacement', () => {
  const summary = Array.from({ length: 60 }, (_, index) => `  PASS src/test-${index + 1}.spec.ts`).join('\n');
  const result = evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: 'npm test' },
    tool_response: {
      stdout: [
        summary,
        '',
        'Test Suites: 60 passed, 60 total',
        'Tests:       300 passed, 300 total',
        'Time:        18.442 s',
      ].join('\n'),
      stderr: '',
      exit_code: 0,
    },
  });

  isBlocked(result);
  assert.match(result.reason, /Test Suites:\s+60 passed, 60 total/);
  assert.match(result.reason, /Tests:\s+300 passed, 300 total/);
  assert.match(result.reason, /\| test-pass]/);
});

test('Failing test run → allow full output through', () => {
  isAllowed(evaluatePayload({
    tool_name: 'Bash',
    tool_input: { command: 'npm test' },
    tool_response: {
      stdout: longLines('FAIL src/test.ts', 80),
      stderr: '',
      exit_code: 1,
    },
  }));
});

console.log(`\n${'─'.repeat(50)}`);
console.log(`posttool-bash-compress-adapter: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
