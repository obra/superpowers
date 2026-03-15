# Changelog

## Unreleased

### Fixed

- **Brainstorm server on Windows**: Auto-detect Windows/Git Bash (`OSTYPE=msys*`, `MSYSTEM`) and switch to foreground mode, fixing silent server failure caused by `nohup`/`disown` process reaping. Applies to all Windows shells (CMD, PowerShell, Git Bash) since they all route through Git Bash. ([#737](https://github.com/obra/superpowers/issues/737), based on [#740](https://github.com/obra/superpowers/pull/740))
- **Portable shebangs**: Replace `#!/bin/bash` with `#!/usr/bin/env bash` in all 13 shell scripts. Fixes execution on NixOS, FreeBSD, and macOS with Homebrew bash where `/bin/bash` is outdated or missing. ([#700](https://github.com/obra/superpowers/pull/700), dupes: [#747](https://github.com/obra/superpowers/pull/747))
- **POSIX-safe hook script**: Replace `${BASH_SOURCE[0]:-$0}` with `$0` in `hooks/session-start` and polyglot-hooks docs. Fixes 'Bad substitution' error on Ubuntu/Debian where `/bin/sh` is dash. ([#553](https://github.com/obra/superpowers/pull/553))
- **Bash 5.3+ hook hang**: Replace heredoc (`cat <<EOF`) with `printf` in `hooks/session-start`. Fixes indefinite hang on macOS with Homebrew bash 5.3+ caused by a bash regression with large variable expansion in heredocs. ([#572](https://github.com/obra/superpowers/pull/572), [#571](https://github.com/obra/superpowers/issues/571))
- **Cursor hooks support**: Add `hooks/hooks-cursor.json` with Cursor's camelCase format (`sessionStart`, `version: 1`) and update `.cursor-plugin/plugin.json` to reference it. Fix platform detection in `session-start` to check `CURSOR_PLUGIN_ROOT` first (Cursor may also set `CLAUDE_PLUGIN_ROOT`). (Based on [#709](https://github.com/obra/superpowers/pull/709))

### Already fixed on dev (closed PRs)

- **Windows hook quoting** ([#630](https://github.com/obra/superpowers/pull/630), [#529](https://github.com/obra/superpowers/issues/529)): `hooks.json` already uses escaped double quotes on dev.
- **Windows symlink path** ([#539](https://github.com/obra/superpowers/pull/539)): Closed — the PR introduced a bug (literal `~` in path alongside `$env:USERPROFILE`). Current docs are correct.

### Known Issues

- **`BRAINSTORM_OWNER_PID` on Windows (main branch only)**: The main branch's `server.js` uses `process.kill(OWNER_PID, 0)` for lifecycle checks, but receives MSYS2 PIDs which are invisible to Node.js (different PID namespace). This causes the server to self-terminate after 60 seconds. Fix: resolve `OWNER_PID` via `/proc/$PPID/winpid` to get the Windows-native PID. The dev branch's `index.js` does not have this issue since it has no OWNER_PID lifecycle check.
