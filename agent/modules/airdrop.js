const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const cfg = require("../config.json");

const AIRDROP_FILE = path.join(__dirname, "..", "airdrop.csv");
const TOKEN_ABI = ["function transfer(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"];

async function generateTestWallets(count = 5) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const w = ethers.Wallet.createRandom();
    wallets.push({ address: w.address, privateKey: w.privateKey });
  }

  const csv = "address,amountNXI\n" + wallets.map(w => `${w.address},100`).join("\n");
  fs.writeFileSync(AIRDROP_FILE, csv, "utf8");
  fs.writeFileSync(path.join(__dirname, "..", "airdrop-wallets.json"), JSON.stringify(wallets, null, 2), "utf8");

  return wallets;
}

async function sendBatch(fromWallet) {
  if (!fs.existsSync(AIRDROP_FILE)) {
    return { error: "airdrop.csv bulunamadi. Once 'airdrop generate' ile test cuzdanlari olusturun." };
  }

  const lines = fs.readFileSync(AIRDROP_FILE, "utf8").trim().split("\n");
  const recipients = lines.slice(1).map(l => {
    const [addr, amt] = l.split(",");
    return { address: addr.trim(), amountNXI: amt.trim() };
  });

  const provider = new ethers.JsonRpcProvider(cfg.network.rpc);
  const w = cfg.wallets[fromWallet];
  const wallet = new ethers.Wallet(w.pk, provider);
  const token = new ethers.Contract(cfg.contracts.NexusAI, TOKEN_ABI, wallet);

  let sent = 0, failed = 0;
  const results = [];

  for (const r of recipients) {
    try {
      const amt = ethers.parseEther(r.amountNXI);
      const bal = await token.balanceOf(w.address);
      if (bal < amt) { results.push({ address: r.address, status: "FAILED", reason: "yetersiz bakiye" }); failed++; continue; }
      const tx = await token.transfer(r.address, amt, { gasLimit: 200000 });
      await tx.wait();
      results.push({ address: r.address, amount: r.amountNXI, status: "OK", tx: tx.hash });
      sent++;
    } catch (e) {
      results.push({ address: r.address, status: "FAILED", reason: e.message.slice(0, 60) });
      failed++;
    }
  }

  const summary = { total: recipients.length, sent, failed, results };
  const reportPath = path.join(__dirname, "..", "airdrop-sonuc.json");
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  return summary;
}

async function airdropStatus() {
  const provider = new ethers.JsonRpcProvider(cfg.network.rpc);
  const token = new ethers.Contract(cfg.contracts.NexusAI, TOKEN_ABI, provider);
  const airdropWallet = cfg.wallets.airdrop;
  const bal = await token.balanceOf(airdropWallet.address);
  return {
    wallet: airdropWallet.address,
    label: airdropWallet.label,
    remainingNXI: ethers.formatEther(bal),
    csvFile: fs.existsSync(AIRDROP_FILE) ? fs.readFileSync(AIRDROP_FILE, "utf8") : "(henuz olusturulmadi)",
  };
}

module.exports = { generateTestWallets, sendBatch, airdropStatus };
