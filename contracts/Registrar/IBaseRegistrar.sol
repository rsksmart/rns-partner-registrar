// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "@rsksmart/erc677/contracts/IERC677TransferReceiver.sol";

interface IBaseRegistrar is IERC677TransferReceiver {
    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external;

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external returns (uint256);

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) external pure returns (bytes32);

    function commit(bytes32 commitment) external;

    function canReveal(bytes32 commitment) external view returns (bool);

    event NameRegistered(address indexed partner, uint256 duration);
}
