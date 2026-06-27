const TelegramBot = require("node-telegram-bot-api");
const { ethers } = require("ethers");
const games = require("./games");

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

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const refCode = match && match[1] ? match[1].trim() : null;

  if (refCode) {
    const refUid = games.processReferral(refCode);
    if (refUid && refUid !== uid) {
      games.addReferral(refUid);
      bot.sendMessage(chatId, `🎉 Davet basarili! Davet eden kisi +50 NXI kazandi.`);
    }
  }

  games.getUser(uid);
  const info = await getTokenInfo();
  bot.sendMessage(chatId,
    `🚀 *${info.name} ($NXI)*\n\n` +
    `Topluluk blockchain tokeni — BSC'de.\n\n` +
    `*Oyun & Kazan komutlari:*\n` +
    `/daily — Gunluk odul (streak bonusu)\n` +
    `/quiz — NXI bilgi yarismasi\n` +
    `/points — Puan durumun\n` +
    `/leaderboard — Siralamadaki yerin\n` +
    `/referral — Davet linkin\n\n` +
    `*Token komutlari:*\n` +
    `/info — Token bilgisi\n` +
    `/price — Guncel fiyat\n` +
    `/staking — Staking durumu\n` +
    `/airdrop — Airdrop bilgisi\n` +
    `/whitepaper — Teknik döküman\n` +
    `/contract — Kontrat adresleri\n` +
    `/roadmap — Yol haritasi\n` +
    `/countdown — Mainnet geri sayim\n` +
    `/balance <adres> — Bakiye sorgula\n` +
    `/website — Siteye git\n` +
    `/x — Twitter/X profilimiz\n` +
    `/faq — Sik sorulan sorular\n` +
    `/satinal — Token paketleri\n` +
    `/help — Tum komutlar`,
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

bot.onText(/\/daily/, (msg) => {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const result = games.claimDaily(uid);

  let txt = result.msg;
  if (result.claimed) {
    const nextBonus = games.getDailyBonus(result.streak + 1);
    txt += `\n\nYarinki bonus: ${nextBonus} NXI (${result.streak + 1} gun)`;
  }
  bot.sendMessage(chatId, txt, { parse_mode: "Markdown" });
});

bot.onText(/\/quiz/, (msg) => {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const result = games.getQuiz(uid);

  if (!result.active) {
    return bot.sendMessage(chatId, "❌ Bir hata olustu. Tekrar dene.");
  }

  const q = result.q;
  const opts = q.o.map((o, i) => `${i + 1}) ${o}`).join("\n");
  bot.sendMessage(chatId,
    `🧠 *NXI Bilgi Yarismasi*\n\n` +
    `Soru ${result.current}/${result.total}:\n\n` +
    `${q.q}\n\n${opts}\n\n` +
    `Cevap icin sayi gonder (1-4) veya /cancel ile iptal et`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/points/, (msg) => {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const u = games.getUser(uid);
  const first = msg.from.first_name || "";
  bot.sendMessage(chatId,
    `🎮 *Oyun Istatistiklerin*\n\n` +
    `Oyuncu: ${first}\n` +
    `🎯 Toplam Puan: **${u.points} NXI**\n` +
    `🔥 Streak: ${u.streak} gun\n` +
    `📚 Dogru: ${u.quizCorrect}/${u.quizTotal}\n` +
    `👥 Davet: ${u.referrals}\n\n` +
    `Mainnet'te bu puanlar kadar NXI alacaksin!`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/leaderboard/, (msg) => {
  const chatId = msg.chat.id;
  const lb = games.getLeaderboard(10);
  if (lb.length === 0) return bot.sendMessage(chatId, "Henuz oyuncu yok. /daily ile basla!");

  const medals = ["🥇", "🥈", "🥉"];
  const lines = lb.map((u, i) =>
    `${medals[i] || "  "} ${i + 1}. ID:${u.uid.slice(0, 6)}... — ${u.points} NXI ${u.streak > 0 ? "🔥" : ""}`
  );
  bot.sendMessage(chatId, `🏆 *NXI Liderlik Tablosu*\n\n${lines.join("\n")}\n\nPuan kazan: /daily ve /quiz ile`, { parse_mode: "Markdown" });
});

bot.onText(/\/referral/, (msg) => {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const link = games.getReferralLink(uid);
  const u = games.getUser(uid);
  bot.sendMessage(chatId,
    `👥 *Davet Sistemi*\n\n` +
    `Arkadaslarini davet et, her biri icin **+50 NXI** kazan!\n\n` +
    `📎 Linkin:\n\`${link}\`\n\n` +
    `Toplam davet: ${u.referrals}\n\n` +
    `Linki arkadaslarina gonder, baslasinlar /start yazsin!`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const db = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "games_db.json"), "utf8").toString());
  if (db.quiz && db.quiz[uid]) { db.quiz[uid].active = null; require("fs").writeFileSync(require("path").join(__dirname, "games_db.json"), JSON.stringify(db)); }
  bot.sendMessage(chatId, "Quiz iptal edildi.");
});

bot.on("message", (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const dbPath = require("path").join(__dirname, "games_db.json");

  let db;
  try { db = JSON.parse(require("fs").readFileSync(dbPath, "utf8")); } catch { return; }
  if (!db.quiz || !db.quiz[uid] || !db.quiz[uid].active) return;

  const num = parseInt(msg.text);
  if (isNaN(num) || num < 1 || num > 4) {
    return bot.sendMessage(chatId, "1-4 arasi bir sayi gonder.");
  }

  const q = db.quiz[uid].active;
  const selected = q.o[num - 1];
  const result = games.answerQuiz(uid, selected);

  if (result.done) {
    bot.sendMessage(chatId,
      `${result.msg}\n\n🎉 Tebrikler! Tum sorulari tamamladin!\n📊 ${result.correctCount}/${result.totalCount} dogru\n💰 Toplam: ${result.total} NXI\n\n/quiz ile tekrar baslayabilirsin.`,
      { parse_mode: "Markdown" }
    );
  } else {
    bot.sendMessage(chatId, result.msg, { parse_mode: "Markdown" });
  }
});

bot.onText(/\/website/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `🌐 ${WEBSITE}`, { disable_web_page_preview: true });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `🤖 *Nexus AI Bot - Komutlar*\n\n` +
    `*Oyun & Kazan:*\n` +
    `/daily — Gunluk odul\n` +
    `/quiz — Bilgi yarismasi\n` +
    `/points — Puan durumun\n` +
    `/leaderboard — Siralama\n` +
    `/referral — Davet linki\n\n` +
    `*Token:*\n` +
    `/info — Token bilgisi\n` +
    `/price — Guncel fiyat\n` +
    `/staking — Staking durumu\n` +
    `/airdrop — Airdrop bilgisi\n` +
    `/whitepaper — Teknik döküman\n` +
    `/contract — Kontrat adresleri\n` +
    `/roadmap — Yol haritasi\n` +
    `/countdown — Mainnet geri sayim\n` +
    `/balance <adres> — Bakiye sorgula\n\n` +
    `*Linkler:*\n` +
    `/website — Siteye git\n` +
    `/x — Twitter/X profilimiz\n` +
    `/faq — Sik sorulan sorular\n` +
    `/satinal — Token paketleri\n` +
    `/start — Ana menu`,
    { parse_mode: "Markdown" }
  );
});

