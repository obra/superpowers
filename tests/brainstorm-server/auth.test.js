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
function wsConnect({ key, cookie } = {}) {
  const url = `ws://localhost:${TEST_PORT}/` + (key !== undefined ? `?key=${key}` : '');
  const opts = cookie ? { headers: { Cookie: cookie } } : {};
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

async function runTests() {
  cleanup();
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONTENT_DIR, 'screen.html'), '<h2>Secret screen</h2>');
  fs.writeFileSync(path.join(CONTENT_DIR, 'asset.txt'), 'secret asset');

  const server = startServer();
  let stdoutAccum = '';
  server.stdout.on('data', (d) => { stdoutAccum += d.toString(); });
  const { stdout: initialStdout } = await waitForServer(server);

  let passed = 0, failed = 0;
  async function test(name, fn) {
    try { await fn(); console.log(`  PASS: ${name}`); passed++; }
    catch (e) { console.log(`  FAIL: ${name}`); console.log(`    ${e.message}`); failed++; }
  }

  try {
    console.log('\n--- Startup URL ---');

    await test('server-started url includes the session key', () => {
      const msg = JSON.parse(initialStdout.trim());
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

    await test('GET / with wrong key is rejected with 403', async () => {
      const res = await get('/', { key: 'wrong-token' });
      assert.strictEqual(res.status, 403);
    });

    await test('GET / with valid key serves the screen', async () => {
      const res = await get('/', { key: TOKEN });
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('Secret screen'), 'should serve the screen content');
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
      assert(res.body.includes('Secret screen'));
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
    if (failed > 0) process.exit(1);
  } finally {
    server.kill();
    await sleep(100);
    cleanup();
  }
}

runTests().catch(err => { console.error('Test failed:', err); process.exit(1); });
