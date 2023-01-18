import { getAddrRegisterData, oneRBTC } from 'test/utils/mock.utils';
import { ERC677Token, PartnerRegistrar } from 'typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { namehash, keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { MockContract } from '@defi-wonderland/smock';

//Purchase 1 Step
export const purchaseName = async (
  name: string,
  duration: BigNumber,
  secret: string,
  nameOwner: SignerWithAddress,
  registrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string
) => {
  const data = getAddrRegisterData(
    name,
    nameOwner.address,
    secret,
    duration,
    nameOwner.address,
    partnerAddress
  );

  const RIFAsRegularUser = RIF.connect(nameOwner);
  const PartnerRegistrarAsRegularUser = registrar.connect(nameOwner);
  const NameWithLettersOnlyHashed = namehash(name);
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

export const calculateDiscountByDuration = (duration: BigNumber) => {
  if (duration.lte(2)) return oneRBTC.mul(BigNumber.from('2')).mul(duration);
  else return oneRBTC.mul(duration.add(BigNumber.from('2')));
};

export const nameToTokenId = (name: string) => {
  const nameAsHash = keccak256(toUtf8Bytes(name));
  const tokenId = BigNumber.from(nameAsHash);
  return tokenId;
};
