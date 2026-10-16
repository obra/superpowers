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
const { nextReconnectDelay, isActivationKey, isNativeControl, MIN_RECONNECT_MS, MAX_RECONNECT_MS, TOMBSTONE_AFTER_MS } = moduleShim.exports;

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
  const state = {
    now: 1000, timers: [], reloads: 0, replacements: [], appended: [],
    sessionKey: 'stored-key-abc',
    listeners: {},        // document event handlers, keyed by event type
    observers: [],        // MutationObserver instances created by helper.js
    sent: [],             // raw payloads pushed through the open socket
    choices: []           // what document.querySelectorAll('[data-choice]') returns
  };
  const sockets = [];
  const statusEl = { textContent: '', style: { setProperty() {} } };

  // Minimal DOM element: just the surface helper.js touches (attributes, class
  // list, dataset, closest/querySelectorAll over a parent/children tree, click).
  function makeEl(opts = {}) {
    const el = {
      nodeType: 1,
      tagName: (opts.tag || 'div').toUpperCase(),
      id: opts.id || '',
      textContent: opts.text || '',
      dataset: opts.dataset || {},
      classes: new Set(opts.classes || []),
      attrs: {},
      parentElement: null,
      children: [],
      clicks: 0,
      classList: {
        add: (...cs) => cs.forEach(c => el.classes.add(c)),
        remove: (...cs) => cs.forEach(c => el.classes.delete(c)),
        toggle: (c) => { el.classes.has(c) ? el.classes.delete(c) : el.classes.add(c); },
        contains: (c) => el.classes.has(c)
      },
      setAttribute(k, v) { el.attrs[k] = String(v); },
      getAttribute(k) { return k in el.attrs ? el.attrs[k] : null; },
      hasAttribute(k) { return k in el.attrs; },
      matches(sel) {
        if (sel === '[data-choice]') return 'choice' in el.dataset;
        if (sel === '[data-multiselect]') return 'multiselect' in el.dataset;
        if (sel === '.options') return el.classes.has('options');
        if (sel === '.cards') return el.classes.has('cards');
        if (sel === '.option' || sel === '.card') return el.classes.has(sel.slice(1));
        if (sel === '.option, .card') return el.classes.has('option') || el.classes.has('card');
        return false;
      },
      closest(sel) { let n = el; while (n) { if (n.matches && n.matches(sel)) return n; n = n.parentElement; } return null; },
      querySelectorAll(sel) {
        const out = [];
        (function walk(n) { (n.children || []).forEach(c => { if (c.matches(sel)) out.push(c); walk(c); }); })(el);
        return out;
      },
      // Synthesized clicks take the same path a real click would: the document
      // click listener sees an event with this element as its target.
      click() {
        el.clicks++;
        if (state.listeners.click) state.listeners.click({ target: el });
      },
      style: {}
    };
    return el;
  }

  class FakeWS {
    constructor(url) { this.url = url; this.readyState = 0; this.onopen = this.onclose = this.onmessage = this.onerror = null; sockets.push(this); }
    send(data) { state.sent.push(data); }
    close() { this.readyState = 3; if (this.onclose) this.onclose(); }
    open() { this.readyState = 1; if (this.onopen) this.onopen(); }
  }
  FakeWS.OPEN = 1;

  class FakeMutationObserver {
    constructor(cb) { this.cb = cb; state.observers.push(this); }
    observe(target, options) { this.targets = (this.targets || []).concat([{ target, options }]); }
  }

  const documentMock = {
    querySelector: (s) => s === '.status' ? statusEl : null,
    getElementById: () => null,
    createElement: () => makeEl(),
    addEventListener(type, fn) { state.listeners[type] = fn; },
    querySelectorAll(sel) { return sel === '[data-choice]' ? state.choices : []; },
    body: { nodeType: 1, appendChild: (el) => state.appended.push(el), children: [] }
  };

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
    document: documentMock,
    MutationObserver: FakeMutationObserver,
    WebSocket: FakeWS,
    setTimeout: (fn, ms) => { state.timers.push({ fn, ms, fired: false, cleared: false }); return state.timers.length; },
    clearTimeout: (id) => { if (state.timers[id - 1]) state.timers[id - 1].cleared = true; },
    Date: { now: () => state.now },
    console
  };

  return {
    state, statusEl, sockets, env, makeEl,
    boot() { new Function(...Object.keys(env), src)(...Object.values(env)); },
    advance(ms) { state.now += ms; },
    last() { return sockets[sockets.length - 1]; },
    fireReconnect() {
      const t = [...state.timers].reverse().find(x => !x.fired && !x.cleared);
      if (!t) throw new Error('no reconnect scheduled');
      t.fired = true; t.fn();
    },
    // Fire a keydown through the captured document listener; returns whether
    // the handler called preventDefault.
    fireKey(key, target) {
      const prevented = { called: false };
      state.listeners.keydown({ key, target, preventDefault() { prevented.called = true; } });
      return prevented;
    }
  };
}

