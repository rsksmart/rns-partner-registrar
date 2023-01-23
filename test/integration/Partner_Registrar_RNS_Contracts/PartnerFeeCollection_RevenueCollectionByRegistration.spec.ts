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

describe('Partner Fee Collection - Revenue Collection By Registration & Balance Check', () => {
  it('Test Case No. 1 - ... ... ...', async () => {
    //Test Case No. 1
    //User Role (Who'll Purchase a Name):    RNS Owner
    //User Role (Who'll Receive The Profit:  Partner
    //Domain Name Characters:                Only Letters
    //Domain Name Status:                    Available (Never Purchased)
  }); //it

  it('Test Case No. 2 - ... ... ...', async () => {
    //Test Case No. 2
    //User Role (Who'll Purchase a Name):    Partner Reseller
    //User Role (Who'll Receive The Profit:  Partner
    //Domain Name Characters:                Only Numbers
    //Domain Name Status:                    Available (Never Purchased)
  }); //it

  it('Test Case No. 3 - ... ... ...', async () => {
    //Test Case No. 3
    //User Role (Who'll Purchase a Name):    Regular User
    //User Role (Who'll Receive The Profit:  NO Partner (-)
    //Domain Name Characters:                Letters And Numbers
    //Domain Name Status:                    Available (Never Purchased)
  }); //it

  it('Test Case No. 4 - ... ... ...', async () => {
    //Test Case No. 4
    //User Role (Who'll Purchase a Name):    RNS Owner
    //User Role (Who'll Receive The Profit:  Partner
    //Domain Name Characters:                Letters And Numbers
    //Domain Name Status:                    Occupied By Regular User (-)
  }); //it

  it('Test Case No. 5 - ... ... ...', async () => {
    //Test Case No. 5
    //User Role (Who'll Purchase a Name):    Regular User
    //User Role (Who'll Receive The Profit:  Partner
    //Domain Name Characters:                Only Letters
    //Domain Name Status:                    Available (Never Purchased)
  }); //it

  it('Test Case No. 6 - ... ... ...', async () => {
    //Test Case No. 6
    //User Role (Who'll Purchase a Name):    Regular User
    //User Role (Who'll Receive The Profit:  Regular User
    //Domain Name Characters:                Letters And Numbers
    //Domain Name Status:                    Available (Never Purchased)
  }); //it

  it('Test Case No. 7 - ... ... ...', async () => {
    //Test Case No. 7
    //User Role (Who'll Purchase a Name):    Regular User
    //User Role (Who'll Receive The Profit:  RNS Owner
    //Domain Name Characters:                Letters And Numbers
    //Domain Name Status:                    Available (Never Purchased)
  }); //it
}); // describe
