import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import {
  PartnerRegistrar,
  NodeOwner,
  ERC677Token,
  PartnerConfiguration,
  PartnerRenewer,
} from 'typechain-types';
import { assert } from 'console';
import { oneRBTC } from 'test/utils/mock.utils';
import {
  calculateNamePriceByDuration,
  generateRandomStringWithLettersAndNumbers,
  oneStepDomainOwnershipRenewal,
  purchaseDomainUsingTransferAndCallWithoutCommit,
  purchaseDomainWithCommit,
  purchaseDomainWithoutCommit,
  TwoStepsDomainOwnershipRenewal,
} from '../utils/operations';
import { SECRET } from '../utils/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MockContract } from '@defi-wonderland/smock';
import { validatePurchaseExpectedResults } from './RenewalDomainNegativeCases.spec';
import { validateNegativeFlowExpectedResults } from './RegisterDomain.spec';

describe('Configurable Partner Behavior', () => {
  it('Test Case No. 1 - The Minimum Domain Length value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 1
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length
    //Process to Run:                                      Purchase Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Minimum Domain Length';

    const parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 1 Step',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 2 - The Minimum Domain Length value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 2
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length
    //Process to Run:                                      Purchase Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Minimum Domain Length';

    const parameterNewValue = BigNumber.from('13');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 2 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 3 - The Minimum Domain Length value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 3
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length
    //Process to Run:                                      Purchase Of 3 Steps
    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Minimum Domain Length';

    const parameterNewValue = BigNumber.from('19');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 3 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 4 - The Maximum Domain Length value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 4
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Domain Length
    //Process to Run:                                      Purchase Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Maximum Domain Length';

    const parameterNewValue = BigNumber.from('15');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 1 Step',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 5 - The Maximum Domain Length value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 5
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Domain Length
    //Process to Run:                                      Purchase Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Maximum Domain Length';

    const parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 2 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 6 - The Maximum Domain Length value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 6
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Domain Length
    //Process to Run:                                      Purchase Of 3 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Maximum Domain Length';

    const parameterNewValue = BigNumber.from('8');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 3 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 7 - The Minimum Duration  value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 7
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration
    //Process to Run:                                      Purchase Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Minimum Duration';

    const parameterNewValue = BigNumber.from('2');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 1 Step',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 8 - The Minimum Duration  value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 8
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration
    //Process to Run:                                      Purchase Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Minimum Duration';

    const parameterNewValue = BigNumber.from('3');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 2 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 9 - The Minimum Duration  value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 9
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration
    //Process to Run:                                      Purchase Of 3 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const behaviorConfigurationToTest = 'Minimum Duration';

    const parameterNewValue = BigNumber.from('4');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 3 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 10 - The Maximum Duration  value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 10
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration
    //Process to Run:                                      Purchase Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    await (await RIF.transfer(regularUser.address, oneRBTC.mul(10))).wait();

    const behaviorConfigurationToTest = 'Maximum Duration';

    const parameterNewValue = BigNumber.from('6');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 1 Step',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 11 - The Maximum Duration  value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 11
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration
    //Process to Run:                                      Purchase Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    await (await RIF.transfer(regularUser.address, oneRBTC.mul(10))).wait();

    const behaviorConfigurationToTest = 'Maximum Duration';

    const parameterNewValue = BigNumber.from('7');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 2 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 12 - The Maximum Duration  value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 12
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration
    //Process to Run:                                      Purchase Of 3 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    await (await RIF.transfer(regularUser.address, oneRBTC.mul(10))).wait();

    const behaviorConfigurationToTest = 'Maximum Duration';

    const parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfiguration
    );

    await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 3 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      NodeOwner,
      parameterNewValue
    );
  }); //it

  it('Test Case No. 13 - The Commission Fee Percentage value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 13
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Purchase Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = oneRBTC.mul(5);

    await runPartnerBehaviorConfigCRUDProcess(
      'Commission Fee Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 14 - The Commission Fee Percentage value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 14
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Purchase Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = oneRBTC.mul(5);

    await runPartnerBehaviorConfigCRUDProcess(
      'Commission Fee Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 15 - The Commission Fee Percentage value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 15
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Purchase Of 3 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = oneRBTC.mul(5);

    await runPartnerBehaviorConfigCRUDProcess(
      'Commission Fee Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 16 - The Commission Fee Percentage value should be successfully updated; The Renewal Of 1 Step was succesful when the configuration was respected; The Renewal Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 16
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Renewal Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = oneRBTC.mul(5);

    await runPartnerBehaviorConfigCRUDProcess(
      'Commission Fee Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 17 - The Commission Fee Percentage value should be successfully updated; The Renewal Of 2 Steps was succesful when the configuration was respected; The Renewal Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 17
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Commission Fee Percentage
    //Process to Run:                                      Renewal Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = oneRBTC.mul(5);

    await runPartnerBehaviorConfigCRUDProcess(
      'Commission Fee Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 18 - The Discount Percentage value should be successfully updated; The Purchase Of 1 Step was succesful when the configuration was respected; The Purchase Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 18
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Purchase Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('6');

    await runPartnerBehaviorConfigCRUDProcess(
      'Discount Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 19 - The Discount Percentage value should be successfully updated; The Purchase Of 2 Steps was succesful when the configuration was respected; The Purchase Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 19
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Purchase Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('6');

    await runPartnerBehaviorConfigCRUDProcess(
      'Discount Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 20 - The Discount Percentage value should be successfully updated; The Purchase Of 3 Steps was succesful when the configuration was respected; The Purchase Of 3 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 20
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Purchase Of 3 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('6');

    await runPartnerBehaviorConfigCRUDProcess(
      'Discount Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 21 - The Discount Percentage value should be successfully updated; The Renewal Of 1 Step was succesful when the configuration was respected; The Renewal Of 1 Step should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 21
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Renewal Of 1 Step

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('6');

    await runPartnerBehaviorConfigCRUDProcess(
      'Discount Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 22 - The Discount Percentage value should be successfully updated; The Renewal Of 2 Steps was succesful when the configuration was respected; The Renewal Of 2 Steps should throw an error when the new configuration was NOT respected', async () => {
    //Test Case No. 22
    //User Role (LogIn):                                   HIGH LEVEL OPERATOR
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Discount Percentage
    //Process to Run:                                      Renewal Of 2 Steps

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('6');

    await runPartnerBehaviorConfigCRUDProcess(
      'Discount Percentage',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 23 - Should throw the following error: Max length cannot be less than the min length', async () => {
    //Test Case No. 23
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Domain Length (Smaller Than Minimum Length) (-)

    const { PartnerConfiguration } = await loadFixture(initialSetup);

    const partnerConfigurationToTest = 'Maximum Domain Length';

    const minimumLength = await getPartnerParameterValue(
      'Minimum Domain Length',
      PartnerConfiguration
    );

    const parameterNewValue = BigNumber.from(minimumLength).sub(
      BigNumber.from('1')
    );

    const maximumLengthBeforeChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    let errorFound: boolean = false;

    const expectedError = 'Max length cannot be less than the min length';

    try {
      await runPartnerBehaviorConfigCRUDProcess(
        partnerConfigurationToTest,
        parameterNewValue,
        PartnerConfiguration
      );
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Invalid ' +
        partnerConfigurationToTest +
        ' Error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(expectedError);

      expect(currentError, bugDescription).to.contains('Error');
    }

    expect(errorFound + '').to.be.equals('true');

    const maximumLengthAfterChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    expect(
      maximumLengthAfterChange,
      'BUG: ' +
        partnerConfigurationToTest +
        ' was altered with an invalid value!'
    ).to.be.equals(maximumLengthBeforeChange);

    console.log('Error Accomplished - ' + expectedError + ' - OK');
  }); //it

  it('Test Case No. 24 - Should throw the following error: Min length cannot be greater than the max length', async () => {
    //Test Case No. 23
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length (Greater Than Maximum Length) (-)

    const { PartnerConfiguration } = await loadFixture(initialSetup);

    const partnerConfigurationToTest = 'Minimum Domain Length';

    const maxLength = await getPartnerParameterValue(
      'Maximum Domain Length',
      PartnerConfiguration
    );

    const parameterNewValue = BigNumber.from(maxLength).add(
      BigNumber.from('1')
    );

    const minLengthBeforeChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    let errorFound: boolean = false;

    const expectedError = 'Minimum length cannot be more than the max length';

    try {
      await runPartnerBehaviorConfigCRUDProcess(
        partnerConfigurationToTest,
        parameterNewValue,
        PartnerConfiguration
      );
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Invalid ' +
        partnerConfigurationToTest +
        ' Error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(expectedError);

      expect(currentError, bugDescription).to.contains('Error');
    }

    expect(errorFound + '').to.be.equals('true');

    const minLengthAfterChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    expect(
      minLengthAfterChange,
      'BUG: ' +
        partnerConfigurationToTest +
        ' was altered with an invalid value!'
    ).to.be.equals(minLengthBeforeChange);

    console.log('Error Accomplished - ' + expectedError + ' - OK');
  }); //it

  it('Test Case No. 25 - Should throw the following error: Max duration cannot be less than the min duration', async () => {
    //Test Case No. 23
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration (Smaller Than Minimum Duration) (-)

    const { PartnerConfiguration } = await loadFixture(initialSetup);

    const partnerConfigurationToTest = 'Maximum Duration';

    const minimumDuration = await getPartnerParameterValue(
      'Minimum Duration',
      PartnerConfiguration
    );

    const parameterNewValue = BigNumber.from(minimumDuration).sub(
      BigNumber.from('1')
    );

    const maximumDurationBeforeChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    let errorFound: boolean = false;

    const expectedError = 'Max duration cannot be less than the min duration';

    try {
      await runPartnerBehaviorConfigCRUDProcess(
        partnerConfigurationToTest,
        parameterNewValue,
        PartnerConfiguration
      );
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Invalid ' +
        partnerConfigurationToTest +
        ' Error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(expectedError);

      expect(currentError, bugDescription).to.contains('Error');
    }

    expect(errorFound + '').to.be.equals('true');

    const maximumDurationAfterChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    expect(
      maximumDurationAfterChange,
      'BUG: ' +
        partnerConfigurationToTest +
        ' was altered with an invalid value!'
    ).to.be.equals(maximumDurationBeforeChange);

    console.log('Error Accomplished - ' + expectedError + ' - OK');
  }); //it

  it('Test Case No. 26 - Should throw the following error: Min duration cannot be greater than the max duration', async () => {
    //Test Case No. 23
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration (Greater Than Maximum Duration) (-)

    const { PartnerConfiguration } = await loadFixture(initialSetup);

    const partnerConfigurationToTest = 'Minimum Duration';

    const max = await getPartnerParameterValue(
      'Maximum Duration',
      PartnerConfiguration
    );

    const parameterNewValue = BigNumber.from(max).add(BigNumber.from('1'));

    const minLengthBeforeChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    let errorFound: boolean = false;

    const expectedError =
      'Minimum duration cannot be more than the maximum duration';

    try {
      await runPartnerBehaviorConfigCRUDProcess(
        partnerConfigurationToTest,
        parameterNewValue,
        PartnerConfiguration
      );
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Invalid ' +
        partnerConfigurationToTest +
        ' Error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(expectedError);

      expect(currentError, bugDescription).to.contains('Error');
    }

    expect(errorFound + '').to.be.equals('true');

    const minLengthAfterChange = await getPartnerParameterValue(
      partnerConfigurationToTest,
      PartnerConfiguration
    );

    expect(
      minLengthAfterChange,
      'BUG: ' +
        partnerConfigurationToTest +
        ' was altered with an invalid value!'
    ).to.be.equals(minLengthBeforeChange);

    console.log('Error Accomplished - ' + expectedError + ' - OK');
  }); //it
}); //describe - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const runPartnerBehaviorConfigCRUDProcess = async (
  parameterName: string,
  parameterNewValue: BigNumber,
  PartnerConfiguration: Contract
) => {
  const valueBeforeChange = await getPartnerParameterValue(
    parameterName,
    PartnerConfiguration
  );

  console.log(parameterName + ' BEFORE: ' + valueBeforeChange);

  if (parameterName.includes('Minimum Domain Length'))
    await PartnerConfiguration.setMinLength(parameterNewValue);
  else if (parameterName.includes('Maximum Domain Length'))
    await PartnerConfiguration.setMaxLength(parameterNewValue);
  else if (parameterName.includes('Minimum Duration'))
    await PartnerConfiguration.setMinDuration(parameterNewValue);
  else if (parameterName.includes('Maximum Duration'))
    await PartnerConfiguration.setMaxDuration(parameterNewValue);
  else if (parameterName.includes('Commission Fee Percentage'))
    await PartnerConfiguration.setFeePercentage(parameterNewValue);
  else if (parameterName.includes('Discount Percentage'))
    await PartnerConfiguration.setDiscount(parameterNewValue);
  else throw new Error('Invalid Parameter Name Option: ' + parameterName);

  const valueAfterChange = await getPartnerParameterValue(
    parameterName,
    PartnerConfiguration
  );

  expect(
    valueAfterChange,
    "BUG: The '" + parameterName + "' option did NOT save the new correct value"
  ).to.be.equals(parameterNewValue);

  console.log(
    parameterName +
      ' AFTER: ' +
      valueAfterChange +
      ' --- Partner Behavior Test Successful!'
  );
}; // End - Partner Behavior Flow

const getPartnerParameterValue = async (
  parameterName: string,
  PartnerConfiguration: Contract
) => {
  let value = '';

  if (parameterName.includes('Minimum Domain Length'))
    value = await PartnerConfiguration.getMinLength();
  else if (parameterName.includes('Maximum Domain Length'))
    value = await PartnerConfiguration.getMaxLength();
  else if (parameterName.includes('Minimum Duration'))
    value = await PartnerConfiguration.getMinDuration();
  else if (parameterName.includes('Maximum Duration'))
    value = await PartnerConfiguration.getMaxDuration();
  else if (parameterName.includes('Commission Fee Percentage'))
    value = await PartnerConfiguration.getFeePercentage();
  else if (parameterName.includes('Discount Percentage'))
    value = await PartnerConfiguration.getDiscount();
  else throw new Error('Invalid Parameter Name Option: ' + parameterName);

  expect(
    value,
    "BUG: There is a negative number saved at the '" +
      parameterName +
      "' option"
  ).to.be.greaterThanOrEqual(BigNumber.from('0'));

  return value;
}; // End - Get Parameter Value

const getPartnerParameterErrorMessage = (parameterName: string) => {
  let value = '';

  if (parameterName.includes('Minimum Domain Length'))
    value = 'Name is less than minimum length';
  else if (parameterName.includes('Maximum Domain Length'))
    value = 'Name is more than max length';
  else if (parameterName.includes('Minimum Duration'))
    value = 'Duration less than minimum duration';
  else if (parameterName.includes('Maximum Duration'))
    value = 'Duration is more than max duration';
  else if (parameterName.includes('Commission Fee Percentage')) value = 'XXX';
  else if (parameterName.includes('Discount Percentage')) value = 'XXX';
  else throw new Error('Invalid Parameter Name Option: ' + parameterName);

  return value;
}; // End - Get Parameter Value

const purchaseDomain = async (
  partnerConfigurationToTest: string,
  typeOfProcess: string,
  buyerUser: SignerWithAddress,
  PartnerRegistrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string,
  PartnerConfiguration: PartnerConfiguration,
  NodeOwner: NodeOwner,
  usedValidParameterValue: boolean,
  newParamValue: BigNumber
) => {
  let duration = BigNumber.from('2');

  let domainLength = BigNumber.from('8');

  if (
    usedValidParameterValue &&
    partnerConfigurationToTest.includes('Domain Length')
  )
    domainLength = newParamValue;
  else if (
    usedValidParameterValue &&
    partnerConfigurationToTest.includes('Duration')
  )
    duration = newParamValue;
  else if (
    !usedValidParameterValue &&
    partnerConfigurationToTest.includes('Minimum Domain Length')
  )
    domainLength = newParamValue.sub(1);
  else if (
    !usedValidParameterValue &&
    partnerConfigurationToTest.includes('Maximum Domain Length')
  )
    domainLength = newParamValue.add(1);
  else if (
    !usedValidParameterValue &&
    partnerConfigurationToTest.includes('Minimum Duration')
  )
    duration = newParamValue.sub(1);
  else if (
    !usedValidParameterValue &&
    partnerConfigurationToTest.includes('Maximum Duration')
  )
    duration = newParamValue.add(1);

  console.log('DURACION ACTUAL: ' + duration);

  console.log('LONGITUD ACTUAL: ' + domainLength);

  const domainName = generateRandomStringWithLettersAndNumbers(
    domainLength.toNumber(),
    true,
    false
  );

  console.log('NOMBRE ACTUAL: ' + domainName);

  const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

  let errorFound: boolean = false;

  try {
    if (
      typeOfProcess.includes('Purchase Of 1 Step') ||
      typeOfProcess.includes('Renewal Of 1 Step')
    ) {
      console.log('Purchase Of 1 Step - In Progress...');

      await purchaseDomainUsingTransferAndCallWithoutCommit(
        domainName,
        duration,
        SECRET(),
        buyerUser,
        PartnerRegistrar,
        RIF,
        partnerAddress,
        PartnerConfiguration
      );

      console.log('Purchase Of 1 Step - Successful');
    } // if
    else if (
      typeOfProcess.includes('Purchase Of 2 Steps') ||
      typeOfProcess.includes('Renewal Of 2 Steps')
    ) {
      console.log('Purchase Of 2 Steps - In Progress...');

      await purchaseDomainWithoutCommit(
        domainName,
        duration,
        SECRET(),
        buyerUser,
        PartnerRegistrar,
        RIF,
        partnerAddress,
        PartnerConfiguration
      );

      console.log('Purchase Of 2 Steps - Successful');
    } // if
    else if (typeOfProcess.includes('Purchase Of 3 Steps')) {
      console.log('Purchase Of 3 Steps - In Progress...');

      await purchaseDomainWithCommit(
        domainName,
        duration,
        SECRET(),
        buyerUser,
        PartnerRegistrar,
        RIF,
        partnerAddress,
        PartnerConfiguration,
        BigNumber.from('10')
      );

      console.log('Purchase Of 3 Steps - Successful');
    } // if
    else throw new Error('Invalid Process Name Option: ' + typeOfProcess);
  } catch (error) {
    errorFound = true;

    const currentError = error + '';

    const bugDescription =
      'BUG: The Invalid ' +
      partnerConfigurationToTest +
      ' Error message was NOT displayed correctly';

    const expectedError = getPartnerParameterErrorMessage(
      partnerConfigurationToTest
    );
    expect(currentError, bugDescription).to.contains(expectedError);

    expect(currentError, bugDescription).to.contains(
      'VM Exception while processing transaction: reverted with custom error'
    );

    expect(currentError, bugDescription).to.contains('Error');

    console.log('Error Message Accomplished - ' + expectedError + ' - OK');
  } // catch

  const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

  if (usedValidParameterValue) {
    //Validate the previous Purchase was successful!
    await validatePurchaseExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      duration,
      RIF
    );

    expect(
      errorFound + '',
      'Not Expected Error Was Thrown! But Data Used Was Valid!'
    ).to.be.equals('false');

    console.log('SUCCESFUL PURCHASE - Partner Behavior Test OK!');
  } // If - Valid Parameter Flow
  else {
    //Validate the previous process failed this time and the contract threw a coherent error message.
    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Invalid ' + partnerConfigurationToTest
    );

    console.log('FAILED PURCHASE - Partner Behavior Test OK!');
  }
}; // End - Purchase Flow

const renovateDomain = async (
  typeOfProcess: string,
  buyerUser: SignerWithAddress,
  partnerRenewer: PartnerRenewer,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string
) => {
  const domainName = generateRandomStringWithLettersAndNumbers(10, true, false);

  const duration = BigNumber.from('3');

  const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

  const errorFound: boolean = false;

  const numberOfMonthsToSimulate = BigNumber.from('12');

  const namePrice = await calculateNamePriceByDuration(duration);

  if (typeOfProcess.includes('Renewal Of 1 Step')) {
    await oneStepDomainOwnershipRenewal(
      domainName,
      duration,
      namePrice,
      partnerAddress,
      buyerUser,
      partnerRenewer,
      RIF,
      numberOfMonthsToSimulate
    );

    console.log('Renewal Of 1 Step - Successful');
  } else if (typeOfProcess.includes('Renewal Of 2 Steps')) {
    await TwoStepsDomainOwnershipRenewal(
      domainName,
      duration,
      namePrice,
      partnerAddress,
      buyerUser,
      partnerRenewer,
      RIF,
      numberOfMonthsToSimulate
    );

    console.log('Renewal Of 2 Steps - Successful');
  }
}; // End - Renewal Flow

const runPurchasesFlow = async (
  behaviorConfigurationToTest: string,
  processToRun: string,
  buyerUser: SignerWithAddress,
  PartnerRegistrar: PartnerRegistrar,
  RIF: MockContract<ERC677Token>,
  partnerAddress: string,
  PartnerConfiguration: PartnerConfiguration,
  NodeOwner: NodeOwner,
  parameterNewValue: BigNumber
) => {
  //Positive Flow Using the NEW Value
  await purchaseDomain(
    behaviorConfigurationToTest,
    processToRun,
    buyerUser,
    PartnerRegistrar,
    RIF,
    partnerAddress,
    PartnerConfiguration,
    NodeOwner,
    true,
    parameterNewValue
  );

  //Negative Flow Using the NEW Value
  await purchaseDomain(
    behaviorConfigurationToTest,
    processToRun,
    buyerUser,
    PartnerRegistrar,
    RIF,
    partnerAddress,
    PartnerConfiguration,
    NodeOwner,
    false,
    parameterNewValue
  );
}; // End - Renewal Flow
