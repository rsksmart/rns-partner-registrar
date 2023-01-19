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


describe('Pucharse Name By 1st Time (Domain Registration)', () => {

    it('Test Case No. 1 - ... ... ...', async () => {
        //Test Case No. 1
        //User Role:                            RNS Owner
        //Number of Steps:                      One step
        //Domain Name - Chars:                  Valid (Within Allowed Range) - Only Letters
        //Domain Name - Is Available?:          Available (Never Purchased)
        //MinCommitmentAge:                     Equals To Zero
        //Duration:                             -1 year (-)
        
        }); //it 





        it('Test Case No. 2 - ... ... ...', async () => {
        //Test Case No. 2
        //User Role:                           Partner Reseller
        //Number of Steps:                     Two steps
        //Domain Name - Chars:                 Valid (Within Allowed Range) - Only Numbers
        //Domain Name - Is Available?:         Available (Never Purchased)
        //MinCommitmentAge:                    Greater than zero
        //Duration:                            0 Years (-)
            
        }); //it





        it('Test Case No. 3 - ... ... ...', async () => {
        //Test Case No. 3
        //User Role:                          RNS Owner
        //Number of Steps:                    Two steps
        //Domain Name - Chars:                Valid (Within Allowed Range) - Letters And Number
        //Domain Name - Is Available?:        Available (Never Purchased)
        //MinCommitmentAge:                   Equals To Zero
        //Duration:                           1 year
        
        }); //it
        
        



        it('Test Case No. 4 - ... ... ...', async () => {
        //Test Case No. 4
        //User Role:                         Partner Reseller
        //Number of Steps:                   One step
        //Domain Name - Chars:               Valid (Within Allowed Range) - Letters and Numbers
        //Domain Name - Is Available?:       Available (Never Purchased)
        //MinCommitmentAge:                  Greater than zero
        //Duration:                          2 years
        
        }); //it 





        it('Test Case No. 5 - ... ... ...', async () => {
        //Test Case No. 5
        //User Role:                         RNS Owner
        //Number of Steps:                   Three steps
        //Domain Name - Chars:               Valid (Within Allowed Range) - Only Letters
        //Domain Name - Is Available?:       Available (Never Purchased)
        //MinCommitmentAge:                  Greater than zero
        //Duration:                          Between 3 and 9 Years
        
        }); //it 





        it('Test Case No. 6 - ... ... ...', async () => {
        //Test Case No. 6
        //User Role:                         Partner Reseller
        //Number of Steps:                   Three steps
        //Domain Name - Chars:               Valid (Within Allowed Range) - Only Numbers
        //Domain Name - Is Available?:       Available (Never Purchased)
        //MinCommitmentAge:                  Equals To Zero
        //Duration:                          Between 3 and 9 Years
        
        }); //it
        
        



        it('Test Case No. 7 - ... ... ...', async () => {
        //Test Case No. 7
        //User Role:                         Regular User 
        //Number of Steps:                   One step
        //Domain Name - Chars:               Valid (Within Allowed Range) - Letters and Numbers
        //Domain Name - Is Available?:       Available (Never Purchased)
        //MinCommitmentAge:                  Equals To Zero
        //Duration:                          10 years
        
        }); //it 





        it('Test Case No. 8 - ... ... ...', async () => {
        //Test Case No. 8
        //User Role:                       Regular User 
        //Number of Steps:                 Two steps
        //Domain Name - Chars:             Valid (Within Allowed Range) - Only Letters
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Greater than zero
        //Duration:                        10 years
        
        }); //it 





        it('Test Case No. 9 - ... ... ...', async () => {
        //Test Case No. 9
        //User Role:                       Regular User 
        //Number of Steps:                 Three steps
        //Domain Name - Chars:             Valid (Within Allowed Range) - Only Numbers
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Greater than zero
        //Duration:                        1 year
        
        }); //it 





        it('Test Case No. 10 - ... ... ...', async () => {
        //Test Case No. 10
        //User Role:                       Regular User 
        //Number of Steps:                 Three steps
        //Domain Name - Chars:             Valid (Within Allowed Range) - Letters and Numbers
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Equals To Zero
        //Duration:                        2 years
        
        }); //it 





        it('Test Case No. 11 - ... ... ...', async () => {
        //Test Case No. 11
        //User Role:                       Regular User 
        //Number of Steps:                 One step
        //Domain Name - Chars:             Valid (Within Allowed Range) - Letters and Numbers
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Greater than zero
        //Duration:                        Between 3 and 9 Years
        
        }); //it 





        it('Test Case No. 12 - ... ... ...', async () => {
        //Test Case No. 12
        //User Role:                       Regular User 
        //Number of Steps:                 Three steps
        //Domain Name - Chars:             Valid (Within Allowed Range) - Only Letters
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Greater than zero
        //Duration:                        10 years
    
        }); //it 





        it('Test Case No. 13 - ... ... ...', async () => {
        //Test Case No. 13
        //User Role:                       Partner Reseller
        //Number of Steps:                 Two steps
        //Domain Name - Chars:             Greater Than The Maximum Allowed (-) - Only Numbers 
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Equals To Zero
        //Duration:                        Between 3 and 9 Years
    
        }); //it 





        it('Test Case No. 14 - ... ... ...', async () => {
        //Test Case No. 14
        //User Role:                       RNS Owner
        //Number of Steps:                 One step
        //Domain Name - Chars:             Smaller Than 5 (Minimum Allowed) (-) - Letters and Numbers
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Equals To Zero
        //Duration:                        2 years
    
        }); //it 





        it('Test Case No. 15 - ... ... ...', async () => {
        //Test Case No. 15
        //User Role:                      Partner Reseller
        //Number of Steps:                One step
        //Domain Name - Chars:            Equals To Zero (Empty Domain Name) (-) - Only Letters
        //Domain Name - Is Available?:    Available (Never Purchased)
        //MinCommitmentAge:               Equals To Zero
        //Duration:                       10 years
        
        }); //it 





        it('Test Case No. 16 - ... ... ...', async () => {
        //Test Case No. 16
        //User Role:                       RNS Owner
        //Number of Steps:                 One step
        //Domain Name - Chars:             Valid (Within Allowed Range) - With Special Chars (-)
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Greater than zero
        //Duration:                        1 year
    
        }); //it 





        it('Test Case No. 17 - ... ... ...', async () => {
        //Test Case No. 17
        //User Role:                       Partner Reseller
        //Number of Steps:                 Two steps
        //Domain Name - Chars:             Valid (Within Allowed Range) - Only Letters
        //Domain Name - Is Available?:     Available (Never Purchased)
        //MinCommitmentAge:                Negative Number (-)
        //Duration:                        2 years
        
        }); //it 






        it('Test Case No. 18 - ... ... ...', async () => {
        //Test Case No. 18
        //User Role:                      Regular User 
        //Number of Steps:                Three steps
        //Domain Name - Chars:            Valid (Within Allowed Range) - Only Numbers
        //Domain Name - Is Available?:    Available (Never Purchased)
        //MinCommitmentAge:               Empty Value (-)
        //Duration:                       Between 3 and 9 Years
        
        }); //it 





        it('Test Case No. 19 - ... ... ...', async () => {
        //Test Case No. 19
        //User Role:                      RNS Owner
        //Number of Steps:                Two steps
        //Domain Name - Chars:            Valid (Within Allowed Range) - Letters and Numbers
        //Domain Name - Is Available?:    Available (Never Purchased)
        //MinCommitmentAge:               Greater Than Maximum (-)
        //Duration:                       10 years
        
        }); //it 





        it('Test Case No. 20 - ... ... ...', async () => {
        //Test Case No. 20
        //User Role:                      Regular User 
        //Number of Steps:                One step
        //Domain Name - Chars:            Valid (Within Allowed Range) - Letters and Numbers
        //Domain Name - Is Available?:    Occupied By Regular User (-)
        //MinCommitmentAge:               Greater than zero
        //Duration:                       2 years
            
        }); //it 





        it('Test Case No. 21 - ... ... ...', async () => {
        //Test Case No. 21
        //User Role:                     Regular User 
        //Number of Steps:               One step
        //Domain Name - Chars:           Valid (Within Allowed Range) - Letters and Numbers
        //Domain Name - Is Available?:   Available (Never Purchased)
        //MinCommitmentAge:              Greater than zero
        //Duration:                      Greater Than Maximum (-)
    
        }); //it 





}); // describe
  