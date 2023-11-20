import { initialSetup } from './utils/initialSetup';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import {
  OneYearDuration,
  NAME,
  tldNode,
  SECRET,
  LABEL,
} from './utils/constants';
import { expect } from 'chai';
import {
  getMultiRegisterData,
  getMultiRenewData,
  getRenewData,
  oneRBTC,
} from '../utils/mock.utils';
import { namehash } from 'ethers/lib/utils';

describe('Multi TLD Partner Renewer (Integration)', () => {
  it('should return the price', async () => {
    const { MultiTLDPartnerRenewer, partner } = await loadFixture(initialSetup);

    const price = await MultiTLDPartnerRenewer.price(
      NAME,
      OneYearDuration,
      partner.address,
      tldNode
    );
    expect(price).to.be.equal(oneRBTC.mul(2));
  });

  it('should allow to renew an existing registered domain', async () => {
    const {
      RIF,
      nameOwner,
      MultiTLDPartnerRegistrar,
      NodeOwner,
      partner,
      Resolver,
      MultiTLDPartnerRenewer,
    } = await loadFixture(initialSetup);

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

    const currentDate = new Date();

    const expirationTime = await NodeOwner.expirationTime(LABEL);

    const expirationDate = new Date(+expirationTime * 1000);
    currentDate.setFullYear(currentDate.getFullYear() + 1); // plus a year
    currentDate.setDate(currentDate.getDate() - 1); // less a day

    // current date plus a year minus a day is the expiration date of the domain
    expect(currentDate.toLocaleDateString('en-US')).to.equal(
      expirationDate.toLocaleDateString('en-US')
    );

    const renewData = getMultiRenewData(
      NAME,
      OneYearDuration,
      partner.address,
      tldNode
    );

    await (
      await RIF.connect(nameOwner).transferAndCall(
        MultiTLDPartnerRenewer.address,
        oneRBTC.mul(2),
        renewData
      )
    ).wait();

    const expirationTimeAfter = await NodeOwner.expirationTime(LABEL);
    const expirationDateAfter = new Date(+expirationTimeAfter * 1000);
    currentDate.setFullYear(currentDate.getFullYear() + 1); // plus an extra year

    // current date plus two years minus a day is the new expiration date of the domain
    expect(currentDate.toLocaleDateString('en-US')).to.equal(
      expirationDateAfter.toLocaleDateString('en-US')
    );
  });

  it('should revert if data is too short', async () => {
    const {
      RIF,
      nameOwner,
      MultiTLDPartnerRegistrar,
      partner,
      MultiTLDPartnerRenewer,
    } = await loadFixture(initialSetup);

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

    await (
      await RIF.connect(nameOwner).transferAndCall(
        MultiTLDPartnerRegistrar.address,
        namePrice,
        data
      )
    ).wait();

    const renewData = getRenewData(NAME, OneYearDuration, partner.address);

    await expect(
      RIF.connect(nameOwner).transferAndCall(
        MultiTLDPartnerRenewer.address,
        oneRBTC.mul(2),
        renewData
      )
    )
      .to.be.revertedWithCustomError(MultiTLDPartnerRenewer, 'CustomError')
      .withArgs('Invalid data');
  });
});
