import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const pluginPath = resolve(repoRoot, '.dsh/plugins/superpowers.js');
const patchPath = resolve(repoRoot, '.dsh/cordis.patch.yml');
const skillsDir = resolve(repoRoot, 'skills');

/** A fake Cordis context that records everything the plugin registers. */
function fakeContext() {
  const registered = [];
  const sections = [];
  const warnings = [];
  return {
    registered,
    sections,
    warnings,
    ctx: {
      logger: { warn: (message) => warnings.push(message) },
      skills: { register: (skill) => registered.push(skill) },
      systemPrompt: { section: (section) => sections.push(section) },
    },
  };
}

/** Import the plugin fresh so no module-level state is shared between tests. */
async function loadPlugin(modulePath = pluginPath) {
  return import(`${pathToFileURL(modulePath).href}?t=${Date.now()}-${Math.random()}`);
}

function skillDirectoryNames() {
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * Copy the plugin into a scratch tree whose sibling `skills/` holds only the
 * given fixtures, so degraded catalogs can be exercised without touching the
 * real one.
 */
function scratchPlugin(fixtures) {
  const root = mkdtempSync(join(tmpdir(), 'superpowers-dsh-'));
  mkdirSync(join(root, '.dsh/plugins'), { recursive: true });
  cpSync(pluginPath, join(root, '.dsh/plugins/superpowers.js'));
  for (const [name, contents] of Object.entries(fixtures)) {
    mkdirSync(join(root, 'skills', name), { recursive: true });
    writeFileSync(join(root, 'skills', name, 'SKILL.md'), contents);
  }
  return { root, modulePath: join(root, '.dsh/plugins/superpowers.js') };
}

test('package.json declares the dsh bundle patch', async () => {
  const pkg = JSON.parse(await readFile(resolve(repoRoot, 'package.json'), 'utf8'));

  assert.equal(pkg.name, 'superpowers');
  assert.equal(pkg.dsh.bundle.patch, './.dsh/cordis.patch.yml');
  // The dsh entry point must not shadow the OpenCode plugin that `main` names.
  assert.equal(pkg.main, '.opencode/plugins/superpowers.js');
});

test('the bundle patch inserts one row pointing at the plugin module', async () => {
  const patch = await readFile(patchPath, 'utf8');
  const rows = patch.split('\n').filter((line) => line.trim().startsWith('- id:'));

  assert.deepEqual(rows.map((row) => row.trim()), ['- id: superpowers']);
  assert.match(patch, /^\s+name: superpowers\/\.dsh\/plugins\/superpowers\.js$/m);
  // The specifier is a package-relative deep import, so it has to be a real file.
  await readFile(pluginPath, 'utf8');
});

test('the plugin injects exactly the two registries it writes to', async () => {
  const mod = await loadPlugin();

  assert.equal(mod.name, 'superpowers');
  assert.deepEqual(mod.inject, ['skills', 'systemPrompt']);
  assert.equal(typeof mod.apply, 'function');
});

test('apply registers every bundled skill once, with its frontmatter', async () => {
  const mod = await loadPlugin();
  const { ctx, registered, warnings } = fakeContext();

  mod.apply(ctx);

  assert.deepEqual(registered.map((skill) => skill.name).sort(), skillDirectoryNames());
  assert.deepEqual(warnings, []);

  const brainstorming = registered.find((skill) => skill.name === 'brainstorming');
  const source = await readFile(join(skillsDir, 'brainstorming/SKILL.md'), 'utf8');
  assert.match(source, new RegExp(`description: "?${brainstorming.description.slice(0, 40)}`));
  assert.equal(brainstorming.source, 'bundled');
  assert.equal(brainstorming.path, join(skillsDir, 'brainstorming/SKILL.md'));
  assert.deepEqual(brainstorming.resourceBase, {
    kind: 'directory',
    path: join(skillsDir, 'brainstorming'),
  });
  // Frontmatter is metadata for the registry, not part of the instruction body.
  assert.ok(!brainstorming.content.startsWith('---'));
});

test('apply registers one bootstrap section carrying using-superpowers', async () => {
  const mod = await loadPlugin();
  const { ctx, sections } = fakeContext();

  mod.apply(ctx);

  assert.equal(sections.length, 1);
  const [section] = sections;
  assert.equal(section.name, 'superpowers:bootstrap');
  // After the deployment persona (0), before tool guidance (100-199).
  assert.ok(section.order > 0 && section.order < 100, `order ${section.order} is out of range`);
  assert.match(section.text, /^<EXTREMELY_IMPORTANT>/);
  assert.match(section.text, /<\/EXTREMELY_IMPORTANT>$/);
  assert.match(section.text, /You have superpowers\./);
  assert.match(section.text, /already loaded for this session/);
  assert.match(section.text, /Do not load using-superpowers again/);

  const body = (await readFile(join(skillsDir, 'using-superpowers/SKILL.md'), 'utf8'))
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .trim();
  assert.ok(section.text.includes(body), 'bootstrap must carry the live skill body');
});

test('a second apply registers the same thing again, with no leaked state', async () => {
  const mod = await loadPlugin();
  const first = fakeContext();
  const second = fakeContext();

  mod.apply(first.ctx);
  mod.apply(second.ctx);

  assert.deepEqual(
    second.registered.map((skill) => skill.name),
    first.registered.map((skill) => skill.name),
  );
  assert.equal(second.sections.length, 1);
  assert.equal(second.sections[0].text, first.sections[0].text);
});

test('a malformed skill is skipped and reported, and the rest still register', async () => {
  const { root, modulePath } = scratchPlugin({
    'using-superpowers': '---\nname: using-superpowers\ndescription: bootstrap\n---\nBootstrap body.\n',
    'no-frontmatter': 'Just a body.\n',
    'no-description': '---\nname: no-description\n---\nBody.\n',
    'empty-body': '---\nname: empty-body\ndescription: nothing\n---\n\n',
  });

  try {
    const mod = await loadPlugin(modulePath);
    const { ctx, registered, sections, warnings } = fakeContext();

    mod.apply(ctx);

    assert.deepEqual(registered.map((skill) => skill.name), ['using-superpowers']);
    assert.equal(sections.length, 1);
    assert.equal(warnings.length, 3, warnings.join('\n'));
    for (const warning of warnings) {
      assert.match(warning, /needs name and description frontmatter and a body/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('without using-superpowers the skills still register but no bootstrap does', async () => {
  const { root, modulePath } = scratchPlugin({
    brainstorming: '---\nname: brainstorming\ndescription: design first\n---\nBody.\n',
  });

  try {
    const mod = await loadPlugin(modulePath);
    const { ctx, registered, sections, warnings } = fakeContext();

    mod.apply(ctx);

    assert.deepEqual(registered.map((skill) => skill.name), ['brainstorming']);
    assert.deepEqual(sections, []);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /using-superpowers is missing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a missing skills directory degrades to a warning, not a throw', async () => {
  const { root, modulePath } = scratchPlugin({});

  try {
    const mod = await loadPlugin(modulePath);
    const { ctx, registered, sections, warnings } = fakeContext();

    mod.apply(ctx);

    assert.deepEqual(registered, []);
    assert.deepEqual(sections, []);
    assert.equal(warnings.length, 2);
    assert.match(warnings[0], /cannot read/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the Codex plugin sync excludes the dsh dotdir', async () => {
  const sync = await readFile(resolve(repoRoot, 'scripts/sync-to-codex-plugin.sh'), 'utf8');

  assert.match(sync, /^\s+"\/\.dsh\/"$/m);
});
