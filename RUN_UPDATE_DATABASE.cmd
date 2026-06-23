@echo off
setlocal
cd /d "%~dp0"

set "RUNTIME=C:\Users\Ilanj\.cache\codex-runtimes\codex-primary-runtime\dependencies"
set "PATH=%RUNTIME%\node\bin;%PATH%"
set "PNPM=%RUNTIME%\bin\pnpm.cmd"

echo.
echo =====================================================
echo Nalyy Gate - mise a jour base de donnees
echo =====================================================
echo.
echo Ce script ferme node.exe pour debloquer Prisma.
echo Ferme le site et le bot avant de continuer.
echo.
pause

taskkill /F /IM node.exe >nul 2>nul
timeout /t 3 /nobreak >nul

echo Nettoyage Prisma temporaire...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path .\node_modules -Recurse -Filter 'query_engine-windows.dll.node.tmp*' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue"

echo Generation Prisma...
call "%PNPM%" db:generate
if errorlevel 1 goto fail

echo Application du schema...
call "%PNPM%" db:push
if errorlevel 1 goto fail

echo.
echo OK. Base mise a jour.
echo Relance maintenant RUN_2_START_ALL.cmd
pause
exit /b 0

:fail
echo.
echo La mise a jour a echoue.
echo Si Prisma parle de EPERM, redemarre le PC puis relance ce fichier avant le site/bot.
pause
exit /b 1
