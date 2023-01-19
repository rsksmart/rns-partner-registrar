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
    purchaseName,
    nameToTokenId,
} from '../utils/operations';
import { PartnerRegistrar, NodeOwner } from 'typechain-types';
import { namehash } from 'ethers/lib/utils';


describe('Configurable Partner Behavior', () => {

    it('Test Case No. 1 - ... ... ...', async () => {
        //Test Case No. 1
        //User Role (LogIn):                            RNS Owner
        //User Role (Of The Configuration to Consult):  Partner Reseller




    }); //it



    it('Test Case No. 2 - ... ... ...', async () => {
        //Test Case No. 2
        //User Role (LogIn):                            Partner Reseller (-)
        //User Role (Of The Configuration to Consult):  Partner Reseller




    }); //it 




    it('Test Case No. 3 - ... ... ...', async () => {
        //Test Case No. 3
        //User Role (LogIn):                             RNS Owner
        //User Role (Of The Configuration to Consult):   NO Partner Sent (-)




    }); //it 




    it('Test Case No. 4 - ... ... ...', async () => {
        //Test Case No. 4
        //User Role (LogIn):                            RNS Owner
        //User Role (Of The Configuration to Consult):  Regular User




    }); //it 




    it('Test Case No. 5 - ... ... ...', async () => {
        //Test Case No. 5
        //User Role (LogIn):                            RNS Owner
        //User Role (Of The Configuration to Consult):  RNS Owner




    }); //it 

}); //describe