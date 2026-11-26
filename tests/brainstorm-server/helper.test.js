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
      querySelectorAll: () => [],
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

console.log('\n--- Choice hydration & keyboard accessibility ---');

function makeEl(tag, { id = '', classes = [], dataset = {}, textContent = '', isContentEditable = false } = {}) {
  const classSet = new Set(classes);
  const attrs = new Map();
  if (dataset.choice !== undefined) attrs.set('data-choice', String(dataset.choice));
  const el = {
    tagName: tag.toUpperCase(),
    id,
    dataset: { ...dataset },
    textContent,
    parentElement: null,
    children: [],
    clickCount: 0,
    onclick: null,
    isContentEditable: Boolean(isContentEditable),
    classList: {
      add: (...n) => n.forEach(c => classSet.add(c)),
      remove: (...n) => n.forEach(c => classSet.delete(c)),
      toggle: (c) => (classSet.has(c) ? (classSet.delete(c), false) : (classSet.add(c), true)),
      contains: (c) => classSet.has(c)
    },
    getAttribute: (n) => (attrs.has(n) ? attrs.get(n) : null),
    setAttribute: (n, v) => attrs.set(n, String(v)),
    hasAttribute: (n) => attrs.has(n),
    appendChild(child) { child.parentElement = el; el.children.push(child); return child; },
    matches(sel) {
      return sel.split(',').map(s => s.trim()).some(p =>
        p === '[data-choice]' ? (el.dataset.choice !== undefined || attrs.has('data-choice')) :
        p.startsWith('.') ? classSet.has(p.slice(1)) : el.tagName.toLowerCase() === p.toLowerCase()
      );
    },
    closest(sel) { for (let cur = el; cur; cur = cur.parentElement) if (cur.matches(sel)) return cur; return null; },
    querySelectorAll(sel) {
      const out = [];
      (function walk(node) { for (const c of node.children) { if (c.matches(sel)) out.push(c); walk(c); } })(el);
      return out;
    }
  };
  return el;
}

