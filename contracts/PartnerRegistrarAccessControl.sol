// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

bytes32 constant OWNER = keccak256("OWNER");
bytes32 constant PARTNER = keccak256("PARTNER");

    error NotPartner(address user);
    error NotOwner(address user);

contract PartnerRegistrarAccessControl is AccessControl {
    constructor() {
        address _owner = msg.sender;

        _setRoleAdmin(OWNER, OWNER);
        _setRoleAdmin(PARTNER, OWNER);

        _setupRole(OWNER, _owner);
        _setupRole(OWNER, _owner);
    }

    modifier onlyOwner(address owner) {
        if(!hasRole(OWNER, owner)) revert NotOwner(owner);
        _;
    }

    modifier onlyPartner(address partner) {
        if(!hasRole(PARTNER, partner)) revert NotPartner(partner);
        _;
    }

    function addPartner(address partner) external onlyOwner(msg.sender) {
        grantRole(PARTNER, partner);
    }

    function removePartner(address partner) external onlyOwner(msg.sender) {
        revokeRole(PARTNER, partner);
    }
}
