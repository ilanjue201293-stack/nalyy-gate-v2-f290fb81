@echo off
setlocal
cd /d "%~dp0"

set "RUNTIME=C:\Users\Ilanj\.cache\codex-runtimes\codex-primary-runtime\dependencies"
set "PATH=%RUNTIME%\node\bin;%PATH%"
set "PNPM=%RUNTIME%\bin\pnpm.cmd"

if not exist "%PNPM%" (
  echo Impossible de trouver pnpm Codex.
  echo Installe Node.js depuis https://nodejs.org puis relance ce fichier.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo Nalyy Gate - configuration simple
echo =====================================================
echo.
echo Tu dois seulement coller les infos de ton application Discord.
echo Dans Developer Portal, mets cette Redirect URI:
echo http://localhost:8080/api/auth/discord/callback
echo.

set /p DISCORD_CLIENT_ID=Discord CLIENT ID: 
set /p DISCORD_CLIENT_SECRET=Discord CLIENT SECRET: 
set /p DISCORD_BOT_TOKEN=Discord BOT TOKEN: 
set /p DISCORD_ADMIN_IDS=Ton Discord USER ID admin (optionnel, Entrer si tu ne sais pas): 

for /f "usebackq delims=" %%S in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "[guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')"`) do set "SESSION_SECRET_VALUE=%%S"
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip=(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.*' } | Select-Object -First 1 -ExpandProperty IPAddress); if($ip){$ip}else{'127.0.0.1'}"`) do set "LOADER_IP=%%I"

(
  echo DATABASE_URL="file:./dev.db"
  echo DISCORD_CLIENT_ID=%DISCORD_CLIENT_ID%
  echo DISCORD_CLIENT_SECRET=%DISCORD_CLIENT_SECRET%
  echo DISCORD_BOT_TOKEN=%DISCORD_BOT_TOKEN%
  echo DISCORD_REDIRECT_URI=http://localhost:8080/api/auth/discord/callback
  echo SESSION_SECRET=%SESSION_SECRET_VALUE%
  echo APP_URL=http://localhost:8080
  echo LOADER_BASE_URL=http://%LOADER_IP%:8080
  echo DISCORD_ADMIN_IDS=%DISCORD_ADMIN_IDS%
) > .env

echo.
echo Installation des dependances...
call "%PNPM%" install
if errorlevel 1 goto fail

call "%PNPM%" approve-builds --all

echo.
echo Preparation de la base de donnees...
call "%PNPM%" db:generate
if errorlevel 1 (
  echo.
  echo Prisma est bloque par Windows.
  echo Lance RUN_FIX_PRISMA_LOCK.cmd, puis relance RUN_1_CONFIGURE.cmd.
  goto fail
)

call "%PNPM%" db:push
if errorlevel 1 goto fail

echo.
echo =====================================================
echo OK. Configuration terminee.
echo Maintenant lance: RUN_2_START_ALL.cmd
echo =====================================================
pause
exit /b 0

:fail
echo.
echo Une erreur est arrivee pendant la configuration.
echo Envoie-moi la partie rouge / le message d'erreur exact.
pause
exit /b 1
