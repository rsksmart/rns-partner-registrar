// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface IBaseRegistrar {
    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external;
}
