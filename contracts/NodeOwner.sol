// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface NodeOwner {
    function register(bytes32 label, address tokenOwner, uint duration) external;
    function expirationTime(uint256 label) external view returns (uint);
}