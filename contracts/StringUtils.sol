// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "hardhat/console.sol";

library StringUtils {
    function strlen(string memory s) internal pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;
        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }

    function hasEmoji(string memory s) internal view returns (bool) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;
        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                //3 bytes emoji starts with 0xE2 or 0xEF
                if (b == 0xE2 || b == 0xEF) {
                    //   console.logString("three bytes emoji");
                    return true;
                }
                i += 3;
            } else if (b < 0xF8) {
                // console.logString("four bytes emoji");
                // console.logString(iToHex(b));
                return true;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return false;
    }

    function iToHex(bytes1 buffer) internal pure returns (string memory) {
        bytes memory converted = new bytes(2);
        bytes memory _base = "0123456789abcdef";

        converted[0] = _base[uint8(buffer) / _base.length];
        converted[1] = _base[uint8(buffer) % _base.length];

        return string(abi.encodePacked("0x", converted));
    }
}
