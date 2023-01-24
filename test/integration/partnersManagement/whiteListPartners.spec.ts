import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  INVALID_ADDRESS_ERR,
  PARTNER_ADDED_EVENT,
  PARTNER_ALREADY_EXISTS,
} from '../../utils/constants.utils';
import { initialSetup } from '../utils/initialSetup';

describe('Partners Management - Creation and White List Partner', () => {
  it('Test Case No. 1 - should whitelist a partner and set its configuration', async () => {
    //Test Case No. 1
    //User Role (LogIn):                           RNS Owner
    //User Type (Of The New Account to Add):       Partner Reseller
    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);
    const notWhitelistedPartnerAddress = notWhitelistedPartner.address;

    let isPartner = await PartnerManager.isPartner(
      notWhitelistedPartnerAddress
    );

    expect(isPartner).to.be.false;

    let partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartnerAddress
    );

    expect(partnerConfiguration).to.be.equal(ethers.constants.AddressZero);

    await expect(
      PartnerManager.addPartner(
        notWhitelistedPartnerAddress,
        PartnerConfiguration.address
      )
    )
      .to.emit(PartnerManager, PARTNER_ADDED_EVENT)
      .withArgs(notWhitelistedPartnerAddress, PartnerConfiguration.address);

    partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartnerAddress
    );

    isPartner = await PartnerManager.isPartner(notWhitelistedPartnerAddress);

    expect(isPartner).to.be.true;

    expect(partnerConfiguration).to.be.equal(PartnerConfiguration.address);
  });

  it('Test Case No. 2 - should revert if the same partner is added more than once', async () => {
    //Test Case No. 2
    //User Role (LogIn):                         RNS Owner
    //User Type (Of the New Account to Add):     Partner Reseller

    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);
    const notWhitelistedPartnerAddress = notWhitelistedPartner.address;
    const isPartner = await PartnerManager.isPartner(
      notWhitelistedPartnerAddress
    );

    expect(isPartner).to.be.false;

    const partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartnerAddress
    );

    expect(partnerConfiguration).to.be.equal(ethers.constants.AddressZero);

    await expect(
      PartnerManager.addPartner(
        notWhitelistedPartnerAddress,
        PartnerConfiguration.address
      )
    ).to.eventually.be.fulfilled;
    //add it a second time
    await expect(
      PartnerManager.addPartner(
        notWhitelistedPartnerAddress,
        PartnerConfiguration.address
      )
    ).to.eventually.rejectedWith(PARTNER_ALREADY_EXISTS);
  });

  it('Test Case No. 3 - should be rejected given that an invalid address was set as a partner account', async () => {
    //Test Case No. 3
    //User Role (LogIn):                          RNS Owner
    //User Type (Of the New Account to Add):      NO One - Empty (-)
    const { PartnerConfiguration, PartnerManager } = await loadFixture(
      initialSetup
    );

    await expect(
      PartnerManager.addPartner('', PartnerConfiguration.address)
    ).to.eventually.be.rejectedWith(INVALID_ADDRESS_ERR);
  }); //it
}); //describe
