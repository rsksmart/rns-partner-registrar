// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface RNS {
    function owner(bytes32 node) external view returns (address);

    function resolver(bytes32 node) external view returns (address);

    function ttl(bytes32 node) external view returns (uint64);

    function setOwner(bytes32 node, address ownerAddress) external;

    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address ownerAddress
    ) external;

    function setResolver(bytes32 node, address resolverAddress) external;

    function setTTL(bytes32 node, uint64 ttlValue) external;
}