const OWNER_ID = "8705502256";

bot.onText(/\/admin(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  if (uid !== OWNER_ID) return bot.sendMessage(chatId, "❌ Bu komut sadece sahip icindir.");

  const args = match && match[1] ? match[1].trim().toLowerCase() : null;

  if (!args) {
    const db = require("fs").existsSync(require("path").join(__dirname, "games_db.json")) ? JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "games_db.json"), "utf8")) : { users: {} };
    const ucount = Object.keys(db.users).length;
    const totalP = Object.values(db.users).reduce((s, u) => s + u.points, 0);
    const totalR = Object.values(db.users).reduce((s, u) => s + u.referrals, 0);
    return bot.sendMessage(chatId,
      `🔐 *Admin Paneli*\n\n` +
      `👥 Kullanici: ${ucount}\n` +
      `💰 Toplam Puan: ${totalP} NXI\n` +
      `👥 Toplam Davet: ${totalR}\n\n` +
      `*Komutlar:*\n` +
      `/admin stats — Detayli istatistik\n` +
      `/admin broadcast <mesaj> — Herkese duyuru`,
      { parse_mode: "Markdown" }
    );
  }

  if (args === "stats") {
    const db = require("fs").existsSync(require("path").join(__dirname, "games_db.json")) ? JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "games_db.json"), "utf8")) : { users: {} };
    const users = Object.entries(db.users).sort((a, b) => b[1].points - a[1].points);
    let txt = `📊 *Detayli Istatistikler*\n\n`;
    txt += `Toplam Kullanici: ${users.length}\n`;
    txt += `Toplam Puan: ${users.reduce((s, u) => s + u[1].points, 0)} NXI\n`;
    txt += `Toplam Quiz: ${users.reduce((s, u) => s + u[1].quizTotal, 0)}\n`;
    txt += `Toplam Davet: ${users.reduce((s, u) => s + u[1].referrals, 0)}\n\n`;
    txt += `*Liderler:*\n`;
    users.slice(0, 5).forEach((u, i) => {
      txt += `${i + 1}. ID:${u[0].slice(0, 8)}... — ${u[1].points} NXI\n`;
    });
    return bot.sendMessage(chatId, txt, { parse_mode: "Markdown" });
  }

  if (args.startsWith("broadcast ")) {
    const msgText = args.replace("broadcast ", "");
    if (!msgText) return bot.sendMessage(chatId, "Mesaj yaz: /admin broadcast <mesaj>");
    const db = require("fs").existsSync(require("path").join(__dirname, "games_db.json")) ? JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "games_db.json"), "utf8")) : { users: {} };
    let sent = 0;
    for (const uid of Object.keys(db.users)) {
      try { bot.sendMessage(uid, `📢 *Duyuru*\n\n${msgText}`, { parse_mode: "Markdown" }); sent++; } catch {}
    }
    return bot.sendMessage(chatId, `✅ ${sent} kullaniciya mesaj gonderildi.`);
  }

  bot.sendMessage(chatId, "❌ Bilinmeyen komut. /admin yaz.");
});

