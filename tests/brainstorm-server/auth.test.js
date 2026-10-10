/**
 * Security tests for the brainstorm server's per-session key.
 *
 * The companion server is reachable by any local browser tab (default loopback
 * bind) and by any host that can route to it (remote `--host 0.0.0.0` bind).
 * A per-session secret key gates every endpoint so that neither a browser
 * confused-deputy nor a direct remote client can read screens/files or inject
 * events into state/events (prompt injection into a live agent session).
 *
 * Auth = a valid `?key=<token>` query param OR a valid session cookie.
 *
 * Uses the `ws` npm package as a test client (test-only dependency).
 */

const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/server.cjs');
const TEST_PORT = 3335;
const TEST_DIR = '/tmp/brainstorm-auth-test';
const CONTENT_DIR = path.join(TEST_DIR, 'content');
const TOKEN = 'testtoken-0123456789abcdef0123456789abcdef';
const COOKIE_NAME = `brainstorm-key-${TEST_PORT}`;
const EXPECTED_SECURITY_HEADERS = {
  'referrer-policy': 'no-referrer',
  'cache-control': 'no-store',
  'x-frame-options': 'DENY',
  'content-security-policy': "frame-ancestors 'none'",
  'cross-origin-resource-policy': 'same-origin'
};

function cleanup() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Raw HTTP GET with optional key query and Cookie header.
function get(pathname, { key, cookie } = {}) {
  const url = `http://localhost:${TEST_PORT}${pathname}` + (key !== undefined ? `?key=${key}` : '');
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  return new Promise((resolve, reject) => {
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

// Try to open a WebSocket; resolve 'opened' or 'rejected'.
function wsConnect({ key, cookie, origin } = {}) {
  const url = `ws://localhost:${TEST_PORT}/` + (key !== undefined ? `?key=${key}` : '');
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  if (origin) headers['Origin'] = origin;
  const opts = Object.keys(headers).length ? { headers } : {};
  const ws = new WebSocket(url, opts);
  return new Promise((resolve) => {
    let settled = false;
    const done = (outcome) => { if (!settled) { settled = true; resolve({ outcome, ws }); } };
    ws.on('open', () => done('opened'));
    ws.on('error', () => done('rejected'));
    ws.on('close', () => done('rejected'));
    setTimeout(() => done('rejected'), 1500);
  });
}

function startServer() {
  return spawn('node', [SERVER_PATH], {
    env: { ...process.env, BRAINSTORM_PORT: TEST_PORT, BRAINSTORM_DIR: TEST_DIR, BRAINSTORM_TOKEN: TOKEN }
  });
}

function assertSecurityHeaders(headers) {
  for (const [name, value] of Object.entries(EXPECTED_SECURITY_HEADERS)) {
    assert.strictEqual(headers[name], value, `${name} should be ${value}`);
  }
}

function runBootstrapScript(html, sessionStorage) {
  const match = html.match(/<script>\n([\s\S]*?)\n<\/script>/);
  assert(match, 'bootstrap response should contain a script block');
  const replacements = [];
  const location = { replace(url) { replacements.push(url); } };
  new Function('sessionStorage', 'location', match[1])(sessionStorage, location);
  return replacements;
}

async function waitForServer(server) {
  let stdout = '', stderr = '';
  return new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      stdout += d.toString();
      if (stdout.includes('server-started')) resolve({ stdout });
    });
    server.stderr.on('data', (d) => { stderr += d.toString(); });
    server.on('error', reject);
    setTimeout(() => reject(new Error(`Server didn't start. stderr: ${stderr}`)), 5000);
  });
}

function serverStartedMessage(out) {
  const line = out.trim().split('\n').find(l => l.includes('server-started'));
  assert(line, 'server-started JSON should be present');
  return JSON.parse(line);
}

function assertStartedOnExpectedPort(out) {
  const msg = serverStartedMessage(out);
  assert.strictEqual(
    msg.port,
    TEST_PORT,
    `auth.test.js expected fixed port ${TEST_PORT}, got ${msg.port}; fixed-port tests must not run through fallback`
  );
  return msg;
}

