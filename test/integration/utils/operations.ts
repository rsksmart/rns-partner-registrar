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


  
  //Validate given price is correct 
  const expectPrice = calculateDiscountByDuration(duration);

  console.log('Expected: ' + expectPrice + '. Current: ' +  currentNamePrice);

  expect(+expectPrice, 'The calculated domain price is incorrect!').to.equal(+currentNamePrice);




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
    const expectPrice = calculateDiscountByDuration(duration);

    console.log('Expected: ' + expectPrice + '. Current: ' +  currentNamePrice);
  
    expect(+expectPrice, 'The calculated domain price is incorrect!').to.equal(+currentNamePrice);



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
export const generateRandomStringWithLettersAndNumbers = (length: number, hasLetters: boolean, hasNumbers: boolean) => {

  let domainName = '';

  let characters:string = '';

  let realLength:number = length;

  if (hasLetters){
    characters = characters + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    domainName = domainName + 'A';

    realLength--;
  }

  if (hasNumbers){
    characters = characters + '0123456789';
    
    domainName = domainName + '1';

    realLength--;
  }

  const charactersLength = characters.length;

  for (let i = 0; i < realLength; i++) {
    domainName += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  //TODO Poner Fecha y Hora para que nunca se repita
    
  return domainName;
};
