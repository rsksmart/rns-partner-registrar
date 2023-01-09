import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployMockContract, deployContract } from './utils/mock.utils';
import {
  FeeManager__factory,
  NodeOwner as NodeOwnerType,
  PartnerConfiguration__factory,
  PartnerManager__factory,
  PartnerRegistrar__factory,
  PartnerRenewer__factory,
} from 'typechain-types';
import NodeOwnerJson from '../artifacts/contracts/NodeOwner.sol/NodeOwner.json';
import RNSJson from '../artifacts/contracts/RNS.sol/RNS.json';
import ResolverJson from '../artifacts/contracts/test-utils/Resolver.sol/Resolver.json';
import { RIF as RIFType } from 'typechain-types';
import RIFJson from '../artifacts/contracts/RIF.sol/RIF.json';
import { expect } from 'chai';
import { RNS as RNSType } from 'typechain-types';
import { Resolver as ResolverType } from 'typechain-types';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { duration } from '@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time';
import { BigNumber } from 'ethers';

const SECRET = keccak256(toUtf8Bytes('test'));

const LABEL = keccak256(toUtf8Bytes('cheta'));
const MIN_LENGTH = 3;
const MAX_LENGTH = 7;
const DURATION = 1;
const ROOT_NODE = namehash('rsk');
const FEE_PERCENTAGE = 10;
const DISCOUNT = 0;
const MIN_DURATION = 1;
const IS_UNICODE_SUPPORTED = true;
const MIN_COMMITMENT_AGE = 1;
const MAX_DURATION = 2;
const DUMMY_COMMITMENT = keccak256(toUtf8Bytes('this is a dummy'));

const NAME_REGISTERED_EVENT = 'NameRegistered';
const FEE_MANAGER_CHANGED_EVENT = 'FeeManagerChanged';

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const nameOwner = signers[2];
  const pool = signers[3];
  const partnerOwner = signers[4];
  const alternateFeeManager = signers[5];

  const Resolver = await deployMockContract<ResolverType>(ResolverJson.abi);
  Resolver.setAddr.returns();

  const RNS = await deployMockContract<RNSType>(RNSJson.abi);
  RNS.resolver.returns(Resolver.address);

  const NodeOwner = await deployMockContract<NodeOwnerType>(NodeOwnerJson.abi);
  NodeOwner.reclaim.returns();
  NodeOwner.transferFrom.returns();

  const RIF = await deployMockContract<RIFType>(RIFJson.abi);
  RIF.transferFrom.returns(true);
  RIF.transfer.returns(true);
  RIF.approve.returns(true);

  const PartnerConfiguration =
    await deployContract<PartnerConfiguration__factory>(
      'PartnerConfiguration',
      [
        MIN_LENGTH,
        MAX_LENGTH,
        IS_UNICODE_SUPPORTED,
        MIN_DURATION,
        MAX_DURATION,
        FEE_PERCENTAGE,
        DISCOUNT,
        MIN_COMMITMENT_AGE,
      ]
    );

  const PartnerManager = await deployContract<PartnerManager__factory>(
    'PartnerManager',
    []
  );

  const PartnerRegistrar = await deployContract<PartnerRegistrar__factory>(
    'PartnerRegistrar',
    [
      NodeOwner.address,
      RIF.address,
      PartnerManager.address,
      RNS.address,
      ROOT_NODE,
    ]
  );

  const PartnerRenewer = await deployContract<PartnerRenewer__factory>(
    'PartnerRenewer',
    [NodeOwner.address, RIF.address, PartnerManager.address]
  );

  const FeeManager = await deployContract<FeeManager__factory>('FeeManager', [
    RIF.address,
    PartnerRegistrar.address,
    PartnerRenewer.address,
    PartnerManager.address,
    pool.address,
  ]);

  await PartnerRegistrar.setFeeManager(FeeManager.address);

  return {
    RNS,
    NodeOwner,
    RIF,
    PartnerManager,
    PartnerRegistrar,
    PartnerConfiguration,
    FeeManager,
    owner,
    partner,
    nameOwner,
    partnerOwner,
    alternateFeeManager,
  };
};

