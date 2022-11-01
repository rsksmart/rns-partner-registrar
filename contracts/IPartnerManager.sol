// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./PartnerConfiguration.sol";

interface IPartnerManager {
    function setPartnerConfiguration(address partner, PartnerConfiguration memory configuration) external;

    function getPartnerConfiguration(address partner) external returns (PartnerConfiguration memory);

    function isPartner(address partner) external view returns (bool);

    function addPartner(address partner) external;

    function removePartner(address partner) external;
}

