// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./IBaseRegistrar.sol";
import "../NodeOwner.sol";
import "../RIF.sol";
import "../PartnerManager/IPartnerManager.sol";
import "../StringUtils.sol";
import "../FeeManager/IFeeManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PartnerRegistrar is IBaseRegistrar, Ownable {
    mapping(bytes32 => uint256) private _commitmentRevealTime;

    NodeOwner private _nodeOwner;
    RIF private _rif;
    IPartnerManager private _partnerManager;
    IFeeManager private _feeManager;

    using StringUtils for string;

    constructor(
        NodeOwner nodeOwner,
        RIF rif,
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

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external onlyPartner {
        uint256 cost = _executeRegistration(name, nameOwner, secret, duration);

        _feeManager.deposit(msg.sender, cost);

        require(
            _rif.transferFrom(msg.sender, address(_feeManager), cost),
            "Token transfer failed"
        );
    }

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external onlyPartner returns (uint256) {
        return _getPartnerConfiguration().getPrice(name, expires, duration);
    }

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(label, nameOwner, secret));
    }

    function canReveal(bytes32 commitment)
        public
        view
        onlyPartner
        returns (bool)
    {
        uint256 revealTime = _commitmentRevealTime[commitment];
        return 0 < revealTime && revealTime <= block.timestamp;
    }

    function commit(bytes32 commitment) external onlyPartner {
        require(_commitmentRevealTime[commitment] < 1, "Existent commitment");
        _commitmentRevealTime[commitment] =
            block.timestamp +
            _getPartnerConfiguration().getMinCommittmentAge();
    }

    function _executeRegistration(
        string memory name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
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

        bytes32 commitment = makeCommitment(label, nameOwner, secret);
        require(canReveal(commitment), "No commitment found");
        _commitmentRevealTime[commitment] = 0;

        _nodeOwner.register(label, nameOwner, duration * 365 days);

        return
            _getPartnerConfiguration().getPrice(
                name,
                _nodeOwner.expirationTime(uint256(label)),
                duration
            );
    }

    function _getPartnerConfiguration()
        private
        returns (IPartnerConfiguration)
    {
        return _partnerManager.getPartnerConfiguration(msg.sender);
    }
}
