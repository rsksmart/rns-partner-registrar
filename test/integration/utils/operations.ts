import { getAddrRegisterData, oneRBTC } from 'test/utils/mock.utils';
import {
  ERC677Token,
  PartnerConfiguration,
  PartnerRegistrar,
} from 'typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { namehash, keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { MockContract } from '@defi-wonderland/smock';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { OneYearDuration, SECRET } from './constants';

//Purchase 1 Step
export const purchaseDomainUsingTransferAndCallWithoutCommit = async (
  domainName: string,
  duration: BigNumber,
  secret: string,
  nameOwner: SignerWithAddress,
  registrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string,
  partnerConfiguration: PartnerConfiguration
) => {
  const currentMinCommitAge = await partnerConfiguration.getMinCommitmentAge();
  if (+currentMinCommitAge > 0) {
    await partnerConfiguration.setMinCommitmentAge(0);
  }

  const data = getAddrRegisterData(
    domainName,
    nameOwner.address,
    secret,
    duration,
    nameOwner.address,
    partnerAddress
  );

  const RIFAsRegularUser = RIF.connect(nameOwner);
  const PartnerRegistrarAsRegularUser = registrar.connect(nameOwner);
  const NameWithLettersOnlyHashed = namehash(domainName);
  const currentNamePrice = await PartnerRegistrarAsRegularUser.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  await (
    await RIFAsRegularUser.transferAndCall(
      registrar.address,
      currentNamePrice,
      data
    )
  ).wait();
};

//Purchase 2 Step
export const purchaseDomainUsingTransferAndCallWithCommit = async (
  domainName: string,
  duration: BigNumber,
  secret: string,
  nameOwner: SignerWithAddress,
  registrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string,
  partnerConfiguration: PartnerConfiguration,
  expectedCommitmentAge: BigNumber // in seconds
) => {
  const currentMinCommitAge = await partnerConfiguration.getMinCommitmentAge();
  if (+currentMinCommitAge == 0) {
    await partnerConfiguration.setMinCommitmentAge(expectedCommitmentAge);
  }

  const registrarAsNameOwner = registrar.connect(nameOwner);

  const commitment = await registrarAsNameOwner.makeCommitment(
    namehash(domainName),
    nameOwner.address,
    SECRET(),
    OneYearDuration,
    nameOwner.address
  );

  await (
    await registrarAsNameOwner
      .connect(nameOwner)
      .commit(commitment, partnerAddress)
  ).wait();

  await time.increase(+expectedCommitmentAge);

  const data = getAddrRegisterData(
    domainName,
    nameOwner.address,
    secret,
    duration,
    nameOwner.address,
    partnerAddress
  );

  const RIFAsRegularUser = RIF.connect(nameOwner);
  const PartnerRegistrarAsRegularUser = registrar.connect(nameOwner);
  const NameWithLettersOnlyHashed = namehash(domainName);
  const currentNamePrice = await PartnerRegistrarAsRegularUser.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  await (
    await RIFAsRegularUser.transferAndCall(
      registrar.address,
      currentNamePrice,
      data
    )
  ).wait();
};

//Purchase 2 Step
export const purchaseDomainWithoutCommit = async (
  domainName: string,
  duration: BigNumber,
  secret: string,
  nameOwner: SignerWithAddress,
  registrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string,
  partnerConfiguration: PartnerConfiguration
) => {
  const currentMinCommitAge = await partnerConfiguration.getMinCommitmentAge();
  if (+currentMinCommitAge > 0) {
    await partnerConfiguration.setMinCommitmentAge(0);
  }

  const RIFAsRegularUser = RIF.connect(nameOwner);
  const registrarAsNameOwner = registrar.connect(nameOwner);
  const NameWithLettersOnlyHashed = namehash(domainName);

  const currentNamePrice = await registrarAsNameOwner.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  //step 1
  await (
    await RIFAsRegularUser.approve(registrar.address, currentNamePrice)
  ).wait();

  //step 2
  await (
    await registrarAsNameOwner.register(
      domainName,
      nameOwner.address,
      secret,
      duration,
      nameOwner.address,
      partnerAddress
    )
  ).wait();
};

//Purchase 3 Step
export const purchaseDomainWithCommit = async (
  domainName: string,
  duration: BigNumber,
  secret: string,
  nameOwner: SignerWithAddress,
  registrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string,
  partnerConfiguration: PartnerConfiguration,
  expectedCommitmentAge: BigNumber // in seconds
) => {
  const currentMinCommitAge = await partnerConfiguration.getMinCommitmentAge();
  if (+currentMinCommitAge == 0) {
    await partnerConfiguration.setMinCommitmentAge(expectedCommitmentAge);
  }

  const registrarAsNameOwner = registrar.connect(nameOwner);

  const commitment = await registrarAsNameOwner.makeCommitment(
    namehash(domainName),
    nameOwner.address,
    SECRET(),
    OneYearDuration,
    nameOwner.address
  );

  //step 1
  await (
    await registrarAsNameOwner
      .connect(nameOwner)
      .commit(commitment, partnerAddress)
  ).wait();

  await time.increase(+expectedCommitmentAge);

  const RIFAsRegularUser = RIF.connect(nameOwner);
  const NameWithLettersOnlyHashed = namehash(domainName);

  const currentNamePrice = await registrarAsNameOwner.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  //step 2
  await (
    await RIFAsRegularUser.approve(registrar.address, currentNamePrice)
  ).wait();

  //step 3
  await (
    await registrarAsNameOwner.register(
      domainName,
      nameOwner.address,
      secret,
      duration,
      nameOwner.address,
      partnerAddress
    )
  ).wait();
};

export const calculateDiscountByDuration = (duration: BigNumber) => {
  if (duration.lte(2)) return oneRBTC.mul(BigNumber.from('2')).mul(duration);
  else return oneRBTC.mul(duration.add(BigNumber.from('2')));
};

export const nameToTokenId = (name: string) => {
  const nameAsHash = keccak256(toUtf8Bytes(name));
  const tokenId = BigNumber.from(nameAsHash);
  return tokenId;
};

// generate a random string of a given length including numbers and letters
export const generateRandomStringWithLettersAndNumbers = (length: number) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
