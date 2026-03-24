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
const os = require('os');
const path = require('path');
const assert = require('assert');

const SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/server.js');
const TEST_PORT = 30000 + Math.floor(Math.random() * 20000);
const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-test-'));

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
    http.get(url, (res) => {
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
    env: { ...process.env, BRAINSTORM_PORT: TEST_PORT, BRAINSTORM_DIR: TEST_DIR }
  });
}

async function waitForExit(server) {
  return new Promise((resolve, reject) => {
    server.once('exit', (code, signal) => resolve({ code, signal }));
    server.once('error', reject);
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
  let serverExited = false;
  let stdoutAccum = '';
  server.stdout.on('data', (data) => { stdoutAccum += data.toString(); });

  const { stdout: initialStdout } = await waitForServer(server);
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
      return Promise.resolve();
    });

    await test('writes .server-info file', () => {
      const infoPath = path.join(TEST_DIR, '.server-info');
      assert(fs.existsSync(infoPath), '.server-info should exist');
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8').trim());
      assert.strictEqual(info.type, 'server-started');
      assert.strictEqual(info.port, TEST_PORT);
      return Promise.resolve();
    });

    // ========== HTTP Serving ==========
    console.log('\n--- HTTP Serving ---');

    await test('serves waiting page when no screens exist', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('Waiting for a new screen'), 'Should show waiting message');
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
      fs.writeFileSync(path.join(TEST_DIR, 'full-doc.html'), fullDoc);
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('<h1>Custom Page</h1>'), 'Should contain original content');
      assert(res.body.includes('WebSocket'), 'Should still inject helper.js');
      assert(!res.body.includes('indicator-bar'), 'Should NOT wrap in frame template');
    });

    await test('wraps content fragments in frame template', async () => {
      const fragment = '<h2>Pick a layout</h2>\n<div class="options"><div class="option" data-choice="a"><div class="letter">A</div></div></div>';
      fs.writeFileSync(path.join(TEST_DIR, 'fragment.html'), fragment);
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
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

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('Newer'), 'Should serve newest file');
    });

    await test('ignores non-html files for serving', async () => {
      // Write a newer non-HTML file — should still serve newest .html
      fs.writeFileSync(path.join(TEST_DIR, 'data.json'), '{"not": "html"}');
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('Newer'), 'Should still serve newest HTML');
      assert(!res.body.includes('"not"'), 'Should not serve JSON');
    });

    await test('returns 404 for non-root paths', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/other`);
      assert.strictEqual(res.status, 404);
    });

    // ========== WebSocket Communication ==========
    console.log('\n--- WebSocket Communication ---');

    await test('accepts WebSocket upgrade on /', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      });
      ws.close();
    });

    await test('relays user events to stdout with source field', async () => {
      stdoutAccum = '';
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => ws.on('open', resolve));

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

      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
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

    await test('does NOT write non-choice events to .events file', async () => {
      const eventsFile = path.join(TEST_DIR, '.events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => ws.on('open', resolve));

      ws.send(JSON.stringify({ type: 'hover', text: 'Something' }));
      await sleep(300);

      // Non-choice events should not create .events file
      assert(!fs.existsSync(eventsFile), '.events should not exist for non-choice events');
      ws.close();
    });

    await test('handles multiple concurrent WebSocket clients', async () => {
      const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
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

      fs.writeFileSync(path.join(TEST_DIR, 'multi-client.html'), '<h2>Multi</h2>');
      await sleep(500);

      assert(ws1Reload, 'Client 1 should receive reload');
      assert(ws2Reload, 'Client 2 should receive reload');
      ws1.close();
      ws2.close();
    });

    await test('cleans up closed clients from broadcast list', async () => {
      const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await Promise.all([
        new Promise(resolve => ws1.on('open', resolve)),
        new Promise(resolve => ws2.on('open', resolve))
      ]);
      ws1.close();
      await sleep(100);

      let ws2Reload = false;
      ws2.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'reload') ws2Reload = true;
      });

      fs.writeFileSync(path.join(TEST_DIR, 'after-close.html'), '<h2>After</h2>');
      await sleep(500);

      assert(ws2Reload, 'Open clients should still receive reloads after another client closes');
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert.strictEqual(res.status, 200, 'Server should stay responsive after closed-client cleanup');
      ws2.close();
    });

    await test('handles malformed JSON from client gracefully', async () => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
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
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => ws.on('open', resolve));

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

      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
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
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise(resolve => ws.on('open', resolve));

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
      assert(template.includes('brainstorm-content'), 'Should have content container');
      return Promise.resolve();
    });

    await test('cleans up liveness markers on SIGTERM shutdown', async () => {
      const infoPath = path.join(TEST_DIR, '.server-info');
      const stoppedPath = path.join(TEST_DIR, '.server-stopped');
      assert(fs.existsSync(infoPath), '.server-info should exist before shutdown');

      const exitPromise = waitForExit(server);
      server.kill('SIGTERM');
      const exit = await exitPromise;
      serverExited = true;

      assert.strictEqual(exit.signal, null, 'Server should exit cleanly through its shutdown path');
      assert(!fs.existsSync(infoPath), '.server-info should be removed on shutdown');
      assert(fs.existsSync(stoppedPath), '.server-stopped should be written on shutdown');
      const stopped = JSON.parse(fs.readFileSync(stoppedPath, 'utf-8').trim());
      assert.strictEqual(stopped.reason, 'signal SIGTERM');
    });

    // ========== Summary ==========
    console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
    if (failed > 0) process.exit(1);

  } finally {
    if (!serverExited) {
      server.kill();
      await sleep(100);
    }
    cleanup();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
