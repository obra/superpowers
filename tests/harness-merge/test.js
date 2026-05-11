#!/usr/bin/env node
'use strict';

// Tests for harnessSafeMerge / buildPreservedSection (cli.js, v1.3.3).
// No external dependencies — vanilla Node + assert, Node 14+ compatible.
//
// Run: node tests/harness-merge/test.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { harnessSafeMerge, buildPreservedSection } = require('../../cli.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-merge-'));
  try {
    fn(tmp);
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    failed++;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('\nharnessSafeMerge:');

test('backs up non-Harness AGENTS.md and captures content', (tmp) => {
  const stub = '<!-- OPENSPEC:START -->\nfoo\n<!-- OPENSPEC:END -->\n';
  fs.writeFileSync(path.join(tmp, 'AGENTS.md'), stub);

  const { sections, backups } = harnessSafeMerge(tmp);

  assert.strictEqual(sections.length, 1);
  assert.strictEqual(sections[0].source, 'AGENTS.md');
  assert.strictEqual(sections[0].content, stub);
  assert.strictEqual(backups.length, 1);
  assert.match(backups[0].to, /^AGENTS\.md\.bak\.\d+$/);
  assert.ok(!fs.existsSync(path.join(tmp, 'AGENTS.md')), 'original AGENTS.md should be moved');
  assert.ok(fs.existsSync(path.join(tmp, backups[0].to)), 'backup file should exist');
  assert.strictEqual(fs.readFileSync(path.join(tmp, backups[0].to), 'utf8'), stub);
});

test('leaves Harness-compliant AGENTS.md alone (has @import)', (tmp) => {
  const compliant = '# AGENTS.md\n\n@import baseline\n';
  fs.writeFileSync(path.join(tmp, 'AGENTS.md'), compliant);

  const { sections, backups } = harnessSafeMerge(tmp);

  assert.strictEqual(sections.length, 0);
  assert.strictEqual(backups.length, 0);
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf8'), compliant);
});

test('backs up non-empty CLAUDE.md regular file', (tmp) => {
  const rules = '# Project rules\n\nDo X.\n';
  fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), rules);

  const { sections, backups } = harnessSafeMerge(tmp);

  assert.strictEqual(sections.length, 1);
  assert.strictEqual(sections[0].source, 'CLAUDE.md');
  assert.strictEqual(sections[0].content, rules);
  assert.strictEqual(backups.length, 1);
  assert.ok(!fs.existsSync(path.join(tmp, 'CLAUDE.md')));
});

test('removes empty CLAUDE.md without backup', (tmp) => {
  fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), '   \n\n');

  const { sections, backups } = harnessSafeMerge(tmp);

  assert.strictEqual(sections.length, 0);
  assert.strictEqual(backups.length, 0);
  assert.ok(!fs.existsSync(path.join(tmp, 'CLAUDE.md')));
});

test('leaves correct CLAUDE.md → AGENTS.md symlink alone', (tmp) => {
  fs.writeFileSync(path.join(tmp, 'AGENTS.md'), '@import baseline\n');
  fs.symlinkSync('AGENTS.md', path.join(tmp, 'CLAUDE.md'));

  const { sections, backups } = harnessSafeMerge(tmp);

  assert.strictEqual(sections.length, 0);
  assert.strictEqual(backups.length, 0);
  const stat = fs.lstatSync(path.join(tmp, 'CLAUDE.md'));
  assert.ok(stat.isSymbolicLink());
  assert.strictEqual(fs.readlinkSync(path.join(tmp, 'CLAUDE.md')), 'AGENTS.md');
});

test('unlinks CLAUDE.md symlink pointing to wrong target', (tmp) => {
  fs.writeFileSync(path.join(tmp, 'OTHER.md'), 'x\n');
  fs.symlinkSync('OTHER.md', path.join(tmp, 'CLAUDE.md'));

  const { sections, backups } = harnessSafeMerge(tmp);

  assert.strictEqual(sections.length, 0);
  assert.strictEqual(backups.length, 0);
  assert.ok(!fs.existsSync(path.join(tmp, 'CLAUDE.md')));
});

test('handles both stub AGENTS.md and rules CLAUDE.md together', (tmp) => {
  fs.writeFileSync(path.join(tmp, 'AGENTS.md'), 'openspec stub\n');
  fs.writeFileSync(path.join(tmp, 'CLAUDE.md'), 'project rules\n');

  const { sections, backups } = harnessSafeMerge(tmp);

  assert.strictEqual(sections.length, 2);
  assert.strictEqual(backups.length, 2);
  assert.deepStrictEqual(sections.map(s => s.source), ['AGENTS.md', 'CLAUDE.md']);
  assert.ok(!fs.existsSync(path.join(tmp, 'AGENTS.md')));
  assert.ok(!fs.existsSync(path.join(tmp, 'CLAUDE.md')));
});

test('no-op on clean directory', (tmp) => {
  const { sections, backups } = harnessSafeMerge(tmp);
  assert.strictEqual(sections.length, 0);
  assert.strictEqual(backups.length, 0);
});

console.log('\nbuildPreservedSection:');

test('returns null when no sections', () => {
  const out = buildPreservedSection([], []);
  assert.strictEqual(out, null);
});

test('emits properly formatted merge section', () => {
  const sections = [
    { source: 'AGENTS.md', content: '<!-- OPENSPEC:START -->\nfoo\n<!-- OPENSPEC:END -->' },
    { source: 'CLAUDE.md', content: '# Mandatory Development Workflow\n- /prepare-context' },
  ];
  const backups = [
    { from: 'AGENTS.md', to: 'AGENTS.md.bak.1234' },
    { from: 'CLAUDE.md', to: 'CLAUDE.md.bak.1234' },
  ];

  const out = buildPreservedSection(sections, backups);

  assert.ok(out.includes('## 项目级既有约束'));
  assert.ok(out.includes('AGENTS.md.bak.1234'));
  assert.ok(out.includes('CLAUDE.md.bak.1234'));
  assert.ok(out.includes('### 来自原 AGENTS.md'));
  assert.ok(out.includes('### 来自原 CLAUDE.md'));
  assert.ok(out.includes('<!-- OPENSPEC:START -->'));
  assert.ok(out.includes('<!-- OPENSPEC:END -->'));
  assert.ok(out.includes('/prepare-context'));
  assert.ok(out.startsWith('\n---\n'), 'should start with a horizontal rule for safe append');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
