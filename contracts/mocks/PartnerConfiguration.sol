// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "../IPartnerConfiguration.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PartnerConfiguration is IPartnerConfiguration, Ownable {
    uint256 private _minLength;
    uint256 private _maxLength;
    bool private _isUnicodeSupoorted;
    uint256 private _minDuration;
    uint256 private _maxDuration;
    uint256 private _feePercentage;
    uint256 private _discount;
    uint256 private _minCommittmentAge;
    uint256 private _price;

    constructor() //    uint256 _minLength,
    //    uint256 _maxLength,
    //    bool _isUnicodeSupoorted,
    //    uint256 _minDuration,
    //    uint256 _maxDuration,
    //    uint256 _feePercentage,
    //    uint256 _discount,
    //    uint _minCommittmentAge,
    //    uint256 _price
    {
        // minLength = _minLength;
        // maxLength = _maxLength;
    }

    function getMinLength() external view returns (uint256) {
        return _minLength;
    }

    function getMaxLength() external view returns (uint256) {
        return _maxLength;
    }

    function getUnicodeSupport() external view returns (bool) {
        return _isUnicodeSupoorted;
    }

    function getMinDuration() external view returns (uint256) {
        return _minDuration;
    }

    function getMaxDuration() external view returns (uint256) {
        return _maxDuration;
    }

    function getFeePercentage() external view returns (uint256) {
        return _feePercentage;
    }

    function getDiscount() external view returns (uint256) {
        return _discount;
    }

    function getMinCommittmentAge() external view returns (uint256) {
        return _minCommittmentAge;
    }

    function getPrice(
        string memory name,
        uint256 expires,
        uint256 duration
    ) external view returns (uint256) {
        return _price;
    }
}
