import {
  getAddrRegisterData,
  getRenewData,
  hashName,
  oneRBTC,
} from 'test/utils/mock.utils';
import {
  ERC677Token,
  PartnerConfiguration,
  PartnerRegistrar,
  PartnerRenewer,
  FeeManager,
} from 'typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { MockContract } from '@defi-wonderland/smock';
import { time } from '@nomicfoundation/hardhat-network-helpers';
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
  partnerConfiguration: PartnerConfiguration,
  includeExtraMoney = false
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
  const NameWithLettersOnlyHashed = hashName(domainName);
  let currentNamePrice = await PartnerRegistrarAsRegularUser.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice, partnerConfiguration);

  if (includeExtraMoney)
    currentNamePrice = currentNamePrice.add(oneRBTC.mul(BigNumber.from('2'))); //Test Cases to validate the extra money is refunded

  console.log('Purchase Of 1 Step - MONEY SENT: ' + currentNamePrice);

  await (
    await RIFAsRegularUser.transferAndCall(
      registrar.address,
      currentNamePrice,
      data
    )
  ).wait();
};

//Purchase 2 Step (Commit Greater Than Zero) (OK) - Commit + Transfer
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
    hashName(domainName),
    nameOwner.address,
    secret,
    duration,
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
  const NameWithLettersOnlyHashed = hashName(domainName);
  const currentNamePrice = await PartnerRegistrarAsRegularUser.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice, partnerConfiguration);

  await (
    await RIFAsRegularUser.transferAndCall(
      //Test (< Price -- OK)
      registrar.address,
      currentNamePrice, //Playing With (> Price -- OK + User Balance Get The Extra)
      data
    )
  ).wait();
};

//Purchase 2 Step (Commit 0) - Registrar + Approve
export const purchaseDomainWithoutCommit = async (
  domainName: string,
  duration: BigNumber,
  secret: string,
  nameOwner: SignerWithAddress,
  registrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string,
  partnerConfiguration: PartnerConfiguration,
  sendExtraMoney = false
) => {
  const currentMinCommitAge = await partnerConfiguration.getMinCommitmentAge();
  if (+currentMinCommitAge > 0) {
    await partnerConfiguration.setMinCommitmentAge(0);
  }

  const RIFAsRegularUser = RIF.connect(nameOwner);
  const registrarAsNameOwner = registrar.connect(nameOwner);
  const NameWithLettersOnlyHashed = hashName(domainName);

  let currentNamePrice = await registrarAsNameOwner.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice, partnerConfiguration);

  if (sendExtraMoney)
    currentNamePrice = currentNamePrice.add(oneRBTC.mul(BigNumber.from('3'))); //Test Cases to validate the extra money is refunded

  console.log('Purchase Of 2 Steps - MONEY SENT: ' + currentNamePrice);

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
  expectedCommitmentAge: BigNumber, // in seconds
  timeTravel: boolean = true,
  sentExtraMoney = false
) => {
  const currentMinCommitAge = await partnerConfiguration.getMinCommitmentAge();

  if (+currentMinCommitAge == 0) {
    await partnerConfiguration.setMinCommitmentAge(expectedCommitmentAge);
  }

  const registrarAsNameOwner = registrar.connect(nameOwner);

  const commitment = await registrarAsNameOwner.makeCommitment(
    hashName(domainName),
    nameOwner.address,
    secret,
    duration,
    nameOwner.address
  );

  //step 1
  await (
    await registrarAsNameOwner
      .connect(nameOwner)
      .commit(commitment, partnerAddress)
  ).wait();

  if (timeTravel) {
    await time.increase(+expectedCommitmentAge);
  }

  const RIFAsRegularUser = RIF.connect(nameOwner);
  const NameWithLettersOnlyHashed = hashName(domainName);

  let currentNamePrice = await registrarAsNameOwner.price(
    NameWithLettersOnlyHashed,
    0,
    duration,
    partnerAddress
  ); // Contract Execution

  //Validate given price is correct
  validateNamePrice(duration, currentNamePrice, partnerConfiguration);

  if (sentExtraMoney)
    currentNamePrice = currentNamePrice.add(oneRBTC.mul(BigNumber.from('5'))); //Test Cases to validate the extra money is refunded

  console.log('Purchase Of 3 Steps - MONEY SENT: ' + currentNamePrice);

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
  hasLetters: boolean = true,
  hasNumbers: boolean = false
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

  //console.log('RNS Log - Generated Name: ' + domainName);

  if (length == 0) return '';
  else return domainName;
};

