# Visual Companion Final Hardening Fixup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish PR #1720's final hardening fixup with test-first changes, clean rebase state, and reviewer-ready evidence.

**Spec:** `docs/superpowers/specs/2026-06-11-visual-companion-final-hardening-fixup-design.md`

**Architecture:** Keep the companion zero-dependency and local-first. Add focused guards to the existing server and shell scripts: root screen selection reuses the `/files/*` containment guard, fallback token handling tracks token source, and lifecycle shutdown uses a per-start command-line instance id for ownership proof.

**Tech Stack:** Node.js built-ins (`http`, `fs`, `path`, `crypto`), existing `ws` test dependency, Bash scripts, Git Bash on Windows, `gh` CLI for PR metadata.

**Commit discipline:** Each task includes a suggested commit. When using subagent-driven execution, the orchestrator reviews the worker diff, runs the task verification, and performs the commit.

---

## File Map

- Modify: `skills/brainstorming/scripts/server.cjs`
  - Filter root screen candidates through `isRegularFileInsideContentDir()`.
  - Track token source and rotate or fail closed on fallback.
- Modify: `skills/brainstorming/scripts/start-server.sh`
  - Generate `state/server-instance-id`.
  - Pass `--brainstorm-server-id=<id>` after `server.cjs`.
- Modify: `skills/brainstorming/scripts/stop-server.sh`
  - Require exact instance-id argv proof before signalling a PID.
  - Remove stale `server.pid` and `server-instance-id` on stale/stopped outcomes.
- Modify: `tests/brainstorm-server/server.test.js`
  - Add fixed-port startup guard.
  - Add skip-aware test harness for symlink capability.
  - Add root symlink and hardlink escape regressions.
- Modify: `tests/brainstorm-server/auth.test.js`
  - Add fixed-port startup guard.
- Modify: `tests/brainstorm-server/lifecycle.test.js`
  - Add fallback token rotation, explicit-token fail-closed, and fallback-key rejection regressions.
- Modify: `tests/brainstorm-server/stop-server.test.sh`
  - Add top-level cleanup trap.
  - Add positive and negative server-instance-id ownership tests.
- Modify: `tests/brainstorm-server/start-server.test.sh`
  - Assert Windows-like fake-node path receives exact server id argv and writes a valid id file.
- Modify: `tests/brainstorm-server/windows-lifecycle.test.sh`
  - Pass server id argv for direct Node stop-server coverage.
  - Add Windows fake-node assertion for the id argv.
- Modify: `skills/brainstorming/visual-companion.md`
  - Add `--open` to platform commands that should preserve auto-open behavior.
- Modify: `docs/superpowers/plans/2026-06-09-visual-companion-issues.md`
  - Reconcile shipped scope, WS Origin wording, default timeout, and deferred feature items.
- Update outside tracked files: PR #1720 body
  - Record post-rebase diff state, RED/GREEN evidence, macOS/Windows verification, manual browser smoke, and external eval evidence.

## Task 0: Rebase And Baseline State

**Files:**
- No source edits
- Verification target: git branch state

- [ ] **Step 1: Fetch current dev**

Run:

```bash
git fetch origin dev
```

Expected: command exits 0.

- [ ] **Step 2: Rebase onto current dev**

Run:

```bash
git rebase origin/dev
```

Expected: command exits 0, or stops only on conflicts that must be resolved by taking `origin/dev` for `evals`.

- [ ] **Step 3: Resolve an evals conflict by taking dev**

If the rebase stops on `evals`, run:

```bash
git restore --source=origin/dev --staged --worktree evals
git add evals
git rebase --continue
```

Expected: rebase continues. After the rebase, `git diff --name-only origin/dev...HEAD -- evals` prints nothing.

- [ ] **Step 4: Record baseline status**

Run:

```bash
git status --short --branch
git diff --name-only origin/dev...HEAD -- evals
```

Expected: status shows the branch on top of `origin/dev`; second command prints no paths.

## Task 1: Root Screen Containment

**Files:**
- Modify: `tests/brainstorm-server/server.test.js`
- Modify: `skills/brainstorming/scripts/server.cjs`

- [ ] **Step 1: Add fixed-port guard and skip-aware test helper**

In `tests/brainstorm-server/server.test.js`, add this helper after `waitForServer()`:

```js
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
```

Then change the startup section from:

