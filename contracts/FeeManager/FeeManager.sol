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

    struct TldEntity {
        string tldName;
        IBaseRegistrar registrar;
        IBaseRenewer renewer;
    }

    mapping(bytes32 => TldEntity) private _tlds;
    mapping(bytes32 => mapping(address => uint256)) private _balances;
    uint256 internal constant _PERCENT100_WITH_PRECISION18 = 100 * (10 ** 18);

    // IBaseRegistrar private _registrar;
    // IBaseRenewer private _renewer;
    IPartnerManager private _partnerManager;
    address private _pool;

    modifier onlyAuthorised(bytes32 tld) {
        if (
            !(msg.sender == address(_tlds[tld].registrar) ||
                msg.sender == address(_tlds[tld].renewer))
        ) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    constructor(
        IAccessControl accessControl,
        RIF rif,
        // IBaseRegistrar registrar,
        // IBaseRenewer renewer,
        IPartnerManager partnerManager,
        address pool
    ) HasAccessControl(accessControl) {
        _rif = rif;
        // _registrar = registrar;
        // _renewer = renewer;
        _partnerManager = partnerManager;
        _pool = pool;
    }

    /**
       @inheritdoc IFeeManager
     */
    function withdraw(bytes32 tld) external override {
        uint256 amount = _balances[tld][msg.sender];

        emit WithdrawalSuccessful(amount, msg.sender);

        if (amount == 0) revert ZeroBalance();

        _balances[tld][msg.sender] = 0;

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
        bytes32 tld
    ) external override onlyAuthorised(tld) {
        emit DepositSuccessful(amount, partner);

        if (!_rif.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed(msg.sender, address(this), amount);
        }

        uint256 partnerFee = (amount *
            _getPartnerConfiguration(partner).getFeePercentage()) /
            _PERCENT100_WITH_PRECISION18;
        _balances[tld][partner] += partnerFee;

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
        address partner,
        bytes32 tld
    ) external view returns (uint256) {
        return _balances[tld][partner];
    }

    /**
       @inheritdoc IFeeManager
     */
    function addNewTld(
        bytes32 tld,
        address registrar,
        address renewer,
        string memory tldName
    ) external onlyHighLevelOperator {
        _tlds[tld] = TldEntity(
            tldName,
            IBaseRegistrar(registrar),
            IBaseRenewer(renewer)
        );
        emit TldAdded(tld, tldName, registrar, renewer);
    }

    /**
       @inheritdoc IFeeManager
     */
    function getTld(
        bytes32 tld
    ) external view override returns (string memory, address, address) {
        return (
            _tlds[tld].tldName,
            address(_tlds[tld].registrar),
            address(_tlds[tld].renewer)
        );
    }
}
