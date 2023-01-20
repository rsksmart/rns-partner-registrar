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
  calculateDiscountByDuration,
  purchaseDomainUsingTransferAndCallWithoutCommit,
  nameToTokenId,
} from '../utils/operations';
import { PartnerRegistrar, NodeOwner } from 'typechain-types';
import { namehash } from 'ethers/lib/utils';

describe('Partner Fee Collection - Balance Withdraw', () => {
  it('Test Case No. 1 - ... ... ...', async () => {
    //Test Case No. 1
    //User Role (LogIn):                       RNS Owner
    //Balance's Owner Role:                    RNS Owner
    //Number Of Transactions:                  Exactly One
  }); //it

  it('Test Case No. 2 - ... ... ...', async () => {
    //Test Case No. 2
    //User Role (LogIn):                       RNS Owner
    //Balance's Owner Role:                    Partner Reseller
    //Number Of Transactions:                  Exactly One
  }); //it

  it('Test Case No. 3 - ... ... ...', async () => {
    //Test Case No. 3
    //User Role (LogIn):                       RNS Owner
    //Balance's Owner Role:                    Regular User
    //Number Of Transactions:                  Exactly One
  }); //it

  it('Test Case No. 4 - ... ... ...', async () => {
    //Test Case No. 4
    //User Role (LogIn):                        RNS Owner
    //Balance's Owner Role:                     Regular User
    //Number Of Transactions:                   Exactly One
  }); //it

  it('Test Case No. 5 - ... ... ...', async () => {
    //Test Case No. 5
    //User Role (LogIn):                        RNS Owner
    //Balance's Owner Role:                     Regular User
    //Number Of Transactions:                   Exactly 2
  }); //it

  it('Test Case No. 6 - ... ... ...', async () => {
    //Test Case No. 6
    //User Role (LogIn):                        RNS Owner
    //Balance's Owner Role:                     Regular User
    //Number Of Transactions:                   Exactly One
  }); //it

  it('Test Case No. 7 - ... ... ...', async () => {
    //Test Case No. 7
    //User Role (LogIn):                        RNS Owner
    //Balance's Owner Role:                     Regular User
    //Number Of Transactions:                   Exactly One
  }); //it
}); // describe
