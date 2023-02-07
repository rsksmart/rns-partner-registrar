// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IBaseRegistrar.sol";
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

/**
    @author Identity Team @IOVLabs
    @title Implements the interface IBaseRegistrar to register names in RNS. Takes into account the partners for the revenue sharing.
*/
contract PartnerRegistrar is
    IBaseRegistrar,
    IERC677TransferReceiver,
    HasAccessControl
{
    mapping(bytes32 => uint256) private _commitmentRevealTime;

    NodeOwner private _nodeOwner;
    IERC677 private _rif;
    IPartnerManager private _partnerManager;
    IFeeManager private _feeManager;
    RNS private _rns;
    bytes32 private _rootNode;

    // sha3("register(string,address,bytes32,uint,address,address)")
    bytes4 private constant _REGISTER_SIGNATURE = 0x646c3681;

    using BytesUtils for bytes;
    using StringUtils for string;

    constructor(
        IAccessControl accessControl,
        NodeOwner nodeOwner,
        IERC677 rif,
        IPartnerManager partnerManager,
        RNS rns,
        bytes32 rootNode
    ) HasAccessControl(accessControl) {
        _nodeOwner = nodeOwner;
        _rif = rif;
        _partnerManager = partnerManager;
        _rns = rns;
        _rootNode = rootNode;
    }

    modifier onlyPartner(address partner) {
        require(
            _partnerManager.isPartner(partner),
            "Partner Registrar: Not a partner"
        );
        _;
    }

    function getPartnerManager() external view returns (IPartnerManager) {
        return _partnerManager;
    }

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
        | partner   | 32 bytes      - offset 88
        | name       | variable size - offset 108
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
        require(msg.sender == address(_rif), "Only RIF token");
        require(data.length > 128, "Invalid data");

        bytes4 signature = data.toBytes4(0);
        require(signature == _REGISTER_SIGNATURE, "Invalid signature");

        address nameOwner = data.toAddress(4);
        bytes32 secret = data.toBytes32(24);
        uint256 duration = data.toUint(56);
        address addr = data.toAddress(88);
        address partner = data.toAddress(108);
        string memory name = data.toString(128, data.length - 128);

        _registerWithToken(
            from,
            value,
            name,
            secret,
            duration,
            nameOwner,
            addr,
            partner
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
        address partner
    ) private {
        emit NameRegistered(from, duration);

        uint256 cost = _executeRegistration(
            name,
            nameOwner,
            secret,
            duration,
            addr,
            partner
        );

        // This aims to skip token transfer transactions if the cost is zero as it doesn't make
        // any sense to have transactions involving zero tokens. Hence calculations are
        // only done for non zero cost domain registrations.
        if (cost > 0) {
            require(amount >= cost, "Insufficient tokens transferred");

            _collectFees(partner, cost);

            uint256 difference = amount - cost;
            if (difference > 0)
                require(
                    _rif.transfer(from, difference),
                    "Token transfer failed"
                );
        }
    }

    function _collectFees(address partner, uint256 amount) private {
        require(_feeManager != IFeeManager(address(0)), "Fee Manager not set");

        require(
            _rif.approve(address(_feeManager), amount),
            "Token approval failed"
        );

        _feeManager.deposit(partner, amount);
    }

    // - Via ERC-20
    /// @notice Registers a .rsk name in RNS.
    /// @dev This method must be called after commiting.
    /// @param name The name to register.
    /// @param nameOwner The owner of the name to regiter.
    /// @param secret The secret used to make the commitment.
    /// @param duration Time to register in years.
    /// @param addr Address to set as addr resolution.
    /// @param partner Partner address
    /// @custom:emits-event emits the NameRegistered event
    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr,
        address partner
    ) public override onlyPartner(partner) {
        emit NameRegistered(msg.sender, duration);

        uint256 cost = _executeRegistration(
            name,
            nameOwner,
            secret,
            duration,
            addr,
            partner
        );

        // This aims to skip token transfer transactions if the cost is zero as it doesn't make
        // any sense to have transactions involving zero tokens. Hence calculations are
        // only done for non zero cost domain registrations.
        if (cost > 0) {
            require(
                _rif.transferFrom(msg.sender, address(this), cost),
                "Token transfer failed"
            );

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
        return partnerConfiguration.getPrice(name, expires, duration);
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr
    ) public pure override returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(label, nameOwner, secret, duration, addr)
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
            revert("Commitment not required");
        }
        require(_commitmentRevealTime[commitment] < 1, "Existent commitment");
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
        address partner
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
                addr
            );
            require(canReveal(commitment), "No commitment found");
            _commitmentRevealTime[commitment] = 0;
        }

        _nodeOwner.register(label, address(this), duration * 365 days);

        Resolver(_rns.resolver(_rootNode)).setAddr(
            keccak256(abi.encodePacked(_rootNode, label)),
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
        require(_partnerManager.isPartner(partner), "Not a partner");

        return _partnerManager.getPartnerConfiguration(partner);
    }
}
