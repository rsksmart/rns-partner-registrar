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

    /**
     * @notice event emitted when a domain has been successfully renewed
     * @param partner through which the domain was renewed (an address)
     * @param duration the duration of the renewal in years
     */
    event NameRenewed(address indexed partner, uint256 duration);

    /**
     * @notice event emitted when a fee manager contract is set
     * @param hostContract contract on which the fee manager is set
     * @param feeManagerContract the address of the fee manager being set
     */
    event FeeManagerChanged(address hostContract, address feeManagerContract);
}
