import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Faucet = await ethers.getContractFactory("NexusFaucet");
  const faucet = await Faucet.deploy("0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E", deployer.address);
  await faucet.waitForDeployment();
  const addr = await faucet.getAddress();
  console.log("Faucet:", addr);
}

main().catch(console.error);
