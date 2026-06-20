const { ethers } = require("ethers");
const wallet = require("./modules/wallet");
const token = require("./modules/token");
const staking = require("./modules/staking");
const liquidity = require("./modules/liquidity");
const airdrop = require("./modules/airdrop");
const fs = require("fs");
const path = require("path");
const STRATEGY_FILE = path.join(__dirname, "strategy.json");
let strategy = JSON.parse(fs.readFileSync(STRATEGY_FILE, "utf8"));

let cycleCount = 0;
let lastActions = {};

function log(msg) {
  const ts = new Date().toLocaleString("tr-TR");
  console.log(`[${ts}] ${msg}`);
}

function saveStrategy() {
  fs.writeFileSync(STRATEGY_FILE, JSON.stringify(strategy, null, 2));
}

async function showStatus() {
  const info = await token.tokenInfo();
  const liq = await liquidity.pairInfo().catch(() => ({}));
  const stakeInfo = await staking.info().catch(() => ({}));
  const bals = await wallet.allBalances();

  console.log("\n" + "=".repeat(56));
  console.log(`  NEXUS AI ($NXI)  |  ${info.paused ? "PAUSED" : "AKTIF"}  |  ${bals.owner.NXI} NXI (owner)`);
  console.log("=".repeat(56));

  if (liq.pair) {
    console.log(`  LP: ${Number(liq.reserveNXI).toLocaleString()} NXI / ${Number(liq.reserveBNB).toFixed(6)} BNB`);
  }
  if (stakeInfo.address) {
    console.log(`  Staked: ${Number(stakeInfo.totalStaked).toLocaleString()} NXI  |  Rate: ${stakeInfo.rewardRate}`);
  }
  console.log("-".repeat(56));
  for (const b of Object.values(bals)) {
    const nxi = Number(b.NXI).toLocaleString().padStart(12);
    const bnb = Number(b.BNB).toFixed(5).padStart(10);
    console.log(`  ${b.label.padEnd(20)} ${nxi} NXI  ${bnb} BNB`);
  }
  console.log("=".repeat(56) + "\n");
}

async function claimRewards() {
  const cc = require("./config.json");
  const claimCfg = strategy.strategies.claimRewards;
  for (const w of claimCfg.wallets) {
    try {
      const provider = new ethers.JsonRpcProvider(cc.network.rpc);
      const poolContract = new ethers.Contract(
        cc.contracts.StakingPool,
        ["function earned(address) view returns (uint256)"],
        provider
      );
      const wAddr = cc.wallets[w].address;
      const earned = await poolContract.earned(wAddr);
      const earnedNXI = Number(ethers.formatEther(earned));
      if (earnedNXI > 0) {
        const r = await staking.claim(w);
        log(`CLAIM: ${w} -> ${earnedNXI.toFixed(2)} NXI reward (TX: ${r.tx})`);

        if (strategy.strategies.restakeRewards.enabled && earnedNXI >= strategy.strategies.restakeRewards.minRewardNXI) {
          await staking.stake(w, Math.floor(earnedNXI).toString());
          log(`RESTAKE: ${w} -> ${Math.floor(earnedNXI)} NXI tekrar stake edildi`);
        }
      }
    } catch (e) {
      log(`CLAIM HATA (${w}): ${e.message}`);
    }
  }
}

async function checkGas() {
  const gasCfg = strategy.strategies.gasMonitor;
  if (!gasCfg.enabled) return;

  for (const target of gasCfg.targetWallets) {
    try {
      const b = await wallet.balance(target);
      const bnb = Number(b.BNB);
      if (bnb < gasCfg.minBNB) {
        const needed = gasCfg.topUpAmountBNB;
        if (Number((await wallet.balance(gasCfg.sourceWallet)).BNB) >= needed + gasCfg.minBNB) {
          const r = await wallet.sendBNB(gasCfg.sourceWallet, b.address, needed);
          log(`GAZ: ${target} -> ${needed} BNB yuklendi (TX: ${r.tx})`);
        } else {
          log(`GAZ UYARI: ${gasCfg.sourceWallet} da yeterli BNB yok, ${target} beslenemedi`);
        }
      }
    } catch (e) {
      log(`GAZ HATA (${target}): ${e.message}`);
    }
  }
}

