// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

/**
 * @title IFeeManager
 * @author Identity Team @IOVLabs
 */
interface IFeeManager {
    /**
     * @notice allows the partner to withdraw the balance of their revenue
     */
    function withdraw() external;

    /**
     * @notice allows the registrar and renewer to deposit the partners revenue share
     * @param partner of the partners proxy that triggered the deposit
     * @param amount of tokens from the sale
     */
    function deposit(address partner, uint256 amount) external;

    /**
     * @notice allows the registrar and renewer to deposit the partners revenue share
     * @param partner address of the partner's account that owns the proxies
     */
    function getBalance(address partner) external view returns (uint256);
}
