const TelegramBot = require("node-telegram-bot-api");
const { ethers } = require("ethers");

const BOT_TOKEN = "8705502256:AAH6fCzyrQ3NQcdPoEL0qfk1ankFjWbvwjg";
const TOKEN_ADDR = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const STAKING_ADDR = "0x6409896461688E0a25cF8Ee5DD3f3CC0a9ba0c3c";
const POOL_ADDR = "0xBcFe9a8498c4b702c739BE67012D18c48d220F28";
const RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const EXPLORER = "https://testnet.bscscan.com";
const OWNER = "0x7bd3dB1509372c6343eA973b7070c9289d96455b";
const WEBSITE = "https://nexusai-ecosystem.vercel.app";
const X = "https://x.com/nexusai2026";

const provider = new ethers.JsonRpcProvider(RPC);
const tokenABI = ["function name() view returns (string)", "function symbol() view returns (string)", "function totalSupply() view returns (uint256)", "function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
const token = new ethers.Contract(TOKEN_ADDR, tokenABI, provider);
const poolABI = ["function totalStaked() view returns (uint256)", "function rewardRate() view returns (uint256)"];
const pool = new ethers.Contract(STAKING_ADDR, poolABI, provider);

const MAINNET_TIMESTAMP = Math.floor(new Date("2026-10-01T00:00:00Z").getTime() / 1000);

async function getTokenInfo() {
  const [name, symbol, supply] = await Promise.all([token.name(), token.symbol(), token.totalSupply()]);
  return { name, symbol, supply: ethers.formatEther(supply) };
}

async function getPoolInfo() {
  try {
    const [totalStaked, rewardRate] = await Promise.all([pool.totalStaked(), pool.rewardRate()]);
    return { totalStaked: ethers.formatEther(totalStaked), rewardRate: rewardRate.toString() };
  } catch { return null; }
}

async function getBalance(address) {
  try {
    const bal = await token.balanceOf(address);
    return ethers.formatEther(bal);
  } catch { return "0"; }
}

function getMainnetCountdown() {
  const now = Math.floor(Date.now() / 1000);
  let diff = MAINNET_TIMESTAMP - now;
  if (diff < 0) return "🚀 Mainnet canli!";
  const d = Math.floor(diff / 86400); diff %= 86400;
  const h = Math.floor(diff / 3600); diff %= 3600;
  const m = Math.floor(diff / 60); diff %= 60;
  return `${d} gun ${h} saat ${m} dk`;
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const info = await getTokenInfo();
  bot.sendMessage(chatId,
    `🚀 *${info.name} ($NXI)*\n\n` +
    `Topluluk blockchain tokeni — BSC'de.\n\n` +
    `*Komutlar:*\n` +
    `/info — Token bilgisi\n` +
    `/supply — Toplam arz\n` +
    `/price — Guncel fiyat\n` +
    `/staking — Staking durumu\n` +
    `/airdrop — Airdrop bilgisi\n` +
    `/whitepaper — Teknik döküman\n` +
    `/contract — Kontrat adresleri\n` +
    `/roadmap — Yol haritasi\n` +
    `/countdown — Mainnet geri sayim\n` +
    `/website — Siteye git\n` +
    `/x — Twitter/X profilimiz\n` +
    `/balance <adres> — Bakiye sorgula\n` +
    `/help — Yardim`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/info/, async (msg) => {
  const chatId = msg.chat.id;
  const info = await getTokenInfo();
  bot.sendMessage(chatId,
    `📊 *${info.name} Bilgileri*\n\n` +
    `İsim: ${info.name}\n` +
    `Sembol: $${info.symbol}\n` +
    `Toplam Arz: ${Number(info.supply).toLocaleString()} ${info.symbol}\n` +
    `Standart: BEP-20\n` +
    `Ag: BSC Testnet (Chain ID: 97)\n` +
    `Sahip: \`${OWNER}\`\n` +
    `Kontrat: \`${TOKEN_ADDR}\`\n` +
    `\n🌐 [Website](${WEBSITE}) | [Explorer](${EXPLORER}/address/${TOKEN_ADDR})`,
    { parse_mode: "Markdown", disable_web_page_preview: true }
  );
});

bot.onText(/\/supply/, async (msg) => {
  const chatId = msg.chat.id;
  const info = await getTokenInfo();
  bot.sendMessage(chatId, `💰 *Toplam Arz*\n\n**${Number(info.supply).toLocaleString()} ${info.symbol}**\n\nSabit arz, yeni baski yok. %40 Likidite, %30 Ekosistem, %15 Gelistirme, %10 Ekip, %5 Airdrop.`, { parse_mode: "Markdown" });
});

bot.onText(/\/staking/, async (msg) => {
  const chatId = msg.chat.id;
  const poolInfo = await getPoolInfo();
  if (!poolInfo) return bot.sendMessage(chatId, "❌ StakingPool bilgisi alinamadi.");
  bot.sendMessage(chatId,
    `🏦 *Staking Pool*\n\n` +
    `Toplam Stake: ${Number(poolInfo.totalStaked).toLocaleString()} NXI\n` +
    `APY: %%50\n` +
    `Odul Fonu: 500,000 NXI\n` +
    `Staking: \`${STAKING_ADDR}\`\n` +
    `\n🔗 [Explorer](${EXPLORER}/address/${STAKING_ADDR})`,
    { parse_mode: "Markdown", disable_web_page_preview: true }
  );
});

bot.onText(/\/airdrop/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `🎁 *Airdrop Bilgisi*\n\n` +
    `Toplam Airdrop: **5,000,000 NXI** (%5)\n` +
    `Kisi Basina: **100 NXI** (testnet asamasinda)\n` +
    `Bekleme: 24 saat\n` +
    `\n🔹 Mainnet'e gecince buyuk bir airdrop kampanyasi baslayacak!\n` +
    `🔹 Telegram grubunda aktif olanlara ekstra odul\n` +
    `🔹 Referans sistemi ile +50 NXI kazanin\n\n` +
    `@Nxiaibot'u arkadaslarina gonder, onlar da katilsin!`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/whitepaper/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `📄 *$NXI Whitepaper*\n\n` +
    `Nexus AI, yapay zeka ve blockchain'i birlestiren topluluk odakli bir ekosistemdir.\n\n` +
    `*Ozet:*\n` +
    `🔹 BEP-20 token (BSC)\n` +
    `🔹 Sabit arz: 100,000,000 NXI\n` +
    `🔹 Staking: %%50 APY\n` +
    `🔹 Otomatik likidite havuzu\n` +
    `🔹 Mainnet: 1 Ekim 2026\n\n` +
    `📖 Tam whitepaper: [GitHub](${WEBSITE})\n` +
    `🌐 Website: ${WEBSITE}`,
    { parse_mode: "Markdown", disable_web_page_preview: true }
  );
});

