import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import { deployContract as deployContractAsMock } from '../utils/mock.utils';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
  getRenewData,
  oneRBTC,
} from '../utils/mock.utils';
import { NodeOwner, RegistrarAccessControl__factory } from 'typechain-types';
import { PartnerManager } from 'typechain-types';
import { PartnerRegistrar } from 'typechain-types';
import { expect } from 'chai';
import { IFeeManager } from '../../typechain-types/contracts/FeeManager/IFeeManager';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677Token } from 'typechain-types/contracts/test-utils';
import { ERC677Token__factory } from 'typechain-types';
import { PartnerConfiguration } from 'typechain-types';
import { Resolver } from 'typechain-types';
import { RNS } from 'typechain-types';
import { PartnerRenewer } from 'typechain-types';
import { keccak256, toUtf8Bytes, namehash } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { duration } from '@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time';
import {
  UN_NECESSARY_MODIFICATION_ERROR_MSG,
  NAME_RENEWED_EVENT,
  FEE_MANAGER_CHANGED_EVENT,
} from 'test/utils/constants.utils';
import { SECRET } from './utils/constants';

const NAME = 'cheta';
const LABEL = keccak256(toUtf8Bytes(NAME));
const DURATION = ethers.BigNumber.from('1');
const FEE_PERCENTAGE = oneRBTC.mul(5); //5%
const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = ethers.utils.id('rsk');

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const partnerOwnerAccount = signers[2];
  const nameOwner = signers[3];
  const pool = signers[4];
  const alternateFeeManager = signers[5];
  const alternatePartnerManager = signers[7];

  const { contract: RNS } = await deployContract<RNS>(
    'RNS',
    {},
    (await ethers.getContractFactory(
      RNSAbi.abi,
      RNSAbi.bytecode
    )) as Factory<RNS>
  );

  const { contract: NodeOwner } = await deployContract<NodeOwner>(
    'NodeOwner',
    {
      _rns: RNS.address,
      _rootNode: tldNode,
    },
    (await ethers.getContractFactory(
      NodeOwnerAbi.abi,
      NodeOwnerAbi.bytecode
    )) as Factory<NodeOwner>
  );

  const { contract: Resolver } = await deployContract<Resolver>(
    'ResolverV1',
    {},
    (await ethers.getContractFactory(
      ResolverAbi.abi,
      ResolverAbi.bytecode
    )) as Factory<Resolver>
  );

  await (await Resolver.initialize(RNS.address)).wait();

  const RIF = await deployContractAsMock<ERC677Token__factory>('ERC677Token', [
    owner.address,
    oneRBTC.mul(100000000000000),
    'ERC677',
    'MOCKCOIN',
  ]);

  const { contract: FakeRIF } = await deployContract<ERC677Token>(
    'ERC677Token',
    {
      beneficiary: owner.address,
      initialAmount: oneRBTC.mul(100000000000000),
      tokenName: 'ERC677',
      tokenSymbol: 'MOCKCOIN',
    }
  );

  const accessControl =
    await deployContractAsMock<RegistrarAccessControl__factory>(
      'RegistrarAccessControl',
      []
    );

  const { contract: PartnerManager } = await deployContract<PartnerManager>(
    'PartnerManager',
    { accessControl: accessControl.address }
  );

  const { contract: PartnerConfiguration } =
    await deployContract<PartnerConfiguration>('PartnerConfiguration', {
      accessControl: accessControl.address,
      minLength: 5,
      maxLength: 20,
      minDuration: 1,
      maxDuration: 5,
      feePercentage: FEE_PERCENTAGE,
      discount: 0,
      minCommitmentAge: 1,
    });

  const { contract: alternatePartnerConfiguration } =
    await deployContract<PartnerConfiguration>('PartnerConfiguration', {
      accessControl: accessControl.address,
      minLength: 5,
      maxLength: 20,
      minDuration: 1,
      maxDuration: 5,
      feePercentage: FEE_PERCENTAGE,
      discount: 0,
      minCommitmentAge: 1,
    });

  const { contract: PartnerRegistrar } = await deployContract<PartnerRegistrar>(
    'PartnerRegistrar',
    {
      accessControl: accessControl.address,
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
      rns: RNS.address,
      rootNode: tldNode,
    }
  );

  const { contract: PartnerRenewer } = await deployContract<PartnerRenewer>(
    'PartnerRenewer',
    {
      accessControl: accessControl.address,
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
    }
  );

  const { contract: FeeManager } = await deployContract<IFeeManager>(
    'FeeManager',
    {
      rif: RIF.address,
      registrar: PartnerRegistrar.address,
      renewer: PartnerRenewer.address,
      partnerManager: PartnerManager.address,
      pool: pool.address,
    }
  );

  await (
    await RNS.setSubnodeOwner(rootNodeId, tldAsSha3, NodeOwner.address)
  ).wait();

  await (await NodeOwner.addRegistrar(PartnerRegistrar.address)).wait();
  await (await NodeOwner.addRenewer(PartnerRenewer.address)).wait();

  await (await RNS.setDefaultResolver(Resolver.address)).wait();

  await (await NodeOwner.setRootResolver(Resolver.address)).wait();

  await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();
  await (await PartnerRenewer.setFeeManager(FeeManager.address)).wait();

  await (
    await PartnerManager.addPartner(
      partner.address,
      partnerOwnerAccount.address
    )
  ).wait();
  await (
    await PartnerManager.setPartnerConfiguration(
      partner.address,
      PartnerConfiguration.address
    )
  ).wait();

  await (await RIF.transfer(nameOwner.address, oneRBTC.mul(10))).wait();

  return {
    NodeOwner,
    RIF,
    FakeRIF,
    PartnerManager,
    PartnerRegistrar,
    PartnerConfiguration,
    FeeManager,
    Resolver,
    RNS,
    owner,
    partner,
    nameOwner,
    signers,
    PartnerRenewer,
    pool,
    partnerOwnerAccount,
    alternateFeeManager,
    alternatePartnerConfiguration,
    alternatePartnerManager,
  };
};

