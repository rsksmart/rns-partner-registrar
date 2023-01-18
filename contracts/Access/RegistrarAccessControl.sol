// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "./IAccessControl.sol";

contract RegistrarAccessControl is IAccessControl, AccessControl {
    bytes32 private constant _OWNER = keccak256("OWNER");
    bytes32 private constant _HIGH_LEVEL_OPERATOR =
        keccak256("HIGH_LEVEL_OPERATOR");

    /**
     * @notice Checks if the action is done by an owner address.
     * Reverts with reason: 'Not an owner'
     */
    modifier onlyOwner() {
        if (!hasRole(_OWNER, msg.sender)) revert OnlyOwner(msg.sender);
        _;
    }

    /**
     * @dev Sets OWNER the HIGH_LEVEL_OPERATOR and OWNER roles' admin.
     * Grants deployer address IAccessControl and OWNER roles.
     */
    constructor() {
        address _owner = msg.sender;
        // makes owner the role admin of admin roles
        _setRoleAdmin(_OWNER, _OWNER);
        _setRoleAdmin(_HIGH_LEVEL_OPERATOR, _OWNER);

        // makes the owner the first admin for each role
        _setupRole(_OWNER, _owner);
        _setupRole(_HIGH_LEVEL_OPERATOR, _owner);
    }

    /**
     * @inheritdoc IAccessControl
     */
    function isOwnerRole(
        address ownerAddr
    ) external view override returns (bool) {
        return hasRole(_OWNER, ownerAddr);
    }

    /**
     * @inheritdoc IAccessControl
     */
    function isHighLevelOperator(
        address highLevelOperatorAddr
    ) external view override returns (bool) {
        return hasRole(_HIGH_LEVEL_OPERATOR, highLevelOperatorAddr);
    }

    /**
     * @inheritdoc IAccessControl
     */
    function addHighLevelOperator(
        address highLevelOperatorAddr
    ) external override onlyOwner {
        grantRole(_HIGH_LEVEL_OPERATOR, highLevelOperatorAddr);
    }

    /**
     * @inheritdoc IAccessControl
     */
    function removeHighLevelOperator(
        address highLevelOperatorAddr
    ) external override onlyOwner {
        revokeRole(_HIGH_LEVEL_OPERATOR, highLevelOperatorAddr);
    }

    /**
     * @inheritdoc IAccessControl
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        // Grant roles to new owner top down
        grantRole(_OWNER, newOwner);
        grantRole(_HIGH_LEVEL_OPERATOR, newOwner);

        // Revoke roles for the old owner bottom up
        address sender = msg.sender;
        revokeRole(_HIGH_LEVEL_OPERATOR, sender);
        revokeRole(_OWNER, sender);
    }
}
