import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { deployMockContract, deployContract } from './utils/mock.utils';
import NodeOwnerJson from '../artifacts/contracts/NodeOwner.sol/NodeOwner.json';
import RIFJson from '../artifacts/contracts/RIF.sol/RIF.json';
import RNSJson from '../artifacts/contracts/RNS.sol/RNS.json';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import {
  RNS,
  RIF,
  NodeOwner,
  PartnerConfiguration__factory,
  FeeManager__factory,
  PartnerRegistrar__factory,
  PartnerRenewer__factory,
  PartnerManager__factory,
  PartnerRenewerProxyFactory__factory,
} from '../typechain-types';

keccak256(toUtf8Bytes('test'));
keccak256(toUtf8Bytes('cheta'));
const MIN_LENGTH = 3;
const MAX_LENGTH = 0;
const MIN_COMMITMENT_AGE = 1;
const DURATION = 1;
const ROOT_NODE = namehash('rsk');
const MAX_DURATION = 0;
const FEE_PERCENTAGE = 10;
const DISCOUNT = 0;
const MIN_DURATION = 1;
const IS_UNICODE_SUPPORTED = true;

async function initialSetup() {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner1 = signers[1];
  const partner2 = signers[2];
  const nameOwner = signers[3];
  const pool = signers[4];

  const RNS = await deployMockContract<RNS>(RNSJson.abi);

  const NodeOwner = await deployMockContract<NodeOwner>(NodeOwnerJson.abi);

  const RIF = await deployMockContract<RIF>(RIFJson.abi);
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

  const PartnerRenewerProxyFactory =
    await deployContract<PartnerRenewerProxyFactory__factory>(
      'PartnerRenewerProxyFactory',
      [RIF.address, PartnerRegistrar.address, PartnerRenewer.address]
    );

  return {
    MasterRenewerProxy: await ethers.getContractFactory('PartnerRenewerProxy'),
    PartnerRenewerProxyFactory,
    NodeOwner,
    RIF,
    PartnerConfiguration,
    PartnerManager,
    PartnerRegistrar,
    PartnerRenewer,
    owner,
    partner1,
    partner2,
    nameOwner,
    signers,
  };
}
describe('Deploy PartnerProxyFactory, Create New Proxy Instances, Use new Partner Proxies', () => {
  it('should successfully create new partner proxies', async () => {
    const { PartnerRenewerProxyFactory, partner1, partner2 } =
      await loadFixture(initialSetup);

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne'
      )
    ).wait();

    const partnerOneProxyStruct =
      await PartnerRenewerProxyFactory.getPartnerProxy(
        partner1.address,
        'PartnerOne'
      );

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner2.address,
        'PartnerTwo'
      )
    ).wait();

    const partnerTwoProxyStruct =
      await PartnerRenewerProxyFactory.getPartnerProxy(
        partner2.address,
        'PartnerTwo'
      );

    expect([
      partnerOneProxyStruct.name,
      partnerTwoProxyStruct.name,
    ]).to.deep.equal(['PartnerOne', 'PartnerTwo']);
  });

  it('should successfully identify the owner of each proxy', async () => {
    const {
      MasterRenewerProxy,
      PartnerRenewerProxyFactory,
      partner1,
      partner2,
    } = await loadFixture(initialSetup);

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne'
      )
    ).wait();

    const partnerOneProxyStruct =
      await PartnerRenewerProxyFactory.getPartnerProxy(
        partner1.address,
        'PartnerOne'
      );

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner2.address,
        'PartnerTwo'
      )
    ).wait();

    const partnerTwoProxyStruct =
      await PartnerRenewerProxyFactory.getPartnerProxy(
        partner2.address,
        'PartnerTwo'
      );

    const partnerOneOwner = MasterRenewerProxy.attach(
      partnerOneProxyStruct.proxy
    );
    const partnerTwoOwner = MasterRenewerProxy.attach(
      partnerTwoProxyStruct.proxy
    );

    expect([
      await partnerOneOwner.owner(),
      await partnerTwoOwner.owner(),
    ]).to.deep.equal([partner1.address, partner2.address]);
  });

  it('should successfully renew a domain for a partner with their corresponding proxy', async () => {
    const {
      MasterRenewerProxy,
      PartnerRenewerProxyFactory,
      PartnerConfiguration,
      PartnerManager,
      partner1,
    } = await loadFixture(initialSetup);

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne'
      )
    ).wait();

    const partnerOneProxyStruct =
      await PartnerRenewerProxyFactory.getPartnerProxy(
        partner1.address,
        'PartnerOne'
      );

    const partnerRenewerProxy = MasterRenewerProxy.attach(
      partnerOneProxyStruct.proxy
    );

    await (
      await PartnerManager.addPartner(
        partnerRenewerProxy.address,
        partner1.address
      )
    ).wait();
    await (
      await PartnerManager.setPartnerConfiguration(
        partnerRenewerProxy.address,
        PartnerConfiguration.address
      )
    ).wait();

    try {
      await expect(partnerRenewerProxy.renew('cheta', DURATION)).to.be
        .fulfilled;
    } catch (error) {
      console.log(error);
      throw error;
    }
  });
});
