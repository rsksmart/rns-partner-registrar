// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IPartnerManager.sol";
import "../PartnerConfiguration/IPartnerConfiguration.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
    @author Identity Team @IOVLabs
    @title PartnerManager
    @dev Keeps track of the whitelisted partners and its configurations.
*/
contract PartnerManager is IPartnerManager, Ownable {
    mapping(address => bool) private _partners;
    mapping(address => IPartnerConfiguration) private _partnerConfigurations;
    mapping(address => address) private _partnerOwnerAccounts;

    event PartnerAdded(address indexed partner, address indexed ownerAccount);
    event PartnerRemoved(address indexed partner, address indexed ownerAccount);

    /**
       @inheritdoc IPartnerManager
     */
    function isPartner(address partner) public view override returns (bool) {
        return _partners[partner];
    }

    /**
       @inheritdoc IPartnerManager
     */
    function addPartner(
        address partner,
        address partnerOwnerAccount
    ) external override onlyOwner {
        _partners[partner] = true;
        _partnerOwnerAccounts[partner] = partnerOwnerAccount;
        emit PartnerAdded(partner, partnerOwnerAccount);
    }

    /**
       @inheritdoc IPartnerManager
     */
    function removePartner(address partner) external override onlyOwner {
        _partners[partner] = false;

        emit PartnerRemoved(partner, _partnerOwnerAccounts[partner]);
    }

    /**
       @inheritdoc IPartnerManager
     */
    function setPartnerConfiguration(
        address partner,
        IPartnerConfiguration partnerConfiguration
    ) external override onlyOwner {
        require(
            partnerConfiguration != IPartnerConfiguration(address(0)),
            "PartnerManager: Invalid configuration"
        );
        require(isPartner(partner), "PartnerManager: not a partner");

        _partnerConfigurations[partner] = partnerConfiguration;
    }

    /**
       @inheritdoc IPartnerManager
     */
    function getPartnerConfiguration(
        address partner
    ) public view override returns (IPartnerConfiguration) {
        return _partnerConfigurations[partner];
    }

    /**
       @inheritdoc IPartnerManager
     */
    function getPartnerOwnerAccount(
        address partner
    ) external view override returns (address) {
        return _partnerOwnerAccounts[partner];
    }
}
