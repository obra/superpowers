import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { default: plugin } = await import('../../.kilo/plugin/superpowers.js');
const marker = '<EXTREMELY_IMPORTANT>\nYou have superpowers.';
const clientFor = get => ({ session: { get } });

async function transform(hooks, sessionID, system = ['Original Kilo system prompt']) {
  const output = { system };
  await hooks['experimental.chat.system.transform']({ sessionID }, output);
  return output;
}
const bootstrapCount = output => output.system.join('\n').split(marker).length - 1;

// Contract tests do not replace the real clean-session/model acceptance test.
test('package selects a native Kilo server without changing the OpenCode entrypoint', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.exports['./server'], './.kilo/plugin/superpowers.js');
  assert.equal(manifest.exports['.'], './.opencode/plugins/superpowers.js');
  assert.equal(manifest.main, '.opencode/plugins/superpowers.js');
});

test('preserves previously accessible package subpaths', () => {
  const require = createRequire(import.meta.url);
  for (const relative of ['package.json', 'skills/brainstorming/SKILL.md', '.opencode/plugins/superpowers.js', '.pi/extensions/superpowers.ts']) {
    assert.equal(require.resolve(`superpowers/${relative}`), path.join(root, relative));
  }
});

test('native default export exposes config and system hooks without dependencies', async () => {
  assert.equal(plugin.id, 'superpowers');
  const hooks = await plugin.server({ client: clientFor(async () => ({})) });
  assert.equal(typeof hooks.config, 'function');
  assert.equal(typeof hooks['experimental.chat.system.transform'], 'function');
  assert.equal(hooks['experimental.chat.messages.transform'], undefined);
});

test('registers original skill directory once, preserving user configuration', async () => {
  const hooks = await plugin.server({ client: clientFor(async () => ({})) });
  const config = { skills: { paths: ['/existing/skills'], urls: ['https://example.com/skills'] } };
  await hooks.config(config);
  await hooks.config(config);
  assert.deepEqual(config.skills, { paths: ['/existing/skills', path.join(root, 'skills')], urls: ['https://example.com/skills'] });
  assert.ok(fs.existsSync(path.join(config.skills.paths[1], 'brainstorming/SKILL.md')));
  assert.deepEqual(config.skill_path_origins, { [path.join(root, 'skills')]: { trusted: true } });
  assert.equal(config.permission, undefined);
});

test('preserves existing source provenance and never grants trust to other skill paths', async () => {
  const hooks = await plugin.server({ client: clientFor(async () => ({})) });
  const origins = { [path.join(root, 'skills')]: { trusted: false, root: '/limited' }, '/other': { trusted: false, root: '/other' } };
  const permission = { '*': 'ask' };
  const config = { skills: { paths: ['/other'] }, skill_path_origins: structuredClone(origins), permission };
  await hooks.config(config);
  assert.deepEqual(config.skill_path_origins, origins);
  assert.equal(config.permission, permission);
});

test('appends bootstrap at system priority, without adding another system message', async () => {
  const calls = [];
  const hooks = await plugin.server({ client: clientFor(async args => {
    calls.push(args);
    return { data: { id: 'first-root' } };
  }) });
  const output = await transform(hooks, 'first-root', ['First instruction', 'Last instruction']);
  assert.equal(bootstrapCount(output), 1);
  assert.equal(output.system.length, 2);
  assert.equal(output.system[0], 'First instruction');
  assert.ok(output.system[1].startsWith('Last instruction\n\n' + marker));
  assert.match(output.system[1], /Tool Mapping for Kilo Code/);
  assert.match(output.system[1], /native `skill` tool/);
  assert.doesNotMatch(output.system[1], /OpenCode|apply_patch/);
  assert.match(output.system[1], /`write`.*`edit`/);
  assert.doesNotMatch(output.system[1], /name: using-superpowers/);
  assert.deepEqual(calls, [{ path: { id: 'first-root' } }]);
});

