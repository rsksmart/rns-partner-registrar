// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../Registrar/PartnerRegistrar.sol";

contract PartnerProxy {
    address public partner;
    PartnerRegistrar private _partnerRegistrar;

    constructor(PartnerRegistrar partnerRegistrar) {
        _partnerRegistrar = partnerRegistrar;
    }

    function init(address _partner) external {
        partner = _partner;
    }

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external {
        _partnerRegistrar.register(name, nameOwner, secret, duration);
    }

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external returns (uint256) {
        return _partnerRegistrar.price(name, expires, duration);
    }

    function canReveal(bytes32 commitment) public view returns (bool) {
        return _partnerRegistrar.canReveal(commitment);
    }

    function commit(bytes32 commitment) external {
        return _partnerRegistrar.commit(commitment);
    }
}
