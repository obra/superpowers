import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const packageJsonPath = resolve(repoRoot, 'package.json');
const extensionPath = resolve(repoRoot, '.pi/extensions/superpowers.ts');
const piToolsPath = resolve(repoRoot, 'skills/using-superpowers/references/pi-tools.md');

async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8'));
}

async function loadExtension() {
  const handlers = new Map();
  const sentMessages = [];
  const pi = {
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event).push(handler);
    },
    sendMessage(message, options) {
      sentMessages.push({ message, options });
    },
  };
  const mod = await import(pathToFileURL(extensionPath).href + `?cachebust=${Date.now()}-${Math.random()}`);
  mod.default(pi);
  return { handlers, sentMessages };
}

function firstHandler(handlers, event) {
  const eventHandlers = handlers.get(event) ?? [];
  assert.equal(eventHandlers.length, 1, `expected one ${event} handler`);
  return eventHandlers[0];
}

function textOf(message) {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

function extensionContext(activeEntries = [], idle = true) {
  return {
    isIdle: () => idle,
    sessionManager: {
      buildContextEntries: () => activeEntries,
    },
  };
}

test('package.json declares a pi package with skills and extension resources', async () => {
  const pkg = await readPackageJson();

  assert.equal(pkg.name, 'superpowers');
  assert.ok(pkg.keywords.includes('pi-package'));
  assert.deepEqual(pkg.pi.skills, ['./skills']);
  assert.deepEqual(pkg.pi.extensions, ['./.pi/extensions/superpowers.ts']);
});

test('extension registers persisted bootstrap lifecycle hooks without a context transform', async () => {
  const { handlers } = await loadExtension();

  for (const event of ['resources_discover', 'session_start', 'session_compact', 'before_agent_start', 'agent_start', 'agent_end', 'message_end']) {
    assert.equal((handlers.get(event) ?? []).length, 1, `missing ${event} handler`);
  }
  assert.equal((handlers.get('context') ?? []).length, 0, 'bootstrap must not prepend transient context');
  assert.equal((handlers.get('session_before_compact') ?? []).length, 0);
});

test('resources_discover contributes the bundled skills directory', async () => {
  const { handlers } = await loadExtension();
  const discover = firstHandler(handlers, 'resources_discover');

  const result = await discover({ type: 'resources_discover', cwd: repoRoot, reason: 'startup' }, {});

  assert.deepEqual(result.skillPaths, [resolve(repoRoot, 'skills')]);
});

test('startup persists one hidden bootstrap message across provider requests and later turns', async () => {
  const { handlers } = await loadExtension();
  const sessionStart = firstHandler(handlers, 'session_start');
  const beforeAgentStart = firstHandler(handlers, 'before_agent_start');
  const agentEnd = firstHandler(handlers, 'agent_end');

  await sessionStart({ type: 'session_start', reason: 'startup' }, {});

  const firstRun = await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Let us make a react todo list', systemPrompt: [] },
    extensionContext(),
  );

  assert.equal(firstRun.message.customType, 'superpowers-bootstrap');
  assert.equal(firstRun.message.display, false);
  assert.match(textOf(firstRun.message), /You have superpowers/);
  assert.match(textOf(firstRun.message), /Pi tool mapping/);

  await agentEnd({ type: 'agent_end', messages: [] }, {});
  const secondRun = await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Now write tests', systemPrompt: [] },
    extensionContext([
      { id: 'bootstrap-startup', type: 'custom_message', customType: 'superpowers-bootstrap' },
    ]),
  );
  assert.equal(secondRun, undefined, 'persisted bootstrap should not be duplicated on later turns');
});

