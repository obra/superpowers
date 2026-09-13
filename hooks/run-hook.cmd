:; command -v bash >/dev/null 2>&1 || exit 0
:; [ $# -ge 1 ] || exit 0
:; SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
:; SCRIPT_NAME="$1"; shift; exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
@echo off
REM Cross-platform polyglot wrapper for hook scripts.
REM On Unix: POSIX shells execute the ":;" lines above and exec away before
REM reaching this batch block (":" is a no-op; cmd.exe treats lines starting
REM with ":" as labels and skips them). If bash or the script name is
REM missing, the wrapper exits 0 silently - hooks are optional context, never
REM a session breaker.
REM On Windows: cmd.exe runs this batch portion, which finds and calls bash.
REM
REM Heredocs are banned in this file and every hooks/ executable: bash 5.1+
REM delivers them via a pre-fork pipe write that deadlocks on macOS under
REM pipe pressure (issue #571). tests/hooks/test-no-heredocs-in-hooks.sh is
REM the fence.
REM
REM Hook scripts use extensionless filenames (e.g. "session-start" not
REM "session-start.sh") so Claude Code's Windows auto-detection -- which
REM prepends "bash" to any command containing .sh -- doesn't interfere.
REM
REM Usage: run-hook.cmd <script-name> [args...]

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

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

REM Try bash on PATH (e.g. user-installed Git Bash, MSYS2, Cygwin)
where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

REM No bash found - exit silently rather than error
exit /b 0
