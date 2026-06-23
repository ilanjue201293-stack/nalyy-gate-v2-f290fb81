@echo off
setlocal
cd /d "%~dp0"

set "RUNTIME=C:\Users\Ilanj\.cache\codex-runtimes\codex-primary-runtime\dependencies"
set "PATH=%RUNTIME%\node\bin;%PATH%"
set "PNPM=%RUNTIME%\bin\pnpm.cmd"

echo.
echo =====================================================
echo Nalyy Gate - reparation Prisma bloque par Windows
echo =====================================================
echo.
echo Ferme les fenetres du site/bot si elles sont ouvertes.
echo Ce script va aussi fermer les processus node.exe pour debloquer Prisma.
echo.
pause

taskkill /F /IM node.exe >nul 2>nul
timeout /t 3 /nobreak >nul

echo Nettoyage des fichiers Prisma temporaires...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path .\node_modules -Recurse -Filter 'query_engine-windows.dll.node.tmp*' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue; Get-ChildItem -Path .\node_modules -Recurse -Filter 'query_engine-windows.dll.node' -ErrorAction SilentlyContinue | ForEach-Object { try { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop } catch {} }"

echo Regeneration Prisma...
set TRY=0
:retry_generate
set /a TRY=%TRY%+1
call "%PNPM%" db:generate
if not errorlevel 1 goto generate_ok
if %TRY% GEQ 5 goto fail
echo Prisma est encore bloque, nouvelle tentative dans 5 secondes...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 5 /nobreak >nul
goto retry_generate

:generate_ok

echo Preparation base de donnees...
call "%PNPM%" db:push
if errorlevel 1 goto fail

echo.
echo OK. Prisma est repare.
echo Tu peux lancer RUN_2_START_ALL.cmd
pause
exit /b 0

:fail
echo.
echo Prisma bloque encore.
echo Redemarre le PC, puis lance directement RUN_FIX_PRISMA_LOCK.cmd avant le site/bot.
pause
exit /b 1
