// Test helper: compaction re-injection for the OpenCode plugin.
// Patterned on test-bootstrap-caching.mjs: driven by
// test-compaction-reinject.sh, which installs the plugin + real skills
// into an isolated HOME via setup.sh, so SKILL.md is genuinely present.
//
// Usage: node test-compaction-reinject.mjs PLUGIN_PATH
import fs from 'fs';
import { pathToFileURL } from 'url';

const [, , pluginPath] = process.argv;

if (!pluginPath) {
  console.error('Usage: node test-compaction-reinject.mjs PLUGIN_PATH');
  process.exit(2);
}

let readCount = 0;
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function (...args) {
  if (String(args[0]).replaceAll('\\', '/').includes('using-superpowers/SKILL.md')) {
    readCount += 1;
  }
  return originalReadFileSync.apply(this, args);
};

const mod = await import(pathToFileURL(pluginPath).href);
const plugin = await mod.SuperpowersPlugin({ client: {}, directory: '.' });
const transform = plugin['experimental.chat.messages.transform'];

const failures = [];
const check = (name, cond, extra = '') => {
  if (!cond) failures.push(extra ? `${name} (${extra})` : name);
};

const bootstrapParts = (msg) =>
  (msg.parts || []).filter(
    (part) => part.type === 'text' && typeof part.text === 'string' && part.text.includes('EXTREMELY_IMPORTANT'),
  ).length;

const userMsg = (text, sessionID = 'sess-1') => ({
  info: { role: 'user' },
  parts: [{ type: 'text', text, sessionID }],
});

// 1. Normal session: injects once; a second pass over the transformed array
// is a no-op via the target-turn guard (existing behavior, unchanged).
{
  const out = { messages: [userMsg('hello first step')] };
  await transform({}, out);
  check('normal first step injects one bootstrap part', bootstrapParts(out.messages[0]) === 1);
  const readsAfterFirst = readCount;
  await transform({}, out);
  check('normal second step does not double-inject', bootstrapParts(out.messages[0]) === 1);
  check(
    'bootstrap content is cached (no extra reads)',
    readCount === readsAfterFirst,
    `reads ${readsAfterFirst} -> ${readCount}`,
  );
}

// 2. Post-compaction, truncated history: leading compactionSummary plus a
// fresh user turn gets the bootstrap.
{
  const out = {
    messages: [
      { info: { role: 'compactionSummary' }, parts: [{ type: 'text', text: 'summary of earlier work', sessionID: 'sess-1' }] },
      userMsg('continue after compaction'),
    ],
  };
  await transform({}, out);
  const fresh = out.messages[out.messages.length - 1];
  check('post-compaction fresh turn is re-grounded', bootstrapParts(fresh) === 1, `got ${bootstrapParts(fresh)}`);
}

// 3. Post-compaction, preserved history: a stale pre-compaction copy
// elsewhere must NOT suppress re-injection of the continue-turn.
{
  const out = {
    messages: [
      userMsg('<EXTREMELY_IMPORTANT> stale pre-compaction copy </EXTREMELY_IMPORTANT>'),
      { info: { role: 'compactionSummary' }, parts: [{ type: 'text', text: 'summary', sessionID: 'sess-1' }] },
      userMsg('continue after compaction'),
    ],
  };
  await transform({}, out);
  const fresh = out.messages[out.messages.length - 1];
  check('stale history copy does not suppress re-injection', bootstrapParts(fresh) === 1, `got ${bootstrapParts(fresh)}`);
}

// 4. Post-compaction turn that already carries the marker is left alone.
{
  const out = {
    messages: [
      { info: { role: 'compactionSummary' }, parts: [{ type: 'text', text: 'summary', sessionID: 'sess-1' }] },
      userMsg('<EXTREMELY_IMPORTANT> already here </EXTREMELY_IMPORTANT>'),
    ],
  };
  await transform({}, out);
  check('compacted turn with marker is left alone', bootstrapParts(out.messages[1]) === 1);
}

// 5. Flag paths: the compaction hooks mark the session even when no
// compaction artifact is visible in the transform input.
{
  if (typeof plugin['experimental.session.compacting'] === 'function') {
    await plugin['experimental.session.compacting']({ sessionID: 'sess-flag' });
    const out = { messages: [userMsg('fresh turn, no summary message', 'sess-flag')] };
    await transform({}, out);
    check('flagged session injects without artifact', bootstrapParts(out.messages[0]) === 1);
  } else {
    check('compaction flag hook exists', false, 'missing experimental.session.compacting');
  }
  if (typeof plugin.event === 'function') {
    await plugin.event({ event: { type: 'session.compacted', properties: { sessionID: 'sess-evt' } } });
    const out = { messages: [userMsg('fresh turn after event', 'sess-evt')] };
    await transform({}, out);
    check('session.compacted event marks session', bootstrapParts(out.messages[0]) === 1);
  } else {
    check('session.compacted event hook exists', false, 'missing event hook');
  }
  if (typeof plugin['experimental.compaction.autocontinue'] === 'function') {
    await plugin['experimental.compaction.autocontinue']({ sessionID: 'sess-auto' });
    const out = { messages: [userMsg('fresh turn after autocontinue', 'sess-auto')] };
    await transform({}, out);
    check('compaction.autocontinue marks session', bootstrapParts(out.messages[0]) === 1);
  } else {
    check('compaction.autocontinue hook exists', false, 'missing experimental.compaction.autocontinue');
  }
}

// 6. Once per compaction: re-running the transform over an already
// re-grounded array injects nothing further.
{
  const out = {
    messages: [
      { info: { role: 'compactionSummary' }, parts: [{ type: 'text', text: 'summary', sessionID: 'sess-1' }] },
      userMsg('continue after compaction'),
    ],
  };
  await transform({}, out);
  await transform({}, out);
  const total = out.messages.reduce((n, m) => n + bootstrapParts(m), 0);
  check('re-running over re-grounded history injects nothing further', total === 1, `got ${total}`);
}

// 7. ...and neither does a later user turn: the earlier continue-turn's
// copy already grounds the post-compaction context (Pi parity — no
// per-turn token bloat, see #750).
{
  const out = {
    messages: [
      { info: { role: 'compactionSummary' }, parts: [{ type: 'text', text: 'summary', sessionID: 'sess-1' }] },
      userMsg('continue after compaction'),
    ],
  };
  await transform({}, out);
  out.messages.push(userMsg('a later follow-up'));
  await transform({}, out);
  const total = out.messages.reduce((n, m) => n + bootstrapParts(m), 0);
  check('later post-compaction turns reuse the earlier grounding', total === 1, `got ${total}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log(JSON.stringify({ checks: 11, readCount }, null, 2));
