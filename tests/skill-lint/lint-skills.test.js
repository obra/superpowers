import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const script = path.join(repoRoot, 'scripts/lint-skills.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`  FAIL: ${name}`);
    console.log(`    ${error.message}`);
    failed += 1;
  }
}

function withFixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-skill-lint-'));
  try {
    fs.mkdirSync(path.join(root, 'skills'), { recursive: true });
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function writeFile(root, relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function writeSkill(root, name, content) {
  writeFile(root, path.join('skills', name, 'SKILL.md'), content);
}

function runLint(root) {
  return spawnSync(process.execPath, [script, '--root', root], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function runLintWithArgs(args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function combinedOutput(result) {
  return `${result.stdout}\n${result.stderr}`;
}

console.log('Skill lint tests');

test('passes a valid skill with existing relative file and anchor links', () => withFixture((root) => {
  writeSkill(root, 'good-skill', `---
name: good-skill
description: Use when testing a valid skill fixture
---

# Good Skill

See [guide](guide.md#usage-notes) and [local usage](#local-usage).

## Local Usage
`);
  writeFile(root, 'skills/good-skill/guide.md', '# Usage Notes\n');

  const result = runLint(root);
  assert.equal(result.status, 0, combinedOutput(result));
  assert.match(result.stdout, /checked 1 skill/);
}));

test('resolves requested relative paths from --root', () => withFixture((root) => {
  writeSkill(root, 'selected-skill', `---
name: selected-skill
description: Use when testing root-relative path filters
---

# Selected Skill
`);

  const result = runLintWithArgs(['--root', root, 'skills/selected-skill']);
  assert.equal(result.status, 0, combinedOutput(result));
  assert.match(result.stdout, /checked 1 skill/);
}));

test('fails when required frontmatter is missing or the name does not match the directory', () => withFixture((root) => {
  writeSkill(root, 'frontmatter-bad', `---
name: wrong-name
---

# Bad Frontmatter
`);

  const result = runLint(root);
  const output = combinedOutput(result);
  assert.notEqual(result.status, 0, output);
  assert.match(output, /\[frontmatter-description\]/);
  assert.match(output, /\[frontmatter-name-match\]/);
}));

test('fails when frontmatter name format or size violates the skill spec', () => withFixture((root) => {
  writeSkill(root, 'format-bad', `---
name: "format bad!"
description: ${'too long '.repeat(140)}
---

# Format Bad
`);

  const result = runLint(root);
  const output = combinedOutput(result);
  assert.notEqual(result.status, 0, output);
  assert.match(output, /\[frontmatter-name-format\]/);
  assert.match(output, /\[frontmatter-size\]/);
}));

test('fails on missing relative links and missing markdown anchors', () => withFixture((root) => {
  writeSkill(root, 'link-bad', `---
name: link-bad
description: Use when testing broken markdown links
---

# Link Bad

See [missing](missing.md) and [bad anchor](guide.md#not-here).
`);
  writeFile(root, 'skills/link-bad/guide.md', '# Existing Heading\n');

  const result = runLint(root);
  const output = combinedOutput(result);
  assert.notEqual(result.status, 0, output);
  assert.match(output, /\[markdown-link-target\]/);
  assert.match(output, /\[markdown-link-anchor\]/);
}));

test('fails on stale tool patterns and non-portable home paths', () => withFixture((root) => {
  writeSkill(root, 'platform-bad', `---
name: platform-bad
description: Use when testing deterministic stale tool and path failures
---

# Platform Bad

Use TodoWrite, then call Read(file). Work from /Users/jesse/project or ~/Desktop/project.
Generic runtime paths like ~/.agents/skills/ are okay.
`);

  const result = runLint(root);
  const output = combinedOutput(result);
  assert.notEqual(result.status, 0, output);
  assert.match(output, /\[stale-tool-name\]/);
  assert.match(output, /\[stale-tool-pattern\]/);
  assert.match(output, /\[portable-path\]/);
  assert.doesNotMatch(output, /~\/\.agents\/skills/);
}));

test('allows stale names in documented compatibility references', () => withFixture((root) => {
  writeSkill(root, 'using-superpowers', `---
name: using-superpowers
description: Use when testing compatibility reference allowlists
---

# Using Superpowers
`);
  writeFile(root, 'skills/using-superpowers/references/pi-tools.md', 'Older docs may refer to `TodoWrite`; map it to task tracking.\n');

  const result = runLint(root);
  assert.equal(result.status, 0, combinedOutput(result));
}));

console.log(`\nSkill lint results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
