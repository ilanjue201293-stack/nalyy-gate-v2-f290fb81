@echo off
setlocal
cd /d "%~dp0"

echo.
echo =====================================================
echo Nalyy Gate - fix session Discord
echo =====================================================
echo.
echo Ce fix est applique dans le code.
echo Maintenant:
echo 1. Ferme les fenetres du site.
echo 2. Relance RUN_2_START_ALL.cmd
echo 3. Dans le navigateur, va sur:
echo    http://localhost:8080/api/auth/me
echo 4. Si tu vois une erreur 401, retourne sur:
echo    http://localhost:8080/login
echo    puis reconnecte-toi avec Discord.
echo.
echo Si tu etais deja connecte avec l'ancien cookie, supprime les cookies localhost dans le navigateur.
echo Le plus simple: ouvre une fenetre InPrivate et va sur http://localhost:8080/login
echo.
pause
