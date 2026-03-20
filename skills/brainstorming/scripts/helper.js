(function() {
  const WS_URL = 'ws://' + window.location.host;
  const BACKOFF_INITIAL = 500;
  const BACKOFF_MAX = 30000;

  let ws = null;
  let eventQueue = [];
  let backoff = BACKOFF_INITIAL;
  let reconnectTimer = null;

  function setStatus(state) {
    var el = document.querySelector('.header .status');
    if (!el) return;
    var labels = { connected: 'Connected', reconnecting: 'Reconnecting\u2026', disconnected: 'Disconnected' };
    var colors = { connected: 'var(--success)', reconnecting: 'var(--warning)', disconnected: 'var(--error)' };
    el.textContent = labels[state] || state;
    el.style.color = colors[state] || '';
    el.style.setProperty('--status-color', colors[state] || 'var(--success)');
  }

  function connect() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    setStatus('reconnecting');
    ws = new WebSocket(WS_URL);

    ws.onopen = function() {
      backoff = BACKOFF_INITIAL;
      setStatus('connected');
      eventQueue.forEach(function(e) { ws.send(JSON.stringify(e)); });
      eventQueue = [];
    };

    ws.onmessage = function(msg) {
      var data = JSON.parse(msg.data);
      if (data.type === 'reload') {
        window.location.reload();
      }
    };

    ws.onclose = function() {
      ws = null;
      setStatus('reconnecting');
      reconnectTimer = setTimeout(function() {
        backoff = Math.min(backoff * 2, BACKOFF_MAX);
        connect();
      }, backoff);
    };
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

    // Update indicator bar (defer so toggleSelect runs first)
    setTimeout(() => {
      const indicator = document.getElementById('indicator-text');
      if (!indicator) return;
      const container = target.closest('.options') || target.closest('.cards');
      const selected = container ? container.querySelectorAll('.selected') : [];
      if (selected.length === 0) {
        indicator.textContent = 'Click an option above, then return to the terminal';
      } else if (selected.length === 1) {
        const label = selected[0].querySelector('h3, .content h3, .card-body h3')?.textContent?.trim() || selected[0].dataset.choice;
        indicator.innerHTML = '<span class="selected-text">' + label + ' selected</span> — return to terminal to continue';
      } else {
        indicator.innerHTML = '<span class="selected-text">' + selected.length + ' selected</span> — return to terminal to continue';
      }
    }, 0);
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
  };

  // Expose API for explicit use
  window.brainstorm = {
    send: sendEvent,
    choice: (value, metadata = {}) => sendEvent({ type: 'choice', value, ...metadata })
  };

  connect();
})();