test('resumed sessions deduplicate against the active compaction-aware context', async () => {
  const retained = await loadExtension();
  const retainedSessionStart = firstHandler(retained.handlers, 'session_start');
  const retainedBeforeAgentStart = firstHandler(retained.handlers, 'before_agent_start');
  await retainedSessionStart({ type: 'session_start', reason: 'resume' }, {});

  const retainedBootstrap = await retainedBeforeAgentStart(
    { type: 'before_agent_start', prompt: 'Continue', systemPrompt: [] },
    extensionContext([
      { id: 'compaction-1', type: 'compaction', firstKeptEntryId: 'bootstrap-1' },
      { id: 'bootstrap-1', type: 'custom_message', customType: 'superpowers-bootstrap' },
    ]),
  );
  assert.equal(retainedBootstrap, undefined, 'a retained pre-compaction bootstrap remains model-visible');

  const compactedAway = await loadExtension();
  const compactedAwaySessionStart = firstHandler(compactedAway.handlers, 'session_start');
  const compactedAwayBeforeAgentStart = firstHandler(compactedAway.handlers, 'before_agent_start');
  await compactedAwaySessionStart({ type: 'session_start', reason: 'resume' }, {});

  const replacementBootstrap = await compactedAwayBeforeAgentStart(
    { type: 'before_agent_start', prompt: 'Continue', systemPrompt: [] },
    extensionContext([
      { id: 'compaction-2', type: 'compaction', firstKeptEntryId: 'kept-1' },
      { id: 'kept-1', type: 'message' },
    ]),
  );
  assert.equal(replacementBootstrap.message.customType, 'superpowers-bootstrap');

  const omp = await loadExtension();
  const ompSessionStart = firstHandler(omp.handlers, 'session_start');
  const ompBeforeAgentStart = firstHandler(omp.handlers, 'before_agent_start');
  await ompSessionStart({ type: 'session_start', reason: 'resume' }, {});

  const ompBootstrap = await ompBeforeAgentStart(
    { type: 'before_agent_start', prompt: 'Continue', systemPrompt: [] },
    {
      sessionManager: {
        buildSessionContext: () => ({
          messages: [{ role: 'custom', customType: 'superpowers-bootstrap' }],
        }),
      },
    },
  );
  assert.equal(ompBootstrap, undefined, 'OMP resume must reuse its active persisted bootstrap');
});

test('idle compaction persists a replacement without starting a run', async () => {
  const { handlers, sentMessages } = await loadExtension();
  const sessionStart = firstHandler(handlers, 'session_start');
  const sessionCompact = firstHandler(handlers, 'session_compact');
  const beforeAgentStart = firstHandler(handlers, 'before_agent_start');
  const agentEnd = firstHandler(handlers, 'agent_end');

  await sessionStart({ type: 'session_start', reason: 'startup' }, {});
  await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Start', systemPrompt: [] },
    extensionContext(),
  );
  await agentEnd({ type: 'agent_end', messages: [] }, {});

  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false },
    extensionContext([], true),
  );

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].message.customType, 'superpowers-bootstrap');
  assert.deepEqual(sentMessages[0].options, { deliverAs: 'steer' });
  const nextRun = await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Continue', systemPrompt: [] },
    extensionContext([
      { id: 'bootstrap-idle', type: 'custom_message', customType: 'superpowers-bootstrap' },
    ]),
  );
  assert.equal(nextRun, undefined, 'the idle replacement is already persisted');
});

