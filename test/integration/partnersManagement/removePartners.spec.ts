import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import {
  ADDRESS_ZERO,
  INVALID_ADDRESS_ERR,
  PARTNER_REMOVED_EVENT,
} from 'test/utils/constants.utils';
import { initialSetup } from '../utils/initialSetup';

describe('Partners Management - Remove Partner', () => {
  it('Test Case No. 1 - should remove a previously added partner', async () => {
    //Test Case No. 1
    //User Role (LogIn):                   RNS Owner
    //Type Of Account To Remove:           Partner Reseller

    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);

    const partnerAddress = notWhitelistedPartner.address;

    await expect(PartnerManager.isPartner(partnerAddress)).to.eventually.be
      .false;
    //add partner
    await (
      await PartnerManager.addPartner(
        partnerAddress,
        PartnerConfiguration.address
      )
    ).wait();

    await expect(PartnerManager.isPartner(partnerAddress)).to.eventually.be
      .true;
    //remove partner
    await expect(PartnerManager.removePartner(partnerAddress))
      .to.emit(PartnerManager, PARTNER_REMOVED_EVENT)
      .withArgs(partnerAddress);

    await expect(PartnerManager.isPartner(partnerAddress)).to.eventually.be
      .false;

    await expect(
      PartnerManager.getPartnerConfiguration(partnerAddress)
    ).to.eventually.eq(ADDRESS_ZERO);
  }); //it

  it('Test Case No. 2 - it should allow the fulfillment of a removal transaction even tho the partner was not whitelisted', async () => {
    //Test Case No. 2
    //User Role (LogIn):                   RNS Owner
    //Type Of Account To Remove:           Regular User
    const { notWhitelistedPartner, PartnerManager } = await loadFixture(
      initialSetup
    );

    const partnerAddress = notWhitelistedPartner.address;

    await expect(PartnerManager.isPartner(partnerAddress)).to.eventually.be
      .false;

    //remove non whitelisted partner
    await expect(PartnerManager.removePartner(partnerAddress))
      .to.emit(PartnerManager, PARTNER_REMOVED_EVENT)
      .withArgs(partnerAddress);

    await expect(PartnerManager.isPartner(partnerAddress)).to.eventually.be
      .false;

    await expect(
      PartnerManager.getPartnerConfiguration(partnerAddress)
    ).to.eventually.eq(ADDRESS_ZERO);
  }); //it

  it('Test Case No. 3 - should revert given that an empty address was provided', async () => {
    //Test Case No. 3
    //User Role (LogIn):                    RNS Owner
    //Type Of Account To Remove:            NO One - Empty (-)

    const { PartnerManager } = await loadFixture(initialSetup);

    await expect(
      PartnerManager.removePartner('')
    ).to.eventually.be.rejectedWith(INVALID_ADDRESS_ERR);
  }); //it "
}); //describe
