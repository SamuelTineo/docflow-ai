@echo off
title DocFlow AI

echo Iniciando DocFlow AI...

start "DocFlow Backend" /min cmd /c "cd /d "%~dp0backend" && .venv\Scripts\uvicorn.exe main:app --port 8000"
timeout /t 3 /nobreak >nul
start "DocFlow Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

start http://localhost:3000
