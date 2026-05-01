: << 'CMDBLOCK'
@echo off
REM ============================================================================
REM DEPRECATED: This polyglot wrapper is no longer used as of Claude Code 2.1.x
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
REM The fix: hooks.json now calls session-start.sh directly. Claude Code 2.1.x
REM handles the bash invocation automatically on Windows.
REM
REM This file is kept for reference and potential backward compatibility.
REM ============================================================================
REM
REM Original purpose: Polyglot wrapper to run .sh scripts cross-platform
REM Usage: run-hook.cmd <script-name> [args...]
REM The script should be in the same directory as this wrapper

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)
"C:\Program Files\Git\bin\bash.exe" -l "%~dp0%~1" %2 %3 %4 %5 %6 %7 %8 %9
exit /b
CMDBLOCK

# Unix shell runs from here
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
"${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
