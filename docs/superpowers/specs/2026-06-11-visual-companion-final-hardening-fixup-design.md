# Visual Companion Final Hardening Fixup Design

**Date:** 2026-06-11
**Status:** Draft for Drew review

## Goal

Finish the PR #1720 visual companion hardening pass so the branch is ready for
Jesse review with clean security behavior, deterministic tests, and a PR diff
that contains only the companion work.

This is a fixup on top of the existing auth hardening design. It should not
redesign the companion or expand the feature surface.

## Background

The previous hardening pass added keyed sessions, same-origin WebSocket checks,
URL key stripping, `/files/*` containment, leak-reduction headers, IPv6 URL
formatting, Windows lifecycle coverage, and PR evidence updates.

The final review pass found five remaining issues:

1. The root `GET /` screen-selection path can still serve symlinks or hardlinks
   under `content/` that point outside the content directory.
2. When the preferred port is occupied, fallback servers can reuse a persisted
   `.last-token`, creating two live same-project companion servers with the same
   bearer key.
3. `stop-server.sh` can signal an unrelated `node server.cjs` process when
   strong ownership proof is unavailable.
4. Some tests can pass against the wrong fallback process, leak background
   processes on failure, or assume symlink support on Windows-like hosts.
5. The PR is currently conflicted because the branch contains an older `evals`
   submodule bump that was handled separately.

## Non-Goals

- Do not add HTTPS tunnel or `wss://` origin semantics in this pass.
- Do not implement opt-out, free-text, or contrast-helper companion features.
- Do not vendor Alpine, Three.js, or any other JavaScript library.
- Do not attempt to sandbox malicious agent-authored screen HTML.
- Do not add backward compatibility for stale stop-server PID files unless Drew
  explicitly approves that tradeoff.

## Design

### 1. Rebase Onto Current `dev`

Rebase `brainstorming-companion` onto current `origin/dev` before implementation
work. Resolve the `evals` submodule conflict by taking `dev`.

After the rebase:

- `evals` must not appear in the PR diff.
- PR #1720 can still mention eval evidence that was run elsewhere.
- The PR body must not imply the evals submodule bump is part of this PR.

### 2. Root Screen Containment

The root screen route must use the same containment boundary as `/files/*`.

`getNewestScreen()` should ignore any `.html` candidate that does not pass the
regular-file-inside-content-dir guard. That guard must resolve real paths and
ensure the served file is inside `CONTENT_DIR`. It must also preserve the
existing hardlink protection by rejecting files whose link count is not exactly
one when the platform reports link counts.

Expected behavior:

- A symlink under `content/` pointing outside `content/` is ignored.
- A hardlink under `content/` to a file outside `content/` is ignored when the
  platform exposes enough metadata to detect it.
- If no safe screen file remains, the waiting page is served.

### 3. Fallback Token Isolation

Port fallback must not reuse a token loaded from persisted `.last-token`.

Token source should be explicit in code:

- `BRAINSTORM_TOKEN` from the environment is an intentional operator/test
  override and remains unchanged on fallback.
- `.last-token` is persisted state for same-port reconnect convenience. If the
  server falls back because the preferred port is occupied, discard that loaded
  token and generate a fresh unpersisted token for the fallback process.
- A newly generated token that was not loaded from `.last-token` can be reused
  within the same process because no other live process is known to have it.

The fallback server must continue to avoid overwriting `.last-port` and
`.last-token`.

### 4. Stop-Server Ownership Proof

`start-server.sh` should create a per-start server instance id and pass it to
Node as an inert command-line argument, for example:

```text
--brainstorm-server-id=<opaque-id>
```

The id is not an auth credential. It is only process-ownership evidence for the
local lifecycle scripts. `server.cjs` can ignore the argument.

`stop-server.sh` should read the expected id from state and only signal the PID
when the target process command line contains the exact id argument. Existing
port-to-PID checks may remain as additional evidence, but they should not be the
only path that permits killing an ambiguous process.

Fail closed when ownership cannot be proven:

- missing PID file
- missing or malformed server id
- target command line unavailable
- target command line does not include the expected id
- old/stale session metadata without the new id

This intentionally prefers leaving a stale process running over killing an
unrelated process.

### 5. Test Hardening

The test pass should be deterministic across macOS and the Windows Git Bash host
used for validation.

Required changes:

- Fixed-port suites must either fail fast if the server reports a fallback port
  or drive all clients from the reported startup port.
- `stop-server.test.sh` needs a top-level cleanup trap before any background
  process is started.
- Symlink-specific assertions should probe symlink capability and skip only that
  assertion when the host cannot create usable test symlinks.
- Tests that create impostor processes must assert that the impostor survives
  when lifecycle metadata is missing or insufficient.

## Testing Strategy

Use TDD for each behavior change:

1. Add or tighten a focused regression test.
2. Run it and confirm it fails for the expected reason.
3. Implement the smallest fix.
4. Rerun the focused test.
5. Rerun the full brainstorm-server suite.

Required focused regressions:

- root screen symlink escape is not served
- root screen hardlink escape is not served when the platform supports the check
- fallback after occupied preferred port uses a token different from the
  persisted preferred-port token
- fallback token does not authenticate to the original preferred-port server
- `stop-server.sh` does not kill an impostor when `server-info` or the new
  server id proof is missing
- fixed-port tests fail clearly if fallback occurs unexpectedly
- shell cleanup traps reap all background children on failure

## Verification

Before calling the fixup complete, run:

- `cd tests/brainstorm-server && npm test`
- relevant focused test commands used during TDD
- `git diff --check`
- Node syntax checks for touched JavaScript files
- shell lint for touched shell files
- Windows validation on `ballmer`: full runnable brainstorm-server suite plus
  the standalone Windows lifecycle probe

Manual/browser testing comes only after the automated pass is green.

## Acceptance Criteria

- PR #1720 rebases cleanly onto current `dev`.
- `evals` is absent from the PR diff.
- Root screen serving cannot read outside `content/` through symlink or
  supported hardlink escapes.
- A fallback server does not share a persisted token with the occupied
  preferred-port server.
- `stop-server.sh` does not signal unrelated processes when ownership proof is
  missing or ambiguous.
- macOS and Windows validation evidence is recorded in the PR body.
- The PR body accurately describes what is in the branch and what evidence was
  gathered externally.
