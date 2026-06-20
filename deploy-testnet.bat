@echo off
echo ========================================
echo   NEXUS AI ($NXI) - BSC Testnet Deploy
echo ========================================
echo.
echo ADIM 1: .env dosyasina private key'inizi yazin
echo.
echo PRIVATE_KEY=0x...
echo.
echo ADIM 2: Test BNB almak icin:
echo   https://testnet.bnbchain.org/faucet-smart
echo.
echo ADIM 3: Deploy etmek icin ENTER'a basin
pause
npx hardhat run scripts/deploy.ts --network bscTestnet
pause
