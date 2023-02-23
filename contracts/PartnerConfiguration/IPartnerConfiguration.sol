// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

/**
 * @title Defines the configuration for a partner in particular
 * @author Identity Team @IOVLabs
 */
interface IPartnerConfiguration {
    /**
     * @notice event emitted when the minimum length is changed
     * @param previousValue the old length
     * @param newValue the new length
     */
    event MinLengthChanged(uint256 previousValue, uint256 newValue);

    /**
     * @notice event emitted when the maximum length is changed
     * @param previousValue the old length
     * @param newValue the new length
     */
    event MaxLengthChanged(uint256 previousValue, uint256 newValue);

    /**
     * @notice event emitted when the minimum duration is changed
     * @param previousValue the old duration
     * @param newValue the new duration
     */
    event MinDurationChanged(uint256 previousValue, uint256 newValue);

    /**
     * @notice event emitted when the maximum duration is changed
     * @param previousValue the old duration
     * @param newValue the new duration
     */
    event MaxDurationChanged(uint256 previousValue, uint256 newValue);

    /**
     * @notice event emitted when the fee percentage is changed
     * @param previousValue the old fee percentage
     * @param newValue the new fee percentage
     */
    event FeePercentageChanged(uint256 previousValue, uint256 newValue);

    /**
     * @notice event emitted when the discount is changed
     * @param previousValue the old discount
     * @param newValue the new discount
     */
    event DiscountChanged(uint256 previousValue, uint256 newValue);

    /**
     * @notice event emitted when the minimum commitment age is changed
     * @param previousValue the old minimum commitment age
     * @param newValue the new duration minimum commitment age
     */
    event MinCommitmentAgeChanged(uint256 previousValue, uint256 newValue);

    /**
     * @notice returns the minimum characters count allowed for a domain name
     */
    function getMinLength() external view returns (uint256);

    /**
     * @notice returns the maximum characters count allowed for a domain name
     */
    function getMaxLength() external view returns (uint256);

    /**
     * @notice returns the minimum duration in years allowed for a domain name purchase
     */
    function getMinDuration() external view returns (uint256);

    /**
     * @notice returns the maximum duration in years allowed for a domain name purchase
     */
    function getMaxDuration() external view returns (uint256);

    /**
     * @notice returns the fee percentage assigned to the partner for each domain name registered
     */
    function getFeePercentage() external view returns (uint256);

    /**
     * @notice returns the discount assigned to the partner for each domain name registered as a percentage
     */
    function getDiscount() external view returns (uint256);

    /**
     * @notice returns the minimum commitment age allowed for a domain name registration. Represented in seconds.
     */
    function getMinCommitmentAge() external view returns (uint256);

    /**
     * @notice returns the price of a domain name
     * @param name the name of the domain
     * @param expires the expiration date of the domain. it is being ignored. left just for compatibility. just send 0.
     * @param duration the duration of the domain
     */
    function getPrice(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view returns (uint256);

    /**
     * @notice sets the minimum commitment age allowed for a domain name
     * @param minCommitmentAge the minimum commitment age allowed for a domain name in seconds
     * @custom:emits-event emits the MinCommitmentAgeChanged event on success
     */
    function setMinCommitmentAge(uint256 minCommitmentAge) external;

    /**
     * @notice sets the discount assigned to the partner for each domain name registered
     * @param discount the discount assigned to the partner for each domain name registered. represented as a percentage 18 decimals precision representation
     * @custom:emits-event emits the DiscountChanged event on success. N.B: percentage value
     * should be multiplied with the precision value of 10^18, i.e percentageValue * 10^18
     */
    function setDiscount(uint256 discount) external;

    /**
     * @notice sets the fee percentage assigned to the partner for each domain name registered
     * @param feePercentage the percentage assigned to the partner for each domain name registered
     * @custom:emits-event emits the FeePercentageChanged event on success. N.B: percentage value
     * should be multiplied with the precision value of 10^18, i.e percentageValue * 10^18
     */
    function setFeePercentage(uint256 feePercentage) external;

    /**
     * @notice sets the maximum duration allowed for a domain name
     * @param maxDuration the maximum duration allowed for a domain name in years
     * @custom:emits-event emits the MaxDurationChanged event on success
     */
    function setMaxDuration(uint256 maxDuration) external;

    /**
     * @notice sets the maximum length allowed for a domain name
     * @param maxLength the maximum characters count allowed for a domain name
     * @custom:emits-event emits the MaxLengthChanged event on success
     */
    function setMaxLength(uint256 maxLength) external;

    /**
     * @notice sets the minimum duration allowed for a domain name
     * @param minDuration the minimum duration allowed for a domain name in years
     * @custom:emits-event emits the MinDurationChanged event on success
     */
    function setMinDuration(uint256 minDuration) external;

    /**
     * @notice sets the minimum length allowed for a domain name
     * @param minLength the minimum characters count allowed for a domain name
     * @custom:emits-event emits the MinLengthChanged event on success
     */
    function setMinLength(uint256 minLength) external;

    /**
     * @notice checks if the name is valid and reverts with reason if not
     * @param name name under validation
     * @param duration duration for which the name should be registered
     */
    function validateName(string memory name, uint256 duration) external view;

    /**
     * @notice error emitted when the name is invalid
     * @param name the name that is invalid
     * @param reason the reason why the name is invalid
     */
    error InvalidName(string name, string reason);

    /**
     * @notice error emitted when the duration is invalid
     * @param duration the duration that is invalid
     * @param reason the reason why the duration is invalid
     */
    error InvalidDuration(uint256 duration, string reason);

    /**
     * @notice error emitted when the length is invalid
     * @param length the length that is invalid
     * @param reason the reason why the length is invalid
     */
    error InvalidLength(uint256 length, string reason);
}
