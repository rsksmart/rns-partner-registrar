// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "../RIF.sol";
import "./IFeeManager.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../Registrar/IBaseRegistrar.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

error ZeroBalance();
error NotAuthorized(address sender);

contract FeeManager is IFeeManager, Ownable {
    RIF private _rif;

    mapping(address => uint256) public balances;

    IBaseRegistrar private _registrar;
    IPartnerManager private _partnerManager;

    modifier onlyRegistrar() {
        if (msg.sender != address(_registrar)) revert NotAuthorized(msg.sender);
        _;
    }

    constructor(
        RIF rif,
        IBaseRegistrar registrar,
        IPartnerManager partnerManager
    ) Ownable() {
        _rif = rif;
        _registrar = registrar;
        _partnerManager = partnerManager;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];

        if (amount == 0) revert ZeroBalance();

        balances[msg.sender] = 0;
        require(
            _rif.transfer(msg.sender, amount),
            "Fee Manager: Transfer failed"
        );
    }

    function deposit(address partner, uint256 cost) external onlyRegistrar {
        uint256 partnerFee = (cost *
            _getPartnerConfiguration(partner).getFeePercentage()) / 100;
        balances[partner] += partnerFee;
        balances[owner()] += cost - partnerFee;
    }

    function _getPartnerConfiguration(address partner)
        private
        returns (IPartnerConfiguration)
    {
        return _partnerManager.getPartnerConfiguration(partner);
    }
}
