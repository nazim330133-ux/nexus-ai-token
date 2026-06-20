@echo off
title Nexus AI - Tek Tik Calistir
echo ========================================
echo   NEXUS AI ($NXI) - Tek Tik Cozum
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Bagimliliklar kontrol ediliyor...
if not exist "node_modules" (
    echo    npm install yukleniyor...
    call npm install
)

echo [2/3] Token derleniyor...
call npx hardhat compile >nul 2>&1

echo [3/3] Token deploy ediliyor...
echo.
npx hardhat run scripts\demo.ts
echo.
echo ========================================
echo   ISLEM TAMAMLANDI!
echo   Token bilgileri yukarida.
echo ========================================
echo.
echo TESTNET ICIN (ileride):
echo 1) .env dosyasina private key ekle
echo 2) Bir arkadasindan test BNB iste
echo 3) su komutu calistir:
echo    npx hardhat run scripts\deploy.ts --network bscTestnet
echo.
pause
