@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Доска цели - виджет

if not exist "node_modules\electron\dist\electron.exe" (
  echo.
  echo ============================================================
  echo  Первый запуск: скачиваю Electron ^(около 100 МБ, один раз^).
  echo  Это может занять несколько минут - просто подожди.
  echo ============================================================
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo Не получилось установить. Проверь интернет и Node.js ^(nodejs.org^).
    pause
    exit /b 1
  )
)

start "" "node_modules\electron\dist\electron.exe" "%~dp0"
exit
