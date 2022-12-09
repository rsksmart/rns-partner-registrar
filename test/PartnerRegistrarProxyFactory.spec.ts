import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { deployContract } from 'utils/deployment.utils';
import { deployMockContract } from './utils/mock.utils';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import { $RIF } from 'typechain-types/contracts-exposed/RIF.sol/$RIF';
import { $IPartnerConfiguration } from 'typechain-types/contracts-exposed/PartnerConfiguration/IPartnerConfiguration.sol/$IPartnerConfiguration';
import { IFeeManager } from 'typechain-types/contracts/FeeManager/IFeeManager';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager';
import NodeOwnerJson from '../artifacts/contracts-exposed/NodeOwner.sol/$NodeOwner.json';
import RIFJson from '../artifacts/contracts-exposed/RIF.sol/$RIF.json';
import IPartnerConfigurationJson from '../artifacts/contracts-exposed/PartnerConfiguration/IPartnerConfiguration.sol/$IPartnerConfiguration.json';
import IFeeManagerJson from '../artifacts/contracts/FeeManager/IFeeManager.sol/IFeeManager.json';
import PartnerMangerJson from '../artifacts/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager.json';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { $RNS } from 'typechain-types/contracts-exposed/RNS.sol/$RNS';
import RNSJson from '../artifacts/contracts-exposed/RNS.sol/$RNS.json';
import ResolverJson from '../artifacts/contracts-exposed/test-utils/Resolver.sol/$Resolver.json';
import { $Resolver } from 'typechain-types/contracts-exposed/test-utils/Resolver.sol/$Resolver';
import { $PartnerRegistrarProxy } from '../typechain-types/contracts-exposed/PartnerProxy/Registrar/PartnerRegistrarProxy.sol/$PartnerRegistrarProxy';
import { $PartnerRegistrarProxyFactory } from '../typechain-types/contracts-exposed/PartnerProxy/Registrar/PartnerRegistrarProxyFactory.sol/$PartnerRegistrarProxyFactory';
import { $PartnerRenewer } from 'typechain-types/contracts-exposed/Renewer/PartnerRenewer.sol/$PartnerRenewer';

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

  const RNS = await deployMockContract<$RNS>(owner, RNSJson.abi);

  const Resolver = await deployMockContract<$Resolver>(owner, ResolverJson.abi);

  const NodeOwner = await deployMockContract<$NodeOwner>(
    owner,
    NodeOwnerJson.abi
  );

  const RIF = await deployMockContract<$RIF>(owner, RIFJson.abi);

  const PartnerConfiguration = await deployMockContract<$IPartnerConfiguration>(
    owner,
    IPartnerConfigurationJson.abi
  );

  const FeeManager = await deployMockContract<IFeeManager>(
    owner,
    IFeeManagerJson.abi
  );

  const PartnerManager = await deployMockContract<$PartnerManager>(
    owner,
    PartnerMangerJson.abi
  );

  const { contract: PartnerRegistrar } =
    await deployContract<$PartnerRegistrar>('$PartnerRegistrar', {
      NodeOwner: NodeOwner.address,
      RIF: RIF.address,
      IPartnerManager: PartnerManager.address,
      RNS: RNS.address,
      rootNode: tldNode,
    });

  const { contract: PartnerRenewer } = await deployContract<$PartnerRenewer>(
    '$PartnerRenewer',
    {
      NodeOwner: NodeOwner.address,
      RIF: RIF.address,
      IPartnerManager: PartnerManager.address,
    }
  );

  const { contract: PartnerRegistrarProxyFactory } =
    await deployContract<$PartnerRegistrarProxyFactory>(
      '$PartnerRegistrarProxyFactory',
      {
        _rif: RIF.address,
        _partnerRegistrar: PartnerRegistrar.address,
        _partnerRenewer: PartnerRenewer.address,
      }
    );

  await RNS.mock.resolver.returns(Resolver.address);

  await Resolver.mock.setAddr.returns();

  await NodeOwner.mock.reclaim.returns();
  await NodeOwner.mock.transferFrom.returns();

  return {
    PartnerProxy: await ethers.getContractFactory('PartnerRegistrarProxy'),
    PartnerProxyFactory: PartnerRegistrarProxyFactory,
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
    const { PartnerProxyFactory, partner1, partner2 } = await loadFixture(
      initialSetup
    );

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne'
    );
    await partnerOneProxy.wait();
    const result1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );
    await partnerTwoProxy.wait();
    const result2 = await PartnerProxyFactory.getPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );

    expect([result1.name, result2.name]).to.deep.equal([
      'PartnerOne',
      'PartnerTwo',
    ]);
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
      'PartnerOne'
    );
    await partnerOneProxy.wait();
    const result1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );
    await partnerTwoProxy.wait();
    const result2 = await PartnerProxyFactory.getPartnerProxy(
      partner2.address,
      'PartnerTwo'
    );

    const partnerOneOwner = PartnerProxy.attach(result1.proxy);
    const partnerTwoOwner = PartnerProxy.attach(result2.proxy);

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
      'PartnerOne'
    );

    await newPartnerProxy.wait();
    const result1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );
    const partnerProxy = PartnerProxy.attach(result1.proxy);

    //
    await PartnerManager.mock.isPartner.returns(true);

    await PartnerConfiguration.mock.getMinLength.returns(MIN_LENGTH);

    await PartnerConfiguration.mock.getMaxLength.returns(MAX_LENGTH);

    await PartnerConfiguration.mock.getMinCommitmentAge.returns(1);

    await PartnerConfiguration.mock.getPrice.returns(PRICE);

    await PartnerManager.mock.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    await RIF.mock.transferFrom.returns(true);

    await RIF.mock.approve.returns(true);

    await NodeOwner.mock.expirationTime.returns(EXPIRATION_TIME);

    await NodeOwner.mock.register.returns();

    await FeeManager.mock.deposit.returns();

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
      'PartnerOne'
    );
    await partnerOneProxy.wait();
    const result1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerOneOwner = PartnerProxy.attach(result1.proxy);

    await PartnerManager.mock.isPartner.returns(true);

    await PartnerConfiguration.mock.getMinCommitmentAge.returns(0);

    await PartnerManager.mock.getPartnerConfiguration.returns(
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
      'PartnerOne'
    );
    await partnerOneProxy.wait();
    const result1 = await PartnerProxyFactory.getPartnerProxy(
      partner1.address,
      'PartnerOne'
    );

    const partnerOneOwner = PartnerProxy.attach(result1.proxy);

    await PartnerManager.mock.isPartner.returns(true);

    await PartnerConfiguration.mock.getMinCommitmentAge.returns(1);

    await PartnerManager.mock.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    expect(partnerOneOwner.commit(DUMMY_COMMITMENT)).to.not.be.reverted;
  });
});
