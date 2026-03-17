/**
 * Integration tests for the brainstorm server.
 *
 * Tests the full server behavior: HTTP serving, WebSocket communication,
 * file watching, and the brainstorming workflow.
 *
 * Uses the `ws` npm package as a test client (test-only dependency,
 * not shipped to end users).
 */

const { spawn, spawnSync } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/server.js');
const STOP_SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/stop-server.sh');
const TEST_PORT = 3334;
const TEST_DIR = '/tmp/brainstorm-test';
let sessionCookie = null;
let serverInfo = null;

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);
    const req = http.request({
      hostname: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.pathname + requestUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const header = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  return header.split(';')[0];
}

function wsUrl(pathname = '/') {
  return `ws://localhost:${TEST_PORT}${pathname}`;
}

async function getSessionCookie(forceRefresh = false) {
  if (sessionCookie && !forceRefresh) return sessionCookie;

  const res = await fetch(serverInfo.url);
  assert.strictEqual(res.status, 200, 'Authorized bootstrap URL should return 200');
  sessionCookie = extractCookie(res.headers['set-cookie']);
  assert(sessionCookie, 'Expected auth cookie from bootstrap request');
  return sessionCookie;
}

async function authFetch(pathname = '/', options = {}) {
  const cookie = await getSessionCookie();
  return fetch(`http://localhost:${TEST_PORT}${pathname}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Cookie: cookie
    }
  });
}

async function connectWs({ headers = {}, url = wsUrl('/'), withCookie = true } = {}) {
  const finalHeaders = { ...headers };
  if (withCookie) {
    finalHeaders.Cookie = await getSessionCookie();
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { headers: finalHeaders });
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

async function expectWsHandshakeFailure({ headers = {}, url = wsUrl('/'), withCookie = false } = {}) {
  const finalHeaders = { ...headers };
  if (withCookie) {
    finalHeaders.Cookie = await getSessionCookie();
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { headers: finalHeaders });
    ws.on('open', () => reject(new Error('WebSocket unexpectedly connected')));
    ws.on('unexpected-response', (_req, res) => {
      resolve(res.statusCode);
      res.resume();
    });
    ws.on('error', () => resolve(null));
  });
}

function startServer() {
  return spawn('node', [SERVER_PATH], {
    env: { ...process.env, BRAINSTORM_PORT: TEST_PORT, BRAINSTORM_DIR: TEST_DIR }
  });
}

async function waitForServer(server) {
  let stdout = '';
  let stderr = '';

  return new Promise((resolve, reject) => {
    server.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.includes('server-started')) {
        resolve({ stdout, stderr, getStdout: () => stdout });
      }
    });
    server.stderr.on('data', (data) => { stderr += data.toString(); });
    server.on('error', reject);

    setTimeout(() => reject(new Error(`Server didn't start. stderr: ${stderr}`)), 5000);
  });
}

