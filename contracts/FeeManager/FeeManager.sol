// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "../RIF.sol";
import "./IFeeManager.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../Registrar/IBaseRegistrar.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

error ZeroBalance();
error NotAuthorized(address sender);
error TransferFailed(address from, address to, uint256 amount);

contract FeeManager is IFeeManager, Ownable {
    RIF private _rif;

    mapping(address => uint256) private _balances;
    uint256 internal constant _PERCENT100_WITH_PRECISION18 = 100 * (10 ** 18);

    IBaseRegistrar private _registrar;
    IPartnerManager private _partnerManager;
    address private _pool;

    modifier onlyRegistrar() {
        if (msg.sender != address(_registrar)) revert NotAuthorized(msg.sender);
        _;
    }

    constructor(
        RIF rif,
        IBaseRegistrar registrar,
        IPartnerManager partnerManager,
        address pool
    ) Ownable() {
        _rif = rif;
        _registrar = registrar;
        _partnerManager = partnerManager;
        _pool = pool;
    }

    function withdraw() external {
        uint256 amount = _balances[msg.sender];

        if (amount == 0) revert ZeroBalance();

        _balances[msg.sender] = 0;

        if (!_rif.transfer(msg.sender, amount)) {
            revert TransferFailed(address(this), msg.sender, amount);
        }
    }

    function deposit(address partner, uint256 cost) external onlyRegistrar {
        if (!_rif.transferFrom(msg.sender, address(this), cost)) {
            revert TransferFailed(msg.sender, address(this), cost);
        }

        uint256 partnerFee = (cost *
            _getPartnerConfiguration(partner).getFeePercentage()) /
            _PERCENT100_WITH_PRECISION18;
        _balances[_getPartnerOwnerAccount(partner)] += partnerFee;

        uint256 balance = cost - partnerFee;

        if (!_rif.transfer(_pool, balance)) {
            revert TransferFailed(address(this), _pool, balance);
        }
    }

    function _getPartnerConfiguration(
        address partner
    ) private view returns (IPartnerConfiguration) {
        return _partnerManager.getPartnerConfiguration(partner);
    }

    function _getPartnerOwnerAccount(
        address partner
    ) private view returns (address) {
        return _partnerManager.getPartnerOwnerAccount(partner);
    }

    function getBalance(address partner) external view returns (uint256) {
        return _balances[partner];
    }
}
