@echo off
title Nexus AI - Local Blockchain Node
echo ========================================
echo   NEXUS AI ($NXI) - Local Blockchain
echo ========================================
echo.
echo Local blockchain baslatiliyor...
echo Surekli calisacak, kapatmak icin Ctrl+C
echo.
cd /d "%~dp0"
npx hardhat node
pause
