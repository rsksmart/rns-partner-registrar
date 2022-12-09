// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.7;

import "../PartnerConfiguration/IPartnerConfiguration.sol";

interface IPartnerManager {
    function setPartnerConfiguration(
        address partner,
        IPartnerConfiguration configuration
    ) external;

    function getPartnerConfiguration(
        address partner
    ) external view returns (IPartnerConfiguration);

    function isPartner(address partner) external view returns (bool);

    function addPartner(address partner, address partnerOwnerAccount) external;

    function removePartner(address partner) external;

    function getPartnerOwnerAccount(
        address partner
    ) external view returns (address);
}
