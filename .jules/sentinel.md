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

## 2026-03-25 - [Insecure Random Port Selection]
**Vulnerability:** The brainstorm server used `Math.random()` to dynamically select a port for binding. Because `Math.random()` is predictable, an attacker running malicious JavaScript in a background tab or another application could guess the assigned port and attempt cross-site attacks before the owner interacts.
**Learning:** Avoid `Math.random()` for any security-sensitive logic like local port assignment, token generation, or IDs.
**Prevention:** Always use `crypto.randomInt(min, max)` for cryptographically secure integer generation.

## 2026-03-26 - [DNS Rebinding in Brainstorm Server HTTP Handler]
**Vulnerability:** The local HTTP server in `skills/brainstorming/scripts/server.cjs` served files without validating the `Host` header. This allows a malicious website to perform a DNS rebinding attack, pointing its domain to `127.0.0.1` and reading local user screens via standard HTTP requests.
**Learning:** Local dev tools binding HTTP servers must validate the `Host` header to prevent DNS rebinding attacks where malicious sites can query local endpoints.
**Prevention:** Always validate `req.headers.host` against allowed hosts (`localhost`, `127.0.0.1`, `[::1]`, or a configured `HOST`). If `HOST` is `0.0.0.0`, the strict check can be bypassed to allow LAN access, but loopback and explicit domains must otherwise be enforced.
## 2026-03-30 - [Object Property Spoofing in Brainstorm Server]
**Vulnerability:** The brainstorm server merged untrusted WebSocket events with trusted properties using `{ source: 'user-event', ...event }`. This allowed an attacker to spoof the `source` property by including it in the `event` payload, overriding the trusted value.
**Learning:** When merging untrusted input objects with trusted overrides, the trusted properties must be placed after the spread operator to prevent spoofing by the incoming object payload.
**Prevention:** Always place trusted properties after the spread operator (e.g., `{ ...event, source: 'user-event' }`) when creating merged objects.

## 2026-04-10 - [Cross-Site WebSocket Hijacking Missing HTTP Error Response]
**Vulnerability:** The CSWSH and bad WebSocket request handler used `socket.destroy()` which simply closes the TCP socket without giving the client an HTTP response.
**Learning:** When rejecting a WebSocket upgrade in Node.js, we must send an appropriate HTTP status line (e.g. `HTTP/1.1 403 Forbidden\r\n\r\n`) via `socket.end()` before closing, so that the client (and any intermediate proxies) understands the failure mode instead of just getting a closed connection.
**Prevention:** Instead of `socket.destroy()`, always use `socket.end('HTTP/1.1 <StatusCode> <StatusMessage>\r\n\r\n')`.
