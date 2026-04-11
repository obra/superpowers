# Cross-Platform Polyglot Hooks for Claude Code

Claude Code plugins need hooks that work on Windows, macOS, and Linux. This document explains the polyglot wrapper technique that makes this possible.

## The Problem

Claude Code runs hook commands through the system's default shell:
- **Windows**: CMD.exe
- **macOS/Linux**: bash or sh

This creates several challenges:

1. **Script execution**: Windows CMD can't execute `.sh` files directly - it tries to open them in a text editor
2. **Path format**: Windows uses backslashes (`C:\path`), Unix uses forward slashes (`/path`)
3. **Environment variables**: `$VAR` syntax doesn't work in CMD
4. **No `bash` in PATH**: Even with Git Bash installed, `bash` isn't in the PATH when CMD runs

## The Solution: Polyglot `.cmd` Wrapper

A polyglot script is valid syntax in multiple languages simultaneously. Our wrapper is valid in both CMD and bash:

```cmd
: << 'CMDBLOCK'
@echo off
"C:\Program Files\Git\bin\bash.exe" -l -c "\"$(cygpath -u \"$CLAUDE_PLUGIN_ROOT\")/hooks/session-start.sh\""
exit /b
CMDBLOCK

# Unix shell runs from here
"${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh"
```

### How It Works

#### On Windows (CMD.exe)

1. `: << 'CMDBLOCK'` - CMD sees `:` as a label (like `:label`) and ignores `<< 'CMDBLOCK'`
2. `@echo off` - Suppresses command echoing
3. The bash.exe command runs with:
   - `-l` (login shell) to get proper PATH with Unix utilities
   - `cygpath -u` converts Windows path to Unix format (`C:\foo` → `/c/foo`)
4. `exit /b` - Exits the batch script, stopping CMD here
5. Everything after `CMDBLOCK` is never reached by CMD

#### On Unix (bash/sh)

1. `: << 'CMDBLOCK'` - `:` is a no-op, `<< 'CMDBLOCK'` starts a heredoc
2. Everything until `CMDBLOCK` is consumed by the heredoc (ignored)
3. `# Unix shell runs from here` - Comment
4. The script runs directly with the Unix path

## File Structure

The current implementation uses a reusable polyglot dispatcher with extensionless hook scripts:

```
hooks/
├── hooks.json           # Points to run-hook.cmd with script name
├── hooks-cursor.json    # Cursor-specific hook config
├── run-hook.cmd         # Reusable polyglot dispatcher (cross-platform entry point)
└── session-start        # Actual hook logic (bash script, no extension)
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
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start"
          }
        ]
      }
    ]
  }
}
```

Note: The script name is passed without extension. The `run-hook.cmd` dispatcher handles cross-platform execution.

## Requirements

### Windows
- **Git for Windows** must be installed (provides `bash.exe`)
- Default installation path: `C:\Program Files\Git\bin\bash.exe`
- If Git Bash is not installed, the hook will display a clear error message directing the user to install Git for Windows from https://git-scm.com/download/win
- The dispatcher also checks for `bash` on PATH (MSYS2, Cygwin, user-installed Git Bash)

### Unix (macOS/Linux)
- Standard bash or sh shell
- The `.cmd` file must have execute permission (`chmod +x`)

## Writing Cross-Platform Hook Scripts

Your actual hook logic goes in the `.sh` file. To ensure it works on Windows (via Git Bash):

### Do:
- Use pure bash builtins when possible
- Use `$(command)` instead of backticks
- Quote all variable expansions: `"$VAR"`
- Use `printf` or here-docs for output

### Avoid:
- External commands that may not be in PATH (sed, awk, grep)
- If you must use them, they're available in Git Bash but ensure PATH is set up (use `bash -l`)

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

The project uses a generic `run-hook.cmd` dispatcher that takes the script name as an argument:

### run-hook.cmd (actual implementation)
```cmd
: << 'CMDBLOCK'
@echo off
set "HOOK_DIR=%~dp0"

REM Try Git for Windows bash in standard locations
if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

REM Try bash on PATH
where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

REM No bash found - print clear error message
echo WARNING: Git Bash not found. Superpowers SessionStart hook requires Git Bash on Windows. >&2
echo Install Git for Windows from https://git-scm.com/download/win >&2
echo Or add Git Bash to your PATH. >&2
exit /b 1
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

### hooks.json using the reusable wrapper
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start"
          }
        ]
      }
    ]
  }
}
```

### hooks-cursor.json
```json
{
  "hooks": [
    {
      "hookPoint": "sessionStart",
      "command": "./hooks/session-start"
    }
  ]
}
```

Note: Cursor hooks point directly to the hook script (no wrapper needed since Cursor handles cross-platform differently).

## Troubleshooting

### "bash is not recognized" or "Git Bash not found"
The dispatcher searches for Git Bash in standard locations (`C:\Program Files\Git\bin\bash.exe`, `C:\Program Files (x86)\Git\bin\bash.exe`) and on PATH. If none are found, a clear error message will be displayed directing you to install Git for Windows.

### Works in terminal but not as hook
Claude Code may run hooks differently. Test by simulating the hook environment:
```powershell
$env:CLAUDE_PLUGIN_ROOT = "C:\path\to\plugin"
cmd /c "C:\path\to\plugin\hooks\run-hook.cmd session-start"
```

### "No such file or directory" for the hook script
Ensure the hook script name passed to `run-hook.cmd` matches the actual filename (without extension). The hook scripts use extensionless names (e.g., `session-start`, not `session-start.sh`).

## Related Issues

- [anthropics/claude-code#9758](https://github.com/anthropics/claude-code/issues/9758) - .sh scripts open in editor on Windows
- [anthropics/claude-code#3417](https://github.com/anthropics/claude-code/issues/3417) - Hooks don't work on Windows
- [anthropics/claude-code#6023](https://github.com/anthropics/claude-code/issues/6023) - CLAUDE_PROJECT_DIR not found
