@echo off
cd /d "%~dp0"
echo ========================================
echo   NEXUS AI ($NXI) - SOSYAL BOT BASLATICI
echo ========================================
echo.
echo 1 - Telegram Bot'u baslat
echo 2 - Discord Bot'u baslat
echo 3 - Bagimliliklari yukle (Telegram)
echo 4 - Bagimliliklari yukle (Discord)
echo 5 - Cikis
echo.

set /p secim="Secim (1-5): "

if "%secim%"=="1" (
  cd telegram
  echo Telegram Bot baslatiliyor...
  node bot.js
  pause
)
if "%secim%"=="2" (
  cd discord
  echo Discord Bot baslatiliyor...
  node bot.js
  pause
)
if "%secim%"=="3" (
  cd telegram
  npm install
  pause
)
if "%secim%"=="4" (
  cd discord
  npm install
  pause
)
if "%secim%"=="5" exit
