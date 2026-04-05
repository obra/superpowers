# Codex Windows SessionStart Wrapper Design

## Goal

Ship a Windows-safe Codex `SessionStart` bootstrap path that works when Codex
executes hooks through PowerShell instead of `cmd.exe`.

## Problem

The current Codex docs recommend:

```json
"command": "SUPERPOWERS_HOOK_TARGET=codex bash ~/.codex/superpowers/hooks/session-start"
```

That works in POSIX shells, but Codex on Windows inherits the user's current
shell for hooks. In a PowerShell session, the POSIX env-prefix syntax is not
valid, so the hook fails before `SUPERPOWERS_HOOK_TARGET=codex` reaches the
bootstrap script.

## Constraints

- Preserve the existing `hooks/session-start` bash implementation and JSON
  output contract.
- Keep Unix installation instructions unchanged.
- Ship the Windows fix inside the repository rather than requiring users to
  create ad hoc local wrappers.
- Keep the Windows entrypoint focused on Codex `SessionStart`; do not broaden
  this change into a generic hook execution framework.

## Design

### PowerShell wrapper

Add `hooks/session-start-codex.ps1` as a versioned Windows entrypoint for
Codex.

Responsibilities:

- resolve `run-hook.cmd` relative to `$PSScriptRoot`
- fail with exit code `1` if the wrapper is missing
- set `SUPERPOWERS_HOOK_TARGET=codex`
- invoke `run-hook.cmd session-start`
- preserve stdout so Codex receives the original JSON payload
- propagate the child exit code, defaulting to `0` when PowerShell does not set
  `$LASTEXITCODE`

This keeps the platform-specific concern in a small adapter while reusing the
existing `run-hook.cmd` and `session-start` logic.

### Documentation

Update `docs/README.codex.md` and `.codex/INSTALL.md` to show:

- the existing Unix command for macOS/Linux
- a Windows-specific command that points to the new PowerShell wrapper
- troubleshooting guidance that explicitly calls out PowerShell as the reason
  the POSIX snippet fails on Windows

### Tests

Extend `tests/codex/test-using-superpowers-bootstrap.sh` with a Windows-only
contract check for the PowerShell wrapper:

- skip on non-Windows bash environments
- invoke `hooks/session-start-codex.ps1`
- assert the emitted JSON still uses `hookSpecificOutput`
- assert the bootstrap banner is preserved

This complements the existing bash-script contract test instead of replacing
it.

## Non-Goals

- Refactoring `hooks/session-start`
- Adding wrappers for non-Codex hook events
- Changing Claude/Cursor hook installation flows

## Validation

- run the Codex bootstrap contract test
- on Windows, verify the PowerShell wrapper path passes in the test and in a
  real `codex --yolo` startup
