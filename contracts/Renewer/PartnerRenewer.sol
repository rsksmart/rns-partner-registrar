// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "@rsksmart/erc677/contracts/IERC677.sol";
import "@rsksmart/erc677/contracts/IERC677TransferReceiver.sol";
import "../NodeOwner.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../FeeManager/IFeeManager.sol";
import "./IBaseRenewer.sol";
import "../BytesUtils.sol";
import "../Access/IAccessControl.sol";
import "../Access/HasAccessControl.sol";

/**
    @author Identity Team @IOVLabs
    @title Implements the interface IBaseRenewer to renew names in RNS.
*/
contract PartnerRenewer is
    IBaseRenewer,
    IERC677TransferReceiver,
    HasAccessControl
{
    NodeOwner private _nodeOwner;
    IERC677 private _rif;
    IPartnerManager private _partnerManager;
    IFeeManager private _feeManager;

    // sha3('renew(string,uint,address)')
    bytes4 private constant _RENEW_SIGNATURE = 0x8d7016ca;

    using BytesUtils for bytes;

    constructor(
        IAccessControl accessControl,
        NodeOwner nodeOwner,
        IERC677 rif,
        IPartnerManager partnerManager
    ) HasAccessControl(accessControl) {
        _nodeOwner = nodeOwner;
        _rif = rif;
        _partnerManager = partnerManager;
    }

    modifier onlyPartner(address partner) {
        require(
            _partnerManager.isPartner(partner),
            "Partner Registrar: Not a partner"
        );
        _;
    }

    /**
       @inheritdoc IBaseRenewer
     */
    function setFeeManager(
        IFeeManager feeManager
    ) external onlyHighLevelOperator {
        if (address(_feeManager) == address(feeManager)) {
            revert("old value is same as new value");
        }
        emit FeeManagerChanged(address(this), address(feeManager));

        _feeManager = feeManager;
    }

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
        require(data.length > 56, "Invalid data");

        bytes4 signature = data.toBytes4(0);
        require(signature == _RENEW_SIGNATURE, "Invalid signature");

        uint256 duration = data.toUint(4);
        address partner = data.toAddress(36);
        string memory name = data.toString(56, data.length - 56);

        _renewWithToken(name, duration, from, value, partner);

        return true;
    }

    function _renewWithToken(
        string memory name,
        uint256 duration,
        address from,
        uint256 amount,
        address partner
    ) private {
        emit NameRenewed(from, duration);

        uint256 cost = _executeRenovation(name, duration, partner);

        // This aims to skip token transfer transactions if the cost is zero as it doesn't make
        // any sense to have transactions involving zero tokens. Hence calculations are
        // only done for non zero cost domain registrations.
        if (cost > 0) {
            require(amount >= cost, "Insufficient tokens transferred");

            _collectFees(partner, cost);

            uint256 difference = amount - cost;
            if (difference > 0)
                require(
                    _rif.transfer(from, difference),
                    "Token transfer failed"
                );
        }
    }

    function _collectFees(address partner, uint256 amount) private {
        require(_feeManager != IFeeManager(address(0)), "Fee Manager not set");

        require(
            _rif.approve(address(_feeManager), amount),
            "Token approval failed"
        );

        _feeManager.deposit(partner, amount);
    }

    /**
       @inheritdoc IBaseRenewer
     */
    function price(
        string calldata name,
        uint256 expires,
        uint256 duration,
        address partner
    ) external view returns (uint256) {
        return
            _getPartnerConfiguration(partner).getPrice(name, expires, duration);
    }

    /**
       @inheritdoc IBaseRenewer
     */
    function renew(
        string calldata name,
        uint256 duration,
        address partner
    ) public override onlyPartner(partner) {
        emit NameRenewed(msg.sender, duration);

        uint256 cost = _executeRenovation(name, duration, partner);

        // This aims to skip token transfer transactions if the cost is zero as it doesn't make
        // any sense to have transactions involving zero tokens. Hence calculations are
        // only done for non zero cost domain registrations.
        if (cost > 0) {
            require(
                _rif.transferFrom(msg.sender, address(this), cost),
                "Token transfer failed"
            );

            _collectFees(partner, cost);
        }
    }

    /// @notice Executes renovation abstracted from payment method.
    /// @param name The name to renew.
    /// @param duration Time to renew in years.
    /// @return price Price of the name to register.
    function _executeRenovation(
        string memory name,
        uint256 duration,
        address partner
    ) private returns (uint256) {
        bytes32 label = keccak256(abi.encodePacked(name));

        _nodeOwner.renew(label, duration * 365 days);

        return
            _getPartnerConfiguration(partner).getPrice(
                name,
                _nodeOwner.expirationTime(uint256(label)),
                duration
            );
    }

    function _getPartnerConfiguration(
        address partner
    ) private view returns (IPartnerConfiguration) {
        return _partnerManager.getPartnerConfiguration(partner);
    }
}
