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


describe('Partners Management - Remove Partner', () => {

    it('Test Case No. 1 - ... ... ...', async () => {
        //Test Case No. 1
        //User Role (LogIn):                   RNS Owner
        //Type Of Account To Remove:           Partner Reseller
        
        }); //it 




        it('Test Case No. 2 - ... ... ...', async () => {
        //Test Case No. 2
        //User Role (LogIn):                   RNS Owner
        //Type Of Account To Remove:           Regular User
        
        }); //it 




        it('Test Case No. 3 - ... ... ...', async () => {
        //Test Case No. 3
        //User Role (LogIn):                    RNS Owner
        //Type Of Account To Remove:            NO One - Empty (-)
        
        
        

        
        }); //it "

    }); //describe



