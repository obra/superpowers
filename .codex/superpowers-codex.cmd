@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_PATH=%SCRIPT_DIR%superpowers-codex"
for %%I in (node.exe) do set "NODE_BIN=%%~$PATH:I"
if not defined NODE_BIN (
  echo [superpowers] Node.js is required but was not found in PATH.
  exit /b 1
)
"%NODE_BIN%" "%SCRIPT_PATH%" %*
