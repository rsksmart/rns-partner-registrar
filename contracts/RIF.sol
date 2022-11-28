// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface RIF {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 tokens) external returns (bool);
}
