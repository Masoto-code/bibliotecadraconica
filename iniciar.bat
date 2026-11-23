@echo off
title Biblioteca Draconica - Django
echo ===================================================
echo   BIBLIOTECA DRACONICA - SERVIDOR DJANGO
echo ===================================================
echo Iniciando o servidor Django e Banco de Dados SQLite...
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5000
python manage.py runserver 0.0.0.0:5000
pause
