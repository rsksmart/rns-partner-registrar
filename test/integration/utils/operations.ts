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
import { expect } from 'chai';

//Purchase 1 Step (Commit = 0)
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

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice);

  await (
    await RIFAsRegularUser.transferAndCall(
      registrar.address,
      currentNamePrice,
      data
    )
  ).wait();
};

//Purchase 2 Step (Commit Greater Than Zero)
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
    secret,
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

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice);

  await (
    await RIFAsRegularUser.transferAndCall(
      registrar.address,
      currentNamePrice,
      data
    )
  ).wait();
};

//Purchase 2 Step (Commit 0)
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

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice);

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

//Purchase 3 Step (Commit Greater Than 0)
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

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice);

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

export const calculateNamePriceByDuration = (duration: BigNumber) => {
  if (duration.lte(2)) return oneRBTC.mul(BigNumber.from('2')).mul(duration);
  else return oneRBTC.mul(duration.add(BigNumber.from('2')));
};

export const nameToTokenId = (name: string) => {
  const nameAsHash = keccak256(toUtf8Bytes(name));
  const tokenId = BigNumber.from(nameAsHash);
  return tokenId;
};

// generate a random string of a given length including numbers and letters
export const generateRandomStringWithLettersAndNumbers = (
  length: number,
  hasLetters: boolean,
  hasNumbers: boolean
) => {
  let domainName = '';

  let characters: string = '';

  let realLength: number = length;

  if (hasLetters) {
    characters =
      characters + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    domainName += getDateTimeString(false);
  }

  if (hasNumbers) {
    characters = characters + '0123456789';

    domainName += getDateTimeString(true);
  }

  const charactersLength = characters.length;

  if (domainName.length < length) {
    realLength = length - domainName.length;

    for (let i = 0; i < realLength; i++) {
      domainName += characters.charAt(
        Math.floor(Math.random() * charactersLength)
      );
    }
  }

  console.log('RNS Log - Generated Name: ' + domainName);

  return domainName;
};

//Validate given price is correct
export const validateNamePrice = (
  duration: BigNumber,
  currentNamePrice: BigNumber
) => {
  const expectPrice = calculateNamePriceByDuration(duration);

  console.log('Expected: ' + expectPrice + '. Current: ' + currentNamePrice);

  expect(+expectPrice, 'The calculated domain price is incorrect!').to.equal(
    +currentNamePrice
  );
};

const getDateTimeString = (idAsNumbers: boolean) => {
  const currentMoment: Date = new Date();

  const month = currentMoment.getMonth() + 1;

  const day = currentMoment.getDate() + '';

  let domainID: string = '';

  if (idAsNumbers)
    domainID =
      '' +
      currentMoment.getDate() +
      month +
      currentMoment.getFullYear() +
      currentMoment.getHours() +
      currentMoment.getMinutes() +
      currentMoment.getSeconds();
  else domainID = '' + getDayID(day) + getMonthID(month);

  return domainID;
};

const getMonthID = (month: number) => {
  let moment: string = '';

  switch (month) {
    case 1:
      moment += 'JA';
      break;
    case 2:
      moment += 'FE';
      break;
    case 3:
      moment += 'MA';
      break;
    case 4:
      moment += 'AP';
      break;
    case 5:
      moment += 'MY';
      break;
    case 6:
      moment += 'JU';
      break;
    case 7:
      moment += 'JL';
      break;
    case 8:
      moment += 'AG';
      break;
    case 9:
      moment += 'SP';
      break;
    case 10:
      moment += 'OC';
      break;
    case 11:
      moment += 'NO';
      break;
    case 12:
      moment += 'DE';
      break;
  }

  return moment;
};

const getDayID = (dayAsString: string) => {
  let dayID: string = '';

  const firstDigit = parseInt(dayAsString.charAt(0) + '');

  dayID += getDayDigitID(firstDigit);

  if (dayAsString.length > 0) {
    const secondDigit = parseInt(dayAsString.charAt(1) + '');

    dayID += getDayDigitID(secondDigit);
  }

  return dayID;
};

const getDayDigitID = (dayDigit: number) => {
  let moment: string = '';

  switch (dayDigit) {
    case 0:
      moment += 'ZR';
      break;
    case 1:
      moment += 'ON';
      break;
    case 2:
      moment += 'TW';
      break;
    case 3:
      moment += 'TR';
      break;
    case 4:
      moment += 'FO';
      break;
    case 5:
      moment += 'FV';
      break;
    case 6:
      moment += 'SI';
      break;
    case 7:
      moment += 'SV';
      break;
    case 8:
      moment += 'EI';
      break;
    case 9:
      moment += 'NI';
      break;
  }
  return moment;
};
