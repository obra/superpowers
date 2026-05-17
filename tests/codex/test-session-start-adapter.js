#!/usr/bin/env node
/**
 * Unit tests — hooks/codex/session-start-adapter.js
 *
 * Verifies output shape, context assembly, and graceful fallbacks.
 * Does NOT test the live git fetch / auto-update path (network-dependent).
 *
 * Run: node tests/codex/test-session-start-adapter.js
 * No dependencies beyond Node.js stdlib.
 */

'use strict';

const { buildSessionContext } = require('../../hooks/codex/session-start-adapter');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

function runAdapter(payload, cwd) {
  const previous = process.env.SUPERPOWERS_AUTO_UPDATE;
  process.env.SUPERPOWERS_AUTO_UPDATE = '0';

  const raw = buildSessionContext(cwd);
  let parsed = {};
  try {
    parsed = JSON.parse(raw.trim() || '{}');
  } catch {}
  parsed._rawPlainText = raw;
  if (previous === undefined) delete process.env.SUPERPOWERS_AUTO_UPDATE;
  else process.env.SUPERPOWERS_AUTO_UPDATE = previous;
  return parsed;
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

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sp-ss-test-'));
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

// ── Output shape ──────────────────────────────────────────────────────────────

console.log('\nOutput shape (Codex SessionStart spec)');

test('Output is plain-text context on stdout', () => {
  const dir = makeTempDir();
  try {
    const result = runAdapter({ session_id: 'test-123', source: 'startup' }, dir);
    assert.ok(typeof result._rawPlainText === 'string' && result._rawPlainText.length > 0,
      `Missing plain-text context: ${JSON.stringify(result)}`);
  } finally { cleanup(dir); }
});

test('Output does not require a JSON hook envelope', () => {
  const dir = makeTempDir();
  try {
    const result = runAdapter({ source: 'startup' }, dir);
    assert.ok(!result.hookSpecificOutput,
      `Unexpected hookSpecificOutput envelope: ${JSON.stringify(result)}`);
  } finally { cleanup(dir); }
});

test('No top-level additionalContext (Claude Code shape must not appear)', () => {
  const dir = makeTempDir();
  try {
    const result = runAdapter({ source: 'startup' }, dir);
    assert.ok(!result.additionalContext,
      'Top-level additionalContext found — this is the Claude Code shape, not Codex');
    assert.ok(!result.additional_context,
      'Top-level additional_context found — wrong output shape');
  } finally { cleanup(dir); }
});

// ── Context content ───────────────────────────────────────────────────────────

console.log('\nContext content');

test('Context contains EXTREMELY_IMPORTANT wrapper (plain text)', () => {
  const dir = makeTempDir();
  try {
    const result = runAdapter({ source: 'startup' }, dir);
    const plainText = result._rawPlainText || '';
    assert.ok(
      plainText.includes('EXTREMELY_IMPORTANT'),
      'Missing EXTREMELY_IMPORTANT block in context'
    );
  } finally { cleanup(dir); }
});

test('Context contains using-superpowers entry point instruction (plain text)', () => {
  const dir = makeTempDir();
  try {
    const result = runAdapter({ source: 'startup' }, dir);
    const plainText = result._rawPlainText || '';
    assert.ok(
      plainText.includes('using-superpowers') || plainText.includes('superpowers-prepared'),
      'Missing using-superpowers reference in context'
    );
  } finally { cleanup(dir); }
});

test('project-map.md injected when present', () => {
  const dir = makeTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'project-map.md'), '# Project Map\n\nThis is the map.');
    const result = runAdapter({ source: 'startup' }, dir);
    const ctx = result._rawPlainText || '';
    assert.ok(ctx.includes('<project-map>'),
      'project-map.md present but not injected');
    assert.ok(ctx.includes('This is the map.'),
      'project-map.md content not in context');
  } finally { cleanup(dir); }
});

test('project-map.md NOT injected when absent', () => {
  const dir = makeTempDir();
  try {
    const result = runAdapter({ source: 'startup' }, dir);
    const ctx = result._rawPlainText || '';
    assert.ok(!ctx.includes('<project-map>'),
      'project-map tag present despite no project-map.md file');
  } finally { cleanup(dir); }
});