async function runTests() {
  cleanup();
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONTENT_DIR, 'screen.html'), '<h2>Secret screen</h2>');
  fs.writeFileSync(path.join(CONTENT_DIR, 'asset.txt'), 'secret asset');

  const server = startServer();
  let stdoutAccum = '';
  server.stdout.on('data', (d) => { stdoutAccum += d.toString(); });

  let passed = 0, failed = 0;
  async function test(name, fn) {
    try { await fn(); console.log(`  PASS: ${name}`); passed++; }
    catch (e) { console.log(`  FAIL: ${name}`); console.log(`    ${e.message}`); failed++; }
  }

  try {
    const { stdout: initialStdout } = await waitForServer(server);
    assertStartedOnExpectedPort(initialStdout);

    console.log('\n--- Startup URL ---');

    await test('server-started url includes the session key', () => {
      const msg = serverStartedMessage(initialStdout);
      assert(msg.url.includes(`key=${TOKEN}`), `url should carry the key, got: ${msg.url}`);
    });

    console.log('\n--- HTTP / gate ---');

    await test('GET / without key is rejected with 403', async () => {
      const res = await get('/');
      assert.strictEqual(res.status, 403, 'no-key request must be 403');
    });

    await test('403 page names "coding agent" and the key', async () => {
      const res = await get('/');
      assert(/coding agent/i.test(res.body), '403 body should reference the coding agent');
      assert(/key/i.test(res.body), '403 body should mention the key');
    });

    await test('403 responses include leak-reduction and anti-framing headers', async () => {
      const res = await get('/');
      assert.strictEqual(res.status, 403);
      assertSecurityHeaders(res.headers);
    });

    await test('GET / with wrong key is rejected with 403', async () => {
      const res = await get('/', { key: 'wrong-token' });
      assert.strictEqual(res.status, 403);
    });

    await test('GET / with wrong key and valid cookie is rejected with 403', async () => {
      const res = await get('/', { key: 'wrong-token', cookie: `${COOKIE_NAME}=${TOKEN}` });
      assert.strictEqual(res.status, 403, 'explicit wrong query key must not fall back to cookie auth');
    });

    await test('GET / with valid query returns bootstrap instead of screen content', async () => {
      const res = await get('/', { key: TOKEN });
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('sessionStorage'), 'bootstrap should store the session key in tab storage');
      assert(res.body.includes('location.replace'), 'bootstrap should navigate to the bare root URL');
      assert(!res.body.includes('Secret screen'), 'bootstrap must not serve screen HTML at the keyed URL');
    });

    await test('bootstrap strips the key URL even when sessionStorage write fails', async () => {
      const res = await get('/', { key: TOKEN });
      assert.strictEqual(res.status, 200);
      let replacements;
      assert.doesNotThrow(() => {
        replacements = runBootstrapScript(res.body, {
        setItem() { throw new Error('storage blocked'); }
        });
      });
      assert.deepStrictEqual(replacements, ['/']);
    });

    await test('HTML responses include leak-reduction and anti-framing headers', async () => {
      const res = await get('/', { key: TOKEN });
      assert.strictEqual(res.status, 200);
      assertSecurityHeaders(res.headers);
    });

    await test('valid key load sets an HttpOnly SameSite=Strict cookie', async () => {
      const res = await get('/', { key: TOKEN });
      const setCookie = (res.headers['set-cookie'] || []).join('; ');
      assert(setCookie.includes(`${COOKIE_NAME}=${TOKEN}`), `should set ${COOKIE_NAME}`);
      assert(/HttpOnly/i.test(setCookie), 'cookie should be HttpOnly');
      assert(/SameSite=Strict/i.test(setCookie), 'cookie should be SameSite=Strict');
    });

    await test('GET / with valid cookie (no query key) serves the screen', async () => {
      const res = await get('/', { cookie: `${COOKIE_NAME}=${TOKEN}` });
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('Secret screen'), 'cookie-authenticated bare root should serve the screen');
      assert(!res.body.includes("location.replace('/');"), 'bare screen response should not be the bootstrap page');
    });

    console.log('\n--- HTTP /files gate ---');

    await test('GET /files without key is rejected with 403', async () => {
      const res = await get('/files/asset.txt');
      assert.strictEqual(res.status, 403);
    });

    await test('GET /files with valid key serves the file', async () => {
      const res = await get('/files/asset.txt', { key: TOKEN });
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('secret asset'));
    });

    await test('/files responses include leak-reduction and anti-framing headers', async () => {
      const res = await get('/files/asset.txt', { key: TOKEN });
      assert.strictEqual(res.status, 200);
      assertSecurityHeaders(res.headers);
    });

    console.log('\n--- WebSocket gate ---');

    await test('WS upgrade without key is rejected', async () => {
      const { outcome, ws } = await wsConnect();
      ws.close();
      assert.strictEqual(outcome, 'rejected', 'unauthenticated WS must not open');
    });

    await test('WS upgrade with valid key opens', async () => {
      const { outcome, ws } = await wsConnect({ key: TOKEN });
      ws.close();
      assert.strictEqual(outcome, 'opened');
    });

    await test('WS upgrade with valid cookie opens', async () => {
      const { outcome, ws } = await wsConnect({ cookie: `${COOKIE_NAME}=${TOKEN}` });
      ws.close();
      assert.strictEqual(outcome, 'opened');
    });

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

    console.log('\n--- Robustness (A3) ---');

    await test('null payload over an authed WS does not crash the server', async () => {
      const { ws } = await wsConnect({ key: TOKEN });
      ws.send('null');
      await sleep(300);
      const res = await get('/', { key: TOKEN });
      assert.strictEqual(res.status, 200, 'server must still respond after null payload');
      ws.close();
    });

    console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
    if (failed > 0) {
      process.exitCode = 1;
      return;
    }
  } finally {
    server.kill();
    await sleep(100);
    cleanup();
  }
}

runTests().catch(err => { console.error('Test failed:', err); process.exit(1); });
