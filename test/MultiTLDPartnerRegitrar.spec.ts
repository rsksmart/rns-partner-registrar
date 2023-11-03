import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployMockContract, deployContract } from './utils/mock.utils';
import {
  FeeManager__factory,
  MultiTLDPartnerRegistrar__factory,
  NodeOwner as NodeOwnerType,
  PartnerConfiguration__factory,
  PartnerManager__factory,
  PartnerRenewer__factory,
  RegistrarAccessControl__factory,
} from 'typechain-types';
import NodeOwnerJson from '../artifacts/contracts/NodeOwner.sol/NodeOwner.json';
import ResolverJson from '../artifacts/contracts/test-utils/Resolver.sol/Resolver.json';
import { RNS as RNSType } from 'typechain-types';
import { RIF as RIFType } from 'typechain-types';
import RNSJson from '../artifacts/contracts/RNS.sol/RNS.json';
import RIFJson from '../artifacts/contracts/RIF.sol/RIF.json';
import { expect } from 'chai';
import { Resolver as ResolverType } from 'typechain-types';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import {
  DEFAULT_MIN_LENGTH,
  DEFAULT_MAX_LENGTH,
  DEFAULT_MIN_DURATION,
  DEFAULT_MAX_DURATION,
  DEFAULT_DISCOUNT,
  DEFAULT_FEE_PERCENTAGE,
} from './utils/constants.utils';

const SECRET = keccak256(toUtf8Bytes('test'));
const LABEL = keccak256(toUtf8Bytes('cheta'));
const DURATION = 1;
// const ROOT_NODE = namehash('rsk');
const MIN_COMMITMENT_AGE = 1;
// const DUMMY_COMMITMENT = keccak256(toUtf8Bytes('this is a dummy'));
const TLD_RSK = namehash('rsk');
const TLD_SOVRYN = namehash('sovryn');

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
  const rskOwner = signers[7];
  const sovrynOwner = signers[8];

  const Resolver = await deployMockContract<ResolverType>(ResolverJson.abi);
  Resolver.setAddr.returns();

  const NodeOwner = await deployMockContract<NodeOwnerType>(NodeOwnerJson.abi);
  NodeOwner.reclaim.returns();
  NodeOwner.transferFrom.returns();

  const RNS = await deployMockContract<RNSType>(RNSJson.abi);
  RNS.resolver.returns(Resolver.address);
  RNS.owner.returns(NodeOwner.address);

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

  const MultiTLDPartnerRegistrar =
    await deployContract<MultiTLDPartnerRegistrar__factory>(
      'MultiTLDPartnerRegistrar',
      [accessControl.address, RIF.address, PartnerManager.address, RNS.address]
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
    PartnerManager.address,
    RNS.address,
    accessControl.address,
  ]);

  await MultiTLDPartnerRegistrar.setFeeManager(FeeManager.address);

  await (
    await PartnerManager.addPartner(partner.address, partnerOwner.address)
  ).wait();

  await (
    await PartnerManager.setPartnerConfiguration(
      partner.address,
      PartnerConfiguration.address
    )
  ).wait();

  return {
    RNS,
    NodeOwner,
    RIF,
    PartnerManager,
    MultiTLDPartnerRegistrar,
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
    rskOwner,
    sovrynOwner,
  };
};

describe('Multiple TLD registration', () => {
  it('Should register a new domain when min commitment age is not 0', async () => {
    const { nameOwner, NodeOwner, MultiTLDPartnerRegistrar, partner } =
      await loadFixture(initialSetup);

    const commitment = await MultiTLDPartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET,
      DURATION,
      NodeOwner.address,
      TLD_RSK
    );

    const tx = await MultiTLDPartnerRegistrar.commit(
      commitment,
      partner.address
    );
    tx.wait();

    await time.increase(MIN_COMMITMENT_AGE);

    try {
      await expect(
        MultiTLDPartnerRegistrar.register(
          'cheta',
          nameOwner.address,
          SECRET,
          DURATION,
          NodeOwner.address,
          partner.address,
          TLD_RSK
        )
      ).to.eventually.be.fulfilled;
    } catch (error) {
      throw error;
    }
  });

  it('Should register a domain name for two different tlds', async () => {
    const { nameOwner, NodeOwner, MultiTLDPartnerRegistrar, partner } =
      await loadFixture(initialSetup);

    const commitment = await MultiTLDPartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET,
      DURATION,
      NodeOwner.address,
      TLD_RSK
    );

    const tx = await MultiTLDPartnerRegistrar.commit(
      commitment,
      partner.address
    );
    tx.wait();

    await time.increase(MIN_COMMITMENT_AGE);

    try {
      await expect(
        MultiTLDPartnerRegistrar.register(
          'cheta',
          nameOwner.address,
          SECRET,
          DURATION,
          NodeOwner.address,
          partner.address,
          TLD_RSK
        )
      ).to.eventually.be.fulfilled;
    } catch (error) {
      throw error;
    }

    const commitmentSovryn = await MultiTLDPartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET,
      DURATION,
      NodeOwner.address,
      TLD_SOVRYN
    );

    const txSovryn = await MultiTLDPartnerRegistrar.commit(
      commitmentSovryn,
      partner.address
    );
    txSovryn.wait();

    await time.increase(MIN_COMMITMENT_AGE);

    try {
      await expect(
        MultiTLDPartnerRegistrar.register(
          'cheta',
          nameOwner.address,
          SECRET,
          DURATION,
          NodeOwner.address,
          partner.address,
          TLD_SOVRYN
        )
      ).to.eventually.be.fulfilled;
    } catch (error) {
      throw error;
    }
  });

  it(
    'Should fail if a domain name has already been registered for two different tlds'
  );
});
