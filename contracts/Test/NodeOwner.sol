pragma solidity ^0.5.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/access/Roles.sol";
import "@rsksmart/rns-registry/contracts/AbstractRNS.sol";
import "./AbstractNodeOwner.sol";

contract NodeOwner is ERC721, Ownable, AbstractNodeOwner {
    using Roles for Roles.Role;

    AbstractRNS private rns;
    bytes32 private rootNode;

    mapping (uint256 => uint) public expirationTime;

    event ExpirationChanged(uint256 tokenId, uint expirationTime);

    modifier onlyRegistrar {
        require(registrars.has(msg.sender), "Only registrar.");
        _;
    }

    modifier onlyRenewer {
        require(renewers.has(msg.sender), "Only renewer.");
        _;
    }

    constructor (
        AbstractRNS _rns,
        bytes32 _rootNode
    ) public {
        rns = _rns;
        rootNode = _rootNode;
    }

    /// @notice Gets the owner of the specified domain.
    /// @param tokenId keccak256 of the domain label.
    /// @return domain owner.
    function ownerOf(uint256 tokenId) public view returns (address) {
        require(expirationTime[tokenId] > now, "ERC721: owner query for nonexistent token");
        return super.ownerOf(tokenId);
    }

    /// @notice Check if a domain is available to be registered.
    /// @dev The name must be registered via account with registrar role.
    /// @param tokenId keccak256 of the domain label.
    /// @return true if the specified domain can be registered.
    function available(uint256 tokenId) public view returns(bool) {
        return expirationTime[tokenId] < now;
    }

    ///////////////////
    // RSK TLD ADMIN //
    ///////////////////

    /*
        This contract owns a node in RNS, so it is capable to
        change it's resolution and ttl.
    */

    /// @notice set root node resolver in RNS.
    /// @param resolver to be set.
    function setRootResolver (address resolver) external onlyOwner {
        rns.setResolver(rootNode, resolver);
    }

    /// @notice set root node ttl in RNS.
    /// @param ttl to be set.
    function setRootTTL (uint64 ttl) external onlyOwner {
        rns.setTTL(rootNode, ttl);
    }

    //////////////////
    // REGISTRATION //
    //////////////////

    /*
        Only available domains can be registered. Once a domain is
        registered, it cannot be revoked until expiration.
    */

    // An account with registrar role can register domains.
    Roles.Role registrars;

    /// @notice Give an account access to registrar role.
    /// @dev Only owner.
    /// @param registrar new registrar.
    function addRegistrar(address registrar) external onlyOwner {
        registrars.add(registrar);
    }

    /// @notice Check if an account has registrar role.
    /// @param registrar to query if has registrar role.
    /// @return true if it has registrar role.
    function isRegistrar(address registrar) external view returns (bool) {
        return registrars.has(registrar);
    }

    /// @notice Remove an account's access to registrar role.
    /// @dev Only owner
    /// @param registrar registrar to remove from registrar role.
    function removeRegistrar(address registrar) external onlyOwner {
        registrars.remove(registrar);
    }

    /// @notice Registers a domain in RNS for a given duration.
    /// @dev Only accounts with registrar role.
    /// @param label keccak256 of the domain label to register.
    /// @param tokenOwner account that will own the registered domain.
    /// @param duration time to register the domain for.
    function register(bytes32 label, address tokenOwner, uint duration) external onlyRegistrar {
        uint256 tokenId = uint256(label);

        require(available(tokenId), "Not available");

        uint newExpirationTime = now.add(duration);
        expirationTime[tokenId] = newExpirationTime;
        emit ExpirationChanged(tokenId, newExpirationTime);

        if (_exists(tokenId))
            _burn(tokenId);

        _mint(tokenOwner, tokenId);

        rns.setSubnodeOwner(rootNode, label, tokenOwner);
    }

    ////////////////
    // RECLAIMING //
    ////////////////

    /*
        Names might be lost by transferring to contracts, or by
        error. This allows any owner (or approved) to reclaim the
        domain ownership in RNS.
    */

    /// @notice Reclaim ownership of a domain in RNS.
    /// @dev Only owner or approved for the domain.
    /// @param tokenId keccak256 of the domain
    /// @param newOwner the owner to set in RNS.
    function reclaim(uint256 tokenId, address newOwner) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        rns.setSubnodeOwner(rootNode, bytes32(tokenId), newOwner);
    }

    ////////////////
    // RENOVATION //
    ////////////////

    /*
        Only owned domains can be renewed. A renovation extends
        domain ownership.
    */

    // An account with renewer role can extend domain expirations.
    Roles.Role renewers;

    /// @notice Give an account access to renewer role.
    /// @dev Only owner
    /// @param renewer new renewer.
    function addRenewer(address renewer) external onlyOwner {
        renewers.add(renewer);
    }

    /// @notice Check if an account has renewer role.
    /// @param renewer to query if has renewer role.
    /// @return true if it has renewer role.
    function isRenewer(address renewer) external view returns (bool) {
        return renewers.has(renewer);
    }

    /// @notice Remove an account's access to renewer role.
    /// @dev Only owner
    /// @param renewer renewer to remove from renewer role.
    function removeRenewer(address renewer) external onlyOwner {
        renewers.remove(renewer);
    }

    /// @notice Renew a domain for a given duraiton.
    /// @dev Only accounts with renewer role.
    /// @param label keccak256 of the domain label to renew.
    /// @param time to extend the duration for.
    function renew (bytes32 label, uint time) external onlyRenewer {
        uint256 tokenId = uint256(label);
        require(expirationTime[tokenId] > now, "Name already expired");
        uint newExpirationTime = expirationTime[tokenId].add(time);
        expirationTime[tokenId] = newExpirationTime;
        emit ExpirationChanged(tokenId, newExpirationTime);
    }

    //////////////////////
    // AFTER EXPIRATION //
    //////////////////////

    /// @notice This method removes expired domains.
    /// @dev Use this to set 0 address in RNS ownership
    /// and burn the domains to keep balance up to date.
    /// @param tokenIds keccak256s of the domain labels to remove.
    function removeExpired(uint256[] calldata tokenIds) external {
        uint256 tokenId;
        bytes32 label;

        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];

            if (_exists(tokenId) && available(tokenId)) {
                expirationTime[tokenId] = ~uint(0);
                _burn(tokenId);
                expirationTime[tokenId] = 0;

                label = bytes32(tokenId);
                rns.setSubnodeOwner(rootNode, label, address(0));
            }
        }
    }
}
