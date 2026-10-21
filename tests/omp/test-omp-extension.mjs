import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const extensionSource = resolve(repoRoot, '.omp/extensions/superpowers.ts');
const roots = [];

test.afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

// Installs the real extension file into a throwaway package root, so each test
// controls the bundled using-superpowers skill the extension reads.
function install(skill) {
  const root = mkdtempSync(join(tmpdir(), 'superpowers-omp-'));
  roots.push(root);
  mkdirSync(join(root, '.omp', 'extensions'), { recursive: true });
  copyFileSync(extensionSource, join(root, '.omp', 'extensions', 'superpowers.ts'));
  mkdirSync(join(root, 'skills', 'using-superpowers'), { recursive: true });
  if (skill !== undefined) writeSkill(root, skill);
  return root;
}

function writeSkill(root, body) {
  writeFileSync(join(root, 'skills', 'using-superpowers', 'SKILL.md'), body);
}

async function load(root) {
  const handlers = new Map();
  const omp = {
    on(event, handler) {
      assert.equal(handlers.has(event), false, `duplicate ${event} handler`);
      handlers.set(event, handler);
    },
  };
  const mod = await import(pathToFileURL(join(root, '.omp', 'extensions', 'superpowers.ts')).href);
  mod.default(omp);
  const ctx = { cwd: root, hasUI: false };
  const request = [{ role: 'user', content: 'Let\'s make a react todo list', timestamp: 1 }];
  return {
    handlers,
    request,
    async run(systemPrompt = ['Base system prompt.']) {
      return handlers.get('before_agent_start')({ type: 'before_agent_start', prompt: 'go', systemPrompt }, ctx);
    },
    async context(messages = request) {
      const result = await handlers.get('context')({ type: 'context', messages }, ctx);
      return result?.messages ?? messages;
    },
    async emit(type) {
      await handlers.get(type)?.({ type }, ctx);
    },
  };
}

const text = (message) => JSON.stringify(message.content);

test('package.json declares the native OMP entry and keeps the Pi entry', () => {
  const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.omp, { extensions: ['./.omp/extensions/superpowers.ts'] });
  assert.deepEqual(pkg.pi.extensions, ['./.pi/extensions/superpowers.ts']);
});

test('delivers the bootstrap as one leading user message, never in the system prompt', async () => {
  const omp = await load(install('\uFEFF---\r\nname: frontmatter-only\r\n---\r\n\r\n# Using Superpowers\r\nInvoke skills first.\r\n'));
  assert.equal(await omp.run(), undefined, 'system prompt and history stay untouched');

  const messages = await omp.context();
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'user');
  assert.match(text(messages[0]), /You have superpowers/);
  assert.match(text(messages[0]), /Invoke skills first\./);
  assert.match(text(messages[0]), /OMP tool mapping/);
  assert.doesNotMatch(text(messages[0]), /frontmatter-only/);
  assert.equal(messages[1], omp.request[0]);
  assert.equal(omp.request.length, 1, 'the caller\'s array is not mutated');
  assert.deepEqual(await omp.context(structuredClone(messages)), messages, 'a re-sent view is not duplicated');
});

// The shared Pi extension clears its flag at agent_end, so on OMP only the first
// run of a session saw the bootstrap. Every provider request must carry it.
test('keeps the bootstrap on later runs and after compaction', async () => {
  const omp = await load(install('Policy stays available.'));
  await omp.run();
  await omp.context();
  await omp.emit('agent_end');
  // Compaction retries and queued follow-ups can reach the provider without a
  // new before_agent_start.
  assert.match(text((await omp.context())[0]), /Policy stays available\./);
  await omp.run();
  assert.match(text((await omp.context())[0]), /Policy stays available\./);

  await omp.emit('session_compact');
  const summary = { role: 'compactionSummary', summary: 'Earlier work', tokensBefore: 42, timestamp: 2 };
  const compacted = await omp.context([summary, ...omp.request]);
  assert.equal(compacted.length, 3);
  assert.equal(compacted[0], summary, 'the bootstrap follows compaction summaries');
  assert.match(text(compacted[1]), /Policy stays available\./);
  assert.equal(compacted[2], omp.request[0]);
});

test('keeps the bootstrap after a branch summary', async () => {
  const omp = await load(install('Branch policy.'));
  await omp.run();
  const summary = { role: 'branchSummary', summary: 'Abandoned branch', fromId: 'x', timestamp: 2 };
  const messages = await omp.context([summary, ...omp.request]);
  assert.equal(messages[0], summary);
  assert.match(text(messages[1]), /Branch policy\./);
});

test('refreshes an updated skill at the next run, not mid-run', async () => {
  const root = install('Original policy.');
  const omp = await load(root);
  await omp.run();
  writeSkill(root, 'Updated policy.');
  assert.match(text((await omp.context())[0]), /Original policy\./);
  await omp.run();
  const messages = await omp.context();
  assert.equal(messages.length, 2);
  assert.match(text(messages[0]), /Updated policy\./);
});

test('a missing skill warns visibly, injects nothing, and recovers after repair', async () => {
  const root = install('Installed policy.');
  const omp = await load(root);
  await omp.run();
  const previous = await omp.context();
  rmSync(join(root, 'skills', 'using-superpowers', 'SKILL.md'));

  const missing = await omp.run();
  assert.equal(missing.message.display, true);
  assert.match(missing.message.content, /SKILL\.md/);
  assert.equal(missing.systemPrompt, undefined);
  assert.deepEqual(await omp.context(previous), omp.request, 'stale policy is removed');
  // The warning is persisted in the session, so a lasting failure reports once.
  assert.equal(await omp.run(), undefined);

  writeSkill(root, 'Repaired policy.');
  assert.equal(await omp.run(), undefined);
  assert.match(text((await omp.context())[0]), /Repaired policy\./);
  rmSync(join(root, 'skills', 'using-superpowers', 'SKILL.md'));
  assert.match((await omp.run()).message.content, /SKILL\.md/, 'a new failure after recovery warns again');
  await omp.emit('session_switch');
  assert.match((await omp.run()).message.content, /SKILL\.md/, 'another session is warned too');
});

test('a skill without a body warns instead of injecting an empty bootstrap', async () => {
  const omp = await load(install('---\nname: using-superpowers\n---\n'));
  assert.match((await omp.run()).message.content, /no content/);
  assert.deepEqual(await omp.context(), omp.request);
});

test('quoted bootstrap text neither suppresses the bootstrap nor removes user messages', async () => {
  const omp = await load(install('Real policy.'));
  const quoted = [{ role: 'user', content: 'You have superpowers. <EXTREMELY_IMPORTANT>', timestamp: 1 }];
  await omp.run();
  const messages = await omp.context(quoted);
  assert.equal(messages.length, 2);
  assert.match(text(messages[0]), /Real policy\./);
  assert.equal(messages[1], quoted[0]);
});

test('session changes drop the old bootstrap and ignore a load that finishes late', async () => {
  const root = install('Old session policy.');
  const omp = await load(root);
  await omp.run();
  const old = await omp.context();
  for (const event of ['session_switch', 'session_branch', 'session_tree', 'session_shutdown', 'session_start']) {
    await omp.run();
    await omp.emit(event);
    assert.deepEqual(await omp.context(old), omp.request, `${event} clears the bootstrap`);
  }

  const pending = omp.run();
  await omp.emit('session_switch');
  await pending;
  assert.deepEqual(await omp.context(), omp.request, 'a load from the previous session is discarded');
});
