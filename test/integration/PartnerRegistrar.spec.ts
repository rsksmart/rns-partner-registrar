import { initialSetup } from './utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  OneYearDuration,
  FEE_PERCENTAGE,
  LABEL,
  NAME,
  SECRET,
} from './utils/constants';
import { ONLY_RIF_TOKEN_ERR } from '../utils/constants.utils';
import {
  calculatePercentageWPrecision,
  getAddrRegisterData,
  getRenewData,
  oneRBTC,
} from 'test/utils/mock.utils';
import { expect } from 'chai';
import { namehash } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { deployContract } from '../../utils/deployment.utils';
import { PartnerConfiguration } from 'typechain-types';

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
      SECRET(),
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

  it('Should return user funds if the discount is 100% (register/renew)', async () => {
    const {
      RIF,
      nameOwner,
      PartnerRegistrar,
      PartnerRenewer,
      partner,
      PartnerManager,
      accessControl,
    } = await loadFixture(initialSetup);

    const { contract: PartnerConfiguration } =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        accessControl: accessControl.address,
        minLength: 5,
        maxLength: 20,
        minDuration: 1,
        maxDuration: 5,
        feePercentage: FEE_PERCENTAGE,
        discount: oneRBTC.mul(100),
        minCommitmentAge: 0,
      });

    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        PartnerConfiguration.address
      )
    ).wait();

    const registerData = getAddrRegisterData(
      NAME,
      nameOwner.address,
      SECRET(),
      OneYearDuration,
      nameOwner.address,
      partner.address
    );

    const renewData = getRenewData(NAME, OneYearDuration, partner.address);

    const prevBalance = await RIF.balanceOf(nameOwner.address);

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerRegistrar.address,
        BigNumber.from(1),
        registerData
      )
    ).wait();

    const currentBalance = await RIF.balanceOf(nameOwner.address);

    expect(currentBalance.eq(prevBalance)).to.be.true;

    await (
      await RIF.connect(nameOwner).transferAndCall(
        PartnerRenewer.address,
        BigNumber.from(1),
        renewData
      )
    ).wait();

    expect(currentBalance.eq(prevBalance)).to.be.true;
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
      SECRET(),
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
    )
      .to.be.revertedWithCustomError(PartnerRegistrar, 'CustomError')
      .withArgs(ONLY_RIF_TOKEN_ERR);
  });

  it('Should revert if token transfer approval fails', async () => {
    const { RIF, nameOwner, PartnerRegistrar, partner, NodeOwner, FeeManager } =
      await loadFixture(initialSetup);

    RIF.transferFrom.returns(true);
    RIF.approve.returns(false);

    const namePrice = await PartnerRegistrar.price(
      'cheta',
      0,
      OneYearDuration,
      partner.address
    );

    await expect(
      PartnerRegistrar.register(
        'cheta',
        nameOwner.address,
        SECRET(),
        OneYearDuration,
        NodeOwner.address,
        partner.address
      )
    )
      .to.be.revertedWithCustomError(PartnerRegistrar, 'TokenApprovalFailed')
      .withArgs(RIF.address, FeeManager.address, namePrice);
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
    const secret = SECRET();
    const commitment = await PartnerRegistrar.connect(nameOwner).makeCommitment(
      LABEL,
      nameOwner.address,
      secret,
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
      secret,
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
