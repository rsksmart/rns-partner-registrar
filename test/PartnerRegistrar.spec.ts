import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract } from '../utils/deployment.utils';
import { deployMockContract } from './utils/mock.utils';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import NodeOwnerJson from '../artifacts/contracts-exposed/NodeOwner.sol/$NodeOwner.json';
import RNSJson from '../artifacts/contracts-exposed/RNS.sol/$RNS.json';
import ResolverJson from '../artifacts/contracts-exposed/test-utils/Resolver.sol/$Resolver.json';
import { $RIF } from 'typechain-types/contracts-exposed/RIF.sol/$RIF';
import RIFJson from '../artifacts/contracts-exposed/RIF.sol/$RIF.json';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager';
import PartnerMangerJson from '../artifacts/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager.json';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar';
import { expect } from 'chai';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { $IPartnerConfiguration } from 'typechain-types/contracts-exposed/PartnerConfiguration/IPartnerConfiguration.sol/$IPartnerConfiguration';
import IPartnerConfigurationJson from '../artifacts/contracts-exposed/PartnerConfiguration/IPartnerConfiguration.sol/$IPartnerConfiguration.json';
import { IFeeManager } from '../typechain-types/contracts/FeeManager/IFeeManager';
import IFeeManagerJson from '../artifacts/contracts/FeeManager/IFeeManager.sol/IFeeManager.json';
import { BigNumber } from 'ethers';
import { $RNS } from 'typechain-types/contracts-exposed/RNS.sol/$RNS';
import { $Resolver } from 'typechain-types/contracts-exposed/test-utils/Resolver.sol/$Resolver';

const SECRET = keccak256(toUtf8Bytes('test'));

const LABEL = keccak256(toUtf8Bytes('cheta'));
const MIN_LENGTH = 3;
const MAX_LENGTH = 7;
const PRICE = 1;
const EXPIRATION_TIME = 365;
const DURATION = 1;
const tldNode = namehash('rsk');

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const nameOwner = signers[2];

  const RNS = await deployMockContract<$RNS>(RNSJson.abi);

  const Resolver = await deployMockContract<$Resolver>(ResolverJson.abi);

  const NodeOwner = await deployMockContract<$NodeOwner>(NodeOwnerJson.abi);

  const RIF = await deployMockContract<$RIF>(RIFJson.abi);

  const PartnerManager = await deployMockContract<$PartnerManager>(
    PartnerMangerJson.abi
  );

  const PartnerConfiguration = await deployMockContract<$IPartnerConfiguration>(
    IPartnerConfigurationJson.abi
  );

  const FeeManager = await deployMockContract<IFeeManager>(IFeeManagerJson.abi);

  const { contract: PartnerRegistrar } =
    await deployContract<$PartnerRegistrar>('$PartnerRegistrar', {
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
      rns: RNS.address,
      rootNode: tldNode,
    });

  RNS.resolver.returns(Resolver.address);

  Resolver.setAddr.returns();

  NodeOwner.reclaim.returns();
  NodeOwner.transferFrom.returns();

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
    signers,
  };
};

describe('New Domain Registration', () => {
  it('Should register a new domain when min commitment age is not 0', async () => {
    const {
      NodeOwner,
      RIF,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      FeeManager,
    } = await loadFixture(initialSetup);

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

    PartnerRegistrar.setFeeManager(FeeManager.address);

    const commitment = await PartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    const tx = await PartnerRegistrar.commit(commitment);
    tx.wait();
    try {
      await expect(
        PartnerRegistrar.register(
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

  it('Should register a new domain when min commitment age is 0 and no commitment is made', async () => {
    const {
      NodeOwner,
      RIF,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      FeeManager,
    } = await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(true);

    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);

    PartnerConfiguration.getMaxLength.returns(MAX_LENGTH);

    PartnerConfiguration.getMinCommitmentAge.returns(BigNumber.from(0));

    PartnerConfiguration.getPrice.returns(PRICE);

    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );

    RIF.transferFrom.returns(true);

    RIF.approve.returns(true);

    NodeOwner.expirationTime.returns(EXPIRATION_TIME);

    NodeOwner.register.returns();

    FeeManager.deposit.returns();

    PartnerRegistrar.setFeeManager(FeeManager.address);

    await expect(
      PartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address
      )
    ).to.not.be.reverted;
  });

  it('Should fail if caller is not a valid partner', async () => {
    const { PartnerManager, PartnerRegistrar, nameOwner, NodeOwner } =
      await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(false);

    await expect(
      PartnerRegistrar.register(
        'cheta👀',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address
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
        NodeOwner.address
      )
    ).to.be.revertedWith('Name too short');
  });

  it('Should fail if new domain length is more than accepted value', async () => {
    const {
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      NodeOwner,
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
        NodeOwner.address
      )
    ).to.be.revertedWith('Name too long');
  });

  it('Should fail if no commitment is made and minCommitmentAge is not 0', async () => {
    const {
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
      NodeOwner,
    } = await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(true);
    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );
    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);
    PartnerConfiguration.getMaxLength.returns(MAX_LENGTH);
    PartnerConfiguration.getMinCommitmentAge.returns(BigNumber.from(1));

    await expect(
      PartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address
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
    } = await loadFixture(initialSetup);

    PartnerManager.isPartner.returns(true);
    PartnerManager.getPartnerConfiguration.returns(
      PartnerConfiguration.address
    );
    PartnerConfiguration.getMinLength.returns(MIN_LENGTH);
    PartnerConfiguration.getMaxLength.returns(MAX_LENGTH);
    PartnerConfiguration.getMinCommitmentAge.returns(BigNumber.from(1));

    const commitment = await PartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    const tx = await PartnerRegistrar.commit(commitment);
    tx.wait();

    await expect(
      PartnerRegistrar.register(
        'lcheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address
      )
    ).to.be.revertedWith('No commitment found');
  });
});
