// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.7;

import "../../Registrar/IBaseRegistrar.sol";
import "@rsksmart/erc677/contracts/IERC677.sol";
import "../../Renewer/IBaseRenewer.sol";

interface IPartnerRenewerProxy {
    function init(
        address _partner,
        IBaseRegistrar partnerRegistrar,
        IBaseRenewer partnerRenewer,
        IERC677 rif
    ) external;

    function renew(string calldata name, uint256 duration) external;
}
