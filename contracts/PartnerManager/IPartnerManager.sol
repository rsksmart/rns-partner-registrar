// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../PartnerConfiguration/IPartnerConfiguration.sol";

/**
    @author Identity Team @IOVLabs
    @title Keeps track of the whitelisted partners and its configurations.
*/
interface IPartnerManager {
    /**
     * @notice event emitted when the configuration for a partner is set
     * @param partner address for the partner
     * @param configurationContract address of the configuration contract
     */
    event PartnerConfigurationChanged(
        address partner,
        address configurationContract
    );
    /**
     * @notice event emitted when a partner is whitelisted and its configuration is set
     * @param partner address for the partner
     * @param configurationContract address of the configuration contract
     */
    event PartnerAdded(
        address indexed partner,
        address indexed configurationContract
    );
    /**
     * @notice event emitted when is removed from the whitelist
     * @param partner address for the partner
     */
    event PartnerRemoved(address indexed partner);

    /**
     * @notice sets the configuration for a partner
     * @param partner address for the partner
     * @param configuration address of the configuration contract
     * @custom:emits-event emits the PartnerConfigurationSet event
     */
    function setPartnerConfiguration(
        address partner,
        IPartnerConfiguration configuration
    ) external;

    /**
     * @notice returns the configuration for a partner
     * @param partner address for the partner
     */
    function getPartnerConfiguration(
        address partner
    ) external view returns (IPartnerConfiguration);

    /**
     * @notice returns true if the partner is whitelisted
     * @param partner address for the partner
     */
    function isPartner(address partner) external view returns (bool);

    /**
     * @notice adds a partner to the whitelist and sets its configuration
     * @param partner address for the partner that will be whitelisted
     * @param partnerConfiguration address of the contract in that implements the partner configuration
     */
    function addPartner(
        address partner,
        IPartnerConfiguration partnerConfiguration
    ) external;

    /**
     * @notice removes a partner from the whitelist
     * @param partner address for the partner that will be removed from the whitelist
     */
    function removePartner(address partner) external;
}
