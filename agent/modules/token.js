const { ethers } = require("ethers");
const config = require("../config.json");

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function transferOwnership(address)",
];

async function tokenInfo() {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const token = new ethers.Contract(config.contracts.NexusAI, ABI, provider);
  const [name, symbol, supply, owner, paused] = await Promise.all([
    token.name(), token.symbol(), token.totalSupply(),
    token.owner(), token.paused(),
  ]);
  return {
    address: config.contracts.NexusAI,
    name, symbol,
    totalSupply: ethers.formatEther(supply),
    owner, paused,
    explorer: `${config.network.explorer}/address/${config.contracts.NexusAI}`,
    stakingPool: config.contracts.StakingPool,
    poolExplorer: `${config.network.explorer}/address/${config.contracts.StakingPool}`,
    pair: config.contracts.NXI_WBNB_Pair,
  };
}

async function pause(walletName) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const wallet = new ethers.Wallet(w.pk, provider);
  const token = new ethers.Contract(config.contracts.NexusAI, ABI, wallet);
  const tx = await token.pause({ gasLimit: 200000 });
  await tx.wait();
  return { tx: tx.hash, action: "paused" };
}

async function unpause(walletName) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const wallet = new ethers.Wallet(w.pk, provider);
  const token = new ethers.Contract(config.contracts.NexusAI, ABI, wallet);
  const tx = await token.unpause({ gasLimit: 200000 });
  await tx.wait();
  return { tx: tx.hash, action: "unpaused" };
}

async function transferOwnership(walletName, newOwner) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const wallet = new ethers.Wallet(w.pk, provider);
  const token = new ethers.Contract(config.contracts.NexusAI, ABI, wallet);
  const tx = await token.transferOwnership(newOwner, { gasLimit: 200000 });
  await tx.wait();
  return { tx: tx.hash, newOwner, action: "ownership_transferred" };
}

module.exports = { tokenInfo, pause, unpause, transferOwnership };
