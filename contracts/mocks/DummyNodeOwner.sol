// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "../NodeOwner.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DummyNodeOwner is NodeOwner, Ownable {
    uint256 private _theExpirationTime;

    function register(
        bytes32 label,
        address tokenOwner,
        uint256 duration
    ) external {}

    function expirationTime(uint256 label) external view returns (uint256) {
        return _theExpirationTime;
    }
}
