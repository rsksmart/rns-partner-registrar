import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import { oneRBTC } from '../utils/mock.utils';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar';
import { expect } from 'chai';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { IFeeManager } from '../../typechain-types/contracts/FeeManager/IFeeManager';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677 } from 'typechain-types/contracts/test-utils';
import { $PartnerConfiguration } from 'typechain-types/contracts-exposed/PartnerConfiguration/PartnerConfiguration.sol/$PartnerConfiguration';
import { utils } from 'ethers';
import { $Resolver } from 'typechain-types/contracts-exposed/test-utils/Resolver.sol/$Resolver';
import { $RNS } from 'typechain-types/contracts-exposed/RNS.sol/$RNS';

const SECRET = keccak256(toUtf8Bytes('test'));
const NAME = 'cheta👀aa';
const LABEL = keccak256(toUtf8Bytes(NAME));
const DURATION = 1;
const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
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

  const { contract: RIF } = await deployContract<ERC677>('ERC677', {
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
      feePercentage: 0,
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

  await (await PartnerManager.addPartner(partner.address)).wait();
  await (
    await PartnerManager.setPartnerConfiguration(
      partner.address,
      PartnerConfiguration.address
    )
  ).wait();

  await (await RIF.transfer(partner.address, oneRBTC.mul(10))).wait();

  const partnerRegistrarAsPartner = PartnerRegistrar.connect(partner);

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
    partnerRegistrarAsPartner,
  };
};

describe('New Domain Registration', () => {
  it('Should register a new domain', async () => {
    const {
      NodeOwner,
      RIF,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      Resolver,
      RNS,
      nameOwner,
      FeeManager,
      owner,
      partner,
    } = await loadFixture(initialSetup);
    const registrarAsPartner = PartnerRegistrar.connect(partner);

    await (
      await RIF.connect(partner).approve(
        PartnerRegistrar.address,
        oneRBTC.mul(4)
      )
    ).wait();

    const commitment = await registrarAsPartner.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    await (await registrarAsPartner.commit(commitment)).wait();

    await (
      await registrarAsPartner.register(
        NAME,
        nameOwner.address,
        SECRET,
        DURATION
      )
    ).wait();

    const resolvedName = await Resolver['addr(bytes32)'](
      namehash(NAME + '.rsk')
    );

    expect(resolvedName).to.equal(nameOwner.address);
  });
});
