# Visual Companion Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the brainstorming visual companion auth and reconnect flow while preserving trusted same-origin screen JavaScript and future vendored UI libraries.

**Architecture:** Keyed root loads become a bootstrap step that sets the cookie, stores the key in tab-scoped `sessionStorage`, and navigates to a bare `/` screen URL. WebSockets require valid auth plus browser same-origin `Origin`, while `/files/*` uses realpath containment to prevent content-directory escapes.

**Tech Stack:** Node.js built-ins (`http`, `fs`, `path`, `crypto`), zero runtime dependencies, existing `ws` test dependency, Bash start/stop scripts, repo shell lint script.

**Important:** Do not commit during execution unless Drew explicitly asks. This repository's instructions override the generic plan template's commit cadence.

---

## File Map

- Modify: `skills/brainstorming/scripts/server.cjs`
  - Add bootstrap response.
  - Add shared security headers.
  - Add WebSocket Origin validation.
  - Add `/files/*` realpath containment.
- Modify: `skills/brainstorming/scripts/helper.js`
  - Read the stored session key and append it to the WebSocket URL.
- Modify: `tests/brainstorm-server/auth.test.js`
  - Add bootstrap, header, same-origin WS, cross-origin WS, and cookie/file auth regressions.
- Modify: `tests/brainstorm-server/helper.test.js`
  - Add mocked-browser coverage for sessionStorage-backed WS URLs.
- Modify: `tests/brainstorm-server/server.test.js`
  - Add symlink containment regression for `/files/*`.
- Modify: `tests/brainstorm-server/lifecycle.test.js`
  - Make the start-server timeout flag test force background mode.
  - Add restart reconnect credential coverage if it fits the existing lifecycle helper.
- Modify: `skills/brainstorming/scripts/start-server.sh`
  - Fix shell lint.
- Modify: `skills/brainstorming/scripts/stop-server.sh`
  - Fix shell lint.
- Modify: `.gitignore`
  - Add `.superpowers/`.
- Optional docs update: `skills/brainstorming/visual-companion.md`
  - Mention bootstrap URL stripping and trusted same-origin screen JS if the code behavior changes need operator-facing explanation.

## Task 1: Bootstrap Keyed Root Loads

**Files:**
- Modify: `tests/brainstorm-server/auth.test.js`
- Modify: `skills/brainstorming/scripts/server.cjs`

- [ ] **Step 1: Add RED tests for bootstrap behavior**

In `tests/brainstorm-server/auth.test.js`, add tests after the existing valid-key root test:

```js
    await test('GET / with valid query returns bootstrap instead of screen content', async () => {
      const res = await get('/', { key: TOKEN });
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('sessionStorage'), 'bootstrap should store the session key in tab storage');
      assert(res.body.includes('location.replace'), 'bootstrap should navigate to the bare root URL');
      assert(!res.body.includes('Secret screen'), 'bootstrap must not serve screen HTML at the keyed URL');
    });

    await test('GET / with valid cookie serves the screen after bootstrap', async () => {
      const res = await get('/', { cookie: `${COOKIE_NAME}=${TOKEN}` });
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('Secret screen'), 'cookie-authenticated bare root should serve the screen');
      assert(!res.body.includes('sessionStorage'), 'bare screen response should not be the bootstrap page');
    });
```

Keep the existing cookie test if present; merge assertions rather than duplicating the same test name.