function makeChoiceEnv({ multiselect = false } = {}) {
  const sentEvents = [];
  const listeners = { click: [], keydown: [] };
  class FakeWS {
    constructor(url) { this.url = url; this.readyState = 1; }
    send(payload) { sentEvents.push(JSON.parse(payload)); }
    close() { this.readyState = 3; }
  }
  FakeWS.OPEN = 1;
  const container = makeEl('div', { classes: ['options'], dataset: multiselect ? { multiselect: '' } : {} });
  const divA = makeEl('div', { id: 'opt-a', classes: ['option'], dataset: { choice: 'a' }, textContent: 'Option A' });
  const spanInA = divA.appendChild(makeEl('span', { textContent: 'Label A' }));
  const nestedInput = divA.appendChild(makeEl('input'));
  const nestedEditable = divA.appendChild(makeEl('div', { isContentEditable: true }));
  const divB = makeEl('div', { id: 'opt-b', classes: ['option'], dataset: { choice: 'b' }, textContent: 'Option B' });
  const buttonChoice = makeEl('button', { id: 'btn-c', dataset: { choice: 'c' }, textContent: 'Button C' });
  [divA, divB, buttonChoice].forEach((el) => container.appendChild(el));
  const body = makeEl('body');
  body.appendChild(container);
  const env = {
    module: { exports: {} },
    window: { location: { host: 'localhost:7777', reload() {}, replace() {} }, sessionStorage: { getItem: () => null } },
    document: {
      querySelector: () => null,
      querySelectorAll: (s) => body.querySelectorAll(s),
      getElementById: () => null,
      createElement: () => ({ style: {}, id: '' }),
      addEventListener: (t, fn) => (listeners[t] ||= []).push(fn),
      body
    },
    WebSocket: FakeWS, setTimeout: () => 1, clearTimeout: () => {}, Date: { now: () => 12345 }, console
  };
  [divA, divB, buttonChoice].forEach((el) => {
    el.click = () => { el.clickCount++; if (el.onclick) el.onclick(el); listeners.click.forEach(fn => fn({ target: el })); };
  });
  return {
    env, divA, divB, spanInA, nestedInput, nestedEditable, buttonChoice, sentEvents,
    boot() {
      new Function(...Object.keys(env), src)(...Object.values(env));
      [divA, divB, buttonChoice].forEach((el) => { el.onclick = () => env.window.toggleSelect(el); });
    },
    keydown(target, key, opts = {}) {
      const ev = { key, target, repeat: Boolean(opts.repeat), defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      listeners.keydown.forEach(fn => fn(ev));
      return ev;
    }
  };
}

test('hydrates role, tabindex, and aria-pressed only on non-native [data-choice] elements', () => {
  const c = makeChoiceEnv();
  c.boot();
  for (const el of [c.divA, c.divB]) {
    assert.strictEqual(el.getAttribute('role'), 'button');
    assert.strictEqual(el.getAttribute('tabindex'), '0');
    assert.strictEqual(el.getAttribute('aria-pressed'), 'false');
  }
  for (const attr of ['role', 'tabindex', 'aria-pressed']) {
    assert.strictEqual(c.buttonChoice.getAttribute(attr), null);
  }
});

test('Enter, Space, and child targets activate [data-choice], sync aria-pressed, and ignore key repeat', () => {
  const c = makeChoiceEnv();
  c.boot();
  assert.strictEqual(c.keydown(c.divA, 'Enter').defaultPrevented, false);
  assert.strictEqual(c.divA.clickCount, 1);
  assert.strictEqual(c.divA.getAttribute('aria-pressed'), 'true');
  assert.strictEqual(c.env.window.selectedChoice, 'a');
  assert.strictEqual(c.sentEvents[0].choice, 'a');

  assert.strictEqual(c.keydown(c.divB, ' ').defaultPrevented, true);
  assert.strictEqual(c.divB.getAttribute('aria-pressed'), 'true');
  assert.strictEqual(c.divA.getAttribute('aria-pressed'), 'false');
  assert.strictEqual(c.sentEvents.length, 2);

  assert.strictEqual(c.keydown(c.divB, ' ', { repeat: true }).defaultPrevented, true);
  assert.strictEqual(c.divB.clickCount, 1);
  assert.strictEqual(c.sentEvents.length, 2);

  c.keydown(c.spanInA, 'Enter');
  assert.strictEqual(c.divA.clickCount, 2);
  assert.strictEqual(c.divA.getAttribute('aria-pressed'), 'true');
  assert.strictEqual(c.divB.getAttribute('aria-pressed'), 'false');
});

test('data-multiselect toggles aria-pressed independently', () => {
  const c = makeChoiceEnv({ multiselect: true });
  c.boot();
  c.keydown(c.divA, ' ');
  c.keydown(c.divB, 'Enter');
  assert.strictEqual(c.divA.getAttribute('aria-pressed'), 'true');
  assert.strictEqual(c.divB.getAttribute('aria-pressed'), 'true');
  c.keydown(c.divA, ' ');
  assert.strictEqual(c.divA.getAttribute('aria-pressed'), 'false');
  assert.strictEqual(c.divB.getAttribute('aria-pressed'), 'true');
});

test('picking another single-select choice deselects a [data-choice] button that is not an .option or .card', () => {
  const c = makeChoiceEnv();
  c.boot();
  c.buttonChoice.click();
  assert.strictEqual(c.buttonChoice.getAttribute('aria-pressed'), 'true');
  c.divA.click();
  assert.strictEqual(c.buttonChoice.classList.contains('selected'), false);
  assert.strictEqual(c.buttonChoice.getAttribute('aria-pressed'), 'false');
});

test('ignores keydown on native controls and editable descendants', () => {
  const c = makeChoiceEnv();
  c.boot();
  for (const target of [c.buttonChoice, c.nestedInput, c.nestedEditable]) {
    assert.strictEqual(c.keydown(target, ' ').defaultPrevented, false);
    assert.strictEqual(c.keydown(target, 'Enter').defaultPrevented, false);
  }
  assert.strictEqual(c.buttonChoice.clickCount, 0);
  assert.strictEqual(c.divA.clickCount, 0);
  assert.strictEqual(c.sentEvents.length, 0);
});

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
