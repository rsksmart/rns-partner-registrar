import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
  oneRBTC,
} from '../utils/mock.utils';
import { NodeOwner } from 'typechain-types';
import { PartnerManager } from 'typechain-types';
import { PartnerRegistrar } from 'typechain-types';
import { expect } from 'chai';
import { IFeeManager } from 'typechain-types';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677Token } from 'typechain-types';
import { PartnerConfiguration } from 'typechain-types';
import { Resolver } from 'typechain-types';
import { RNS } from 'typechain-types';
import { PartnerRegistrarProxyFactory as PartnerRegistrarProxyFactoryType } from 'typechain-types';
import { PartnerRenewer } from 'typechain-types';
import { keccak256, toUtf8Bytes, namehash } from 'ethers/lib/utils';

const SECRET = keccak256(toUtf8Bytes('1234'));
const NAME = 'cheta👀aa';
const LABEL = keccak256(toUtf8Bytes(NAME));
const DURATION = ethers.BigNumber.from('1');
const FEE_PERCENTAGE = oneRBTC.mul(25); //5%
const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = ethers.utils.id('rsk');

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partnerOwnerAccount = signers[0];
  const nameOwner = signers[2];
  const pool = signers[3];

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

  const { contract: RIF } = await deployContract<ERC677Token>('ERC677Token', {
    beneficiary: owner.address,
    initialAmount: oneRBTC.mul(100000000000000),
    tokenName: 'ERC677',
    tokenSymbol: 'MOCKCOIN',
  });

  const { contract: PartnerManager } = await deployContract<PartnerManager>(
    'PartnerManager',
    {}
  );

  const { contract: PartnerConfiguration } =
    await deployContract<PartnerConfiguration>('PartnerConfiguration', {
      minLength: 5,
      maxLength: 20,
      isUnicodeSupported: false,
      minDuration: 1,
      maxDuration: 5,
      feePercentage: FEE_PERCENTAGE,
      discount: 0,
      minCommitmentAge: 0,
    });

  const { contract: PartnerRegistrar } =
    await deployContract<PartnerRegistrar>('PartnerRegistrar', {
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
      rns: RNS.address,
      rootNode: tldNode,
    });

  const { contract: PartnerRenewer } = await deployContract<PartnerRenewer>(
    'PartnerRenewer',
    {
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

  const PartnerProxyBase = await ethers.getContractFactory(
    'PartnerRegistrarProxy'
  );

  const { contract: PartnerProxyFactory } =
    await deployContract<PartnerRegistrarProxyFactoryType>(
      'PartnerRegistrarProxyFactory',
      {
        _rif: RIF.address,
        _partnerRegistrar: PartnerRegistrar.address,
        _partnerRenewer: PartnerRenewer.address,
      }
    );

  const partnerProxyName = 'PartnerOne';
  await (
    await PartnerProxyFactory.createNewPartnerProxy(
      partnerOwnerAccount.address,
      partnerProxyName
    )
  ).wait();

  const tx1 = await PartnerProxyFactory.getPartnerProxy(
    partnerOwnerAccount.address,
    partnerProxyName
  );
  const partnerProxyAddress = tx1.proxy;
  const PartnerProxy = PartnerProxyBase.attach(partnerProxyAddress);

  await (
    await PartnerManager.addPartner(
      partnerProxyAddress,
      partnerOwnerAccount.address
    )
  ).wait();
  await (
    await PartnerManager.setPartnerConfiguration(
      partnerProxyAddress,
      PartnerConfiguration.address
    )
  ).wait();

  await (await RIF.transfer(nameOwner.address, oneRBTC.mul(10))).wait();

  return {
    NodeOwner,
    RIF,
    PartnerManager,
    PartnerRegistrar,
    PartnerConfiguration,
    FeeManager,
    Resolver,
    RNS,
    owner,
    partnerOwnerAccount,
    nameOwner,
    signers,
    PartnerProxy,
    pool,
  };
};

describe('New Domain Registration', () => {
  it('Should register a new domain for a partnerOwnerAccount with 0 minCommitmentAge', async () => {
    const {
      RIF,
      Resolver,
      nameOwner,
      FeeManager,
      PartnerProxy,
      pool,
      partnerOwnerAccount,
    } = await loadFixture(initialSetup);
    const namePrice = await PartnerProxy.price(NAME, 0, DURATION);

    const data = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
      DURATION,
      nameOwner.address
    );

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerProxy.address,
        namePrice,
        data
      )
    ).wait();

    const resolvedName = await Resolver['addr(bytes32)'](
      namehash(NAME + '.rsk')
    );
    expect(resolvedName).to.equal(nameOwner.address);

    const feeManagerBalance = await RIF.balanceOf(FeeManager.address);
    const expectedManagerBalance = calculatePercentageWPrecision(
      namePrice,
      FEE_PERCENTAGE
    );

    expect(+expectedManagerBalance).to.equal(+feeManagerBalance);

    const poolBalance = await RIF.balanceOf(pool.address);

    const expectedPoolBalance = namePrice.sub(expectedManagerBalance);

    expect(+poolBalance).to.equal(+expectedPoolBalance);

    const partnerBalanceInFeeManager = await FeeManager.getBalance(
      partnerOwnerAccount.address
    );
    const expectedPartnerAccountBalance = expectedManagerBalance; //since it is the only operation...
    expect(+partnerBalanceInFeeManager).to.equal(
      +expectedPartnerAccountBalance
    );
  });

  it('Should register a new domain for a partnerOwnerAccount with a non 0 minCommitmentAge', async () => {
    const {
      RIF,
      Resolver,
      nameOwner,
      FeeManager,
      PartnerProxy,
      pool,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);
    const namePrice = await PartnerProxy.price(NAME, 0, DURATION);

    // set minCommitmentAge of partner so as not skip the commit step in the registration flow
    await (await PartnerConfiguration.setMinCommitmentAge(1)).wait();

    const partnerProxyAsNameOwner = PartnerProxy.connect(nameOwner);

    const commitment = await partnerProxyAsNameOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    await (await partnerProxyAsNameOwner.commit(commitment)).wait();

    const data = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
      DURATION,
      nameOwner.address
    );

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerProxy.address,
        namePrice,
        data
      )
    ).wait();

    const resolvedName = await Resolver['addr(bytes32)'](
      namehash(NAME + '.rsk')
    );
    expect(resolvedName).to.equal(nameOwner.address);

    const feeManagerBalance = await RIF.balanceOf(FeeManager.address);
    const expectedManagerBalance = calculatePercentageWPrecision(
      namePrice,
      FEE_PERCENTAGE
    );

    expect(+expectedManagerBalance).to.equal(+feeManagerBalance);

    const poolBalance = await RIF.balanceOf(pool.address);

    const expectedPoolBalance = namePrice.sub(expectedManagerBalance);

    expect(+poolBalance).to.equal(+expectedPoolBalance);
  });
});
