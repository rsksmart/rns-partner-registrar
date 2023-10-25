// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../RIF.sol";
import "./IFeeManager.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../Registrar/IBaseRegistrar.sol";
import "../Renewer/IBaseRenewer.sol";
import "../Access/HasAccessControl.sol";

/**
    @author Identity Team @IOVLabs
    @title  Keeps track of the balances of the collected revenue made by the partners.
*/
contract FeeManager is IFeeManager, HasAccessControl {
    RIF private _rif;

    mapping(address => uint256) private _balances;
    uint256 internal constant _PERCENT100_WITH_PRECISION18 = 100 * (10 ** 18);

    IBaseRegistrar private _registrar;
    IBaseRenewer private _renewer;
    IPartnerManager private _partnerManager;
    address private _pool;

    modifier onlyDepositor() {
        if (
            !(msg.sender == address(_registrar) ||
                msg.sender == address(_renewer))
        ) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    constructor(
        RIF rif,
        IBaseRegistrar registrar,
        IBaseRenewer renewer,
        IPartnerManager partnerManager,
        address pool,
        IAccessControl accessControl
    ) HasAccessControl(accessControl) {
        _rif = rif;
        _registrar = registrar;
        _renewer = renewer;
        _partnerManager = partnerManager;
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
        uint256 amount
    ) external override onlyDepositor {
        emit DepositSuccessful(amount, partner);

        if (!_rif.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed(msg.sender, address(this), amount);
        }

        uint256 partnerFee = (amount *
            _getPartnerConfiguration(partner).getFeePercentage()) /
            _PERCENT100_WITH_PRECISION18;
        _balances[partner] += partnerFee;

        uint256 balance = amount - partnerFee;

        if (!_rif.transfer(_pool, balance)) {
            revert TransferFailed(address(this), _pool, balance);
        }
    }

    function _getPartnerConfiguration(
        address partner
    ) private view returns (IPartnerConfiguration) {
        return _partnerManager.getPartnerConfiguration(partner);
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

    function getRegistrar() public view returns (address) {
        return address(_registrar);
    }

    function setRegistrar(
        address newRegistrarAddress
    ) public onlyHighLevelOperator {
        if (newRegistrarAddress == address(_registrar)) {
            revert("old value is same as new value");
        }

        emit RegistrarChanged(msg.sender, newRegistrarAddress);

        _registrar = IBaseRegistrar(newRegistrarAddress);
    }

    function getRenewer() public view returns (address) {
        return address(_renewer);
    }

    function setRenewer(
        address newRenewerAddress
    ) public onlyHighLevelOperator {
        if (newRenewerAddress == address(_renewer)) {
            revert("old value is same as new value");
        }

        emit RenewerChanged(msg.sender, newRenewerAddress);

        _renewer = IBaseRenewer(newRenewerAddress);
    }

    function getPartnerManager() public view returns (address) {
        return address(_partnerManager);
    }

    function setPartnerManager(
        address newPartnerManager
    ) public onlyHighLevelOperator {
        if (newPartnerManager == address(_partnerManager)) {
            revert("old value is same as new value");
        }

        emit PartnerManagerChanged(msg.sender, newPartnerManager);

        _partnerManager = IPartnerManager(newPartnerManager);
    }
}
