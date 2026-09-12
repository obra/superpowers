import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const packageJsonPath = resolve(repoRoot, 'package.json');
const modPath = resolve(repoRoot, '.commandcode/mods/superpowers.ts');
const mappingPath = resolve(
  repoRoot,
  'skills/using-superpowers/references/commandcode-tools.md',
);

async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8'));
}

async function loadMod() {
  const hooksCalls = [];
  let addCommandCalls = 0;
  const cmd = {
    hooks(spec) {
      hooksCalls.push(spec);
    },
    addCommand() {
      addCommandCalls += 1;
    },
  };
  const mod = await import(
    pathToFileURL(modPath).href + `?cachebust=${Date.now()}-${Math.random()}`
  );
  mod.default(cmd);
  return { hooksCalls, addCommandCalls };
}

test('package.json declares commandcode.mods for the superpowers mod', async () => {
  const pkg = await readPackageJson();

  assert.equal(pkg.name, 'superpowers');
  assert.deepEqual(pkg.commandcode.mods, ['./.commandcode/mods/superpowers.ts']);
});

test('mod registers exactly one appendSystemPrompt hook and never addCommand', async () => {
  const { hooksCalls, addCommandCalls } = await loadMod();

  assert.equal(hooksCalls.length, 1, 'expected one hooks() registration');
  assert.equal(typeof hooksCalls[0].appendSystemPrompt, 'function');
  assert.equal(addCommandCalls, 0, 'must never call addCommand');
});

test('appendSystemPrompt injects disk-loaded bootstrap with marker, skills path, and mapping', async () => {
  const { hooksCalls } = await loadMod();
  const appendSystemPrompt = hooksCalls[0].appendSystemPrompt;

  const text = await appendSystemPrompt();
  assert.equal(typeof text, 'string');
  assert.match(text, /You have superpowers/);
  assert.match(
    text,
    /superpowers:using-superpowers bootstrap for commandcode/,
  );
  assert.match(text, new RegExp(resolve(repoRoot, 'skills').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(text, /read_file/);

  const second = await appendSystemPrompt();
  assert.equal(second, text, 'bootstrap content should be cached');
});

test('commandcode tools reference documents mapping-table rows', async () => {
  assert.equal(existsSync(mappingPath), true, 'commandcode-tools.md should exist');
  const text = await readFile(mappingPath, 'utf8');

  // Assert against the mapping-table rows only. The surrounding prose mentions
  // these same tokens, so matching the whole file would still pass if the table
  // were deleted — the exact regression this test exists to catch.
  const rows = text.split('\n').filter((line) => line.startsWith('|'));
  assert.ok(
    rows.some((row) => /subagent/i.test(row)),
    'mapping table documents subagent dispatch',
  );
  assert.ok(
    rows.some((row) => /todo|task/i.test(row)),
    'mapping table documents task tracking',
  );
});
