// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.17;

// import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../Registrar/PartnerRegistrar.sol";

contract PartnerProxy {
    address public partner;
    PartnerRegistrar private _partnerRegistrar;

    constructor(PartnerRegistrar partnerRegistrar) {
        _partnerRegistrar = partnerRegistrar;
    }

    modifier onlyOwner() {
        require(msg.sender == partner, "Unathourized: caller not authorized");
        _;
    }

    function init(address _partner) external {
        partner = _partner;
    }

    function register(
        string calldata name,
        address nameOwner,
        bytes32 secret,
        uint256 duration
    ) external onlyOwner {
        _partnerRegistrar.register(name, nameOwner, secret, duration);
    }

    function price(
        string calldata name,
        uint256 expires,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        return _partnerRegistrar.price(name, expires, duration);
    }

    function canReveal(bytes32 commitment)
        public
        view
        onlyOwner
        returns (bool)
    {
        return _partnerRegistrar.canReveal(commitment);
    }

    function makeCommitment(
        bytes32 label,
        address nameOwner,
        bytes32 secret
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(label, nameOwner, secret));
    }

    function commit(bytes32 commitment) external onlyOwner {
        return _partnerRegistrar.commit(commitment);
    }
}
