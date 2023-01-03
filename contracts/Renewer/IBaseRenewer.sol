// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

/**
 * @title IBaseRenewer
 * @dev Defines the common behavior for a Partner Renewer.
 */
interface IBaseRenewer {
    /**
     * @notice allows name owner to renew their name
     * @param name the name of the partner
     * @param duration the duration of the renewal
     * @param partner Partner address
     */
    function renew(
        string calldata name,
        uint256 duration,
        address partner
    ) external;

    event NameRenewed(address indexed partner, uint256 duration);
}
