import { initialSetup } from './utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  OneYearDuration,
  FEE_PERCENTAGE,
  NAME,
  LABEL,
  SECRET,
  tldNode,
  sovrynTldNode,
} from './utils/constants';
import {
  calculatePercentageWPrecision,
  getMultiRegisterData,
  oneRBTC,
} from 'test/utils/mock.utils';
import { expect } from 'chai';
import { namehash } from 'ethers/lib/utils';
import { ONLY_RIF_TOKEN_ERR } from '../utils/constants.utils';

describe('MultiTLD New Domain Registration (Integration)', () => {
  it('Should register a new domain for a partnerOwnerAccount with 0 minCommitmentAge', async () => {
    const {
      RIF,
      Resolver,
      nameOwner,
      FeeManager,
      MultiTLDPartnerRegistrar,
      pool,
      partner,
    } = await loadFixture(initialSetup);

    console.log('a');
    const namePrice = await MultiTLDPartnerRegistrar.price(
      NAME,
      0,
      OneYearDuration,
      partner.address
    );
    console.log('b');

    const data = getMultiRegisterData(
      NAME,
      nameOwner.address,
      SECRET(),
      OneYearDuration,
      nameOwner.address,
      partner.address,
      tldNode
    );
    console.log('c');

    await (
      await RIF.connect(nameOwner).transferAndCall(
        MultiTLDPartnerRegistrar.address,
        namePrice,
        data
      )
    ).wait();
    console.log('d');
    const resolvedName = await Resolver['addr(bytes32)'](
      namehash(NAME + '.rsk')
    );
    expect(resolvedName).to.equal(nameOwner.address);

    const feeManagerBalance = await RIF.balanceOf(FeeManager.address);
    const expectedManagerBalance = calculatePercentageWPrecision(
      namePrice,
      FEE_PERCENTAGE
    );
    console.log('f');

    expect(+expectedManagerBalance).to.equal(+feeManagerBalance);

    const poolBalance = await RIF.balanceOf(pool.address);

    const expectedPoolBalance = namePrice.sub(expectedManagerBalance);

    expect(+poolBalance).to.equal(+expectedPoolBalance);

    const partnerBalanceInFeeManager = await FeeManager.getBalance(
      partner.address
    );
    const expectedPartnerAccountBalance = expectedManagerBalance;
    expect(+partnerBalanceInFeeManager).to.equal(
      +expectedPartnerAccountBalance
    );

    const sovrynData = getMultiRegisterData(
      NAME,
      nameOwner.address,
      SECRET(),
      OneYearDuration,
      nameOwner.address,
      partner.address,
      sovrynTldNode
    );

    await (
      await RIF.connect(nameOwner).transferAndCall(
        MultiTLDPartnerRegistrar.address,
        namePrice,
        sovrynData
      )
    ).wait();
    const resolvedSovrynName = await Resolver['addr(bytes32)'](
      namehash(NAME + '.sovryn')
    );
    expect(resolvedSovrynName).to.equal(nameOwner.address);
  });

  it('Should revert if not RIF token', async () => {
    const { FakeRIF, nameOwner, MultiTLDPartnerRegistrar, partner } =
      await loadFixture(initialSetup);

    await (await FakeRIF.transfer(nameOwner.address, oneRBTC.mul(10))).wait();
    const namePrice = await MultiTLDPartnerRegistrar.price(
      NAME,
      0,
      OneYearDuration,
      partner.address
    );

    const data = getMultiRegisterData(
      NAME,
      nameOwner.address,
      SECRET(),
      OneYearDuration,
      nameOwner.address,
      partner.address,
      tldNode
    );

    await expect(
      FakeRIF.connect(nameOwner).transferAndCall(
        MultiTLDPartnerRegistrar.address,
        namePrice,
        data
      )
    )
      .to.be.revertedWithCustomError(MultiTLDPartnerRegistrar, 'CustomError')
      .withArgs(ONLY_RIF_TOKEN_ERR);
  });

  it.skip('Should revert if token transfer approval fails', async () => {
    const {
      RIF,
      nameOwner,
      MultiTLDPartnerRegistrar,
      partner,
      NodeOwner,
      FeeManager,
    } = await loadFixture(initialSetup);

    // RIF.transferFrom.returns(true);
    // RIF.approve.returns(false);

    const namePrice = await MultiTLDPartnerRegistrar.price(
      'cheta',
      0,
      OneYearDuration,
      partner.address
    );

    await expect(
      MultiTLDPartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET(),
        OneYearDuration,
        NodeOwner.address,
        partner.address,
        tldNode
      )
    )
      .to.be.revertedWithCustomError(
        MultiTLDPartnerRegistrar,
        'TokenApprovalFailed'
      )
      .withArgs(RIF.address, FeeManager.address, namePrice);
  });

  it('Should register a new domain for a partnerOwnerAccount with a non 0 minCommitmentAge', async () => {
    const {
      RIF,
      Resolver,
      nameOwner,
      FeeManager,
      PartnerConfiguration,
      pool,
      MultiTLDPartnerRegistrar,
      partner,
    } = await loadFixture(initialSetup);
    const namePrice = await MultiTLDPartnerRegistrar.price(
      NAME,
      0,
      OneYearDuration,
      partner.address
    );

    // set minCommitmentAge of partner so as not skip the commit step in the registration flow
    await (await PartnerConfiguration.setMinCommitmentAge(1)).wait();
    const secret = SECRET();
    const commitment = await MultiTLDPartnerRegistrar.connect(
      nameOwner
    ).makeCommitment(
      LABEL,
      nameOwner.address,
      secret,
      OneYearDuration,
      nameOwner.address,
      tldNode
    );

    await (
      await MultiTLDPartnerRegistrar.connect(nameOwner).commit(
        commitment,
        partner.address
      )
    ).wait();

    await time.increase(1);

    const canReveal = await MultiTLDPartnerRegistrar.connect(
      nameOwner
    ).canReveal(commitment);

    expect(canReveal).to.be.true;

    const data = getMultiRegisterData(
      NAME,
      nameOwner.address,
      secret,
      OneYearDuration,
      nameOwner.address,
      partner.address,
      tldNode
    );

    // RIF.approve.returns(true);

    await (
      await RIF.connect(nameOwner).transferAndCall(
        MultiTLDPartnerRegistrar.address,
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
