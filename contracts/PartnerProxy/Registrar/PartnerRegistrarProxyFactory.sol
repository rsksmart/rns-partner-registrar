// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./PartnerRegistrarProxy.sol";
import "../../Registrar/IBaseRegistrar.sol";
import "../../Renewer/IBaseRenewer.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";
import "./PartnerProxyFactoryBase.sol";

contract PartnerRegistrarProxyFactory is PartnerProxyFactoryBase {
    constructor(
        IERC677 rif,
        IBaseRegistrar partnerRegistrar,
        IBaseRenewer partnerRenewer
    ) PartnerProxyFactoryBase(rif, partnerRegistrar, partnerRenewer) {}

    function createNewPartnerProxy(
        address partner,
        string calldata name
    ) external override onlyOwner {
        PartnerRegistrarProxy newPartnerProxy = new PartnerRegistrarProxy(
            partner,
            _partnerRegistrar,
            _rif
        );
        _partnerProxies[partner][name] = Partner(
            name,
            address(newPartnerProxy)
        );
        partnerProxyCount++;
        emit NewPartnerProxyCreated(
            address(newPartnerProxy),
            _partnerProxies[partner][name]
        );
    }
}
