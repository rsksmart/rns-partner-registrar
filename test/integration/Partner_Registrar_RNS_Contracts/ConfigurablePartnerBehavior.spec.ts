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
  nameToTokenId,
} from '../utils/operations';
import { PartnerRegistrar, NodeOwner } from 'typechain-types';
import { namehash } from 'ethers/lib/utils';

describe('Configurable Partner Behavior', () => {
  it('Test Case No. 1 - The Minimum Domain Length value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 1
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length
    //Process to Run:                                      Purchase Of 1 Step
  }); //it

  it('Test Case No. 2 - The Minimum Domain Length value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 2
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length
    //Process to Run:                                      Purchase Of 2 Steps
  }); //it

  it('Test Case No. 3 - The Minimum Domain Length value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 3
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length
    //Process to Run:                                      Purchase Of 3 Steps
  }); //it

  it('Test Case No. 4 - The Maximum Domain Length value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 4
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Domain Length
    //Process to Run:                                      Purchase Of 1 Step
  }); //it

  it('Test Case No. 5 - The Maximum Domain Length value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 5
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Domain Length
    //Process to Run:                                      Purchase Of 2 Steps
  }); //it

  it('Test Case No. 6 - The Maximum Domain Length value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 6
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Domain Length
    //Process to Run:                                      Purchase Of 3 Steps
  }); //it

  it('Test Case No. 7 - The Minimum Duration  value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 7
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration
    //Process to Run:                                      Purchase Of 1 Step
  }); //it

  it('Test Case No. 8 - The Minimum Duration  value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 8
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration
    //Process to Run:                                      Purchase Of 2 Steps
  }); //it

  it('Test Case No. 9 - The Minimum Duration  value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 9
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration
    //Process to Run:                                      Purchase Of 3 Steps
  }); //it

  it('Test Case No. 10 - The Maximum Duration  value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 10
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration
    //Process to Run:                                      Purchase Of 1 Step
  }); //it

  it('Test Case No. 11 - The Maximum Duration  value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 11
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration
    //Process to Run:                                      Purchase Of 2 Steps
  }); //it

  it('Test Case No. 12 - The Maximum Duration  value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 12
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration
    //Process to Run:                                      Purchase Of 3 Steps
  }); //it

  it('Test Case No. 13 - The Commission Fee Percentage value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 13
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Purchase Of 1 Step
  }); //it

  it('Test Case No. 14 - The Commission Fee Percentage value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 14
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Purchase Of 2 Steps
  }); //it

  it('Test Case No. 15 - The Commission Fee Percentage value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 15
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Purchase Of 3 Steps
  }); //it

  it('Test Case No. 16 - The Commission Fee Percentage value should be successfully updated; The Renewal Of 1 Step was succesful when the configuration was respected; The Renewal Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 16
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Renewal Of 1 Step
  }); //it

  it('Test Case No. 17 - The Commission Fee Percentage value should be successfully updated; The Renewal Of 2 Steps was succesful when the configuration was respected; The Renewal Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 17
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Renewal Of 2 Steps
  }); //it

  it('Test Case No. 18 - The Discount Percentage value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 18
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Purchase Of 1 Step
  }); //it

  it('Test Case No. 19 - The Discount Percentage value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 19
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Purchase Of 2 Steps
  }); //it

  it('Test Case No. 20 - The Discount Percentage value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 20
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Purchase Of 3 Steps
  }); //it

  it('Test Case No. 21 - The Discount Percentage value should be successfully updated; The Renewal Of 1 Step was succesful when the configuration was respected; The Renewal Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 21
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Renewal Of 1 Step
  }); //it

  it('Test Case No. 22 - The Discount Percentage value should be successfully updated; The Renewal Of 2 Steps was succesful when the configuration was respected; The Renewal Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 22
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Renewal Of 2 Steps
  }); //it
}); //describe
