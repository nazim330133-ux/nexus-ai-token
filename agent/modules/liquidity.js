const { ethers } = require("ethers");
const config = require("../config.json");

const ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint, uint, uint)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) returns (uint, uint)",
  "function WETH() view returns (address)",
  "function factory() view returns (address)",
];

const FACTORY_ABI = [
  "function getPair(address,address) view returns (address)",
  "function createPair(address,address) returns (address)",
];

const PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
];

async function pairInfo() {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const pair = new ethers.Contract(config.contracts.NXI_WBNB_Pair, PAIR_ABI, provider);
  const [totalSupply, reserves, token0] = await Promise.all([
    pair.totalSupply(), pair.getReserves(), pair.token0(),
  ]);
  const isNXI0 = token0.toLowerCase() === config.contracts.NexusAI.toLowerCase();
  const reserveNXI = ethers.formatEther(isNXI0 ? reserves[0] : reserves[1]);
  const reserveBNB = ethers.formatEther(isNXI0 ? reserves[1] : reserves[0]);
  return {
    pair: config.contracts.NXI_WBNB_Pair,
    totalSupplyLP: ethers.formatEther(totalSupply),
    reserveNXI, reserveBNB,
    priceNXI: reserveBNB / reserveNXI,
    explorer: `${config.network.explorer}/address/${config.contracts.NXI_WBNB_Pair}`,
  };
}

async function addLiquidity(fromWallet, amountNXI, amountBNB, toWallet) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[fromWallet];
  const wallet = new ethers.Wallet(w.pk, provider);
  const token = new ethers.Contract(
    config.contracts.NexusAI,
    ["function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"],
    wallet
  );
  const router = new ethers.Contract(config.contracts.PancakeRouter, ROUTER_ABI, wallet);

  const nxiAmt = ethers.parseEther(String(amountNXI));
  const bnbAmt = ethers.parseEther(String(amountBNB));
  const to = config.wallets[toWallet]?.address || w.address;

  const tx1 = await token.approve(config.contracts.PancakeRouter, nxiAmt, { gasLimit: 200000 });
  await tx1.wait();

  const tx2 = await router.addLiquidityETH(
    config.contracts.NexusAI, nxiAmt, 0, 0, to, Math.floor(Date.now() / 1000) + 600,
    { value: bnbAmt, gasLimit: 2000000 }
  );
  await tx2.wait();
  return { approveTx: tx1.hash, liquidityTx: tx2.hash, nxi: amountNXI, bnb: amountBNB, lpRecipient: to };
}

async function getLPBalance(walletName) {
  const provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  const pair = new ethers.Contract(config.contracts.NXI_WBNB_Pair, PAIR_ABI, provider);
  const bal = await pair.balanceOf(w.address);
  return { wallet: w.address, label: w.label, lpBalance: ethers.formatEther(bal) };
}

module.exports = { pairInfo, addLiquidity, getLPBalance };
