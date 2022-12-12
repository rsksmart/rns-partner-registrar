// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../../Registrar/IBaseRegistrar.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";
import "../../BytesUtils.sol";

contract PartnerRegistrarProxy is IBaseRegistrar, Ownable {
    IBaseRegistrar private _partnerRegistrar;
    IERC677 private _rif;
    // sha3('register(string,address,bytes32,uint)')
    bytes4 constant _REGISTER_SIGNATURE = 0x5f7b99d5;

    using BytesUtils for bytes;

    constructor(
        address _partner,
        IBaseRegistrar partnerRegistrar,
        IERC677 rif
    ) Ownable() {
        _transferOwnership(_partner);
        _partnerRegistrar = partnerRegistrar;
        _rif = rif;
    }

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr
    ) external override {
        _partnerRegistrar.register(name, nameOwner, secret, duration, addr);
    }

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view override returns (uint256) {
        return _partnerRegistrar.price(name, expires, duration);
    }

    function canReveal(bytes32 commitment) public view override returns (bool) {
        return _partnerRegistrar.canReveal(commitment);
    }

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) public pure override returns (bytes32) {
        return keccak256(abi.encodePacked(label, nameOwner, secret));
    }

    function commit(bytes32 commitment) external override {
        _partnerRegistrar.commit(commitment);
    }

    // - Via ERC-677
    /* Encoding:
        | signature  |  4 bytes      - offset  0
        | owner      | 20 bytes      - offset  4
        | secret     | 32 bytes      - offest 24
        | duration   | 32 bytes      - offset 56
        | name       | variable size - offset 88
    */

    /// @notice ERC-677 token fallback function.
    /// @dev Follow 'Register encoding' to execute a one-transaction regitration.
    /// @param from token sender.
    /// @param value amount of tokens sent.
    /// @param data data associated with transaction.
    /// @return true if successfull.
    function tokenFallback(
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bool) {
        require(msg.sender == address(_rif), "Only RIF token");
        require(data.length > 88, "Invalid data");

        bytes4 signature = data.toBytes4(0);
        require(signature == _REGISTER_SIGNATURE, "Invalid signature");

        address nameOwner = data.toAddress(4);
        bytes32 secret = data.toBytes32(24);
        uint256 duration = data.toUint(56);
        address addr = data.toAddress(88);
        string memory name = data.toString(108, data.length - 108);

        _registerWithToken(
            from,
            value,
            name,
            secret,
            duration,
            nameOwner,
            addr
        );

        return true;
    }

    function _registerWithToken(
        address from,
        uint256 amount,
        string memory name,
        bytes32 secret,
        uint256 duration,
        address nameOwner,
        address addr
    ) private {
        uint256 namePrice = _partnerRegistrar.price(name, 0, duration);
        _rif.approve(address(_partnerRegistrar), namePrice);
        _partnerRegistrar.register(name, nameOwner, secret, duration, addr);
        if (amount - namePrice > 0)
            require(
                _rif.transfer(from, amount - namePrice),
                "Token transfer failed"
            );
    }
}
