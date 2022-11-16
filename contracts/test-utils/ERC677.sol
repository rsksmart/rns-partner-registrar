// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Use only for testing purposes
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC677 is ERC20 {
    uint256 private constant _TOTAL_SUPPLY = 1000000000 ether;

    constructor(
        address initialAccount,
        uint256 initialBalance,
        string memory tokenName,
        string memory tokenSymbol
    ) ERC20(tokenName, tokenSymbol) {
        _mint(initialAccount, initialBalance);
    }

    function totalSupply() public pure override returns (uint256) {
        return _TOTAL_SUPPLY;
    }
}
