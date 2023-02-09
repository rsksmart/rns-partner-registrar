import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import { deployContract as deployContractAsMock } from '../utils/mock.utils';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
  getRenewData,
  oneRBTC,
} from '../utils/mock.utils';
import { NodeOwner, RegistrarAccessControl__factory } from 'typechain-types';
import { PartnerManager } from 'typechain-types';
import { PartnerRegistrar } from 'typechain-types';
import { expect } from 'chai';
import { IFeeManager } from '../../typechain-types/contracts/FeeManager/IFeeManager';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677Token } from 'typechain-types/contracts/test-utils';
import { ERC677Token__factory } from 'typechain-types';
import { PartnerConfiguration } from 'typechain-types';
import { Resolver } from 'typechain-types';
import { RNS } from 'typechain-types';
import { PartnerRenewer } from 'typechain-types';
import { keccak256, toUtf8Bytes, namehash } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { duration } from '@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time';
import {
  UN_NECESSARY_MODIFICATION_ERROR_MSG,
  NAME_RENEWED_EVENT,
  FEE_MANAGER_CHANGED_EVENT,
} from 'test/utils/constants.utils';
import { SECRET } from './utils/constants';

const NAME = 'cheta';
const LABEL = keccak256(toUtf8Bytes(NAME));
const DURATION = ethers.BigNumber.from('1');
const FEE_PERCENTAGE = oneRBTC.mul(5); //5%
const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = ethers.utils.id('rsk');

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[1];
  const partnerOwnerAccount = signers[2];
  const nameOwner = signers[3];
  const pool = signers[4];
  const alternateFeeManager = signers[5];
  const alternatePartnerManager = signers[7];

  const { contract: RNS } = await deployContract<RNS>(
    'RNS',
    {},
    (await ethers.getContractFactory(
      RNSAbi.abi,
      RNSAbi.bytecode
    )) as Factory<RNS>
  );

  const { contract: NodeOwner } = await deployContract<NodeOwner>(
    'NodeOwner',
    {
      _rns: RNS.address,
      _rootNode: tldNode,
    },
    (await ethers.getContractFactory(
      NodeOwnerAbi.abi,
      NodeOwnerAbi.bytecode
    )) as Factory<NodeOwner>
  );

  const { contract: Resolver } = await deployContract<Resolver>(
    'ResolverV1',
    {},
    (await ethers.getContractFactory(
      ResolverAbi.abi,
      ResolverAbi.bytecode
    )) as Factory<Resolver>
  );

  await (await Resolver.initialize(RNS.address)).wait();

  const RIF = await deployContractAsMock<ERC677Token__factory>('ERC677Token', [
    owner.address,
    oneRBTC.mul(100000000000000),
    'ERC677',
    'MOCKCOIN',
  ]);

  const { contract: FakeRIF } = await deployContract<ERC677Token>(
    'ERC677Token',
    {
      beneficiary: owner.address,
      initialAmount: oneRBTC.mul(100000000000000),
      tokenName: 'ERC677',
      tokenSymbol: 'MOCKCOIN',
    }
  );

  const accessControl =
    await deployContractAsMock<RegistrarAccessControl__factory>(
      'RegistrarAccessControl',
      []
    );

  const { contract: PartnerManager } = await deployContract<PartnerManager>(
    'PartnerManager',
    { accessControl: accessControl.address }
  );

  const { contract: PartnerConfiguration } =
    await deployContract<PartnerConfiguration>('PartnerConfiguration', {
      accessControl: accessControl.address,
      minLength: 5,
      maxLength: 20,
      minDuration: 1,
      maxDuration: 5,
      feePercentage: FEE_PERCENTAGE,
      discount: 0,
      minCommitmentAge: 1,
    });

  const { contract: alternatePartnerConfiguration } =
    await deployContract<PartnerConfiguration>('PartnerConfiguration', {
      accessControl: accessControl.address,
      minLength: 5,
      maxLength: 20,
      minDuration: 1,
      maxDuration: 5,
      feePercentage: FEE_PERCENTAGE,
      discount: 0,
      minCommitmentAge: 1,
    });

  const { contract: PartnerRegistrar } = await deployContract<PartnerRegistrar>(
    'PartnerRegistrar',
    {
      accessControl: accessControl.address,
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
      rns: RNS.address,
      rootNode: tldNode,
    }
  );

  const { contract: PartnerRenewer } = await deployContract<PartnerRenewer>(
    'PartnerRenewer',
    {
      accessControl: accessControl.address,
      nodeOwner: NodeOwner.address,
      rif: RIF.address,
      partnerManager: PartnerManager.address,
    }
  );

  const { contract: FeeManager } = await deployContract<IFeeManager>(
    'FeeManager',
    {
      rif: RIF.address,
      registrar: PartnerRegistrar.address,
      renewer: PartnerRenewer.address,
      partnerManager: PartnerManager.address,
      pool: pool.address,
    }
  );

  await (
    await RNS.setSubnodeOwner(rootNodeId, tldAsSha3, NodeOwner.address)
  ).wait();

  await (await NodeOwner.addRegistrar(PartnerRegistrar.address)).wait();
  await (await NodeOwner.addRenewer(PartnerRenewer.address)).wait();

  await (await RNS.setDefaultResolver(Resolver.address)).wait();

  await (await NodeOwner.setRootResolver(Resolver.address)).wait();

  await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();
  await (await PartnerRenewer.setFeeManager(FeeManager.address)).wait();

  await (
    await PartnerManager.addPartner(
      partner.address,
      partnerOwnerAccount.address
    )
  ).wait();
  await (
    await PartnerManager.setPartnerConfiguration(
      partner.address,
      PartnerConfiguration.address
    )
  ).wait();

  await (await RIF.transfer(nameOwner.address, oneRBTC.mul(10))).wait();

  return {
    NodeOwner,
    RIF,
    FakeRIF,
    PartnerManager,
    PartnerRegistrar,
    PartnerConfiguration,
    FeeManager,
    Resolver,
    RNS,
    owner,
    partner,
    nameOwner,
    signers,
    PartnerRenewer,
    pool,
    partnerOwnerAccount,
    alternateFeeManager,
    alternatePartnerConfiguration,
    alternatePartnerManager,
  };
};

