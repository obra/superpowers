: << 'CMDBLOCK'
@echo off
REM Polyglot wrapper: runs .sh scripts cross-platform
REM Usage: run-hook.cmd <script-name> [args...]
REM The script should be in the same directory as this wrapper

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

REM Try to find bash.exe in common locations
set "BASH_EXE="

REM Check PATH first
for /f "delims=" %%i in ('where bash 2^>nul') do (
    set "BASH_EXE=%%i"
    goto :found
)

REM Fallback to common Git installation paths
if exist "C:\Program Files\Git\bin\bash.exe" (
    set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"
    goto :found
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    set "BASH_EXE=C:\Program Files (x86)\Git\bin\bash.exe"
    goto :found
)
if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" (
    set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
    goto :found
)

REM Not found
echo Error: bash.exe not found. Please install Git for Windows. >&2
exit /b 1

:found
"%BASH_EXE%" -l "%~dp0%~1" %2 %3 %4 %5 %6 %7 %8 %9
exit /b
CMDBLOCK

# Unix shell runs from here
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
"${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
