// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

struct PriceConfiguration {
    uint256 discount;
    uint256 basePrice;
}

struct PartnerConfiguration {
    uint256 minLength;
    uint256 maxLength;
    bool unicodeSupport;
    uint256 minDuration;
    uint256 maxDuration;
    uint256 feePercentage;
//    mapping(bytes32 => uint256) commitmentRevealTime;
    PriceConfiguration priceConfiguration;
}
