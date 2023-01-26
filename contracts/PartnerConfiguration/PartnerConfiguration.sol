// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IPartnerConfiguration.sol";
import "../StringUtils.sol";
import "../Access/IAccessControl.sol";
import "../Access/HasAccessControl.sol";

error InvalidName(string name, string reason);
error InvalidDuration(uint256 duration, string reason);
error InvalidLength(uint256 length, string reason);

/**
 * @title Defines the configuration for a partner in particular
 * @author Identity Team @IOVLabs
 */
contract PartnerConfiguration is IPartnerConfiguration, HasAccessControl {
    bool private _isUnicodeSupported;
    uint256 private _minLength;
    uint256 private _maxLength;
    uint256 private _minDuration;
    uint256 private _maxDuration;
    uint256 private _feePercentage;
    uint256 private _discount;
    uint256 private _minCommitmentAge;

    uint256 internal constant _PERCENT100_WITH_PRECISION18 = 100 * (10 ** 18);
    uint256 internal constant _PRECISION18 = 10 ** 18;
    string internal constant _UN_NECESSARY_MODIFICATION_ERROR_MSG =
        "old value is same as new value";
    string internal constant _VALUE_OUT_OF_BOUND_ERROR_MSG =
        "Value must be within range 0 to 100000000000000000000";

    using StringUtils for string;

    constructor(
        IAccessControl accessControl,
        uint256 minLength,
        uint256 maxLength,
        bool isUnicodeSupported,
        uint256 minDuration,
        uint256 maxDuration,
        uint256 feePercentage,
        uint256 discount,
        uint256 minCommitmentAge
    ) HasAccessControl(accessControl) {
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
    function setMinLength(
        uint256 minLength
    ) external override onlyHighLevelOperator {
        uint256 preModifiedValue = _minLength;

        emit MinLengthChanged(preModifiedValue, minLength);

        if (preModifiedValue == minLength) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
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
    function setMaxLength(
        uint256 maxLength
    ) external override onlyHighLevelOperator {
        uint256 preModifiedValue = _maxLength;

        emit MaxLengthChanged(preModifiedValue, maxLength);

        if (preModifiedValue == maxLength) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
        }

        if (maxLength < _minLength) {
            revert InvalidLength(
                maxLength,
                "Max length cannot be less than the min length"
            );
        }

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
    function setUnicodeSupport(
        bool flag
    ) external override onlyHighLevelOperator {
        bool preModifiedValue = _isUnicodeSupported;

        emit UnicodeSupportChanged(preModifiedValue, flag);

        if (preModifiedValue == flag) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
        }

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
    function setMinDuration(
        uint256 minDuration
    ) external override onlyHighLevelOperator {
        uint256 preModifiedValue = _minDuration;

        emit MinDurationChanged(preModifiedValue, minDuration);

        if (preModifiedValue == minDuration) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
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
    function setMaxDuration(
        uint256 maxDuration
    ) external override onlyHighLevelOperator {
        uint256 preModifiedValue = _maxDuration;

        emit MaxDurationChanged(preModifiedValue, maxDuration);

        if (preModifiedValue == maxDuration) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
        }

        if (maxDuration < _minDuration) {
            revert InvalidDuration(
                maxDuration,
                "Max duration cannot be less than the min duration"
            );
        }

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
    function setFeePercentage(
        uint256 feePercentage
    ) external override onlyHighLevelOperator {
        uint256 preModifiedValue = _feePercentage;

        emit FeePercentageChanged(preModifiedValue, feePercentage);

        if (preModifiedValue == feePercentage) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
        }

        if (feePercentage > _PERCENT100_WITH_PRECISION18) {
            revert(_VALUE_OUT_OF_BOUND_ERROR_MSG);
        }

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
    function setDiscount(
        uint256 discount
    ) external override onlyHighLevelOperator {
        uint256 preModifiedValue = _discount;

        emit DiscountChanged(preModifiedValue, discount);

        if (preModifiedValue == discount) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
        }

        if (discount > _PERCENT100_WITH_PRECISION18) {
            revert(_VALUE_OUT_OF_BOUND_ERROR_MSG);
        }

        _discount = discount;
    }

    function getMinCommitmentAge() external view override returns (uint256) {
        return _minCommitmentAge;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function setMinCommitmentAge(
        uint256 minCommitmentAge
    ) external override onlyHighLevelOperator {
        uint256 preModifiedValue = _minCommitmentAge;

        emit MinCommitmentAgeChanged(preModifiedValue, minCommitmentAge);

        if (preModifiedValue == minCommitmentAge) {
            revert(_UN_NECESSARY_MODIFICATION_ERROR_MSG);
        }

        _minCommitmentAge = minCommitmentAge;
    }

    /**
       @inheritdoc IPartnerConfiguration
     */
    function getPrice(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view override returns (uint256) {
        uint256 actualPrice;

        // 100% discount applied
        if (_discount == _PERCENT100_WITH_PRECISION18) return 0;

        // for duration equal to 1 or 2
        if (duration <= 2) {
            actualPrice = (2 * duration) * _PRECISION18;
            return _applyDiscount(actualPrice);
        }

        // for duration greater than 2
        actualPrice = (duration + 2) * (_PRECISION18);

        return _applyDiscount(actualPrice);
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

        if (duration > _maxDuration)
            revert InvalidDuration(
                duration,
                "Duration is more than max duration"
            );

        if (name.strlen() < _minLength)
            revert InvalidName(name, "Name is less than minimum length");

        if (name.strlen() > _maxLength)
            revert InvalidName(name, "Name is more than max length");
    }

    function _applyDiscount(uint256 price) private view returns (uint256) {
        // 100% discount applied
        if (_discount == _PERCENT100_WITH_PRECISION18) return 0;

        // No discount to be applied
        if (_discount == 0) return price;

        uint256 discountedPrice = (price * _discount) /
            _PERCENT100_WITH_PRECISION18;
        uint256 finalPrice = price - discountedPrice;

        return finalPrice;
    }
}