// Standard fixture: a single-select .options container with two choice divs,
// matching the markup agents copy from visual-companion.md.
function makeChoicesEnv() {
  const e = makeEnv();
  e.optA = e.makeEl({ classes: ['option'], text: 'Option A', dataset: { choice: 'a' } });
  e.optB = e.makeEl({ classes: ['option'], text: 'Option B', dataset: { choice: 'b' } });
  const container = e.makeEl({ classes: ['options'] });
  container.children = [e.optA, e.optB];
  e.optA.parentElement = container;
  e.optB.parentElement = container;
  e.container = container;
  e.state.choices = [e.optA, e.optB];
  return e;
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

console.log('\n--- Choice accessibility (pure) ---');

test('isActivationKey: only Enter and Space activate a choice', () => {
  assert.strictEqual(isActivationKey('Enter'), true);
  assert.strictEqual(isActivationKey(' '), true, 'Space arrives as the bare " " key value');
  assert.strictEqual(isActivationKey('Spacebar'), true, 'legacy Space key value accepted');
  assert.strictEqual(isActivationKey('a'), false);
  assert.strictEqual(isActivationKey('Escape'), false);
  assert.strictEqual(isActivationKey('Tab'), false);
  assert.strictEqual(isActivationKey(undefined), false);
});

test('isNativeControl: form controls and links, not divs (case-insensitive)', () => {
  ['button', 'a', 'input', 'select', 'textarea'].forEach(tag => {
    assert.strictEqual(isNativeControl(tag), true, `${tag} is a native control`);
    assert.strictEqual(isNativeControl(tag.toUpperCase()), true, 'accepts DOM-cased tagName');
  });
  ['div', 'span', 'li', ''].forEach(tag => {
    assert.strictEqual(isNativeControl(tag), false, `"${tag}" needs hydration`);
  });
  assert.strictEqual(isNativeControl(undefined), false);
});

console.log('\n--- Choice accessibility (mocked browser) ---');

test('hydrates choice divs with role, tabindex and aria-pressed on boot', () => {
  const e = makeChoicesEnv(); e.boot();
  for (const opt of [e.optA, e.optB]) {
    assert.strictEqual(opt.attrs.role, 'button', 'role=button injected');
    assert.strictEqual(opt.attrs.tabindex, '0', 'tabindex=0 injected');
    assert.strictEqual(opt.attrs['aria-pressed'], 'false', 'aria-pressed initialised');
    assert.strictEqual(opt.dataset.choiceHydrated, '1', 'marked as hydrated');
  }
});

test('leaves native button choices alone (no role/tabindex added)', () => {
  const e = makeEnv();
  const btn = e.makeEl({ tag: 'button', text: 'Go', dataset: { choice: 'x' } });
  e.state.choices = [btn];
  e.boot();
  assert.strictEqual(btn.attrs.role, undefined, 'no role on a real button');
  assert.strictEqual(btn.attrs.tabindex, undefined, 'no tabindex on a real button');
  assert.strictEqual(btn.attrs['aria-pressed'], 'false', 'aria-pressed still initialised');
});

test('hydration is idempotent when the helper runs twice over the same element', () => {
  const e = makeChoicesEnv(); e.boot();
  e.optA.setAttribute('role', 'radio'); // simulate a page that took over the role afterwards
  e.boot(); // second evaluation, e.g. the script re-injected on a full-document page
  assert.strictEqual(e.optA.attrs.role, 'radio', 'already-hydrated element is skipped');
});

test('Enter on a focused choice synthesizes a click through the normal path', () => {
  const e = makeChoicesEnv(); e.boot();
  e.last().open(); // socket up so sendEvent sends instead of queueing
  const prevented = e.fireKey('Enter', e.optA);
  assert.strictEqual(prevented.called, true, 'default action suppressed');
  assert.strictEqual(e.optA.clicks, 1, 'exactly one synthesized click');
  const payloads = e.state.sent.map(s => JSON.parse(s));
  assert.deepStrictEqual(payloads[payloads.length - 1], {
    type: 'click', text: 'Option A', choice: 'a', id: null, timestamp: 1000
  }, 'same click event payload the pointer path sends (sendEvent-stamped, protocol unchanged)');
});

test('Space activates too; other keys and off-target events do not', () => {
  const e = makeChoicesEnv(); e.boot();
  e.fireKey(' ', e.optB);
  assert.strictEqual(e.optB.clicks, 1, 'Space synthesizes a click');
  e.fireKey('Spacebar', e.optB);
  assert.strictEqual(e.optB.clicks, 2, 'legacy Space value also activates');
  e.fireKey('a', e.optA);
  e.fireKey('Escape', e.optA);
  assert.strictEqual(e.optA.clicks, 0, 'non-activation keys are ignored');
});

test('keydown is skipped for native buttons (no double-fire)', () => {
  const e = makeEnv();
  const btn = e.makeEl({ tag: 'button', text: 'Go', dataset: { choice: 'x' } });
  e.state.choices = [btn];
  e.boot();
  e.last().open();
  const prevented = e.fireKey('Enter', btn);
  assert.strictEqual(btn.clicks, 0, 'no synthesized click; the button fires its own');
  assert.strictEqual(prevented.called, false, 'default (native) activation is preserved');
});

test('toggleSelect mirrors selection into aria-pressed (single-select)', () => {
  const e = makeChoicesEnv(); e.boot();
  e.env.window.toggleSelect(e.optB);
  assert.strictEqual(e.optB.attrs['aria-pressed'], 'true');
  assert.strictEqual(e.optA.attrs['aria-pressed'], 'false', 'previous selection unpressed');
  assert(e.optB.classes.has('selected'), 'CSS class still applied');
});

test('toggleSelect multi-select container: pressed follows each toggle', () => {
  const e = makeChoicesEnv();
  e.container.dataset.multiselect = '';
  e.boot();
  e.env.window.toggleSelect(e.optA);
  e.env.window.toggleSelect(e.optB);
  assert.strictEqual(e.optA.attrs['aria-pressed'], 'true');
  assert.strictEqual(e.optB.attrs['aria-pressed'], 'true', 'multi-select keeps both pressed');
  e.env.window.toggleSelect(e.optA);
  assert.strictEqual(e.optA.attrs['aria-pressed'], 'false', 'toggle off is announced');
});

test('MutationObserver hydrates choices added after boot, watching body subtree', () => {
  const e = makeChoicesEnv(); e.boot();
  assert.strictEqual(e.state.observers.length, 1, 'one observer registered');
  const obs = e.state.observers[0];
  assert.strictEqual(obs.targets[0].target, e.env.document.body, 'observes document.body');
  assert.strictEqual(obs.targets[0].options.subtree, true, 'subtree observed');
  assert.strictEqual(obs.targets[0].options.childList, true, 'childList observed');
  const late = e.makeEl({ classes: ['option'], text: 'Option C', dataset: { choice: 'c' } });
  obs.cb([{ addedNodes: [late] }]);
  assert.strictEqual(late.attrs.role, 'button', 'late choice gets role=button');
  assert.strictEqual(late.attrs.tabindex, '0', 'late choice gets tabindex=0');
  assert.strictEqual(late.attrs['aria-pressed'], 'false', 'late choice gets aria-pressed');
});

test('keydown handler is registered and guard-tolerant of odd targets', () => {
  const e = makeEnv(); e.boot();
  assert.strictEqual(typeof e.state.listeners.keydown, 'function', 'document keydown listener registered');
  // Odd targets (document itself, bare objects) must not throw.
  e.state.listeners.keydown({ key: 'Enter', target: {}, preventDefault() {} });
  e.state.listeners.keydown({ key: 'Enter', target: null, preventDefault() {} });
});

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
