// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IAccessControl.sol";

error OnlyHighLevelOperator(address sender);

abstract contract HasAccessControl {
    IAccessControl private _accessControl;

    modifier onlyHighLevelOperator() {
        if (!_accessControl.isHighLevelOperator(msg.sender)) {
            revert OnlyHighLevelOperator(msg.sender);
        }
        _;
    }

    constructor(IAccessControl accessControl) {
        _accessControl = accessControl;
    }
}
