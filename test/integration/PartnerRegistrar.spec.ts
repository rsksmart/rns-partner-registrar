import { initialSetup } from './utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  OneYearDuration,
  FEE_PERCENTAGE,
  LABEL,
  NAME,
  SECRET,
} from './utils/constants';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
} from 'test/utils/mock.utils';
import { expect } from 'chai';
import { namehash } from 'ethers/lib/utils';

describe('New Domain Registration (Integration)', () => {
  it('Should register a new domain for a partnerOwnerAccount with 0 minCommitmentAge', async () => {
    const {
      RIF,
      Resolver,
      nameOwner,
      FeeManager,
      PartnerRegistrar,
      pool,
      partner,
    } = await loadFixture(initialSetup);
    const namePrice = await PartnerRegistrar.price(
      NAME,
      0,
      OneYearDuration,
      partner.address
    );

    const data = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
      OneYearDuration,
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
      partner.address
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
      OneYearDuration,
      partner.address
    );

    const data = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET,
      OneYearDuration,
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
      alternatePartnerConfiguration,
    } = await loadFixture(initialSetup);

    RIF.transferFrom.returns(true);
    RIF.approve.returns(false);

    await expect(
      PartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET,
        OneYearDuration,
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
      OneYearDuration,
      partner.address
    );

    // set minCommitmentAge of partner so as not skip the commit step in the registration flow
    await (await PartnerConfiguration.setMinCommitmentAge(1)).wait();

    const commitment = await PartnerRegistrar.connect(nameOwner).makeCommitment(
      LABEL,
      nameOwner.address,
      SECRET,
      OneYearDuration,
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
      OneYearDuration,
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
