import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SuperpowersPlugin } from '../../.opencode/plugins/superpowers.js';

const makeOutput = () => ({
  parts: [{ type: 'text', text: 'hello' }]
});

const getAgentNameFromInput = (input) => {
  const candidates = [
    input?.agent,
    input?.agent?.name,
    input?.session?.agent,
    input?.session?.agent?.name,
    input?.session?.config?.agent,
    input?.session?.config?.agent?.name,
    input?.chat?.agent,
    input?.chat?.agent?.name,
    input?.message?.agent,
    input?.message?.agent?.name,
    input?.metadata?.agent,
    input?.metadata?.agent?.name
  ];
  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) || null;
};

const getDisabledBootstrapAgents = (options) => {
  const agents = options?.disableBootstrapForAgents;
  return Array.isArray(agents) ? agents.filter((agent) => typeof agent === 'string' && agent.trim()) : [];
};

const opencodeConfigDir = process.env.OPENCODE_CONFIG_DIR;
const tempRoot = opencodeConfigDir ? path.dirname(opencodeConfigDir) : fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-plugin-test-'));
const configRoot = opencodeConfigDir || path.join(tempRoot, '.config', 'opencode');
const pluginDir = path.join(configRoot, 'plugins');
const skillsDir = path.join(tempRoot, 'skills', 'using-superpowers');
fs.mkdirSync(pluginDir, { recursive: true });
fs.mkdirSync(skillsDir, { recursive: true });
fs.copyFileSync(new URL('../../.opencode/plugins/superpowers.js', import.meta.url), path.join(pluginDir, 'superpowers.js'));
fs.writeFileSync(path.join(pluginDir, 'superpowers.jsonc'), JSON.stringify({ disableBootstrapForAgents: ['empty-no', 'no-skills'] }));
fs.copyFileSync(new URL('../../skills/using-superpowers/SKILL.md', import.meta.url), path.join(skillsDir, 'SKILL.md'));

const pluginModule = await import(`file://${path.join(pluginDir, 'superpowers.js')}`);
const plugin = await pluginModule.SuperpowersPlugin({}, {});
const config = {};
await plugin.config(config);
const chatMessage = plugin['chat.message'];

assert.deepEqual(getDisabledBootstrapAgents({ disableBootstrapForAgents: ['empty-no', 'no-skills'] }), ['empty-no', 'no-skills']);
assert.deepEqual(getDisabledBootstrapAgents({}), []);
assert.equal(getAgentNameFromInput({ agent: 'empty-no' }), 'empty-no');
assert.equal(getAgentNameFromInput({ session: { agent: { name: 'plan' } } }), 'plan');
assert.equal(getAgentNameFromInput({ metadata: { agent: 'build' } }), 'build');
assert.equal(getAgentNameFromInput({}), null);

// Test disabled agent (top-level agent field)
const disabledTopLevel = makeOutput();
await chatMessage({ agent: 'empty-no', sessionID: 's1' }, disabledTopLevel);
assert.equal(disabledTopLevel.parts.length, 1, 'disabled top-level agent should skip bootstrap');
assert.equal(disabledTopLevel.parts[0].text, 'hello', 'text should be unchanged');

// Test disabled agent (nested agent in session)
const disabledNested = makeOutput();
await chatMessage({ session: { agent: { name: 'no-skills' } }, sessionID: 's2' }, disabledNested);
assert.equal(disabledNested.parts.length, 1, 'disabled nested agent should skip bootstrap');
assert.equal(disabledNested.parts[0].text, 'hello', 'text should be unchanged');

// Test enabled agent - bootstrap is prepended to output.parts
const enabledAgent = makeOutput();
await chatMessage({ agent: 'build', sessionID: 's3' }, enabledAgent);
assert.equal(enabledAgent.parts.length, 2, 'enabled agent should have 2 parts (bootstrap prepended)');
assert.match(enabledAgent.parts[0].text, /^<EXTREMELY_IMPORTANT>/, 'bootstrap should be prepended');

// Test second message in same session (should not reinject)
const secondMessage = makeOutput();
await chatMessage({ agent: 'build', sessionID: 's3' }, secondMessage);
assert.equal(secondMessage.parts.length, 1, 'later messages in same session should not reinject bootstrap');
assert.equal(secondMessage.parts[0].text, 'hello', 'text should be unchanged (no reinject)');

console.log('bootstrap agent control tests passed');

fs.rmSync(tempRoot, { recursive: true, force: true });