async function runTests() {
  cleanup();
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const server = startServer();
  let stdoutAccum = '';
  server.stdout.on('data', (data) => { stdoutAccum += data.toString(); });

  const { stdout: initialStdout } = await waitForServer(server);
  serverInfo = JSON.parse(fs.readFileSync(path.join(TEST_DIR, '.server-info'), 'utf-8').trim());
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return fn().then(() => {
      console.log(`  PASS: ${name}`);
      passed++;
    }).catch(e => {
      console.log(`  FAIL: ${name}`);
      console.log(`    ${e.message}`);
      failed++;
    });
  }

  try {
    // ========== Server Startup ==========
    console.log('\n--- Server Startup ---');

    await test('outputs server-started JSON on startup', () => {
      const msg = JSON.parse(initialStdout.trim());
      assert.strictEqual(msg.type, 'server-started');
      assert.strictEqual(msg.port, TEST_PORT);
      assert(msg.url, 'Should include URL');
      assert(msg.screen_dir, 'Should include screen_dir');
      assert(!msg.url.includes('token='), 'Stdout should not expose auth token');
      return Promise.resolve();
    });

    await test('writes .server-info file', () => {
      const infoPath = path.join(TEST_DIR, '.server-info');
      assert(fs.existsSync(infoPath), '.server-info should exist');
      assert.strictEqual(serverInfo.type, 'server-started');
      assert.strictEqual(serverInfo.port, TEST_PORT);
      assert(serverInfo.url.includes('token='), 'Auth URL should include bootstrap token');
      assert(serverInfo.auth_required, 'Should advertise auth requirement');
      return Promise.resolve();
    });

    // ========== HTTP Serving ==========
    console.log('\n--- HTTP Serving ---');

    await test('rejects unauthenticated HTTP requests', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(res.status, 403);
    });

    await test('serves waiting page when no screens exist', async () => {
      const res = await fetch(serverInfo.url);
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('Waiting for Claude'), 'Should show waiting message');
    });

    await test('injects helper.js into waiting page', async () => {
      const res = await authFetch('/');
      assert(res.body.includes('WebSocket'), 'Should have helper.js injected');
      assert(res.body.includes('toggleSelect'), 'Should have toggleSelect from helper');
      assert(res.body.includes('brainstorm'), 'Should have brainstorm API from helper');
    });

    await test('returns Content-Type text/html', async () => {
      const res = await authFetch('/');
      assert(res.headers['content-type'].includes('text/html'), 'Should be text/html');
    });

    await test('serves full HTML documents as-is (not wrapped)', async () => {
      const fullDoc = '<!DOCTYPE html>\n<html><head><title>Custom</title></head><body><h1>Custom Page</h1></body></html>';
      fs.writeFileSync(path.join(TEST_DIR, 'full-doc.html'), fullDoc);
      await sleep(300);

      const res = await authFetch('/');
      assert(res.body.includes('<h1>Custom Page</h1>'), 'Should contain original content');
      assert(res.body.includes('WebSocket'), 'Should still inject helper.js');
      assert(!res.body.includes('indicator-bar'), 'Should NOT wrap in frame template');
    });

    await test('wraps content fragments in frame template', async () => {
      const fragment = '<h2>Pick a layout</h2>\n<div class="options"><div class="option" data-choice="a"><div class="letter">A</div></div></div>';
      fs.writeFileSync(path.join(TEST_DIR, 'fragment.html'), fragment);
      await sleep(300);

      const res = await authFetch('/');
      assert(res.body.includes('indicator-bar'), 'Fragment should get indicator bar');
      assert(!res.body.includes('<!-- CONTENT -->'), 'Placeholder should be replaced');
      assert(res.body.includes('Pick a layout'), 'Fragment content should be present');
      assert(res.body.includes('data-choice="a"'), 'Fragment interactive elements intact');
    });

    await test('serves newest file by mtime', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'older.html'), '<h2>Older</h2>');
      await sleep(100);
      fs.writeFileSync(path.join(TEST_DIR, 'newer.html'), '<h2>Newer</h2>');
      await sleep(300);

      const res = await authFetch('/');
      assert(res.body.includes('Newer'), 'Should serve newest file');
    });

    await test('ignores non-html files for serving', async () => {
      // Write a newer non-HTML file — should still serve newest .html
      fs.writeFileSync(path.join(TEST_DIR, 'data.json'), '{"not": "html"}');
      await sleep(300);

      const res = await authFetch('/');
      assert(res.body.includes('Newer'), 'Should still serve newest HTML');
      assert(!res.body.includes('"not"'), 'Should not serve JSON');
    });

    await test('serves static files after bootstrap auth cookie is set', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'fixture.txt'), 'fixture');
      const res = await authFetch('/files/fixture.txt');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body, 'fixture');
    });

    await test('returns 404 for non-root paths', async () => {
      const res = await authFetch('/other');
      assert.strictEqual(res.status, 404);
    });

    // ========== WebSocket Communication ==========
    console.log('\n--- WebSocket Communication ---');

    await test('rejects unauthenticated WebSocket upgrade', async () => {
      const statusCode = await expectWsHandshakeFailure({ withCookie: false });
      assert.strictEqual(statusCode, 401);
    });

    await test('rejects cross-origin WebSocket upgrade even with auth cookie', async () => {
      const statusCode = await expectWsHandshakeFailure({
        headers: {
          Cookie: await getSessionCookie(),
          Origin: 'https://evil.example'
        }
      });
      assert.strictEqual(statusCode, 403);
    });

    await test('accepts WebSocket upgrade on /', async () => {
      const ws = await connectWs();
      ws.close();
    });

    await test('relays user events to stdout with source field', async () => {
      stdoutAccum = '';
      const ws = await connectWs();

      ws.send(JSON.stringify({ type: 'click', text: 'Test Button' }));
      await sleep(300);

      assert(stdoutAccum.includes('"source":"user-event"'), 'Should tag with source');
      assert(stdoutAccum.includes('Test Button'), 'Should include event data');
      ws.close();
    });

    await test('writes choice events to .events file', async () => {
      // Clean up events from prior tests
      const eventsFile = path.join(TEST_DIR, '.events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      const ws = await connectWs();

      ws.send(JSON.stringify({ type: 'click', choice: 'b', text: 'Option B' }));
      await sleep(300);

      assert(fs.existsSync(eventsFile), '.events should exist');
      const lines = fs.readFileSync(eventsFile, 'utf-8').trim().split('\n');
      const event = JSON.parse(lines[lines.length - 1]);
      assert.strictEqual(event.choice, 'b');
      assert.strictEqual(event.text, 'Option B');
      ws.close();
    });

    await test('does NOT write non-choice events to .events file', async () => {
      const eventsFile = path.join(TEST_DIR, '.events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      const ws = await connectWs();

      ws.send(JSON.stringify({ type: 'hover', text: 'Something' }));
      await sleep(300);

      // Non-choice events should not create .events file
      assert(!fs.existsSync(eventsFile), '.events should not exist for non-choice events');
      ws.close();
    });

    await test('redacts sensitive metadata from logs and persisted events', async () => {
      stdoutAccum = '';
      const eventsFile = path.join(TEST_DIR, '.events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      const ws = await connectWs();
      ws.send(JSON.stringify({
        type: 'choice',
        choice: 'approve',
        token: 'sk-test-123',
        password: 'hunter2',
        nested: { clientSecret: 'shh' }
      }));
      await sleep(300);

      const persisted = fs.readFileSync(eventsFile, 'utf-8');
      assert(!persisted.includes('sk-test-123'), 'Persisted event should redact token');
      assert(!persisted.includes('hunter2'), 'Persisted event should redact password');
      assert(persisted.includes('[REDACTED]'), 'Persisted event should contain redaction marker');
      assert(!stdoutAccum.includes('sk-test-123'), 'Logs should redact token');
      assert(!stdoutAccum.includes('hunter2'), 'Logs should redact password');
      ws.close();
    });

    await test('handles multiple concurrent WebSocket clients', async () => {
      const ws1 = await connectWs();
      const ws2 = await connectWs();

      let ws1Reload = false;
      let ws2Reload = false;
      ws1.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') ws1Reload = true;
      });
      ws2.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') ws2Reload = true;
      });

      fs.writeFileSync(path.join(TEST_DIR, 'multi-client.html'), '<h2>Multi</h2>');
      await sleep(500);

      assert(ws1Reload, 'Client 1 should receive reload');
      assert(ws2Reload, 'Client 2 should receive reload');
      ws1.close();
      ws2.close();
    });

    await test('cleans up closed clients from broadcast list', async () => {
      const ws1 = await connectWs();
      ws1.close();
      await sleep(100);

      // This should not throw even though ws1 is closed
      fs.writeFileSync(path.join(TEST_DIR, 'after-close.html'), '<h2>After</h2>');
      await sleep(300);
      // If we got here without error, the test passes
    });

    await test('handles malformed JSON from client gracefully', async () => {
      const ws = await connectWs();

      // Send invalid JSON — server should not crash
      ws.send('not json at all {{{');
      await sleep(300);

      // Verify server is still responsive
      const res = await authFetch('/');
      assert.strictEqual(res.status, 200, 'Server should still be running');
      ws.close();
    });

    // ========== File Watching ==========
    console.log('\n--- File Watching ---');

    await test('sends reload on new .html file', async () => {
      const ws = await connectWs();

      let gotReload = false;
      ws.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') gotReload = true;
      });

      fs.writeFileSync(path.join(TEST_DIR, 'watch-new.html'), '<h2>New</h2>');
      await sleep(500);

      assert(gotReload, 'Should send reload on new file');
      ws.close();
    });

    await test('sends reload on .html file change', async () => {
      const filePath = path.join(TEST_DIR, 'watch-change.html');
      fs.writeFileSync(filePath, '<h2>Original</h2>');
      await sleep(500);

      const ws = await connectWs();

      let gotReload = false;
      ws.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') gotReload = true;
      });

      fs.writeFileSync(filePath, '<h2>Modified</h2>');
      await sleep(500);

      assert(gotReload, 'Should send reload on file change');
      ws.close();
    });

    await test('does NOT send reload for non-.html files', async () => {
      const ws = await connectWs();

      let gotReload = false;
      ws.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') gotReload = true;
      });

      fs.writeFileSync(path.join(TEST_DIR, 'data.txt'), 'not html');
      await sleep(500);

      assert(!gotReload, 'Should NOT reload for non-HTML files');
      ws.close();
    });

    await test('clears .events on new screen', async () => {
      // Create an .events file
      const eventsFile = path.join(TEST_DIR, '.events');
      fs.writeFileSync(eventsFile, '{"choice":"a"}\n');
      assert(fs.existsSync(eventsFile));

      fs.writeFileSync(path.join(TEST_DIR, 'clear-events.html'), '<h2>New screen</h2>');
      await sleep(500);

      assert(!fs.existsSync(eventsFile), '.events should be cleared on new screen');
    });

    await test('logs screen-added on new file', async () => {
      stdoutAccum = '';
      fs.writeFileSync(path.join(TEST_DIR, 'log-test.html'), '<h2>Log</h2>');
      await sleep(500);

      assert(stdoutAccum.includes('screen-added'), 'Should log screen-added');
    });

    await test('logs screen-updated on file change', async () => {
      const filePath = path.join(TEST_DIR, 'log-update.html');
      fs.writeFileSync(filePath, '<h2>V1</h2>');
      await sleep(500);

      stdoutAccum = '';
      fs.writeFileSync(filePath, '<h2>V2</h2>');
      await sleep(500);

      assert(stdoutAccum.includes('screen-updated'), 'Should log screen-updated');
    });

    // ========== Lifecycle Scripts ==========
    console.log('\n--- Lifecycle Scripts ---');

    await test('stop-server removes canonical brainstorm dirs under /tmp', async () => {
      const stopDir = `/tmp/brainstorm-stop-test-${Date.now()}`;
      fs.mkdirSync(stopDir, { recursive: true });
      fs.writeFileSync(path.join(stopDir, '.server.pid'), '999999');
      fs.writeFileSync(path.join(stopDir, '.server.log'), 'test');

      const result = spawnSync('bash', [STOP_SERVER_PATH, stopDir], { encoding: 'utf-8' });
      assert.strictEqual(result.status, 0);
      assert(!fs.existsSync(stopDir), 'Expected /tmp brainstorm dir to be removed');
    });

    await test('stop-server refuses to delete canonical paths outside /tmp', async () => {
      const outsideDir = path.join(__dirname, `stop-server-poc-${Date.now()}`);
      fs.mkdirSync(outsideDir, { recursive: true });
      fs.writeFileSync(path.join(outsideDir, '.server.pid'), '999999');
      fs.writeFileSync(path.join(outsideDir, '.server.log'), 'test');

      const relativeFromTmp = path.relative('/tmp', outsideDir).split(path.sep).join('/');
      const trickyPath = `/tmp/${relativeFromTmp}`;
      const result = spawnSync('bash', [STOP_SERVER_PATH, trickyPath], { encoding: 'utf-8' });

      assert.strictEqual(result.status, 0);
      assert(fs.existsSync(outsideDir), 'Directory outside /tmp should remain on disk');
      fs.rmSync(outsideDir, { recursive: true, force: true });
    });

    // ========== Helper.js Content ==========
    console.log('\n--- Helper.js Verification ---');

    await test('helper.js defines required APIs', () => {
      const helperContent = fs.readFileSync(
        path.join(__dirname, '../../skills/brainstorming/scripts/helper.js'), 'utf-8'
      );
      assert(helperContent.includes('toggleSelect'), 'Should define toggleSelect');
      assert(helperContent.includes('sendEvent'), 'Should define sendEvent');
      assert(helperContent.includes('selectedChoice'), 'Should track selectedChoice');
      assert(helperContent.includes('brainstorm'), 'Should expose brainstorm API');
      return Promise.resolve();
    });

    // ========== Frame Template ==========
    console.log('\n--- Frame Template Verification ---');

    await test('frame template has required structure', () => {
      const template = fs.readFileSync(
        path.join(__dirname, '../../skills/brainstorming/scripts/frame-template.html'), 'utf-8'
      );
      assert(template.includes('indicator-bar'), 'Should have indicator bar');
      assert(template.includes('indicator-text'), 'Should have indicator text');
      assert(template.includes('<!-- CONTENT -->'), 'Should have content placeholder');
      assert(template.includes('claude-content'), 'Should have content container');
      return Promise.resolve();
    });

    // ========== Summary ==========
    console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
    if (failed > 0) process.exit(1);

  } finally {
    server.kill();
    await sleep(100);
    cleanup();
    sessionCookie = null;
    serverInfo = null;
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
