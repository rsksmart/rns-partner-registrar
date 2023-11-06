// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../NodeOwner.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../StringUtils.sol";
import "../FeeManager/IFeeManager.sol";
import "../test-utils/Resolver.sol";
import "../RNS.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";
import "@rsksmart/erc677/contracts/IERC677TransferReceiver.sol";
import "../BytesUtils.sol";
import "../Access/IAccessControl.sol";
import "../Access/HasAccessControl.sol";
import "./IMultiTLDPartnerRegistrar.sol";

/**
    @author Identity Team @IOVLabs
    @title Implements the interface IBaseRegistrar to register names in RNS. Takes into account the partners for the revenue sharing.
*/
contract MultiTLDPartnerRegistrar is
    IMultiTLDPartnerRegistrar,
    IERC677TransferReceiver,
    HasAccessControl
{
    mapping(bytes32 => uint256) private _commitmentRevealTime;

    IERC677 private _rif;
    IPartnerManager private _partnerManager;
    IFeeManager private _feeManager;
    RNS private _rns;

    // sha3("register(string,address,bytes32,uint,address,address)")
    bytes4 private constant _REGISTER_SIGNATURE = 0x646c3681;

    using BytesUtils for bytes;
    using StringUtils for string;

    constructor(
        IAccessControl accessControl,
        IERC677 rif,
        IPartnerManager partnerManager,
        RNS rns
    ) HasAccessControl(accessControl) {
        _rif = rif;
        _partnerManager = partnerManager;
        _rns = rns;
    }

    modifier onlyPartner(address partner) {
        if (!_partnerManager.isPartner(partner)) {
            revert("Not a partner");
        }
        _;
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function setPartnerManager(address newPartnerManager) external {
        _partnerManager = IPartnerManager(newPartnerManager);
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function getPartnerManager() external view returns (IPartnerManager) {
        return _partnerManager;
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function setFeeManager(
        IFeeManager feeManager
    ) external onlyHighLevelOperator {
        if (address(_feeManager) == address(feeManager)) {
            revert("old value is same as new value");
        }

        emit FeeManagerChanged(address(this), address(feeManager));

        _feeManager = feeManager;
    }

    // - Via ERC-677
    /* Encoding:
        | signature  |  4 bytes      - offset  0
        | owner      | 20 bytes      - offset  4
        | secret     | 32 bytes      - offest 24
        | duration   | 32 bytes      - offset 56
        | addr       | 20 bytes      - offset 88
        | partner   | 20 bytes      - offset 108
        | tld       | 32 bytes      - offset 128
        | name       | variable size - offset 160
    */

    /// @notice ERC-677 token fallback function.
    /// @dev Follow 'Register encoding' to execute a one-transaction regitration.
    /// @param from token sender.
    /// @param value amount of tokens sent.
    /// @param data data associated with transaction.
    /// @return true if successfull.
    function tokenFallback(
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bool) {
        if (msg.sender != address(_rif)) {
            revert CustomError("Only RIF token");
        }

        if (data.length <= 160) {
            revert CustomError("Invalid data");
        }

        bytes4 signature = data.toBytes4(0);
        if (signature != _REGISTER_SIGNATURE) {
            revert CustomError("Invalid signature");
        }

        address nameOwner = data.toAddress(4);
        bytes32 secret = data.toBytes32(24);
        uint256 duration = data.toUint(56);
        address addr = data.toAddress(88);
        address partner = data.toAddress(108);
        bytes32 tld = data.toBytes32(128);

        string memory name = data.toString(160, data.length - 160);

        _registerWithToken(
            from,
            value,
            name,
            secret,
            duration,
            nameOwner,
            addr,
            partner,
            tld
        );

        return true;
    }

    function _registerWithToken(
        address from,
        uint256 amount,
        string memory name,
        bytes32 secret,
        uint256 duration,
        address nameOwner,
        address addr,
        address partner,
        bytes32 tld
    ) private {
        emit NameRegistered(from, duration);

        uint256 cost = _executeRegistration(
            name,
            nameOwner,
            secret,
            duration,
            addr,
            partner,
            tld
        );

        // This aims to skip token transfer transactions if the cost is zero as it doesn't make
        // any sense to have transactions involving zero tokens. Hence calculations are
        // only done for non zero cost domain registrations.
        if (cost > 0) {
            if (amount < cost) {
                revert InsufficientTokensTransfered(cost, amount);
            }

            _collectFees(partner, cost);
        }

        uint256 difference = amount - cost;
        if (difference > 0) {
            bool success = _rif.transfer(from, difference);
            if (!success) {
                revert TokenTransferFailed(address(_rif), from, difference);
            }
        }
    }

    function _collectFees(address partner, uint256 amount) private {
        if (_feeManager == IFeeManager(address(0))) {
            revert CustomError("Fee manager not set");
        }

        bool success = _rif.approve(address(_feeManager), amount);
        if (!success) {
            revert TokenApprovalFailed(
                address(_rif),
                address(_feeManager),
                amount
            );
        }

        _feeManager.deposit(partner, amount, address(_partnerManager));
    }

    /**
       @inheritdoc IMultiTLDPartnerRegistrar
     */
    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr,
        address partner,
        bytes32 tld
    ) public override onlyPartner(partner) {
        emit NameRegistered(msg.sender, duration);

        uint256 cost = _executeRegistration(
            name,
            nameOwner,
            secret,
            duration,
            addr,
            partner,
            tld
        );

        // This aims to skip token transfer transactions if the cost is zero as it doesn't make
        // any sense to have transactions involving zero tokens. Hence calculations are
        // only done for non zero cost domain registrations.
        if (cost > 0) {
            bool success = _rif.transferFrom(msg.sender, address(this), cost);
            if (!success) {
                revert TokenTransferFailed(msg.sender, address(this), cost);
            }

            _collectFees(partner, cost);
        }
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function price(
        string calldata name,
        uint256 expires,
        uint256 duration,
        address partner
    ) public view override returns (uint256) {
        IPartnerConfiguration partnerConfiguration = _getPartnerConfiguration(
            partner
        );

        //TODO Do we need to have prices per tld? if that's the case we need to pass tld as parameter
        return partnerConfiguration.getPrice(name, expires, duration);
    }

    /**
       @inheritdoc IMultiTLDPartnerRegistrar
     */
    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr,
        bytes32 tld
    ) public pure override returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(label, nameOwner, secret, duration, addr, tld)
            );
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function canReveal(bytes32 commitment) public view override returns (bool) {
        uint256 revealTime = _commitmentRevealTime[commitment];
        return 0 < revealTime && revealTime <= block.timestamp;
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function commit(bytes32 commitment, address partner) public override {
        IPartnerConfiguration partnerConfiguration = _getPartnerConfiguration(
            partner
        );

        // Check the Partner's one step registration allowance config
        if (partnerConfiguration.getMinCommitmentAge() == 0) {
            revert CustomError("Commitment not required");
        }

        if (_commitmentRevealTime[commitment] > 0) {
            revert CustomError("Existent commitment");
        }
        _commitmentRevealTime[commitment] =
            block.timestamp +
            partnerConfiguration.getMinCommitmentAge();
    }

    function _executeRegistration(
        string memory name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr,
        address partner,
        bytes32 tld
    ) private returns (uint256) {
        IPartnerConfiguration partnerConfiguration = _getPartnerConfiguration(
            partner
        );

        partnerConfiguration.validateName(name, duration);

        bytes32 label = keccak256(abi.encodePacked(name));

        if (partnerConfiguration.getMinCommitmentAge() != 0) {
            bytes32 commitment = makeCommitment(
                label,
                nameOwner,
                secret,
                duration,
                addr,
                tld
            );
            if (!canReveal(commitment)) {
                revert CustomError("No commitment found");
            }
            _commitmentRevealTime[commitment] = 0;
        }

        NodeOwner _nodeOwner = NodeOwner(_rns.owner(tld));
        require(address(_nodeOwner) != address(0), "Invalid tld");

        _nodeOwner.register(label, address(this), duration * 365 days);

        Resolver(_rns.resolver(tld)).setAddr(
            keccak256(abi.encodePacked(tld, label)),
            addr
        );

        uint256 tokenId = uint256(label);
        _nodeOwner.reclaim(tokenId, nameOwner);
        _nodeOwner.transferFrom(address(this), nameOwner, tokenId);

        return
            partnerConfiguration.getPrice(
                name,
                _nodeOwner.expirationTime(uint256(label)),
                duration
            );
    }

    function _getPartnerConfiguration(
        address partner
    ) private view returns (IPartnerConfiguration) {
        if (!_partnerManager.isPartner(partner)) {
            revert InvalidPartner(partner);
        }

        return _partnerManager.getPartnerConfiguration(partner);
    }
}
