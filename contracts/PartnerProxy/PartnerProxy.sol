// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../Registrar/IBaseRegistrar.sol";

contract PartnerProxy is Ownable {
    IBaseRegistrar private _partnerRegistrar;

    constructor() Ownable() {}

    modifier onlyOnce() {
        require(owner() == address(0), "Init: clone cannot be reinitialized");
        _;
    }

    function init(address _partner, IBaseRegistrar partnerRegistrar)
        external
        onlyOnce
    {
        _transferOwnership(_partner);
        _partnerRegistrar = partnerRegistrar;
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

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(label, nameOwner, secret));
    }

    function commit(bytes32 commitment) external {
        _partnerRegistrar.commit(commitment);
    }
}
