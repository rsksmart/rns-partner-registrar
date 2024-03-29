import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { randomBytes } from 'crypto';
import { ethers, network } from 'hardhat';
import NetworkHelpers from '@nomicfoundation/hardhat-network-helpers';
import {
  smock,
  FakeContract,
  FakeContractSpec,
  FakeContractOptions,
} from '@defi-wonderland/smock';
import {
  BigNumber,
  Signer,
  Wallet,
  BigNumberish,
  ContractFunction,
  BaseContract,
  ContractFactory,
} from 'ethers';
import { arrayify, hexZeroPad } from 'ethers/lib/utils';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';

export const oneRBTC = ethers.BigNumber.from(10).pow(18);
// mock contract default balance set to a very
// high value to not run out of funds during testing
export const defaultBalance = '0x84595161401484A000000';

export const calculatePercentageWPrecision = (
  num: BigNumberish,
  perc: BigNumberish,
  precision = oneRBTC
): BigNumber => {
  return BigNumber.from(num).mul(perc).div(precision.mul(100));
};

export const getRandomBytes = (size = 32, encoding: BufferEncoding = 'hex') => {
  return randomBytes(size).toString(encoding);
};

export const generateRandomWallet = (): Signer => {
  const id = getRandomBytes();
  const privateKey = '0x' + id;
  const wallet = new Wallet(privateKey);

  return wallet;
};

export const getFunctionSelector = (signature: string) =>
  ethers.utils.id(signature).substring(0, 10);

export const timeNowInSeconds = () => Math.round(Date.now() / 1000);

export const sendrBtcToContract = async (
  contractAddress: string,
  amount: BigNumberish
) => {
  const [wallet] = await ethers.getSigners();
  await wallet.sendTransaction({ to: contractAddress, value: amount });
};

// Impersonates a contract
// NOTE: This will only work in Hardhat network
export const contractAsSigner = async (
  contractAddress: string
): Promise<SignerWithAddress> => {
  await Promise.all([
    NetworkHelpers.impersonateAccount(contractAddress),
    setBalance(contractAddress, defaultBalance),
  ]);

  return ethers.getSigner(contractAddress);
};

export const setBalance = async (address: string, hexAmount: string) =>
  network.provider.send('hardhat_setBalance', [address, hexAmount]);

export type Contract<C> = BaseContract & {
  readonly [key in keyof C]: ContractFunction | any;
};

export const deployMockContract = async <T extends BaseContract>(
  contractAbi: FakeContractSpec,
  opts?: FakeContractOptions
): Promise<FakeContract<T>> => {
  const myFakeContract = await smock.fake<T>(contractAbi, opts);

  return myFakeContract;
};

export const deployContract = async <T extends ContractFactory>(
  contractName: string,
  constructorArgs: Parameters<T['deploy']>
) => {
  const myContractFactory = await smock.mock<T>(contractName);

  const myContract = await myContractFactory.deploy(...constructorArgs);

  return myContract;
};

export const getAddrRegisterData = (
  name: string,
  owner: string,
  secret: string,
  duration: BigNumber,
  addr: string,
  partner: string
) => {
  // 0x + 8 bytes
  const _signature = arrayify('0x646c3681');

  // 20 bytes
  const _owner = arrayify(owner.toLowerCase());

  // 32 bytes
  const _secret = arrayify(secret);

  // 32 bytes
  const _duration = arrayify(hexZeroPad(duration.toHexString(), 32));

  // 20 bytes
  const _addr = arrayify(addr.toLowerCase());

  // 20 bytes
  const _partner = arrayify(partner.toLowerCase());

  // variable length
  const _name = Buffer.from(name);

  // // 20 bytes
  const result = new Uint8Array(
    _signature.length +
      _owner.length +
      _secret.length +
      _duration.length +
      _addr.length +
      _partner.length +
      _name.length
  );
  result.set(_signature, 0);
  result.set(_owner, _signature.length);
  result.set(_secret, _owner.length + _signature.length);
  result.set(_duration, _secret.length + _owner.length + _signature.length);
  result.set(
    _addr,
    _duration.length + _secret.length + _owner.length + _signature.length
  );
  result.set(
    _partner,
    _addr.length +
      _duration.length +
      _secret.length +
      _owner.length +
      _signature.length
  );
  result.set(
    _name,
    _partner.length +
      _addr.length +
      _duration.length +
      _secret.length +
      _owner.length +
      _signature.length
  );
  return result;
};

export const getRenewData = (
  name: string,
  duration: BigNumber,
  partner: string
) => {
  // 0x + 4 bytes
  const _signature = arrayify('0x8d7016ca');

  // 32 bytes
  const _duration = arrayify(hexZeroPad(duration.toHexString(), 32));

  // 20 bytes
  const _partner = arrayify(partner.toLowerCase());

  // variable length
  const _name = Buffer.from(name);

  const result = new Uint8Array(
    _signature.length + _duration.length + _partner.length + _name.length
  );
  result.set(_signature, 0);
  result.set(_duration, _signature.length);
  result.set(_partner, _duration.length + _signature.length);
  result.set(_name, _partner.length + _duration.length + _signature.length);
  return result;
};

export const hashName = (domain: string) => {
  return keccak256(toUtf8Bytes(domain));
};
