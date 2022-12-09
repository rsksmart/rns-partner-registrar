// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.7;

import "../../Registrar/IBaseRegistrar.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";

interface IPartnerRegistrarProxy {
    function init(
        address _partner,
        IBaseRegistrar partnerRegistrar,
        IERC677 rif
    ) external;

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr
    ) external;

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external returns (uint256);

    function canReveal(bytes32 commitment) external view returns (bool);

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) external pure returns (bytes32);

    function commit(bytes32 commitment) external;
}
