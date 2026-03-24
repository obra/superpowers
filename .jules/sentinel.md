## 2025-02-15 - [Cross-Site WebSocket Hijacking in Brainstorm Server]
**Vulnerability:** The local WebSocket server in `skills/brainstorming/scripts/server.cjs` allowed any website to connect and send mock choice events to Claude without an Origin check.
**Learning:** Local dev tools that bind WebSocket servers must enforce strict `Origin` validation, as browsers automatically forward credentials and can silently connect to localhost services.
**Prevention:** Always validate `req.headers['origin']` against allowed hosts (`localhost`, `127.0.0.1`, or configured `HOST`) in the `upgrade` handshake of custom WebSocket servers.

## 2026-03-24 - [Unbounded WebSocket Buffer Memory Exhaustion (DoS)]
**Vulnerability:** The custom WebSocket parser in `skills/brainstorming/scripts/server.cjs` continuously appended incoming chunks to a buffer without any size limit. A malicious client could stream incomplete frames indefinitely, causing the server to allocate memory until it crashes (OOM/DoS).
**Learning:** Custom stream-based protocol parsers must always enforce explicit maximum buffer/payload size limits. The limit must be checked *after* the frame-consuming loop to avoid falsely triggering on legitimate bursts of valid frames.
**Prevention:** Define a `MAX_BUFFER_SIZE` constant (e.g., 10MB) at module level. After the frame-processing loop in `socket.on('data')`, check `buffer.length > MAX_BUFFER_SIZE` and respond with WS close code 1009 (Message Too Big), then call `socket.destroy()`.

## 2026-03-24 - [DOM-based XSS in helper.js indicator]
**Vulnerability:** The brainstorm helper script used `innerHTML` to render user-controlled option labels into the status indicator, allowing XSS if a brainstorm option contained HTML.
**Learning:** Never use `innerHTML` to render any data that originates from user input or LLM-generated content. Use `textContent` or explicit DOM node creation instead.
**Prevention:** Replace `element.innerHTML = '<span>' + label + '</span>'` with `document.createElement` + `textContent` assignment.