describe('Domain Renewal', () => {
  it('Should revert with `Name already expired`', async () => {
    const { RIF, PartnerRegistrar, PartnerRenewer, partner } =
      await loadFixture(initialSetup);
    const namePrice = await PartnerRegistrar.price(
      NAME,
      ethers.BigNumber.from(0),
      DURATION,
      partner.address
    );

    const renewData = getRenewData(NAME, DURATION, partner.address);

    await expect(
      RIF.transferAndCall(PartnerRenewer.address, namePrice, renewData)
    ).to.be.revertedWith('Name already expired');
  });

  it('Should renew a domain name', async () => {
    const {
      RIF,
      PartnerRenewer,
      PartnerRegistrar,
      nameOwner,
      FeeManager,
      pool,
      partner,
    } = await loadFixture(initialSetup);

    const namePrice = await PartnerRegistrar.price(
      NAME,
      0,
      DURATION,
      partner.address
    );

    const partnerRegistrarAsNameOwner = PartnerRegistrar.connect(nameOwner);
    const secret = SECRET();
    const commitment = await partnerRegistrarAsNameOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      secret,
      DURATION,
      nameOwner.address
    );

    await (
      await partnerRegistrarAsNameOwner.commit(commitment, partner.address)
    ).wait();

    const registerData = getAddrRegisterData(
      NAME,
      nameOwner.address,
      secret,
      DURATION,
      nameOwner.address,
      partner.address
    );
    const renewData = getRenewData(NAME, DURATION, partner.address);

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerRegistrar.address,
        namePrice,
        registerData
      )
    ).wait();
    await expect(
      RIF.transferAndCall(PartnerRenewer.address, namePrice, renewData)
    ).to.be.fulfilled;

    const feeManagerBalance = await RIF.balanceOf(FeeManager.address);
    const expectedManagerBalance = calculatePercentageWPrecision(
      namePrice,
      FEE_PERCENTAGE
    );

    // double the amount
    expect(expectedManagerBalance.mul(2)).to.be.equal(feeManagerBalance);

    const poolBalance = await RIF.balanceOf(pool.address);

    const expectedPoolBalance = namePrice.sub(expectedManagerBalance);

    // double the amount
    expect(expectedPoolBalance.mul(2)).to.equal(poolBalance);
  });
  it('Should revert if amount is not enough', async () => {
    const { RIF, PartnerRenewer, PartnerRegistrar, nameOwner, partner } =
      await loadFixture(initialSetup);

    const namePrice = await PartnerRegistrar.price(
      NAME,
      0,
      DURATION,
      partner.address
    );

    const partnerRegistrarAsNameOwner = PartnerRegistrar.connect(nameOwner);
    const secret = SECRET();
    const commitment = await partnerRegistrarAsNameOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      secret,
      DURATION,
      nameOwner.address
    );

    await (
      await partnerRegistrarAsNameOwner.commit(commitment, partner.address)
    ).wait();

    const registerData = getAddrRegisterData(
      NAME,
      nameOwner.address,
      secret,
      DURATION,
      nameOwner.address,
      partner.address
    );
    const renewData = getRenewData(NAME, DURATION, partner.address);

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerRegistrar.address,
        namePrice,
        registerData
      )
    ).wait();
    await expect(
      RIF.transferAndCall(
        PartnerRenewer.address,
        namePrice.sub(BigNumber.from(1)),
        renewData
      )
    ).to.be.revertedWith('Insufficient tokens transferred');
  });

  it('Should revert if not RIF token', async () => {
    const {
      RIF,
      FakeRIF,
      PartnerRenewer,
      PartnerRegistrar,
      nameOwner,
      partner,
    } = await loadFixture(initialSetup);

    const namePrice = await PartnerRegistrar.price(
      NAME,
      0,
      DURATION,
      partner.address
    );

    const partnerRegistrarAsNameOwner = PartnerRegistrar.connect(nameOwner);
    const secret = SECRET();
    const commitment = await partnerRegistrarAsNameOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      secret,
      DURATION,
      nameOwner.address
    );

    await (
      await partnerRegistrarAsNameOwner.commit(commitment, partner.address)
    ).wait();

    const registerData = getAddrRegisterData(
      NAME,
      nameOwner.address,
      secret,
      DURATION,
      nameOwner.address,
      partner.address
    );
    const renewData = getRenewData(NAME, DURATION, partner.address);

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerRegistrar.address,
        namePrice,
        registerData
      )
    ).wait();
    await expect(
      FakeRIF.transferAndCall(PartnerRenewer.address, namePrice, renewData)
    ).to.be.revertedWith('Only RIF token');
  });

  it('Should revert if token transfer approval fails', async () => {
    const {
      RIF,
      PartnerRenewer,
      PartnerRegistrar,
      nameOwner,
      partner,
      PartnerConfiguration,
      NodeOwner,
    } = await loadFixture(initialSetup);

    // First Register the name to be renewed
    await (await PartnerConfiguration.setMinCommitmentAge(0)).wait();

    RIF.transferFrom.returns(true);
    RIF.approve.returns(true);
    RIF.transfer.returns(true);

    await PartnerRegistrar.register(
      NAME,
      nameOwner.address,
      SECRET(),
      DURATION,
      NodeOwner.address,
      partner.address
    );

    // Attempt to renew registered name

    RIF.transferFrom.returns(true);
    RIF.approve.returns(false);

    await expect(
      PartnerRenewer.renew(NAME, DURATION, partner.address)
    ).to.be.revertedWith('Token approval failed');
  });

  it('Should successfully renew a new domain without token transfer transactions when discount is 100%', async () => {
    const {
      RIF,
      FakeRIF,
      PartnerRenewer,
      PartnerRegistrar,
      nameOwner,
      partner,
      PartnerManager,
      NodeOwner,
      alternatePartnerConfiguration,
    } = await loadFixture(initialSetup);

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        alternatePartnerConfiguration.address
      )
    ).wait();

    (await alternatePartnerConfiguration.setMinCommitmentAge(0)).wait();

    // First Register the name to be renewed

    RIF.transferFrom.returns(true);
    RIF.approve.returns(true);
    RIF.transfer.returns(true);

    await PartnerRegistrar.register(
      NAME,
      nameOwner.address,
      SECRET(),
      DURATION,
      NodeOwner.address,
      partner.address
    );

    // Attempt to renew registered name
    (await alternatePartnerConfiguration.setDiscount(oneRBTC.mul(100))).wait();

    // The idea here is that the new domain registration shouldn't involve any token transfer
    // transactions as discount is a 100%. Hence the RIF transactions which would normally
    // cause the registration to fail with return values of false have no effect because
    // no token transfer methods are invoked in this domain registration scenario.
    RIF.transferFrom.returns(false);
    RIF.approve.returns(false);
    RIF.transfer.returns(false);

    await expect(PartnerRenewer.renew(NAME, DURATION, partner.address)).to.be
      .fulfilled;
  });

  it('Should revert is the fee manager to be set is same as existing', async () => {
    const { FeeManager, PartnerRenewer } = await loadFixture(initialSetup);

    await expect(
      PartnerRenewer.setFeeManager(FeeManager.address)
    ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
  });
});

