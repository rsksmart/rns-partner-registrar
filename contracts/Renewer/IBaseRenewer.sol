// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

interface IBaseRenewer {
    function renew(string calldata name, uint256 duration) external;

    event NameRenewed(address indexed partner, uint256 duration);
}
