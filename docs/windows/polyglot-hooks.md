# Cross-Platform Polyglot Hooks

Superpowers plugin hooks need to work on Windows, macOS, and Linux across the
agent harnesses that support startup hooks. This document explains the
polyglot wrapper technique that makes this possible.

## The Problem

Hook commands may run through the system's default shell:

- **Windows**: CMD.exe
- **macOS/Linux**: bash or sh

This creates several challenges:

1. **Script execution**: Windows CMD can't execute shell scripts directly.
2. **Path format**: Windows uses backslashes (`C:\path`), Unix uses forward slashes (`/path`).
3. **Environment variables**: `$VAR` syntax doesn't work in CMD.
4. **No `bash` in PATH**: Even with Git Bash installed, `bash` isn't always in the PATH when CMD runs.

## The Solution: Polyglot `run-hook.cmd` Wrapper

A polyglot script is valid syntax in multiple languages simultaneously. Our
wrapper is valid in both CMD and bash. Manifests point to `run-hook.cmd` and
pass the extensionless hook script name:

```cmd
: << 'CMDBLOCK'
@echo off
if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

set "HOOK_DIR=%~dp0"

if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

exit /b 0
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

### How It Works

#### On Windows (CMD.exe)

1. `: << 'CMDBLOCK'` - CMD sees `:` as a label and ignores `<< 'CMDBLOCK'`.
2. `@echo off` - Suppresses command echoing.
3. The bash.exe command runs the requested hook script next to the wrapper.
4. `exit /b` - Exits the batch script, stopping CMD here.
5. Everything after `CMDBLOCK` is never reached by CMD.

#### On Unix (bash/sh)

1. `: << 'CMDBLOCK'` - `:` is a no-op, `<< 'CMDBLOCK'` starts a heredoc.
2. Everything until `CMDBLOCK` is consumed by the heredoc and ignored.
3. `# Unix shell runs from here` - Comment.
4. The requested hook script runs directly with the Unix path.

## File Structure

```text
hooks/
|-- hooks.json
|-- hooks-codex.json
|-- hooks-cursor.json
|-- run-hook.cmd
`-- session-start
```

### `hooks/hooks.json` (Claude Code)

`hooks/hooks.json` is the Claude Code manifest:

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
            "async": false
          }
        ]
      }
    ]
  }
}
```

### `hooks/hooks-codex.json` (Codex)

`hooks/hooks-codex.json` is the Codex-specific manifest. Codex uses the
verified `${PLUGIN_ROOT}` placeholder and the `startup|resume|clear` matcher:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear",
        "hooks": [
          {
            "type": "command",
            "command": "\"${PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "async": false
          }
        ]
      }
    ]
  }
}
```

Note: The path must be quoted because plugin roots may contain spaces on
Windows, for example `C:\Program Files\...`.

## Requirements

### Windows

- **Git for Windows** must be installed if no other Bash is available.
- Default installation path: `C:\Program Files\Git\bin\bash.exe`
- If Git is installed elsewhere, `run-hook.cmd` also tries `bash` on PATH.

### Unix (macOS/Linux)

- Standard bash or sh shell
- `run-hook.cmd` must have execute permission (`chmod +x`)

## Writing Cross-Platform Hook Scripts

Your actual hook logic goes in the extensionless hook script. To ensure it
works on Windows via Git Bash:

### Do:

- Use pure bash builtins when possible
- Use `$(command)` instead of backticks
- Quote all variable expansions: `"$VAR"`
- Use `printf` or here-docs for output

### Avoid:

- External commands that may not be in PATH (sed, awk, grep)
- If you must use them, they're available in Git Bash but ensure PATH is set up

### Example: JSON Escaping Without sed/awk

Instead of:

```bash
escaped=$(echo "$content" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
```

Use pure bash:

```bash
escape_for_json() {
    local input="$1"
    local output=""
    local i char
    for (( i=0; i<${#input}; i++ )); do
        char="${input:$i:1}"
        case "$char" in
            $'\\') output+='\\' ;;
            '"') output+='\"' ;;
            $'\n') output+='\n' ;;
            $'\r') output+='\r' ;;
            $'\t') output+='\t' ;;
            *) output+="$char" ;;
        esac
    done
    printf '%s' "$output"
}
```

## Reusable Wrapper Pattern

For plugins with multiple hooks, use the generic wrapper with the script name
as an argument:

### `run-hook.cmd`

```cmd
: << 'CMDBLOCK'
@echo off
if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

set "HOOK_DIR=%~dp0"

if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

exit /b 0
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

### Manifest using the reusable wrapper

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" validate-bash"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### "bash is not recognized"

CMD can't find bash. The wrapper checks common Git for Windows paths and then
tries `bash` on PATH. If Bash is installed elsewhere, update the path.

### "cygpath: command not found" or "dirname: command not found"

Bash isn't running in the environment you expected. Make sure the wrapper is
calling the intended Bash installation.

### Path has weird `\/` in it

`${CLAUDE_PLUGIN_ROOT}` expanded to a Windows path ending with backslash, then
`/hooks/...` was appended. Route through `run-hook.cmd` so the Windows branch
uses the wrapper directory directly.

### Script opens in text editor instead of running

The manifest is pointing directly to the shell script. Point to `run-hook.cmd`
instead.

### Works in terminal but not as hook

Claude Code may run hooks differently. Test by simulating the hook environment:

```powershell
$env:CLAUDE_PLUGIN_ROOT = "C:\path\to\plugin"
cmd /c "C:\path\to\plugin\hooks\run-hook.cmd session-start"
```

## Related Issues

- [anthropics/claude-code#9758](https://github.com/anthropics/claude-code/issues/9758) - shell scripts open in editor on Windows
- [anthropics/claude-code#3417](https://github.com/anthropics/claude-code/issues/3417) - Hooks don't work on Windows
- [anthropics/claude-code#6023](https://github.com/anthropics/claude-code/issues/6023) - CLAUDE_PROJECT_DIR not found
