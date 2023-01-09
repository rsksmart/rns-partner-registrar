import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, Factory } from '../../utils/deployment.utils';
import { deployContract as deployContractAsMock } from '../utils/mock.utils';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
  oneRBTC,
} from '../utils/mock.utils';
import { NodeOwner } from 'typechain-types';
import { PartnerManager } from 'typechain-types';
import { PartnerRegistrar } from 'typechain-types';
import { ERC677Token__factory } from 'typechain-types';
import { expect } from 'chai';
import { IFeeManager } from 'typechain-types';
import NodeOwnerAbi from '../external-abis/NodeOwner.json';
import RNSAbi from '../external-abis/RNS.json';
import ResolverAbi from '../external-abis/ResolverV1.json';
import { ERC677Token } from 'typechain-types';
import { PartnerConfiguration } from 'typechain-types';
import { Resolver } from 'typechain-types';
import { RNS } from 'typechain-types';
import { PartnerRenewer } from 'typechain-types';
import { keccak256, toUtf8Bytes, namehash } from 'ethers/lib/utils';

const SECRET = keccak256(toUtf8Bytes('1234'));
const NAME = 'cheta👀aa';
const LABEL = keccak256(toUtf8Bytes(NAME));
const DURATION = ethers.BigNumber.from('1');
const FEE_PERCENTAGE = oneRBTC.mul(25); //5%
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
      minCommitmentAge: 0,
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

  await (await RNS.setDefaultResolver(Resolver.address)).wait();

  await (await NodeOwner.setRootResolver(Resolver.address)).wait();

  await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();

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
  await (await FakeRIF.transfer(nameOwner.address, oneRBTC.mul(10))).wait();

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
    partnerOwnerAccount,
    nameOwner,
    signers,
    pool,
    partner,
  };
};

describe('New Domain Registration (Integration)', () => {
  it('Should register a new domain for a partnerOwnerAccount with 0 minCommitmentAge', async () => {
    const {
      RIF,
      Resolver,
      nameOwner,
      FeeManager,
      PartnerRegistrar,
      pool,
      partnerOwnerAccount,
      partner,
    } = await loadFixture(initialSetup);
    const namePrice = await PartnerRegistrar.price(
      NAME,
      0,
      DURATION,
      partner.address
    );

    const data = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
      DURATION,
      nameOwner.address,
      partner.address
    );

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerRegistrar.address,
        namePrice,
        data
      )
    ).wait();

    const resolvedName = await Resolver['addr(bytes32)'](
      namehash(NAME + '.rsk')
    );
    expect(resolvedName).to.equal(nameOwner.address);

    const feeManagerBalance = await RIF.balanceOf(FeeManager.address);
    const expectedManagerBalance = calculatePercentageWPrecision(
      namePrice,
      FEE_PERCENTAGE
    );

    expect(+expectedManagerBalance).to.equal(+feeManagerBalance);

    const poolBalance = await RIF.balanceOf(pool.address);

    const expectedPoolBalance = namePrice.sub(expectedManagerBalance);

    expect(+poolBalance).to.equal(+expectedPoolBalance);

    const partnerBalanceInFeeManager = await FeeManager.getBalance(
      partnerOwnerAccount.address
    );
    const expectedPartnerAccountBalance = expectedManagerBalance; //since it is the only operation...
    expect(+partnerBalanceInFeeManager).to.equal(
      +expectedPartnerAccountBalance
    );
  });

  it('Should revert if not RIF token', async () => {
    const { FakeRIF, nameOwner, PartnerRegistrar, partner } = await loadFixture(
      initialSetup
    );
    const namePrice = await PartnerRegistrar.price(
      NAME,
      0,
      DURATION,
      partner.address
    );

    const data = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
      DURATION,
      nameOwner.address,
      partner.address
    );

    await expect(
      FakeRIF.connect(nameOwner).transferAndCall(
        PartnerRegistrar.address,
        namePrice,
        data
      )
    ).to.be.revertedWith('Only RIF token');
  });

  it('Should revert if token transfer approval fails', async () => {
    const {
      RIF,
      nameOwner,
      PartnerRegistrar,
      partner,
      PartnerManager,
      PartnerConfiguration,
      NodeOwner,
    } = await loadFixture(initialSetup);
    await (
      await PartnerManager.addPartner(partner.address, partner.address)
    ).wait();

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        PartnerConfiguration.address
      )
    ).wait();

    RIF.transferFrom.returns(true);
    RIF.approve.returns(false);

    await expect(
      PartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET,
        DURATION,
        NodeOwner.address,
        partner.address
      )
    ).to.be.revertedWith('Token approval failed');
  });

  it('Should register a new domain for a partnerOwnerAccount with a non 0 minCommitmentAge', async () => {
    const {
      RIF,
      Resolver,
      nameOwner,
      FeeManager,
      PartnerRegistrar,
      pool,
      PartnerConfiguration,
      partner,
    } = await loadFixture(initialSetup);
    const namePrice = await PartnerRegistrar.price(
      NAME,
      0,
      DURATION,
      partner.address
    );

    // set minCommitmentAge of partner so as not skip the commit step in the registration flow
    await (await PartnerConfiguration.setMinCommitmentAge(1)).wait();

    const commitment = await PartnerRegistrar.connect(nameOwner).makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET,
      DURATION,
      nameOwner.address
    );

    await (
      await PartnerRegistrar.connect(nameOwner).commit(
        commitment,
        partner.address
      )
    ).wait();

    await time.increase(1);

    const canReveal = await PartnerRegistrar.connect(nameOwner).canReveal(
      commitment
    );

    expect(canReveal).to.be.true;

    const data = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
      DURATION,
      nameOwner.address,
      partner.address
    );

    RIF.approve.returns(true);

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerRegistrar.address,
        namePrice,
        data
      )
    ).wait();

    const resolvedName = await Resolver['addr(bytes32)'](
      namehash(NAME + '.rsk')
    );
    expect(resolvedName).to.equal(nameOwner.address);

    const feeManagerBalance = await RIF.balanceOf(FeeManager.address);
    const expectedManagerBalance = calculatePercentageWPrecision(
      namePrice,
      FEE_PERCENTAGE
    );

    expect(+expectedManagerBalance).to.equal(+feeManagerBalance);

    const poolBalance = await RIF.balanceOf(pool.address);

    const expectedPoolBalance = namePrice.sub(expectedManagerBalance);

    expect(+poolBalance).to.equal(+expectedPoolBalance);
  });
});
