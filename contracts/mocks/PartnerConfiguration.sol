// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import '../IPartnerConfiguration.sol';
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PartnerConfiguration is IPartnerConfiguration, Ownable {
    uint256 private minLength;
    uint256 private maxLength;
    bool private isUnicodeSupoorted;
    uint256 private minDuration;
    uint256 private maxDuration;
    uint256 private feePercentage;
    uint256 private discount;
    uint256 private minCommittmentAge;
    uint private price;

    constructor(
    //    uint256 _minLength, 
    //    uint256 _maxLength, 
    //    bool _isUnicodeSupoorted, 
    //    uint256 _minDuration, 
    //    uint256 _maxDuration, 
    //    uint256 _feePercentage, 
    //    uint256 _discount, 
    //    uint _minCommittmentAge, 
    //    uint256 _price
    ) {
            // minLength = _minLength;
            // maxLength = _maxLength;

    }

    function getMinLength() external view returns (uint256) {
        return minLength;
    }
    function getMaxLength() external view returns (uint256) {
        return maxLength;
    }
    function getUnicodeSupport() external view returns (bool) {
        return isUnicodeSupoorted;
    }

    function getMinDuration() external view returns (uint256) {
        return minDuration;
    }

    function getMaxDuration() external view returns (uint256) {
        return maxDuration;
    }

    function getFeePercentage() external view returns (uint256) {
        return feePercentage;
    }

    function getDiscount() external view returns (uint256) {
        return discount;
    }

    function getMinCommittmentAge() external view returns (uint) {
        return minCommittmentAge;
    }

    function getPrice(string memory name, uint expires, uint256 duration) external view returns (uint) {

        return price;
    }
}