- [ ] **Step 2: Verify RED**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node auth.test.js
```

Expected: the new bootstrap test fails because current `GET /?key=...` serves `Secret screen` directly and does not include the bootstrap `sessionStorage`/`location.replace` code.

- [ ] **Step 3: Implement minimal bootstrap response**

In `skills/brainstorming/scripts/server.cjs`, add a helper near the page constants:

```js
function bootstrapPage(key) {
  const jsonKey = JSON.stringify(String(key));
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Opening Brainstorm Companion</title></head>
<body>
<script>
sessionStorage.setItem('brainstorm-session-key', ${jsonKey});
location.replace('/');
</script>
</body>
</html>`;
}
```

Then in `handleRequest`, after authorization and cookie setting but before serving screen HTML, detect a valid query key on root:

```js
function queryKey(url) {
  const q = url.indexOf('?');
  if (q < 0) return null;
  return new URLSearchParams(url.slice(q + 1)).get('key');
}
```

Use it in `handleRequest`:

```js
  const pathname = pathnameOf(req.url);
  const keyFromQuery = queryKey(req.url);
  if (req.method === 'GET' && pathname === '/' && keyFromQuery && timingSafeEqualStr(keyFromQuery, TOKEN)) {
    res.writeHead(200, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
    res.end(bootstrapPage(keyFromQuery));
    return;
  }
```

This assumes Task 4 will introduce `securityHeaders`. If implementing Task 1 first, temporarily use:

```js
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
```

and replace it in Task 4.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node auth.test.js
```

Expected: all auth tests pass, including the new bootstrap tests.

## Task 2: WebSocket Origin Enforcement

**Files:**
- Modify: `tests/brainstorm-server/auth.test.js`
- Modify: `skills/brainstorming/scripts/server.cjs`

- [ ] **Step 1: Add RED tests for same-origin and cross-origin WS**

In `tests/brainstorm-server/auth.test.js`, extend `wsConnect` to accept an `origin` option:

```js
function wsConnect({ key, cookie, origin } = {}) {
  const url = `ws://localhost:${TEST_PORT}/` + (key !== undefined ? `?key=${key}` : '');
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  if (origin) headers['Origin'] = origin;
  const ws = new WebSocket(url, Object.keys(headers).length ? { headers } : {});
  return new Promise((resolve) => {
    let settled = false;
    const done = (outcome) => { if (!settled) { settled = true; resolve({ outcome, ws }); } };
    ws.on('open', () => done('opened'));
    ws.on('error', () => done('rejected'));
    ws.on('close', () => done('rejected'));
    setTimeout(() => done('rejected'), 1500);
  });
}
```

Then add:

```js
    await test('WS upgrade with valid cookie and same-origin Origin opens', async () => {
      const { outcome, ws } = await wsConnect({
        cookie: `${COOKIE_NAME}=${TOKEN}`,
        origin: `http://localhost:${TEST_PORT}`
      });
      ws.close();
      assert.strictEqual(outcome, 'opened');
    });

    await test('WS upgrade with valid cookie but cross-origin Origin is rejected', async () => {
      const eventsFile = path.join(TEST_DIR, 'state', 'events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      const { outcome, ws } = await wsConnect({
        cookie: `${COOKIE_NAME}=${TOKEN}`,
        origin: 'http://localhost:9999'
      });
      if (outcome === 'opened') {
        ws.send(JSON.stringify({ type: 'choice', choice: 'attacker-injected', text: 'local attacker probe' }));
        await sleep(300);
      }
      ws.close();

      assert.strictEqual(outcome, 'rejected', 'cross-origin browser WS must not open even with cookie');
      assert(!fs.existsSync(eventsFile), 'cross-origin WS must not write state/events');
    });
```

- [ ] **Step 2: Verify RED**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node auth.test.js
```

Expected: cross-origin cookie WS test fails because current server accepts any cookie-authenticated WS regardless of Origin.

- [ ] **Step 3: Implement Origin check**

In `skills/brainstorming/scripts/server.cjs`, add:

```js
function isAllowedWebSocketOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients still need the session key
  const host = req.headers.host;
  if (!host) return false;
  return origin === 'http://' + host;
}
```

Then update `handleUpgrade`:

```js
function handleUpgrade(req, socket) {
  if (!isAuthorized(req) || !isAllowedWebSocketOrigin(req)) { socket.destroy(); return; }
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node auth.test.js
```

Expected: auth tests pass; cross-origin WS is rejected; same-origin and direct key WS still open.

## Task 3: Helper Uses Stored Key For Reconnect

**Files:**
- Modify: `tests/brainstorm-server/helper.test.js`
- Modify: `skills/brainstorming/scripts/helper.js`

- [ ] **Step 1: Add RED test for WebSocket URL key**

In `tests/brainstorm-server/helper.test.js`, add a mocked-browser test near the reconnect state-machine tests:

```js
test('uses sessionStorage key in the WebSocket URL when present', () => {
  const e = makeEnv();
  e.state.sessionKey = 'stored-key-abc';
  e.boot();
  assert.strictEqual(e.sockets[0].url, 'ws://localhost:7777/?key=stored-key-abc');
});
```

Update `makeEnv()` so the returned object exposes `sockets`, and the mock window includes sessionStorage:

