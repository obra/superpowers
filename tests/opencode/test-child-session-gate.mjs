import { pathToFileURL } from 'url';

// Test: Child session gate (#2160)
//
// Drives the plugin's experimental.chat.messages.transform with a mock
// client to verify the #2160 child-session gate:
//   - child sessions (parentID set) never receive the controller bootstrap
//   - top-level sessions and degenerate shapes still receive it
//   - lookup failures fail open, are NOT cached, and recover next step
//   - session.get is called with { throwOnError: true }
//   - skip/error decisions are logged exactly once per session
//
// Usage: node test-child-session-gate.mjs PLUGIN_PATH CASE_NAME

const [, , pluginPath, caseName] = process.argv;

const cases = {
  'skip-child-envelope': skipChildEnvelope,
  'inject-top-level-envelope': injectTopLevelEnvelope,
  'skip-child-bare-record': skipChildBareRecord,
  'skip-child-envelope-parentid-key': skipChildEnvelopeParentIDKey,
  'error-tuple-fail-open-uncached': errorTupleFailOpenUncached,
  'throw-fail-open-uncached': throwFailOpenUncached,
  'transient-error-recovers': transientErrorRecovers,
  'degenerate-shapes-inject': degenerateShapesInject,
};

if (!pluginPath || !cases[caseName]) {
  console.error(`Usage: node test-child-session-gate.mjs PLUGIN_PATH ${Object.keys(cases).join('|')}`);
  process.exit(2);
}

// Capture plugin console output ([superpowers] lines) instead of printing it.
const capturedLogs = [];
const capturedErrors = [];
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => capturedLogs.push(args.map(String).join(' '));
console.error = (...args) => capturedErrors.push(args.map(String).join(' '));

const failures = [];
const superpowersLines = () => [...capturedLogs, ...capturedErrors]
  .filter((line) => line.includes('[superpowers]'));
const skipLogs = () => superpowersLines().filter((line) => line.includes('skipping'));
const errorLogs = () => superpowersLines().filter((line) => line.includes('lookup failed'));

