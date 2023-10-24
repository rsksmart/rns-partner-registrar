import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import {
  deployMockContract,
  deployContract,
  oneRBTC,
} from './utils/mock.utils';
import {
  FeeManager__factory,
  NodeOwner as NodeOwnerType,
  PartnerConfiguration__factory,
  PartnerManager__factory,
  PartnerRegistrar__factory,
  PartnerRenewer__factory,
  RegistrarAccessControl__factory,
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
import {
  DEFAULT_MIN_LENGTH,
  DEFAULT_MAX_LENGTH,
  DEFAULT_MIN_DURATION,
  DEFAULT_MAX_DURATION,
  DEFAULT_DISCOUNT,
  DEFAULT_FEE_PERCENTAGE,
  PARTNER_MANAGER_CHANGED_EVENT,
  ONLY_HIGH_LEVEL_OPERATOR_ERR,
  FEE_MANAGER_CHANGED_EVENT,
} from './utils/constants.utils';
import { OneYearDuration } from './integration/utils/constants';

const SECRET = keccak256(toUtf8Bytes('test'));

const LABEL = keccak256(toUtf8Bytes('cheta'));
const DURATION = 1;
const ROOT_NODE = namehash('rsk');
const MIN_COMMITMENT_AGE = 1;
keccak256(toUtf8Bytes('this is a dummy'));
const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const nameOwner = signers[2];
  const pool = signers[3];
  const partnerOwner = signers[4];
  const alternateFeeManager = signers[5];
  const attacker = signers[5];
  const highLevelOperator = signers[6];
  const newPartnerManager = signers[7];

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

  const accessControl = await deployContract<RegistrarAccessControl__factory>(
    'RegistrarAccessControl',
    []
  );

  const PartnerConfiguration =
    await deployContract<PartnerConfiguration__factory>(
      'PartnerConfiguration',
      [
        accessControl.address,
        DEFAULT_MIN_LENGTH,
        DEFAULT_MAX_LENGTH,
        DEFAULT_MIN_DURATION,
        DEFAULT_MAX_DURATION,
        DEFAULT_FEE_PERCENTAGE,
        DEFAULT_DISCOUNT,
        MIN_COMMITMENT_AGE,
      ]
    );

  const PartnerManager = await deployContract<PartnerManager__factory>(
    'PartnerManager',
    [accessControl.address]
  );

  const PartnerRegistrar = await deployContract<PartnerRegistrar__factory>(
    'PartnerRegistrar',
    [
      accessControl.address,
      NodeOwner.address,
      RIF.address,
      PartnerManager.address,
      RNS.address,
      ROOT_NODE,
    ]
  );

  const PartnerRenewer = await deployContract<PartnerRenewer__factory>(
    'PartnerRenewer',
    [
      accessControl.address,
      NodeOwner.address,
      RIF.address,
      PartnerManager.address,
    ]
  );

  const FeeManager = await deployContract<FeeManager__factory>('FeeManager', [
    RIF.address,
    PartnerRegistrar.address,
    PartnerRenewer.address,
    PartnerManager.address,
    pool.address,
  ]);

  await PartnerRegistrar.setFeeManager(FeeManager.address);
  await PartnerRenewer.setFeeManager(FeeManager.address);

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
    attacker,
    highLevelOperator,
    accessControl,
    PartnerRenewer,
    newPartnerManager,
  };
};

describe('Price,', () => {
  it('should return the price', async () => {
    const {
      PartnerRenewer,
      partner,
      PartnerManager,
      partnerOwner,
      PartnerConfiguration,
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

    const price = await PartnerRenewer.price(
      LABEL,
      OneYearDuration,
      partner.address
    );
    expect(price).to.be.equal(oneRBTC.mul(2));
  });

  describe('Partner Manager', () => {
    it('Should return the partner manager', async () => {
      const { PartnerRenewer, PartnerManager } = await loadFixture(
        initialSetup
      );

      expect(await PartnerRenewer.getPartnerManager()).to.be.equal(
        PartnerManager.address
      );
    });

    it('Should successfully modify partner manager address', async () => {
      const { PartnerRenewer, newPartnerManager } = await loadFixture(
        initialSetup
      );

      await (
        await PartnerRenewer.setPartnerManager(newPartnerManager.address)
      ).wait();

      expect(await PartnerRenewer.getPartnerManager()).to.be.equal(
        newPartnerManager.address
      );
    });

    it('Should emit PartnerManagerChanged when successfully changing partner manager address', async () => {
      const { PartnerRenewer, newPartnerManager, owner } = await loadFixture(
        initialSetup
      );

      await expect(PartnerRenewer.setPartnerManager(newPartnerManager.address))
        .to.emit(PartnerRenewer, PARTNER_MANAGER_CHANGED_EVENT)
        .withArgs(owner.address, newPartnerManager.address);
    });

    it('Should not allow non HighLevel Operator to modify partner manager address', async () => {
      const { PartnerRenewer, attacker, newPartnerManager, accessControl } =
        await loadFixture(initialSetup);

      expect(
        PartnerRenewer.connect(attacker).setPartnerManager(
          newPartnerManager.address
        )
      ).to.be.revertedWithCustomError(
        PartnerRenewer,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );
    });

    it('Should revert if new partner manager address is the same', async () => {
      const { PartnerRenewer } = await loadFixture(initialSetup);

      const oldPartnerManager = await PartnerRenewer.getPartnerManager();

      expect(
        PartnerRenewer.setPartnerManager(oldPartnerManager)
      ).to.be.revertedWith('old value is same as new value');
    });
  });

  describe('Fee Manager', () => {
    it('Should return the partner manager', async () => {
      const { PartnerRenewer, FeeManager } = await loadFixture(initialSetup);

      expect(await PartnerRenewer.getFeeManager()).to.be.equal(
        FeeManager.address
      );
    });

    it('Should successfully modify fee manager address', async () => {
      const { PartnerRenewer, alternateFeeManager } = await loadFixture(
        initialSetup
      );

      await (
        await PartnerRenewer.setFeeManager(alternateFeeManager.address)
      ).wait();

      expect(await PartnerRenewer.getFeeManager()).to.be.equal(
        alternateFeeManager.address
      );
    });

    it('Should emit FeeManagerChanged when successfully changing fee manager address', async () => {
      const { PartnerRenewer, alternateFeeManager, owner } = await loadFixture(
        initialSetup
      );

      await expect(PartnerRenewer.setFeeManager(alternateFeeManager.address))
        .to.emit(PartnerRenewer, FEE_MANAGER_CHANGED_EVENT)
        .withArgs(PartnerRenewer.address, alternateFeeManager.address);
    });

    it('Should not allow non HighLevel Operator to modify fee manager address', async () => {
      const { PartnerRenewer, attacker, alternateFeeManager } =
        await loadFixture(initialSetup);

      expect(
        PartnerRenewer.connect(attacker).setFeeManager(
          alternateFeeManager.address
        )
      ).to.be.revertedWithCustomError(
        PartnerRenewer,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );
    });

    it('Should revert if new fee manager address is the same', async () => {
      const { PartnerRenewer } = await loadFixture(initialSetup);

      const oldPartnerManager = await PartnerRenewer.getFeeManager();

      expect(
        PartnerRenewer.setFeeManager(oldPartnerManager)
      ).to.be.revertedWith('old value is same as new value');
    });
  });
});
