import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { NodeOwner as NodeOwnerType } from 'typechain-types';
import NodeOwnerJson from '../artifacts/contracts/NodeOwner.sol/NodeOwner.json';
import { RIF as RIFType } from 'typechain-types';
import { IPartnerConfiguration as IPartnerConfigurationType } from 'typechain-types';
import { IFeeManager as IFeeManagerType } from 'typechain-types';
import { PartnerManager as PartnerManagerType } from 'typechain-types';
import RIFJson from '../artifacts/contracts-exposed/RIF.sol/$RIF.json';
import IPartnerConfigurationJson from '../artifacts/contracts/PartnerConfiguration/IPartnerConfiguration.sol/IPartnerConfiguration.json';
import IFeeManagerJson from '../artifacts/contracts/FeeManager/IFeeManager.sol/IFeeManager.json';
import PartnerMangerJson from '../artifacts/contracts/PartnerManager/PartnerManager.sol/PartnerManager.json';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { RNS as RNSType } from 'typechain-types';
import RNSJson from '../artifacts/contracts/RNS.sol/RNS.json';
import ResolverJson from '../artifacts/contracts/test-utils/Resolver.sol/Resolver.json';
import { Resolver as ResolverType } from 'typechain-types';
import { deployContract } from 'utils/deployment.utils';
import { deployMockContract } from './utils/mock.utils';

const SECRET = keccak256(toUtf8Bytes('test'));
const LABEL = keccak256(toUtf8Bytes('cheta'));
const MIN_LENGTH = 3;
const MAX_LENGTH = 7;
const PRICE = 1;
const EXPIRATION_TIME = 365;
const DURATION = 1;
const tldNode = namehash('rsk');
const DUMMY_COMMITMENT = keccak256(toUtf8Bytes('this is a dummy'));

