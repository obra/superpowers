const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const {
  WAITING_PAGE,
  authorizeHttpRequest,
  authorizeWebSocketRequest,
  createRuntimeConfig,
  ensureSessionDir,
  parseClientEvent,
  prepareHtmlResponse,
  writeServerInfo,
} = require('../../skills/brainstorming/scripts/server-core.js');

const STOP_SERVER_PATH = path.join(
  __dirname,
  '../../skills/brainstorming/scripts/stop-server.sh'
);
const HELPER_PATH = path.join(
  __dirname,
  '../../skills/brainstorming/scripts/helper.js'
);
const FRAME_TEMPLATE_PATH = path.join(
  __dirname,
  '../../skills/brainstorming/scripts/frame-template.html'
);

const getMode = (targetPath) => fs.statSync(targetPath).mode & 0o777;

const makeTempDir = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('Test 1: Runtime config exposes tokenized HTTP and WebSocket URLs');
  const config = createRuntimeConfig({
    BRAINSTORM_PORT: '43123',
    BRAINSTORM_HOST: '127.0.0.1',
    BRAINSTORM_URL_HOST: 'localhost',
    BRAINSTORM_DIR: '/tmp/brainstorm-config-test',
    BRAINSTORM_TOKEN: 'secret-token',
  });
  assert.strictEqual(config.port, '43123');
  assert.strictEqual(config.host, '127.0.0.1');
  assert.strictEqual(config.token, 'secret-token');
  assert.strictEqual(config.url, 'http://localhost:43123/?token=secret-token');
  assert.strictEqual(config.wsUrl, 'ws://localhost:43123/?token=secret-token');
  console.log('  PASS');

  console.log('Test 2: HTTP and WebSocket authorization require the session token');
  assert.strictEqual(authorizeHttpRequest({ query: {} }, config), false);
  assert.strictEqual(
    authorizeHttpRequest({ query: { token: 'secret-token' } }, config),
    true
  );
  assert.deepStrictEqual(
    authorizeWebSocketRequest({ url: '/socket?token=wrong' }, config),
    { ok: false, status: 401, message: 'Missing or invalid brainstorm token' }
  );
  assert.deepStrictEqual(
    authorizeWebSocketRequest({ url: '/socket?token=secret-token' }, config),
    { ok: true }
  );
  console.log('  PASS');

  console.log('Test 3: Invalid WebSocket payloads are rejected without persistence');
  assert.deepStrictEqual(parseClientEvent('not json at all'), {
    accepted: false,
    reason: 'invalid-json',
  });
  assert.deepStrictEqual(parseClientEvent(JSON.stringify({ type: 'click' })), {
    accepted: false,
    reason: 'invalid-choice',
  });
  const accepted = parseClientEvent(
    JSON.stringify({
      type: 'click',
      choice: 'layout-a',
      text: 'Layout A',
      id: 'card-a',
      timestamp: 1710000000000,
    })
  );
  assert.strictEqual(accepted.accepted, true);
  assert.deepStrictEqual(accepted.event, {
    type: 'click',
    choice: 'layout-a',
    text: 'Layout A',
    id: 'card-a',
    timestamp: 1710000000000,
  });
  console.log('  PASS');

  console.log('Test 4: Session directories and server info are private by default');
  const securityDir = makeTempDir('brainstorm-security-');
  const privateDir = path.join(securityDir, 'session');
  ensureSessionDir(privateDir);
  assert.strictEqual(getMode(privateDir), 0o700);

  const info = writeServerInfo({ ...config, screenDir: privateDir });
  assert.strictEqual(info.url, config.url);
  assert.strictEqual(getMode(path.join(privateDir, '.server-info')), 0o600);
  console.log('  PASS');

  console.log('Test 5: HTML responses inject the helper config without double-wrapping');
  const fullDoc = '<!DOCTYPE html><html><body><h1>Custom</h1></body></html>';
  const wrappedFull = prepareHtmlResponse(fullDoc, config);
  assert(wrappedFull.includes('<h1>Custom</h1>'));
  assert(wrappedFull.includes(config.wsUrl));
  assert(!wrappedFull.includes('<!-- CONTENT -->'));

  const fragment = '<h2>Pick a layout</h2><div class="options"></div>';
  const wrappedFragment = prepareHtmlResponse(fragment, config);
  assert(wrappedFragment.includes('indicator-bar'));
  assert(wrappedFragment.includes('Pick a layout'));
  assert(wrappedFragment.includes(config.wsUrl));

  const waiting = prepareHtmlResponse(null, config);
  assert(waiting.includes('Waiting for Claude to push a screen'));
  assert(waiting.includes(config.wsUrl));
  console.log('  PASS');

  console.log('Test 6: Helper and frame assets still expose the expected UI hooks');
  const helperContent = fs.readFileSync(HELPER_PATH, 'utf-8');
  assert(helperContent.includes('toggleSelect'));
  assert(helperContent.includes('sendEvent'));
  assert(helperContent.includes('selectedChoice'));
  assert(helperContent.includes('window.__BRAINSTORM_WS_URL__'));

  const templateContent = fs.readFileSync(FRAME_TEMPLATE_PATH, 'utf-8');
  assert(templateContent.includes('indicator-bar'));
  assert(templateContent.includes('indicator-text'));
  console.log('  PASS');

  console.log('Test 7: stop-server refuses to kill unrelated processes from forged pid files');
  const stopDir = makeTempDir('brainstorm-stop-');
  const sleeper = spawn('sleep', ['30'], { stdio: 'ignore' });
  fs.writeFileSync(path.join(stopDir, '.server.pid'), `${sleeper.pid}\n`);

  try {
    const stopResult = spawnSync('bash', [STOP_SERVER_PATH, stopDir], {
      encoding: 'utf-8',
    });

    assert.notStrictEqual(stopResult.status, 0);
    assert(stopResult.stdout.includes('Refusing'));
    process.kill(sleeper.pid, 0);
    assert(fs.existsSync(stopDir));
    console.log('  PASS');
  } finally {
    sleeper.kill('SIGTERM');
    await sleep(100);
    fs.rmSync(stopDir, { recursive: true, force: true });
    fs.rmSync(securityDir, { recursive: true, force: true });
  }

  console.log('\nAll tests passed!');
}

runTests().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