```js
    window: {
      location: { host: 'localhost:7777', reload() { state.reloads++; } },
      sessionStorage: { getItem: (key) => key === 'brainstorm-session-key' ? state.sessionKey : null }
    },
```

Also add a fallback test:

```js
test('uses cookie-only WebSocket URL when no sessionStorage key is present', () => {
  const e = makeEnv();
  e.state.sessionKey = null;
  e.boot();
  assert.strictEqual(e.sockets[0].url, 'ws://localhost:7777');
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node helper.test.js
```

Expected: stored-key test fails because current helper uses `ws://localhost:7777`.

- [ ] **Step 3: Implement stored-key WS URL**

In `skills/brainstorming/scripts/helper.js`, replace:

```js
  const WS_URL = 'ws://' + window.location.host;
```

with:

```js
  function websocketUrl() {
    let key = null;
    try { key = window.sessionStorage && window.sessionStorage.getItem('brainstorm-session-key'); } catch (e) {}
    return 'ws://' + window.location.host + (key ? '/?key=' + encodeURIComponent(key) : '');
  }
```

Then replace:

```js
    ws = new WebSocket(WS_URL);
```

with:

```js
    ws = new WebSocket(websocketUrl());
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node helper.test.js
```

Expected: helper tests pass.

## Task 4: Security Headers

**Files:**
- Modify: `tests/brainstorm-server/auth.test.js`
- Modify: `skills/brainstorming/scripts/server.cjs`

- [ ] **Step 1: Add RED header tests**

In `tests/brainstorm-server/auth.test.js`, add:

```js
    await test('HTML responses include leak-reduction and anti-framing headers', async () => {
      const res = await get('/', { key: TOKEN });
      assert.strictEqual(res.headers['referrer-policy'], 'no-referrer');
      assert.strictEqual(res.headers['cache-control'], 'no-store');
      assert.strictEqual(res.headers['x-frame-options'], 'DENY');
      assert.strictEqual(res.headers['content-security-policy'], "frame-ancestors 'none'");
      assert.strictEqual(res.headers['cross-origin-resource-policy'], 'same-origin');
    });

    await test('403 responses include leak-reduction and anti-framing headers', async () => {
      const res = await get('/');
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.headers['referrer-policy'], 'no-referrer');
      assert.strictEqual(res.headers['cache-control'], 'no-store');
      assert.strictEqual(res.headers['x-frame-options'], 'DENY');
      assert.strictEqual(res.headers['content-security-policy'], "frame-ancestors 'none'");
      assert.strictEqual(res.headers['cross-origin-resource-policy'], 'same-origin');
    });
```

