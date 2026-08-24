@echo off
chcp 65001 >nul
title Доска цели — не закрывай это окно
cd /d "%~dp0"

if not exist node_modules (
    echo.
    echo Первый запуск: устанавливаю библиотеки, это займёт пару минут...
    echo.
    call npm install
)

echo.
echo Запускаю доску... Браузер откроется сам.
echo Это окно можно свернуть. Закрой его, когда закончишь.
echo.
call npx vite --open
