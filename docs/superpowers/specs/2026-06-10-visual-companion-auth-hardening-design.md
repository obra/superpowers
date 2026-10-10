# Visual Companion Auth Hardening Design

**Date:** 2026-06-10
**Status:** Draft for Drew review

## Goal

Fix the security and reliability gaps found in PR #1720's brainstorming visual
companion without changing the companion's core workflow or adding runtime
dependencies.

The fixes must be test-first and must leave clear automated evidence for:

- cross-origin browser tabs cannot inject companion events by riding cookies
- restart reconnect works without depending only on browser cookie behavior
- bearer keys do not remain in the visible URL after bootstrap
- `/files/*` cannot serve files outside the content directory
- future same-origin vendored UI libraries still work

## Threat Model

The companion serves agent-generated local UI for a single brainstorming
session. The important assets are:

- screen content served from the companion
- the session key
- `state/events`, which the agent reads as user feedback
- local files under the companion session directory

In scope attackers:

- a malicious browser tab on another `localhost` port
- a browser page that can make requests to the companion but should not be able
  to authenticate as the companion UI
- a direct remote client when the server is bound to a non-loopback interface
- accidental leakage through URL history, referrers, or committed local state
- content-directory symlinks or path tricks that escape `/files/*`

Out of scope for this fix:

- malicious agent-authored screen HTML
- malicious same-origin vendored JavaScript loaded by a companion screen

This out-of-scope boundary is intentional. Companion screens are part of the
agent UI surface. They may use inline scripts today and may someday use
same-origin vendored libraries such as Alpine or Three.js. Protecting against
malicious screen HTML would require a larger sandboxed-iframe architecture with
a narrow message bridge; that is not the scope of this PR hardening pass.

## Current Failures

Automated and headed-browser testing found these failures in the PR branch:

1. A cross-origin localhost page can open a cookie-authenticated WebSocket and
   write attacker-controlled choices to `state/events` after the real companion
   page sets the cookie.
2. `/files/*` serves symlinks that point outside `content/`, including a symlink
   to `state/server-info` containing the keyed URL.
3. The session key remains in the URL of the actual screen page, so same-origin
   screen JavaScript and accidental referrers/history can see it.
4. The helper reconnects with a keyless `ws://host` URL. In headed Chrome, after
   a same-port/same-token restart, the browser stopped presenting the cookie to
   the restarted server, so the open tab stayed stuck on the tombstone until a
   manual reload.
5. Shell lint and the lifecycle test need cleanup so the test pass is stable in
   Codex.

## Design

### 1. Bootstrap Keyed Loads

`GET /?key=<token>` becomes a bootstrap response, not the screen response.

When the key is valid, the server:

1. sets the HttpOnly session cookie as it does today
2. returns a small HTML bootstrap page
3. the bootstrap page stores the key in tab-scoped `sessionStorage`
4. the bootstrap page navigates to `/` using `location.replace('/')`

After this, the visible screen URL is bare `/`, not `/?key=...`.

`GET /` with a valid cookie serves the current screen. `GET /` without a valid
cookie still returns the friendly 403 page. `GET /?key=<wrong>` returns 403.

Why `sessionStorage`: the helper needs a reconnect credential that survives
same-port restarts and does not depend only on cookie behavior. Because screen
HTML is trusted same-origin UI, storing the key in tab-scoped storage is
acceptable for this threat model. It is materially better than leaving the key
in the address bar, history, and referrer surface.

### 2. WebSocket Same-Origin Enforcement

WebSocket upgrades must pass both checks:

1. valid session auth by query key or cookie
2. if an `Origin` header is present, it must match the request target origin

The origin check should compare:

```text
Origin === "http://" + req.headers.host
```

Browser attacker page example:

```text
Origin: http://localhost:9999
Host: localhost:58088
```

This must be rejected even if the browser sends the companion cookie.

Legitimate companion page example:

```text
Origin: http://localhost:58088
Host: localhost:58088
```

This should be accepted when the key or cookie is valid.

Direct non-browser clients may omit `Origin`; they still need the session key.

### 3. Helper Reconnect Credential

`helper.js` should read the tab-scoped key from `sessionStorage` and append it
to the WebSocket URL:

```text
ws://<host>/?key=<stored-key>
```

If no stored key exists, the helper falls back to the current cookie-only
`ws://<host>` behavior. This preserves compatibility for already-loaded pages
that do have a valid cookie but no storage entry.

### 4. `/files/*` Containment

The file server should continue to reject empty names and dotfiles. It must also
ensure the file is a real regular file inside `CONTENT_DIR`.

Use realpath containment as the boundary:

- compute `realContentDir = fs.realpathSync(CONTENT_DIR)`
- compute `realFilePath = fs.realpathSync(filePath)`
- serve only when `realFilePath` equals a descendant of `realContentDir`
- reject symlinks and anything outside the content directory with 404

The server should keep using `path.basename` so nested paths remain unsupported.

### 5. Leak-Reduction Headers

Add conservative headers that do not block inline scripts or future same-origin
vendored libraries:

```text
Referrer-Policy: no-referrer
Cache-Control: no-store
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
Cross-Origin-Resource-Policy: same-origin
```

Do not add a restrictive `script-src` CSP in this pass. The companion currently
injects inline helper JavaScript and future screens may load same-origin
vendored libraries.

### 6. Gitignore Durable Session State

Add `.superpowers/` to the repo root `.gitignore` so persisted companion state
and `.last-token` are not accidentally committed when using `--project-dir`.

### 7. Test Stability And Lint

Clean up shell lint warnings in the touched start/stop scripts.

Update the lifecycle test that invokes `start-server.sh --idle-timeout-minutes`
so it cannot hang under Codex's `CODEX_CI` foreground auto-detection. The test
should force background mode with `--background` when it expects the script to
return startup JSON.

## Testing Strategy

All behavior changes should be TDD:

1. write the failing focused test
2. run it and confirm it fails for the expected reason
3. implement the minimum fix
4. rerun the focused test
5. rerun the full brainstorm-server suite

Required focused regressions:

- valid keyed `/` returns bootstrap, not screen content
- bootstrap stores key in `sessionStorage` and strips the URL
- cookie-only `/` still serves screen content
- helper uses `sessionStorage` key for WebSocket URL
- same-origin cookie WebSocket opens
- cross-origin cookie WebSocket is rejected and writes no events
- direct key WebSocket still opens without `Origin`
- symlink under `content/` pointing to `state/server-info` returns 404
- security headers are present on normal HTML, bootstrap, 403, and file responses
- restart same port/token can authenticate reconnect with the stored key
- shell lint passes for touched shell scripts
- lifecycle suite does not hang under Codex

## Acceptance Criteria

- `cd tests/brainstorm-server && npm test` passes repeatedly without hanging.
- The security probe that previously wrote `attacker-injected` from another
  localhost origin now fails to open the WebSocket and leaves `state/events`
  unchanged.
- The symlink-to-`server-info` probe returns 404.
- A headed or headless browser keyed load ends on a bare `/` URL and the status
  pill reaches Connected.
- A same-port/same-token restart reconnects automatically without manual reload.
- `scripts/lint-shell.sh` passes for the touched shell scripts.

## Deferred Work

If the project later needs to treat screen HTML as untrusted, design a separate
sandboxed iframe architecture. That should isolate generated screens on a
separate origin or sandboxed frame and expose only a narrow `postMessage` bridge
for user choices. Do not bundle that into this fix.
