// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./IRegistrarAccessControl.sol";

interface IRegistrarModule {

    function getAccessControl() external view returns (IRegistrarAccessControl);

    function setAccessControl(IRegistrarAccessControl registrarAccessControl) external;
}
