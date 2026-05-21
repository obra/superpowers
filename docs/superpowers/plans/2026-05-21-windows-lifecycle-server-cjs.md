# Windows Lifecycle Test Drift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the brainstorm Windows lifecycle test so it matches the current server entrypoint, state layout, and owner-PID semantics.

**Architecture:** This is a test-harness correction only. The brainstorm server runtime already uses `server.cjs`, writes state under `state/`, and treats dead-at-startup owner PIDs as invalid startup resolution rather than owner-exit shutdown.

**Tech Stack:** Bash, Node.js, existing brainstorm server test scripts.

---

### Task 1: Confirm RED Baseline

**Files:**
- Read: `tests/brainstorm-server/windows-lifecycle.test.sh`
- Read: `skills/brainstorming/scripts/start-server.sh`
- Read: `skills/brainstorming/scripts/server.cjs`

- [ ] **Step 1: Inspect the stale test entrypoint**

Run:

```bash
rg -n 'SERVER_JS|server\.js|server\.cjs' tests/brainstorm-server/windows-lifecycle.test.sh skills/brainstorming/scripts/start-server.sh
```

Expected:

- `windows-lifecycle.test.sh` points at `server.js`
- `start-server.sh` launches `server.cjs`
- `windows-lifecycle.test.sh` still checks `.server-info` / `.server.pid`
- `server.cjs` writes `state/server-info`

- [ ] **Step 2: Run the failing lifecycle test**

Run:

```bash
bash tests/brainstorm-server/windows-lifecycle.test.sh
```

Expected before the fix on macOS:

```text
=== Results: 0 passed, 3 failed, 3 skipped ===
```

After only the entrypoint and state paths are fixed, expected intermediate
failure:

```text
=== Results: 6 passed, 2 failed, 3 skipped ===
```

because the stale dead-at-startup owner-PID assertion still expects shutdown.

### Task 2: Align Test With Current Server

**Files:**
- Modify: `tests/brainstorm-server/windows-lifecycle.test.sh`

- [ ] **Step 1: Rename the local variable and point it at `server.cjs`**

Change:

```bash
SERVER_JS="$REPO_ROOT/skills/brainstorming/scripts/server.js"
```

To:

```bash
SERVER_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/server.cjs"
```

- [ ] **Step 2: Update direct Node invocations**

Change each lifecycle test launch from:

```bash
node "$SERVER_JS"
```

To:

```bash
node "$SERVER_SCRIPT"
```

- [ ] **Step 3: Update server state paths**

Change lifecycle helper reads from:

```bash
"$dir/.server-info"
"$1/.server-info"
```

To:

```bash
"$dir/state/server-info"
"$1/state/server-info"
```

Change the clean shutdown PID setup from:

```bash
echo "$STOP_TEST_PID" > "$TEST_DIR/stop-test/.server.pid"
```

To:

```bash
echo "$STOP_TEST_PID" > "$TEST_DIR/stop-test/state/server.pid"
```

- [ ] **Step 4: Update owner-PID assertions**

Keep the empty-owner survival test.

Change the dead-at-startup owner-PID test so it expects:

```text
Invalid-owner server starts with OWNER_PID=<bad pid>
Invalid OWNER_PID is logged at startup
Invalid OWNER_PID does not kill the server at startup
```

Add a live-owner shutdown control:

```bash
sleep 2 &
OWNER_TEST_PID=$!
BRAINSTORM_OWNER_PID="$OWNER_TEST_PID" node "$SERVER_SCRIPT" ...
wait "$OWNER_TEST_PID"
sleep 65
```

Expected:

```text
Owner-exit server self-terminates
Owner-exit server logs 'owner process exited'
```

### Task 3: Verify

**Files:**
- Test: `tests/brainstorm-server/windows-lifecycle.test.sh`
- Test: `tests/brainstorm-server/server.test.js`
- Test: `tests/brainstorm-server/ws-protocol.test.js`

- [ ] **Step 1: Run the fixed lifecycle test**

Run:

```bash
bash tests/brainstorm-server/windows-lifecycle.test.sh
```

Expected on macOS:

```text
=== Results: 11 passed, 0 failed, 3 skipped ===
```

- [ ] **Step 2: Run brainstorm server tests**

Run:

```bash
npm ci --prefix tests/brainstorm-server
npm test --prefix tests/brainstorm-server
node tests/brainstorm-server/ws-protocol.test.js
```

Expected:

- `server.test.js`: 25 passed, 0 failed
- `ws-protocol.test.js`: 31 passed, 0 failed

- [ ] **Step 3: Run syntax and whitespace checks**

Run:

```bash
bash -n tests/brainstorm-server/windows-lifecycle.test.sh
git diff --check
```

Expected: no output.
