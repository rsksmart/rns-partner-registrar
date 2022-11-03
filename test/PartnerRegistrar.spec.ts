import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract } from '../utils/deployment.utils';
import { deployMockContract } from './utils/mock.utils';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import NodeOwnerJson from '../artifacts/contracts-exposed/NodeOwner.sol/$NodeOwner.json';
import { $RIF } from 'typechain-types/contracts-exposed/RIF.sol/$RIF';
import RIFJson from '../artifacts/contracts-exposed/RIF.sol/$RIF.json';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager.sol/$PartnerManager';
import PartnerMangerJson from '../artifacts/contracts-exposed/PartnerManager.sol/$PartnerManager.json';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/PartnerRegistrar.sol/$PartnerRegistrar';
import { expect } from 'chai';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { $IPartnerConfiguration } from 'typechain-types/contracts-exposed/IPartnerConfiguration.sol/$IPartnerConfiguration';
import IPartnerConfigurationJson from '../artifacts/contracts-exposed/IPartnerConfiguration.sol/$IPartnerConfiguration.json';

const SECRET = keccak256(toUtf8Bytes('test'));
const LABEL = keccak256(toUtf8Bytes('cheta'));
const MINLENGTH = 3;
const MAXLENGTH = 7;
const MINCOMMITMENTAGE = 0;
const PRICE = 1;
const EXPIRATIONTIME = 365;
const DURATION = 1;

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const nameOwner = signers[2];

  const NodeOwner = await deployMockContract<$NodeOwner>(
    owner,
    NodeOwnerJson.abi
  );

  const RIF = await deployMockContract<$RIF>(owner, RIFJson.abi);

  const PartnerManager = await deployMockContract<$PartnerManager>(
    owner,
    PartnerMangerJson.abi
  );

  const PartnerConfiguration = await deployMockContract<$IPartnerConfiguration>(
    owner,
    IPartnerConfigurationJson.abi
  );

  const { contract: PartnerRegistrar } =
    await deployContract<$PartnerRegistrar>('$PartnerRegistrar', {
      NodeOwner: NodeOwner.address,
      RIF: RIF.address,
      IPartnerManager: PartnerManager.address,
    });

  return {
    NodeOwner,
    RIF,
    PartnerManager,
    PartnerRegistrar,
    PartnerConfiguration,
    owner,
    partner,
    nameOwner,
    signers,
  };
};

describe('PartnerRegistrar', () => {
  it('Should register a new name', async () => {
    const {
      NodeOwner,
      RIF,
      PartnerManager,
      PartnerRegistrar,
      PartnerConfiguration,
      nameOwner,
    } = await loadFixture(initialSetup);

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

    const commitment = await PartnerRegistrar.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    const tx = await PartnerRegistrar.commit(commitment);
    tx.wait();

    await expect(
      PartnerRegistrar.register('cheta', nameOwner.address, SECRET, DURATION)
    ).to.not.be.reverted;
  });
});
