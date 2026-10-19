@echo off
title Biblioteca Draconica
echo ===================================================
echo   BIBLIOTECA DRACONICA - SERVIDOR PYTHON
echo ===================================================
echo Iniciando o servidor Flask e o Banco de Dados SQLite...
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5000
python backend\app.py
pause
