// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

interface RIF {
    function transfer(address to, uint256 value) external returns (bool);
}

interface IFeeManager {
    function withdraw() external;
    function deposit(uint256 amount) external;
}

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
        _rif.transfer(msg.sender, amount);
    }

    function deposit(uint256 amount) external onlyRegistrar {
        balances[msg.sender] += amount;
    }
}
