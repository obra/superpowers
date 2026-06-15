/**
 * Integration tests for the brainstorm server.
 *
 * Tests the full server behavior: HTTP serving, WebSocket communication,
 * file watching, and the brainstorming workflow.
 *
 * Uses the `ws` npm package as a test client (test-only dependency,
 * not shipped to end users).
 */

const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/server.cjs');
const TEST_PORT = 3334;
const TEST_DIR = '/tmp/brainstorm-test';
const CONTENT_DIR = path.join(TEST_DIR, 'content');
const STATE_DIR = path.join(TEST_DIR, 'state');
// Fixed session key so the test client can authenticate (see auth.test.js for
// the security behavior itself; here we just need authorized requests).
const TOKEN = 'testtoken-server-0123456789abcdef';

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetch(url) {
  return new Promise((resolve, reject) => {
    const headers = { Cookie: `brainstorm-key-${TEST_PORT}=${TOKEN}` };
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data
      }));
    }).on('error', reject);
  });
}

function startServer() {
  return spawn('node', [SERVER_PATH], {
    env: { ...process.env, BRAINSTORM_PORT: TEST_PORT, BRAINSTORM_DIR: TEST_DIR, BRAINSTORM_TOKEN: TOKEN }
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

class SkipTest extends Error {
  constructor(message) {
    super(message);
    this.skip = true;
  }
}

function skip(message) {
  throw new SkipTest(message);
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
    `server.test.js expected fixed port ${TEST_PORT}, got ${msg.port}; fixed-port tests must not run through fallback`
  );
  return msg;
}

function ensureSymlinkWorks(target, link) {
  try {
    fs.symlinkSync(target, link);
    fs.unlinkSync(link);
  } catch (e) {
    try { fs.unlinkSync(link); } catch (ignore) {}
    skip(`symlink creation unavailable on this host: ${e.message}`);
  }
}

async function runTests() {
  cleanup();

  const server = startServer();
  let stdoutAccum = '';
  server.stdout.on('data', (data) => { stdoutAccum += data.toString(); });

  let initialStdout = '';
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  function test(name, fn) {
    return fn().then(() => {
      console.log(`  PASS: ${name}`);
      passed++;
    }).catch(e => {
      if (e.skip) {
        console.log(`  SKIP: ${name}`);
        console.log(`    ${e.message}`);
        skipped++;
        return;
      }
      console.log(`  FAIL: ${name}`);
      console.log(`    ${e.message}`);
      failed++;
    });
  }

  try {
    const { stdout } = await waitForServer(server);
    initialStdout = stdout;
    assertStartedOnExpectedPort(initialStdout);

    // ========== Server Startup ==========
    console.log('\n--- Server Startup ---');

    await test('outputs server-started JSON on startup', () => {
      const msg = serverStartedMessage(initialStdout);
      assert.strictEqual(msg.type, 'server-started');
      assert.strictEqual(msg.port, TEST_PORT);
      assert(msg.url, 'Should include URL');
      assert(msg.screen_dir, 'Should include screen_dir');
      return Promise.resolve();
    });

    await test('writes server-info to state/', () => {
      const infoPath = path.join(STATE_DIR, 'server-info');
      assert(fs.existsSync(infoPath), 'state/server-info should exist');
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8').trim());
      assert.strictEqual(info.type, 'server-started');
      assert.strictEqual(info.port, TEST_PORT);
      assert.strictEqual(info.screen_dir, CONTENT_DIR, 'screen_dir should point to content/');
      assert.strictEqual(info.state_dir, STATE_DIR, 'state_dir should point to state/');
      return Promise.resolve();
    });

    // ========== HTTP Serving ==========
    console.log('\n--- HTTP Serving ---');

    await test('serves waiting page when no screens exist', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('Waiting for the agent'), 'Should show waiting message');
    });

    await test('injects helper.js into waiting page', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('WebSocket'), 'Should have helper.js injected');
      assert(res.body.includes('toggleSelect'), 'Should have toggleSelect from helper');
      assert(res.body.includes('brainstorm'), 'Should have brainstorm API from helper');
    });

    await test('returns Content-Type text/html', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.headers['content-type'].includes('text/html'), 'Should be text/html');
    });

    await test('serves full HTML documents as-is (not wrapped)', async () => {
      const fullDoc = '<!DOCTYPE html>\n<html><head><title>Custom</title></head><body><h1>Custom Page</h1></body></html>';
      fs.writeFileSync(path.join(CONTENT_DIR, 'full-doc.html'), fullDoc);
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('<h1>Custom Page</h1>'), 'Should contain original content');
      assert(res.body.includes('WebSocket'), 'Should still inject helper.js');
      assert(!res.body.includes('<div class="header">'), 'Should NOT wrap in frame template');
    });

    await test('wraps content fragments in frame template', async () => {
      const fragment = '<h2>Pick a layout</h2>\n<div class="options"><div class="option" data-choice="a"><div class="letter">A</div></div></div>';
      fs.writeFileSync(path.join(CONTENT_DIR, 'fragment.html'), fragment);
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('<div class="header">'), 'Fragment should get header chrome');
      assert(!res.body.includes('<!-- CONTENT -->'), 'Placeholder should be replaced');
      assert(res.body.includes('Pick a layout'), 'Fragment content should be present');
      assert(res.body.includes('data-choice="a"'), 'Fragment interactive elements intact');
    });

    await test('serves newest file by mtime', async () => {
      fs.writeFileSync(path.join(CONTENT_DIR, 'older.html'), '<h2>Older</h2>');
      await sleep(100);
      fs.writeFileSync(path.join(CONTENT_DIR, 'newer.html'), '<h2>Newer</h2>');
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('Newer'), 'Should serve newest file');
    });

    await test('ignores non-html files for serving', async () => {
      // Write a newer non-HTML file — should still serve newest .html
      fs.writeFileSync(path.join(CONTENT_DIR, 'data.json'), '{"not": "html"}');
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('Newer'), 'Should still serve newest HTML');
      assert(!res.body.includes('"not"'), 'Should not serve JSON');
    });

    await test('ignores macOS resource-fork dotfiles (._*.html) when serving', async () => {
      // On macOS/ExFAT/SMB, the OS writes ._name.html sidecar files holding
      // binary metadata. They end with .html but must never be served as a screen.
      fs.writeFileSync(path.join(CONTENT_DIR, 'real-screen.html'), '<h2>Real Screen Content</h2>');
      await sleep(100);
      fs.writeFileSync(path.join(CONTENT_DIR, '._real-screen.html'), 'Mac OS X resource fork garbage');
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('Real Screen Content'), 'should serve the real screen, not the newer ._ sidecar');
      assert(!res.body.includes('resource fork garbage'), 'must not serve ._*.html dotfile content');
    });

    await test('does not serve dotfiles via /files/', async () => {
      fs.writeFileSync(path.join(CONTENT_DIR, '._secret.html'), 'dotfile body should not be served');
      const res = await fetch(`http://localhost:${TEST_PORT}/files/._secret.html`);
      assert.strictEqual(res.status, 404, '/files/ must 404 on dotfiles');
    });

    await test('GET /files/ (empty name) returns 404 and does not crash the server', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/files/`);
      assert.strictEqual(res.status, 404, '/files/ (the content dir) must 404, not EISDIR-crash');
      // The server must still be alive afterward.
      const alive = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(alive.status, 200, 'server must survive a /files/ request');
    });

    await test('does not serve symlinks that escape content dir via /files/', async () => {
      const target = path.join(STATE_DIR, 'server-info');
      const link = path.join(CONTENT_DIR, 'linked-server-info.txt');
      try { fs.unlinkSync(link); } catch (e) {}
      ensureSymlinkWorks(target, link);
      fs.symlinkSync(target, link);

      const res = await fetch(`http://localhost:${TEST_PORT}/files/linked-server-info.txt`);
      assert.strictEqual(res.status, 404, 'symlink to state/server-info must not be served');
      assert(!res.body.includes('server-started'), 'response must not include server-info body');
    });

    await test('does not serve hard links to files outside content dir via /files/', async () => {
      const target = path.join(STATE_DIR, 'server-info');
      const link = path.join(CONTENT_DIR, 'hard-linked-server-info.txt');
      try { fs.unlinkSync(link); } catch (e) {}
      fs.linkSync(target, link);

      const res = await fetch(`http://localhost:${TEST_PORT}/files/hard-linked-server-info.txt`);
      assert.strictEqual(res.status, 404, 'hard link to state/server-info must not be served');
      assert(!res.body.includes('server-started'), 'response must not include server-info body');
    });

    await test('does not serve symlinks that escape content dir via root screen selection', async () => {
      const target = path.join(STATE_DIR, 'server-info');
      const link = path.join(CONTENT_DIR, 'root-linked-server-info.html');
      try { fs.unlinkSync(link); } catch (e) {}
      ensureSymlinkWorks(target, link);
      fs.symlinkSync(target, link);
      const future = new Date(Date.now() + 2000);
      fs.utimesSync(target, future, future);
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(res.status, 200);
      assert(!res.body.includes('"type":"server-started"'), 'root screen must not serve state/server-info through a symlink');
      assert(!res.body.includes('"state_dir"'), 'root screen must not include server-info body');
    });

    await test('does not serve hard links that escape content dir via root screen selection', async () => {
      const target = path.join(STATE_DIR, 'server-info');
      const link = path.join(CONTENT_DIR, 'root-hard-linked-server-info.html');
      try { fs.unlinkSync(link); } catch (e) {}
      try {
        fs.linkSync(target, link);
      } catch (e) {
        skip(`hardlink creation unavailable on this host: ${e.message}`);
      }
      const linkStat = fs.lstatSync(link);
      if (linkStat.nlink <= 1) {
        skip(`hardlink nlink did not expose multiple links: ${linkStat.nlink}`);
      }
      const future = new Date(Date.now() + 3000);
      fs.utimesSync(target, future, future);
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(res.status, 200);
      assert(!res.body.includes('"type":"server-started"'), 'root screen must not serve state/server-info through a hardlink');
      assert(!res.body.includes('"state_dir"'), 'root screen must not include server-info body');
    });

    await test('returns 404 for non-root paths', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/other`);
      assert.strictEqual(res.status, 404);
    });

    // ========== WebSocket Communication ==========
    console.log('\n--- WebSocket Communication ---');

    await test('accepts WebSocket upgrade on /', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });
      ws.close();
    });

    await test('relays user events to stdout with source field', async () => {
      stdoutAccum = '';
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

      ws.send(JSON.stringify({ type: 'click', text: 'Test Button' }));
      await sleep(300);

      assert(stdoutAccum.includes('"source":"user-event"'), 'Should tag with source');
      assert(stdoutAccum.includes('Test Button'), 'Should include event data');
      ws.close();
    });

    await test('writes choice events to state/events', async () => {
      // Clean up events from prior tests
      const eventsFile = path.join(STATE_DIR, 'events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

      ws.send(JSON.stringify({ type: 'click', choice: 'b', text: 'Option B' }));
      await sleep(300);

      assert(fs.existsSync(eventsFile), '.events should exist');
      const lines = fs.readFileSync(eventsFile, 'utf-8').trim().split('\n');
      const event = JSON.parse(lines[lines.length - 1]);
      assert.strictEqual(event.choice, 'b');
      assert.strictEqual(event.text, 'Option B');
      ws.close();
    });

    await test('does NOT write non-choice events to state/events', async () => {
      const eventsFile = path.join(STATE_DIR, 'events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

      ws.send(JSON.stringify({ type: 'hover', text: 'Something' }));
      await sleep(300);

      // Non-choice events should not create .events file
      assert(!fs.existsSync(eventsFile), '.events should not exist for non-choice events');
      ws.close();
    });

    await test('handles multiple concurrent WebSocket clients', async () => {
      const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await Promise.all([
        new Promise(resolve => ws1.on('open', resolve)),
        new Promise(resolve => ws2.on('open', resolve))
      ]);

      let ws1Reload = false;
      let ws2Reload = false;
      ws1.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') ws1Reload = true;
      });
      ws2.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') ws2Reload = true;
      });

      fs.writeFileSync(path.join(CONTENT_DIR, 'multi-client.html'), '<h2>Multi</h2>');
      await sleep(500);

      assert(ws1Reload, 'Client 1 should receive reload');
      assert(ws2Reload, 'Client 2 should receive reload');
      ws1.close();
      ws2.close();
    });

    await test('cleans up closed clients from broadcast list', async () => {
      const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws1.on('open', resolve));
      ws1.close();
      await sleep(100);

      // This should not throw even though ws1 is closed
      fs.writeFileSync(path.join(CONTENT_DIR, 'after-close.html'), '<h2>After</h2>');
      await sleep(300);
      // If we got here without error, the test passes
    });

    await test('handles malformed JSON from client gracefully', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

      // Send invalid JSON — server should not crash
      ws.send('not json at all {{{');
      await sleep(300);

      // Verify server is still responsive
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(res.status, 200, 'Server should still be running');
      ws.close();
    });

    // ========== File Watching ==========
    console.log('\n--- File Watching ---');

    await test('sends reload on new .html file', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

      let gotReload = false;
      ws.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') gotReload = true;
      });

      fs.writeFileSync(path.join(CONTENT_DIR, 'watch-new.html'), '<h2>New</h2>');
      await sleep(500);

      assert(gotReload, 'Should send reload on new file');
      ws.close();
    });

    await test('sends reload on .html file change', async () => {
      const filePath = path.join(CONTENT_DIR, 'watch-change.html');
      fs.writeFileSync(filePath, '<h2>Original</h2>');
      await sleep(500);

      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

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
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

      let gotReload = false;
      ws.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') gotReload = true;
      });

      fs.writeFileSync(path.join(CONTENT_DIR, 'data.txt'), 'not html');
      await sleep(500);

      assert(!gotReload, 'Should NOT reload for non-HTML files');
      ws.close();
    });

    await test('does NOT send reload for ._*.html resource-fork dotfiles', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/?key=${TOKEN}`);
      await new Promise(resolve => ws.on('open', resolve));

      let gotReload = false;
      ws.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') gotReload = true;
      });

      fs.writeFileSync(path.join(CONTENT_DIR, '._sidecar.html'), 'resource fork');
      await sleep(500);

      assert(!gotReload, 'a ._ dotfile appearing must not trigger a reload');
      ws.close();
    });

    await test('clears state/events on new screen', async () => {
      // Create an events file
      const eventsFile = path.join(STATE_DIR, 'events');
      fs.writeFileSync(eventsFile, '{"choice":"a"}\n');
      assert(fs.existsSync(eventsFile));

      fs.writeFileSync(path.join(CONTENT_DIR, 'clear-events.html'), '<h2>New screen</h2>');
      await sleep(500);

      assert(!fs.existsSync(eventsFile), 'state/events should be cleared on new screen');
    });

    await test('logs screen-added on new file', async () => {
      stdoutAccum = '';
      fs.writeFileSync(path.join(CONTENT_DIR, 'log-test.html'), '<h2>Log</h2>');
      await sleep(500);

      assert(stdoutAccum.includes('screen-added'), 'Should log screen-added');
    });

    await test('logs screen-updated on file change', async () => {
      const filePath = path.join(CONTENT_DIR, 'log-update.html');
      fs.writeFileSync(filePath, '<h2>V1</h2>');
      await sleep(500);

      stdoutAccum = '';
      fs.writeFileSync(filePath, '<h2>V2</h2>');
      await sleep(500);

      assert(stdoutAccum.includes('screen-updated'), 'Should log screen-updated');
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
      assert(template.includes('<div class="header">'), 'Should have top header markup');
      assert(!template.includes('indicator-bar'), 'Should not have footer chrome');
      assert(!template.includes('indicator-text'), 'Header should not render selection indicator text');
      assert(template.includes('<!-- BRANDING -->'), 'Should have branding placeholder');
      assert(template.includes('<div class="status">Connecting…</div>'), 'Header should include connection status');
      assert(template.includes('grid-template-columns: minmax(0, 1fr) auto;'), 'Header should let brand text shrink before the status column');
      assert(template.includes('padding: 0.5rem 1.5rem;'), 'Header should keep equal left and right edge padding');
      assert(template.includes('.header .brand { justify-self: start; width: 100%; font-size: 0.75rem; line-height: 1; }'), 'Header brand should align left, fill its grid track, and match header text size');
      assert(template.includes('.header .status { grid-column: 2; line-height: 1; }'), 'Header status should sit in the right column');
      assert(!template.includes('<div></div>'), 'Header should not use an empty spacer before branding');
      assert(template.includes('<!-- CONTENT -->'), 'Should have content placeholder');
      assert(template.includes('frame-content'), 'Should have content container');
      return Promise.resolve();
    });

    // ========== Summary ==========
    console.log(`\n--- Results: ${passed} passed, ${failed} failed, ${skipped} skipped ---`);
    if (failed > 0) process.exit(1);

  } finally {
    server.kill();
    await sleep(100);
    cleanup();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
