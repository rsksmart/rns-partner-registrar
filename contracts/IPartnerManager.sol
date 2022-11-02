// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./IPartnerConfiguration.sol";

interface IPartnerManager {
    function setPartnerConfiguration(address partner, IPartnerConfiguration configuration) external;

    function getPartnerConfiguration(address partner) external returns (IPartnerConfiguration);

    function isPartner(address partner) external view returns (bool);

    function addPartner(address partner) external;

    function removePartner(address partner) external;
}

