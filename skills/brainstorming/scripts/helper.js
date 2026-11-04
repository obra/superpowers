(function() {
  const MIN_RECONNECT_MS = 500;
  const MAX_RECONNECT_MS = 30000;
  const TOMBSTONE_AFTER_MS = 15000; // show the "paused" overlay after this long disconnected

  // Pure: next backoff delay (doubles, capped). Exported for unit tests.
  function nextReconnectDelay(current, max) {
    return Math.min(current * 2, max);
  }

  // Pure: keys that should activate a choice element (keyboard parity with click).
  function isActivationKey(key) {
    return key === 'Enter' || key === ' ' || key === 'Spacebar';
  }

  // Pure: tags that already bring button semantics natively — focusable, fire
  // click on Enter/Space, announced as interactive — and must not be re-hydrated.
  function isNativeControl(tagName) {
    return ['button', 'a', 'input', 'select', 'textarea']
      .includes(String(tagName || '').toLowerCase());
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { nextReconnectDelay, isActivationKey, isNativeControl, MIN_RECONNECT_MS, MAX_RECONNECT_MS, TOMBSTONE_AFTER_MS };
  }

  // Everything below is browser-only; bail out when loaded in Node (tests).
  if (typeof window === 'undefined') return;

  let ws = null;
  let eventQueue = [];
  let reconnectDelay = MIN_RECONNECT_MS;
  let reconnectTimer = null;
  let disconnectedSince = null;
  let everConnected = false;
  let tombstoneShown = false;

  function sessionKey() {
    try {
      return window.sessionStorage && window.sessionStorage.getItem('brainstorm-session-key');
    } catch (e) {}
    return null;
  }

  function websocketUrl() {
    const key = sessionKey();
    return 'ws://' + window.location.host + (key ? '/?key=' + encodeURIComponent(key) : '');
  }

  function reloadAfterRecovery() {
    const key = sessionKey();
    if (key) {
      window.location.replace('/?key=' + encodeURIComponent(key));
    } else {
      window.location.reload();
    }
  }

  // Reflect connection state in the frame's status pill (absent on full-doc screens).
  function setStatus(state) {
    const el = document.querySelector('.status');
    if (!el) return;
    const map = {
      connecting:   ['Connecting…',   'var(--text-tertiary)'],
      connected:    ['Connected',     'var(--success)'],
      reconnecting: ['Reconnecting…', 'var(--warning)'],
      disconnected: ['Disconnected',  'var(--error)']
    };
    const [text, color] = map[state] || map.disconnected;
    el.textContent = text;
    el.style.setProperty('--status-color', color);
  }

  // Self-styled so it works on framed and full-document screens alike.
  function showTombstone() {
    if (tombstoneShown) return;
    tombstoneShown = true;
    const el = document.createElement('div');
    el.id = 'bs-tombstone';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;' +
      'align-items:center;justify-content:center;padding:2rem;text-align:center;' +
      'background:rgba(20,20,22,0.92);color:#f5f5f7;font-family:system-ui,sans-serif';
    el.innerHTML = '<div style="max-width:480px">' +
      '<h2 style="margin:0 0 .5rem;font-weight:600">Companion paused</h2>' +
      '<p style="margin:0;opacity:.85">This brainstorm companion has stopped. ' +
      'Ask your coding agent to bring it back — this page reconnects automatically.</p></div>';
    if (document.body) document.body.appendChild(el);
  }

  function connect() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    setStatus(everConnected ? 'reconnecting' : 'connecting');
    ws = new WebSocket(websocketUrl());

    ws.onopen = () => {
      const recovered = tombstoneShown;
      everConnected = true;
      disconnectedSince = null;
      reconnectDelay = MIN_RECONNECT_MS;
      tombstoneShown = false;
      setStatus('connected');
      eventQueue.forEach(e => ws.send(JSON.stringify(e)));
      eventQueue = [];
      // Recovered from a tombstoned outage (e.g. the server restarted on the same
      // port) — reload through the keyed bootstrap when possible so the cookie is
      // refreshed before the visible URL returns to bare /.
      if (recovered) reloadAfterRecovery();
    };

    ws.onmessage = (msg) => {
      let data;
      try { data = JSON.parse(msg.data); } catch (e) { return; }
      if (data.type === 'reload') window.location.reload();
    };

    ws.onclose = () => {
      ws = null;
      if (disconnectedSince === null) disconnectedSince = Date.now();
      if (Date.now() - disconnectedSince >= TOMBSTONE_AFTER_MS) {
        setStatus('disconnected');
        showTombstone();
      } else {
        setStatus('reconnecting');
      }
      reconnectTimer = setTimeout(connect, reconnectDelay);
      reconnectDelay = nextReconnectDelay(reconnectDelay, MAX_RECONNECT_MS);
    };

    // Let onclose own reconnection so we don't schedule it twice.
    ws.onerror = () => { try { ws.close(); } catch (e) {} };
  }

  function sendEvent(event) {
    event.timestamp = Date.now();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    } else {
      eventQueue.push(event);
    }
  }

  // Capture clicks on choice elements
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-choice]');
    if (!target) return;

    sendEvent({
      type: 'click',
      text: target.textContent.trim(),
      choice: target.dataset.choice,
      id: target.id || null
    });

  });

  // Accessibility: agents copy plain `<div data-choice onclick="toggleSelect(this)">`
  // markup from visual-companion.md, so choices render as divs with no role, no
  // focus and no keyboard activation — unreachable by keyboard and screen-reader
  // users. Hydrate whatever the page contains (now and later, via MutationObserver)
  // so every choice is focusable and announced; native controls are left alone.
  function hydrateChoice(el) {
    if (el.dataset.choiceHydrated) return;
    el.dataset.choiceHydrated = '1';
    if (!isNativeControl(el.tagName)) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
    }
    if (!el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', 'false');
  }

  function hydrateChoices(scope) {
    if (scope && scope.matches && scope.matches('[data-choice]')) hydrateChoice(scope);
    if (scope && scope.querySelectorAll) {
      scope.querySelectorAll('[data-choice]').forEach(hydrateChoice);
    }
  }

  function watchForChoices() {
    if (typeof MutationObserver === 'undefined' || !document.body) return;
    new MutationObserver((mutations) => {
      mutations.forEach((m) => (m.addedNodes || []).forEach((n) => {
        if (n && n.nodeType === 1) hydrateChoices(n);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  // Keyboard parity with the click listener above: Enter/Space activate the
  // focused choice by synthesizing a click, which reuses the exact same
  // selection path and event payload (server protocol unchanged). Native
  // controls already fire click on Enter/Space, so they are skipped.
  document.addEventListener('keydown', (e) => {
    if (!isActivationKey(e.key)) return;
    const target = e.target && e.target.closest && e.target.closest('[data-choice]');
    if (!target || isNativeControl(target.tagName)) return;
    e.preventDefault();
    target.click();
  });

  // Frame UI: selection tracking
  window.selectedChoice = null;

  window.toggleSelect = function(el) {
    const container = el.closest('.options') || el.closest('.cards');
    const multi = container && container.dataset.multiselect !== undefined;
    if (container && !multi) {
      container.querySelectorAll('.option, .card').forEach(o => o.classList.remove('selected'));
    }
    if (multi) {
      el.classList.toggle('selected');
    } else {
      el.classList.add('selected');
    }
    window.selectedChoice = el.dataset.choice;
    // Mirror the selected class into aria-pressed so screen readers announce the
    // state change instead of only seeing a CSS class.
    const group = container ? container.querySelectorAll('.option, .card') : [el];
    group.forEach(o => o.setAttribute('aria-pressed', o.classList.contains('selected') ? 'true' : 'false'));
  };

  // Expose API for explicit use
  window.brainstorm = {
    send: sendEvent,
    choice: (value, metadata = {}) => sendEvent({ type: 'choice', value, ...metadata })
  };

  hydrateChoices(document);
  watchForChoices();
  connect();
})();
