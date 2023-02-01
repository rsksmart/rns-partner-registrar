// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

import "../StringUtils.sol";

contract StringUtilsTest {
    using StringUtils for string;

    function hasEmoji(string memory s) external view returns (bool) {
        return s.hasEmoji();
    }

    
}
