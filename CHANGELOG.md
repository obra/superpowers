# Changelog

## Unreleased

### Fixed

- **Brainstorm server on Windows**: Auto-detect Windows/Git Bash (`OSTYPE=msys*`, `MSYSTEM`) and switch to foreground mode, fixing silent server failure caused by `nohup`/`disown` process reaping. Applies to all Windows shells (CMD, PowerShell, Git Bash) since they all route through Git Bash. (fixes #737, based on #740)
- **Portable shebangs**: Replace `#!/bin/bash` with `#!/usr/bin/env bash` in all 13 shell scripts. Fixes execution on NixOS, FreeBSD, and macOS with Homebrew bash where `/bin/bash` is outdated or missing. (closes #700)
- **POSIX-safe hook script**: Replace `${BASH_SOURCE[0]:-$0}` with `$0` in `hooks/session-start` and polyglot-hooks docs. Fixes 'Bad substitution' error on Ubuntu/Debian where `/bin/sh` is dash. (closes #553)

### Known Issues

- **`BRAINSTORM_OWNER_PID` on Windows (main branch only)**: The main branch's `server.js` uses `process.kill(OWNER_PID, 0)` for lifecycle checks, but receives MSYS2 PIDs which are invisible to Node.js (different PID namespace). This causes the server to self-terminate after 60 seconds. Fix: resolve `OWNER_PID` via `/proc/$PPID/winpid` to get the Windows-native PID. The dev branch's `index.js` does not have this issue since it has no OWNER_PID lifecycle check.
