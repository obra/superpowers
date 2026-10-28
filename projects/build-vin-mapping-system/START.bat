@echo off
setlocal
cd /d %~dp0

echo ========================================
echo Starting VIN Mapping System

echo Frontend: http://localhost:5173
echo Backend : http://localhost:3001

echo ========================================

if not exist node_modules (
  echo Dependencies are not installed.
  echo Running npm install first...
  npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

npm run dev
