// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../Registrar/IBaseRegistrar.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";

/**
 * @title IPartnerProxyFactory
 * @author Identity Team @IOVLabs
 * @dev Allows the creation of PartnerProxy contracts that are compatible with the Partner Registrar
 */
interface IPartnerProxyFactory {
    struct Partner {
        string name;
        address proxy;
    }

    event NewPartnerProxyCreated(address newPartnerProxy, Partner data);

    /**
     * @notice allows the owner to create a new PartnerProxy contract
     * @param partner the address of the partner
     * @param name the name of the partner
     */
    function createNewPartnerProxy(
        address partner,
        string calldata name
    ) external;

    /**
     * @notice gets the number of partner proxies assigned to a particular partner account
     */
    function getPartnerProxiesCount() external view returns (uint256);

    /**
     * @notice gets the partner proxy assigned to a particular partner account
     * @param partner address of the partner
     * @param name of the proxy
     */
    function getPartnerProxy(
        address partner,
        string calldata name
    ) external view returns (Partner memory);
}