bot.onText(/\/faq/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `❓ *Sik Sorulan Sorular*\n\n` +
    `*Token paketi nedir?*\nBEP-20 tokeninizi biz olusturuyor, kontratlari yaziyor, sitenizi ve botunuzu hazirliyoruz.\n\n` +
    `*Teslimat ne kadar surer?*\nTemel 24 saat, Standart 48 saat, Premium 72 saat.\n\n` +
    `*Kodlar bana ait mi?*\nEvet. Tum kaynak kod size teslim edilir.\n\n` +
    `*Mainnet mi Testnet mi?*\nTestnet'te baslatip test ediyoruz. Mainnet deploy ucretsiz (sadece gas ucreti ~$15).\n\n` +
    `*Garanti?*\nKontratlar OpenZeppelin tabanli, audit edilmis. Teslim sonrasi 7 gun destek.\n\n` +
    `*Nasil odeme?*\nBNB, USDT (BEP-20) veya banka havalesi (TL).\n\n` +
    `Daha fazla: ${WEBSITE}#faq`,
    { parse_mode: "Markdown", disable_web_page_preview: true }
  );
});

bot.onText(/\/satinal/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `🛒 *Token Paketleri*\n\n` +
    `Size ozel BEP-20 token ekosistemi hazirliyoruz.\n\n` +
    `*1️⃣ Temel — $200*\n` +
    `BEP-20 Token + Audit + BscScan Dogrulama\n\n` +
    `*2️⃣ Standart — $350* 🔥\n` +
    `Token + Staking %%50 APY + LP + Web Sitesi + Telegram Bot\n\n` +
    `*3️⃣ Premium — $500*\n` +
    `Tam paket: Token + Staking + Faucet + Site + Bot + Airdrop + 1 Ay Destek\n\n` +
    `📩 Iletisim icin /start yaz, ekibimiz size ulassin!\n` +
    `🌐 ${WEBSITE}#services`,
    { parse_mode: "Markdown", disable_web_page_preview: true }
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
