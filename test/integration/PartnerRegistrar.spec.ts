import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import { deployMockContract, oneRBTC } from '../utils/mock.utils';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import NodeOwnerJson from '../../artifacts/contracts-exposed/NodeOwner.sol/$NodeOwner.json';
import { $RIF } from 'typechain-types/contracts-exposed/RIF.sol/$RIF';
import RIFJson from '../../artifacts/contracts-exposed/RIF.sol/$RIF.json';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager';
import PartnerMangerJson from '../../artifacts/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager.json';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar';
import { expect } from 'chai';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { $IPartnerConfiguration } from 'typechain-types/contracts-exposed/PartnerConfiguration/IPartnerConfiguration.sol/$IPartnerConfiguration';
import IPartnerConfigurationJson from '../../artifacts/contracts-exposed/PartnerConfiguration/IPartnerConfiguration.sol/$IPartnerConfiguration.json';
import { IFeeManager } from '../../typechain-types/contracts/FeeManager/IFeeManager';
import IFeeManagerJson from '../../artifacts/contracts/FeeManager/IFeeManager.sol/IFeeManager.json';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677 } from 'typechain-types/contracts/test-utils';
import { $PartnerConfiguration } from 'typechain-types/contracts-exposed/PartnerConfiguration/PartnerConfiguration.sol/$PartnerConfiguration';
import { $RNS } from 'typechain-types/contracts-exposed/test-utils/RNS.sol/$RNS';
import { utils } from 'ethers';
import { $ResolverV1 } from 'typechain-types/contracts-exposed/test-utils/ResolverV1.sol/$ResolverV1';

const SECRET = keccak256(toUtf8Bytes('test'));
const NAME = 'cheta';
const LABEL = keccak256(toUtf8Bytes(NAME));
const MINLENGTH = 3;
const MAXLENGTH = 7;
const MINCOMMITMENTAGE = 0;
const PRICE = 1;
const EXPIRATIONTIME = 365;
const DURATION = 1;

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const nameOwner = signers[2];
  const rootNode = namehash('tld');
  const rootNodeAsSha3 = utils.id('tld');
  const rootNodeId = ethers.constants.HashZero;

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
      _rootNode: rootNode,
    },
    (await ethers.getContractFactory(
      NodeOwnerAbi.abi,
      NodeOwnerAbi.bytecode
    )) as Factory<$NodeOwner>
  );

  const { contract: Resolver } = await deployContract<$ResolverV1>(
    'ResolverV1',
    {},
    (await ethers.getContractFactory(
      ResolverAbi.abi,
      ResolverAbi.bytecode
    )) as Factory<$ResolverV1>
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
      NodeOwner: NodeOwner.address,
      RIF: RIF.address,
      IPartnerManager: PartnerManager.address,
    });

  const { contract: FeeManager } = await deployContract<IFeeManager>(
    '$FeeManager',
    {
      rif: RIF.address,
      registrar: PartnerRegistrar.address,
      partnerManager: PartnerManager.address,
    }
  );

  await (
    await RNS.setSubnodeOwner(rootNodeId, rootNodeAsSha3, NodeOwner.address)
  ).wait();

  await (await NodeOwner.addRegistrar(PartnerRegistrar.address)).wait();

  await (await NodeOwner.setRootResolver(Resolver.address)).wait();

  console.log('resolver top 👀', Resolver.addr);

  await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();

  await (await PartnerManager.addPartner(partner.address)).wait();
  await (
    await PartnerManager.setPartnerConfiguration(
      partner.address,
      PartnerConfiguration.address
    )
  ).wait();

  await RIF.transfer(partner.address, oneRBTC.mul(10));

  const partnerRegistrarAsPartner = PartnerRegistrar.connect(partner);

  return {
    NodeOwner,
    RIF,
    PartnerManager,
    PartnerRegistrar,
    PartnerConfiguration,
    FeeManager,
    Resolver,
    owner,
    partner,
    nameOwner,
    signers,
    partnerRegistrarAsPartner,
  };
};

