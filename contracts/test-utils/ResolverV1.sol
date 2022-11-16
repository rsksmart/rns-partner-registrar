// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./RNS.sol";

interface ResolverV1 {
    function setAddr(bytes32 node, address a) external;

    function addr(bytes32 node) external view returns (address payable);

    function setAddr(
        bytes32 node,
        uint256 coinType,
        bytes memory a
    ) external;

    function initialize(RNS _rns) external;
}
