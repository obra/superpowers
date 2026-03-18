# Zero-Dependency Brainstorm Server

Replace the brainstorm companion server's vendored node_modules (express, ws, chokidar — 714 tracked files) with a single zero-dependency `server.js` using only Node.js built-ins.

## Motivation

Vendoring node_modules into the git repo creates a supply chain risk: frozen dependencies don't get security patches, 714 files of third-party code are committed without audit, and modifications to vendored code look like normal commits. While the actual risk is low (localhost-only dev server), eliminating it is straightforward.

## Architecture

A single `server.js` file (~250-300 lines) using `http`, `crypto`, `fs`, and `path`. The file serves two roles:

- **When run directly** (`node server.js`): starts the HTTP/WebSocket server
- **When required** (`require('./server.js')`): exports WebSocket protocol functions for unit testing

### WebSocket Protocol

Implements RFC 6455 for text frames only:

**Handshake:** Compute `Sec-WebSocket-Accept` from client's `Sec-WebSocket-Key` using SHA-1 + the RFC 6455 magic GUID. Return 101 Switching Protocols.

**Frame decoding (client to server):** Handle three masked length encodings:
- Small: payload < 126 bytes
- Medium: 126-65535 bytes (16-bit extended)
- Large: > 65535 bytes (64-bit extended)

XOR-unmask payload using 4-byte mask key. Return `{ opcode, payload, bytesConsumed }` or `null` for incomplete buffers. Reject unmasked frames.

**Frame encoding (server to client):** Unmasked frames with the same three length encodings.

**Opcodes handled:** TEXT (0x01), CLOSE (0x08), PING (0x09), PONG (0x0A). Unrecognized opcodes get a close frame with status 1003 (Unsupported Data).

**Deliberately skipped:** Binary frames, fragmented messages, extensions (permessage-deflate), subprotocols. These are unnecessary for small JSON text messages between localhost clients. Extensions and subprotocols are negotiated in the handshake — by not advertising them, they are never active.

**Buffer accumulation:** Each connection maintains a buffer. On `data`, append and loop `decodeFrame` until it returns null or buffer is empty.

### HTTP Server

Three routes:

1. **`GET /`** — Serve newest `.html` from screen directory by mtime. Detect full documents vs fragments, wrap fragments in frame template, inject helper.js. Return `text/html`. When no `.html` files exist, serve a hardcoded waiting page ("Waiting for Claude to push a screen...") with helper.js injected.
2. **`GET /files/*`** — Serve static files from screen directory with MIME type lookup from a hardcoded extension map (html, css, js, png, jpg, gif, svg, json). Return 404 if not found.
3. **Everything else** — 404.

WebSocket upgrade handled via the `'upgrade'` event on the HTTP server, separate from the request handler.

### Configuration

Environment variables (all optional):

- `BRAINSTORM_PORT` — port to bind (default: random high port 49152-65535)
- `BRAINSTORM_HOST` — interface to bind (default: `127.0.0.1`)
- `BRAINSTORM_URL_HOST` — hostname for the URL in startup JSON (default: `localhost` when host is `127.0.0.1`, otherwise same as host)
- `BRAINSTORM_DIR` — screen directory path (default: `/tmp/brainstorm`)

### Startup Sequence

1. Create `SCREEN_DIR` if it doesn't exist (`mkdirSync` recursive)
2. Load frame template and helper.js from `__dirname`
3. Start HTTP server on configured host/port
4. Start `fs.watch` on `SCREEN_DIR`
5. On successful listen, log `server-started` JSON to stdout: `{ type, port, host, url_host, url, screen_dir }`
6. Write the same JSON to `SCREEN_DIR/.server-info` so agents can find connection details when stdout is hidden (background execution)

### Application-Level WebSocket Messages

When a TEXT frame arrives from a client:

1. Parse as JSON. If parsing fails, log to stderr and continue.
2. Log to stdout as `{ source: 'user-event', ...event }`.
3. If the event contains a `choice` property, append the JSON to `SCREEN_DIR/.events` (one line per event).

### File Watching

`fs.watch(SCREEN_DIR)` replaces chokidar. On HTML file events:

- On new file (`rename` event for a file that exists): delete `.events` file if present (`unlinkSync`), log `screen-added` to stdout as JSON
- On file change (`change` event): log `screen-updated` to stdout as JSON (do NOT clear `.events`)
- Both events: send `{ type: 'reload' }` to all connected WebSocket clients

Debounce per-filename with ~100ms timeout to prevent duplicate events (common on macOS and Linux).

### Error Handling

- Malformed JSON from WebSocket clients: log to stderr, continue
- Unhandled opcodes: close with status 1003
- Client disconnects: remove from broadcast set
- `fs.watch` errors: log to stderr, continue
- No graceful shutdown logic — shell scripts handle process lifecycle via SIGTERM

## What Changes

| Before | After |
|---|---|
| `index.js` + `package.json` + `package-lock.json` + 714 `node_modules` files | `server.js` (single file) |
| express, ws, chokidar dependencies | none |
| No static file serving | `/files/*` serves from screen directory |

## What Stays the Same

- `helper.js` — no changes
- `frame-template.html` — no changes
- `start-server.sh` — one-line update: `index.js` to `server.js`
- `stop-server.sh` — no changes
- `visual-companion.md` — no changes
- All existing server behavior and external contract

## Platform Compatibility

- `server.js` uses only cross-platform Node built-ins
- `fs.watch` is reliable for single flat directories on macOS, Linux, and Windows
- Shell scripts require bash (Git Bash on Windows, which is required for Claude Code)

## Testing

**Unit tests** (`ws-protocol.test.js`): Test WebSocket frame encoding/decoding, handshake computation, and protocol edge cases directly by requiring `server.js` exports.

**Integration tests** (`server.test.js`): Test full server behavior — HTTP serving, WebSocket communication, file watching, brainstorming workflow. Uses `ws` npm package as a test-only client dependency (not shipped to end users).
