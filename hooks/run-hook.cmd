:; [ $# -ge 1 ] || exit 0
:; case "$0" in */*|*\\*) SCRIPT_DIR="${0%[/\\]*}" ;; *) SCRIPT_DIR="." ;; esac
:; if [ -n "${BASH:-}" ]; then shell="$BASH"; elif command -v bash >/dev/null 2>&1; then shell="bash"; elif command -v zsh >/dev/null 2>&1; then shell="zsh"; elif command -v sh >/dev/null 2>&1; then shell="sh"; elif [ -x /bin/sh ]; then shell="/bin/sh"; else exit 0; fi
:; SCRIPT_NAME="$1"; shift; exec "$shell" "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
@echo off
REM Polyglot hook dispatcher - see docs/windows/polyglot-hooks.md

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

setlocal
set "HOOK_DIR=%~dp0"
set "BASH_EXE="

if exist "C:\Program Files\Git\bin\bash.exe" set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"
if not defined BASH_EXE if exist "C:\Program Files (x86)\Git\bin\bash.exe" set "BASH_EXE=C:\Program Files (x86)\Git\bin\bash.exe"
if not defined BASH_EXE if defined LOCALAPPDATA if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
if not defined BASH_EXE if defined SystemRoot for /f "delims=" %%B in ('"%SystemRoot%\System32\where.exe" $PATH:bash 2^>nul') do if not defined BASH_EXE if not "%%~xB"=="" if /i not "%%~dpB"=="%SystemRoot%\System32\" if /i not "%%~dpB"=="%SystemRoot%\Sysnative\" if /i not "%%~dpB"=="%LOCALAPPDATA%\Microsoft\WindowsApps\" set "BASH_EXE=%%B"

if not defined BASH_EXE exit /b 0

"%BASH_EXE%" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
exit /b %ERRORLEVEL%
