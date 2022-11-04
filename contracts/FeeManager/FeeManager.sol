// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import '../RIF.sol';
import './IFeeManager.sol';

error ZeroBalance();
error NotAuthorized(address sender);

contract FeeManager is IFeeManager {
    RIF private _rif;
    mapping(address => uint256) public balances;

    address private _registrar;

    modifier onlyRegistrar() {
        if(msg.sender != _registrar) revert NotAuthorized(msg.sender);
        _;
    }

    constructor(RIF rif, address registrar) {
        _rif = rif;
        _registrar = registrar;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];

        if (amount == 0) revert ZeroBalance();

        balances[msg.sender] = 0;
        require(_rif.transfer(msg.sender, amount), "Fee Manager: Transfer failed");
    }

    function deposit(address partner, uint256 amount) external onlyRegistrar {
        balances[partner] += amount;
        require(_rif.transferFrom(msg.sender, address(this), amount), "Fee Manager: Transfer failed");
    }
}
