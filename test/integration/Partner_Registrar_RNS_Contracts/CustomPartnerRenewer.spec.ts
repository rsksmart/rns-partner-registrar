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

describe('Custom Partner Renewer', () => {
  it('Test Case No. 1 - ... ... ...', async () => {
    //Test Case No. 1
    //User Role:                                     Regular User
    //Renewal's Number Of Steps:                     One step
    //Domain Status:                                 Ready to Be Renovate
    //MinCommitmentAge:                              Con Zero
    //Duration:                                      1 year
    //CanReveal:                                     TRUE
  }); //it

  it('Test Case No. 2 - ... ... ...', async () => {
    //Test Case No. 2
    //User Role:                                      Regular User
    //Renewal's Number Of Steps:                      Two steps
    //Domain Status:                                  Ready to Be Renovate
    //MinCommitmentAge:                               Greater than zero
    //Duration:                                       2 years
    //CanReveal:                                      TRUE
  }); //it

  it('Test Case No. 3 - ... ... ...', async () => {
    //Test Case No. 3
    //User Role:                                       Partner Reseller
    //Renewal's Number Of Steps:                       Two steps
    //Domain Status:                                   Ready to Be Renovate
    //MinCommitmentAge:                                Greater than zero
    //Duration:                                        Between 3 and 4 Years
    //CanReveal:                                       TRUE
  }); //it

  it('Test Case No. 4 - ... ... ...', async () => {
    //Test Case No. 4
    //User Role:                                       Partner Reseller
    //Renewal's Number Of Steps:                       One step
    //Domain Status:                                   Ready to Be Renovate
    //MinCommitmentAge:                                Greater than zero
    //Duration:                                        5 years
    //CanReveal:                                       TRUE
  }); //it

  it('Test Case No. 5 - ... ... ...', async () => {
    //Test Case No. 5
    //User Role:                                     RNS Owner
    //Renewal's Number Of Steps:                     One step
    //Domain Status:                                 Ready to Be Renovate
    //MinCommitmentAge:                              Con Zero
    //Duration:                                      5 years
    //CanReveal:                                     FALSE
  }); //it

  it('Test Case No. 6 - ... ... ...', async () => {
    //Test Case No. 6
    //User Role:                                    Regular User
    //Renewal's Number Of Steps:                    Two steps
    //Domain Status:                                Ready to Be Renovate
    //MinCommitmentAge:                             Con Zero
    //Duration:                                     -1 year (-)
    //CanReveal:                                     FALSE
  }); //it

  it('Test Case No. 7 - ... ... ...', async () => {
    //Test Case No. 7
    //User Role:                                   RNS Owner
    //Renewal's Number Of Steps:                   One step
    //Domain Status:                               Ready to Be Renovate
    //MinCommitmentAge:                            Greater than zero
    //Duration:                                    0 Years (-)
    //CanReveal:                                   TRUE
  }); //it

  it('Test Case No. 8 - ... ... ...', async () => {
    //Test Case No. 8
    //User Role:                                   Partner Reseller
    //Renewal's Number Of Steps:                   One step
    //Domain Status:                               Ready to Be Renovate
    //MinCommitmentAge:                            Greater than zero (-)
    //Duration:                                    1 year
    //CanReveal:                                   FALSE(-)
  }); //it

  it('Test Case No. 9 - ... ... ...', async () => {
    //Test Case No. 9
    //User Role:                                  Partner Reseller
    //Renewal's Number Of Steps:                  Two steps
    //Domain Status:                              Ready to Be Renovate
    //MinCommitmentAge:                           Con Zero (-)
    //Duration:                                   1 year
    //CanReveal:                                  TRUE
  }); //it

  it('Test Case No. 10 - ... ... ...', async () => {
    //Test Case No. 10
    //User Role:                                RNS Owner
    //Renewal's Number Of Steps:                One step
    //Domain Status:                            Expired (-)
    //MinCommitmentAge:                         Con Zero
    //Duration:                                 1 year
    //CanReveal:                                TRUE
  }); //it

  it('Test Case No. 11 - ... ... ...', async () => {
    //Test Case No. 11
    //User Role:                               RNS Owner
    //Renewal's Number Of Steps:               One step
    //Domain Status:                           Ready to Be Renovate
    //MinCommitmentAge:                        Empty (-)
    //Duration:                                1 year
    //CanReveal:                               FALSE
  }); //it

  it('Test Case No. 12 - ... ... ...', async () => {
    //Test Case No. 12
    //User Role:                              Partner Reseller
    //Renewal's Number Of Steps:              Two steps
    //Domain Status:                          Ready to Be Renovate
    //MinCommitmentAge:                       Greater than Maximum (-)
    //Duration:                               1 year
    //CanReveal:                              FALSE
  }); //it

  it('Test Case No. 13 - ... ... ...', async () => {
    //Test Case No. 13
    //User Role:                             Partner Reseller
    //Renewal's Number Of Steps:             Two steps
    //Domain Status:                         Ready to Be Renovate
    //MinCommitmentAge:                      Negative Numbers (-)
    //Duration:                              1 year
    //CanReveal:                             FALSE
  }); //it

  it('Test Case No. 14 - ... ... ...', async () => {
    //Test Case No. 14
    //User Role:                             Regular User
    //Renewal's Number Of Steps:             One step
    //Domain Status:                         Recent Purchased (-)
    //MinCommitmentAge:                      Greater than zero
    //Duration:                              1 year
    //CanReveal:                             TRUE
  }); //it

  it('Test Case No. 15 - ... ... ...', async () => {
    //Test Case No. 15
    //User Role:                            Regular User
    //Renewal's Number Of Steps:            Two steps
    //Domain Status:                        Ready to Be Renovate
    //MinCommitmentAge:                     Greater than zero
    //Duration:                             Between 3 and 4 Years
    //CanReveal:                            TRUE
  }); //it

  it('Test Case No. 16 - ... ... ...', async () => {
    //Test Case No. 16
    //User Role:                           Regular User
    //Renewal's Number Of Steps:           One step
    //Domain Status:                       Ready to Be Renovate
    //MinCommitmentAge:                    Greater than zero
    //Duration:                            2 years
    //CanReveal:                           TRUE
  }); //it "
}); //describe
