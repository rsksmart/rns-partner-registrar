import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
  getRenewData,
  oneRBTC,
} from '../utils/mock.utils';
import { NodeOwner } from 'typechain-types';
import { PartnerManager } from 'typechain-types';
import { PartnerRegistrar } from 'typechain-types';
import { expect } from 'chai';
import { IFeeManager } from '../../typechain-types/contracts/FeeManager/IFeeManager';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677Token } from 'typechain-types/contracts/test-utils';
import { PartnerConfiguration } from 'typechain-types';
import { Resolver } from 'typechain-types';
import { RNS } from 'typechain-types';
import { PartnerRenewer } from 'typechain-types';
import { keccak256, toUtf8Bytes, namehash } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

const SECRET = keccak256(toUtf8Bytes('1234'));
const NAME = 'cheta👀aa';
const LABEL = keccak256(toUtf8Bytes(NAME));
const DURATION = ethers.BigNumber.from('1');
const FEE_PERCENTAGE = oneRBTC.mul(5); //5%
const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = ethers.utils.id('rsk');

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner = signers[0];
  const partnerOwnerAccount = signers[0];
  const nameOwner = signers[2];
  const pool = signers[3];

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

  const { contract: RIF } = await deployContract<ERC677Token>('ERC677Token', {
    beneficiary: owner.address,
    initialAmount: oneRBTC.mul(100000000000000),
    tokenName: 'ERC677',
    tokenSymbol: 'MOCKCOIN',
  });

  const { contract: FakeRIF } = await deployContract<ERC677Token>(
    'ERC677Token',
    {
      beneficiary: owner.address,
      initialAmount: oneRBTC.mul(100000000000000),
      tokenName: 'ERC677',
      tokenSymbol: 'MOCKCOIN',
    }
  );

  const { contract: PartnerManager } = await deployContract<PartnerManager>(
    'PartnerManager',
    {}
  );

  const { contract: PartnerConfiguration } =
    await deployContract<PartnerConfiguration>('PartnerConfiguration', {
      minLength: 5,
      maxLength: 20,
      isUnicodeSupported: false,
      minDuration: 1,
      maxDuration: 5,
      feePercentage: FEE_PERCENTAGE,
      discount: 0,
      minCommitmentAge: 1,
    });

  const { contract: PartnerRegistrar } = await deployContract<PartnerRegistrar>(
    'PartnerRegistrar',
    {
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
  };
};

describe('Domain Renewal', () => {
  it('Should revert with `Name already expired`', async () => {
    const { RIF, PartnerRegistrar, PartnerRenewer, partner } =
      await loadFixture(initialSetup);
    const namePrice = await PartnerRegistrar['price(string,uint256,uint256)'](
      NAME,
      ethers.BigNumber.from(0),
      DURATION
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

    const namePrice = await PartnerRegistrar['price(string,uint256,uint256)'](
      NAME,
      0,
      DURATION
    );

    const partnerRegistrarAsNameOwner = PartnerRegistrar.connect(nameOwner);

    const commitment = await partnerRegistrarAsNameOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    await (
      await partnerRegistrarAsNameOwner['commit(bytes32,address)'](
        commitment,
        partner.address
      )
    ).wait();

    const registerData = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
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

    const namePrice = await PartnerRegistrar['price(string,uint256,uint256)'](
      NAME,
      0,
      DURATION
    );

    const partnerRegistrarAsNameOwner = PartnerRegistrar.connect(nameOwner);

    const commitment = await partnerRegistrarAsNameOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    await (
      await partnerRegistrarAsNameOwner['commit(bytes32,address)'](
        commitment,
        partner.address
      )
    ).wait();

    const registerData = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
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

    const namePrice = await PartnerRegistrar['price(string,uint256,uint256)'](
      NAME,
      0,
      DURATION
    );

    const partnerRegistrarAsNameOwner = PartnerRegistrar.connect(nameOwner);

    const commitment = await partnerRegistrarAsNameOwner.makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET
    );

    await (
      await partnerRegistrarAsNameOwner['commit(bytes32,address)'](
        commitment,
        partner.address
      )
    ).wait();

    const registerData = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
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
});
