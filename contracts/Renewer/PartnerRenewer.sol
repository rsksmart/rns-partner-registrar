// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "@rsksmart/erc677/contracts/IERC677.sol";
import "../NodeOwner.sol";
import "../PartnerManager/IPartnerManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../FeeManager/IFeeManager.sol";
import "./IBaseRenewer.sol";

/**
    @author Identity Team @IOVLabs
    @title PartnerRenewer
    @dev Implements the interface IBaseRenewer to renew names in RNS.
*/
contract PartnerRenewer is IBaseRenewer, Ownable {
    NodeOwner private _nodeOwner;
    IERC677 private _rif;
    IPartnerManager private _partnerManager;
    IFeeManager private _feeManager;

    constructor(
        NodeOwner nodeOwner,
        IERC677 rif,
        IPartnerManager partnerManager
    ) Ownable() {
        _nodeOwner = nodeOwner;
        _rif = rif;
        _partnerManager = partnerManager;
    }

    modifier onlyPartner() {
        require(
            _partnerManager.isPartner(msg.sender),
            "Partner Registrar: Not a partner"
        );
        _;
    }

    function setFeeManager(IFeeManager feeManager) external onlyOwner {
        _feeManager = feeManager;
    }

    // - Via ERC-20
    /// @notice Renews a name in Node Owner.
    /// @dev This method should be called if the owned.
    /// @param name The name to register.
    /// @param duration Time to register in years.
    function renew(string calldata name, uint256 duration)
        external
        override
        onlyPartner
    {
        emit NameRenewed(msg.sender, duration);

        uint256 cost = _executeRenovation(name, duration);

        require(
            _rif.transferFrom(msg.sender, address(this), cost),
            "Token transfer failed"
        );
        require(_feeManager != IFeeManager(address(0)), "Fee Manager not set");

        require(
            _rif.approve(address(_feeManager), cost),
            "Token approve failed"
        );

        _feeManager.deposit(msg.sender, cost);
    }

    /// @notice Executes renovation abstracted from payment method.
    /// @param name The name to renew.
    /// @param duration Time to renew in years.
    /// @return price Price of the name to register.
    function _executeRenovation(string memory name, uint256 duration)
        private
        returns (uint256)
    {
        bytes32 label = keccak256(abi.encodePacked(name));

        _nodeOwner.renew(label, duration * 365 days);

        return
            _getPartnerConfiguration().getPrice(
                name,
                _nodeOwner.expirationTime(uint256(label)),
                duration
            );
    }

    function _getPartnerConfiguration()
        private
        view
        returns (IPartnerConfiguration)
    {
        return _partnerManager.getPartnerConfiguration(msg.sender);
    }
}