describe('Renewal events', () => {
  it('Should emit the NameRenewed event on successful domain renewal', async () => {
    const {
      RIF,
      PartnerRenewer,
      PartnerRegistrar,
      nameOwner,
      partner,
      PartnerManager,
      NodeOwner,
      alternatePartnerConfiguration,
    } = await loadFixture(initialSetup);

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        alternatePartnerConfiguration.address
      )
    ).wait();

    (await alternatePartnerConfiguration.setMinCommitmentAge(0)).wait();

    // First Register the name to be renewed

    RIF.transferFrom.returns(true);
    RIF.approve.returns(true);
    RIF.transfer.returns(true);

    await PartnerRegistrar.connect(partner).register(
      NAME,
      nameOwner.address,
      SECRET(),
      DURATION,
      NodeOwner.address,
      partner.address
    );

    // Attempt to renew registered name

    RIF.transferFrom.returns(true);
    RIF.approve.returns(true);

    await expect(
      PartnerRenewer.connect(partner).renew(NAME, DURATION, partner.address)
    )
      .to.emit(PartnerRenewer, NAME_RENEWED_EVENT)
      .withArgs(partner.address, duration.years);
  });

  it('Should emit the FeeManagerSet event on successful setting of the fee manager contract', async () => {
    const { FeeManager, PartnerRenewer, alternateFeeManager } =
      await loadFixture(initialSetup);

    await expect(PartnerRenewer.setFeeManager(alternateFeeManager.address))
      .to.emit(PartnerRenewer, FEE_MANAGER_CHANGED_EVENT)
      .withArgs(PartnerRenewer.address, alternateFeeManager.address);
  });
});

describe('Price', () => {
  it("should return the price of a domain's registration", async () => {
    const { PartnerRenewer, partner } = await loadFixture(initialSetup);

    expect(
      await PartnerRenewer.price(NAME, DURATION, partner.address)
    ).to.equal(DURATION.mul(2).mul(oneRBTC));
  });
});
