// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../PartnerProxyFactoryBase.sol";
import "../../Registrar/IBaseRegistrar.sol";
import "../../Renewer/IBaseRenewer.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";
import "./PartnerRenewerProxy.sol";

/**
 * @title PartnerRegistrarProxyFactory
 * @author Identity Team @IOVLabs
 * @dev Extends PartnerProxyFactoryBase to enable creations of PartnerRegistrarProxy instances with the specific createNewPartnerProxy for
 * PartnerRegistrar Proxies.
 */
contract PartnerRenewerProxyFactory is PartnerProxyFactoryBase {
    constructor(
        IERC677 rif,
        IBaseRegistrar partnerRegistrar,
        IBaseRenewer partnerRenewer
    ) PartnerProxyFactoryBase(rif, partnerRegistrar, partnerRenewer) {}

    function createNewPartnerProxy(
        address partner,
        string calldata name
    ) external override onlyOwner {
        PartnerRenewerProxy newPartnerProxy = new PartnerRenewerProxy(
            partner,
            _partnerRegistrar,
            _partnerRenewer,
            _rif
        );

        partnerProxyCount++;
        _partnerProxies[partner][name] = Partner(
            name,
            address(newPartnerProxy)
        );
        emit NewPartnerProxyCreated(
            address(newPartnerProxy),
            _partnerProxies[partner][name]
        );
    }
}
