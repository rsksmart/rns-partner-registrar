import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
  oneRBTC,
} from '../utils/mock.utils';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar';
import { expect } from 'chai';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { IFeeManager } from '../../typechain-types/contracts/FeeManager/IFeeManager';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677Token } from 'typechain-types/contracts/test-utils';
import { $PartnerConfiguration } from 'typechain-types/contracts-exposed/PartnerConfiguration/PartnerConfiguration.sol/$PartnerConfiguration';
import { BigNumber, utils } from 'ethers';
import { $Resolver } from 'typechain-types/contracts-exposed/test-utils/Resolver.sol/$Resolver';
import { $RNS } from 'typechain-types/contracts-exposed/RNS.sol/$RNS';
import { $PartnerProxyFactory } from 'typechain-types/contracts-exposed/PartnerProxy/PartnerProxyFactory.sol/$PartnerProxyFactory';
import { $PartnerProxy } from 'typechain-types/contracts-exposed/PartnerProxy/PartnerProxy.sol/$PartnerProxy';

const SECRET = keccak256(toUtf8Bytes('1234'));
const NAME = 'cheta👀aa';
const LABEL = keccak256(toUtf8Bytes(NAME));
const DURATION = BigNumber.from('1');
const FEE_PERCENTAGE = oneRBTC.mul(5); //5%
const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[0];
  const nameOwner = signers[2];
  const pool = signers[3];

  const { contract: RNS } = await deployContract<$RNS>(
    'RNS',
    {},
    (await ethers.getContractFactory(
      RNSAbi.abi,
      RNSAbi.bytecode
    )) as Factory<$RNS>
  );

  const { contract: NodeOwner } = await deployContract<$NodeOwner>(
    'NodeOwner',
    {
      _rns: RNS.address,
      _rootNode: tldNode,
    },
    (await ethers.getContractFactory(
      NodeOwnerAbi.abi,
      NodeOwnerAbi.bytecode
    )) as Factory<$NodeOwner>
  );

  const { contract: Resolver } = await deployContract<$Resolver>(
    'ResolverV1',
    {},
    (await ethers.getContractFactory(
      ResolverAbi.abi,
      ResolverAbi.bytecode
    )) as Factory<$Resolver>
  );

  await (await Resolver.initialize(RNS.address)).wait();

  const { contract: RIF } = await deployContract<ERC677Token>('ERC677Token', {
    beneficiary: owner.address,
    initialAmount: oneRBTC.mul(100000000000000),
    tokenName: 'ERC677',
    tokenSymbol: 'MOCKCOIN',
  });

  const { contract: PartnerManager } = await deployContract<$PartnerManager>(
    '$PartnerManager',
    {}
  );

  const { contract: PartnerConfiguration } =
    await deployContract<$PartnerConfiguration>('$PartnerConfiguration', {
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
    await deployContract<$PartnerRegistrar>('$PartnerRegistrar', {
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
      rns: RNS.address,
      rootNode: tldNode,
    });

  const { contract: FeeManager } = await deployContract<IFeeManager>(
    '$FeeManager',
    {
      rif: RIF.address,
      registrar: PartnerRegistrar.address,
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

  const { contract: PartnerProxyBase } = await deployContract<$PartnerProxy>(
    '$PartnerProxy',
    {}
  );

  const { contract: PartnerProxyFactory } =
    await deployContract<$PartnerProxyFactory>('$PartnerProxyFactory', {
      _masterProxy: PartnerProxyBase.address,
      _rif: RIF.address,
    });

  const partnerProxyName = 'PartnerOne';
  await (
    await PartnerProxyFactory.createNewPartnerProxy(
      partner.address,
      partnerProxyName,
      PartnerRegistrar.address
    )
  ).wait();

  const tx1 = await PartnerProxyFactory.getPartnerProxy(
    partner.address,
    partnerProxyName
  );
  const partnerProxyAddress = tx1.proxy;
  const PartnerProxy = PartnerProxyBase.attach(partnerProxyAddress);

  await (await PartnerManager.addPartner(partnerProxyAddress)).wait();
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
    partner,
    nameOwner,
    signers,
    PartnerProxy,
    pool,
  };
};

describe('New Domain Registration', () => {
  it('Should register a new domain', async () => {
    const { RIF, Resolver, nameOwner, FeeManager, PartnerProxy, pool } =
      await loadFixture(initialSetup);
    const namePrice = await PartnerProxy.price(NAME, 0, DURATION);
    const partnerProxyAsNameOwner = PartnerProxy.connect(nameOwner);

    /* Below steps become redundant because the commit transaction reverts as the minCommitment age is 0 */
    // const commitment = await partnerProxyAsNameOwner.makeCommitment(
    //   LABEL,
    //   nameOwner.address,
    //   SECRET
    // );

    // await (await partnerProxyAsNameOwner.commit(commitment)).wait();

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
