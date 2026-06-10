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
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3402, BRAINSTORM_DIR: dir, BRAINSTORM_TOKEN: 'lifetoken', BRAINSTORM_IDLE_TIMEOUT_MS: 200, BRAINSTORM_LIFECYCLE_CHECK_MS: 100 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    let exited = false, code = null; srv.on('exit', c => { exited = true; code = c; });
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);

    const ws = new WebSocket('ws://localhost:3402/?key=lifetoken');
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

  await test('persists the bound port and restores it on restart', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-port-');
    const portFile = path.join(dir, '.last-port');
    const env = { ...process.env, BRAINSTORM_PORT_FILE: portFile, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 };

    const a = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's1') } });
    let outA = ''; a.stdout.on('data', d => outA += d.toString());
    for (let i = 0; i < 60 && !outA.includes('server-started'); i++) await sleep(50);
    const portA = firstServerStarted(outA).port;
    assert(fs.existsSync(portFile), 'should write the port file');
    assert.strictEqual(Number(fs.readFileSync(portFile, 'utf8').trim()), portA, 'port file holds the bound port');
    a.kill(); await sleep(400); // free the port

    const b = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's2') } });
    let outB = ''; b.stdout.on('data', d => outB += d.toString());
    for (let i = 0; i < 60 && !outB.includes('server-started'); i++) await sleep(50);
    const portB = firstServerStarted(outB).port;
    b.kill(); await sleep(100); fs.rmSync(dir, { recursive: true, force: true });

    assert.strictEqual(portB, portA, 'restart should reuse the same port');
  });

  await test('falls back to a random port when the preferred port is taken', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-port-');
    const portFile = path.join(dir, '.last-port');

    const a = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_DIR: path.join(dir, 'a'), BRAINSTORM_PORT: 3415, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 } });
    let outA = ''; a.stdout.on('data', d => outA += d.toString());
    for (let i = 0; i < 60 && !outA.includes('server-started'); i++) await sleep(50);

    fs.writeFileSync(portFile, '3415'); // preferred port, but it's taken by A
    const b = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_DIR: path.join(dir, 'b'), BRAINSTORM_PORT_FILE: portFile, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 } });
    let outB = ''; b.stdout.on('data', d => outB += d.toString());
    for (let i = 0; i < 60 && !outB.includes('server-started'); i++) await sleep(50);
    const portB = firstServerStarted(outB).port;
    const persisted = fs.readFileSync(portFile, 'utf8').trim();

    a.kill(); b.kill(); await sleep(100); fs.rmSync(dir, { recursive: true, force: true });

    assert.notStrictEqual(portB, 3415, 'must not bind the already-taken port');
    assert(portB >= 49152, 'should fall back to a random high port');
    // The fallback must NOT clobber the shared port file — A still owns 3415 and
    // its open tab must keep reconnecting there.
    assert.strictEqual(persisted, '3415', 'fallback must not overwrite .last-port');
  });

  await test('auto-opens the browser once, on the first screen', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-open-');
    const marker = path.join(dir, 'opened.log');
    const openCmd = `sh -c 'echo "$0" >> ${marker}'`; // capture the launch instead of opening a browser
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3417, BRAINSTORM_DIR: dir, BRAINSTORM_OPEN: '1', BRAINSTORM_OPEN_CMD: openCmd, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);

    // First screen, with no browser connected -> should auto-open.
    fs.writeFileSync(path.join(dir, 'content', 'first.html'), '<h2>First</h2>');
    await sleep(700);
    // Second screen -> must NOT open again.
    fs.writeFileSync(path.join(dir, 'content', 'second.html'), '<h2>Second</h2>');
    await sleep(700);

    srv.kill(); await sleep(100);
    const lines = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim().split('\n').filter(Boolean) : [];
    fs.rmSync(dir, { recursive: true, force: true });

    assert.strictEqual(lines.length, 1, 'should open exactly once');
    assert(lines[0].includes('3417'), `should open the server URL, got: ${lines[0]}`);
  });

  await test('does NOT auto-open unless approved (BRAINSTORM_OPEN unset)', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-open-');
    const marker = path.join(dir, 'opened.log');
    const openCmd = `sh -c 'echo "$0" >> ${marker}'`;
    // BRAINSTORM_OPEN intentionally NOT set — auto-open must stay off.
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3418, BRAINSTORM_DIR: dir, BRAINSTORM_OPEN_CMD: openCmd, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);
    fs.writeFileSync(path.join(dir, 'content', 'first.html'), '<h2>First</h2>');
    await sleep(700);
    srv.kill(); await sleep(100);
    const opened = fs.existsSync(marker);
    fs.rmSync(dir, { recursive: true, force: true });
    assert(!opened, 'must not open the browser without explicit approval');
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error('Test failed:', err); process.exit(1); });
