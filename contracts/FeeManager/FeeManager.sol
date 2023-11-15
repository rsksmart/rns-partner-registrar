// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../RIF.sol";
import "./IFeeManager.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../Access/IAccessControl.sol";
import "../Access/HasAccessControl.sol";

/**
    @author Identity Team @IOVLabs
    @title  Keeps track of the balances of the collected revenue made by the partners.
*/
contract FeeManager is IFeeManager, HasAccessControl {
    RIF private _rif;
    IPartnerManager private _partnerManager;

    mapping(address => bool) private _whitelistedRegistrarsAndRenewers;
    mapping(address => uint256) private _balances;
    uint256 internal constant _PERCENT100_WITH_PRECISION18 = 100 * (10 ** 18);

    address private _pool;

    modifier onlyAuthorised() {
        if (!(_whitelistedRegistrarsAndRenewers[msg.sender])) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    constructor(
        RIF rif,
        address pool,
        IAccessControl accessControl,
        IPartnerManager partnerManager
    ) HasAccessControl(accessControl) {
        _rif = rif;
        _pool = pool;
        _partnerManager = partnerManager;
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
    ) external override onlyAuthorised {
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
        return
            IPartnerManager(_partnerManager).getPartnerConfiguration(partner);
    }

    /**
       @inheritdoc IFeeManager
     */
    function getBalance(
        address partner
    ) external view override returns (uint256) {
        return _balances[partner];
    }

    /**
       @inheritdoc IFeeManager
     */
    function getPool() public view returns (address) {
        return _pool;
    }

    /**
        @inheritdoc IFeeManager
     */
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
    function whiteListRegistrarOrRenewer(
        address entity
    ) external override onlyHighLevelOperator {
        _whitelistedRegistrarsAndRenewers[entity] = true;
    }

    /**
       @inheritdoc IFeeManager
     */
    function blackListRegistrarOrRenewer(
        address entity
    ) external override onlyHighLevelOperator {
        delete _whitelistedRegistrarsAndRenewers[entity];
    }

    /**
       @inheritdoc IFeeManager
     */
    function getPartnerManager() external view returns(address) {
        return address(_partnerManager);
    }

    /**
       @inheritdoc IFeeManager
     */
    function setPartnerManager(address newPartnerManager) external onlyHighLevelOperator {
        if (newPartnerManager == address(_partnerManager)) {
            revert("old value is same as new value");
        }
        _partnerManager = IPartnerManager(newPartnerManager);
        emit PartnerManagerChanged(msg.sender, newPartnerManager);
    }
}
