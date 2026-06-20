import { ethers } from "hardhat";

const TOKEN_ADDR = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const OWNER_PK = "0xf2ab5bc212d874a685095ccfd905488e15d5e595ec830068db67ed414825259f";

interface FundWallet {
  name: string;
  address: string;
  amount: string;
}

const funds: FundWallet[] = [
  { name: "Likidite Havuzu",   address: "0xDf3371D59f87cB79Fda98347397a85Df4B8fe8D4", amount: "40000000" },
  { name: "Ekosistem Fonu",    address: "0xFF2d63bF34Ff4fC40573699D2eb4A113504FC194", amount: "30000000" },
  { name: "Gelistirme Fonu",   address: "0xE64FAD751A7A47Ed87c33a33fEc96983d470BcDF", amount: "15000000" },
  { name: "Ekip Vesting",      address: "0x3842F08a7dD1D9534D6086C98B6C24782357c088", amount: "10000000" },
  { name: "Airdrop/Pazarlama", address: "0xF804DcE47B413a7bd5E0B0b28E5c101757dBe067", amount: "5000000" },
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const signer = new ethers.Wallet(OWNER_PK, provider);
  const token = new ethers.Contract(TOKEN_ADDR, ["function transfer(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"], signer);

  console.log("=== NEXUS AI - Token Dagitimi ===\n");
  const ownerBal = await token.balanceOf(signer.address);
  console.log("Sahip bakiyesi:", ethers.formatEther(ownerBal), "NXI\n");

  for (const fund of funds) {
    const amt = ethers.parseEther(fund.amount);
    console.log(`${fund.name} -> ${fund.address}`);
    console.log(`  Miktar: ${fund.amount} NXI`);
    const tx = await token.transfer(fund.address, amt);
    await tx.wait();
    console.log(`  TX: ${tx.hash}`);
    const bal = await token.balanceOf(fund.address);
    console.log(`  Bakiye: ${ethers.formatEther(bal)} NXI\n`);
  }

  console.log("=== DAGITIM TAMAMLANDI ===");
}

main().catch(console.error);
