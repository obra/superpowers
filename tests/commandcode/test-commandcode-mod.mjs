import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
const skillPath = resolve(repoRoot, 'skills/using-superpowers/SKILL.md');

async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8'));
}

async function loadMod(path = modPath) {
  const hooksCalls = [];
  const addSkillsPathCalls = [];
  let addCommandCalls = 0;
  const cmd = {
    hooks(spec) {
      hooksCalls.push(spec);
    },
    addCommand() {
      addCommandCalls += 1;
    },
    addSkillsPath(skillsPath) {
      addSkillsPathCalls.push(skillsPath);
    },
  };
  const mod = await import(
    pathToFileURL(path).href + `?cachebust=${Date.now()}-${Math.random()}`
  );
  mod.default(cmd);
  return { hooksCalls, addCommandCalls, addSkillsPathCalls };
}

function mappingRows(text) {
  return text.split('\n').filter((line) => line.startsWith('|'));
}

test('package.json declares commandcode mods and skills', async () => {
  const pkg = await readPackageJson();

  assert.equal(pkg.name, 'superpowers');
  assert.deepEqual(pkg.commandcode.mods, ['./.commandcode/mods/superpowers.ts']);
  assert.deepEqual(pkg.commandcode.skills, ['./skills']);
});

test('mod registers the skills directory, one appendSystemPrompt hook, and never addCommand', async () => {
  const { hooksCalls, addCommandCalls, addSkillsPathCalls } = await loadMod();

  assert.deepEqual(addSkillsPathCalls, [resolve(repoRoot, 'skills')]);
  assert.equal(hooksCalls.length, 1, 'expected one hooks() registration');
  assert.equal(typeof hooksCalls[0].appendSystemPrompt, 'function');
  assert.equal(addCommandCalls, 0, 'must never call addCommand');
});

test('appendSystemPrompt injects a byte-stable bootstrap that points at activate_skill', async () => {
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
  assert.match(text, /activate_skill/);

  const second = await appendSystemPrompt();
  assert.equal(second, text, 'bootstrap content should be cached');
});

test('missing bootstrap files cache as null and stay empty', async () => {
  const tempRoot = mkdtempSync(resolve(tmpdir(), 'commandcode-mod-'));
  try {
    const destDir = resolve(tempRoot, 'nested/.commandcode/mods');
    mkdirSync(destDir, { recursive: true });
    const destMod = resolve(destDir, 'superpowers.ts');
    copyFileSync(modPath, destMod);

    const { hooksCalls } = await loadMod(destMod);
    const appendSystemPrompt = hooksCalls[0].appendSystemPrompt;
    const text = await appendSystemPrompt();
    assert.equal(text, '');

    const skillDir = resolve(tempRoot, 'nested/skills/using-superpowers');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(resolve(skillDir, 'SKILL.md'), '---\nname: using-superpowers\n---\nLATE\n');
    mkdirSync(resolve(skillDir, 'references'), { recursive: true });
    writeFileSync(resolve(skillDir, 'references/commandcode-tools.md'), 'late mapping\n');

    const second = await appendSystemPrompt();
    assert.equal(second, '', 'a failed load stays cached for this process');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('commandcode tools reference documents current mapping-table rows', async () => {
  assert.equal(existsSync(mappingPath), true, 'commandcode-tools.md should exist');
  const text = await readFile(mappingPath, 'utf8');
  const rows = mappingRows(text);

  assert.ok(
    rows.some((row) => /invoke a skill/i.test(row) && /activate_skill/.test(row)),
    'invoke row points at activate_skill',
  );
  assert.ok(
    rows.some((row) => /read a file/i.test(row) && /read_file/.test(row) && !/read_multiple_files/.test(row)),
    'read row uses read_file, not read_multiple_files',
  );
  assert.ok(
    rows.some((row) => /subagent/i.test(row) && /`agent`/.test(row)),
    'mapping table documents subagent dispatch',
  );
  assert.ok(
    rows.some((row) => /agent_output/.test(row)),
    'mapping table documents agent_output',
  );
  assert.ok(
    rows.some((row) => /task_get/.test(row)),
    'mapping table documents task_get',
  );
  assert.ok(
    rows.some((row) => /enter_plan_mode/.test(row)),
    'mapping table documents enter_plan_mode',
  );
  assert.ok(
    rows.some((row) => /run_command/.test(row)),
    'mapping table documents run_command',
  );
  assert.equal(
    rows.some((row) => /read_multiple_files/.test(row)),
    false,
    'mapping table does not list read_multiple_files',
  );
});

test('using-superpowers platform adaptation points at commandcode-tools.md', async () => {
  const text = await readFile(skillPath, 'utf8');
  const section = text.split('## Platform Adaptation')[1]?.split('## ')[0] ?? '';
  assert.match(section, /Command Code: `references\/commandcode-tools\.md`/);
});
