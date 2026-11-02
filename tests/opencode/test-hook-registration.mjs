import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Issue #2391: the V2 plugin must register bootstrap injection on
// `context`, `compaction`, and `generate`. OpenCode dispatches each request
// shape through a different hook, so a handler on `context` only means
// compaction and generate requests diverge from the cached prefix at the
// tail — a cold re-prefill of the whole session on the largest request of
// its lifetime.

const [, , inputPath] = process.argv;
assert.ok(inputPath, 'pass the plugin module path');
const pluginURL = pathToFileURL(fs.realpathSync(inputPath));
const marker = '<EXTREMELY_IMPORTANT>\nYou have superpowers.';
let generation = 0;

async function captureHooks(fetchSession) {
  const mod = await import(`${pluginURL.href}?hooks-test=${++generation}`);
  const hooks = new Map();
  await mod.default.setup({
    skill: { transform: async (transform) => transform({ add: () => {} }) },
    session: {
      get: ({ sessionID }) => fetchSession(sessionID),
      hook: async (name, callback) => { hooks.set(name, callback); },
    },
  });
  return hooks;
}

function event(sessionID) {
  return {
    sessionID,
    messages: [{ role: 'user', content: [{ type: 'text', text: 'continue' }] }],
  };
}

const session = (id) => ({ id });

// All three request hooks must be registered.
for (const required of ['context', 'compaction', 'generate']) {
  const hooks = await captureHooks(async (id) => session(id));
  assert.ok(hooks.has(required), `plugin registers '${required}' hook`);
}

// One shared handler: the three hooks resolve to the same function so
// behaviour cannot drift between request shapes.
const shared = await captureHooks(async (id) => session(id));
assert.equal(
  shared.get('compaction'),
  shared.get('context'),
  'compaction handler is the context handler',
);
assert.equal(
  shared.get('generate'),
  shared.get('context'),
  'generate handler is the context handler',
);

// Each hook actually injects the bootstrap into an eligible session.
for (const name of ['context', 'compaction', 'generate']) {
  const hooks = await captureHooks(async (id) => session(id));
  const ev = event(`${name}-root`);
  await hooks.get(name)(ev);
  assert.equal(
    ev.messages[0].content.filter((p) => p.text?.startsWith(marker)).length,
    1,
    `'${name}' hook injects bootstrap exactly once`,
  );
}

// Child sessions stay suppressed on every hook (regression guard against
// only 'context' checking parentID while compaction/generate skip the check).
for (const name of ['context', 'compaction', 'generate']) {
  const hooks = await captureHooks(async (id) => ({ id, parentID: 'parent' }));
  const ev = event(`${name}-child`);
  await hooks.get(name)(ev);
  assert.equal(
    ev.messages[0].content.filter((p) => p.text?.startsWith(marker)).length,
    0,
    `'${name}' hook skips bootstrap for child sessions`,
  );
}

// Idempotence: a second delivery of the same event does not double-inject.
for (const name of ['context', 'compaction', 'generate']) {
  const hooks = await captureHooks(async (id) => session(id));
  const ev = event(`${name}-root`);
  await hooks.get(name)(ev);
  await hooks.get(name)(ev);
  assert.equal(
    ev.messages[0].content.filter((p) => p.text?.startsWith(marker)).length,
    1,
    `'${name}' hook stays idempotent on repeat`,
  );
}

console.log('V2 hook registration (context/compaction/generate) passed');