test('compaction distinguishes pending, retained, and removed bootstraps', async () => {
  const { handlers, sentMessages } = await loadExtension();
  const sessionStart = firstHandler(handlers, 'session_start');
  const sessionCompact = firstHandler(handlers, 'session_compact');
  const beforeAgentStart = firstHandler(handlers, 'before_agent_start');
  const agentStart = firstHandler(handlers, 'agent_start');
  const agentEnd = firstHandler(handlers, 'agent_end');
  const messageEnd = firstHandler(handlers, 'message_end');

  await sessionStart({ type: 'session_start', reason: 'startup' }, {});
  await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Start', systemPrompt: [] },
    extensionContext(),
  );

  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false },
    extensionContext([], false),
  );
  assert.equal(sentMessages.length, 0, 'pre-prompt compaction must not duplicate the pending bootstrap');

  await agentStart({ type: 'agent_start' }, {});
  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false },
    extensionContext([
      { id: 'compaction-retained', type: 'compaction', firstKeptEntryId: 'bootstrap-retained' },
      { id: 'bootstrap-retained', type: 'custom_message', customType: 'superpowers-bootstrap' },
    ], false),
  );
  assert.equal(sentMessages.length, 0, 'active compaction must reuse a retained bootstrap');

  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false },
    extensionContext([
      { id: 'compaction-removed', type: 'compaction', firstKeptEntryId: 'kept-active' },
      { id: 'kept-active', type: 'message' },
    ], false),
  );

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].message.customType, 'superpowers-bootstrap');
  assert.equal(sentMessages[0].message.display, false);
  assert.match(textOf(sentMessages[0].message), /You have superpowers/);
  assert.deepEqual(sentMessages[0].options, { deliverAs: 'steer' });
  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false },
    extensionContext([], false),
  );
  assert.equal(sentMessages.length, 1, 'an uncommitted replacement must not be queued twice');

  await messageEnd(
    {
      type: 'message_end',
      message: { role: 'custom', customType: 'superpowers-bootstrap', content: '', display: false },
    },
    {},
  );
  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false },
    extensionContext([], false),
  );
  assert.equal(sentMessages.length, 2, 'a later compaction must replace the committed bootstrap again');

  await agentEnd({ type: 'agent_end', messages: [] }, {});
  const nextRun = await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Continue', systemPrompt: [] },
    extensionContext([
      { id: 'bootstrap-replacement', type: 'custom_message', customType: 'superpowers-bootstrap' },
    ]),
  );
  assert.equal(nextRun, undefined, 'active compaction already persisted the replacement bootstrap');
});

test('pre-prompt compaction replaces a reused bootstrap in the current run', async () => {
  const { handlers, sentMessages } = await loadExtension();
  const sessionStart = firstHandler(handlers, 'session_start');
  const sessionCompact = firstHandler(handlers, 'session_compact');
  const beforeAgentStart = firstHandler(handlers, 'before_agent_start');
  const agentStart = firstHandler(handlers, 'agent_start');
  const agentEnd = firstHandler(handlers, 'agent_end');

  await sessionStart({ type: 'session_start', reason: 'startup' }, {});
  await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Start', systemPrompt: [] },
    extensionContext(),
  );
  await agentStart({ type: 'agent_start' }, {});
  await agentEnd({ type: 'agent_end', messages: [] }, {});

  const reused = await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Continue', systemPrompt: [] },
    extensionContext([
      { id: 'bootstrap-reused', type: 'custom_message', customType: 'superpowers-bootstrap' },
    ]),
  );
  assert.equal(reused, undefined);

  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false, reason: 'threshold', willRetry: false },
    extensionContext([], false),
  );

  assert.equal(sentMessages.length, 1, 'the current post-compaction request needs a persisted replacement');
  assert.equal(sentMessages[0].message.customType, 'superpowers-bootstrap');
  assert.deepEqual(sentMessages[0].options, { deliverAs: 'steer' });
});

test('post-agent-end retry compaction queues bootstrap before continuation', async () => {
  const { handlers, sentMessages } = await loadExtension();
  const sessionStart = firstHandler(handlers, 'session_start');
  const sessionCompact = firstHandler(handlers, 'session_compact');
  const beforeAgentStart = firstHandler(handlers, 'before_agent_start');
  const agentStart = firstHandler(handlers, 'agent_start');
  const agentEnd = firstHandler(handlers, 'agent_end');

  await sessionStart({ type: 'session_start', reason: 'startup' }, {});
  await beforeAgentStart(
    { type: 'before_agent_start', prompt: 'Start', systemPrompt: [] },
    extensionContext(),
  );
  await agentStart({ type: 'agent_start' }, {});
  await agentEnd({ type: 'agent_end', messages: [] }, {});

  await sessionCompact(
    { type: 'session_compact', compactionEntry: {}, fromExtension: false, reason: 'overflow', willRetry: true },
    extensionContext([], false),
  );

  assert.equal(sentMessages.length, 1, 'the immediate retry must inherit a bootstrap');
  assert.equal(sentMessages[0].message.customType, 'superpowers-bootstrap');
  assert.deepEqual(sentMessages[0].options, { deliverAs: 'steer' });
});

test('pi tools reference documents pi-specific mappings', async () => {
  assert.equal(existsSync(piToolsPath), true, 'pi-tools.md should exist');
  const text = await readFile(piToolsPath, 'utf8');

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
