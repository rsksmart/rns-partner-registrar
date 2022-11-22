// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface NodeOwner {
    function register(
        bytes32 label,
        address tokenOwner,
        uint256 duration
    ) external;

    function expirationTime(uint256 label) external view returns (uint256);

    function addRegistrar(address registrar) external;

    function removeRegistrar(address registrar) external;

    function isRegistrar(address registrar) external view returns (bool);

    function addRenewer(address renewer) external;

    function isRenewer(address renewer) external view returns (bool);

    function removeRenewer(address renewer) external;

    function renew(bytes32 label, uint256 time) external;

    function removeExpired(uint256[] calldata tokenIds) external;

    function reclaim(uint256 tokenId, address newOwner) external;

    function setRootResolver(address resolver) external;

    function available(uint256 tokenId) external view returns (bool);

    function ownerOf(uint256 tokenId) external view returns (address);

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}
