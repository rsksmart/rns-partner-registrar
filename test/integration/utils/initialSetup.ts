import { ethers } from 'hardhat';
import { deployContract, Factory } from '../../../utils/deployment.utils';
import { deployContract as deployContractAsMock } from '../../utils/mock.utils';
import { oneRBTC } from '../../utils/mock.utils';
import { NodeOwner, RegistrarAccessControl__factory } from 'typechain-types';
import { PartnerManager } from 'typechain-types';
import { PartnerRegistrar } from 'typechain-types';
import { ERC677Token__factory } from 'typechain-types';
import { IFeeManager } from 'typechain-types';
import NodeOwnerAbi from '../../external-abis/NodeOwner.json';
import RNSAbi from '../../external-abis/RNS.json';
import ResolverAbi from '../../external-abis/ResolverV1.json';
import { ERC677Token } from 'typechain-types';
import { PartnerConfiguration } from 'typechain-types';
import { Resolver } from 'typechain-types';
import { RNS } from 'typechain-types';
import { PartnerRenewer } from 'typechain-types';
import { FEE_PERCENTAGE, rootNodeId, tldAsSha3, tldNode } from './constants';
import { BigNumber } from 'ethers';

export const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const nameOwner = signers[3];
  const pool = signers[4];
  const regularUser = signers[5];
  const notWhitelistedPartner = signers[6];

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
      minCommitmentAge: 0,
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

  await (await RNS.setDefaultResolver(Resolver.address)).wait();

  await (await NodeOwner.setRootResolver(Resolver.address)).wait();

  await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();

  await (
    await PartnerManager.addPartner(
      partner.address,
      PartnerConfiguration.address
    )
  ).wait();

  await (await RIF.transfer(nameOwner.address, oneRBTC.mul(10))).wait();
  await (await FakeRIF.transfer(nameOwner.address, oneRBTC.mul(10))).wait();

  await (await RIF.transfer(regularUser.address, oneRBTC.mul(10))).wait();
  await (await FakeRIF.transfer(regularUser.address, oneRBTC.mul(10))).wait();

  await (await RIF.transfer(partner.address, oneRBTC.mul(10))).wait();
  await (await FakeRIF.transfer(partner.address, oneRBTC.mul(10))).wait();

  const { contract: alternatePartnerConfiguration } =
    await deployContract<PartnerConfiguration>('PartnerConfiguration', {
      accessControl: accessControl.address,
      minLength: 5,
      maxLength: 20,
      minDuration: BigNumber.from('1'),
      maxDuration: BigNumber.from('5'),
      feePercentage: FEE_PERCENTAGE,
      discount: 0,
      minCommitmentAge: 0,
    });

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
    nameOwner,
    signers,
    pool,
    partner,
    regularUser,
    alternatePartnerConfiguration,
    notWhitelistedPartner,
  };
};