test('does not duplicate bootstrap and restores it in freshly loaded system prompts', async () => {
  let calls = 0;
  const hooks = await plugin.server({ client: clientFor(async () => {
    calls++;
    return { data: { id: 'repeat-root' } };
  }) });
  const first = await transform(hooks, 'repeat-root');
  assert.equal(bootstrapCount(await transform(hooks, 'repeat-root', first.system)), 1);
  assert.equal(bootstrapCount(await transform(hooks, 'repeat-root')), 1);
  assert.equal(calls, 1);
});

test('handles empty system prompts without creating user messages', async () => {
  const hooks = await plugin.server({ client: clientFor(async () => ({ data: { id: 'empty-root' } })) });
  const output = await transform(hooks, 'empty-root', []);
  assert.equal(output.system.length, 1);
  assert.equal(bootstrapCount(output), 1);
  assert.deepEqual(Object.keys(output), ['system']);
});

test('child sessions retain skills without the controller bootstrap', async () => {
  const hooks = await plugin.server({ client: clientFor(async () => ({ data: { id: 'worker-child', parentID: 'parent' } })) });
  const system = ['Original Kilo system prompt'];
  assert.equal(bootstrapCount(await transform(hooks, 'worker-child', system)), 0);
  assert.deepEqual(system, ['Original Kilo system prompt']);
  const config = {};
  await hooks.config(config);
  assert.ok(config.skills.paths.includes(path.join(root, 'skills')));
});

test('forks without a parent remain top-level sessions', async () => {
  const hooks = await plugin.server({ client: clientFor(async () => ({ data: { id: 'fork', fork: { sessionID: 'source' } } })) });
  assert.equal(bootstrapCount(await transform(hooks, 'fork')), 1);
});

for (const [kind, failure] of [
  ['rejected', () => { throw new Error('temporary failure'); }],
  ['resolved error', () => ({ error: { message: 'temporary failure' } })],
  ['wrong identity', () => ({ data: { id: 'wrong-session' } })],
  ['invalid parent', () => ({ data: { id: 'retry-child', parentID: '' } })],
]) {
  test(`retries ${kind} lookup rather than caching a false top-level decision`, async () => {
    let calls = 0;
    const hooks = await plugin.server({ client: clientFor(async () => {
      if (++calls === 1) return failure();
      return { data: { id: 'retry-child', parentID: 'parent' } };
    }) });
    assert.equal(bootstrapCount(await transform(hooks, 'retry-child')), 1);
    assert.equal(bootstrapCount(await transform(hooks, 'retry-child')), 0);
    assert.equal(calls, 2);
  });
}

test('bounds child-session cache and isolates server instances', async () => {
  const calls = [];
  const hooks = await plugin.server({ client: clientFor(async ({ path: { id } }) => {
    calls.push(id);
    return { data: { id, parentID: 'parent' } };
  }) });
  for (let i = 0; i <= 512; i++) assert.equal(bootstrapCount(await transform(hooks, `child-${i}`)), 0);
  assert.equal(bootstrapCount(await transform(hooks, 'child-0')), 0);
  assert.equal(calls.filter(id => id === 'child-0').length, 2);
  const rootHooks = await plugin.server({ client: clientFor(async () => ({ data: { id: 'child-0' } })) });
  assert.equal(bootstrapCount(await transform(rootHooks, 'child-0')), 1);
});

test('missing session identity injects bootstrap without an invalid lookup', async () => {
  const hooks = await plugin.server({ client: clientFor(async () => { throw new Error('unexpected lookup'); }) });
  assert.equal(bootstrapCount(await transform(hooks, undefined)), 1);
});

test('OpenCode retains its own user-message bootstrap and tool mapping', async () => {
  const { SuperpowersPlugin } = await import('../../.opencode/plugins/superpowers.js');
  const hooks = await SuperpowersPlugin({ client: clientFor(async () => ({ data: { id: 'opencode-root' } })) });
  const output = { messages: [{ info: { role: 'user', sessionID: 'opencode-root' }, parts: [{ type: 'text', text: 'Continue' }] }] };
  await hooks['experimental.chat.messages.transform']({}, output);
  assert.match(output.messages[0].parts[0].text, /Tool Mapping for OpenCode/);
  assert.doesNotMatch(output.messages[0].parts[0].text, /Tool Mapping for Kilo Code/);
});
