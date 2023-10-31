import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  deployMockContract,
  deployContract,
  //   oneRBTC,
} from './utils/mock.utils';
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
import { RIF as RIFType } from 'typechain-types';
import RIFJson from '../artifacts/contracts/RIF.sol/RIF.json';
import { expect } from 'chai';
import { Resolver as ResolverType } from 'typechain-types';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
// import { duration } from '@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time';
import {
  DEFAULT_MIN_LENGTH,
  DEFAULT_MAX_LENGTH,
  DEFAULT_MIN_DURATION,
  DEFAULT_MAX_DURATION,
  DEFAULT_DISCOUNT,
  DEFAULT_FEE_PERCENTAGE,
  //   UN_NECESSARY_MODIFICATION_ERROR_MSG,
  //   FEE_MANAGER_CHANGED_EVENT,
  //   NAME_REGISTERED_EVENT,
  //   ONLY_HIGH_LEVEL_OPERATOR_ERR,
  //   NOT_A_PARTNER_ERR,
  //   NO_COMMITMENT_FOUND_ERR,
  //   COMMITMENT_NOT_REQUIRED_ERR,
} from './utils/constants.utils';
import { RNS } from 'typechain-types';
import RNSAbi from '../external-abis/RNS.json';

const SECRET = keccak256(toUtf8Bytes('test'));

const LABEL = keccak256(toUtf8Bytes('cheta'));
const DURATION = 1;
// const ROOT_NODE = namehash('rsk');
const MIN_COMMITMENT_AGE = 1;
// const DUMMY_COMMITMENT = keccak256(toUtf8Bytes('this is a dummy'));
const TLD_RSK = namehash('rsk');
const TLD_SOVRYN = 'SOVRYN';

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

  // const RNS = await deployMockContract<RNSType>(RNSJson.abi);
  // RNS.resolver.returns(Resolver.address);
  // RNS.owner.returns(rskOwner.address);

  //   const RNS = await deployContract<RNS__factory>('RNS');
  const { contract: RNS } = await deployContract<RNS>(
    'RNS',
    {},
    (await ethers.getContractFactory(
      RNSAbi.abi,
      RNSAbi.bytecode
    )) as Factory<RNS>
  );

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
    MultiTLDPartnerRegistrar.address,
    PartnerRenewer.address,
    PartnerManager.address,
    pool.address,
  ]);

  await MultiTLDPartnerRegistrar.setFeeManager(FeeManager.address);

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

describe.only('Multiple TLD registration', () => {
  it('Should register a new domain when min commitment age is not 0', async () => {
    const {
      NodeOwner,
      PartnerManager,
      MultiTLDPartnerRegistrar,
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

    const commitment = await MultiTLDPartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET,
      DURATION,
      NodeOwner.address,
      TLD_RSK
    );

    console.log('182 commitment: ', commitment);

    const tx = await MultiTLDPartnerRegistrar.connect(nameOwner).commit(
      commitment,
      partner.address
    );
    tx.wait();

    console.log('190');
    await time.increase(MIN_COMMITMENT_AGE + 10);

    try {
      await expect(
        MultiTLDPartnerRegistrar.connect(nameOwner).register(
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
});
