// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../RIF.sol";
import "./IFeeManager.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../Registrar/IBaseRegistrar.sol";
import "../Renewer/IBaseRenewer.sol";
import "../Access/IAccessControl.sol";
import "../Access/HasAccessControl.sol";

/**
    @author Identity Team @IOVLabs
    @title  Keeps track of the balances of the collected revenue made by the partners.
*/
contract FeeManager is IFeeManager, HasAccessControl {
    RIF private _rif;

    mapping(IBaseRegistrar => bool) private _whitelistedRegistrars;
    mapping(IBaseRenewer => bool) private _whitelistedRenewers;
    mapping(IPartnerManager => bool) private _whitelistedPartnerManagers;
    mapping(address => uint256) private _balances;
    uint256 internal constant _PERCENT100_WITH_PRECISION18 = 100 * (10 ** 18);

    // IBaseRegistrar private _registrar;
    // IBaseRenewer private _renewer;
    // IPartnerManager private _partnerManager;
    address private _pool;

    modifier onlyDepositor() {
        if (
            !(_isEntityWhitelisted(msg.sender, "registrar") ||
                _isEntityWhitelisted(msg.sender, "renewar"))
        ) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    constructor(
        RIF rif,
        address pool,
        IAccessControl accessControl
    ) HasAccessControl(accessControl) {
        _rif = rif;
        _pool = pool;
    }

    /**
       @inheritdoc IFeeManager
     */
    function withdraw() external override {
        uint256 amount = _balances[msg.sender];

        emit WithdrawalSuccessful(amount, msg.sender);

        if (amount == 0) revert ZeroBalance();

        _balances[msg.sender] = 0;

        if (!_rif.transfer(msg.sender, amount)) {
            revert TransferFailed(address(this), msg.sender, amount);
        }
    }

    /**
       @inheritdoc IFeeManager
     */
    function deposit(
        address partner,
        uint256 amount,
        address partnerManager
    ) external override {
        emit DepositSuccessful(amount, partner);

        bool validateManager = _isEntityWhitelisted(
            partnerManager,
            "partner_manager"
        );
        if (!validateManager) {
            revert InvalidEntity(partnerManager, "partner_manager");
        }

        if (!_rif.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed(msg.sender, address(this), amount);
        }

        uint256 partnerFee = (amount *
            _getPartnerConfiguration(partner, partnerManager)
                .getFeePercentage()) / _PERCENT100_WITH_PRECISION18;
        _balances[partner] += partnerFee;

        uint256 balance = amount - partnerFee;

        if (!_rif.transfer(_pool, balance)) {
            revert TransferFailed(address(this), _pool, balance);
        }
    }

    function _getPartnerConfiguration(
        address partner,
        address partnerManager
    ) private view returns (IPartnerConfiguration) {
        bool validateManager = _isEntityWhitelisted(
            partnerManager,
            "partner_manager"
        );
        if (!validateManager) {
            revert InvalidEntity(partnerManager, "partner_manager");
        }

        return IPartnerManager(partnerManager).getPartnerConfiguration(partner);
    }

    /**
       @inheritdoc IFeeManager
     */
    function getBalance(
        address partner
    ) external view override returns (uint256) {
        return _balances[partner];
    }

    function getPool() public view returns (address) {
        return _pool;
    }

    function setPool(address newPoolAddress) public onlyHighLevelOperator {
        if (newPoolAddress == _pool) {
            revert("old value is same as new value");
        }

        emit PoolChanged(msg.sender, newPoolAddress);

        _pool = newPoolAddress;
    }
    
    /**
       @inheritdoc IFeeManager
     */
    function whiteListEntity(
        address entity,
        string memory registrarRenewarOrPartnerManager
    ) external override onlyHighLevelOperator {
        if (
            keccak256(abi.encodePacked(registrarRenewarOrPartnerManager)) ==
            keccak256(abi.encodePacked("registrar"))
        ) {
            _whitelistedRegistrars[IBaseRegistrar(entity)] = true;
        } else if (
            keccak256(abi.encodePacked(registrarRenewarOrPartnerManager)) ==
            keccak256(abi.encodePacked("renewer"))
        ) {
            _whitelistedRenewers[IBaseRenewer(entity)] = true;
        } else if (
            keccak256(abi.encodePacked(registrarRenewarOrPartnerManager)) ==
            keccak256(abi.encodePacked("partner_manager"))
        ) {
            _whitelistedPartnerManagers[IPartnerManager(entity)] = true;
        } else {
            revert InvalidEntity(entity, registrarRenewarOrPartnerManager);
        }
    }

    function _isEntityWhitelisted(
        address entity,
        string memory registrarRenewarOrPartnerManager
    ) private view returns (bool) {
        if (
            keccak256(abi.encodePacked(registrarRenewarOrPartnerManager)) ==
            keccak256(abi.encodePacked("registrar"))
        ) {
            return _whitelistedRegistrars[IBaseRegistrar(entity)];
        } else if (
            keccak256(abi.encodePacked(registrarRenewarOrPartnerManager)) ==
            keccak256(abi.encodePacked("renewer"))
        ) {
            return _whitelistedRenewers[IBaseRenewer(entity)];
        } else if (
            keccak256(abi.encodePacked(registrarRenewarOrPartnerManager)) ==
            keccak256(abi.encodePacked("partner_manager"))
        ) {
            return _whitelistedPartnerManagers[IPartnerManager(entity)];
        } else {
            return false;
        }
    }
}
