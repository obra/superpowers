(function() {
  const WS_URL = 'ws://' + window.location.host;
  let ws = null;
  let eventQueue = [];

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      eventQueue.forEach(e => ws.send(JSON.stringify(e)));
      eventQueue = [];
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'reload') {
        window.location.reload();
      }
    };

    ws.onclose = () => {
      setTimeout(connect, 1000);
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

  // Auto-capture clicks on interactive elements
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, [data-choice], [role="button"], input[type="submit"]');
    if (!target) return;

    // Don't capture regular link navigation
    if (target.tagName === 'A' && !target.dataset.choice) return;

    // Don't capture the Send feedback button (handled by send())
    if (target.id === 'send-feedback') return;

    e.preventDefault();

    sendEvent({
      type: 'click',
      text: target.textContent.trim(),
      choice: target.dataset.choice || null,
      id: target.id || null,
      className: target.className || null
    });
  });

  // Auto-capture form submissions
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });

    sendEvent({
      type: 'submit',
      formId: form.id || null,
      formName: form.name || null,
      data: data
    });
  });

  // Auto-capture input changes (debounced)
  let inputTimeout = null;
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (!target.matches('input, textarea, select')) return;

    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
      sendEvent({
        type: 'input',
        name: target.name || null,
        id: target.id || null,
        value: target.value,
        inputType: target.type || target.tagName.toLowerCase()
      });
    }, 500);
  });

  // Send to Claude - triggers feedback delivery
  function sendToClaude(feedback) {
    sendEvent({
      type: 'send-to-claude',
      feedback: feedback || null
    });
    // Show themed confirmation page
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg-primary, #f5f5f7);">
        <div style="text-align: center; color: var(--text-secondary, #86868b);">
          <h2 style="color: var(--text-primary, #1d1d1f); margin-bottom: 0.5rem;">Sent to Claude</h2>
          <p>Return to the terminal to see Claude's response.</p>
        </div>
      </div>
    `;
  }

  // Frame UI: selection tracking and feedback send
  window.selectedChoice = null;

  window.toggleSelect = function(el) {
    const container = el.closest('.options') || el.closest('.cards');
    if (container) {
      container.querySelectorAll('.option, .card').forEach(o => o.classList.remove('selected'));
    }
    el.classList.add('selected');
    window.selectedChoice = el.dataset.choice;
  };

  window.send = function() {
    const feedbackEl = document.getElementById('feedback');
    const feedback = feedbackEl ? feedbackEl.value.trim() : '';
    const payload = {};
    if (window.selectedChoice) payload.choice = window.selectedChoice;
    if (feedback) payload.feedback = feedback;
    if (Object.keys(payload).length === 0) return;
    sendToClaude(payload);
    if (feedbackEl) feedbackEl.value = '';
  };

  // Expose API for explicit use
  window.brainstorm = {
    send: sendEvent,
    choice: (value, metadata = {}) => sendEvent({ type: 'choice', value, ...metadata }),
    sendToClaude: sendToClaude
  };

  connect();
})();
