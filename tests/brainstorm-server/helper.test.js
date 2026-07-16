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

console.log('\n--- Reconnect state machine (mocked browser) ---');

// Drive helper.js's browser code against mocked DOM/WebSocket/timers/clock so we
// can exercise the actual reconnect/status/tombstone behaviour, not just grep it.
function makeEnv() {
  const state = { now: 1000, timers: [], reloads: 0, replacements: [], appended: [], sessionKey: 'stored-key-abc' };
  const sockets = [];
  const statusEl = { textContent: '', style: { setProperty() {} } };
  class FakeWS {
    constructor(url) { this.url = url; this.readyState = 0; this.onopen = this.onclose = this.onmessage = this.onerror = null; sockets.push(this); }
    send() {}
    close() { this.readyState = 3; if (this.onclose) this.onclose(); }
    open() { this.readyState = 1; if (this.onopen) this.onopen(); }
  }
  FakeWS.OPEN = 1;
  const env = {
    module: { exports: {} },
    window: {
      location: {
        host: 'localhost:7777',
        reload() { state.reloads++; },
        replace(url) { state.replacements.push(url); }
      },
      sessionStorage: { getItem: (key) => key === 'brainstorm-session-key' ? state.sessionKey : null }
    },
    document: {
      querySelector: (s) => s === '.status' ? statusEl : null,
      getElementById: () => null,
      createElement: () => ({ style: {}, id: '' }),
      addEventListener() {},
      body: { appendChild: (el) => state.appended.push(el) }
    },
    WebSocket: FakeWS,
    setTimeout: (fn, ms) => { state.timers.push({ fn, ms, fired: false, cleared: false }); return state.timers.length; },
    clearTimeout: (id) => { if (state.timers[id - 1]) state.timers[id - 1].cleared = true; },
    Date: { now: () => state.now },
    console
  };
  return {
    state, statusEl, sockets,
    boot() { new Function(...Object.keys(env), src)(...Object.values(env)); },
    advance(ms) { state.now += ms; },
    last() { return sockets[sockets.length - 1]; },
    fireReconnect() {
      const t = [...state.timers].reverse().find(x => !x.fired && !x.cleared);
      if (!t) throw new Error('no reconnect scheduled');
      t.fired = true; t.fn();
    }
  };
}

test('uses sessionStorage key in the WebSocket URL when present', () => {
  const e = makeEnv();
  e.state.sessionKey = 'stored-key-abc';
  e.boot();
  assert.strictEqual(e.sockets[0].url, 'ws://localhost:7777/?key=stored-key-abc');
});

test('uses cookie-only WebSocket URL when no sessionStorage key is present', () => {
  const e = makeEnv();
  e.state.sessionKey = null;
  e.boot();
  assert.strictEqual(e.sockets[0].url, 'ws://localhost:7777');
});

test('on disconnect shows Reconnecting and schedules a 500ms reconnect', () => {
  const e = makeEnv(); e.boot();
  e.last().open();
  assert.strictEqual(e.statusEl.textContent, 'Connected');
  e.last().close();
  assert.strictEqual(e.statusEl.textContent, 'Reconnecting…');
  assert.strictEqual(e.state.timers[e.state.timers.length - 1].ms, 500);
});

test('reconnect delay backs off 500 -> 1000 -> 2000', () => {
  const e = makeEnv(); e.boot();
  e.last().open(); e.last().close();
  e.fireReconnect(); e.last().close();
  e.fireReconnect(); e.last().close();
  assert.deepStrictEqual(e.state.timers.map(t => t.ms).slice(0, 3), [500, 1000, 2000]);
});

test('shows the tombstone and Disconnected after the grace period', () => {
  const e = makeEnv(); e.boot();
  e.last().open(); e.last().close();
  e.advance(20000);          // past TOMBSTONE_AFTER_MS while still down
  e.fireReconnect(); e.last().close();
  assert.strictEqual(e.statusEl.textContent, 'Disconnected');
  assert.strictEqual(e.state.appended.length, 1, 'tombstone appended exactly once');
});

test('rebootstraps with stored key when a tombstoned connection comes back', () => {
  const e = makeEnv(); e.boot();
  e.last().open(); e.last().close();
  e.advance(20000); e.fireReconnect(); e.last().close(); // tombstone now shown
  assert.deepStrictEqual(e.state.replacements, []);
  e.fireReconnect(); e.last().open();                    // server back (e.g. same-port restart)
  assert.strictEqual(e.state.reloads, 0, 'stored-key recovery should not reload bare /');
  assert.deepStrictEqual(e.state.replacements, ['/?key=stored-key-abc']);
});

test('reloads to recover when tombstoned and no sessionStorage key is present', () => {
  const e = makeEnv();
  e.state.sessionKey = null;
  e.boot();
  e.last().open(); e.last().close();
  e.advance(20000); e.fireReconnect(); e.last().close(); // tombstone now shown
  assert.strictEqual(e.state.reloads, 0);
  e.fireReconnect(); e.last().open();                    // server back (e.g. cookie-only page)
  assert.strictEqual(e.state.reloads, 1, 'reloads once on recovery');
  assert.deepStrictEqual(e.state.replacements, []);
});

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
