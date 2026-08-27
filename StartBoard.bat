@echo off
title Goal Board - keep this window open
cd /d "%~dp0"

if not exist node_modules (
    echo.
    echo First launch: installing libraries, may take a few minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. Check internet connection and Node.js.
        pause
        exit /b 1
    )
)

echo.
echo Starting the board... Browser will open automatically.
echo You can minimize this window. Close it when you are done.
echo.
call npx vite --open