describe('New Domain Registration', () => {
  it('Should register a new domain when min commitment age is not 0', async () => {
    const {
      NodeOwner,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      partner,
      partnerOwner,
    } = await loadFixture(initialSetup);

    await (
      await PartnerManager.addPartner(partner.address, partnerOwner.address)
    ).wait();

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        PartnerConfiguration.address
      )
    ).wait();

    const commitment = await PartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    const tx = await PartnerRegistrar.commit(commitment, partner.address);
    tx.wait();
    try {
      await expect(
        PartnerRegistrar.register(
          'cheta',
          nameOwner.address,
          SECRET,
          DURATION,
          NodeOwner.address,
          partner.address
        )
      ).to.eventually.be.fulfilled;
    } catch (error) {
      console.log(error);
      throw error;
    }
  });

  it('Should register a new domain when min commitment age is 0 and no commitment is made', async () => {
    const {
      NodeOwner,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      partner,
      partnerOwner,
    } = await loadFixture(initialSetup);

    await (
      await PartnerManager.addPartner(partner.address, partnerOwner.address)
    ).wait();

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        PartnerConfiguration.address
      )
    ).wait();

    (await PartnerConfiguration.setMinCommitmentAge(0)).wait();

    await expect(
      PartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    ).to.be.fulfilled;
  });

  it('Should fail if caller is not a valid partner', async () => {
    const { PartnerManager, PartnerRegistrar, nameOwner, NodeOwner, partner } =
      await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(false);

    await expect(
      PartnerRegistrar.register(
        'cheta👀',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    ).to.be.revertedWith('Partner Registrar: Not a partner');
  });

  it('Should fail if new domain length is less than accepted value', async () => {
    const {
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      NodeOwner,
      partner,
    } = await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(true);
    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );
    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);

    await expect(
      PartnerRegistrar.register(
        'ch',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidName');
  });

  it('Should fail if new domain length is more than accepted value', async () => {
    const {
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      NodeOwner,
      partner,
    } = await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(true);
    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );
    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);
    PartnerConfiguration.getMaxLength.returns(MAX_LENGTH);

    await expect(
      PartnerRegistrar.register(
        'lordcheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidName');
  });

  it('Should fail if no commitment is made and minCommitmentAge is not 0', async () => {
    const {
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      NodeOwner,
      partner,
    } = await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(true);
    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );
    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);
    PartnerConfiguration.getMaxLength.returns(MAX_LENGTH);
    PartnerConfiguration.getMinCommitmentAge.returns(ethers.BigNumber.from(1));

    await expect(
      PartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    ).to.be.revertedWith('No commitment found');
  });

  it('Should fail there is a mismatch in the name used to make a commitment and the name being registered', async () => {
    const {
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      NodeOwner,
      partner,
    } = await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(true);
    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );
    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);
    PartnerConfiguration.getMaxLength.returns(MAX_LENGTH);
    PartnerConfiguration.getMinCommitmentAge.returns(ethers.BigNumber.from(1));

    const commitment = await PartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    const tx = await PartnerRegistrar.commit(commitment, partner.address);
    tx.wait();

    await expect(
      PartnerRegistrar.register(
        'lcheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    ).to.be.revertedWith('No commitment found');
  });
});

describe('Registrar Checks', () => {
  it('Should revert on commit if partner minCommitmentAge is 0 (i.e partner config allows one step purchase)', async () => {
    const {
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      partner,
      partnerOwner,
    } = await loadFixture(initialSetup);

    await (
      await PartnerManager.addPartner(partner.address, partnerOwner.address)
    ).wait();

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        PartnerConfiguration.address
      )
    ).wait();

    (await PartnerConfiguration.setMinCommitmentAge(0)).wait();

    PartnerConfiguration.getMinCommitmentAge.returns(0);

    try {
      await expect(
        PartnerRegistrar.commit(DUMMY_COMMITMENT, partner.address)
      ).to.be.revertedWith('Commitment not required');
    } catch (error) {
      console.log(error);

      throw error;
    }
  });

  it('Should revert is the fee manager to be set is same as existing', async () => {
    const { FeeManager, PartnerRegistrar } = await loadFixture(initialSetup);

    await expect(
      PartnerRegistrar.setFeeManager(FeeManager.address)
    ).to.be.revertedWith(
      'PartnerRegistrar: update param is same as param to be updated'
    );
  });
});
describe('Registrar events', () => {
  it('Should emit the NameRegistered event on successful domain registration', async () => {
    const {
      NodeOwner,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      partner,
      partnerOwner,
    } = await loadFixture(initialSetup);

    await (
      await PartnerManager.addPartner(partner.address, partnerOwner.address)
    ).wait();

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        PartnerConfiguration.address
      )
    ).wait();

    (await PartnerConfiguration.setMinCommitmentAge(0)).wait();

    await expect(
      PartnerRegistrar.connect(partnerOwner).register(
        'cheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    )
      .to.emit(PartnerRegistrar, NAME_REGISTERED_EVENT)
      .withArgs(partnerOwner.address, duration.years);
  });

  it('Should emit the FeeManagerSet event on successful setting of the fee manager contract', async () => {
    const { FeeManager, PartnerRegistrar, alternateFeeManager } =
      await loadFixture(initialSetup);

    await expect(PartnerRegistrar.setFeeManager(alternateFeeManager.address))
      .to.emit(PartnerRegistrar, FEE_MANAGER_CHANGED_EVENT)
      .withArgs(PartnerRegistrar.address, alternateFeeManager.address);
  });
});
