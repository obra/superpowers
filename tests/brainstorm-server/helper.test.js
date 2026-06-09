/**
 * Tests for the injected browser client (helper.js).
 *
 * helper.js runs in the browser, so its DOM behaviour is exercised live; here we
 * unit-test the pure reconnect-backoff function it exports and assert that the
 * reconnect / status / tombstone wiring is present.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const HELPER = path.join(__dirname, '../../skills/brainstorming/scripts/helper.js');

const src = fs.readFileSync(HELPER, 'utf-8');

// helper.js is browser code, and the repo is an ES module package, so a plain
// require() won't surface its exports. Evaluate the source in a CommonJS sandbox
// with no `window`, so only the exported pure helpers run (not the browser code).
const moduleShim = { exports: {} };
new Function('module', src)(moduleShim);
const { nextReconnectDelay, MIN_RECONNECT_MS, MAX_RECONNECT_MS, TOMBSTONE_AFTER_MS } = moduleShim.exports;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  PASS: ${name}`); passed++; }
  catch (e) { console.log(`  FAIL: ${name}`); console.log(`    ${e.message}`); failed++; }
}

console.log('\n--- Backoff (pure) ---');

test('doubles the delay each call', () => {
  assert.strictEqual(nextReconnectDelay(500, 30000), 1000);
  assert.strictEqual(nextReconnectDelay(1000, 30000), 2000);
  assert.strictEqual(nextReconnectDelay(2000, 30000), 4000);
});

test('caps at the maximum', () => {
  assert.strictEqual(nextReconnectDelay(20000, 30000), 30000);
  assert.strictEqual(nextReconnectDelay(30000, 30000), 30000);
});

test('full progression from MIN caps at MAX and never exceeds it', () => {
  const seq = [MIN_RECONNECT_MS];
  let d = MIN_RECONNECT_MS;
  for (let i = 0; i < 10; i++) { d = nextReconnectDelay(d, MAX_RECONNECT_MS); seq.push(d); }
  assert.strictEqual(seq[0], 500);
  assert.deepStrictEqual(seq.slice(0, 7), [500, 1000, 2000, 4000, 8000, 16000, 30000]);
  assert(seq.every(v => v <= MAX_RECONNECT_MS), 'never exceeds max');
  assert.strictEqual(seq[seq.length - 1], 30000, 'settles at the cap');
});

test('exposes sane constants', () => {
  assert.strictEqual(MIN_RECONNECT_MS, 500);
  assert.strictEqual(MAX_RECONNECT_MS, 30000);
  assert(TOMBSTONE_AFTER_MS >= 5000, 'tombstone grace is at least a few seconds');
});

console.log('\n--- Wiring (source) ---');

test('reflects all three connection states', () => {
  assert(/Connected/.test(src) && /Reconnecting/.test(src) && /Disconnected/.test(src),
    'should set Connected / Reconnecting / Disconnected status');
  assert(src.includes("setProperty('--status-color'"), 'drives the status dot via --status-color');
});

test('renders a tombstone overlay when paused', () => {
  assert(src.includes('bs-tombstone'), 'creates the tombstone element');
  assert(/Companion paused/.test(src), 'tombstone explains the companion paused');
});

test('hardens reconnection (onerror, null socket, clears pending timer)', () => {
  assert(src.includes('onerror'), 'handles onerror');
  assert(/ws = null/.test(src), 'nulls the socket on close so sendEvent queues');
  assert(src.includes('clearTimeout'), 'clears a pending reconnect before scheduling another');
  assert(src.includes('nextReconnectDelay'), 'uses exponential backoff for reconnects');
});

test('reloads on recovery and on reload messages', () => {
  assert(/location\.reload\(\)/.test(src), 'reloads to pick up restarted/updated content');
});

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