async function checkLiquidity() {
  const cfg = strategy.strategies.liquidityHealth;
  const info = await liquidity.pairInfo().catch(() => ({}));
  if (!info.pair) {
    log(`LP UYARI: Havuz bulunamadi`);
    return;
  }
  const nxiInPool = Number(info.reserveNXI);
  if (nxiInPool < cfg.minNXIInPool) {
    log(`LP UYARI: Havuzda ${nxiInPool.toLocaleString()} NXI, minimum ${cfg.minNXIInPool.toLocaleString()} NXI`);
  } else {
    log(`LP: ${nxiInPool.toLocaleString()} NXI havuzda, saglikli`);
  }
}

async function updateStakingRate() {
  const cfg = strategy.strategies.stakingRewardRate;
  const poolInfo = await staking.info();
  if (poolInfo.totalStaked === "0.0") {
    log(`STAKING RATE: Henuz stake yok, rate ayarlanmadi`);
    return;
  }
  const r = await staking.setRate("owner", cfg.targetAPY);
  log(`STAKING RATE: %${cfg.targetAPY} APY olarak ayarlandi (TX: ${r.tx})`);
}

async function runCycle() {
  cycleCount++;
  log(`--- Cycle #${cycleCount} ---`);

  if (strategy.strategies.statusReport.enabled) {
    const hourSeconds = 3600;
    if (!lastActions.statusReport || Date.now() - lastActions.statusReport > hourSeconds * 1000) {
      await showStatus();
      lastActions.statusReport = Date.now();
    }
  }

  if (strategy.strategies.claimRewards.enabled) {
    const interval = strategy.strategies.claimRewards.intervalSeconds * 1000;
    if (!lastActions.claimRewards || Date.now() - lastActions.claimRewards > interval) {
      await claimRewards();
      lastActions.claimRewards = Date.now();
    }
  }

  if (strategy.strategies.gasMonitor.enabled) {
    await checkGas();
  }

  if (strategy.strategies.liquidityHealth.enabled) {
    const interval = strategy.strategies.liquidityHealth.intervalSeconds * 1000;
    if (!lastActions.liquidityHealth || Date.now() - lastActions.liquidityHealth > interval) {
      await checkLiquidity();
      lastActions.liquidityHealth = Date.now();
    }
  }

  if (strategy.strategies.stakingRewardRate.enabled) {
    const interval = strategy.strategies.stakingRewardRate.intervalSeconds * 1000;
    if (!lastActions.stakingRewardRate || Date.now() - lastActions.stakingRewardRate > interval) {
      await updateStakingRate();
      lastActions.stakingRewardRate = Date.now();
    }
  }
}

async function autoLoop() {
  log("OTONOM MOD AKTIF - Agent kendi kendine calisiyor...");
  log(`Kontrol araligi: ${strategy.checkIntervalSeconds} saniye`);
  log("Strateji: strategy.json dosyasindan okunur");
  log("Durdurmak icin: CTRL+C\n");

  await showStatus();

  const loop = async () => {
    try {
      await runCycle();
    } catch (e) {
      log("CYCLE HATA: " + e.message);
    }
    setTimeout(loop, strategy.checkIntervalSeconds * 1000);
  };

  loop();
}

async function main() {
  console.log(`
╔══════════════════════════════════════════╗
║     NEXUS AI ($NXI)  OTONOM AGENT v2      ║
║     BSC Testnet - Chain ID: 97           ║
║     Tamamen kendi kendine calisir        ║
╚══════════════════════════════════════════╝
`);

  if (strategy.autonomous) {
    await autoLoop();
  } else {
    log("OTONOM MOD KAPALI. strategy.json'da autonomous: true yapip tekrar baslat.");
  }
}

process.on("SIGINT", () => {
  console.log("\nAgent durduruldu. strategy.json ile tekrar baslatabilirsin.");
  process.exit(0);
});

main().catch(console.error);
