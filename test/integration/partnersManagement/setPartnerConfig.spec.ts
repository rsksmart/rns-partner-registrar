import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import {
  ADDRESS_ZERO,
  INVALID_ADDRESS_ERR,
  INVALID_PARTNER_CONFIGURATION_ERR,
  INVALID_PARTNER_ERR,
  PARTNER_CONFIGURATION_CHANGED_EVENT,
} from 'test/utils/constants.utils';
import { partnerConfiguration } from 'typechain-types/contracts';
import { initialSetup } from '../utils/initialSetup';

describe('Partners Management - Add and replace partner config', () => {
  it('Test Case No. 1 - should allow changing a partner configuration contract', async () => {
    //Test Case No. 1
    //User Role (LogIn):                           RNS Owner
    //User Type (Of The New Account to Add):       Partner Reseller (White List)

    const {
      notWhitelistedPartner,
      PartnerConfiguration,
      PartnerManager,
      alternatePartnerConfiguration,
    } = await loadFixture(initialSetup);
    const notWhitelistedPartnerAddress = notWhitelistedPartner.address;

    const isPartner = await PartnerManager.isPartner(
      notWhitelistedPartnerAddress
    );

    expect(isPartner).to.be.false;

    let partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartnerAddress
    );

    expect(partnerConfiguration).to.be.equal(ADDRESS_ZERO);

    await (
      await PartnerManager.addPartner(
        notWhitelistedPartnerAddress,
        PartnerConfiguration.address
      )
    ).wait();

    partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartnerAddress
    );

    expect(partnerConfiguration).to.be.equal(PartnerConfiguration.address);

    expect(
      PartnerManager.setPartnerConfiguration(
        notWhitelistedPartnerAddress,
        alternatePartnerConfiguration.address
      )
    )
      .to.emit(PartnerManager, PARTNER_CONFIGURATION_CHANGED_EVENT)
      .withArgs(
        notWhitelistedPartnerAddress,
        alternatePartnerConfiguration.address
      );

    partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartnerAddress
    );

    expect(partnerConfiguration).to.be.equal(
      alternatePartnerConfiguration.address
    );
  }); //it

  it('Test Case No. 2 - should reject adding a configuration for a partner that is not whitelisted', async () => {
    //Test Case No. 2
    //User Role (LogIn):                           RNS Owner
    //User Type (Of The New Account to Add):       Partner Account (NOT White List)
    const { notWhitelistedPartner, PartnerManager, PartnerConfiguration } =
      await loadFixture(initialSetup);
    const notWhitelistedPartnerAddress = notWhitelistedPartner.address;

    expect(
      PartnerManager.setPartnerConfiguration(
        notWhitelistedPartnerAddress,
        PartnerConfiguration.address
      )
    ).to.eventually.be.rejectedWith(INVALID_PARTNER_ERR);
  }); //it

  it('Test Case No. 3 - should reject setting a partner configuration with an empty address', async () => {
    //Test Case No. 3
    //User Role (LogIn):                           RNS Owner
    //User Type (Of The New Account to Add):       Empty Account (-)

    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);
    const notWhitelistedPartnerAddress = notWhitelistedPartner.address;

    await (
      await PartnerManager.addPartner(
        notWhitelistedPartnerAddress,
        PartnerConfiguration.address
      )
    ).wait();

    expect(
      PartnerManager.setPartnerConfiguration(notWhitelistedPartnerAddress, '')
    ).to.eventually.be.rejectedWith(INVALID_ADDRESS_ERR);
  }); //it

  it('Test Case No. 4 - should reject setting a partner configuration with a ZERO address', async () => {
    //Test Case No. 4
    //User Role (LogIn):                           RNS Owner
    //User Type (Of The New Account to Add):       ZERO address account

    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);
    const notWhitelistedPartnerAddress = notWhitelistedPartner.address;

    await (
      await PartnerManager.addPartner(
        notWhitelistedPartnerAddress,
        PartnerConfiguration.address
      )
    ).wait();

    expect(
      PartnerManager.setPartnerConfiguration(
        notWhitelistedPartnerAddress,
        ADDRESS_ZERO
      )
    ).to.eventually.be.rejectedWith(INVALID_PARTNER_CONFIGURATION_ERR);
  }); //it
}); //describe
