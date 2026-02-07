const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SERVER_PATH = path.join(__dirname, '../../lib/brainstorm-server/index.js');
const TEST_PORT = 3334;
const TEST_DIR = '/tmp/brainstorm-test';

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
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function startServer() {
  return spawn('node', [SERVER_PATH], {
    env: { ...process.env, BRAINSTORM_PORT: TEST_PORT, BRAINSTORM_DIR: TEST_DIR }
  });
}

async function runTests() {
  cleanup();
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const server = startServer();

  let stdout = '';
  server.stdout.on('data', (data) => { stdout += data.toString(); });
  server.stderr.on('data', (data) => { console.error('Server stderr:', data.toString()); });

  await sleep(1000);

  try {
    // Test 1: Server starts and outputs JSON
    console.log('Test 1: Server startup message');
    assert(stdout.includes('server-started'), 'Should output server-started');
    assert(stdout.includes(TEST_PORT.toString()), 'Should include port');
    console.log('  PASS');

    // Test 2: GET / returns waiting page with helper injected when no screens exist
    console.log('Test 2: Serves waiting page with helper injected');
    const res = await fetch(`http://localhost:${TEST_PORT}/`);
    assert.strictEqual(res.status, 200);
    assert(res.body.includes('Waiting for Claude'), 'Should show waiting message');
    assert(res.body.includes('WebSocket'), 'Should have helper.js injected');
    console.log('  PASS');

    // Test 3: WebSocket connection and event relay
    console.log('Test 3: WebSocket relays events to stdout');
    stdout = '';
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
    await new Promise(resolve => ws.on('open', resolve));

    ws.send(JSON.stringify({ type: 'click', text: 'Test Button' }));
    await sleep(300);

    assert(stdout.includes('"source":"user-event"'), 'Should relay user events with source field');
    assert(stdout.includes('Test Button'), 'Should include event data');
    ws.close();
    console.log('  PASS');

    // Test 4: File change triggers reload notification
    console.log('Test 4: File change notifies browsers');
    const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
    await new Promise(resolve => ws2.on('open', resolve));

    let gotReload = false;
    ws2.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'reload') gotReload = true;
    });

    fs.writeFileSync(path.join(TEST_DIR, 'test-screen.html'), '<html><body>Full doc</body></html>');
    await sleep(500);

    assert(gotReload, 'Should send reload message on file change');
    ws2.close();
    console.log('  PASS');

    // Test 5: Full HTML document served as-is (not wrapped)
    console.log('Test 5: Full HTML document served without frame wrapping');
    const fullDoc = '<!DOCTYPE html>\n<html><head><title>Custom</title></head><body><h1>Custom Page</h1></body></html>';
    fs.writeFileSync(path.join(TEST_DIR, 'full-doc.html'), fullDoc);
    await sleep(300);

    const fullRes = await fetch(`http://localhost:${TEST_PORT}/`);
    assert(fullRes.body.includes('<h1>Custom Page</h1>'), 'Should contain original content');
    assert(fullRes.body.includes('WebSocket'), 'Should still inject helper.js');
    // Should NOT have the frame template's feedback footer
    assert(!fullRes.body.includes('feedback-footer') || fullDoc.includes('feedback-footer'),
      'Should not wrap full documents in frame template');
    console.log('  PASS');

    // Test 6: Bare HTML fragment gets wrapped in frame template
    console.log('Test 6: Content fragment wrapped in frame template');
    const fragment = '<h2>Pick a layout</h2>\n<p class="subtitle">Choose one</p>\n<div class="options"><div class="option" data-choice="a"><div class="letter">A</div><div class="content"><h3>Simple</h3></div></div></div>';
    fs.writeFileSync(path.join(TEST_DIR, 'fragment.html'), fragment);
    await sleep(300);

    const fragRes = await fetch(`http://localhost:${TEST_PORT}/`);
    // Should have the frame template structure
    assert(fragRes.body.includes('feedback-footer'), 'Fragment should get feedback footer from frame');
    assert(fragRes.body.includes('Brainstorm Companion'), 'Fragment should get header from frame');
    assert(fragRes.body.includes('--bg-primary'), 'Fragment should get theme CSS from frame');
    // Should have the original content inside
    assert(fragRes.body.includes('Pick a layout'), 'Fragment content should be present');
    assert(fragRes.body.includes('data-choice="a"'), 'Fragment content should be intact');
    // Should have helper.js injected
    assert(fragRes.body.includes('WebSocket'), 'Fragment should have helper.js injected');
    console.log('  PASS');

    // Test 7: Helper.js includes toggleSelect and send functions
    console.log('Test 7: Helper.js provides toggleSelect and send');
    const helperContent = fs.readFileSync(
      path.join(__dirname, '../../lib/brainstorm-server/helper.js'), 'utf-8'
    );
    assert(helperContent.includes('toggleSelect'), 'helper.js should define toggleSelect');
    assert(helperContent.includes('send'), 'helper.js should define send function');
    assert(helperContent.includes('selectedChoice'), 'helper.js should track selectedChoice');
    console.log('  PASS');

    // Test 8: sendToClaude confirmation uses CSS variables (dark mode support)
    console.log('Test 8: sendToClaude confirmation respects theming');
    assert(!helperContent.includes('color: #666'), 'Should not use hardcoded light-mode colors');
    assert(!helperContent.includes('color: #333'), 'Should not use hardcoded light-mode colors');
    console.log('  PASS');

    console.log('\nAll tests passed!');

  } finally {
    server.kill();
    cleanup();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
