@echo off
cd /d "%~dp0"
title Goal Board Widget

rem Faster and more reliable download source for the Electron engine
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo  ERROR: npm was not found on this computer.
  echo  Please install Node.js from https://nodejs.org first, then try again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo.
  echo ============================================================
  echo  FIRST LAUNCH or REPAIR: downloading Electron ^(about 100 MB^).
  echo  This happens once and can take a few minutes. Please wait.
  echo ============================================================
  echo.
  if not exist "node_modules" (
    call npm install --no-audit --no-fund
  )
  if not exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo  The engine file is missing. Re-downloading it from a mirror...
    echo.
    rd /s /q "node_modules\electron" 2>nul
    call npm install electron --no-audit --no-fund --force
  )
  if not exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo  ERROR: still cannot download the engine file.
    echo  Please check your internet connection and run this file again.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo  Starting Goal Board widget...
echo.
start "" "node_modules\electron\dist\electron.exe" "%~dp0"
exit
