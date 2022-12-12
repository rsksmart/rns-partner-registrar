// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../../Registrar/IBaseRegistrar.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";
import "../../BytesUtils.sol";
import "../../Renewer/IBaseRenewer.sol";

/**
 * @title PartnerRenewerProxy
 * @author Identity Team @IOVLabs
 * @dev Sample implementations of Renewer PartnerProxy contracts that are compatible with the PartnerRenewer contract
 */
contract PartnerRenewerProxy is IBaseRenewer, Ownable {
    IBaseRegistrar private _partnerRegistrar;
    IBaseRenewer private _partnerRenewer;
    IERC677 private _rif;
    // sha3('renew(string,uint)')
    bytes4 private constant _RENEW_SIGNATURE = 0x14b1a4fc;

    using BytesUtils for bytes;

    constructor(
        address _partner,
        IBaseRegistrar partnerRegistrar,
        IBaseRenewer partnerRenewer,
        IERC677 rif
    ) Ownable() {
        _transferOwnership(_partner);
        _partnerRegistrar = partnerRegistrar;
        _partnerRenewer = partnerRenewer;
        _rif = rif;
    }

    function renew(string calldata name, uint256 duration) external override {
        _partnerRenewer.renew(name, duration);
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
        require(data.length > 36, "Invalid data");

        bytes4 signature = data.toBytes4(0);
        require(signature == _RENEW_SIGNATURE, "Invalid signature");

        uint256 duration = data.toUint(4);
        string memory name = data.toString(36, data.length - 36);

        _renewWithToken(name, duration, from, value);

        return true;
    }

    function _renewWithToken(
        string memory name,
        uint256 duration,
        address from,
        uint256 amount
    ) private {
        uint256 namePrice = _partnerRegistrar.price(name, 0, duration);
        require(amount >= namePrice, "Insufficient tokens transferred");
        require(
            _rif.approve(address(_partnerRenewer), namePrice),
            "Approval failed"
        );
        _partnerRenewer.renew(name, duration);
        if (amount - namePrice > 0)
            require(
                _rif.transfer(from, amount - namePrice),
                "Token transfer failed"
            );
    }
}
