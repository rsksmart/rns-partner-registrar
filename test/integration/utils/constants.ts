export const SECRET = keccak256(toUtf8Bytes('1234'));
export const NAME = 'cheta';
export const LABEL = keccak256(toUtf8Bytes(NAME));
export const DURATION = ethers.BigNumber.from('1');
export const FEE_PERCENTAGE = oneRBTC.mul(25); //5%
export const rootNodeId = ethers.constants.HashZero;
export const tldNode = namehash('rsk');
export const tldAsSha3 = ethers.utils.id('rsk');
