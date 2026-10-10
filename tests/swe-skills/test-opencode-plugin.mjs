import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const pluginRoot = resolve(repoRoot, 'plugins/swe-skills');
const entryPath = resolve(pluginRoot, '.opencode/plugins/swe-skills.js');
const expectedSkills = [
  'behavior-guidelines',
  'code-review',
  'design-an-interface',
  'managing-skill-library',
  'self-evolved',
];

async function loadPlugin() {
  const module = await import(`${pathToFileURL(entryPath).href}?cachebust=${Date.now()}-${Math.random()}`);
  assert.equal(typeof module.SweSkillsPlugin, 'function');
  return module.SweSkillsPlugin({ client: {}, directory: repoRoot });
}

test('OpenCode entry registers only companion skills', async () => {
  const plugin = await loadPlugin();
  const config = {};

  assert.equal(typeof plugin.config, 'function');
  await plugin.config(config);

  assert.deepEqual(config.skills.paths, [resolve(pluginRoot, 'skills')]);
  assert.equal(plugin['experimental.chat.messages.transform'], undefined);
  assert.equal(existsSync(resolve(pluginRoot, 'skills/using-superpowers/SKILL.md')), false);

  for (const skill of expectedSkills) {
    assert.equal(
      existsSync(resolve(pluginRoot, 'skills', skill, 'SKILL.md')),
      true,
      `missing companion skill ${skill}`,
    );
  }
});

test('OpenCode entry does not duplicate an existing skill path', async () => {
  const plugin = await loadPlugin();
  const skillsPath = resolve(pluginRoot, 'skills');
  const config = { skills: { paths: [skillsPath] } };

  await plugin.config(config);

  assert.deepEqual(config.skills.paths, [skillsPath]);
});
