// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FreedomUnits is ERC20, Ownable {

    bool private locked;
    
    modifier noReentrancy() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    constructor(address initialOwner)
        ERC20("Freedom Units", "FU")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyOwner noReentrancy {
        _mint(to, amount);
    }
}
