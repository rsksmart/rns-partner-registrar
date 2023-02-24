import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { PartnerRegistrar, NodeOwner } from 'typechain-types';
import { assert } from 'console';
import { oneRBTC } from 'test/utils/mock.utils';

describe.only('Configurable Partner Behavior', () => {
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

    const parameterNewValue = BigNumber.from('1');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Domain Length',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('1');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Domain Length',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('1');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Domain Length',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Domain Length',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Domain Length',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Domain Length',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('3');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Duration',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('3');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Duration',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('3');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Duration',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('4');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Duration',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('4');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Duration',
      parameterNewValue,
      PartnerConfiguration
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

    const parameterNewValue = BigNumber.from('4');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Duration',
      parameterNewValue,
      PartnerConfiguration
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
    //Behavior Configuration To Test:                      Maximum Domain Length (Smaller Than Maximum Length) (-)

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Domain Length',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 24 - Should throw the following error: Min length cannot be greater than the max length', async () => {
    //Test Case No. 23
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Domain Length (Grater Than Maximum Length) (-)

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('1');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Domain Length',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 25 - Should throw the following error: Max duration cannot be less than the min duration', async () => {
    //Test Case No. 23
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Maximum Duration (Smaller Than Minimum Duration) (-)

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('4');

    await runPartnerBehaviorConfigCRUDProcess(
      'Maximum Duration',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 26 - Should throw the following error: Min duration cannot be greater than the max duration', async () => {
    //Test Case No. 23
    //User Role (LogIn):                                   RNS Owner
    //User Role (Of The Configuration to Consult/Update):  Partner Reseller
    //Behavior Configuration To Test:                      Minimum Duration (Greater Than Maximum Duration) (-)

    const {
      PartnerRegistrar,
      partner,
      regularUser,
      NodeOwner,
      RIF,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    const parameterNewValue = BigNumber.from('4');

    await runPartnerBehaviorConfigCRUDProcess(
      'Minimum Duration',
      parameterNewValue,
      PartnerConfiguration
    );
  }); //it
}); //describe

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
    "BUG: The '" + parameterName + "' option did NOT save the new value"
  ).to.be.equals(parameterNewValue);

  console.log(parameterName + ' AFTER: ' + valueAfterChange);
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
}; // End - Partner Value Function
