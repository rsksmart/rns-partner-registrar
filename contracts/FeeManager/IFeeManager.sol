// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

/**
 * @title IFeeManager
 * @author Identity Team @IOVLabs
 */
interface IFeeManager {
    /**
     * @notice thrown when an account tries to withdraw with a zero balance
     */
    error ZeroBalance();
    /**
     * @notice thrown when an account tries to perform an action that is not authorised
     */
    error NotAuthorized(address sender);
    /**
     * @notice thrown when the transfer of tokens fails
     * @param from address of the sender
     * @param to address of the receiver
     * @param amount amount of tokens
     */
    error TransferFailed(address from, address to, uint256 amount);

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
     * @notice event emitted when the pool address is changed
     * @param changedBy address of the account that changed the pool address
     * @param newPoolAddress address of the new pool
     */
    event PoolChanged(address changedBy, address newPoolAddress);

    /**
     * @notice event emitted when the registrar address is changed
     * @param changedBy address of the account that changed the registrar address
     * @param newRegistrarAddress address of the new registrar
     */
    event RegistrarChanged(address changedBy, address newRegistrarAddress);

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

    /**
     * @notice allows checking the address of the pool
     */
    function getPool() external view returns (address);

    /**
     * @notice allows modifying the address of the pool
     * @param poolAddresss address of the new pool
     */
    function setPool(address poolAddresss) external;

    /**
     * @notice allows checking the address of the registrar
     */
    function getRegistrar() external view returns (address);

    /**
     * @notice allows modifying the address of the registrar
     * @param newRegistrarAddresss address of the new registrar
     */
    function setRegistrar(address newRegistrarAddresss) external;
}
