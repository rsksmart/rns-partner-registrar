// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../FeeManager/IFeeManager.sol";

/**
    @author Identity Team @IOVLabs
    @title IBaseRegistrar
    @dev Defines the interface for a compatible Registrar
*/
interface IBaseRegistrar {
    event NameRegistered(address indexed partner, uint256 duration);

    /**
        @notice sets the fee manager to use
        @param feeManager the fee manager to use
    */
    function setFeeManager(IFeeManager feeManager) external;

    /**
        @notice registers a name
        @param name the name to register
        @param nameOwner the owner of the name
        @param secret used in the commitment step if required
        @param duration the duration of the registration in years
        @param addr to be resolved to the name as default
        @param partner Partner address
    */
    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr,
        address partner
    ) external;

    /**
        @notice calculates the price of a name
        @param name the name to register
        @param expires the expiration date of the name
        @param duration the duration of the registration in years
        @return the price of the name
        @param partner Partner address
    */
    function price(
        string calldata name,
        uint256 expires,
        uint256 duration,
        address partner
    ) external view returns (uint256);

    /**
        @notice calculates the commitment of a name based on the provided parameters
        @param label the label of the name
        @param nameOwner the owner of the name
        @param secret used in the commitment step if required
        @param duration the duration of the registration in years
        @param addr to be resolved to the name as default
        @return the commitment of the name
    */
    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr
    ) external pure returns (bytes32);

    /**
        @notice commits a name if required. This is used to reserve a name
        for a specific user and prevent a frontrunning attack
        @param commitment the commitment of the name
        @param partner Partner address
    */
    function commit(bytes32 commitment, address partner) external;

    /**
        @notice reveals if the name is ready to be registered by calling register function.
        @param commitment the commitment of the name
        @return true if the name is ready to be registered
    */
    function canReveal(bytes32 commitment) external view returns (bool);
}
