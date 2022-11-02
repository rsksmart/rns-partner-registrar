// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface RIF {
    function transferFrom(address from, address to, uint amount) external returns (bool);
}