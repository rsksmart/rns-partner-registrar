// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./PartnerRegistrarAccessControl.sol";
import "./PartnerConfiguration.sol";

contract PartnerManager is PartnerRegistrarAccessControl {
    mapping(address => PartnerConfiguration) private _partnerConfigurations;

    function setPartnerConfiguration(address partner, PartnerConfiguration memory configuration) public onlyOwner(msg.sender) onlyPartner(partner) {
        _partnerConfigurations[partner] = configuration;
    }

    function getPartnerConfiguration(address partner) public view onlyPartner(partner) returns (PartnerConfiguration memory) {
        return _partnerConfigurations[partner];
    }
}

