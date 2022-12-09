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

    function setMinCommitmentAge(uint256 minCommitmentAge) external;

    function setDiscount(uint256 discount) external;

    function setFeePercentage(uint256 feePercentage) external;

    function setMaxDuration(uint256 maxDuration) external;

    function setUnicodeSupport(bool flag) external;

    function setMaxLength(uint256 maxLength) external;

    function setMinDuration(uint256 minDuration) external;

    function setMinLength(uint256 minLength) external;
}
