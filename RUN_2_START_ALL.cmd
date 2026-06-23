@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo Il manque le fichier .env.
  echo Lance d'abord RUN_1_CONFIGURE.cmd
  pause
  exit /b 1
)

start "Nalyy Gate Site" cmd /k "%~dp0RUN_SITE_ONLY.cmd"
timeout /t 3 /nobreak >nul
start "Nalyy Gate Bot" cmd /k "%~dp0RUN_BOT_ONLY.cmd"
timeout /t 8 /nobreak >nul
start "" "http://localhost:8080/login"

echo.
echo Site et bot lances dans deux fenetres separees.
echo Site: http://localhost:8080
echo Login: http://localhost:8080/login
echo.
pause
