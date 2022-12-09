// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.7;

interface IPartnerConfiguration {
    function getMinLength() external view returns (uint256);

    function getMaxLength() external view returns (uint256);

    function getUnicodeSupport() external view returns (bool);

    function getMinDuration() external view returns (uint256);

    function getMaxDuration() external view returns (uint256);

    function getFeePercentage() external view returns (uint256);

    function getDiscount() external view returns (uint256);

    function getMinCommitmentAge() external view returns (uint256);

    function getPrice(
        string memory name,
        uint256 expires,
        uint256 duration
    ) external view returns (uint256);
}