it('Test Case No. 1 - ... ... ...', async () => {
  //Test Case No. 1
  //User Role:    Regular User
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Ready to Be Renovate
  //Duration:    1 year
  //CanReveal:     TRUE
}); //it

it('Test Case No. 2 - ... ... ...', async () => {
  //Test Case No. 2
  //User Role:    Regular User
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Ready to Be Renovate
  //Duration:    Between 3 and 4 Years
  //CanReveal:     TRUE
}); //it

it('Test Case No. 3 - ... ... ...', async () => {
  //Test Case No. 3
  //User Role:    Regular User
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Ready to Be Renovate
  //Duration:    5 years
  //CanReveal:     TRUE
}); //it
it('Test Case No. 4 - ... ... ...', async () => {
  //Test Case No. 4
  //User Role:    Regular User
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Ready to Be Renovate
  //Duration:    2 years
  //CanReveal:     FALSE
}); //it
it('Test Case No. 5 - ... ... ...', async () => {
  //Test Case No. 5
  //User Role:    RNS Owner
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Ready to Be Renovate
  //Duration:    2 years
  //CanReveal:     TRUE
}); //it
it('Test Case No. 6 - ... ... ...', async () => {
  //Test Case No. 6
  //User Role:    Regular User
  //Renewal's Number Of Steps:  Two steps
  //Domain Status:  Ready to Be Renovate
  //Duration:    1 year
  //CanReveal:     TRUE
}); //it
it('Test Case No. 7 - ... ... ...', async () => {
  //Test Case No. 7
  //User Role:    Regular User
  //Renewal's Number Of Steps:  Two steps
  //Domain Status:  Ready to Be Renovate
  //Duration:    2 years
  //CanReveal:     TRUE
}); //it
it('Test Case No. 8 - ... ... ...', async () => {
  //Test Case No. 8
  //User Role:    Regular User
  //Renewal's Number Of Steps:  Two steps
  //Domain Status:  Ready to Be Renovate
  //Duration:    Between 3 and 4 Years
  //CanReveal:     TRUE
}); //it
it('Test Case No. 9 - ... ... ...', async () => {
  //Test Case No. 9
  //User Role:    Partner Reseller
  //Renewal's Number Of Steps:  Two steps
  //Domain Status:  Ready to Be Renovate
  //Duration:    5 years
  //CanReveal:     TRUE
}); //it
it('Test Case No. 10 - ... ... ...', async () => {
  //Test Case No. 10
  //User Role:    Regular User
  //Renewal's Number Of Steps:  Two steps
  //Domain Status:  Ready to Be Renovate
  //Duration:    5 years
  //CanReveal:     FALSE
}); //it
it('Test Case No. 11 - ... ... ...', async () => {
  //Test Case No. 11
  //User Role:    Regular User
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Ready to Be Renovate
  //Duration:    0 Years (-)
  //CanReveal:     TRUE
}); //it
it('Test Case No. 12 - ... ... ...', async () => {
  //Test Case No. 12
  //User Role:    Regular User
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Expired (Should Be Purchased As 1st Time) (-)
  //Duration:    1 year
  //CanReveal:     TRUE
}); //it
it('Test Case No. 13 - ... ... ...', async () => {
  //Test Case No. 13
  //User Role:    Regular User
  //Renewal's Number Of Steps:  Two steps
  //Domain Status:  Available (Never Purchased) (-)
  //Duration:    1 year
  //CanReveal:     TRUE
}); //it
it('Test Case No. 14 - ... ... ...', async () => {
  //Test Case No. 14
  //User Role:    Regular User
  //Renewal's Number Of Steps:  One step
  //Domain Status:  Recent Purchased (Doesn't Need Renovation yet) (-)
  //Duration:    1 year
  //CanReveal:     TRUE
}); //it
it('Test Case No. 15 - ... ... ...', async () => {
  //Test Case No. 15
  //User Role:    Regular User
  //Renewal's Number Of Steps:  Two steps
  //Domain Status:  Ready to Be Renovate
  //Duration:    Greater Than Maximum (-)
  //CanReveal:     FALSE
}); //it
