// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./IPartnerManager.sol";
import "../PartnerConfiguration/IPartnerConfiguration.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PartnerManager is IPartnerManager, Ownable {
    mapping(address => bool) private _partners;
    mapping(address => IPartnerConfiguration) private _partnerConfigurations;
    mapping(address => address) private _partnerOwnerAccounts;

    event PartnerAdded(address indexed partner, address indexed ownerAccount);
    event PartnerRemoved(address indexed partner, address indexed ownerAccount);

    function isPartner(address partner) public view returns (bool) {
        return _partners[partner];
    }

    function addPartner(address partner, address partnerOwnerAccount)
        external
        onlyOwner
    {
        _partners[partner] = true;
        _partnerOwnerAccounts[partner] = partnerOwnerAccount;
        emit PartnerAdded(partner, partnerOwnerAccount);
    }

    function removePartner(address partner) external onlyOwner {
        _partners[partner] = false;

        emit PartnerRemoved(partner, _partnerOwnerAccounts[partner]);
    }

    function setPartnerConfiguration(
        address partner,
        IPartnerConfiguration partnerConfiguration
    ) external onlyOwner {
        require(
            partnerConfiguration != IPartnerConfiguration(address(0)),
            "PartnerManager: Invalid configuration"
        );
        require(isPartner(partner), "PartnerManager: not a partner");

        _partnerConfigurations[partner] = partnerConfiguration;
    }

    function getPartnerConfiguration(address partner)
        public
        view
        returns (IPartnerConfiguration)
    {
        return _partnerConfigurations[partner];
    }

    function getPartnerOwnerAccount(address partner)
        external
        view
        returns (address)
    {
        return _partnerOwnerAccounts[partner];
    }
}
