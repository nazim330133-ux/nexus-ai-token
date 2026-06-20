// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NexusFaucet is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public claimAmount = 100 * 10 ** 18;
    uint256 public cooldown = 86400;

    mapping(address => uint256) public lastClaim;

    event Claimed(address indexed user, uint256 amount);

    constructor(address _token, address _owner) Ownable(_owner) {
        token = IERC20(_token);
    }

    function claim() external nonReentrant {
        require(block.timestamp - lastClaim[msg.sender] >= cooldown, "Bekleme suresi dolmadi");
        require(token.balanceOf(address(this)) >= claimAmount, "Faucette token kalmadi");
        lastClaim[msg.sender] = block.timestamp;
        token.transfer(msg.sender, claimAmount);
        emit Claimed(msg.sender, claimAmount);
    }

    function setClaimAmount(uint256 _amount) external onlyOwner {
        claimAmount = _amount;
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        cooldown = _cooldown;
    }

    function withdrawTokens() external onlyOwner {
        token.transfer(owner(), token.balanceOf(address(this)));
    }
}