try {
  await cases[caseName]();
} catch (err) {
  failures.push(`unexpected exception: ${err && err.stack ? err.stack : String(err)}`);
} finally {
  console.log = originalLog;
  console.error = originalError;
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${caseName}`);

// --- helpers -----------------------------------------------------------------

function makeClient(respond) {
  const calls = [];
  const client = {
    session: {
      get: async (arg, opts) => {
        const id = arg && arg.path && arg.path.id;
        calls.push({ id, opts });
        const shaped = respond(id, calls.length);
        if (shaped && shaped.__throw) throw shaped.__throw;
        return shaped;
      },
    },
  };
  return { client, calls };
}

function makeOutput(sessionID, text) {
  return {
    messages: [{
      info: { role: 'user', sessionID },
      parts: [{ type: 'text', text }],
    }],
  };
}

function countBootstrapParts(output) {
  return output.messages[0].parts.filter(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT'),
  ).length;
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function loadPlugin(client) {
  const mod = await import(pathToFileURL(pluginPath).href);
  const plugin = await mod.SuperpowersPlugin({ client, directory: '.' });
  return plugin['experimental.chat.messages.transform'];
}

function expectThrowOnError(calls, caseLabel) {
  const without = calls.filter((call) => !(call.opts && call.opts.throwOnError === true));
  expect(
    without.length === 0,
    `${caseLabel}: expected every session.get call to pass { throwOnError: true }, ${without.length} call(s) did not`,
  );
}

// --- cases -------------------------------------------------------------------

// Child session via the V1 SDK envelope { data: Session }: no injection on any
// step, one cached lookup, one visibility log.
async function skipChildEnvelope() {
  const { client, calls } = makeClient(() => ({ data: { id: 'sess-child', parentID: 'sess-parent' } }));
  const transform = await loadPlugin(client);

  const step1 = makeOutput('sess-child', 'child session first step');
  const step2 = makeOutput('sess-child', 'child session second step');
  await transform({}, step1);
  await transform({}, step2);

  expect(countBootstrapParts(step1) === 0, `expected no bootstrap in child session step 1, got ${countBootstrapParts(step1)}`);
  expect(countBootstrapParts(step2) === 0, `expected no bootstrap in child session step 2, got ${countBootstrapParts(step2)}`);
  expect(calls.length === 1, `expected the child decision to be cached after one lookup, got ${calls.length} lookups`);
  expect(skipLogs().length === 1, `expected exactly one skip log line, got ${skipLogs().length}`);
  expectThrowOnError(calls, 'skip-child-envelope');
}

// Top-level session via the V1 SDK envelope: injection on fresh message
// arrays, one cached lookup, no skip log.
async function injectTopLevelEnvelope() {
  const { client, calls } = makeClient(() => ({ data: { id: 'sess-top' } }));
  const transform = await loadPlugin(client);

  const step1 = makeOutput('sess-top', 'top-level first step');
  const step2 = makeOutput('sess-top', 'top-level second step');
  await transform({}, step1);
  await transform({}, step2);

  expect(countBootstrapParts(step1) === 1, `expected bootstrap in top-level session step 1, got ${countBootstrapParts(step1)}`);
  expect(countBootstrapParts(step2) === 1, `expected bootstrap in top-level session step 2, got ${countBootstrapParts(step2)}`);
  expect(calls.length === 1, `expected the top-level decision to be cached after one lookup, got ${calls.length} lookups`);
  expect(skipLogs().length === 0, `expected no skip log for top-level session, got ${skipLogs().length}`);
}

// Child session via a bare V2-style record: no injection.
async function skipChildBareRecord() {
  const { client, calls } = makeClient(() => ({ id: 'sess-child-v2', parentID: 'sess-parent' }));
  const transform = await loadPlugin(client);

  const step = makeOutput('sess-child-v2', 'v2 child session step');
  await transform({}, step);

  expect(countBootstrapParts(step) === 0, `expected no bootstrap in bare-record child session, got ${countBootstrapParts(step)}`);
  expect(calls.length === 1, `expected exactly one lookup, got ${calls.length}`);
  expect(skipLogs().length === 1, `expected exactly one skip log line, got ${skipLogs().length}`);
}

// Envelope that carries its own parentID key (even undefined) must not
// defeat detection of data.parentID (#2160 review finding: heuristic hole).
async function skipChildEnvelopeParentIDKey() {
  const { client, calls } = makeClient(() => ({ parentID: undefined, data: { id: 'sess-hole', parentID: 'sess-parent' } }));
  const transform = await loadPlugin(client);

  const step1 = makeOutput('sess-hole', 'envelope hole first step');
  const step2 = makeOutput('sess-hole', 'envelope hole second step');
  await transform({}, step1);
  await transform({}, step2);

  expect(countBootstrapParts(step1) === 0, `expected no bootstrap when envelope carries its own parentID key, got ${countBootstrapParts(step1)}`);
  expect(countBootstrapParts(step2) === 0, `expected no bootstrap on step 2 for parentID-key envelope, got ${countBootstrapParts(step2)}`);
  expect(calls.length === 1, `expected exactly one lookup, got ${calls.length}`);
  expect(skipLogs().length === 1, `expected exactly one skip log line, got ${skipLogs().length}`);
}

// Non-2xx without throwOnError resolves as { data: undefined, error, response }.
// That must fail open (inject), NOT poison the cache, and log once — the exact
// regression from the #2160 review: one transient error would otherwise pin a
// child session as top-level for its whole life.
async function errorTupleFailOpenUncached() {
  const { client, calls } = makeClient(() => ({ data: undefined, error: { name: 'NotFound' }, response: { status: 404 } }));
  const transform = await loadPlugin(client);

  const steps = [
    makeOutput('sess-tuple-err', 'tuple error step 1'),
    makeOutput('sess-tuple-err', 'tuple error step 2'),
    makeOutput('sess-tuple-err', 'tuple error step 3'),
  ];
  for (const step of steps) await transform({}, step);

  steps.forEach((step, i) => {
    expect(countBootstrapParts(step) === 1, `expected fail-open bootstrap on tuple-error step ${i + 1}, got ${countBootstrapParts(step)}`);
  });
  expect(calls.length === 3, `expected failed lookups to stay uncached (3 retries), got ${calls.length} lookups`);
  expect(errorLogs().length === 1, `expected exactly one lookup-failure log line, got ${errorLogs().length}`);
  expectThrowOnError(calls, 'error-tuple-fail-open-uncached');
}

// A rejecting lookup must fail open, stay uncached, and log once (not per step).
async function throwFailOpenUncached() {
  const { client, calls } = makeClient(() => ({ __throw: new Error('network unreachable') }));
  const transform = await loadPlugin(client);

  const steps = [
    makeOutput('sess-throw', 'throw step 1'),
    makeOutput('sess-throw', 'throw step 2'),
    makeOutput('sess-throw', 'throw step 3'),
  ];
  for (const step of steps) await transform({}, step);

  steps.forEach((step, i) => {
    expect(countBootstrapParts(step) === 1, `expected fail-open bootstrap on throw step ${i + 1}, got ${countBootstrapParts(step)}`);
  });
  expect(calls.length === 3, `expected failed lookups to stay uncached (3 retries), got ${calls.length} lookups`);
  expect(errorLogs().length === 1, `expected exactly one lookup-failure log line (not one per step), got ${errorLogs().length}`);
  expectThrowOnError(calls, 'throw-fail-open-uncached');
}

// One transient failure followed by a successful child lookup: bootstrap on
// the failing step, skip afterwards, no cache poisoning from the failure.
async function transientErrorRecovers() {
  const { client, calls } = makeClient((_id, callIndex) => (
    callIndex === 1
      ? { __throw: new Error('transient') }
      : { data: { id: 'sess-recover', parentID: 'sess-parent' } }
  ));
  const transform = await loadPlugin(client);

  const step1 = makeOutput('sess-recover', 'transient failure step');
  const step2 = makeOutput('sess-recover', 'recovered step');
  const step3 = makeOutput('sess-recover', 'steady state step');
  await transform({}, step1);
  await transform({}, step2);
  await transform({}, step3);

  expect(countBootstrapParts(step1) === 1, `expected fail-open bootstrap on the failing step, got ${countBootstrapParts(step1)}`);
  expect(countBootstrapParts(step2) === 0, `expected no bootstrap after recovery to a child session, got ${countBootstrapParts(step2)}`);
  expect(countBootstrapParts(step3) === 0, `expected no bootstrap in steady state, got ${countBootstrapParts(step3)}`);
  expect(calls.length === 2, `expected exactly two lookups (failed + recovered), got ${calls.length}`);
  expect(errorLogs().length === 1, `expected exactly one lookup-failure log line, got ${errorLogs().length}`);
  expect(skipLogs().length === 1, `expected exactly one skip log line, got ${skipLogs().length}`);
}

// Degenerate response shapes must keep injecting (fail-open to top-level).
async function degenerateShapesInject() {
  const shapes = [
    ['sess-degenerate-null', () => ({ data: null })],
    ['sess-degenerate-parent-null', () => ({ data: { parentID: null } })],
    ['sess-degenerate-parent-empty', () => ({ data: { parentID: '' } })],
    ['sess-degenerate-undefined', () => undefined],
  ];

  let index = 0;
  for (const [sessionID, respond] of shapes) {
    index += 1;
    const { client } = makeClient(respond);
    const transform = await loadPlugin(client);
    const step = makeOutput(sessionID, `degenerate shape ${index}`);
    await transform({}, step);
    expect(countBootstrapParts(step) === 1, `expected bootstrap for degenerate shape ${index} (${sessionID}), got ${countBootstrapParts(step)}`);
  }
}
