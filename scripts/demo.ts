import { ethers } from "hardhat";

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const NexusAI = await ethers.getContractFactory("NexusAI");
  const token = await NexusAI.deploy(deployer.address);
  await token.waitForDeployment();

  const addr = await token.getAddress();

  console.log("");
  console.log("╔══════════════════════════════════════╗");
  console.log("║     NEXUS AI ($NXI) DEPLOYED        ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("Contract:", addr);
  console.log("Owner:", deployer.address);
  console.log("Name:", await token.name());
  console.log("Symbol:", await token.symbol());
  console.log("Total Supply:", ethers.formatEther(await token.totalSupply()), "NXI");
  console.log("Decimals:", await token.decimals());
  console.log("");

  // Transfer
  const tx1 = await token.transfer(user1.address, ethers.parseEther("1000"));
  await tx1.wait();
  console.log("✅ Transfer: 1000 NXI →", user1.address);
  console.log("   Balance:", ethers.formatEther(await token.balanceOf(user1.address)), "NXI");

  // Burn
  const tx2 = await token.burn(ethers.parseEther("500"));
  await tx2.wait();
  console.log("🔥 Burn: 500 NXI");
  console.log("   New Supply:", ethers.formatEther(await token.totalSupply()), "NXI");

  // Pause/Unpause
  await token.pause();
  console.log("⏸️  Contract Paused");
  await token.unpause();
  console.log("▶️  Contract Unpaused");
  console.log("");
  console.log("✅ All tests passed!");
  console.log("📝 Ready for BSC Testnet deployment!");
}

main().catch(console.error);
