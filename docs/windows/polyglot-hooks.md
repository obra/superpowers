# Cross-Platform Polyglot Hooks for Claude Code

Claude Code plugins need hooks that work on Windows, macOS, and Linux. This document describes the single generic dispatcher pattern used in `hooks/run-hook.cmd`.

> **Authoritative source:** `hooks/run-hook.cmd` is the canonical implementation. When this document and the code diverge, trust the code.

## The Problem

Claude Code runs hook commands through a shell:
- **macOS/Linux**: bash or sh
- **Windows with Git Bash installed**: Git Bash
- **Windows without Git Bash**: PowerShell (older versions used CMD.exe)

Neither Windows fallback shell can parse our command string: PowerShell treats
a leading quoted path as a string expression and errors on the next bareword,
and CMD.exe's `/c` quoting rules strip the outer quotes when the path contains
a metacharacter such as `(`. Our hooks therefore declare `"shell": "bash"`
(supported since Claude Code 2.1.81; older versions ignore the key), which
forces the Git Bash route and, when Git Bash is absent, produces an actionable
"install Git for Windows" error instead of a shell parser failure.

This creates several challenges:

1. **Script execution**: Windows CMD can't execute `.sh` files directly
2. **Path format**: Windows uses backslashes (`C:\path`), Unix uses forward slashes (`/path`)
3. **Environment variables**: `$VAR` syntax doesn't work in CMD
4. **`.sh` auto-prepend**: Claude Code on Windows automatically prepends `bash` to any command that contains `.sh` in its path — this interferes with the dispatcher if scripts have extensions

## The Solution: Extensionless Scripts + Single Generic Dispatcher

The repo uses one generic `run-hook.cmd` dispatcher for all hooks. Hook scripts are **extensionless** (`session-start`, not `session-start.sh`). This is deliberate: it prevents Claude Code's Windows auto-detection from prepending `bash` to the dispatcher command and breaking it.

### File Structure

```
hooks/
├── hooks.json          # Points to run-hook.cmd with extensionless script name
├── run-hook.cmd        # Cross-platform dispatcher (the polyglot wrapper)
└── session-start       # Actual hook logic — extensionless POSIX sh script
```

### hooks.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "powershell": "& \"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "shell": "bash",
            "async": false
          }
        ]
      }
    ]
  }
}
```

The path is quoted because `${CLAUDE_PLUGIN_ROOT}` may contain spaces.

### The `powershell` key

GitHub Copilot (the CLI and VS Code) on Windows runs hook commands through
PowerShell regardless of the `shell` key (#2189), where a leading quoted path
parses as a string expression and the trailing bareword is an error
("Unexpected token 'session-start'"). Copilot uses the `powershell` key
instead of `command` when it is present, and it gives the same dispatch with
the `&` call operator. Claude Code ignores the key.

## How `run-hook.cmd` Works at a High Level

`run-hook.cmd` is a polyglot script with a four-line `:;` Unix prologue above
`@echo off`, followed by the Windows batch section:

- **On Unix (`bash`, `zsh`, `sh`)**: `:` is the POSIX no-op builtin, so the
  shell executes the four `:;` lines at the top of the file and `exec`s the
  named hook script before ever reaching `@echo off` or the Windows batch code.
- **On Windows (`cmd.exe`)**: lines starting with `:` are parsed as batch labels
  (ignored silently), so `cmd.exe` skips straight to `@echo off` and runs the
  batch portion below. Bare `#` comments must never appear above `@echo off`,
  because `cmd.exe` would treat `#` as an unknown command before echo is
  suppressed and emit stderr noise.

The dispatcher intentionally avoids heredocs (`<<`): GNU `bash >= 5.1` uses
pipes for heredocs, which can deadlock on macOS when xnu shrinks pipe buffers
to 512 bytes under pressure.

Do not copy an implementation from this document. Read `hooks/run-hook.cmd`
directly when changing the dispatcher, and run `tests/hooks/test-session-start.sh`
afterward.

