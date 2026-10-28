@echo off
setlocal
cd /d %~dp0

echo ========================================
echo VIN Mapping System - Full Setup

echo ========================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Install Node.js 18 or newer, then run SETUP.bat again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not available.
  pause
  exit /b 1
)

echo Node version:
node -v
echo npm version:
npm -v

echo.
echo Installing frontend, backend and root dependencies...
npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo Setup completed successfully.
echo Run START.bat to start the system.
pause
