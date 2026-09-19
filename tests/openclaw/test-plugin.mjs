import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pluginPath = resolve(root, '.openclaw/index.js');

async function registeredBootstrap() {
  const registrations = [];
  const plugin = (await import(pathToFileURL(pluginPath).href)).default;
  plugin.register({
    registerHook(event, handler, options) {
      registrations.push({ event, handler, options });
    },
  });
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].event, 'agent:bootstrap');
  return registrations[0].handler;
}

test('OpenClaw discovers a native startup plugin and its skills', async () => {
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(resolve(root, 'openclaw.plugin.json'), 'utf8'));

  assert.deepEqual(pkg.openclaw.extensions, ['./.openclaw/index.js']);
  assert.equal(manifest.id, 'superpowers');
  assert.equal(manifest.version, pkg.version);
  assert.deepEqual(manifest.skills, ['./skills']);
  assert.equal(manifest.activation.onStartup, true);
  assert.deepEqual(manifest.configSchema, {
    type: 'object',
    additionalProperties: false,
    properties: {},
  });
});

test('agent bootstrap includes the complete skill and OpenClaw tool mapping before the first turn', async () => {
  const bootstrap = await registeredBootstrap();
  const workspaceInstructions = { name: 'AGENTS.md', path: resolve(root, 'test-workspace/AGENTS.md'), content: 'workspace instructions', missing: false };
  const files = [workspaceInstructions];
  const event = { type: 'agent', action: 'bootstrap', context: { bootstrapFiles: files } };

  await bootstrap(event);

  assert.equal(event.context.bootstrapFiles.length, 2);
  assert.equal(event.context.bootstrapFiles[1], workspaceInstructions, 'workspace instructions must remain intact');
  const injected = event.context.bootstrapFiles[0];
  assert.equal(injected.name, 'AGENTS.md');
  assert.equal(injected.missing, false);
  assert.match(injected.path, /using-superpowers[\\/]SKILL\.md$/);
  assert.match(injected.content, /<EXTREMELY_IMPORTANT>/);
  assert.match(injected.content, /Invoke relevant or requested skills BEFORE any response or action/);
  assert.match(injected.content, /brainstorming first, then implementation skills/);
  assert.match(injected.content, /OpenClaw tool mapping/);
  assert.match(injected.content, /\bskills\/brainstorming\/SKILL\.md\b/);
  assert.doesNotMatch(injected.content, /^---\nname: using-superpowers/m);

  await bootstrap(event);
  assert.equal(event.context.bootstrapFiles.length, 2, 'repeated hook invocation must not duplicate bootstrap');
});

test('bootstrap reinjects when invoked again with empty bootstrap files', async () => {
  const bootstrap = await registeredBootstrap();
  for (let invocation = 1; invocation <= 2; invocation++) {
    const event = { type: 'agent', action: 'bootstrap', context: { bootstrapFiles: [] } };
    await bootstrap(event);
    assert.equal(event.context.bootstrapFiles.length, 1, `invocation ${invocation} must receive bootstrap`);
    assert.match(event.context.bootstrapFiles[0].content, /You have superpowers/);
  }
});
