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

## Inherited Security Invariants

This fixup preserves the auth hardening already designed and implemented:

- `.last-token` and `state/server-info` remain sensitive owner-only state.
- Fallback tokens may appear in startup JSON and `state/server-info`, but must
  not be written to `.last-token`.
- Cookies remain port-named, `HttpOnly`, `SameSite=Strict`, and scoped to `/`.
- WebSocket upgrades still require a valid key or cookie.
- WebSocket `Origin` checks remain enforced when the browser supplies an
  `Origin` header.
- Direct no-`Origin` clients remain allowed only when they carry the session key.
- Generated same-origin screen JavaScript and future same-origin vendored
  libraries are trusted. Sandboxing malicious screen HTML remains deferred.

## Design

### 1. Rebase Onto Current `dev`

Rebase `brainstorming-companion` onto current `origin/dev` before implementation
work. Resolve the `evals` submodule conflict by taking `dev`.

After the rebase:

- `evals` must not appear in the PR diff.
- PR #1720 can still mention eval evidence that was run elsewhere, but it must
  include exact external evidence: eval repo commit, scenario path, command,
  result artifact path or id, and RED/GREEN outcome.
- The PR body must not imply the evals submodule bump is part of this PR.
- Any earlier PR-body text or comment implying the submodule bump is included
  must be superseded by the final PR-body evidence.

### 2. Root Screen Containment

The root screen route must use the same containment boundary as `/files/*`.

`getNewestScreen()` should ignore any `.html` candidate that does not pass the
regular-file-inside-content-dir guard. That guard must resolve real paths and
ensure the served file is inside `CONTENT_DIR`. It must also preserve the
existing hardlink protection by rejecting files whose link count is not exactly
one when the platform reports link counts.

Expected behavior:

- A symlink under `content/` pointing outside `content/` is ignored.
- A hardlink under `content/` to `state/server-info` is ignored when
  `fs.linkSync` succeeds and `lstat.nlink > 1`.
- If no safe screen file remains, the waiting page is served.
- Existing `/files/*` containment behavior remains unchanged: empty names,
  dotfiles, symlinks, hardlinks, and directories still return 404.

### 3. Fallback Token Isolation

Port fallback must not reuse a token loaded from persisted `.last-token`.

Token source should be explicit in code:

