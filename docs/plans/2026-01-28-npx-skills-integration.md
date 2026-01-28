# Npx Skills Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dynamic skill discovery/install to `superpowers-codex` via `npx skills`, plus a skill that triggers the workflow.

**Architecture:** Add a small helper module to run `npx skills` and parse `find` output, extend `.codex/superpowers-codex` with new subcommands, and add a new skill that calls back into the CLI. Keep behavior opt-in and compatible with existing commands.

**Tech Stack:** Node.js (CommonJS), built-in `node:test`, Bash.

### Task 1: Add failing tests for npx skills parsing/exec helpers

**Files:**
- Create: `tests/cli/npx-skills.test.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { stripAnsi, parseFindOutput, buildNpxArgs } = require('../../lib/npx-skills');

test('stripAnsi removes ANSI codes', () => {
  const input = '\u001b[31mred\u001b[0m text';
  assert.equal(stripAnsi(input), 'red text');
});

test('parseFindOutput extracts skill ids and urls', () => {
  const output = [
    'Install with npx skills add <owner/repo@skill>',
    'softaworks/agent-toolkit@codex',
    '└ https://skills.sh/softaworks/agent-toolkit/codex',
    '',
    'am-will/codex-skills@planner',
    '└ https://skills.sh/am-will/codex-skills/planner'
  ].join('\n');

  assert.deepEqual(parseFindOutput(output), [
    { id: 'softaworks/agent-toolkit@codex', url: 'https://skills.sh/softaworks/agent-toolkit/codex' },
    { id: 'am-will/codex-skills@planner', url: 'https://skills.sh/am-will/codex-skills/planner' }
  ]);
});

test('buildNpxArgs uses npx with skills subcommand', () => {
  assert.deepEqual(buildNpxArgs(['find', 'codex']), ['--yes', 'skills', 'find', 'codex']);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/cli/npx-skills.test.js`
Expected: FAIL with "Cannot find module '../../lib/npx-skills'".

**Step 3: Write minimal implementation**

Create `lib/npx-skills.js` with `stripAnsi`, `parseFindOutput`, and `buildNpxArgs` exports to satisfy tests.

**Step 4: Run test to verify it passes**

Run: `node --test tests/cli/npx-skills.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/cli/npx-skills.test.js lib/npx-skills.js
git commit -m "test: add npx skills helper tests"
```

### Task 2: Implement npx skills runner + CLI commands

**Files:**
- Modify: `.codex/superpowers-codex`
- Modify: `lib/npx-skills.js`

**Step 1: Write the failing test**

Extend `tests/cli/npx-skills.test.js` with a test for parsing a missing-url entry and ensure it still returns the id.

```js
test('parseFindOutput tolerates entries without url', () => {
  const output = 'owner/repo@skill';
  assert.deepEqual(parseFindOutput(output), [{ id: 'owner/repo@skill', url: null }]);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/cli/npx-skills.test.js`
Expected: FAIL with deepEqual mismatch.

**Step 3: Write minimal implementation**

Update `parseFindOutput` to add entries with `url: null` when no URL line follows.

Add `runNpxSkills(args, options)` to `lib/npx-skills.js` using `child_process.spawnSync`.

**Step 4: Run test to verify it passes**

Run: `node --test tests/cli/npx-skills.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/npx-skills.js tests/cli/npx-skills.test.js
git commit -m "feat: add npx skills runner"
```

### Task 3: Wire new CLI commands

**Files:**
- Modify: `.codex/superpowers-codex`
- Modify: `docs/README.codex.md`

**Step 1: Write the failing test**

Add a test that ensures `parseFindOutput` ignores ASCII art/banners by feeding in lines starting with block characters and verifying they’re ignored.

**Step 2: Run test to verify it fails**

Run: `node --test tests/cli/npx-skills.test.js`
Expected: FAIL with extra unexpected entries.

**Step 3: Write minimal implementation**

Update `parseFindOutput` to skip banner-only lines and empty lines.

Update `.codex/superpowers-codex` to add:
- `search-skills <query>` (runs `npx skills find`, parses, prints compact list)
- `install-skill <package> [args...]` (runs `npx skills add`, pass-through args)

Update help/usage and `docs/README.codex.md` with new commands and examples.

**Step 4: Run test to verify it passes**

Run: `node --test tests/cli/npx-skills.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add .codex/superpowers-codex docs/README.codex.md lib/npx-skills.js tests/cli/npx-skills.test.js
git commit -m "feat: add npx skills CLI commands"
```

### Task 4: Add a skill that triggers discovery/install workflow

**Files:**
- Create: `skills/skills-acquirer/SKILL.md`

**Step 1: Write the failing test**

Add a simple test to ensure the skill file exists and includes usage of `superpowers-codex search-skills` and `install-skill`.

**Step 2: Run test to verify it fails**

Run: `rg -n "skills-acquirer" skills/skills-acquirer/SKILL.md` (expect no file)

**Step 3: Write minimal implementation**

Use `init_skill.py` to create the skill directory, then fill in SKILL.md with concise instructions and example commands.

**Step 4: Run test to verify it passes**

Run: `rg -n "search-skills|install-skill" skills/skills-acquirer/SKILL.md`
Expected: matches.

**Step 5: Commit**

```bash
git add skills/skills-acquirer/SKILL.md
git commit -m "feat: add skills-acquirer skill"
```

### Task 5: Verify

**Files:**
- `tests/cli/npx-skills.test.js`

**Step 1: Run unit tests**

Run: `node --test tests/cli/npx-skills.test.js`
Expected: PASS.

**Step 2: Smoke test CLI**

Run: `.codex/superpowers-codex search-skills codex | head -n 20`
Expected: list of skill ids with URLs.

**Step 3: Commit (if needed)**

```bash
git add .
git commit -m "test: verify npx skills integration"
```
