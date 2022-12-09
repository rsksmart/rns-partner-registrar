import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { deployContract } from 'utils/deployment.utils';
import NodeOwnerJson from '../artifacts/contracts/NodeOwner.sol/NodeOwner.json';
import RIFJson from '../artifacts/contracts/RIF.sol/RIF.json';
import RNSJson from '../artifacts/contracts/RNS.sol/RNS.json';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { smock } from '@defi-wonderland/smock';
import {
  RNS,
  RIF,
  NodeOwner,
  PartnerRegistrar,
  PartnerRenewerProxyFactory,
  PartnerRenewer,
  PartnerConfiguration__factory,
  FeeManager__factory,
  PartnerRegistrar__factory,
  PartnerRenewer__factory,
  PartnerManager__factory,
  PartnerRenewerProxy__factory,
} from '../typechain-types';
import { BigNumber } from 'ethers';
keccak256(toUtf8Bytes('test'));
keccak256(toUtf8Bytes('cheta'));
const MIN_LENGTH = 3;
const MAX_LENGTH = 0;
const MIN_COMMITMENT_AGE = 1;
// const EXPIRATION_TIME = 365;
const DURATION = 1;
const ROOT_NODE = namehash('rsk');
// const SECRET = keccak256(toUtf8Bytes('this is a dummy'));
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

  const RNS = await smock.fake<RNS>(RNSJson.abi);

  const NodeOwner = await smock.fake<NodeOwner>(NodeOwnerJson.abi);

  const RIF = await smock.fake<RIF>(RIFJson.abi);
  await RIF.transferFrom.returns(true);
  await RIF.transfer.returns(true);
  await RIF.approve.returns(true);

  const PartnerConfigurationFactory =
    await smock.mock<PartnerConfiguration__factory>('PartnerConfiguration');
  const PartnerConfiguration = await PartnerConfigurationFactory.deploy(
    BigNumber.from(MIN_LENGTH),
    BigNumber.from(MAX_LENGTH),
    IS_UNICODE_SUPPORTED,
    BigNumber.from(MIN_DURATION),
    BigNumber.from(MAX_DURATION),
    BigNumber.from(FEE_PERCENTAGE),
    BigNumber.from(DISCOUNT),
    BigNumber.from(MIN_COMMITMENT_AGE)
  );

  const PartnerManagerFactory = await smock.mock<PartnerManager__factory>(
    'PartnerManager'
  );
  const PartnerManager = await PartnerManagerFactory.deploy();

  const PartnerRegistrarFactory = await smock.mock<PartnerRegistrar__factory>(
    'PartnerRegistrar'
  );
  const PartnerRegistrar = await PartnerRegistrarFactory.deploy(
    NodeOwner.address,
    RIF.address,
    PartnerManager.address,
    RNS.address,
    ROOT_NODE
  );

  const PartnerRenewerFactory = await smock.mock<PartnerRenewer__factory>(
    'PartnerRenewer'
  );
  const PartnerRenewer = await PartnerRenewerFactory.deploy(
    NodeOwner.address,
    RIF.address,
    PartnerManager.address
  );

  const FeeManagerFactory = await smock.mock<FeeManager__factory>('FeeManager');
  const FeeManager = await FeeManagerFactory.deploy(
    RIF.address,
    PartnerRegistrar.address,
    PartnerRenewer.address,
    PartnerManager.address,
    pool.address
  );

  await PartnerRegistrar.setFeeManager(FeeManager.address);
  await PartnerRenewer.setFeeManager(FeeManager.address);

  const PartnerRenewerProxyContractFactory =
    await smock.mock<PartnerRenewerProxy__factory>('PartnerRenewerProxy');

  const MasterRenewerProxy = await PartnerRenewerProxyContractFactory.deploy();

  const { contract: PartnerRenewerProxyFactory } =
    await deployContract<PartnerRenewerProxyFactory>(
      'PartnerRenewerProxyFactory',
      {
        _masterProxy: MasterRenewerProxy.address,
        _rif: RIF.address,
      }
    );

  return {
    MasterRenewerProxy,
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
    const {
      PartnerRenewerProxyFactory,
      partner1,
      partner2,
      PartnerRegistrar,
      PartnerRenewer,
    } = await loadFixture(initialSetup);

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne',
        PartnerRegistrar.address,
        PartnerRenewer.address
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
        'PartnerTwo',
        PartnerRegistrar.address,
        PartnerRenewer.address
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
      PartnerRegistrar,
      PartnerRenewer,
    } = await loadFixture(initialSetup);

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne',
        PartnerRegistrar.address,
        PartnerRenewer.address
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
        'PartnerTwo',
        PartnerRegistrar.address,
        PartnerRenewer.address
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
      PartnerRegistrar,
      PartnerRenewer,
      partner1,
    } = await loadFixture(initialSetup);

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne',
        PartnerRegistrar.address,
        PartnerRenewer.address
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

  it('should fail if proxy clone is reinitilized', async () => {
    const {
      MasterRenewerProxy,
      PartnerRenewerProxyFactory,
      partner1,
      PartnerRegistrar,
      PartnerRenewer,
      RIF,
    } = await loadFixture(initialSetup);

    await (
      await PartnerRenewerProxyFactory.createNewPartnerProxy(
        partner1.address,
        'PartnerOne',
        PartnerRegistrar.address,
        PartnerRenewer.address
      )
    ).wait();

    const partnerOneProxyStruct =
      await PartnerRenewerProxyFactory.getPartnerProxy(
        partner1.address,
        'PartnerOne'
      );

    const partnerProxy = MasterRenewerProxy.attach(partnerOneProxyStruct.proxy);

    await expect(
      partnerProxy.init(
        partner1.address,
        PartnerRegistrar.address,
        PartnerRenewer.address,
        RIF.address
      )
    ).to.be.revertedWith('Init: Cannot be reinitialized');
  });
});
