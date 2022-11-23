// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Use only for testing purposes
import "@rsksmart/erc677/contracts/ERC677.sol";

contract ERC677Token is ERC677 {
    uint256 private constant _TOTAL_SUPPLY = 1000000000 ether;

    constructor(
        address initialAccount,
        uint256 initialBalance,
        string memory tokenName,
        string memory tokenSymbol
    ) ERC677(initialAccount, initialBalance, tokenName, tokenSymbol) {}
}
