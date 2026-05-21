# Windows Lifecycle Test Drift Design

## Problem

`tests/brainstorm-server/windows-lifecycle.test.sh` has drifted behind the
brainstorm server implementation in three places.

First, it starts the brainstorm server directly with:

```bash
SERVER_JS="$REPO_ROOT/skills/brainstorming/scripts/server.js"
```

The brainstorm server entrypoint was renamed from `server.js` to `server.cjs`
in commit `3128a2c` to resolve the ESM/CommonJS conflict. The main
`start-server.sh` script already launches `node server.cjs`, but the lifecycle
test still points at the old filename.

Second, commit `9e3ed21` split session data into `content/` and `state/`.
The server now writes `state/server-info` and reads `state/server.pid`, while
the lifecycle test still waits for `.server-info` at the session root and writes
`.server.pid` there for the stop test.

Third, commit `9f04f06` changed invalid owner-PID behavior. If the configured
owner PID is already dead at startup, the server logs `owner-pid-invalid`,
disables owner monitoring, and relies on the idle timeout. The lifecycle test
still expects a dead-at-startup PID to kill the server after the 60-second
check.

As a result, the lifecycle test fails on current `dev` before it can verify the
intended lifecycle behavior.

## Goals

- Make the lifecycle test execute the same server entrypoint used by
  `skills/brainstorming/scripts/start-server.sh`.
- Make the lifecycle test read and write server state in `state/`.
- Make owner-PID assertions match the current startup-validation behavior.
- Preserve the existing runtime code and lifecycle semantics.

## Non-Goals

- Do not change brainstorm server runtime behavior.
- Do not change owner-PID lifecycle semantics.
- Do not change server, start, or stop runtime scripts.

## Design

Rename the local test variable from `SERVER_JS` to `SERVER_SCRIPT` and point it
at:

```bash
$REPO_ROOT/skills/brainstorming/scripts/server.cjs
```

Then update the direct `node "$SERVER_JS"` invocations to use
`node "$SERVER_SCRIPT"`.

Update lifecycle helpers to look for `state/server-info`, and update the clean
shutdown test to write the PID file to `state/server.pid`, matching
`stop-server.sh`.

Update owner-PID checks to match current behavior:

- On Windows, `start-server.sh` passes the resolved owner PID to the server; it
  no longer clears it in shell.
- A dead-at-startup owner PID logs `owner-pid-invalid` and does not kill the
  server immediately.
- A live owner process that exits after startup still causes shutdown at the
  lifecycle check and logs `owner process exited`.

## Test Strategy

Use the existing lifecycle test as the regression test:

```bash
bash tests/brainstorm-server/windows-lifecycle.test.sh
```

Before the fix, it fails with startup and stale owner-PID expectation failures.
After the fix on macOS, the Windows-only checks remain skipped and the
cross-platform lifecycle checks pass.
