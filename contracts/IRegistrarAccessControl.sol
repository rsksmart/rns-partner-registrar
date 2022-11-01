// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface IRegistrarAccessControl {
    function isOwner(address owner) external;

    function isPartner(address partner) external;

    function addPartner(address partner) external;

    function removePartner(address partner) external;
}