```js
  const { stdout: initialStdout } = await waitForServer(server);
  let passed = 0;
  let failed = 0;
```

to:

```js
  const { stdout: initialStdout } = await waitForServer(server);
  assertStartedOnExpectedPort(initialStdout);
  let passed = 0;
  let failed = 0;
  let skipped = 0;
```

Change the `test()` helper catch block to handle skips:

```js
    }).catch(e => {
      if (e && e.skip) {
        console.log(`  SKIP: ${name}`);
        console.log(`    ${e.message}`);
        skipped++;
        return;
      }
      console.log(`  FAIL: ${name}`);
      console.log(`    ${e.message}`);
      failed++;
    });
```

Change the summary line to:

```js
    console.log(`\n--- Results: ${passed} passed, ${failed} failed, ${skipped} skipped ---`);
```

- [ ] **Step 2: Make the existing `/files/*` symlink test skip-capable**

Replace the setup inside `does not serve symlinks that escape content dir via /files/` with:

```js
      const target = path.join(STATE_DIR, 'server-info');
      const link = path.join(CONTENT_DIR, 'linked-server-info.txt');
      try { fs.unlinkSync(link); } catch (e) {}
      ensureSymlinkWorks(target, link);
      fs.symlinkSync(target, link);
```

Expected behavior: hosts that cannot create usable symlinks skip only this assertion.

- [ ] **Step 3: Add RED tests for root symlink and hardlink escapes**

Add these tests after the existing `/files/*` hardlink test:

```js
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
```

- [ ] **Step 4: Verify RED**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers/tests/brainstorm-server
node server.test.js
```

Expected: at least one new root containment test fails before the production fix because root screen selection can read `state/server-info`.

- [ ] **Step 5: Implement root containment**

In `skills/brainstorming/scripts/server.cjs`, replace `getNewestScreen()` with:

```js
function getNewestScreen() {
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => !f.startsWith('.') && f.endsWith('.html'))
    .map(f => {
      const fp = path.join(CONTENT_DIR, f);
      if (!isRegularFileInsideContentDir(fp)) return null;
      return { path: fp, mtime: fs.statSync(fp).mtime.getTime() };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0].path : null;
}
```

- [ ] **Step 6: Verify GREEN**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers/tests/brainstorm-server
node server.test.js
```

Expected: root symlink and supported hardlink tests pass or skip only for unsupported host capabilities. Existing `/files/*` containment tests remain green.

- [ ] **Step 7: Commit**

Run:

```bash
git add tests/brainstorm-server/server.test.js skills/brainstorming/scripts/server.cjs
git commit -m "Harden root screen containment"
```

## Task 2: Fallback Token Isolation

**Files:**
- Modify: `tests/brainstorm-server/lifecycle.test.js`
- Modify: `skills/brainstorming/scripts/server.cjs`

- [ ] **Step 1: Add HTTP status helper**

In `tests/brainstorm-server/lifecycle.test.js`, add this helper after `openCaptureCommand()`:

```js
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
```

- [ ] **Step 2: Add RED test for persisted-token fallback rotation**

Add this test after `falls back to a random port when the preferred port is taken`:

```js
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
```

- [ ] **Step 3: Add RED test for explicit-token fallback fail-closed**

Add this test immediately after the persisted-token fallback test:

```js
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
```

- [ ] **Step 4: Verify RED**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers/tests/brainstorm-server
node lifecycle.test.js
```

Expected: persisted-token fallback test fails because fallback reuses `.last-token`, and explicit-token fallback test fails because fallback currently starts.

- [ ] **Step 5: Track token source in production code**

In `skills/brainstorming/scripts/server.cjs`, replace the current `const TOKEN = (() => { ... })();` block with:

```js
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function initialToken() {
  if (process.env.BRAINSTORM_TOKEN) {
    return { value: process.env.BRAINSTORM_TOKEN, source: 'env' };
  }
  if (TOKEN_FILE) {
    try {
      const t = fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
      if (/^[0-9a-f]{32,}$/i.test(t)) return { value: t, source: 'file' };
    } catch (e) { /* no prior token recorded */ }
  }
  return { value: generateToken(), source: 'generated' };
}

