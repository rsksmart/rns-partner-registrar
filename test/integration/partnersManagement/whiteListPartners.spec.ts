import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  SECRET,
  MINIMUM_DOMAIN_NAME_LENGTH,
  MAXIMUM_DOMAIN_NAME_LENGTH,
} from '../utils/constants';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  calculateNamePriceByDuration,
  purchaseDomainUsingTransferAndCallWithoutCommit,
  nameToTokenId,
} from '../utils/operations';
import { PartnerRegistrar, NodeOwner } from 'typechain-types';
import { namehash } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import {
  INVALID_ADDRESS_ERR,
  PARTNER_ALREADY_EXISTS,
} from '../../utils/constants.utils';

describe('Partners Management - Creation and White List Partner', () => {
  it('Test Case No. 1 - should whitelist a partner and set its configuration', async () => {
    //Test Case No. 1
    //User Role (LogIn):                           RNS Owner
    //User Type (Of The New Account to Add):       Partner Reseller
    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);

    let isPartner = await PartnerManager.isPartner(
      notWhitelistedPartner.address
    );

    expect(isPartner).to.be.false;

    let partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartner.address
    );

    expect(partnerConfiguration).to.be.equal(ethers.constants.AddressZero);

    await (
      await PartnerManager.addPartner(
        notWhitelistedPartner.address,
        PartnerConfiguration.address
      )
    ).wait();

    partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartner.address
    );

    isPartner = await PartnerManager.isPartner(notWhitelistedPartner.address);

    expect(isPartner).to.be.true;

    expect(partnerConfiguration).to.be.equal(PartnerConfiguration.address);
  });

  it('Test Case No. 2 - should revert if the same partner is added more than once', async () => {
    //Test Case No. 2
    //User Role (LogIn):                         RNS Owner
    //User Type (Of the New Account to Add):     Partner Reseller

    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);

    const isPartner = await PartnerManager.isPartner(
      notWhitelistedPartner.address
    );

    expect(isPartner).to.be.false;

    const partnerConfiguration = await PartnerManager.getPartnerConfiguration(
      notWhitelistedPartner.address
    );

    expect(partnerConfiguration).to.be.equal(ethers.constants.AddressZero);

    await expect(
      PartnerManager.addPartner(
        notWhitelistedPartner.address,
        PartnerConfiguration.address
      )
    ).to.eventually.be.fulfilled;
    //add it a second time
    await expect(
      PartnerManager.addPartner(
        notWhitelistedPartner.address,
        PartnerConfiguration.address
      )
    ).to.eventually.rejectedWith(PARTNER_ALREADY_EXISTS);
  });

  it('Test Case No. 3 - should be rejected given that an invalid address was set as a partner account', async () => {
    //Test Case No. 3
    //User Role (LogIn):                          RNS Owner
    //User Type (Of the New Account to Add):      NO One - Empty (-)
    const { notWhitelistedPartner, PartnerConfiguration, PartnerManager } =
      await loadFixture(initialSetup);

    await expect(
      PartnerManager.addPartner('', PartnerConfiguration.address)
    ).to.eventually.be.rejectedWith(INVALID_ADDRESS_ERR);
  }); //it
}); //describe
