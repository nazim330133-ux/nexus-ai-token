const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "games_db.json");

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); }
  catch { return { users: {}, referrals: {}, quiz: {} }; }
}

function saveDB(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUser(uid) {
  const db = loadDB();
  if (!db.users[uid]) {
    db.users[uid] = { points: 0, streak: 0, lastDaily: null, quizCorrect: 0, quizTotal: 0, referrals: 0, joined: Date.now() };
    saveDB(db);
  }
  return db.users[uid];
}

function updateUser(uid, fn) {
  const db = loadDB();
  if (!db.users[uid]) {
    db.users[uid] = { points: 0, streak: 0, lastDaily: null, quizCorrect: 0, quizTotal: 0, referrals: 0, joined: Date.now() };
  }
  fn(db.users[uid]);
  saveDB(db);
  return db.users[uid];
}

const QUIZ = [
  { q: "NXI hangi blockchain'de?", a: "bnb", o: ["Ethereum", "BNB Chain", "Solana", "Polygon"] },
  { q: "NXI toplam arzi ne kadar?", a: "100", o: ["10 milyon", "100 milyon", "1 milyar", "500 milyon"] },
  { q: "Staking APY yuzde kac?", a: "50", o: ["%10", "%25", "%50", "%100"] },
  { q: "Hangi kontrat NXI token'i?", a: "0x3371", o: ["0x3371", "0x6409", "0xBcFe", "0x0df7"] },
  { q: "Mainnet hangi tarihte?", a: "ekim", o: ["Eylul 2026", "Ekim 2026", "Kasim 2026", "Aralik 2026"] },
  { q: "NXI hangi standartta?", a: "bep", o: ["ERC-20", "BEP-20", "TRC-20", "SPL"] },
  { q: "Faucet'ten kac NXI alinir?", a: "100", o: ["10", "50", "100", "500"] },
  { q: "Ekip vesting kac yil?", a: "4", o: ["2 yil", "3 yil", "4 yil", "5 yil"] },
  { q: "Airdrop icin ayrilan yuzde kac?", a: "5", o: ["%2", "%5", "%10", "%15"] },
  { q: "PancakeSwap'te hangi havuz var?", a: "nxi", o: ["NXI/BNB", "NXI/BUSD", "NXI/USDT", "NXI/CAKE"] },
];

function getDailyBonus(streak) {
  if (streak <= 3) return 10;
  if (streak <= 7) return 25;
  if (streak <= 14) return 50;
  if (streak <= 30) return 100;
  return 200;
}

function toISODate(ts) {
  const d = new Date(ts);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}

function claimDaily(uid) {
  const today = toISODate(Date.now());
  let result = { claimed: false, streak: 0, bonus: 0, msg: "" };

  updateUser(uid, (u) => {
    const last = u.lastDaily;
    const yesterday = toISODate(Date.now() - 86400000);

    if (last === today) {
      result.msg = "❌ Bugun zaten aldin! Yarini bekle.";
      return;
    }

    if (last === yesterday) {
      u.streak += 1;
    } else {
      u.streak = 1;
    }

    u.lastDaily = today;
    const bonus = getDailyBonus(u.streak);
    u.points += bonus;

    result.claimed = true;
    result.streak = u.streak;
    result.bonus = bonus;
    result.total = u.points;
    result.msg = `✅ Gunluk odul alindi!\n\n🔥 Streak: ${u.streak} gun\n🎁 Kazanilan: ${bonus} NXI\n📦 Toplam: ${u.points} NXI`;
  });

  return result;
}

function getQuiz(uid) {
  const db = loadDB();
  if (!db.quiz[uid]) db.quiz[uid] = { index: 0, active: null };
  const qz = db.quiz[uid];

  if (qz.active) {
    return { active: true, q: qz.active };
  }

  if (qz.index >= QUIZ.length) {
    qz.index = 0;
  }

  const question = QUIZ[qz.index];
  qz.active = question;
  saveDB(db);

  return {
    active: true,
    q: question,
    total: QUIZ.length,
    current: qz.index + 1
  };
}

function answerQuiz(uid, answer) {
  const db = loadDB();
  if (!db.quiz[uid] || !db.quiz[uid].active) {
    return { correct: false, msg: "❌ Aktif soru yok. /quiz ile baslat.", done: false };
  }

  const qz = db.quiz[uid];
  const q = qz.active;
  const isCorrect = answer.toLowerCase() === q.a.toLowerCase();
  qz.active = null;
  qz.index += 1;
  saveDB(db);

  updateUser(uid, (u) => {
    u.quizTotal += 1;
    if (isCorrect) {
      u.quizCorrect += 1;
      const bonus = 20;
      u.points += bonus;
    }
  });

  const user = getUser(uid);

  if (qz.index >= QUIZ.length) {
    return {
      correct: isCorrect,
      msg: isCorrect
        ? `✅ Dogru! +20 NXI kazandin!`
        : `❌ Yanlis! Cevap: ${q.q.split(' ')[0]}`,
      done: true,
      total: user.points,
      correctCount: user.quizCorrect,
      totalCount: user.quizTotal
    };
  }

  return {
    correct: isCorrect,
    msg: isCorrect
      ? `✅ Dogru! +20 NXI! Sira ${qz.index + 1}/${QUIZ.length}'da. /quiz ile devam et`
      : `❌ Yanlis! Cevap: ${q.a}. Sira ${qz.index + 1}/${QUIZ.length}'da. /quiz ile devam et`,
    done: false,
    total: user.points
  };
}

function getLeaderboard(limit = 10) {
  const db = loadDB();
  return Object.entries(db.users)
    .map(([uid, u]) => ({ uid, ...u }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

function getReferralLink(uid) {
  return `https://t.me/Nxiaibot?start=ref_${uid}`;
}

function processReferral(refCode) {
  if (!refCode || !refCode.startsWith("ref_")) return null;
  const refUid = refCode.replace("ref_", "");
  return refUid;
}

function addReferral(uid) {
  updateUser(uid, (u) => {
    u.referrals += 1;
    u.points += 50;
  });
}

module.exports = { claimDaily, getQuiz, answerQuiz, getLeaderboard, getReferralLink, processReferral, addReferral, getUser, QUIZ, getDailyBonus };
