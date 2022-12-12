import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployMockContract, deployContract } from './utils/mock.utils';
import {
  FeeManager__factory,
  NodeOwner as NodeOwnerType,
  PartnerConfiguration__factory,
  PartnerManager__factory,
  PartnerRegistrarProxyFactory__factory,
  PartnerRegistrar__factory,
  PartnerRenewer__factory,
} from 'typechain-types';
import { RIF as RIFType } from 'typechain-types';
import NodeOwnerJson from '../artifacts/contracts/NodeOwner.sol/NodeOwner.json';
import RIFJson from '../artifacts/contracts/RIF.sol/RIF.json';
import { RNS as RNSType } from 'typechain-types';
import RNSJson from '../artifacts/contracts/RNS.sol/RNS.json';
import ResolverJson from '../artifacts/contracts/test-utils/Resolver.sol/Resolver.json';
import { Resolver as ResolverType } from 'typechain-types';
import { expect } from 'chai';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';

const SECRET = keccak256(
  toUtf8Bytes('test')
);
const LABEL = keccak256(
  toUtf8Bytes('cheta')
);
const MIN_LENGTH = 3;
const MAX_LENGTH = 7;
const MIN_COMMITMENT_AGE = 1;
const ROOT_NODE = namehash('rsk');
const MAX_DURATION = 0;
const FEE_PERCENTAGE = 10;
const DISCOUNT = 0;
const MIN_DURATION = 1;
const IS_UNICODE_SUPPORTED = true;
const DUMMY_COMMITMENT = keccak256(
  toUtf8Bytes('this is a dummy')
);
const DURATION = 2;

async function initialSetup() {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner1 = signers[1];
  const partner2 = signers[2];
  const nameOwner = signers[3];
  const pool = signers[4];

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
  await PartnerRenewer.setFeeManager(FeeManager.address);

  const PartnerRegistrarProxyFactory =
    await deployContract<PartnerRegistrarProxyFactory__factory>(
      'PartnerRegistrarProxyFactory',
      [RIF.address, PartnerRegistrar.address, PartnerRenewer.address]
    );

  RNS.resolver.returns(Resolver.address);

  Resolver.setAddr.returns();

  NodeOwner.reclaim.returns();
  NodeOwner.transferFrom.returns();

  return {
    PartnerProxy: await ethers.getContractFactory('PartnerRegistrarProxy'),
    PartnerRegistrarProxyFactory,
    NodeOwner,
    RIF,
    PartnerConfiguration,
    FeeManager,
    PartnerManager,
    PartnerRegistrar,
    owner,
    partner1,
    partner2,
    nameOwner,
    signers,
  };
}
describe('Deploy PartnerRegistrarProxyFactory, Create New Proxy Instances, Use new Partner Proxies', () => {
  it('should successfully create new partner proxies', async () => {
    const { PartnerRegistrarProxyFactory, partner1, partner2 } =
      await loadFixture(initialSetup);

    await (
      await PartnerRegistrarProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne'
      )
    ).wait();

    const partnerOneStruct = await PartnerRegistrarProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    await (
      await PartnerRegistrarProxyFactory.createNewPartnerProxy(
        partner2.address,
        'PartnerTwo'
      )
    ).wait();

    const partnerTwoStruct = await PartnerRegistrarProxyFactory.getPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );

    expect([partnerOneStruct.name, partnerTwoStruct.name]).to.deep.equal([
      'PartnerOne',
      'PartnerTwo',
    ]);
  });

  it('should successfully identify the owner of each proxy', async () => {
    const { PartnerProxy, PartnerRegistrarProxyFactory, partner1, partner2 } =
      await loadFixture(initialSetup);

    await (
      await PartnerRegistrarProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne'
      )
    ).wait();

    const partnerOneStruct = await PartnerRegistrarProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    await (
      await PartnerRegistrarProxyFactory.createNewPartnerProxy(
        partner2.address,
        'PartnerTwo'
      )
    ).wait();

    const partnerTwoStruct = await PartnerRegistrarProxyFactory.getPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );

    const partnerOneOwner = PartnerProxy.attach(partnerOneStruct.proxy);
    const partnerTwoOwner = PartnerProxy.attach(partnerTwoStruct.proxy);

    expect([
      await partnerOneOwner.owner(),
      await partnerTwoOwner.owner(),
    ]).to.deep.equal([partner1.address, partner2.address]);
  });

  it('should successfully register a new domain for a partner with their corresponding proxy', async () => {
    const {
      PartnerProxy,
      PartnerRegistrarProxyFactory,
      PartnerManager,
      NodeOwner,
      partner1,
      nameOwner,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    await (
      await PartnerRegistrarProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne'
      )
    ).wait();

    const partnerOneProxyStruct =
      await PartnerRegistrarProxyFactory.getPartnerProxy(
        partner1.address,
        'PartnerOne'
      );

    const partnerRegistrarProxy = PartnerProxy.attach(
      partnerOneProxyStruct.proxy
    );

    await (
      await PartnerManager.addPartner(
        partnerRegistrarProxy.address,
        partner1.address
      )
    ).wait();

    await (
      await PartnerManager.setPartnerConfiguration(
        partnerRegistrarProxy.address,
        PartnerConfiguration.address
      )
    ).wait();

    try {
      const commitment = await partnerRegistrarProxy.makeCommitment(
        LABEL,
        nameOwner.address,
        SECRET
      );

      const tx = await partnerRegistrarProxy
        .connect(partner1)
        .commit(commitment);
      tx.wait();

      await expect(
        partnerRegistrarProxy
          .connect(partner1)
          .register(
            'cheta',
            nameOwner.address,
            SECRET,
            DURATION,
            NodeOwner.address
          )
      ).to.eventually.be.fulfilled;
    } catch (error) {
      console.log(error);

      throw error;
    }
  });

  it('Should not be reverted if partner minCommitmentAge is not 0 (i.e partner config does not allow one step purchase', async () => {
    const {
      PartnerProxy,
      PartnerRegistrarProxyFactory,
      PartnerConfiguration,
      PartnerManager,
      partner1,
    } = await loadFixture(initialSetup);

    const partnerOneProxy =
      await PartnerRegistrarProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne'
      );
    await partnerOneProxy.wait();
    const result1 = await PartnerRegistrarProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerOneOwner = PartnerProxy.attach(result1.proxy);

    PartnerManager.isPartner.returns(true);

    PartnerConfiguration.getMinCommitmentAge.returns(1);

    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    expect(partnerOneOwner.commit(DUMMY_COMMITMENT)).to.be.eventually.fulfilled;
  });
});
