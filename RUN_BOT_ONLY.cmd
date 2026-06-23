@echo off
setlocal
cd /d "%~dp0"

set "RUNTIME=C:\Users\Ilanj\.cache\codex-runtimes\codex-primary-runtime\dependencies"
set "PATH=%RUNTIME%\node\bin;%PATH%"
set "PNPM=%RUNTIME%\bin\pnpm.cmd"

if not exist "%PNPM%" (
  echo pnpm introuvable.
  pause
  exit /b 1
)

call "%PNPM%" bot
pause
