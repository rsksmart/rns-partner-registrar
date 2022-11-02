// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./IPartnerManager.sol";
import "./IPartnerConfiguration.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PartnerManager is IPartnerManager, Ownable {
    mapping(address => bool) private _partners;
    mapping(address => IPartnerConfiguration) private _partnerConfigurations;

    constructor() Ownable() {}

    function isPartner(address partner) public view returns (bool) {
        return _partners[partner];
    }

    function addPartner(address partner) external onlyOwner {
        _partners[partner] = true;
    }

    function removePartner(address partner) external onlyOwner {
        _partners[partner] = false;
    }

    function setPartnerConfiguration(
        address partner,
        IPartnerConfiguration partnerConfiguration
    ) external onlyOwner {
        require(isPartner(partner), "PartnerManager: not a partner");
        _partnerConfigurations[partner] = partnerConfiguration;
    }

    function getPartnerConfiguration(address partner)
        external
        view
        returns (IPartnerConfiguration)
    {
        return _partnerConfigurations[partner];
    }
}

