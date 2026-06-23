@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo Il manque .env. Lance d'abord RUN_1_CONFIGURE.cmd
  pause
  exit /b 1
)

echo.
echo =====================================================
echo Nalyy Gate - URL loader Roblox
echo =====================================================
echo.
echo Dans la fenetre du site, tu vois une ligne du style:
echo Network: http://192.168.1.28:8080/
echo.
echo Copie seulement l'IP, exemple: 192.168.1.28
echo.
set /p LOADER_IP=IP du Network: 

if "%LOADER_IP%"=="" (
  echo IP vide. Annule.
  pause
  exit /b 1
)

echo Correction de l'URL du loader Roblox...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='.env'; $ip='%LOADER_IP%'; $line='LOADER_BASE_URL=http://'+$ip+':8080'; $txt=Get-Content $p -Raw; if($txt -match '(?m)^LOADER_BASE_URL='){ $txt=$txt -replace '(?m)^LOADER_BASE_URL=.*$', $line } else { $txt=$txt.TrimEnd()+[Environment]::NewLine+$line+[Environment]::NewLine }; Set-Content -Encoding UTF8 $p $txt; Write-Host ('Loader URL: http://'+$ip+':8080')"

echo.
echo OK. Ferme puis relance le bot avec RUN_BOT_ONLY.cmd.
echo Ensuite refais Get Script pour recevoir un nouveau loader.
pause
