// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./PartnerProxy.sol";
import "./CloneFactory.sol";
import "../Registrar/IBaseRegistrar.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";

contract PartnerProxyFactory is Ownable, CloneFactory {
    struct Partner {
        string name;
        PartnerProxy proxy;
    }
    mapping(address => Partner) private _partnerProxies;
    address private _masterProxy;
    uint256 public partnerProxyCount;
    IERC677 private _rif;

    event NewPartnerProxyCreated(PartnerProxy newPartnerProxy, Partner data);

    constructor(address masterProxy, IERC677 rif) Ownable() {
        _masterProxy = masterProxy;
        _rif = rif;
    }

    function createNewPartnerProxy(
        address partner,
        string calldata name,
        IBaseRegistrar partnerRegistrar
    ) external onlyOwner {
        PartnerProxy newPartnerProxy = PartnerProxy(_createClone(_masterProxy));
        newPartnerProxy.init(partner, partnerRegistrar, _rif);
        _partnerProxies[partner] = Partner(name, newPartnerProxy);
        partnerProxyCount++;
        emit NewPartnerProxyCreated(newPartnerProxy, _partnerProxies[partner]);
    }

    function getPartnerProxiesCount() external view returns (uint256) {
        return partnerProxyCount;
    }

    function getPartnerProxy(address partner)
        external
        view
        returns (Partner memory)
    {
        return _partnerProxies[partner];
    }
}
