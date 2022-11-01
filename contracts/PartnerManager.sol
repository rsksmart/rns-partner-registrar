// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./RegistrarAccessControl.sol";
import "./PartnerConfiguration.sol";
import "./IPartnerManager.sol";
import "./IRegistrarModule.sol";

contract PartnerManager is IPartnerManager {
    mapping(address => PartnerConfiguration) private _partnerConfigurations;

    IRegistrarModule private registrarModule;

    constructor(IRegistrarModule _registrarModule) {
        registrarModule = _registrarModule;
    }

    function setPartnerConfiguration(address partner, PartnerConfiguration memory configuration) public {
        registrarModule.getAccessControl().isOwner(msg.sender);
        registrarModule.getAccessControl().isPartner(partner);

        _partnerConfigurations[partner] = configuration;
    }

    function getPartnerConfiguration(address partner) public returns (PartnerConfiguration memory) {
        registrarModule.getAccessControl().isPartner(partner);

        return _partnerConfigurations[partner];
    }
}

