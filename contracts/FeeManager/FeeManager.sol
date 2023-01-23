// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../RIF.sol";
import "./IFeeManager.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../Registrar/IBaseRegistrar.sol";
import "../Renewer/IBaseRenewer.sol";

/**
    @author Identity Team @IOVLabs
    @title  Keeps track of the balances of the collected revenue made by the partners.
*/
contract FeeManager is IFeeManager {
    RIF private _rif;
    /**
     * @notice thrown when an account tries to withdraw with a zero balance
     */
    error ZeroBalance();
    /**
     * @notice thrown when an account tries to perform an action that is not authorised
     */
    error NotAuthorized(address sender);
    /**
     * @notice thrown when the transfer of tokens fails
     * @param from address of the sender
     * @param to address of the receiver
     * @param amount amount of tokens
     */
    error TransferFailed(address from, address to, uint256 amount);

    mapping(address => uint256) private _balances;
    uint256 internal constant _PERCENT100_WITH_PRECISION18 = 100 * (10 ** 18);

    IBaseRegistrar private _registrar;
    IBaseRenewer private _renewer;
    IPartnerManager private _partnerManager;
    address private _pool;

    modifier onlyAuthorised() {
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
        address pool
    ) {
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
}
