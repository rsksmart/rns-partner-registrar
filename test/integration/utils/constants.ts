import { keccak256, toUtf8Bytes, namehash } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { oneRBTC } from 'test/utils/mock.utils';
import { generateRandomStringWithLettersAndNumbers } from './operations';

export const SECRET = () =>
  keccak256(toUtf8Bytes(generateRandomStringWithLettersAndNumbers(5)));
export const NAME = 'cheta';

export const LABEL = keccak256(toUtf8Bytes(NAME));
export const OneYearDuration = ethers.BigNumber.from('1');
export const FEE_PERCENTAGE = oneRBTC.mul(25); //5%
export const rootNodeId = ethers.constants.HashZero;
export const tldNode = namehash('rsk');
export const tldAsSha3 = ethers.utils.id('rsk');
export const namePriceForOneYear = oneRBTC.mul(2);

export const MINIMUM_DOMAIN_NAME_LENGTH = 3;
export const MAXIMUM_DOMAIN_NAME_LENGTH = 100;
