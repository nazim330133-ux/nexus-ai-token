import { expect } from "chai";
import { ethers } from "hardhat";
import { NexusAI } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NexusAI", function () {
  let token: NexusAI;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const MAX_SUPPLY = ethers.parseEther("100000000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const NexusAI = await ethers.getContractFactory("NexusAI");
    token = await NexusAI.deploy(owner.address);
    await token.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("Nexus AI");
    expect(await token.symbol()).to.equal("NXI");
  });

  it("should mint max supply to owner", async function () {
    expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    expect(await token.balanceOf(owner.address)).to.equal(MAX_SUPPLY);
  });

  it("should not allow minting beyond max supply", async function () {
    const NexusAI = await ethers.getContractFactory("NexusAI");
    const newToken = await NexusAI.deploy(owner.address);
    await newToken.waitForDeployment();
    expect(await newToken.totalSupply()).to.equal(MAX_SUPPLY);
  });

  it("should allow transfers", async function () {
    await token.transfer(user1.address, ethers.parseEther("1000"));
    expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
  });

  it("should allow burning", async function () {
    await token.burn(ethers.parseEther("1000"));
    expect(await token.totalSupply()).to.equal(MAX_SUPPLY - ethers.parseEther("1000"));
  });

  it("should pause and unpause", async function () {
    await token.pause();
    await expect(
      token.transfer(user1.address, ethers.parseEther("100"))
    ).to.be.revertedWithCustomError(token, "EnforcedPause");

    await token.unpause();
    await token.transfer(user1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
  });

  it("should only allow owner to pause", async function () {
    await expect(
      token.connect(user1).pause()
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });
});
