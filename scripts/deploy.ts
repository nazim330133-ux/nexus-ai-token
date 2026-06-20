import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const NexusAI = await ethers.getContractFactory("NexusAI");
  const token = await NexusAI.deploy(deployer.address);
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log("NexusAI deployed to:", addr);
  console.log("Total supply:", ethers.formatEther(await token.totalSupply()), "NXI");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
