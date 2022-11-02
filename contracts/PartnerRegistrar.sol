// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

import "./IBaseRegistrar.sol";
import "./NodeOwner.sol";
import "./RIF.sol";
import "./PartnerManager.sol";
import "./StringUtils.sol";

contract PartnerRegistrar is IBaseRegistrar {
    mapping(bytes32 => uint256) private commitmentRevealTime;

    NodeOwner nodeOwner;
    RIF rif;
    IPartnerManager partnerManager;

    using StringUtils for string;

    constructor(
        NodeOwner _nodeOwner,
        RIF _rif,
        IPartnerManager _partnerManager
    ) {
        nodeOwner = _nodeOwner;
        rif = _rif;
        partnerManager = _partnerManager;
    }

    modifier onlyPartner() {
        require(partnerManager.isPartner(msg.sender), "Partner Registrar: Not a partner");
        _;
    }

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external onlyPartner {
        uint256 cost = _executeRegistration(name, nameOwner, secret, duration);
        require(
            rif.transferFrom(msg.sender, address(this), cost),
            "Token transfer failed"
        );
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
        uint256 revealTime = commitmentRevealTime[commitment];
        return 0 < revealTime && revealTime <= block.timestamp;
    }

    function commit(bytes32 commitment) external onlyPartner {
        require(commitmentRevealTime[commitment] < 1, "Existent commitment");
        commitmentRevealTime[commitment] =
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
        commitmentRevealTime[commitment] = 0;

        nodeOwner.register(label, nameOwner, duration * 365 days);

        return
            _getPartnerConfiguration().getPrice(
                name,
                nodeOwner.expirationTime(uint256(label)),
                duration
            );
    }

    function _getPartnerConfiguration() private returns (IPartnerConfiguration) {
        return partnerManager.getPartnerConfiguration(msg.sender);
    }
}
