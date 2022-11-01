// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./IRegistrarAccessControl.sol";
import "./IPartnerManager.sol";
import "./IRegistrarModule.sol";

contract RegistrarModule is Ownable, IRegistrarModule {
    IRegistrarAccessControl private _registrarAccessControl;

    function getAccessControl() public view returns (IRegistrarAccessControl) {
        return _registrarAccessControl;
    }

    function setAccessControl(IRegistrarAccessControl registrarAccessControl) public onlyOwner {
        _registrarAccessControl = registrarAccessControl;
    }
}