describe.only('New Domain Registration', () => {
  it('Should register a new domain', async () => {
    const {
      NodeOwner,
      RIF,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      Resolver,
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

    await expect(
      registrarAsPartner.register(NAME, nameOwner.address, SECRET, DURATION)
    ).to.eventually.be.fulfilled;
    console.log('resolver test 👀', Resolver.addr);
    await expect(Resolver.addr(namehash(NAME + '.tld'))).to.eventually.be
      .fulfilled;
  });

  // it('Should fail if caller is not a valid partner', async () => {
  //   const { PartnerManager, PartnerRegistrar, nameOwner } = await loadFixture(
  //     initialSetup
  //   );

  //   await PartnerManager.mock.isPartner.returns(false);

  //   await expect(
  //     PartnerRegistrar.register('cheta', nameOwner.address, SECRET, DURATION)
  //   ).to.be.revertedWith('Partner Registrar: Not a partner');
  // });

  // it('Should fail if new domain length is less than accepted value', async () => {
  //   const {
  //     PartnerManager,
  //     PartnerRegistrar,
  //     PartnerConfiguration,
  //     nameOwner,
  //   } = await loadFixture(initialSetup);

  //   await PartnerManager.mock.isPartner.returns(true);
  //   await PartnerManager.mock.getPartnerConfiguration.returns(
  //     PartnerConfiguration.address
  //   );
  //   await PartnerConfiguration.mock.getMinLength.returns(MINLENGTH);

  //   await expect(
  //     PartnerRegistrar.register('ch', nameOwner.address, SECRET, DURATION)
  //   ).to.be.revertedWith('Name too short');
  // });

  // it('Should fail if new domain length is more than accepted value', async () => {
  //   const {
  //     PartnerManager,
  //     PartnerRegistrar,
  //     PartnerConfiguration,
  //     nameOwner,
  //   } = await loadFixture(initialSetup);

  //   await PartnerManager.mock.isPartner.returns(true);
  //   await PartnerManager.mock.getPartnerConfiguration.returns(
  //     PartnerConfiguration.address
  //   );
  //   await PartnerConfiguration.mock.getMinLength.returns(MINLENGTH);
  //   await PartnerConfiguration.mock.getMaxLength.returns(MAXLENGTH);

  //   await expect(
  //     PartnerRegistrar.register(
  //       'lordcheta',
  //       nameOwner.address,
  //       SECRET,
  //       DURATION
  //     )
  //   ).to.be.revertedWith('Name too long');
  // });

  // it('Should fail if no commitment is made', async () => {
  //   const {
  //     PartnerManager,
  //     PartnerRegistrar,
  //     PartnerConfiguration,
  //     nameOwner,
  //   } = await loadFixture(initialSetup);

  //   await PartnerManager.mock.isPartner.returns(true);
  //   await PartnerManager.mock.getPartnerConfiguration.returns(
  //     PartnerConfiguration.address
  //   );
  //   await PartnerConfiguration.mock.getMinLength.returns(MINLENGTH);
  //   await PartnerConfiguration.mock.getMaxLength.returns(MAXLENGTH);

  //   await expect(
  //     PartnerRegistrar.register('cheta', nameOwner.address, SECRET, DURATION)
  //   ).to.be.revertedWith('No commitment found');
  // });

  // it('Should fail there is a mismatch in the name used to make a commitment and the name being registered', async () => {
  //   const {
  //     PartnerManager,
  //     PartnerRegistrar,
  //     PartnerConfiguration,
  //     nameOwner,
  //   } = await loadFixture(initialSetup);

  //   await PartnerManager.mock.isPartner.returns(true);
  //   await PartnerManager.mock.getPartnerConfiguration.returns(
  //     PartnerConfiguration.address
  //   );
  //   await PartnerConfiguration.mock.getMinLength.returns(MINLENGTH);
  //   await PartnerConfiguration.mock.getMaxLength.returns(MAXLENGTH);
  //   await PartnerConfiguration.mock.getMinCommittmentAge.returns(
  //     MINCOMMITMENTAGE
  //   );

  //   const commitment = await PartnerRegistrar.makeCommitment(
  //     LABEL,
  //     nameOwner.address,
  //     SECRET
  //   );

  //   const tx = await PartnerRegistrar.commit(commitment);
  //   tx.wait();

  //   await expect(
  //     PartnerRegistrar.register('lcheta', nameOwner.address, SECRET, DURATION)
  //   ).to.be.revertedWith('No commitment found');
  // });
});
