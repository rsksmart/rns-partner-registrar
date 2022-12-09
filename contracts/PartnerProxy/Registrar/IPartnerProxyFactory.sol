// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.7;

import "./PartnerRegistrarProxy.sol";
import "../../Registrar/IBaseRegistrar.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";

interface IPartnerProxyFactory {
    struct Partner {
        string name;
        address partnerProxy;
    }

    event NewPartnerProxyCreated(address newPartnerProxy, Partner data);

    function createNewPartnerProxy(address partner, string calldata name)
        external;

    function getPartnerProxiesCount() external view returns (uint256);

    function getPartnerProxy(address partner, string calldata name)
        external
        view
        returns (Partner memory);
}
