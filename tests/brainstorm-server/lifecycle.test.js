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

function waitForExit(child, timeoutMs = 2000) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise(resolve => {
    let settled = false;
    const finish = (exited) => {
      if (settled) return;
      settled = true;
      resolve(exited);
    };
    child.once('exit', () => finish(true));
    setTimeout(() => finish(false), timeoutMs);
  });
}

async function killAndWait(child, timeoutMs = 2000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return true;
  const exited = waitForExit(child, timeoutMs);
  child.kill();
  if (await exited) return true;

  child.kill('SIGKILL');
  return waitForExit(child, 500);
}

async function waitForFile(file, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(file)) return true;
    await sleep(50);
  }
  return fs.existsSync(file);
}

function firstServerStarted(out) {
  return JSON.parse(out.trim().split('\n').find(l => l.includes('server-started')));
}

function openCaptureCommand(dir, marker) {
  const scriptPath = path.resolve(dir, 'capture-open.cjs');
  const markerPath = path.resolve(marker);
  fs.writeFileSync(scriptPath,
    "const fs = require('fs');\n" +
    "fs.appendFileSync(process.argv[2], process.argv[3] + '\\n');\n");
  return `node ${JSON.stringify(scriptPath)} ${JSON.stringify(markerPath)}`;
}

function httpStatus(port, key) {
  return new Promise(resolve => {
    const pathWithKey = key ? '/?key=' + encodeURIComponent(key) : '/';
    require('http')
      .get({ hostname: '127.0.0.1', port, path: pathWithKey }, res => {
        res.resume();
        resolve(res.statusCode);
      })
      .on('error', () => resolve(0));
  });
}

function isWindowsLikeShell() {
  return process.platform === 'win32' ||
    /^msys|^cygwin|^mingw/i.test(process.env.OSTYPE || '') ||
    !!process.env.MSYSTEM;
}

async function waitForStartedOutput(child, timeoutMs = 5000) {
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && !stdout.includes('server-started') && child.exitCode === null) {
    await sleep(50);
  }

  if (!stdout.includes('server-started')) {
    throw new Error(`start-server.sh did not report server-started. exit=${child.exitCode} stdout=${stdout} stderr=${stderr}`);
  }
  return stdout;
}

function makeShellTempDir(prefix) {
  return execFileSync('bash', ['-lc', `mktemp -d "\${TMPDIR:-/tmp}/${prefix}-XXXXXX"`], { encoding: 'utf8' }).trim();
}

function removeShellPath(p) {
  execFileSync('bash', ['-lc', 'rm -rf "$1"', 'bash', p], { stdio: 'ignore' });
}

