// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./PartnerConfiguration.sol";
import "./IPartnerManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PartnerManager is IPartnerManager, Ownable {
    mapping(address => bool) private _partners;

    constructor() Ownable() {}

    function isPartner(address partner) public view returns (bool) {
        return _partners[partner];
    }

    function addPartner(address partner) public onlyOwner {
        _partners[partner] = true;
    }

    function removePartner(address partner) public onlyOwner {
        _partners[partner] = false;
    }

    function setPartnerConfiguration(
        address partner,
        PartnerConfiguration memory configuration
    ) external override {}

    function getPartnerConfiguration(address partner)
        external
        override
        returns (PartnerConfiguration memory)
    {}
}

