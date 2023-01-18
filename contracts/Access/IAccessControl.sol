// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

/**
 * @title IAccessControl
 * @notice Defines Access Control roles management
 * @dev Implement this interface if you need to manage access control roles
 */
interface IAccessControl {
    error OnlyOwner(address sender);

    /**
     * @notice Returns `true` if address has been granted the OWNER role.
     * @param owner address to evaluate if has OWNER role
     * @return bool - true if the owner address has OWNER role
     */
    function isOwnerRole(address owner) external view returns (bool);

    /**
     * @notice Returns `true` if address has been granted the HIGH_LEVEL_OPERATOR role.
     * @param highLevelOperator address to evaluate if has HIGH_LEVEL_OPERATOR role
     * @return bool - true if the address has HIGH_LEVEL_OPERATOR role
     */
    function isHighLevelOperator(
        address highLevelOperator
    ) external view returns (bool);

    /**
     * @notice Grants address all HIGH_LEVEL_OPERATOR roles.
     * Only executable by the owner.
     * @dev only user granted as OWNER can perform this operation
     * @param highLevelOperator address to grant HIGH_LEVEL_OPERATOR role
     */
    function addHighLevelOperator(address highLevelOperator) external;

    /**
     * @notice Revokes address all HIGH_LEVEL_OPERATOR roles.
     * Only executable by the owner.
     * @dev only user granted as OWNER can perform this operation
     * @param highLevelOperator address to revoke HIGH_LEVEL_OPERATOR role
     */
    function removeHighLevelOperator(address highLevelOperator) external;

    /**
     * @notice Transfers all OWNER and HIGH_LEVEL_OPERATOR roles to the given address.
     * @param newOwner address to be grant OWNER and all MANAGER roles.
     */
    function transferOwnership(address newOwner) external;
}