function newestSessionDir(projectDir) {
  const sessionDir = execFileSync('bash', [
    '-lc',
    'find "$1/.superpowers/brainstorm" -mindepth 1 -maxdepth 1 -type d -print | sort | tail -1',
    'bash',
    projectDir
  ], { encoding: 'utf8' }).trim();
  assert(sessionDir, `expected at least one session dir under ${projectDir}/.superpowers/brainstorm`);
  return sessionDir;
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
      await killAndWait(srv);
      fs.rmSync(dir, { recursive: true, force: true });
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
      if (!exited) await killAndWait(srv);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('start-server.sh --idle-timeout-minutes sets the timeout', async () => {
    const dir = makeShellTempDir('bs-life');
    let info = null;
    let startProcess = null;
    let sessionDir = null;
    try {
      if (isWindowsLikeShell()) {
        startProcess = spawn('bash', [START, '--project-dir', dir, '--idle-timeout-minutes', '5']);
        info = firstServerStarted(await waitForStartedOutput(startProcess));
      } else {
        const out = execFileSync('bash', [START, '--project-dir', dir, '--idle-timeout-minutes', '5', '--background'], { encoding: 'utf8' });
        info = firstServerStarted(out);
      }
      sessionDir = newestSessionDir(dir);
      assert.strictEqual(info.idle_timeout_ms, 5 * 60 * 1000, '5 minutes -> 300000 ms');
    } finally {
      if (sessionDir) execFileSync('bash', [STOP, sessionDir], { stdio: 'ignore' });
      if (startProcess && !await waitForExit(startProcess, 3000)) {
        await killAndWait(startProcess);
      }
      removeShellPath(dir);
    }
  });

  await test('server-started URL brackets IPv6 URL hosts', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-ipv6-url-');
    const srv = spawn('node', [SERVER], {
      env: {
        ...process.env,
        BRAINSTORM_PORT: 3421,
        BRAINSTORM_HOST: '127.0.0.1',
        BRAINSTORM_URL_HOST: '::1',
        BRAINSTORM_TOKEN: 'ipv6token',
        BRAINSTORM_DIR: dir,
        BRAINSTORM_LIFECYCLE_CHECK_MS: 100000
      }
    });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    try {
      for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);
      const info = firstServerStarted(out);
      assert.strictEqual(info.url, 'http://[::1]:3421/?key=ipv6token');
    } finally {
      await killAndWait(srv);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('persists the bound port AND key, and restores both on restart', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-port-');
    const portFile = path.join(dir, '.last-port');
    const tokenFile = path.join(dir, '.last-token');
    const env = { ...process.env, BRAINSTORM_PORT_FILE: portFile, BRAINSTORM_TOKEN_FILE: tokenFile, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 };

    const a = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's1') } });
    let outA = ''; a.stdout.on('data', d => outA += d.toString());
    for (let i = 0; i < 60 && !outA.includes('server-started'); i++) await sleep(50);
    const infoA = firstServerStarted(outA);
    const keyA = new URL(infoA.url).searchParams.get('key');
    assert(fs.existsSync(portFile) && fs.existsSync(tokenFile), 'should write the port and token files');
    const exitedA = waitForExit(a);
    a.kill();
    assert(await exitedA, 'first server should exit before restart binds its port');

    const b = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's2') } });
    let outB = ''; b.stdout.on('data', d => outB += d.toString());
    for (let i = 0; i < 60 && !outB.includes('server-started'); i++) await sleep(50);
    const infoB = firstServerStarted(outB);
    const keyB = new URL(infoB.url).searchParams.get('key');
    await killAndWait(b);
    fs.rmSync(dir, { recursive: true, force: true });

    assert.strictEqual(infoB.port, infoA.port, 'restart should reuse the same port');
    // Same key too — otherwise the open tab's cookie would 403 against the restart.
    assert.strictEqual(keyB, keyA, 'restart should reuse the same session key');
  });

  await test('hardens existing persisted token file permissions', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-token-mode-');
    const portFile = path.join(dir, '.last-port');
    const tokenFile = path.join(dir, '.last-token');
    const token = 'efefefefefefefefefefefefefefefef';
    let srv = null;

    try {
      fs.writeFileSync(tokenFile, token, { mode: 0o644 });
      fs.chmodSync(tokenFile, 0o644);
      srv = spawn('node', [SERVER], {
        env: {
          ...process.env,
          BRAINSTORM_DIR: path.join(dir, 's1'),
          BRAINSTORM_PORT_FILE: portFile,
          BRAINSTORM_TOKEN_FILE: tokenFile,
          BRAINSTORM_LIFECYCLE_CHECK_MS: 100000
        }
      });
      let out = ''; srv.stdout.on('data', d => out += d.toString());
      for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);
      assert(out.includes('server-started'), 'server should start with persisted token');

      if (process.platform !== 'win32') {
        const mode = fs.statSync(tokenFile).mode & 0o777;
        assert.strictEqual(mode, 0o600, `.last-token mode should be 0600, got ${mode.toString(8)}`);
      } else {
        assert(fs.existsSync(tokenFile), 'token file should remain present on Windows');
      }
    } finally {
      await killAndWait(srv);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('stored key can authenticate WebSocket after same-port restart', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-reconnect-');
    const portFile = path.join(dir, '.last-port');
    const tokenFile = path.join(dir, '.last-token');
    const env = { ...process.env, BRAINSTORM_PORT_FILE: portFile, BRAINSTORM_TOKEN_FILE: tokenFile, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 };
    let a = null, b = null, ws = null;

    try {
      a = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's1') } });
      let outA = ''; a.stdout.on('data', d => outA += d.toString());
      for (let i = 0; i < 60 && !outA.includes('server-started'); i++) await sleep(50);
      const infoA = firstServerStarted(outA);
      const keyA = new URL(infoA.url).searchParams.get('key');
      const exitedA = waitForExit(a);
      a.kill();
      assert(await exitedA, 'first server should exit before restart binds its port');
      a = null;

      b = spawn('node', [SERVER], { env: { ...env, BRAINSTORM_DIR: path.join(dir, 's2') } });
      let outB = ''; b.stdout.on('data', d => outB += d.toString());
      for (let i = 0; i < 60 && !outB.includes('server-started'); i++) await sleep(50);
      const infoB = firstServerStarted(outB);

      ws = new WebSocket(`ws://localhost:${infoB.port}/?key=${keyA}`, {
        headers: { Origin: `http://localhost:${infoB.port}` }
      });
      const opened = await new Promise(resolve => {
        ws.on('open', () => resolve(true));
        ws.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 1500);
      });

      assert.strictEqual(infoB.port, infoA.port, 'restart should reuse same port');
      assert(opened, 'stored key should authenticate WS after restart');
    } finally {
      try { if (ws) ws.close(); } catch (e) {}
      await killAndWait(a);
      await killAndWait(b);
      fs.rmSync(dir, { recursive: true, force: true });
    }
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

    await killAndWait(a);
    await killAndWait(b);
    fs.rmSync(dir, { recursive: true, force: true });

    assert.notStrictEqual(portB, 3415, 'must not bind the already-taken port');
    assert(portB >= 49152, 'should fall back to a random high port');
    // The fallback must NOT clobber the shared port file — A still owns 3415 and
    // its open tab must keep reconnecting there.
    assert.strictEqual(persisted, '3415', 'fallback must not overwrite .last-port');
  });

  await test('fallback with persisted token generates a fresh unpersisted key', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-port-');
    const portFile = path.join(dir, '.last-port');
    const tokenFile = path.join(dir, '.last-token');
    const preferredToken = 'abababababababababababababababab';
    let a = null, b = null;

    try {
      a = spawn('node', [SERVER], {
        env: {
          ...process.env,
          BRAINSTORM_DIR: path.join(dir, 'a'),
          BRAINSTORM_PORT: 3422,
          BRAINSTORM_TOKEN: preferredToken,
          BRAINSTORM_LIFECYCLE_CHECK_MS: 100000
        }
      });
      let outA = ''; a.stdout.on('data', d => outA += d.toString());
      for (let i = 0; i < 60 && !outA.includes('server-started'); i++) await sleep(50);
      assert(outA.includes('server-started'), 'preferred-port server should start');

      fs.writeFileSync(portFile, '3422');
      fs.writeFileSync(tokenFile, preferredToken, { mode: 0o600 });

      b = spawn('node', [SERVER], {
        env: {
          ...process.env,
          BRAINSTORM_DIR: path.join(dir, 'b'),
          BRAINSTORM_PORT_FILE: portFile,
          BRAINSTORM_TOKEN_FILE: tokenFile,
          BRAINSTORM_LIFECYCLE_CHECK_MS: 100000
        }
      });
      let outB = ''; b.stdout.on('data', d => outB += d.toString());
      for (let i = 0; i < 60 && !outB.includes('server-started'); i++) await sleep(50);
      const infoB = firstServerStarted(outB);
      const fallbackKey = new URL(infoB.url).searchParams.get('key');
      const persistedAfter = fs.readFileSync(tokenFile, 'utf8').trim();
      const originalStatus = await httpStatus(3422, fallbackKey);

      assert.notStrictEqual(infoB.port, 3422, 'fallback should use a different port');
      assert.notStrictEqual(fallbackKey, preferredToken, 'fallback must not reuse persisted key');
      assert.strictEqual(persistedAfter, preferredToken, 'fallback must not overwrite .last-token');
      assert.strictEqual(originalStatus, 403, 'fallback key must not authenticate to original server');
    } finally {
      await killAndWait(a);
      await killAndWait(b);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('fallback with explicit BRAINSTORM_TOKEN fails closed', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-port-');
    const portFile = path.join(dir, '.last-port');
    const explicitToken = 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd';
    let a = null, b = null;

    try {
      a = spawn('node', [SERVER], {
        env: {
          ...process.env,
          BRAINSTORM_DIR: path.join(dir, 'a'),
          BRAINSTORM_PORT: 3423,
          BRAINSTORM_TOKEN: explicitToken,
          BRAINSTORM_LIFECYCLE_CHECK_MS: 100000
        }
      });
      let outA = ''; a.stdout.on('data', d => outA += d.toString());
      for (let i = 0; i < 60 && !outA.includes('server-started'); i++) await sleep(50);
      assert(outA.includes('server-started'), 'preferred-port server should start');

      fs.writeFileSync(portFile, '3423');
      b = spawn('node', [SERVER], {
        env: {
          ...process.env,
          BRAINSTORM_DIR: path.join(dir, 'b'),
          BRAINSTORM_PORT_FILE: portFile,
          BRAINSTORM_TOKEN: explicitToken,
          BRAINSTORM_LIFECYCLE_CHECK_MS: 100000
        }
      });
      let outB = ''; let errB = '';
      b.stdout.on('data', d => outB += d.toString());
      b.stderr.on('data', d => errB += d.toString());
      for (let i = 0; i < 60 && !outB.includes('server-started') && b.exitCode === null; i++) await sleep(50);
      const exited = await waitForExit(b, 1500);

      assert(exited, 'explicit-token fallback process should exit');
      assert.notStrictEqual(b.exitCode, 0, 'explicit-token fallback should fail non-zero');
      assert(!outB.includes('server-started'), 'explicit-token fallback must not start on a random port');
      assert(/BRAINSTORM_TOKEN/.test(errB), `stderr should explain explicit token fallback refusal, got: ${errB}`);
    } finally {
      await killAndWait(a);
      await killAndWait(b);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('auto-opens the browser once, on the first screen', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-open-');
    const marker = path.join(dir, 'opened.log');
    const openCmd = openCaptureCommand(dir, marker); // capture the launch instead of opening a browser
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3417, BRAINSTORM_DIR: dir, BRAINSTORM_OPEN: '1', BRAINSTORM_OPEN_CMD: openCmd, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);

    // First screen, with no browser connected -> should auto-open.
    fs.writeFileSync(path.join(dir, 'content', 'first.html'), '<h2>First</h2>');
    await waitForFile(marker);
    // Second screen -> must NOT open again.
    fs.writeFileSync(path.join(dir, 'content', 'second.html'), '<h2>Second</h2>');
    await sleep(700);

    const lines = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim().split('\n').filter(Boolean) : [];
    // The opened URL must carry the key AND be reachable — a keyless URL hits 403.
    let status = 0;
    if (lines[0]) {
      status = await new Promise(r => require('http').get(lines[0], res => { res.resume(); r(res.statusCode); }).on('error', () => r(0)));
    }
    await killAndWait(srv);
    fs.rmSync(dir, { recursive: true, force: true });

    assert.strictEqual(lines.length, 1, 'should open exactly once');
    assert(lines[0].includes('3417'), `should open the server URL, got: ${lines[0]}`);
    assert(/[?&]key=/.test(lines[0]), `opened URL must carry the session key, got: ${lines[0]}`);
    assert.strictEqual(status, 200, 'the opened URL must be reachable (valid key), not the 403 page');
  });

  await test('does NOT auto-open unless approved (BRAINSTORM_OPEN unset)', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-open-');
    const marker = path.join(dir, 'opened.log');
    const openCmd = openCaptureCommand(dir, marker);
    // BRAINSTORM_OPEN intentionally NOT set — auto-open must stay off.
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3418, BRAINSTORM_DIR: dir, BRAINSTORM_OPEN_CMD: openCmd, BRAINSTORM_LIFECYCLE_CHECK_MS: 100000 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);
    fs.writeFileSync(path.join(dir, 'content', 'first.html'), '<h2>First</h2>');
    await sleep(700);
    await killAndWait(srv);
    const opened = fs.existsSync(marker);
    fs.rmSync(dir, { recursive: true, force: true });
    assert(!opened, 'must not open the browser without explicit approval');
  });

  await test('unauthenticated requests do not defeat the idle timeout', async () => {
    const dir = fs.mkdtempSync('/tmp/bs-life-');
    const srv = spawn('node', [SERVER], { env: { ...process.env, BRAINSTORM_PORT: 3419, BRAINSTORM_DIR: dir, BRAINSTORM_TOKEN: 'authtok', BRAINSTORM_IDLE_TIMEOUT_MS: 400, BRAINSTORM_LIFECYCLE_CHECK_MS: 100 } });
    let out = ''; srv.stdout.on('data', d => out += d.toString());
    let exited = false; srv.on('exit', () => { exited = true; });
    for (let i = 0; i < 60 && !out.includes('server-started'); i++) await sleep(50);

    // Flood with UNAUTHENTICATED (keyless → 403) requests. These must NOT count
    // as activity, so the idle timeout still fires and the process exits.
    const hammer = setInterval(() => { require('http').get('http://localhost:3419/', r => r.resume()).on('error', () => {}); }, 60);
    for (let i = 0; i < 40 && !exited; i++) await sleep(100);
    clearInterval(hammer);
    if (!exited) await killAndWait(srv);
    fs.rmSync(dir, { recursive: true, force: true });

    assert(exited, 'idle shutdown must still fire despite a flood of unauthenticated requests');
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error('Test failed:', err); process.exit(1); });
