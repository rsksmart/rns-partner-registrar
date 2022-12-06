// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./IPartnerConfiguration.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

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

    function getMinLength() external view returns (uint256) {
        return _minLength;
    }

    function setMinLength(uint256 minLength) external onlyOwner {
        _minLength = minLength;
    }

    function getMaxLength() external view returns (uint256) {
        return _maxLength;
    }

    function setMaxLength(uint256 maxLength) external onlyOwner {
        _maxLength = maxLength;
    }

    function getUnicodeSupport() external view returns (bool) {
        return _isUnicodeSupported;
    }

    function setUnicodeSupport(bool flag) external onlyOwner {
        _isUnicodeSupported = flag;
    }

    function getMinDuration() external view returns (uint256) {
        return _minDuration;
    }

    function setMinDuration(uint256 minDuration) external onlyOwner {
        _minDuration = minDuration;
    }

    function getMaxDuration() external view returns (uint256) {
        return _maxDuration;
    }

    function setMaxDuration(uint256 maxDuration) external onlyOwner {
        _maxDuration = maxDuration;
    }

    function getFeePercentage() external view returns (uint256) {
        return _feePercentage;
    }

    function setFeePercentage(uint256 feePercentage) external onlyOwner {
        _feePercentage = feePercentage;
    }

    function getDiscount() external view returns (uint256) {
        return _discount;
    }

    function setDiscount(uint256 discount) external onlyOwner {
        _discount = discount;
    }

    function getMinCommitmentAge() external view returns (uint256) {
        return _minCommitmentAge;
    }

    function setMinCommitmentAge(uint256 minCommitmentAge) external onlyOwner {
        _minCommitmentAge = minCommitmentAge;
    }

    function getPrice(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view returns (uint256) {
        require(
            (duration >= 1) && (duration >= _minDuration),
            "PartnerConfiguration: Less than min duration"
        );

        if ((_maxDuration != 0) && (duration > _maxDuration))
            revert("PartnerConfiguration: More than max duration");

        if (duration == 1) return 2 * (10 ** 18);
        if (duration == 2) return 4 * (10 ** 18);

        return (duration + 2) * (10 ** 18);
    }
}
