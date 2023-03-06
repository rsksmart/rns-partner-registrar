import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';

export interface Factory<C extends Contract> extends ContractFactory {
  deploy: (...args: Array<unknown>) => Promise<C>;
}

export const deployContract = async <C extends Contract, A = {}>(
  contractName: string,
  constructorArgs: A extends {} ? A : {},
  factory?: Factory<C>,
  signer?: SignerWithAddress
): Promise<{
  contract: Contract;
  signers: SignerWithAddress[];
  contractFactory: Factory<C>;
}> => {
  const options = Object.values(constructorArgs);
  const contractFactory =
    factory ?? ((await ethers.getContractFactory(contractName)) as Factory<C>);
  const contract = signer
    ? await contractFactory.connect(signer).deploy(...options)
    : await contractFactory.deploy(...options);
  await contract.deployed();

  return {
    contract,
    signers: await ethers.getSigners(),
    contractFactory,
  };
};