### How it works on Windows (CMD.exe)

1. `cmd.exe` treats the leading `:;` lines as batch labels, enters `@echo off`,
   validates the script name, and resolves the hook directory from the
   dispatcher's own location (`%~dp0`).
2. It tries bash in four places, in order:
   - `C:\Program Files\Git\bin\bash.exe`
   - `C:\Program Files (x86)\Git\bin\bash.exe`
   - `%LOCALAPPDATA%\Programs\Git\bin\bash.exe` (a per-user Git for Windows
     install), only when `LOCALAPPDATA` is set (`if defined LOCALAPPDATA`
     matters because an unset `LOCALAPPDATA` would collapse the path to
     `\Programs\Git\...` on the current drive, where any user can create it)
   - `bash` on `PATH` (MSYS2, Cygwin, or a non-default Git install), found by
     running `%SystemRoot%\System32\where.exe $PATH:bash`, so neither `where`
     nor `bash` is taken from the current directory. The WSL launchers
     (`bash.exe` in `System32`, `Sysnative`, or
     `%LOCALAPPDATA%\Microsoft\WindowsApps`) and extensionless matches are
     skipped, since the launchers fail when no Linux distro is installed.
     The filters use `for`-variable modifiers (`%%~xB`, `%%~dpB`), which never
     re-expand the path.
3. If bash is found, it runs the named extensionless hook script from the hooks
   directory and exits with the script's exit code (`"%BASH_EXE%"` and
   `exit /b %ERRORLEVEL%` stay outside any parenthesized block because `cmd.exe`
   expands `%ERRORLEVEL%` when parsing a block, which would lose the hook's
   exit code).
4. If no bash is found, the dispatcher exits `0` silently — the plugin
   continues working, it just skips the hook.

### How it works on Unix (bash/zsh/sh/ash)

The four `:;` lines at the top of `hooks/run-hook.cmd` run fork-free across
POSIX shells (`bash`, `zsh`, `dash`, `ash`, and `sh`):

