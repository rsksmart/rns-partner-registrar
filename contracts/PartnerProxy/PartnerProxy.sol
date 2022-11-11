// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../Registrar/IBaseRegistrar.sol";

contract PartnerProxy is IBaseRegistrar {
    address public partner;

    function init(address _partner) external {
        partner = _partner;
    }

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external override {}

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external override returns (uint256) {}

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) external pure override returns (bytes32) {}

    function commit(bytes32 commitment) external override {}

    function canReveal(bytes32 commitment)
        external
        view
        override
        returns (bool)
    {}
}