- `BRAINSTORM_TOKEN` from the environment is an intentional operator/test
  override. If the preferred port is occupied while an explicit environment
  token is set, the server must fail closed instead of falling back, because the
  occupied server may be using the same explicit token.
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
node server.cjs --brainstorm-server-id=<id>
```

The id is not an auth credential. It is only process-ownership evidence for the
local lifecycle scripts. `server.cjs` can ignore the argument.

The id must use a shell/MSYS-safe alphabet, such as
`^[A-Za-z0-9_-]{32,64}$`. Store it in `state/server-instance-id` with
owner-only permissions.

`stop-server.sh` should read the expected id from state and only signal the PID
when the target process argv contains the exact argument
`--brainstorm-server-id=<id>` as a full argv token, not as a loose substring.
Prefer `/proc/<pid>/cmdline` when available, then fall back to wide `ps` output.
A matching instance id is sufficient proof even when `server-info` is missing
or `lsof` is unavailable. Existing port-to-PID checks may remain as additional
evidence.

Fail closed when ownership cannot be proven:

- missing PID file
- missing or malformed server id
- target command line unavailable
- target command line does not include the expected id
- old/stale session metadata without the new id

This intentionally prefers leaving a stale process running over killing an
unrelated process.

Operator-visible outcomes should be explicit:

- missing PID file returns `not_running`
- missing or malformed server id returns `stale_pid`
- unavailable command line returns `stale_pid`
- wrong or absent argv id returns `stale_pid`
- successful stop returns `stopped`

On `stale_pid` and `stopped` outcomes, remove `server.pid` and
`server-instance-id` so future stop attempts do not keep targeting the same
ambiguous process. Do not remove persistent session content.

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
- Windows/MSYS start-server tests must assert that Windows-like detection still
  clears `BRAINSTORM_OWNER_PID`, still auto-foregrounds when appropriate, and
  still passes the instance-id argv exactly.

### 6. Docs And PR Consistency

Before Jesse reviews, reconcile reviewer-visible docs and PR metadata:

- Update the issue catalog so dispositions match what this PR actually ships.
- Keep auto-open docs consistent with the implemented `--open` behavior.
- Keep the documented default idle timeout at 4 hours everywhere.
- Review the PR body against the template after the rebase.
- Record macOS, Windows, browser/manual, and external eval evidence in the PR
  body with concrete commands and results.

## Testing Strategy

Use TDD for each behavior change:

1. Add or tighten a focused regression test.
2. Run it and confirm it fails for the expected reason.
3. Implement the smallest fix.
4. Rerun the focused test.
5. Rerun the full brainstorm-server suite.

Required focused regressions:

| Behavior | Test File | Focused Command | Expected RED | Expected GREEN |
| --- | --- | --- | --- | --- |
| Root route ignores symlink escape | `tests/brainstorm-server/server.test.js` | `node tests/brainstorm-server/server.test.js` | authenticated `GET /` serves linked outside content | response serves waiting page or safe screen |
| Root route ignores supported hardlink escape | `tests/brainstorm-server/server.test.js` | `node tests/brainstorm-server/server.test.js` | authenticated `GET /` serves hardlinked `server-info` | hardlink candidate is ignored when `nlink > 1` |
| `/files/*` containment stays unchanged | `tests/brainstorm-server/server.test.js` | `node tests/brainstorm-server/server.test.js` | existing containment test regresses | empty, dotfile, directory, symlink, hardlink cases remain 404 |
| Persisted-token fallback rotates token | `tests/brainstorm-server/lifecycle.test.js` | `node tests/brainstorm-server/lifecycle.test.js` | fallback URL key equals persisted preferred-port key | fallback URL key differs and is not written to `.last-token` |
| Explicit-token fallback fails closed | `tests/brainstorm-server/lifecycle.test.js` | `node tests/brainstorm-server/lifecycle.test.js` | server falls back while `BRAINSTORM_TOKEN` is set | process exits non-zero and does not start fallback |
| Fallback key cannot authenticate to original server | `tests/brainstorm-server/lifecycle.test.js` | `node tests/brainstorm-server/lifecycle.test.js` | fallback key receives 200 from original port | original port rejects fallback key |
| Correct instance id permits stop | `tests/brainstorm-server/stop-server.test.sh` | `bash tests/brainstorm-server/stop-server.test.sh` | real start-server-launched server survives | stop returns `stopped` and process exits |
| Wrong, missing, malformed, or stale id is safe | `tests/brainstorm-server/stop-server.test.sh` | `bash tests/brainstorm-server/stop-server.test.sh` | impostor is signaled | stop returns `stale_pid` and impostor survives |
| Fixed-port suites cannot pass through fallback | `tests/brainstorm-server/server.test.js`, `tests/brainstorm-server/auth.test.js` | respective `node` commands | test silently talks to fallback port | test fails clearly or uses reported port intentionally |
| Shell cleanup traps run on failures | `tests/brainstorm-server/stop-server.test.sh` | `bash tests/brainstorm-server/stop-server.test.sh` | failure leaves child processes | trap reaps background children |
| Windows/MSYS start behavior keeps lifecycle invariants | `tests/brainstorm-server/start-server.test.sh`, `tests/brainstorm-server/windows-lifecycle.test.sh` | `bash` test commands on macOS and `ballmer` | owner PID or argv handling regresses | owner PID is cleared, foreground detection holds, id argv is present |

Each RED/GREEN cycle should leave a short evidence note for the PR body: focused
command, failing assertion before the fix, passing assertion after the fix, and
whether the evidence was gathered on macOS or Windows.

## Verification

Before calling the fixup complete, run:

- `git fetch origin dev && git rebase origin/dev`
- `git diff --quiet origin/dev...HEAD -- evals`
- `gh pr view 1720 --json mergeStateStatus,statusCheckRollup,headRefOid`
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
- `/files/*` containment protections remain unchanged.
- No fallback server runs with a token that may be shared with the occupied
  preferred-port server.
- `stop-server.sh` does not signal unrelated processes when ownership proof is
  missing or ambiguous.
- `stop-server.sh` can still stop a legitimate server with a matching instance
  id when `server-info` or `lsof` is unavailable.
- Focused RED/GREEN evidence is recorded for each regression.
- macOS and Windows validation evidence is recorded in the PR body.
- The PR body accurately describes what is in the branch and what evidence was
  gathered externally.