const tokenInfo = initialToken();
let TOKEN = tokenInfo.value;
let tokenSource = tokenInfo.source;
```

- [ ] **Step 6: Rotate or fail closed on EADDRINUSE fallback**

In the `server.on('error', ...)` handler, replace the `EADDRINUSE` branch with:

```js
    if (err.code === 'EADDRINUSE' && !triedFallback) {
      if (tokenSource === 'env') {
        console.error('Server failed to bind: preferred port is in use and BRAINSTORM_TOKEN is set; refusing fallback with explicit token');
        process.exit(1);
      }
      triedFallback = true;
      PORT = randomPort();
      if (tokenSource === 'file') {
        TOKEN = generateToken();
        tokenSource = 'generated-fallback';
      }
      server.listen(PORT, HOST, onListen);
    } else {
```

- [ ] **Step 7: Verify GREEN**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers/tests/brainstorm-server
node lifecycle.test.js
```

Expected: all lifecycle tests pass, including fallback token rotation and explicit-token fail-closed.

- [ ] **Step 8: Commit**

Run:

```bash
git add tests/brainstorm-server/lifecycle.test.js skills/brainstorming/scripts/server.cjs
git commit -m "Isolate companion fallback tokens"
```

## Task 3: Stop-Server Instance-Id Ownership

**Files:**
- Modify: `tests/brainstorm-server/stop-server.test.sh`
- Modify: `skills/brainstorming/scripts/start-server.sh`
- Modify: `skills/brainstorming/scripts/stop-server.sh`

- [ ] **Step 1: Add cleanup tracking and id helpers to stop-server tests**

In `tests/brainstorm-server/stop-server.test.sh`, after `PASS=0; FAIL=0`, add:

```bash
PIDS=()
DIRS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill -9 "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  for dir in "${DIRS[@]}"; do
    rm -rf "$dir"
  done
}
trap cleanup EXIT

track_dir() { DIRS+=("$1"); }
track_pid() { PIDS+=("$1"); }
new_server_id() {
  printf 'testid%026d\n' "$RANDOM"
}
```

When each test creates a `SESS="$(mktemp -d)"`, immediately add:

```bash
track_dir "$SESS"
```

When a test starts `UNRELATED`, `SRV`, or `IMPOSTOR`, immediately add the
matching tracking call:

```bash
track_pid "$UNRELATED"
track_pid "$SRV"
track_pid "$IMPOSTOR"
```

- [ ] **Step 2: Add RED ownership tests**

Replace the current real-server and impostor sections with these cases:

```bash
# --- Test 2: a real brainstorm server with matching instance id IS stopped ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/content" "$SESS/state"
SERVER_ID="$(new_server_id)"
printf '%s\n' "$SERVER_ID" > "$SESS/state/server-instance-id"
BRAINSTORM_DIR="$SESS" BRAINSTORM_PORT=3399 node "$SERVER" "--brainstorm-server-id=$SERVER_ID" > /dev/null 2>&1 &
SRV=$!
track_pid "$SRV"
disown "$SRV" 2>/dev/null || true
for _ in $(seq 1 40); do kill -0 "$SRV" 2>/dev/null && break; sleep 0.1; done
sleep 0.4
echo "$SRV" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
sleep 0.3
if kill -0 "$SRV" 2>/dev/null; then
  bad "real brainstorm server still running after stop" "$OUT"
else
  case "$OUT" in
    *stopped*) ok "real brainstorm server with matching instance id is stopped" ;;
    *) bad "server stopped but status was not 'stopped'" "$OUT" ;;
  esac
fi

# --- Test 4: a node server.cjs impostor with missing instance id is spared ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
( exec -a "node server.cjs" sleep 600 ) &
IMPOSTOR=$!
track_pid "$IMPOSTOR"
disown "$IMPOSTOR" 2>/dev/null || true
echo "$IMPOSTOR" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
if kill -0 "$IMPOSTOR" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "missing instance id leaves node server.cjs impostor alone" ;;
    *) bad "impostor survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "killed a node server.cjs impostor with missing instance id" "$OUT"
fi

# --- Test 5: a node server.cjs impostor with wrong instance id is spared ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
EXPECTED_ID="$(new_server_id)"
WRONG_ID="$(new_server_id)"
printf '%s\n' "$EXPECTED_ID" > "$SESS/state/server-instance-id"
( exec -a "node server.cjs --brainstorm-server-id=$WRONG_ID" sleep 600 ) &
IMPOSTOR=$!
track_pid "$IMPOSTOR"
disown "$IMPOSTOR" 2>/dev/null || true
echo "$IMPOSTOR" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
if kill -0 "$IMPOSTOR" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "wrong instance id leaves node server.cjs impostor alone" ;;
    *) bad "wrong-id impostor survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "killed a node server.cjs impostor with wrong instance id" "$OUT"
fi

# --- Test 6: malformed instance id is fail-closed ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
printf '%s\n' 'bad id with spaces' > "$SESS/state/server-instance-id"
( exec -a "node server.cjs --brainstorm-server-id=bad-id-with-spaces" sleep 600 ) &
IMPOSTOR=$!
track_pid "$IMPOSTOR"
disown "$IMPOSTOR" 2>/dev/null || true
echo "$IMPOSTOR" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
if kill -0 "$IMPOSTOR" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "malformed instance id is fail-closed" ;;
    *) bad "malformed-id impostor survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "killed process despite malformed instance id" "$OUT"
fi
```

Keep the unrelated PID and missing PID tests.

- [ ] **Step 3: Verify RED**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers
bash tests/brainstorm-server/stop-server.test.sh
```

Expected: matching-instance-id real server is reported `stale_pid` before implementation, and one of the impostor cases may be killed by the old command-name proof.

- [ ] **Step 4: Generate and pass instance id in start-server**

In `skills/brainstorming/scripts/start-server.sh`, after `LOG_FILE="${STATE_DIR}/server.log"`, add:

```bash
SERVER_ID_FILE="${STATE_DIR}/server-instance-id"
```

After `mkdir -p "${SESSION_DIR}/content" "$STATE_DIR"`, add:

```bash
SERVER_ID=""
if [[ -r /dev/urandom ]]; then
  SERVER_ID="$(od -An -N24 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n' || true)"
fi
if ! [[ "$SERVER_ID" =~ ^[A-Za-z0-9_-]{32,64}$ ]]; then
  SERVER_ID="$(printf '%08x%08x%08x%08x' "$$" "$(date +%s)" "${RANDOM:-0}" "${RANDOM:-0}")"
fi
printf '%s\n' "$SERVER_ID" > "$SERVER_ID_FILE"
chmod 600 "$SERVER_ID_FILE" 2>/dev/null || true
```

Update both Node launch commands to pass the argv:

```bash
env BRAINSTORM_DIR="$SESSION_DIR" BRAINSTORM_HOST="$BIND_HOST" BRAINSTORM_URL_HOST="$URL_HOST" BRAINSTORM_OWNER_PID="$OWNER_PID" node server.cjs "--brainstorm-server-id=$SERVER_ID" &
```

and:

```bash
nohup env BRAINSTORM_DIR="$SESSION_DIR" BRAINSTORM_HOST="$BIND_HOST" BRAINSTORM_URL_HOST="$URL_HOST" BRAINSTORM_OWNER_PID="$OWNER_PID" node server.cjs "--brainstorm-server-id=$SERVER_ID" > "$LOG_FILE" 2>&1 &
```

- [ ] **Step 5: Require instance id in stop-server**

In `skills/brainstorming/scripts/stop-server.sh`, add:

```bash
SERVER_ID_FILE="${STATE_DIR}/server-instance-id"
```

Replace `is_brainstorm_server()` with:

```bash
read_expected_server_id() {
  [[ -f "$SERVER_ID_FILE" ]] || return 1
  local id
  id="$(tr -d '\r\n' < "$SERVER_ID_FILE" 2>/dev/null || true)"
  [[ "$id" =~ ^[A-Za-z0-9_-]{32,64}$ ]] || return 1
  printf '%s\n' "$id"
}

command_line_for_pid() {
  local pid="$1"
  if [[ -r "/proc/$pid/cmdline" ]]; then
    tr '\0' '\n' < "/proc/$pid/cmdline" 2>/dev/null || true
    return 0
  fi
  ps -ww -p "$pid" -o command= 2>/dev/null || ps -f -p "$pid" 2>/dev/null | sed '1d' || true
}

command_has_server_id() {
  local pid="$1"
  local expected="$2"
  local expected_arg="--brainstorm-server-id=$expected"
  if [[ -r "/proc/$pid/cmdline" ]]; then
    local arg
    while IFS= read -r -d '' arg; do
      [[ "$arg" == "$expected_arg" ]] && return 0
    done < "/proc/$pid/cmdline"
    return 1
  fi
  local command_line
  command_line="$(command_line_for_pid "$pid")"
  [[ -n "$command_line" ]] || return 1
  case " $command_line " in
    *" $expected_arg "*) return 0 ;;
    *) return 1 ;;
  esac
}

