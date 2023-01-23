// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

/**
 * @title IFeeManager
 * @author Identity Team @IOVLabs
 */
interface IFeeManager {
    /**
     * @notice event emitted on successful withdrawal
     * @param amount amount of tokens withdrawn
     * @param to address tokens were deposited to
     */
    event WithdrawalSuccessful(uint256 amount, address to);

    /**
     * @notice event emitted on successful deposit
     * @param amount of tokens deposited
     * @param from address tokens were deposited from
     */
    event DepositSuccessful(uint256 amount, address from);

    /**
     * @notice allows the partner to withdraw the balance of their revenue
     * @custom:emits-event emits the WithdrawalSuccessful event
     */
    function withdraw() external;

    /**
     * @notice allows the registrar and renewer to deposit the partners revenue share
     * @param partner address of the partners that triggered the deposit
     * @param amount amount of tokens from the sale
     * @custom:emits-event emits the DepositSuccessful event
     */
    function deposit(address partner, uint256 amount) external;

    /**
     * @notice allows checking the revenue balance of any partner
     * @param partner address of the partner
     */
    function getBalance(address partner) external view returns (uint256);
}
