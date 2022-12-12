// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "./IBaseRegistrar.sol";
import "../NodeOwner.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../StringUtils.sol";
import "../FeeManager/IFeeManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../test-utils/Resolver.sol";
import "../RNS.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";

/**
    @author Identity Team @IOVLabs
    @title PartnerRegistrar
    @dev Implements the interface IBaseRegistrar to register names in RNS.
*/
contract PartnerRegistrar is IBaseRegistrar, Ownable {
    mapping(bytes32 => uint256) private _commitmentRevealTime;

    NodeOwner private _nodeOwner;
    IERC677 private _rif;
    IPartnerManager private _partnerManager;
    IFeeManager private _feeManager;
    RNS private _rns;
    bytes32 private _rootNode;

    using StringUtils for string;

    constructor(
        NodeOwner nodeOwner,
        IERC677 rif,
        IPartnerManager partnerManager,
        RNS rns,
        bytes32 rootNode
    ) Ownable() {
        _nodeOwner = nodeOwner;
        _rif = rif;
        _partnerManager = partnerManager;
        _rns = rns;
        _rootNode = rootNode;
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
    /// @notice Registers a .rsk name in RNS.
    /// @dev This method must be called after commiting.
    /// @param name The name to register.
    /// @param nameOwner The owner of the name to regiter.
    /// @param secret The secret used to make the commitment.
    /// @param duration Time to register in years.
    /// @param addr Address to set as addr resolution.
    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr
    ) external override onlyPartner {
        uint256 cost = _executeRegistration(
            name,
            nameOwner,
            secret,
            duration,
            addr
        );

        require(
            _rif.transferFrom(msg.sender, address(this), cost),
            "Token transfer failed"
        );
        require(_feeManager != IFeeManager(address(0)), "Fee Manager not set");

        _rif.approve(address(_feeManager), cost);

        _feeManager.deposit(msg.sender, cost);

        emit NameRegistered(msg.sender, duration);
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external view override returns (uint256) {
        return _getPartnerConfiguration().getPrice(name, expires, duration);
    }

    /**
       @inheritdoc IBaseRegistrar
     */
    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) public pure override returns (bytes32) {
        return keccak256(abi.encodePacked(label, nameOwner, secret));
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
    function commit(bytes32 commitment) external override onlyPartner {
        // Check the Partner's one step registration allowance config
        if (_getPartnerConfiguration().getMinCommitmentAge() == 0) {
            revert("Commitment not required");
        }
        require(_commitmentRevealTime[commitment] < 1, "Existent commitment");
        _commitmentRevealTime[commitment] =
            block.timestamp +
            _getPartnerConfiguration().getMinCommitmentAge();
    }

    function _executeRegistration(
        string memory name,
        address nameOwner,
        bytes32 secret,
        uint256 duration,
        address addr
    ) private returns (uint256) {
        bytes32 label = keccak256(abi.encodePacked(name));
        require(
            name.strlen() >= _getPartnerConfiguration().getMinLength(),
            "Name too short"
        );

        require(
            name.strlen() <= _getPartnerConfiguration().getMaxLength(),
            "Name too long"
        );

        if (_getPartnerConfiguration().getMinCommitmentAge() != 0) {
            bytes32 commitment = makeCommitment(label, nameOwner, secret);
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
