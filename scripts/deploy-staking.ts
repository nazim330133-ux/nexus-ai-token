import { ethers } from "hardhat";

const NXI_TOKEN = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const ECO_WALLET = "0xFF2d63bF34Ff4fC40573699D2eb4A113504FC194";
const ECO_PK = "0x18c1f701341a0a023eec274835f955566e1def2d4554c3a7f0644afaae5ca5d9";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  const [deployer] = await ethers.getSigners();
  const ownerAddr = deployer.address;
  console.log("Deployer:", ownerAddr);

  const StakingPool = await ethers.getContractFactory("StakingPool");
  const pool = await StakingPool.deploy(NXI_TOKEN, NXI_TOKEN, ownerAddr);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("StakingPool:", poolAddr);
  console.log("Staking Token:", await pool.stakingToken());
  console.log("Reward Token:", await pool.rewardToken());

  // Fund pool from Ecosystem wallet
  const ecoWallet = new ethers.Wallet(ECO_PK, provider);
  const token = new ethers.Contract(NXI_TOKEN, ["function transfer(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"], ecoWallet);
  const ecoBal = await token.balanceOf(ECO_WALLET);
  const fundAmount = ethers.parseEther("500000");
  if (ecoBal >= fundAmount) {
    const tx = await token.transfer(poolAddr, fundAmount);
    await tx.wait();
    console.log("Reward funded:", ethers.formatEther(fundAmount), "NXI (TX:", tx.hash, ")");
  } else {
    console.log("Ecosystem wallet low balance:", ethers.formatEther(ecoBal), "NXI");
  }

  // Set reward rate: 50% APY
  const secInYear = 365n * 86400n;
  const totalStakedTarget = ethers.parseEther("100000"); // assuming ~100k staked
  const annualReward = totalStakedTarget / 2n; // 50% APY
  const rate = annualReward / secInYear;
  const tx2 = await pool.setRewardRate(rate);
  await tx2.wait();
  console.log("Reward rate set:", rate.toString(), "(~50% APY if 100k staked)");
}

main().catch(console.error);
