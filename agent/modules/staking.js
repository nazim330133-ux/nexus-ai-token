const { ethers } = require("ethers");
const config = require("../config.json");

const STAKING_ABI = [
  "function stake(uint256)",
  "function withdraw(uint256)",
  "function claimRewards()",
  "function earned(address) view returns (uint256)",
  "function stakedBalance(address) view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function setRewardRate(uint256)",
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",
];

const TOKEN_ABI = [
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

async function info() {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const pool = new ethers.Contract(config.contracts.StakingPool, STAKING_ABI, provider);
  const [totalStaked, rewardRate, paused, owner] = await Promise.all([
    pool.totalStaked(), pool.rewardRate(), pool.paused(), pool.owner(),
  ]);
  return {
    address: config.contracts.StakingPool,
    totalStaked: ethers.formatEther(totalStaked),
    rewardRate: rewardRate.toString(),
    paused,
    owner,
    explorer: `${config.network.explorer}/address/${config.contracts.StakingPool}`,
  };
}

async function stake(walletName, amountNXI) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const wallet = new ethers.Wallet(w.pk, provider);
  const token = new ethers.Contract(config.contracts.NexusAI, TOKEN_ABI, wallet);
  const pool = new ethers.Contract(config.contracts.StakingPool, STAKING_ABI, wallet);

  const amt = ethers.parseEther(String(amountNXI));
  const tx1 = await token.approve(config.contracts.StakingPool, amt, { gasLimit: 200000 });
  await tx1.wait();
  const tx2 = await pool.stake(amt, { gasLimit: 400000 });
  await tx2.wait();
  return { approveTx: tx1.hash, stakeTx: tx2.hash, wallet: w.address, amount: amountNXI };
}

async function withdraw(walletName, amountNXI) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const wallet = new ethers.Wallet(w.pk, provider);
  const pool = new ethers.Contract(config.contracts.StakingPool, STAKING_ABI, wallet);
  const amt = ethers.parseEther(String(amountNXI));
  const tx = await pool.withdraw(amt, { gasLimit: 400000 });
  await tx.wait();
  return { tx: tx.hash, wallet: w.address, amount: amountNXI };
}

async function claim(walletName) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const wallet = new ethers.Wallet(w.pk, provider);
  const pool = new ethers.Contract(config.contracts.StakingPool, STAKING_ABI, wallet);
  const tx = await pool.claimRewards({ gasLimit: 400000 });
  await tx.wait();
  const earned = await pool.earned(w.address);
  return { tx: tx.hash, wallet: w.address, earned: ethers.formatEther(earned) };
}

async function setRate(walletName, apyPercent) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const wallet = new ethers.Wallet(w.pk, provider);
  const pool = new ethers.Contract(config.contracts.StakingPool, STAKING_ABI, wallet);

  const secInYear = 365n * 86400n;
  const targetStaked = ethers.parseEther("10000");
  const annualReward = (targetStaked * BigInt(apyPercent)) / 100n;
  const rate = annualReward / secInYear;

  const tx = await pool.setRewardRate(rate, { gasLimit: 200000 });
  await tx.wait();
  return { tx: tx.hash, rate: rate.toString(), apy: `${apyPercent}%` };
}

async function fundRewards(fromWallet, amountNXI) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[fromWallet];
  const wallet = new ethers.Wallet(w.pk, provider);
  const token = new ethers.Contract(config.contracts.NexusAI, TOKEN_ABI, wallet);
  const amt = ethers.parseEther(String(amountNXI));
  const tx = await token.transfer(config.contracts.StakingPool, amt, { gasLimit: 200000 });
  await tx.wait();
  return { tx: tx.hash, from: w.address, to: config.contracts.StakingPool, amount: amountNXI };
}

module.exports = { info, stake, withdraw, claim, setRate, fundRewards };