async function initialSetup() {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner1 = signers[1];
  const partner2 = signers[2];
  const nameOwner = signers[3];

  const RNS = await deployMockContract<RNSType>(RNSJson.abi);

  const Resolver = await deployMockContract<ResolverType>(ResolverJson.abi);

  const NodeOwner = await deployMockContract<NodeOwnerType>(NodeOwnerJson.abi);

  const RIF = await deployMockContract<RIFType>(RIFJson.abi);

  const PartnerConfiguration =
    await deployMockContract<IPartnerConfigurationType>(
      IPartnerConfigurationJson.abi
    );

  const FeeManager = await deployMockContract<IFeeManagerType>(
    IFeeManagerJson.abi
  );

  const PartnerManager = await deployMockContract<PartnerManagerType>(
    PartnerMangerJson.abi
  );

  const { contract: PartnerRegistrar } = await deployContract(
    'PartnerRegistrar',
    {
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
      rns: RNS.address,
      rootNode: tldNode,
    }
  );

  const { contract: PartnerProxy } = await deployContract('PartnerProxy', {});

  const { contract: PartnerProxyFactory } = await deployContract(
    'PartnerProxyFactory',
    {
      _masterProxy: PartnerProxy.address,
      rif: RIF.address,
    }
  );

  RNS.resolver.returns(Resolver.address);

  Resolver.setAddr.returns();

  NodeOwner.reclaim.returns();
  NodeOwner.transferFrom.returns();

  return {
    PartnerProxy,
    PartnerProxyFactory,
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
describe('Deploy PartnerProxyFactory, Create New Proxy Instances, Use new Partner Proxies', () => {
  it('should successfully create new partner proxies', async () => {
    const { PartnerProxyFactory, partner1, partner2, PartnerRegistrar } =
      await loadFixture(initialSetup);

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne',
      PartnerRegistrar.address
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner2.address,
      'PartnerTwo',
      PartnerRegistrar.address
    );
    await partnerTwoProxy.wait();
    const tx2 = await PartnerProxyFactory.getPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );

    expect([tx1.name, tx2.name]).to.deep.equal(['PartnerOne', 'PartnerTwo']);
  });

  it('should successfully identify the owner of each proxy', async () => {
    const {
      PartnerProxy,
      PartnerProxyFactory,
      partner1,
      partner2,
      PartnerRegistrar,
    } = await loadFixture(initialSetup);

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne',
      PartnerRegistrar.address
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner2.address,
      'PartnerTwo',
      PartnerRegistrar.address
    );
    await partnerTwoProxy.wait();
    const tx2 = await PartnerProxyFactory.getPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );

    const partnerOneOwner = PartnerProxy.attach(tx1.proxy);
    const partnerTwoOwner = PartnerProxy.attach(tx2.proxy);

    expect([
      await partnerOneOwner.owner(),
      await partnerTwoOwner.owner(),
    ]).to.deep.equal([partner1.address, partner2.address]);
  });

  it('should successfully register a new domain for a partner with their corresponding proxy', async () => {
    const {
      PartnerProxy,
      PartnerProxyFactory,
      PartnerConfiguration,
      PartnerManager,
      RIF,
      NodeOwner,
      FeeManager,
      PartnerRegistrar,
      partner1,
      nameOwner,
    } = await loadFixture(initialSetup);

    const newPartnerProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne',
      PartnerRegistrar.address
    );

    await newPartnerProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );
    const partnerProxy = PartnerProxy.attach(tx1.proxy);

    PartnerManager.isPartner.returns(true);

    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);

    PartnerConfiguration.getMaxLength.returns(MAX_LENGTH);

    PartnerConfiguration.getMinCommitmentAge.returns(1);

    PartnerConfiguration.getPrice.returns(PRICE);

    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    RIF.transferFrom.returns(true);

    RIF.approve.returns(true);

    NodeOwner.expirationTime.returns(EXPIRATION_TIME);

    NodeOwner.register.returns();

    FeeManager.deposit.returns();

    await PartnerRegistrar.setFeeManager(FeeManager.address);

    try {
      const commitment = await partnerProxy.makeCommitment(
        LABEL,
        nameOwner.address,
        SECRET
      );

      const tx = await partnerProxy.connect(partner1).commit(commitment);
      tx.wait();

      await expect(
        partnerProxy
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

  it('should fail if proxy clone is reinitilized', async () => {
    const {
      PartnerProxy,
      PartnerProxyFactory,
      partner1,
      partner2,
      PartnerRegistrar,
      RIF,
    } = await loadFixture(initialSetup);

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne',
      PartnerRegistrar.address
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerOneOwner = PartnerProxy.attach(tx1.proxy);

    await expect(
      partnerOneOwner
        .connect(partner2)
        .init(partner2.address, PartnerRegistrar.address, RIF.address)
    ).to.be.revertedWith('Init: clone cannot be reinitialized');
  });

  it('Should revert on commit if partner minCommitmentAge is 0 (i.e partner config allows one step purchase', async () => {
    const {
      PartnerProxy,
      PartnerProxyFactory,
      PartnerConfiguration,
      PartnerManager,
      partner1,
      PartnerRegistrar,
      RIF,
    } = await loadFixture(initialSetup);

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne',
      PartnerRegistrar.address
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerOneOwner = PartnerProxy.attach(tx1.proxy);

    PartnerManager.isPartner.returns(true);

    PartnerConfiguration.getMinCommitmentAge.returns(0);

    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    await expect(partnerOneOwner.commit(DUMMY_COMMITMENT)).to.be.revertedWith(
      'Commitment not required'
    );
  });

  it('Should not be reverted if partner minCommitmentAge is not 0 (i.e partner config does not allow one step purchase', async () => {
    const {
      PartnerProxy,
      PartnerProxyFactory,
      PartnerConfiguration,
      PartnerManager,
      partner1,
      PartnerRegistrar,
      RIF,
    } = await loadFixture(initialSetup);

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne',
      PartnerRegistrar.address
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerOneOwner = PartnerProxy.attach(tx1.proxy);

    PartnerManager.isPartner.returns(true);

    PartnerConfiguration.getMinCommitmentAge.returns(1);

    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    expect(partnerOneOwner.commit(DUMMY_COMMITMENT)).to.not.be.reverted;
  });
});
