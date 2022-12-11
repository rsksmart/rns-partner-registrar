// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.16;

library BytesUtils {
    modifier minLength(
        uint256 size,
        uint256 offset,
        uint256 length
    ) {
        require(size >= offset + length, "Short input");
        _;
    }

    function toBytes4(bytes memory input, uint256 offset)
        internal
        pure
        minLength(input.length, offset, 4)
        returns (bytes4)
    {
        bytes4 output;

        assembly {
            output := mload(add(add(input, 0x20), offset))
        }

        return output;
    }

    function toAddress(bytes memory input, uint256 offset)
        internal
        pure
        minLength(input.length, offset, 20)
        returns (address)
    {
        bytes20 output;

        assembly {
            output := mload(add(add(input, 0x20), offset))
        }

        return address(output);
    }

    function toBytes32(bytes memory input, uint256 offset)
        internal
        pure
        minLength(input.length, offset, 32)
        returns (bytes32)
    {
        bytes32 output;

        assembly {
            output := mload(add(add(input, 0x20), offset))
        }

        return output;
    }

    function toUint(bytes memory input, uint256 offset)
        internal
        pure
        returns (uint256)
    {
        return uint256(toBytes32(input, offset));
    }

    // source: https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol
    function toString(
        bytes memory input,
        uint256 offset,
        uint256 strLength
    )
        internal
        pure
        minLength(input.length, offset, strLength)
        returns (string memory)
    {
        bytes memory output;

        assembly {
            switch iszero(strLength)
            case 0 {
                // Get a location of some free memory and store it in tempBytes as
                // Solidity does for memory variables.
                output := mload(0x40)

                // The first word of the slice result is potentially a partial
                // word read from the original array. To read it, we calculate
                // the length of that partial word and start copying that many
                // bytes into the array. The first word we copy will start with
                // data we don't care about, but the last `lengthmod` bytes will
                // land at the beginning of the contents of the new array. When
                // we're done copying, we overwrite the full first word with
                // the actual length of the slice.
                let lengthmod := and(strLength, 31)

                // The multiplication in the next line is necessary
                // because when slicing multiples of 32 bytes (lengthmod == 0)
                // the following copy loop was copying the origin's length
                // and then ending prematurely not copying everything it should.
                let mc := add(
                    add(output, lengthmod),
                    mul(0x20, iszero(lengthmod))
                )
                let end := add(mc, strLength)

                for {
                    // The multiplication in the next line has the same exact purpose
                    // as the one above.
                    let cc := add(
                        add(
                            add(input, lengthmod),
                            mul(0x20, iszero(lengthmod))
                        ),
                        offset
                    )
                } lt(mc, end) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    mstore(mc, mload(cc))
                }

                mstore(output, strLength)

                //update free-memory pointer
                //allocating the array padded to 32 bytes like the compiler does now
                mstore(0x40, and(add(mc, 31), not(31)))
            }
            //if we want a zero-length slice let's just return a zero-length array
            default {
                output := mload(0x40)

                mstore(0x40, add(output, 0x20))
            }
        }

        return string(output);
    }
}
