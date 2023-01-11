// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IPartnerConfiguration.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../StringUtils.sol";

error InvalidName(string name, string reason);
error InvalidDuration(uint256 duration, string reason);
error InvalidLength(uint256 length, string reason);

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

    using StringUtils for string;

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
        if (minLength == 0) {
            revert InvalidLength(minLength, "Minimum length cannot be 0");
        }

        if (maxLength < minLength) {
            revert InvalidLength(
                maxLength,
                "Max length cannot be less than the min length"
            );
        }

        if (minDuration == 0) {
            revert InvalidDuration(minDuration, "Minimum duration cannot be 0");
        }

        if (maxDuration < minDuration) {
            revert InvalidDuration(
                maxDuration,
                "Max duration cannot be less than the min duration"
            );
        }

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
        uint256 preModifiedValue = _minLength;

        if (preModifiedValue == minLength) {
            revert("Param being modified is same as new param");
        }

        if (minLength == 0) {
            revert InvalidLength(minLength, "Minimum length cannot be 0");
        }

        if (_maxLength != 0 && minLength > _maxLength) {
            revert InvalidLength(
                minLength,
                "Minimum length cannot be more than the max length"
            );
        }

        _minLength = minLength;

        emit MinLengthChanged(preModifiedValue, _minLength);
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
        uint256 preModifiedValue = _maxLength;

        if (preModifiedValue == maxLength) {
            revert("Param being modified is same as new param");
        }

        if (maxLength < _minLength) {
            revert InvalidLength(
                maxLength,
                "Max length cannot be less than the min length"
            );
        }

        _maxLength = maxLength;

        emit MaxLengthChanged(preModifiedValue, _maxLength);
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
        bool preModifiedValue = _isUnicodeSupported;

        if (preModifiedValue == flag) {
            revert("Param being modified is same as new param");
        }

        _isUnicodeSupported = flag;

        emit UnicodeSupportChanged(preModifiedValue, _isUnicodeSupported);
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
        uint256 preModifiedValue = _minDuration;

        if (preModifiedValue == minDuration) {
            revert("Param being modified is same as new param");
        }

        if (minDuration == 0) {
            revert InvalidDuration(minDuration, "Minimum duration cannot be 0");
        }

        if (_maxDuration != 0 && minDuration > _maxDuration) {
            revert InvalidDuration(
                minDuration,
                "Minimum duration cannot be more than the maximum duration"
            );
        }

        _minDuration = minDuration;

        emit MinDurationChanged(preModifiedValue, _minDuration);
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
        uint256 preModifiedValue = _maxDuration;

        if (preModifiedValue == maxDuration) {
            revert("Param being modified is same as new param");
        }

        if (maxDuration < _minDuration) {
            revert InvalidDuration(
                maxDuration,
                "Max duration cannot be less than the min duration"
            );
        }

        _maxDuration = maxDuration;

        emit MaxDurationChanged(preModifiedValue, _maxDuration);
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
    function setFeePercentage(
        uint256 feePercentage
    ) external override onlyOwner {
        uint256 preModifiedValue = _feePercentage;

        if (preModifiedValue == feePercentage) {
            revert("Param being modified is same as new param");
        }

        _feePercentage = feePercentage;

        emit FeePercentageChanged(preModifiedValue, _feePercentage);
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
        uint256 preModifiedValue = _discount;

        if (preModifiedValue == discount) {
            revert("Param being modified is same as new param");
        }

        _discount = discount;

        emit DiscountChanged(preModifiedValue, _discount);
    }

    function getMinCommitmentAge() external view override returns (uint256) {
        return _minCommitmentAge;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setMinCommitmentAge(
        uint256 minCommitmentAge
    ) external override onlyOwner {
        uint256 preModifiedValue = _minCommitmentAge;

        if (preModifiedValue == minCommitmentAge) {
            revert("Param being modified is same as new param");
        }

        _minCommitmentAge = minCommitmentAge;

        emit MinCommitmentAgeChanged(preModifiedValue, _minCommitmentAge);
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getPrice(
        string calldata /* name */,
        uint256 /* expires */,
        uint256 duration
    ) external view override returns (uint256) {
        if (duration == 1) return 2 * (10 ** 18);
        if (duration == 2) return 4 * (10 ** 18);

        return (duration + 2) * (10 ** 18);
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function validateName(
        string calldata name,
        uint256 duration
    ) external view {
        if (duration < _minDuration)
            revert InvalidDuration(
                duration,
                "Duration less than minimum duration"
            );

        if ((_maxDuration != 0) && (duration > _maxDuration))
            revert InvalidDuration(
                duration,
                "Duration is more than max duration"
            );

        if (name.strlen() < _minLength)
            revert InvalidName(name, "Name is less than minimum length");

        if (_maxLength != 0 && name.strlen() > _maxLength)
            revert InvalidName(name, "Name is more than max length");
    }
}