bot.onText(/\/contract/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `📜 *Kontrat Adresleri*\n\n` +
    `Token: \`${TOKEN_ADDR}\`\n[Explorer](${EXPLORER}/address/${TOKEN_ADDR})\n\n` +
    `StakingPool: \`${STAKING_ADDR}\`\n[Explorer](${EXPLORER}/address/${STAKING_ADDR})\n\n` +
    `LP Pool: \`${POOL_ADDR}\`\n[Explorer](${EXPLORER}/address/${POOL_ADDR})`,
    { parse_mode: "Markdown", disable_web_page_preview: true }
  );
});

bot.onText(/\/price/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const pairABI = ["function getReserves() view returns (uint112,uint112,uint32)"];
    const pair = new ethers.Contract(POOL_ADDR, pairABI, provider);
    const reserves = await pair.getReserves();
    const token0 = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E".toLowerCase();
    const isNXI = (await token.getAddress()).toLowerCase() === token0;
    const reserveNXI = ethers.formatEther(isNXI ? reserves[0] : reserves[1]);
    const reserveBNB = ethers.formatEther(isNXI ? reserves[1] : reserves[0]);
    const priceBNB = Number(reserveBNB) / Number(reserveNXI);
    const priceUSD = priceBNB * 580;
    bot.sendMessage(chatId,
      `💹 *Fiyat Bilgisi*\n\n` +
      `1 NXI = ${priceBNB.toFixed(12)} BNB\n` +
      `1 NXI = ~$${priceUSD.toFixed(10)}\n\n` +
      `Havuz: ${Number(reserveNXI).toLocaleString()} NXI / ${Number(reserveBNB).toFixed(6)} BNB\n` +
      `\n📊 [PancakeSwap](${EXPLORER}/address/${POOL_ADDR})`,
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  } catch { bot.sendMessage(chatId, "❌ Fiyat bilgisi alinamadi."); }
});

