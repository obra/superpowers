: << 'CMDBLOCK'
@echo off
REM Cross-platform polyglot wrapper for hook scripts.
REM On Windows: cmd.exe runs the batch portion, which finds and calls bash.
REM On Unix: the shell interprets this as a script (: is a no-op in bash).
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

setlocal
set "HOOK_DIR=%~dp0"
set "BASH_EXE="

REM Git for Windows in its standard system-wide locations
if exist "C:\Program Files\Git\bin\bash.exe" set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"
if not defined BASH_EXE if exist "C:\Program Files (x86)\Git\bin\bash.exe" set "BASH_EXE=C:\Program Files (x86)\Git\bin\bash.exe"

REM Per-user Git for Windows install (no admin rights needed). The defined
REM check matters: with LOCALAPPDATA unset the path would collapse to
REM \Programs\Git\... on the current drive, where any user can create it.
if not defined BASH_EXE if defined LOCALAPPDATA if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"

REM bash on PATH (MSYS2, Cygwin, a non-default Git install). where.exe is
REM called by full path and with $PATH: so neither it nor bash can come from
REM the current directory. The filters use for-variable modifiers, which never
REM re-expand the path, and skip extensionless matches and the WSL launchers
REM (System32, Sysnative, the Store alias in WindowsApps), which fail when no
REM Linux distro is installed.
if not defined BASH_EXE if defined SystemRoot for /f "delims=" %%B in ('"%SystemRoot%\System32\where.exe" $PATH:bash 2^>nul') do if not defined BASH_EXE if not "%%~xB"=="" if /i not "%%~dpB"=="%SystemRoot%\System32\" if /i not "%%~dpB"=="%SystemRoot%\Sysnative\" if /i not "%%~dpB"=="%LOCALAPPDATA%\Microsoft\WindowsApps\" set "BASH_EXE=%%B"

REM No bash found - exit silently rather than error
REM (plugin still works, just without SessionStart context injection)
if not defined BASH_EXE exit /b 0

REM Run bash outside any parenthesized block: cmd expands %ERRORLEVEL%
REM inside a block when it parses the block, which would lose the hook's
REM exit code.
"%BASH_EXE%" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
exit /b %ERRORLEVEL%
CMDBLOCK

# Unix: run the named script directly
# Splits $0 on its last / or \ (cmd passes Windows paths) instead of calling
# dirname, and uses $BASH (bash's own absolute path, always set once bash is
# running) instead of a PATH lookup for bash, so this keeps working when
# Claude Code spawns the SessionStart hook with a broken/empty PATH
# (anthropics/claude-code#43127).
case "$0" in
  */*|*\\*) SCRIPT_DIR="$(cd "${0%[/\\]*}" && pwd)" ;;
  *) SCRIPT_DIR="$(pwd)" ;;
esac
SCRIPT_NAME="$1"
shift
exec "${BASH:-bash}" "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
