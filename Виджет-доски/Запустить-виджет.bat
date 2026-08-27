@echo off
setlocal
title Goal Board Widget
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js is not installed. Get it from https://nodejs.org first.
  pause
  exit /b 1
)

rem Download Electron binary from a fast mirror (only affects this session)
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

set ELECTRON_PATH=node_modules\electron\dist\electron.exe

if not exist node_modules (
  echo First launch: installing libraries, please wait a few minutes...
  call npm install --no-audit --no-fund
)

rem --- repair step 1: run Electron's own downloader directly ---
if not exist "%ELECTRON_PATH%" (
  echo The Electron app file is missing. Trying to download it directly...
  if exist "node_modules\electron\install.js" (
    node "node_modules\electron\install.js"
  )
)

rem --- repair step 2: full clean reinstall ---
if not exist "%ELECTRON_PATH%" (
  echo Still missing. Doing a full clean reinstall, please wait...
  rd /s /q node_modules 2>nul
  del /q package-lock.json 2>nul
  call npm install --no-audit --no-fund
  if exist "node_modules\electron\install.js" (
    node "node_modules\electron\install.js"
  )
)

if not exist "%ELECTRON_PATH%" (
  echo.
  echo [X] ERROR: electron app file still not found at %CD%
  echo     1. Check Windows Security - Protection history:
  echo        the antivirus may be quarantining electron.exe.
  echo     2. Or open a terminal in this folder and run:  npm run start
  echo.
  pause
  exit /b 1
)

start "" "%ELECTRON_PATH%" "%~dp0"
exit /b 0
