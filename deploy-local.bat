@echo off
title Nexus AI - Local Deploy
echo ========================================
echo   NEXUS AI ($NXI) - Local Deploy
echo ========================================
echo.
echo Local node calisiyor mu? (start-local-node.bat)
echo Eger calisiyorsa deploy basliyor...
echo.
cd /d "%~dp0"
npx hardhat run scripts/deploy.ts --network localhost
echo.
echo Yukaridaki "deployed to:" adresini kaydet!
pause
