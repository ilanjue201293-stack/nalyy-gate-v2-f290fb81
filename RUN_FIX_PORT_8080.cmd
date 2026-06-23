@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo Il manque .env. Lance d'abord RUN_1_CONFIGURE.cmd
  pause
  exit /b 1
)

echo Correction du port Discord/site vers 8080...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='.env'; $txt=Get-Content $p -Raw; $txt=$txt -replace 'http://localhost:5173','http://localhost:8080'; Set-Content -Encoding UTF8 $p $txt"

echo.
echo OK.
echo Maintenant dans Discord Developer Portal, ajoute cette Redirect URI:
echo http://localhost:8080/api/auth/discord/callback
echo.
echo Puis relance RUN_2_START_ALL.cmd et va sur:
echo http://localhost:8080/login
pause
