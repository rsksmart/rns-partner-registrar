// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface IFeeManager {
    function withdraw() external;

    function deposit(address partner, uint256 amount) external;
}
