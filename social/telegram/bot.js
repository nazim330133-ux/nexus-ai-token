const TelegramBot = require("node-telegram-bot-api");
const { ethers } = require("ethers");

// === KONFIGURASYON ===
// Telegram'da @BotFather ile bot olustur, token'i buraya yapistir
const BOT_TOKEN = "8705502256:AAH6fCzyrQ3NQcdPoEL0qfk1ankFjWbvwjg";
const TOKEN_ADDR = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const STAKING_ADDR = "0x6409896461688E0a25cF8Ee5DD3f3CC0a9ba0c3c";
const POOL_ADDR = "0xBcFe9a8498c4b702c739BE67012D18c48d220F28";
const RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const EXPLORER = "https://testnet.bscscan.com";
const OWNER = "0x7bd3dB1509372c6343eA973b7070c9289d96455b";

const provider = new ethers.JsonRpcProvider(RPC);
const tokenABI = ["function name() view returns (string)", "function symbol() view returns (string)", "function totalSupply() view returns (uint256)", "function balanceOf(address) view returns (uint256)"];
const token = new ethers.Contract(TOKEN_ADDR, tokenABI, provider);
const poolABI = ["function totalStaked() view returns (uint256)", "function rewardRate() view returns (uint256)"];
const pool = new ethers.Contract(STAKING_ADDR, poolABI, provider);

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

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const info = await getTokenInfo();
  bot.sendMessage(chatId,
    `🚀 *${info.name} ($NXI)*\n\n` +
    `Nexus AI — BSC Testnet'te bir topluluk blockchain tokeni.\n\n` +
    `*Komutlar:*\n` +
    `/info — Token bilgisi\n` +
    `/supply — Toplam arz\n` +
    `/staking — Staking durumu\n` +
    `/balance <adres> — Bakiye sorgula\n` +
    `/contract — Kontrat adresleri\n` +
    `/price — Guncel fiyat\n` +
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
    `Kontrat: \`${TOKEN_ADDR}\``,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/supply/, async (msg) => {
  const chatId = msg.chat.id;
  const info = await getTokenInfo();
  bot.sendMessage(chatId, `💰 Toplam Arz: **${Number(info.supply).toLocaleString()} ${info.symbol}**\n\nSabit arz, yeni baski yok.`, { parse_mode: "Markdown" });
});

bot.onText(/\/staking/, async (msg) => {
  const chatId = msg.chat.id;
  const poolInfo = await getPoolInfo();
  if (!poolInfo) return bot.sendMessage(chatId, "❌ StakingPool bilgisi alinamadi.");
  bot.sendMessage(chatId,
    `🏦 *Staking Pool*\n\n` +
    `Toplam Stake: ${Number(poolInfo.totalStaked).toLocaleString()} NXI\n` +
    `APY: %%50\n` +
    `Adres: \`${STAKING_ADDR}\``,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/balance (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const addr = match[1].trim();
  if (!addr.startsWith("0x") || addr.length !== 42) return bot.sendMessage(chatId, "❌ Gecersiz adres.");
  const bal = await getBalance(addr);
  bot.sendMessage(chatId, `💳 *Bakiye*\n\n\`${addr}\`\n**${Number(bal).toLocaleString()} NXI**`, { parse_mode: "Markdown" });
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
    const isNXI0 = token.getAddress().then(a => a.toLowerCase()).then(a => a === token0);
    const isNXI = await isNXI0;
    const reserveNXI = ethers.formatEther(isNXI ? reserves[0] : reserves[1]);
    const reserveBNB = ethers.formatEther(isNXI ? reserves[1] : reserves[0]);
    const price = Number(reserveBNB) / Number(reserveNXI);
    bot.sendMessage(chatId, `💹 *Fiyat Bilgisi*\n\n1 NXI = ${price.toFixed(12)} BNB\n\nHavuzda: ${Number(reserveNXI).toLocaleString()} NXI / ${Number(reserveBNB).toFixed(6)} BNB`, { parse_mode: "Markdown" });
  } catch { bot.sendMessage(chatId, "❌ Fiyat bilgisi alinamadi."); }
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🤖 *Nexus AI Bot - Komutlar*\n\n` +
    `/info — Token bilgisi\n` +
    `/supply — Toplam arz\n` +
    `/staking — Staking durumu\n` +
    `/balance <adres> — Bakiye sorgula\n` +
    `/contract — Kontrat adresleri\n` +
    `/price — Guncel fiyat\n` +
    `/start — Ana menu`,
    { parse_mode: "Markdown" }
  );
});

console.log("✅ Nexus AI Telegram Bot calisiyor...");
console.log("⚠ Bot token'ini bot.js'deki YOUR_TELEGRAM_BOT_TOKEN_HERE yerine yazistir.");
