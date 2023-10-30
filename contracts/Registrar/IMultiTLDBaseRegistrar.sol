// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../FeeManager/IFeeManager.sol";
import "../PartnerManager/IPartnerManager.sol";
import "./IBaseRegistrar.sol";

/**
    @author Identity Team @IOVLabs
    @title Defines the interface for a compatible Registrar
*/
abstract contract IMultiTLDBaseRegistrar is IBaseRegistrar {
    /**
        @notice registers a name
        @param name the name to register
        @param nameOwner the owner of the name
        @param secret used in the commitment step if required
        @param duration the duration of the registration in years
        @param addr to be resolved to the name as default
        @param partner Partner address
        @param tld top level domain to be registered
        @custom:emits-event emits the NameRegistered event
    */
    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr,
        address partner,
        bytes32 tld
    ) external virtual;

    /**
        @notice calculates the commitment of a name based on the provided parameters
        @param label the label of the name
        @param nameOwner the owner of the name
        @param secret used in the commitment step if required
        @param duration the duration of the registration in years
        @param addr to be resolved to the name as default
        @param tld top level domain to make a commitment
        @return the commitment of the name
    */
    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr,
        bytes32 tld
    ) external pure virtual returns (bytes32);
}
