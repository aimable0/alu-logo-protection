// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ALULogoToken is ERC20, Ownable {
    // Pass the initial owner address into the OpenZeppelin Ownable constructor
    constructor(address initialOwner) ERC20("ALU Logo Token", "ALUT") Ownable(initialOwner) {
        // Mint the total supply of 1,000,000 tokens to the initial owner
        // decimals() defaults to 18 in ERC-20
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }

    // Function 4: Distribute Shares (Restricted to the contract owner)
    function distributeShares(address recipient, uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        // Transfer the tokens from the owner (msg.sender) to the recipient
        _transfer(msg.sender, recipient, amount);
    }

    // Function 5: Calculate Ownership Percentage
    function ownershipPercentage(address wallet) public view returns (uint256) {
        uint256 balance = balanceOf(wallet);
        
        // Multiply by 100 before dividing to ensure the integer division 
        // accurately calculates the percentage without rounding to zero.
        return (balance * 100) / totalSupply();
    }
}
