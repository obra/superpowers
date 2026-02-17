: << 'CMDBLOCK'
@echo off
REM ============================================================================
REM Polyglot wrapper for session-start hook - works on both Windows and Unix
REM ============================================================================
REM
REM On Windows: Claude Code runs hooks through CMD.exe, which cannot execute
REM .sh files directly. This wrapper invokes bash to run the .sh script.
REM
REM On Unix: The shell portion below runs instead.
REM ============================================================================

if "%CLAUDE_PLUGIN_ROOT%"=="" (
    echo Error: CLAUDE_PLUGIN_ROOT environment variable not set >&2
    exit /b 1
)
REM Determine the directory where this script resides
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
REM Call the bash script with the same directory
"C:\Program Files\Git\bin\bash.exe" -l "%SCRIPT_DIR%/session-start.sh"
exit /b
CMDBLOCK

# Unix shell runs from here
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
"${SCRIPT_DIR}/session-start.sh"
