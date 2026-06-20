import { ethers } from "hardhat";

const TOKEN = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const OWNER = "0x7bd3dB1509372c6343eA973b7070c9289d96455b";
const OWNER_PK = "0xf2ab5bc212d874a685095ccfd905488e15d5e595ec830068db67ed414825259f";
const LIQ_WALLET = "0xDf3371D59f87cB79Fda98347397a85Df4B8fe8D4";
const LIQ_PK = "0xfd4bad096db00d2aca1bedaa865ba3df6c75e92e9faaf2268f323fe54bfd51c5";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const deployer = new ethers.Wallet(OWNER_PK, provider);
  const liqWallet = new ethers.Wallet(LIQ_PK, provider);

  const router = new ethers.Contract(ROUTER, [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint, uint, uint)",
    "function WETH() external view returns (address)"
  ], liqWallet);

  const token = new ethers.Contract(TOKEN, [
    "function approve(address,uint256) returns (bool)",
    "function balanceOf(address) view returns (uint256)"
  ], liqWallet);

  // 1) Send 0.04 BNB to LIQ wallet for gas + liquidity
  const gasBNB = ethers.parseEther("0.04");
  const tx1 = await deployer.sendTransaction({ to: LIQ_WALLET, value: gasBNB });
  await tx1.wait();
  console.log("1) BNB gonderildi:", tx1.hash);

  // 2) Check LIQ wallet balances
  const liqBNB = await provider.getBalance(LIQ_WALLET);
  const liqNXI = await token.balanceOf(LIQ_WALLET);
  console.log("   LIQ BNB:", ethers.formatEther(liqBNB));
  console.log("   LIQ NXI:", ethers.formatEther(liqNXI));

  // 3) Approve Router to spend 10M NXI
  const amountNXI = ethers.parseEther("10000000");
  const tx2 = await token.approve(ROUTER, amountNXI);
  await tx2.wait();
  console.log("2) Approve:", tx2.hash);

  // 4) Add liquidity: 10M NXI + 0.02 BNB
  const amountBNB = ethers.parseEther("0.02");
  const wbnb = await router.WETH();
  console.log("   WBNB:", wbnb);

  const tx3 = await router.addLiquidityETH(
    TOKEN, amountNXI, 0, 0, OWNER, Math.floor(Date.now()/1000) + 600,
    { value: amountBNB, gasLimit: 800000 }
  );
  const receipt = await tx3.wait();
  console.log("3) Likidite eklendi:", tx3.hash);
  console.log("   Gaz: ", receipt.gasUsed.toString());

  // 5) Get LP token address from factory
  const factoryAddr = "0x6725F303b657a9451d8BA641348b6761A6CC7a17";
  const factory = new ethers.Contract(factoryAddr, [
    "function getPair(address,address) view returns (address)"
  ], provider);
  const pair = await factory.getPair(TOKEN, wbnb);
  console.log("   LP Token:", pair);
  console.log("\n=== TAMAMLANDI ===");
}

main().catch(console.error);