1. If no script name argument is given, the prologue exits `0` quietly.
2. It splits `$0` on its last `/` or `\` (handles Windows paths passed via
   `cmd.exe` or Git Bash) using pure parameter expansion (`${0%[/\\]*}`),
   avoiding `dirname` or `$(cd ... && pwd)` subshell forks that cost tens of
   milliseconds each under Git Bash on Windows.
3. It selects the target shell in order: `"$BASH"` (already set to bash's
   absolute path when invoked by bash, so hooks keep working even when a
   harness spawns `SessionStart` with an empty or broken `PATH`), `bash`
   on `PATH`, `zsh` on `PATH`, `sh` on `PATH`, then `/bin/sh` (so minimal
   `sh`/`ash`/`dash`-only systems like Alpine containers still inject full
   `SessionStart` context using pure POSIX builtins). Only if none exist does it
   exit `0` quietly.
4. It `exec`s `"$shell"` on `"${SCRIPT_DIR}/${SCRIPT_NAME}"` with the
   remaining arguments, replacing the wrapper process before `@echo off`.

### Key design decisions

| Decision | Why |
|----------|-----|
| `:;` prologue instead of a heredoc | Avoids GNU `bash >= 5.1` heredoc pipe deadlocks on macOS under shrunken 512-byte xnu pipes; `:` is both a POSIX no-op and a `cmd.exe` label (no bare `#` comments may precede `@echo off`) |
| `${0%[/\\]*}` instead of `dirname` | Resolves `SCRIPT_DIR` without child-process forks (saving tens of ms per hook under Git Bash on Windows) and handles both `/` and `\` separators |
| `$BASH` → `bash` → `zsh` → `sh` → `/bin/sh` | Survives broken/empty `PATH` when `BASH` is set, supports `zsh`-only and `sh`/`ash`/`dash`-only systems with pure POSIX hook scripts, and exits `0` cleanly if no POSIX shell exists |
| Extensionless scripts | Prevents Claude Code's Windows `.sh`-auto-prepend from interfering with the dispatcher command |
| No `-l` (login shell) | Not needed; hook scripts should be self-contained and not depend on login-shell PATH setup |
| No `cygpath` | Bash receives the Windows path directly and handles it correctly; `cygpath` was needed by the old `-c "..."` invocation pattern, not by direct exec |
| Silent exit on no-bash | Avoids breaking the plugin for users who don't have Git for Windows; hook context injection is skipped gracefully |

## Writing Cross-Platform Hook Scripts

Your hook logic goes in the extensionless script file. A few portable patterns:

### Do
- Use pure POSIX `sh` builtins so scripts run fork-free under bash and work on `sh`/`ash`/`dash`-only hosts
- Use `$(command)` instead of backticks
- Quote all variable expansions: `"$VAR"`

### Avoid
- Bash-only parameter/loop constructs (`${s//a/b}`, `[[ ... ]]`, `$'\n'`, `(( i++ ))`) that fail on `dash` (Debian/Ubuntu `/bin/sh`); busybox `ash` accepts some of them, so test under `dash`
- Heredocs (`<<`) — GNU `bash >= 5.1` feeds them through a pipe that can deadlock on macOS under pipe pressure (#571); build output with `printf`
- Relying on PATH-dependent tools without fallbacks (the hook runs without `-l`, so login-shell PATH is not set)
- Giving scripts a `.sh` extension — this triggers Claude Code's Windows auto-prepend

### Example: JSON escaping without external tools

```sh
nl='
'
tab='	'
if [ -n "${BASH_VERSION:-}" ]; then
  # shellcheck disable=SC3045 # bash builtin avoids a subshell fork (#2081)
  printf -v cr '\r'
else
  cr=$(printf '\r' 2>/dev/null || true)
fi

replace_all() {
  rest=$1
  out=""
  while :; do
    case "$rest" in
      *"$2"*)
        out="${out}${rest%%"$2"*}$3"
        rest=${rest#*"$2"}
        ;;
      *)
        escaped="${out}${rest}"
        break
        ;;
    esac
  done
}

escape_for_json() {
  escaped=$1
  replace_all "$escaped" '\' '\\'
  replace_all "$escaped" '"' '\"'
  [ -z "$cr" ] || replace_all "$escaped" "$cr" '\r'
  replace_all "$escaped" "$nl" '\n'
  replace_all "$escaped" "$tab" '\t'
  using_superpowers_escaped=$escaped
}

# The result is left in a variable instead of printed, because capturing
# output with $(...) forks. Call the function, then read the variable:
#   escape_for_json "$content"
#   json=$using_superpowers_escaped
```

## Troubleshooting

### "bash is not recognized"

CMD couldn't find bash in any of the four locations the dispatcher tries. The dispatcher exits silently (0) rather than erroring, so the hook is skipped. Install Git for Windows (system-wide or per-user) or ensure a non-WSL `bash` is on `PATH`.

### Hook runs on Unix but does nothing on Windows

Check that the script filename is **extensionless** in `hooks.json`. A command like `run-hook.cmd session-start.sh` can trigger Claude Code's `.sh` auto-detection and bypass the intended CMD dispatcher path, or just try to run a non-existent `session-start.sh` script.

### Hook doesn't fire at all

Verify the `matcher` in `hooks.json` matches the event type your harness emits. Claude Code uses `startup|clear|compact`; Cursor uses `sessionStart`. Check `hooks-cursor.json` for the Cursor variant.

## Related Issues

- [anthropics/claude-code#9758](https://github.com/anthropics/claude-code/issues/9758) — `.sh` scripts open in editor on Windows
- [anthropics/claude-code#3417](https://github.com/anthropics/claude-code/issues/3417) — Hooks don't work on Windows
