// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IPartnerConfiguration.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PartnerConfiguration
 * @author Identity Team @IOVLabs
 */
contract PartnerConfiguration is IPartnerConfiguration, Ownable {
    uint256 private _minLength;
    uint256 private _maxLength;
    bool private _isUnicodeSupported;
    uint256 private _minDuration;
    uint256 private _maxDuration;
    uint256 private _feePercentage;
    uint256 private _discount;
    uint256 private _minCommitmentAge;

    constructor(
        uint256 minLength,
        uint256 maxLength,
        bool isUnicodeSupported,
        uint256 minDuration,
        uint256 maxDuration,
        uint256 feePercentage,
        uint256 discount,
        uint256 minCommitmentAge
    ) {
        // require(minDuration > 0, "PartnerConfiguration: Invalid min duration");

        _minLength = minLength;
        _maxLength = maxLength;
        _isUnicodeSupported = isUnicodeSupported;
        _minDuration = minDuration;
        _maxDuration = maxDuration;
        _feePercentage = feePercentage;
        _discount = discount;
        _minCommitmentAge = minCommitmentAge;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getMinLength() external view override returns (uint256) {
        return _minLength;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setMinLength(uint256 minLength) external override onlyOwner {
        _minLength = minLength;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getMaxLength() external view override returns (uint256) {
        return _maxLength;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setMaxLength(uint256 maxLength) external override onlyOwner {
        _maxLength = maxLength;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getUnicodeSupport() external view override returns (bool) {
        return _isUnicodeSupported;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setUnicodeSupport(bool flag) external override onlyOwner {
        _isUnicodeSupported = flag;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getMinDuration() external view override returns (uint256) {
        return _minDuration;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setMinDuration(uint256 minDuration) external override onlyOwner {
        _minDuration = minDuration;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getMaxDuration() external view override returns (uint256) {
        return _maxDuration;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setMaxDuration(uint256 maxDuration) external override onlyOwner {
        _maxDuration = maxDuration;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getFeePercentage() external view override returns (uint256) {
        return _feePercentage;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setFeePercentage(uint256 feePercentage)
        external
        override
        onlyOwner
    {
        _feePercentage = feePercentage;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getDiscount() external view override returns (uint256) {
        return _discount;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setDiscount(uint256 discount) external override onlyOwner {
        _discount = discount;
    }

    function getMinCommitmentAge() external view override returns (uint256) {
        return _minCommitmentAge;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setMinCommitmentAge(uint256 minCommitmentAge)
        external
        override
        onlyOwner
    {
        _minCommitmentAge = minCommitmentAge;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getPrice(
        string calldata /* name */,
        uint256 /* expires */,
        uint256 duration
    ) external view override returns (uint256) {
        require(
            (duration >= 1) && (duration >= _minDuration),
            "PartnerConfiguration: Less than min duration"
        );

        if ((_maxDuration != 0) && (duration > _maxDuration))
            revert("PartnerConfiguration: More than max duration");

        if (duration == 1) return 2 * (10**18);
        if (duration == 2) return 4 * (10**18);

        return (duration + 2) * (10**18);
    }
}
