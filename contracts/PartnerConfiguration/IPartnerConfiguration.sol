// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

/**
 * @title IPartnerConfiguration
 * @author Identity Team @IOVLabs
 * @dev Defines the configuration for a partner in particular
 */
interface IPartnerConfiguration {
    /**
     * @notice returns the minimum length allowed for a domain name
     */
    function getMinLength() external view returns (uint256);

    /**
     * @notice returns the maximum length allowed for a domain name
     */
    function getMaxLength() external view returns (uint256);

    /**
     * @notice returns support for unicode domains
     */
    function getUnicodeSupport() external view returns (bool);

    /**
     * @notice returns the minimum duration allowed for a domain name
     */
    function getMinDuration() external view returns (uint256);

    /**
     * @notice returns the maximum duration allowed for a domain name
     */
    function getMaxDuration() external view returns (uint256);

    /**
     * @notice returns the fee percentage assigned to the partner for each domain name registered
     */
    function getFeePercentage() external view returns (uint256);

    /**
     * @notice returns the discount assigned to the partner for each domain name registered
     */
    function getDiscount() external view returns (uint256);

    /**
     * @notice returns the minimum commitment age allowed for a domain name
     */
    function getMinCommitmentAge() external view returns (uint256);

    /**
     * @notice returns the price of a domain name
     */
    function getPrice(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view returns (uint256);

    /**
     * @notice sets the minimum commitment age allowed for a domain name
     * @param minCommitmentAge the minimum commitment age allowed for a domain name in seconds
     */
    function setMinCommitmentAge(uint256 minCommitmentAge) external;

    /**
     * @notice sets the discount assigned to the partner for each domain name registered
     * @param discount the discount assigned to the partner for each domain name registered
     */
    function setDiscount(uint256 discount) external;

    /**
     * @notice sets the fee percentage assigned to the partner for each domain name registered
     */
    function setFeePercentage(uint256 feePercentage) external;

    /**
     * @notice sets the maximum duration allowed for a domain name
     * @param maxDuration the maximum duration allowed for a domain name in days
     */
    function setMaxDuration(uint256 maxDuration) external;

    /**
     * @notice sets support for unicode domains
     * @param flag true if unicode domains are supported, false otherwise
     */
    function setUnicodeSupport(bool flag) external;

    /**
     * @notice sets the maximum length allowed for a domain name
     * @param maxLength the maximum length allowed for a domain name
     */
    function setMaxLength(uint256 maxLength) external;

    /**
     * @notice sets the minimum duration allowed for a domain name
     * @param minDuration the minimum duration allowed for a domain name in days
     */
    function setMinDuration(uint256 minDuration) external;

    /**
     * @notice sets the minimum length allowed for a domain name
     * @param minLength the minimum length allowed for a domain name
     */
    function setMinLength(uint256 minLength) external;

    /**
     * @notice checks if the name is valid and reverts with reason if not
     * @param name name under validation
     * @param duration duration for which the name should be registered
     */
    function validateName(string memory name, uint256 duration) external view;
}
