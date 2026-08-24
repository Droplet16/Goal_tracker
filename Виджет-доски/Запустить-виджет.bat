@echo off
cd /d "%~dp0"
title Goal Board Widget

if not exist "node_modules\electron\dist\electron.exe" (
  echo ============================================================
  echo  FIRST LAUNCH: downloading Electron, about 100 MB, one time.
  echo  It may take a few minutes - just wait.
  echo ============================================================
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo npm install failed. Check internet connection and Node.js.
    pause
    exit /b 1
  )
)

start "" "node_modules\electron\dist\electron.exe" "%~dp0"
exit
