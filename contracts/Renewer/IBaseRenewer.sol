// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../FeeManager/IFeeManager.sol";

/**
 * @title Defines the common behavior for a Partner Renewer.
 */
interface IBaseRenewer {
    /**
        @notice calculates the price of a name
        @param name the name to register
        @param duration the duration of the registration in years
        @param partner Partner address
        @return the price of the name
    */
    function price(
        string calldata name,
        uint256 duration,
        address partner
    ) external view returns (uint256);

    /**
     * @notice allows domain name owner to renew their ownership
     * @param name the domain name to be renewed
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

    /**
     * @notice event emitted when a partner manager contract is set
     * @param changedBy the address of user that changed the partner manager address
     * @param partnerManager the address of the partner manager being set
     */
    event PartnerManagerChanged(address changedBy, address partnerManager);

    /**
        @notice sets the fee manager to use. Mandatory for the renewer to work.
        @param feeManager the fee manager to use
        @custom:emits-event emits the FeeManagerSet event
    */
    function setFeeManager(IFeeManager feeManager) external;

    /**
     * @notice returns the partner manager that the registrar has been configured to use
     */
    function getPartnerManager() external view returns (address);

    /**
     * @notice sets the _partnerManager
     * @param partnerManager address of the partner manager to be set
     */
    function setPartnerManager(address partnerManager) external;

    /**
        @notice returns the fee manager that the registrar has been configured to use
    */
    function getFeeManager() external view returns (address);

    /**
     * @notice error thrown when the partner is not whitelisted
     * @param partner address of the invlalid partner
     */
    error InvalidPartner(address partner);

    /**
     * @notice error thrown when a token transfer fails
     * @param from address from which the tokens were transferred
     * @param to address to which the tokens were transferred
     * @param amount amount of tokens transferred
     */
    error TokenTransferFailed(address from, address to, uint256 amount);

    /**
     * @notice error thrown when approval for a token transfer fails
     * @param from address from which the tokens were transferred
     * @param to address to which the tokens were transferred
     * @param amount amount of tokens transferred
     */
    error TokenApprovalFailed(address from, address to, uint256 amount);

    /**
     * @notice error thrown when the amount of tokens transferred is insufficient
     * @param expected amount of tokens expected
     * @param actual amount of tokens transferred
     */
    error InsufficientTokensTransfered(uint256 expected, uint256 actual);

    /**
     * @notice custom error
     * @param message error message
     */
    error CustomError(string message);
}
