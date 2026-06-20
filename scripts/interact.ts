import { ethers } from "hardhat";

async function main() {
  const tokenAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [deployer, user1] = await ethers.getSigners();

  const token = await ethers.getContractAt("NexusAI", tokenAddr);

  console.log("=== NEXUS AI ($NXI) ===");
  console.log("Name:", await token.name());
  console.log("Symbol:", await token.symbol());
  console.log("Total Supply:", ethers.formatEther(await token.totalSupply()), "NXI");
  console.log("Decimals:", await token.decimals());
  console.log("Owner Balance:", ethers.formatEther(await token.balanceOf(deployer.address)), "NXI\n");

  // Transfer
  const tx = await token.transfer(user1.address, ethers.parseEther("1000"));
  await tx.wait();
  console.log("Transferred 1000 NXI to user1");
  console.log("User1 Balance:", ethers.formatEther(await token.balanceOf(user1.address)), "NXI\n");

  // Burn
  await token.burn(ethers.parseEther("500"));
  console.log("Burned 500 NXI");
  console.log("New Total Supply:", ethers.formatEther(await token.totalSupply()), "NXI");
}

main().catch(console.error);