is_brainstorm_server() {
  kill -0 "$1" 2>/dev/null || return 1
  local expected_id
  expected_id="$(read_expected_server_id)" || return 1
  command_has_server_id "$1" "$expected_id" || return 1
  return 0
}
```

In the stale PID branch, remove both metadata files:

```bash
    rm -f "$PID_FILE" "$SERVER_ID_FILE"
```

In the stopped branch, change the cleanup line to:

```bash
  rm -f "$PID_FILE" "$SERVER_ID_FILE" "${STATE_DIR}/server.log"
```

- [ ] **Step 6: Verify GREEN**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers
bash tests/brainstorm-server/stop-server.test.sh
```

Expected: real matching-id server stops, impostors survive, and all stale cases return `stale_pid`.

- [ ] **Step 7: Commit**

Run:

```bash
git add tests/brainstorm-server/stop-server.test.sh skills/brainstorming/scripts/start-server.sh skills/brainstorming/scripts/stop-server.sh
git commit -m "Harden companion stop ownership proof"
```

## Task 4: Platform And Fixed-Port Test Hardening

**Files:**
- Modify: `tests/brainstorm-server/auth.test.js`
- Modify: `tests/brainstorm-server/start-server.test.sh`
- Modify: `tests/brainstorm-server/windows-lifecycle.test.sh`

