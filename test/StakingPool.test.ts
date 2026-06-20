import { expect } from "chai";
import { ethers } from "hardhat";

describe("StakingPool", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const NexusAI = await ethers.getContractFactory("NexusAI");
    const token = await NexusAI.deploy(owner.address);
    await token.waitForDeployment();
    const tokenAddr = await token.getAddress();

    const StakingPool = await ethers.getContractFactory("StakingPool");
    const pool = await StakingPool.deploy(tokenAddr, tokenAddr, owner.address);
    await pool.waitForDeployment();
    const poolAddr = await pool.getAddress();

    // Fund users
    await token.transfer(user1.address, ethers.parseEther("10000"));
    await token.transfer(user2.address, ethers.parseEther("5000"));

    return { token, pool, owner, user1, user2, tokenAddr, poolAddr };
  }

  it("should deploy with correct params", async () => {
    const { token, pool, owner, tokenAddr } = await deployFixture();
    expect(await pool.stakingToken()).to.equal(tokenAddr);
    expect(await pool.rewardToken()).to.equal(tokenAddr);
    expect(await pool.owner()).to.equal(owner.address);
    expect(await pool.totalStaked()).to.equal(0);
  });

  it("should allow staking", async () => {
    const { token, pool, user1 } = await deployFixture();
    const amount = ethers.parseEther("1000");
    await token.connect(user1).approve(await pool.getAddress(), amount);
    await pool.connect(user1).stake(amount);
    expect(await pool.stakedBalance(user1.address)).to.equal(amount);
    expect(await pool.totalStaked()).to.equal(amount);
  });

  it("should accumulate rewards over time", async () => {
    const { token, pool, user1, poolAddr } = await deployFixture();
    const amount = ethers.parseEther("1000");
    await token.connect(user1).approve(poolAddr, amount);
    await pool.connect(user1).stake(amount);

    await token.transfer(poolAddr, ethers.parseEther("100000"));

    const secInYear = 365n * 86400n;
    const rate = ethers.parseEther("1000") / secInYear;
    await pool.setRewardRate(rate);

    await ethers.provider.send("evm_increaseTime", [365 * 86400]);
    await ethers.provider.send("evm_mine", []);

    const earned = await pool.earned(user1.address);
    expect(earned).to.be.closeTo(ethers.parseEther("1000"), ethers.parseEther("10"));
  });

  it("should claim rewards", async () => {
    const { token, pool, user1, poolAddr } = await deployFixture();
    const amount = ethers.parseEther("1000");
    await token.connect(user1).approve(poolAddr, amount);
    await pool.connect(user1).stake(amount);

    await token.transfer(poolAddr, ethers.parseEther("100000"));

    const secInYear = 365n * 86400n;
    const rate = ethers.parseEther("1000") / secInYear;
    await pool.setRewardRate(rate);
    await ethers.provider.send("evm_increaseTime", [365 * 86400]);
    await ethers.provider.send("evm_mine", []);

    const beforeBal = await token.balanceOf(user1.address);
    await pool.connect(user1).claimRewards();
    const afterBal = await token.balanceOf(user1.address);
    expect(afterBal - beforeBal).to.be.closeTo(ethers.parseEther("1000"), ethers.parseEther("10"));
  });

  it("should withdraw stake", async () => {
    const { token, pool, user1 } = await deployFixture();
    const amount = ethers.parseEther("1000");
    await token.connect(user1).approve(await pool.getAddress(), amount);
    await pool.connect(user1).stake(amount);

    const beforeBal = await token.balanceOf(user1.address);
    await pool.connect(user1).withdraw(amount);
    const afterBal = await token.balanceOf(user1.address);
    expect(afterBal - beforeBal).to.equal(amount);
    expect(await pool.stakedBalance(user1.address)).to.equal(0);
    expect(await pool.totalStaked()).to.equal(0);
  });

  it("should pause and unpause staking", async () => {
    const { pool, owner, user1, token } = await deployFixture();
    await pool.connect(owner).pause();
    const amount = ethers.parseEther("100");
    await token.connect(user1).approve(await pool.getAddress(), amount);
    await expect(pool.connect(user1).stake(amount)).to.be.reverted;

    await pool.connect(owner).unpause();
    await pool.connect(user1).stake(amount);
    expect(await pool.stakedBalance(user1.address)).to.equal(amount);
  });

  it("should only allow owner to set reward rate", async () => {
    const { pool, user1 } = await deployFixture();
    await expect(pool.connect(user1).setRewardRate(ethers.parseEther("1"))).to.be.revertedWithCustomError(
      pool, "OwnableUnauthorizedAccount"
    );
  });
});
