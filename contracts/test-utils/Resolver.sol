// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../RNS.sol";

interface Resolver {
    function addr(bytes32 node) external view returns (address payable);

    function addr(
        bytes32 node,
        uint256 coinType
    ) external view returns (bytes memory);

    function setAddr(bytes32 node, address addrValue) external;

    function initialize(address _rns) external;

    function setAuthorisation(
        bytes32 node,
        address target,
        bool isAuthorised
    ) external;
}
