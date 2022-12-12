// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IPartnerProxyFactory.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";
import "../Registrar/IBaseRegistrar.sol";
import "../Renewer/IBaseRenewer.sol";

/**
    @author Identity Team @IOVLabs
    @title PartnerProxyFactoryBase
    @dev Defines the common behavior for a Partner Proxy Factory.
*/
abstract contract PartnerProxyFactoryBase is IPartnerProxyFactory, Ownable {
    mapping(address => mapping(string => Partner)) internal _partnerProxies;
    uint256 public partnerProxyCount = 0;
    IERC677 internal _rif;
    IBaseRegistrar internal _partnerRegistrar;
    IBaseRenewer internal _partnerRenewer;

    constructor(
        IERC677 rif,
        IBaseRegistrar partnerRegistrar,
        IBaseRenewer partnerRenewer
    ) Ownable() {
        _rif = rif;
        _partnerRegistrar = partnerRegistrar;
        _partnerRenewer = partnerRenewer;
    }

    /**
       @inheritdoc IPartnerProxyFactory
     */
    function getPartnerProxiesCount() external view override returns (uint256) {
        return partnerProxyCount;
    }

    /**
       @inheritdoc IPartnerProxyFactory
     */
    function getPartnerProxy(address partner, string calldata name)
        external
        view
        override
        returns (Partner memory)
    {
        return _partnerProxies[partner][name];
    }
}