- [ ] **Step 1: Add fixed-port guard to auth tests**

In `tests/brainstorm-server/auth.test.js`, add this helper after `waitForServer()`:

```js
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
```

After `const { stdout: initialStdout } = await waitForServer(server);`, add:

```js
  assertStartedOnExpectedPort(initialStdout);
```

- [ ] **Step 2: Verify auth fixed-port guard**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers/tests/brainstorm-server
node auth.test.js
```

Expected: auth tests pass on a free `3335`, and would fail clearly if fallback occurred.

- [ ] **Step 3: Add start-server id argv assertion**

In `tests/brainstorm-server/start-server.test.sh`, change the first fake node body to:

```bash
cat > "$TEST_DIR/fake-bin/node" <<'EOF'
#!/usr/bin/env bash
echo "CAPTURED_OWNER_PID=${BRAINSTORM_OWNER_PID:-__UNSET__}"
echo "CAPTURED_ARGV=$*"
exit 0
EOF
```

After the owner PID assertion, add:

```bash
captured_argv=$(echo "$captured" | grep "CAPTURED_ARGV=" | head -1 | sed 's/CAPTURED_ARGV=//')
if echo "$captured_argv" | grep -Eq -- '--brainstorm-server-id=[A-Za-z0-9_-]{32,64}'; then
  pass "passes shell-safe server instance id argv"
else
  fail "passes shell-safe server instance id argv" \
       "expected --brainstorm-server-id=<safe id>, got: $captured_argv"
fi

server_id_file=$(find "$TEST_DIR/project/.superpowers/brainstorm" -name server-instance-id -print 2>/dev/null | head -1)
server_id_value=""
if [[ -n "$server_id_file" ]]; then
  server_id_value="$(tr -d '\r\n' < "$server_id_file")"
fi
if [[ "$server_id_value" =~ ^[A-Za-z0-9_-]{32,64}$ ]]; then
  pass "writes shell-safe server-instance-id state file"
else
  fail "writes shell-safe server-instance-id state file" \
       "expected valid id in state, got '$server_id_value'"
fi
```

- [ ] **Step 4: Add Windows lifecycle id argv assertions**

In `tests/brainstorm-server/windows-lifecycle.test.sh`, change the Test 2 fake node body to:

```bash
cat > "$FAKE_NODE_DIR/node" <<'FAKENODE'
#!/usr/bin/env bash
echo "CAPTURED_OWNER_PID=${BRAINSTORM_OWNER_PID:-__UNSET__}"
echo "CAPTURED_ARGV=$*"
exit 0
FAKENODE
```

After the owner PID check in Test 2, add:

```bash
captured_argv=$(echo "$captured" | grep "CAPTURED_ARGV=" | head -1 | sed 's/CAPTURED_ARGV=//')
if echo "$captured_argv" | grep -Eq -- '--brainstorm-server-id=[A-Za-z0-9_-]{32,64}'; then
  pass "start-server.sh passes server instance id argv on Windows"