- [ ] **Step 2: Verify RED**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node auth.test.js
```

Expected: header tests fail because current responses do not include these headers.

- [ ] **Step 3: Implement shared header helper**

In `skills/brainstorming/scripts/server.cjs`, add:

```js
function securityHeaders(headers = {}) {
  return {
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "frame-ancestors 'none'",
    'Cross-Origin-Resource-Policy': 'same-origin',
    ...headers
  };
}
```

Update response writes in `handleRequest`:

```js
res.writeHead(403, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
```

```js
res.writeHead(200, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
```

```js
res.writeHead(200, securityHeaders({ 'Content-Type': contentType }));
```

For 404s:

```js
res.writeHead(404, securityHeaders());
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node auth.test.js
```

Expected: auth tests pass and header assertions are green.

## Task 5: `/files/*` Realpath Containment

**Files:**
- Modify: `tests/brainstorm-server/server.test.js`
- Modify: `skills/brainstorming/scripts/server.cjs`

- [ ] **Step 1: Add RED symlink escape test**

In `tests/brainstorm-server/server.test.js`, after the `/files/` empty-name test, add:

```js
    await test('does not serve symlinks that escape content dir via /files/', async () => {
      const target = path.join(STATE_DIR, 'server-info');
      const link = path.join(CONTENT_DIR, 'linked-server-info.txt');
      try { fs.unlinkSync(link); } catch (e) {}
      fs.symlinkSync(target, link);

      const res = await fetch(`http://localhost:${TEST_PORT}/files/linked-server-info.txt`);
      assert.strictEqual(res.status, 404, 'symlink to state/server-info must not be served');
      assert(!res.body.includes('server-started'), 'response must not include server-info body');
    });
```

- [ ] **Step 2: Verify RED**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node server.test.js
```

Expected: symlink test fails because current `/files/*` follows symlinks and serves `server-info`.

- [ ] **Step 3: Implement containment helper**

In `skills/brainstorming/scripts/server.cjs`, add:

```js
function isRegularFileInsideContentDir(filePath) {
  let stat, realContentDir, realFilePath;
  try {
    stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink()) return false;
    if (!stat.isFile()) return false;
    realContentDir = fs.realpathSync(CONTENT_DIR);
    realFilePath = fs.realpathSync(filePath);
  } catch (e) {
    return false;
  }
  return realFilePath.startsWith(realContentDir + path.sep);
}
```

Replace the `/files/*` guard with:

```js
    if (!fileName || fileName.startsWith('.') || !isRegularFileInsideContentDir(filePath)) {
      res.writeHead(404, securityHeaders());
      res.end('Not found');
      return;
    }
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node server.test.js
```

Expected: server tests pass, including symlink rejection.

## Task 6: Restart Reconnect Regression

**Files:**
- Modify: `tests/brainstorm-server/lifecycle.test.js`
- Modify: `skills/brainstorming/scripts/server.cjs`
- Modify: `skills/brainstorming/scripts/helper.js`

- [ ] **Step 1: Add RED integration test for same key over WS after restart**

In `tests/brainstorm-server/lifecycle.test.js`, add a test after the port/token persistence test:

```js
  await test('stored key can authenticate WebSocket after same-port restart', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-reconnect-');
    const portFile = path.join(dir, '.last-port');
    const tokenFile = path.join(dir, '.last-token');
    const env = { ...process.env, BRAINSTORM_PORT_FILE: portFile, BRAINSTORM_TOKEN_FILE: tokenFile, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 };

    const a = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's1') } });
    let outA = ''; a.stdout.on('data', d => outA += d.toString());
    for (let i = 0; i < 60 && !outA.includes('server-started'); i++) await sleep(50);
    const infoA = firstServerStarted(outA);
    const keyA = new URL(infoA.url).searchParams.get('key');
    a.kill(); await sleep(400);

    const b = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's2') } });
    let outB = ''; b.stdout.on('data', d => outB += d.toString());
    for (let i = 0; i < 60 && !outB.includes('server-started'); i++) await sleep(50);
    const infoB = firstServerStarted(outB);

    const ws = new WebSocket(`ws://localhost:${infoB.port}/?key=${keyA}`, {
      headers: { Origin: `http://localhost:${infoB.port}` }
    });
    const opened = await new Promise(resolve => {
      ws.on('open', () => resolve(true));
      ws.on('error', () => resolve(false));
      setTimeout(() => resolve(false), 1500);
    });

    try {
      assert.strictEqual(infoB.port, infoA.port, 'restart should reuse same port');
      assert(opened, 'stored key should authenticate WS after restart');
    } finally {
      try { ws.close(); } catch (e) {}
      b.kill(); await sleep(100);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
```

This test may already pass once Tasks 2 and 3 are implemented. If it passes before code changes, keep it as coverage but do not call it RED. The real browser reconnect behavior is primarily covered by Task 3 plus final manual/headless browser verification.

- [ ] **Step 2: Verify behavior**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node lifecycle.test.js
```

Expected after Tasks 2 and 3: lifecycle tests pass. If this fails, fix the auth/restart path before continuing.

## Task 7: Lifecycle Hang And Shell Lint

**Files:**
- Modify: `tests/brainstorm-server/lifecycle.test.js`
- Modify: `skills/brainstorming/scripts/start-server.sh`
- Modify: `skills/brainstorming/scripts/stop-server.sh`

- [ ] **Step 1: Reproduce shell lint failure**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
scripts/lint-shell.sh skills/brainstorming/scripts/start-server.sh skills/brainstorming/scripts/stop-server.sh tests/brainstorm-server/stop-server.test.sh
```

Expected current failure:

```text
SC2164: skills/brainstorming/scripts/start-server.sh line 128: cd "$SCRIPT_DIR"
SC2034: skills/brainstorming/scripts/start-server.sh line 166: for i in {1..50}
SC2034: skills/brainstorming/scripts/stop-server.sh line 57: for i in {1..20}
```

- [ ] **Step 2: Fix shell lint minimally**

In `skills/brainstorming/scripts/start-server.sh`, change:

```bash
cd "$SCRIPT_DIR"
```

to:

```bash
cd "$SCRIPT_DIR" || exit 1
```

Change unused loop variables from `i` to `_` where they are not read:

```bash
for _ in {1..50}; do
```

In `skills/brainstorming/scripts/stop-server.sh`, change:

```bash
for i in {1..20}; do
```

to:

```bash
for _ in {1..20}; do
```

- [ ] **Step 3: Fix lifecycle start-server hang**

In `tests/brainstorm-server/lifecycle.test.js`, update the `start-server.sh --idle-timeout-minutes sets the timeout` test command:

```js
const out = execFileSync('bash', [START, '--project-dir', dir, '--idle-timeout-minutes', '5', '--background'], { encoding: 'utf8' });
```

This keeps the test from hanging when `CODEX_CI` triggers start-server foreground mode.

- [ ] **Step 4: Verify lint and lifecycle**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
scripts/lint-shell.sh skills/brainstorming/scripts/start-server.sh skills/brainstorming/scripts/stop-server.sh tests/brainstorm-server/stop-server.test.sh
cd tests/brainstorm-server
node lifecycle.test.js
```

Expected: shell lint exits 0; lifecycle tests exit 0 without hanging.

## Task 8: Gitignore Durable Companion State

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Verify current ignore gap**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
git check-ignore .superpowers/brainstorm/.last-token || true
```

Expected current output: no matching ignore rule.

- [ ] **Step 2: Add ignore rule**

Add this line to `.gitignore`:

```gitignore
.superpowers/
```

- [ ] **Step 3: Verify GREEN**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
git check-ignore .superpowers/brainstorm/.last-token
```

Expected output:

```text
.superpowers/brainstorm/.last-token
```

## Task 9: Full Automated Verification

**Files:**
- No code changes in this task.

- [ ] **Step 1: Run focused suites**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
node auth.test.js
node helper.test.js
node server.test.js
node lifecycle.test.js
```

Expected: all four commands exit 0.

- [ ] **Step 2: Run full brainstorm-server suite**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
npm test
```

Expected: all tests pass, including ws-protocol, helper, auth, server, lifecycle, and stop-server.

- [ ] **Step 3: Repeat suite for lifecycle/watch flake**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers/tests/brainstorm-server
for i in 1 2 3; do npm test || exit 1; done
```

Expected: all three repeats pass without hanging.

- [ ] **Step 4: Run shell lint**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
scripts/lint-shell.sh skills/brainstorming/scripts/start-server.sh skills/brainstorming/scripts/stop-server.sh tests/brainstorm-server/stop-server.test.sh
```

Expected: exits 0.

## Task 10: Re-run Security Probes

**Files:**
- No code changes in this task.

- [ ] **Step 1: Recreate the cross-origin attacker probe**

Use the previous scratch probe if available:

```bash
node /tmp/superpowers-pr1720-security-drewritter/probe-pr1720.cjs
```

If the scratch probe is unavailable, recreate a minimal probe under `/tmp` that:

- starts the companion with a fixed token
- loads the keyed URL in headless Chrome
- starts an attacker page on a different localhost port
- attempts `new WebSocket('ws://localhost:<companion-port>/')`
- sends `{"type":"choice","choice":"attacker-injected"}`
- checks `state/events`

Expected after fixes:

- keyless and wrong-key HTTP still return 403
- same-origin helper reaches Connected
- cross-origin WebSocket does not open
- `state/events` does not contain `attacker-injected`
- symlink-to-`server-info` returns 404
- keyed browser load ends on bare `/`

- [ ] **Step 2: Re-run manual/browser flow only after automated probes pass**

Manual flow:

1. start the companion with `--project-dir --open`
2. push a screen
3. confirm URL strips to `/`
4. confirm status reaches Connected
5. click a choice and verify `state/events`
6. stop and restart same project
7. verify the open tab reconnects automatically

Expected: all steps pass without manual URL reload.

## Self-Review Checklist

- Spec coverage: every design requirement maps to at least one task.
- Placeholder scan: this plan contains no unresolved placeholder markers or unspecified edge-case steps.
- TDD order: every production change task starts with a focused failing test or a command that demonstrates the current failure.
- Trust model: the plan preserves trusted same-origin screen JavaScript and future same-origin vendored libraries.
- No-commit rule: execution does not commit unless Drew explicitly asks.
