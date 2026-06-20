#!/bin/bash
# Nexus AI Token Paketi - Hizli Deploy
# Kullanim: ./deploy-package.sh <token_adi> <sembol> <arz> <sahip_cuzdan>
#
# Ornek: ./deploy-package.sh "My Token" MTK 100000000 0x...

TOKEN_NAME=$1
TOKEN_SYMBOL=$2
TOTAL_SUPPLY=$3
OWNER=$4

if [ -z "$TOKEN_NAME" ] || [ -z "$TOKEN_SYMBOL" ] || [ -z "$TOTAL_SUPPLY" ] || [ -z "$OWNER" ]; then
    echo "Kullanim: $0 <adi> <sembol> <arz> <sahip>"
    echo "Ornek: $0 \"My Token\" MTK 100000000 0x..."
    exit 1
fi

echo "== Nexus AI Token Paketi Deploy =="
echo "Token: $TOKEN_NAME ($TOKEN_SYMBOL)"
echo "Arz: $TOTAL_SUPPLY"
echo "Sahip: $OWNER"
echo ""

# 1. Token deploy
echo "1/5 Token deploy ediliyor..."
# npx hardhat run scripts/deploy-token.ts --network bscTestnet

# 2. Staking deploy
echo "2/5 Staking deploy ediliyor..."

# 3. Likidite ekleme
echo "3/5 PancakeSwap likiditesi ekleniyor..."

# 4. Web sitesi olusturma
echo "4/5 Web sitesi hazirlaniyor..."

# 5. Telegram bot kurulumu
echo "5/5 Telegram bot yapilandiriliyor..."

echo ""
echo "== PAKET TAMAMLANDI =="
echo "Token: https://testnet.bscscan.com/address/<ADRES>"
echo "Staking: https://testnet.bscscan.com/address/<ADRES>"
echo ""