bot.onText(/\/balance (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const addr = match[1].trim();
  if (!addr.startsWith("0x") || addr.length !== 42) return bot.sendMessage(chatId, "❌ Gecersiz adres.");
  const bal = await getBalance(addr);
  bot.sendMessage(chatId, `💳 *Bakiye*\n\n\`${addr}\`\n**${Number(bal).toLocaleString()} NXI**`, { parse_mode: "Markdown" });
});

bot.onText(/\/roadmap/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `🗺️ *$NXI Yol Haritasi*\n\n` +
    `*Q2 2026 ✅* — Testnet lansmani\n` +
    `  • Token dagitimi, staking, faucet\n` +
    `  • Web sitesi ve Telegram botu\n\n` +
    `*Q3 2026 🔄* — Mainnet hazirlik\n` +
    `  • Mainnet gecisi, PancakeSwap likiditesi\n` +
    `  • CoinGecko/CMC basvurusu\n\n` +
    `*Q4 2026 🚀* — Mainnet canli\n` +
    `  • Buyuk airdrop, marketing\n` +
    `  • Topluluk buyumesi\n\n` +
    `*2027 🌐* — AI entegrasyonu\n` +
    `  • YZ tabanli ticaret araclari\n` +
    `  • Zincirlerarasi kopru`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/countdown/, (msg) => {
  const chatId = msg.chat.id;
  const countdown = getMainnetCountdown();
  bot.sendMessage(chatId,
    `⏳ *Mainnet Geri Sayim*\n\n` +
    `Hedef: 1 Ekim 2026\n` +
    `Kalan: **${countdown}**\n\n` +
    `🌐 ${WEBSITE}`,
    { parse_mode: "Markdown", disable_web_page_preview: true }
  );
});

bot.onText(/\/website/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `🌐 ${WEBSITE}`, { disable_web_page_preview: true });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `🤖 *Nexus AI Bot - Komutlar*\n\n` +
    `/info — Token bilgisi\n` +
    `/supply — Toplam arz\n` +
    `/price — Guncel fiyat\n` +
    `/staking — Staking durumu\n` +
    `/airdrop — Airdrop bilgisi\n` +
    `/whitepaper — Teknik döküman\n` +
    `/contract — Kontrat adresleri\n` +
    `/roadmap — Yol haritasi\n` +
    `/countdown — Mainnet geri sayim\n` +
    `/website — Siteye git\n` +
    `/x — Twitter/X profilimiz\n` +
    `/balance <adres> — Bakiye sorgula\n` +
    `/start — Ana menu`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/x/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `🐦 *Nexus AI — X/Twitter*\n\nBizi takip edin: ${X}\n\nGuncel duyurular, gelismeler ve topluluk etkinlikleri icin.`, { parse_mode: "Markdown", disable_web_page_preview: true });
});

bot.on("polling_error", (err) => {
  console.error("Polling error (ignored):", err.message);
});

console.log("✅ Nexus AI Telegram Bot calisiyor...");
console.log("📋 Komut: /start ile baslayin");