//Validate given price is correct
export const validateNamePrice = async (
  duration: BigNumber,
  currentNamePrice: BigNumber,
  PartnerConfiguration: PartnerConfiguration
) => {
  let expectPrice = calculateNamePriceByDuration(duration); //TODO - Confirm With Sergio!

  const discountPercentage = await PartnerConfiguration.getDiscount();

  const oneHundred = oneRBTC.mul(100);

  const discountedAmount = expectPrice.mul(discountPercentage).div(oneHundred);

  console.log('Amount To Discount: ' + discountedAmount);

  expectPrice = expectPrice.sub(discountedAmount);

  console.log(
    'Expected Price: ' + expectPrice + '. Current Price: ' + currentNamePrice
  );

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

export const oneStepDomainOwnershipRenewal = async (
  domain: string,
  duration: BigNumber,
  namePrice: BigNumber,
  partnerAddress: string,
  nameOwner: SignerWithAddress,
  PartnerRenewer: PartnerRenewer,
  RIF: MockContract<ERC677Token>,
  numberOfMonths: BigNumber,
  makeTimePass = true
) => {
  if (makeTimePass && numberOfMonths.gt(BigNumber.from('0'))) {
    await simulateMonthsTime(numberOfMonths);
  }

  const renewData = getRenewData(domain, duration, partnerAddress);

  const RIFAsNameOwner = RIF.connect(nameOwner);

  console.log('name price to renovate: ' + namePrice);

  await (
    await RIFAsNameOwner.transferAndCall(
      PartnerRenewer.address,
      namePrice,
      renewData
    )
  ).wait();

  console.log('RNS Log - One Step Renewal Executed! ');
}; // End - One Step Renewal

export const TwoStepsDomainOwnershipRenewal = async (
  domain: string,
  duration: BigNumber,
  namePrice: BigNumber,
  partnerAddress: string,
  nameOwner: SignerWithAddress,
  PartnerRenewer: PartnerRenewer,
  RIF: MockContract<ERC677Token>,
  numberOfMonths: BigNumber,
  makeTimePass = true
) => {
  if (makeTimePass) {
    await simulateMonthsTime(numberOfMonths);
  }

  const RIFAsNameOwner = RIF.connect(nameOwner);
  await (
    await RIFAsNameOwner.approve(PartnerRenewer.address, namePrice)
  ).wait();

  const PartnerRenewerAsNameOwner = PartnerRenewer.connect(nameOwner);
  await (
    await PartnerRenewerAsNameOwner.renew(domain, duration, partnerAddress)
  ).wait();

  console.log('RNS Log - Two Step Renewal executed! ');
}; // End - Two Steps Renewal

export const simulateMonthsTime = async (numberOfMonths: BigNumber) => {
  const secontAtYear = BigNumber.from('31536000'); //31536000 = 1 Year

  const timeToSimulate = numberOfMonths
    .mul(secontAtYear)
    .div(BigNumber.from('12'));

  await time.increase(timeToSimulate);
}; // End - Time Simulation

export const runWithdrawTestProcess = async (
  partner: SignerWithAddress,
  FeeManager: FeeManager,
  RIF: MockContract<ERC677Token>,
  isFeeBalanceEmpty: boolean
) => {
  const partnerAddress = partner.address;

  const RIFBalanceBeforeWithdraw = await RIF.balanceOf(partnerAddress);

  const FEEBalanceBeforeWithdraw = await FeeManager.getBalance(partnerAddress);

  const feeManagerAsPartner = FeeManager.connect(partner);

  if (isFeeBalanceEmpty) {
    let errorFound: boolean = false;

    try {
      await feeManagerAsPartner.withdraw();
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      expect(
        currentError,
        'BUG: The ZERO Fee Balance error message was NOT displayed'
      ).to.contains(
        'VM Exception while processing transaction: reverted with custom error'
      );

      expect(
        currentError,
        'BUG: The ZERO Fee Balance error message was NOT displayed'
      ).to.contains('ZeroBalance()');

      expect(
        errorFound + '',
        'BUG: Error Message (Fee Balance Empty) was NOT thrown!'
      ).to.be.equals('true');

      console.log('FAILED WITHDRAW - Warning Message Successful!');
    }
  } // If
  else {
    await feeManagerAsPartner.withdraw();
  }

  const currentRIFBalanceAfterWithdraw = await RIF.balanceOf(partnerAddress);

  const currentFEEBalanceAfterWithdraw = await FeeManager.getBalance(
    partnerAddress
  );

  console.log('Balance RIF - PRE Retiro: ' + RIFBalanceBeforeWithdraw);

  console.log('Balance FEE - PRE Retiro: ' + FEEBalanceBeforeWithdraw);

  console.log('Balance RIF - POST Retiro: ' + currentRIFBalanceAfterWithdraw);

  console.log('Balance FEE - POST Retiro: ' + currentFEEBalanceAfterWithdraw);

  if (!isFeeBalanceEmpty) {
    expect(
      +currentFEEBalanceAfterWithdraw,
      'BUG: The Fee Balance Of the partner should be empty after withdraw, but it is NOT!'
    ).to.be.equals(+BigNumber.from('0'));

    const expectedRIFAmountOfMoney = RIFBalanceBeforeWithdraw.add(
      FEEBalanceBeforeWithdraw
    );

    expect(
      +currentRIFBalanceAfterWithdraw,
      'BUG: The RIF Balance Of the partner was Not updated successfully'
    ).to.be.equals(+expectedRIFAmountOfMoney);

    console.log('SUCCESSFUL WITHDRAW - Validation Successful!');
  } else {
    expect(
      +currentFEEBalanceAfterWithdraw,
      'BUG: The Fee Balance of the partner was altered despite the withdraw was not executed!'
    ).to.be.equals(+FEEBalanceBeforeWithdraw);

    expect(
      +currentRIFBalanceAfterWithdraw,
      'BUG: The RIF Balance of the partner was altered despite the withdraw was not executed!'
    ).to.be.equals(+RIFBalanceBeforeWithdraw);

    console.log('FAILED WITHDRAW - Validation Successful!');
  }
}; //End - Execute Withdraw Process