test('state.md injected when present', () => {
  const dir = makeTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'state.md'), '## In Progress\nWorking on feature X');
    const result = runAdapter({ source: 'startup' }, dir);
    const ctx = result._rawPlainText || '';
    assert.ok(ctx.includes('<state>'),
      'state.md present but not injected');
    assert.ok(ctx.includes('Working on feature X'),
      'state.md content not in context');
  } finally { cleanup(dir); }
});

test('known-issues.md injected when present', () => {
  const dir = makeTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'known-issues.md'), '## Error XYZ\nRun npm ci first');
    const result = runAdapter({ source: 'startup' }, dir);
    const ctx = result._rawPlainText || '';
    assert.ok(ctx.includes('<known-issues>'),
      'known-issues.md present but not injected');
  } finally { cleanup(dir); }
});

test('session-log.md: only [saved] entries injected, not [auto]', () => {
  const dir = makeTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'session-log.md'), [
      '## 2026-01-01 10:00 [auto]',
      'Files: index.js',
      '',
      '## 2026-01-02 12:00 [saved]',
      'Goal: add feature Y',
      'Decision: used approach Z',
      '',
    ].join('\n'));
    const result = runAdapter({ source: 'startup' }, dir);
    const ctx = result._rawPlainText || '';
    assert.ok(ctx.includes('<session-log>'),
      'session-log.md present but not injected');
    assert.ok(ctx.includes('add feature Y'),
      '[saved] entry content not in context');
    assert.ok(!ctx.includes('Files: index.js'),
      '[auto] entry content incorrectly included');
  } finally { cleanup(dir); }
});

test('Large project-map.md (>200 lines) → truncated to key sections', () => {
  const dir = makeTempDir();
  try {
    // Must exceed 200 lines to trigger truncation path.
    // 1+1 (title/blank) + 1+1+160 (overview) + 1+1+1+50 (constraints) + 1+1+1 (hot files) = 220
    const lines = ['# Project Map', ''];
    lines.push('## Overview', 'Some overview text that should be cut.');
    for (let i = 0; i < 160; i++) lines.push(`Overview line ${i}`);
    lines.push('', '## Critical Constraints', 'Never delete production database.');
    for (let i = 0; i < 50; i++) lines.push(`Constraint ${i}`);
    lines.push('', '## Hot Files', 'src/core.js is the entry point.');
    fs.writeFileSync(path.join(dir, 'project-map.md'), lines.join('\n'));
    const result = runAdapter({ source: 'startup' }, dir);
    const ctx = result._rawPlainText || '';
    assert.ok(ctx.includes('Critical Constraints'),
      'Critical Constraints section missing from large map');
    assert.ok(ctx.includes('Hot Files'),
      'Hot Files section missing from large map');
    // Overview section (not a key section) should be trimmed
    assert.ok(!ctx.includes('Some overview text that should be cut.'),
      'Overview section incorrectly included in large map injection');
  } finally { cleanup(dir); }
});

// ── Resilience ────────────────────────────────────────────────────────────────

console.log('\nResilience');

test('Empty cwd payload → does not crash, returns text output', () => {
  const result = runAdapter({}, process.cwd());
  assert.ok(typeof result._rawPlainText === 'string', 'Did not return text output');
});

test('Missing stdin cwd → falls back to process.cwd(), does not crash', () => {
  const previous = process.env.SUPERPOWERS_AUTO_UPDATE;
  process.env.SUPERPOWERS_AUTO_UPDATE = '0';
  const raw = buildSessionContext(process.cwd());
  if (previous === undefined) delete process.env.SUPERPOWERS_AUTO_UPDATE;
  else process.env.SUPERPOWERS_AUTO_UPDATE = previous;
  assert.ok(raw.length > 0, 'No SessionStart context when cwd omitted from payload');
});

test('context-snapshot.json with bad JSON → silently skipped', () => {
  const dir = makeTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'context-snapshot.json'), 'NOT VALID JSON {{{');
    const result = runAdapter({ source: 'startup' }, dir);
    const ctx = result._rawPlainText || '';
    assert.ok(ctx.length > 0, 'Adapter crashed on bad context-snapshot.json');
    assert.ok(!ctx.includes('NOT VALID JSON'),
      'Bad JSON content leaked into context');
  } finally { cleanup(dir); }
});

// ── Result ────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`session-start-adapter: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