else
  fail "start-server.sh passes server instance id argv on Windows" \
       "Expected --brainstorm-server-id=<safe id>, output: $captured"
fi
```

In Test 6, before launching direct Node, add:

```bash
STOP_TEST_ID="$(printf 'windowsstop%021d\n' "$RANDOM")"
printf '%s\n' "$STOP_TEST_ID" > "$TEST_DIR/stop-test/state/server-instance-id"
```

Change the direct Node launch in Test 6 to:

```bash
  node "$SERVER_SCRIPT" "--brainstorm-server-id=$STOP_TEST_ID" > "$TEST_DIR/stop-test/.server.log" 2>&1 &
```

- [ ] **Step 5: Verify platform tests**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers
bash tests/brainstorm-server/start-server.test.sh
```

Expected: all start-server shell tests pass on macOS.

Run the Windows lifecycle test later on `ballmer` as part of Task 6.

- [ ] **Step 6: Commit**

Run:

```bash
git add tests/brainstorm-server/auth.test.js tests/brainstorm-server/start-server.test.sh tests/brainstorm-server/windows-lifecycle.test.sh
git commit -m "Harden companion platform tests"
```

## Task 5: Docs And PR Consistency

**Files:**
- Modify: `skills/brainstorming/visual-companion.md`
- Modify: `docs/superpowers/plans/2026-06-09-visual-companion-issues.md`
- Update: PR #1720 body through `gh pr edit`

- [ ] **Step 1: Keep platform start commands aligned with auto-open behavior**

In `skills/brainstorming/visual-companion.md`, update platform-specific commands that start a user-approved companion session so they include `--open`:

```bash
scripts/start-server.sh --project-dir /path/to/project --open
```

```bash
scripts/start-server.sh --project-dir /path/to/project --open --foreground
```

Do not add `--open` to remote bind examples where auto-open is intentionally skipped.

- [ ] **Step 2: Reconcile issue catalog disposition rows**

In `docs/superpowers/plans/2026-06-09-visual-companion-issues.md`, replace the disposition rows for A2, D1, D2, D3, and D4 with:

```markdown
| A2 | Host allowlist; browser WS Origin check | PRs #1110/#1553 | Host allowlist dropped; WS Origin check retained after auth for browser confused-deputy defense |
| D1 | Permanent opt-out of the companion | issue #892 | Deferred - not in PR #1720 |
| D2 | Free-text feedback from the browser | issue #957 | Deferred - not in PR #1720 |
| D3 | Auto-open the companion URL | PR #759 (#755) | Done in PR #1720 via `--open` |
| D4 | Light/dark contrast helpers in the frame | PR #1683 | Deferred - not in PR #1720 |
```

- [ ] **Step 3: Reconcile A2 detail text**

Replace the final sentence in the A2 section with:

```markdown
No `BRAINSTORM_ALLOWED_HOSTS` and no Host allowlist. The final implementation still checks browser WebSocket `Origin` after session auth so a cross-origin localhost tab cannot ride the companion cookie.
```

- [ ] **Step 4: Reconcile timeout and feature grouping text**

In the C1 section, replace:

```markdown
- Raise the default (about 2h) and make it configurable:
```

with:

```markdown
- Raise the default to 4 hours and make it configurable:
```

In the suggested grouping section, replace item 4 with:

```markdown
4. **Deferred feature pass** - D1, D2, D4 are not part of PR #1720. D3 is shipped through the `--open` flow.
```

- [ ] **Step 5: Verify docs diff**

Run:

```bash
git diff -- skills/brainstorming/visual-companion.md docs/superpowers/plans/2026-06-09-visual-companion-issues.md
```

Expected: diff only updates auto-open command consistency, shipped/deferred dispositions, WS Origin wording, and the 4 hour timeout statement.

- [ ] **Step 6: Commit**

Run:

```bash
git add skills/brainstorming/visual-companion.md docs/superpowers/plans/2026-06-09-visual-companion-issues.md
git commit -m "Align visual companion docs with shipped scope"
```

## Task 6: Full Verification And Evidence

