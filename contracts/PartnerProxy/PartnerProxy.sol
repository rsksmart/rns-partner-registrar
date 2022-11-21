// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../Registrar/IBaseRegistrar.sol";
import "hardhat/console.sol";

contract PartnerProxy is Ownable {
    // address public partner;
    IBaseRegistrar private _partnerRegistrar;

    constructor() Ownable() {}

    // modifier onlyPartner() {
    //     require(msg.sender == partner, "Unathourized: caller not authorized");
    //     _;
    // }

    function init(address _partner, IBaseRegistrar partnerRegistrar) external {
        _transferOwnership(_partner);
        _partnerRegistrar = partnerRegistrar;
    }

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external onlyOwner {
        _partnerRegistrar.register(name, nameOwner, secret, duration);
    }

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        return _partnerRegistrar.price(name, expires, duration);
    }

    function canReveal(bytes32 commitment)
        public
        view
        onlyOwner
        returns (bool)
    {
        return _partnerRegistrar.canReveal(commitment);
    }

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(label, nameOwner, secret));
    }

    function commit(bytes32 commitment) external onlyOwner {
        _partnerRegistrar.commit(commitment);
    }
}
