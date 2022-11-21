import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { deployContract } from 'utils/deployment.utils';
import { $PartnerProxy } from 'typechain-types/contracts-exposed/PartnerProxy/PartnerProxy.sol/$PartnerProxy';
import { $PartnerProxyFactory } from 'typechain-types/contracts-exposed/PartnerProxy/PartnerProxyFactory.sol/$PartnerProxyFactory';
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
import PartnerRegistrarJson from '../artifacts/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar.json';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';

const SECRET = keccak256(toUtf8Bytes('test'));
const LABEL = keccak256(toUtf8Bytes('cheta'));
const MINLENGTH = 3;
const MAXLENGTH = 7;
const MINCOMMITMENTAGE = 0;
const PRICE = 1;
const EXPIRATIONTIME = 365;
const DURATION = 1;

async function initialSetup() {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner1 = signers[1];
  const partner2 = signers[2];
  const nameOwner = signers[3];

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

  //   const PartnerRegistrar = await deployMockContract<$PartnerRegistrar>(
  //     owner,
  //     PartnerRegistrarJson.abi
  //   );

  const { contract: PartnerRegistrar } =
    await deployContract<$PartnerRegistrar>('$PartnerRegistrar', {
      NodeOwner: NodeOwner.address,
      RIF: RIF.address,
      IPartnerManager: PartnerManager.address,
    });

  const { contract: PartnerProxy } = await deployContract<$PartnerProxy>(
    '$PartnerProxy',
    {}
  );

  const { contract: PartnerProxyFactory } =
    await deployContract<$PartnerProxyFactory>('$PartnerProxyFactory', {
      _masterProxy: PartnerProxy.address,
    });

  console.log(`
    PartnerProxy deployed at: ${PartnerProxy.address},
    PartnerProxyFactory: ${PartnerProxyFactory.address},
    NodeOwner: ${NodeOwner.address},
    RIF: ${RIF.address},
    PartnerConfiguration: ${PartnerConfiguration.address},
    FeeManager: ${FeeManager.address},
    PartnerManager: ${PartnerManager.address},
    PartnerRegistrar: ${PartnerRegistrar.address}
    `);

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
    const tx1 = await PartnerProxyFactory.getPartnerProxy(partner1.address);

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner2.address,
      'PartnerTwo',
      PartnerRegistrar.address
    );
    await partnerTwoProxy.wait();
    const tx2 = await PartnerProxyFactory.getPartnerProxy(partner2.address);

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
    const tx1 = await PartnerProxyFactory.getPartnerProxy(partner1.address);

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner2.address,
      'PartnerTwo',
      PartnerRegistrar.address
    );
    await partnerTwoProxy.wait();
    const tx2 = await PartnerProxyFactory.getPartnerProxy(partner2.address);

    const partnerOneOwner = PartnerProxy.attach(tx1.proxy);
    const partnerTwoOwner = PartnerProxy.attach(tx2.proxy);

    expect([
      await partnerOneOwner.owner(),
      await partnerTwoOwner.owner(),
    ]).to.deep.equal([partner1.address, partner2.address]);
  });

  it('should revert if the wrong proxy owner calls the proxy', async () => {
    const {
      PartnerProxy,
      PartnerProxyFactory,
      partner1,
      partner2,
      nameOwner,
      PartnerRegistrar,
    } = await loadFixture(initialSetup);

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerProxy(
      partner1.address,
      'PartnerOne',
      PartnerRegistrar.address
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(partner1.address);

    const partnerOneOwner = PartnerProxy.attach(tx1.proxy);

    const commitment = await partnerOneOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    await expect(
      partnerOneOwner.connect(partner2).commit(commitment)
    ).to.be.revertedWith("Ownable: caller is not the owner'");
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
    const tx1 = await PartnerProxyFactory.getPartnerProxy(partner1.address);
    const partnerProxy = PartnerProxy.attach(tx1.proxy);

    //
    await PartnerManager.mock.isPartner.returns(true);

    await PartnerConfiguration.mock.getMinLength.returns(MINLENGTH);

    await PartnerConfiguration.mock.getMaxLength.returns(MAXLENGTH);

    await PartnerConfiguration.mock.getMinCommittmentAge.returns(
      MINCOMMITMENTAGE
    );

    await PartnerConfiguration.mock.getPrice.returns(PRICE);

    await PartnerManager.mock.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    await RIF.mock.transferFrom.returns(true);

    await NodeOwner.mock.expirationTime.returns(EXPIRATIONTIME);

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
          .register('cheta', nameOwner.address, SECRET, DURATION)
      ).to.not.be.reverted;
    } catch (error) {
      console.log(error);

      throw error;
    }
  });
});
