// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../FeeManager/IFeeManager.sol";
import "./IBaseRenewer.sol";

/**
 * @title Defines the common behavior for a Multi TLD Partner Renewer.
 */
abstract contract IMultiTLDPartnerRenewer is IBaseRenewer {
    /**
        @notice calculates the price of a name
        @param name the name to register
        @param duration the duration of the registration in years
        @param partner Partner address
        @param tld top level domain
        @return the price of the name
    */
    function price(
        string calldata name,
        uint256 duration,
        address partner,
        bytes32 tld
    ) external view virtual returns (uint256);

    /**
     * @notice allows domain name owner to renew their ownership
     * @param name the domain name to be renewed
     * @param duration the duration of the renewal
     * @param partner Partner address
     * @param tld top level domain
     */
    function renew(
        string calldata name,
        uint256 duration,
        address partner,
        bytes32 tld
    ) external virtual;
}
