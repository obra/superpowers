/**
 * Tests for the brainstorm server's lifecycle (idle timeout + shutdown).
 *
 * - The idle timeout is configurable (default 4h) and reported in server-info.
 * - Idle shutdown must close any open WebSocket so the process actually exits,
 *   not hang on a lingering connection.
 * - start-server.sh exposes the timeout via --idle-timeout-minutes.
 *
 * Uses the `ws` npm package as a test client (test-only dependency).
 */

const { spawn, execFileSync } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SERVER = path.join(__dirname, '../../skills/brainstorming/scripts/server.cjs');
const START = path.join(__dirname, '../../skills/brainstorming/scripts/start-server.sh');
const STOP = path.join(__dirname, '../../skills/brainstorming/scripts/stop-server.sh');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function firstServerStarted(out) {
  return JSON.parse(out.trim().split('\n').find(l => l.includes('server-started')));
}

async function runTests() {
  let passed = 0, failed = 0;
  async function test(name, fn) {
    try { await fn(); console.log(`  PASS: ${name}`); passed++; }
    catch (e) { console.log(`  FAIL: ${name}`); console.log(`    ${e.message}`); failed++; }
  }

  await test('server-info reports the configured idle_timeout_ms', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-life-');
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3401, BRAINSTORM_DIR: dir, BRAINSTORM_IDLE_TIMEOUT_MS: 1234567 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);
    try {
      const info = firstServerStarted(out);
      assert.strictEqual(info.idle_timeout_ms, 1234567, 'idle_timeout_ms should reflect the env override');
    } finally {
      srv.kill(); await sleep(100); fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('idle shutdown closes an open WebSocket and the process exits', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-life-');
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3402, BRAINSTORM_DIR: dir, BRAINSTORM_IDLE_TIMEOUT_MS: 200, BRAINSTORM_LIFECYCLE_CHECK_MS: 100 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    let exited = false, code = null; srv.on('exit', c => { exited = true; code = c; });
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);

    const ws = new WebSocket('ws://localhost:3402');
    await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });

    // 200ms idle, checked every 100ms — should shut down and exit well within 4s,
    // *despite* the open WS, only if shutdown() closes client sockets.
    for (let i = 0; i < 40 && !exited; i++) await sleep(100);

    try {
      assert(exited, 'process must exit after idle shutdown even with an open WebSocket');
      assert.strictEqual(code, 0, 'should exit cleanly (0)');
      assert(fs.existsSync(path.join(dir, 'state', 'server-stopped')), 'should write server-stopped');
    } finally {
      try { ws.close(); } catch (e) {}
      if (!exited) srv.kill();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('start-server.sh --idle-timeout-minutes sets the timeout', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-life-');
    let info;
    const out = execFileSync('bash', [START, '--project-dir', dir, '--idle-timeout-minutes', '5'], { encoding: 'utf8' });
    info = firstServerStarted(out);
    try {
      assert.strictEqual(info.idle_timeout_ms, 5 * 60 * 1000, '5 minutes -> 300000 ms');
    } finally {
      execFileSync('bash', [STOP, path.dirname(info.state_dir)], { stdio: 'ignore' });
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error('Test failed:', err); process.exit(1); });
