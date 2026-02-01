: << 'CMDBLOCK'
@echo off
REM ============================================================================
REM Polyglot wrapper to run .sh scripts cross-platform
REM ============================================================================
REM
REM Claude Code 2.1.x changed the Windows execution model for hooks:
REM
REM   Before (2.0.x): Hooks ran with shell:true, using the system default shell.
REM                   This wrapper provided cross-platform compatibility by
REM                   being both a valid .cmd file (Windows) and bash script.
REM
REM   After (2.1.x):  Claude Code now auto-detects .sh files in hook commands
REM                   and prepends "bash " on Windows. This broke the wrapper
REM                   because the command:
REM                     "run-hook.cmd" session-start.sh
REM                   became:
REM                     bash "run-hook.cmd" session-start.sh
REM                   ...and bash cannot execute a .cmd file.
REM
REM Solution: Pass script names WITHOUT the .sh suffix in hooks.json, and
REM           auto-append .sh inside this wrapper. This avoids Claude Code's
REM           .sh detection while maintaining cross-platform compatibility.
REM
REM Usage: run-hook.cmd <script-name-without-sh> [args...]
REM Example: run-hook.cmd session-start (will execute session-start.sh)
REM ============================================================================

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)
set "SCRIPT_NAME=%~1"
shift
REM Auto-append .sh suffix to avoid Claude Code 2.1.x auto-detecting .sh and prepending bash
REM Disable MSYS2 path conversion to prevent corruption of forwarded arguments
set "MSYS2_ARG_CONV_EXCL=*"
REM Use CLAUDE_BASH_EXE if set, otherwise default to Git Bash
REM Note: %* is not affected by shift in batch, so we use shift inside bash -c to skip the script name
if defined CLAUDE_BASH_EXE (
    "%CLAUDE_BASH_EXE%" -l -c "shift; \"$(cygpath -u \"$CLAUDE_PLUGIN_ROOT\")/hooks/%SCRIPT_NAME%.sh\" \"$@\"" -- %*
) else (
    "C:\Program Files\Git\bin\bash.exe" -l -c "shift; \"$(cygpath -u \"$CLAUDE_PLUGIN_ROOT\")/hooks/%SCRIPT_NAME%.sh\" \"$@\"" -- %*
)
exit /b
CMDBLOCK

# Unix shell runs from here
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
if [ -z "$SCRIPT_NAME" ]; then
    echo "run-hook.cmd: missing script name" >&2
    exit 1
fi
shift
# Auto-append .sh suffix to match Windows behavior
"${SCRIPT_DIR}/${SCRIPT_NAME}.sh" "$@"
