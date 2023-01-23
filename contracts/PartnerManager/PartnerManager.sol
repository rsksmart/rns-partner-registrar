// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IPartnerManager.sol";
import "../PartnerConfiguration/IPartnerConfiguration.sol";
import "../Access/IAccessControl.sol";
import "../Access/HasAccessControl.sol";

/**
    @author Identity Team @IOVLabs
    @title Keeps track of the whitelisted partners and its configurations.
*/
contract PartnerManager is IPartnerManager, HasAccessControl {
    struct Partner {
        bool isPartner;
        IPartnerConfiguration configuration;
    }

    mapping(address => Partner) private _partners;

    constructor(IAccessControl accessControl) HasAccessControl(accessControl) {}

    /**
       @inheritdoc IPartnerManager
     */
    function isPartner(address partner) public view override returns (bool) {
        return _partners[partner].isPartner;
    }

    /**
       @inheritdoc IPartnerManager
     */
    function addPartner(
        address partner,
        IPartnerConfiguration partnerConfiguration
    ) external override onlyHighLevelOperator {
        require(
            !_partners[partner].isPartner,
            "PartnerManager: Partner already exists"
        );
        _partners[partner] = Partner(true, partnerConfiguration);
        emit PartnerAdded(partner, address(partnerConfiguration));
    }

    /**
       @inheritdoc IPartnerManager
     */
    function removePartner(
        address partner
    ) external override onlyHighLevelOperator {
        emit PartnerRemoved(partner);
        delete _partners[partner];
    }

    /**
       @inheritdoc IPartnerManager
     */
    function setPartnerConfiguration(
        address partner,
        IPartnerConfiguration partnerConfiguration
    ) external override onlyHighLevelOperator {
        emit PartnerConfigurationChanged(
            partner,
            address(partnerConfiguration)
        );

        require(
            address(partnerConfiguration) != address(0),
            "PartnerManager: Invalid configuration"
        );
        require(isPartner(partner), "PartnerManager: not a partner");

        _partners[partner].configuration = partnerConfiguration;
    }

    /**
       @inheritdoc IPartnerManager
     */
    function getPartnerConfiguration(
        address partner
    ) public view override returns (IPartnerConfiguration) {
        return _partners[partner].configuration;
    }
}