**Files:**
- No required source edits
- Update: PR #1720 body

- [ ] **Step 1: Run focused macOS checks**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers/tests/brainstorm-server
node server.test.js
node auth.test.js
node lifecycle.test.js
bash stop-server.test.sh
bash start-server.test.sh
```

Expected: all focused tests pass; symlink-only tests may report skipped only when host support is unavailable.

- [ ] **Step 2: Run full macOS test suite**

Run:

```bash
cd /Users/drewritter/.codex/worktrees/59f6/superpowers/tests/brainstorm-server
npm test
```

Expected: full brainstorm-server test suite passes.

- [ ] **Step 3: Run static checks**

Run from repo root:

```bash
git diff --check
node --check skills/brainstorming/scripts/server.cjs
node --check skills/brainstorming/scripts/helper.js
bash scripts/lint-shell.sh skills/brainstorming/scripts/start-server.sh skills/brainstorming/scripts/stop-server.sh tests/brainstorm-server/start-server.test.sh tests/brainstorm-server/stop-server.test.sh tests/brainstorm-server/windows-lifecycle.test.sh
```

Expected: all commands exit 0.

- [ ] **Step 4: Run Windows validation on ballmer**

Copy or fetch the rebased branch on `ballmer`, then run:

```bash
cd superpowers
npm --prefix tests/brainstorm-server ci
npm --prefix tests/brainstorm-server test
bash tests/brainstorm-server/windows-lifecycle.test.sh
```

Expected: full runnable Windows suite passes. If Git Bash lacks `lsof`, only the lsof-specific legacy port-cross-check test may skip; instance-id stop tests must still pass.

- [ ] **Step 5: Verify PR diff and GitHub state**

Run:

```bash
git diff --quiet origin/dev...HEAD -- evals
gh pr view 1720 --json mergeStateStatus,statusCheckRollup,headRefOid
```

Expected: first command exits 0. PR JSON no longer reports `DIRTY` or `CONFLICTING` after the branch is pushed.

- [ ] **Step 6: Collect external eval evidence**

Run:

```bash
git -C /Users/drewritter/.codex/worktrees/59f6/superpowers-evals rev-parse HEAD
git -C /Users/drewritter/.codex/worktrees/59f6/superpowers-evals status --short --branch
```

If the eval worktree is not at that path, run the same commands in `/Users/drewritter/prime-rad/superpowers-evals`.

Record the exact eval scenario path, command, result artifact path, and RED/GREEN outcome from the already-run eval evidence. Do not claim the eval submodule is included in PR #1720.

- [ ] **Step 7: Run final manual/browser smoke**

After automated tests are green, start the companion with `--open`, push a small screen, verify the browser reaches a bare `/` URL after bootstrap, verify status reaches Connected, stop and restart the server with the same project dir, and verify the open tab reconnects. Record the exact commands and observed result.

- [ ] **Step 8: Update PR body**

Prepare `/tmp/pr-1720-body.md`, then run `gh pr edit 1720 --body-file /tmp/pr-1720-body.md` after the body includes:

- model, harness, plugins, and Drew as human reviewer
- duplicate/related PR search results
- exact post-rebase note that `evals` is absent from this PR diff
- focused RED/GREEN evidence table
- macOS `npm test` evidence
- Windows `ballmer` evidence
- manual/browser smoke evidence
- external eval repo commit, scenario path, command, artifact path, and outcome

- [ ] **Step 9: Push branch**

Run:

```bash
git status --short --branch
git push origin brainstorming-companion
```

Expected: push succeeds and PR #1720 updates.

- [ ] **Step 10: Final PR readiness check**

Run:

```bash
gh pr view 1720 --json mergeStateStatus,statusCheckRollup,headRefOid,url
```

Expected: PR points at the pushed head SHA, merge state is no longer conflict-blocked, and check status is recorded for Drew.

## Self-Review Checklist

- [ ] Every requirement in `docs/superpowers/specs/2026-06-11-visual-companion-final-hardening-fixup-design.md` maps to one of the tasks above.
- [ ] The plan contains no vague or incomplete steps.
- [ ] Tests are added before production fixes in Tasks 1, 2, and 3.
- [ ] The docs task does not add deferred features.
- [ ] The verification task includes macOS, Windows, PR diff, PR metadata, external eval evidence, and final manual/browser smoke.
