import { ethers } from "hardhat";

const TOKEN = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const FACTORY = "0x6725F303b657a9451d8BA641348b6761A6CC7a17";
const ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const OWNER = "0x7bd3dB1509372c6343eA973b7070c9289d96455b";
const OWNER_PK = "0xf2ab5bc212d874a685095ccfd905488e15d5e595ec830068db67ed414825259f";
const LIQ_WALLET = "0xDf3371D59f87cB79Fda98347397a85Df4B8fe8D4";
const LIQ_PK = "0xfd4bad096db00d2aca1bedaa865ba3df6c75e92e9faaf2268f323fe54bfd51c5";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const deployer = new ethers.Wallet(OWNER_PK, provider);
  const liqWallet = new ethers.Wallet(LIQ_PK, provider);

  const factory = new ethers.Contract(FACTORY, [
    "function createPair(address,address) returns (address)",
    "function getPair(address,address) view returns (address)"
  ], liqWallet);

  const router = new ethers.Contract(ROUTER, [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint, uint, uint)",
    "function WETH() view returns (address)",
    "function factory() view returns (address)"
  ], liqWallet);

  const token = new ethers.Contract(TOKEN, [
    "function approve(address,uint256) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)"
  ], liqWallet);

  // Check Router factory
  const rFactory = await router.factory();
  console.log("Router factory:", rFactory);
  console.log("Expected factory:", FACTORY);

  const wbnb = await router.WETH();
  console.log("WBNB:", wbnb);

  // Send more BNB if needed
  const liqBal = await provider.getBalance(LIQ_WALLET);
  if (liqBal < ethers.parseEther("0.03")) {
    const topUp = ethers.parseEther("0.03");
    console.log(`\nLIQ low on BNB (${ethers.formatEther(liqBal)}). Top-up...`);
    const tx0 = await deployer.sendTransaction({ to: LIQ_WALLET, value: topUp });
    await tx0.wait();
    console.log("Top-up TX:", tx0.hash);
  }

  // 1) Create pair with high gas
  console.log("\n1) createPair...");
  const tx1 = await factory.createPair(TOKEN, wbnb, { gasLimit: 2000000 });
  await tx1.wait();
  console.log("   TX:", tx1.hash);

  const pair = await factory.getPair(TOKEN, wbnb);
  console.log("   Pair:", pair);

  // 2) Approve
  const amountNXI = ethers.parseEther("5000000");
  console.log("\n2) approve...");
  const tx2 = await token.approve(ROUTER, amountNXI, { gasLimit: 200000 });
  await tx2.wait();
  console.log("   TX:", tx2.hash);

  // 3) Add liquidity
  const amountBNB = ethers.parseEther("0.01");
  console.log("\n3) addLiquidityETH...");
  const tx3 = await router.addLiquidityETH(
    TOKEN, amountNXI, 0, 0, OWNER, Math.floor(Date.now()/1000) + 600,
    { value: amountBNB, gasLimit: 2000000 }
  );
  await tx3.wait();
  console.log("   TX:", tx3.hash);

  console.log("\n=== BASARILI ===");
  console.log(`   PancakeSwap: https://testnet.bscscan.com/address/${pair}`);
}

main().catch(console.error);
