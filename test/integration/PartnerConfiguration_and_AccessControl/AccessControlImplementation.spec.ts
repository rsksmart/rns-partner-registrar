import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import {
  NodeOwner,
  ERC677Token,
  PartnerConfiguration,
  PartnerRenewer,
  FeeManager,
  PartnerRegistrar,
  PartnerConfiguration,
} from 'typechain-types';
import { oneRBTC } from 'test/utils/mock.utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MockContract } from '@defi-wonderland/smock';
import {
  getPartnerParameterValue,
  runPartnerBehaviorConfigCRUDProcess,
  runPurchasesFlow,
  runRenovateFlow,
} from './ConfigurablePartnerBehavior.spec';

describe('Access Control Implementarion', () => {
  it("Test Case No. 1 - The 'IsOwnerRole function should throw FALSE", async () => {
    //Test Case No. 1
    //User Role (LogIn):    Regular User
    //Function To Execute:  is Owner Role

    const { regularUser, accessControl } = await loadFixture(initialSetup);

    await runIsOwnerRoleTest(
      regularUser.address,
      accessControl,
      'Regular User'
    );
  }); //it

  it("Test Case No. 2 - The 'IsOwnerRole function should throw TRUE", async () => {
    //Test Case No. 2
    //User Role (LogIn):    RNS Owner
    //Function To Execute:  is Owner Role

    const { owner, accessControl } = await loadFixture(initialSetup);

    await runIsOwnerRoleTest(owner.address, accessControl, 'RNS Owner');
  }); //it

  it("Test Case No. 3 - The 'IsOwnerRole function should throw FALSE", async () => {
    //Test Case No. 3
    //User Role (LogIn):    Partner Reseller
    //Function To Execute:  is Owner Role

    const { partner, accessControl } = await loadFixture(initialSetup);

    await runIsOwnerRoleTest(
      partner.address,
      accessControl,
      'Partner Reseller'
    );
  }); //it

  it("Test Case No. 4 - The 'IsOwnerRole function should throw FALSE", async () => {
    //Test Case No. 4
    //User Role (LogIn):    High Level Operator
    //Function To Execute:  is Owner Role

    const { highLevelOperator, accessControl } = await loadFixture(
      initialSetup
    );

    await runIsOwnerRoleTest(
      highLevelOperator.address,
      accessControl,
      'High Level Operator'
    );
  }); //it

  it("Test Case No. 5 - The 'IsHLO function should throw FALSE", async () => {
    //Test Case No. 5
    //User Role (LogIn):    Regular User
    //Function To Execute:  is High Level Operator

    const { regularUser, accessControl } = await loadFixture(initialSetup);

    await runIsHLORoleTest(regularUser.address, accessControl, 'Regular User');
  }); //it

  it("Test Case No. 6 - The 'IsHLO function should throw FALSE", async () => {
    //Test Case No. 6
    //User Role (LogIn):    RNS Owner
    //Function To Execute:  is High Level Operator

    const { owner, accessControl } = await loadFixture(initialSetup);

    await runIsHLORoleTest(owner.address, accessControl, 'RNS Owner');
  }); //it

  it("Test Case No. 7 - The 'IsHLO function should throw FALSE", async () => {
    //Test Case No. 7
    //User Role (LogIn):    Partner Reseller
    //Function To Execute:  is High Level Operator

    const { partner, accessControl } = await loadFixture(initialSetup);

    await runIsHLORoleTest(partner.address, accessControl, 'Partner Reseller');
  }); //it

  it("Test Case No. 8 - The 'IsHLO function should throw TRUE", async () => {
    //Test Case No. 8
    //User Role (LogIn):    High Level Operator
    //Function To Execute:  is High Level Operator

    const { highLevelOperator, accessControl } = await loadFixture(
      initialSetup
    );

    await runIsHLORoleTest(
      highLevelOperator.address,
      accessControl,
      'High Level Operator'
    );
  }); //it

  it("Test Case No. 9 - The 'Add High Level Operator' function should throw an error message", async () => {
    //Test Case No. 9
    //User Role (LogIn):    Regular User (-)
    //Function To Execute:  Add High Level Operator

    const { regularUser, accessControl, highLevelOperatorToAddOrRemove } =
      await loadFixture(initialSetup);

    await runHighLevelOperatorCRUD(
      accessControl,
      regularUser,
      highLevelOperatorToAddOrRemove,
      'Regular User',
      'Add'
    );
  }); //it

  it("Test Case No. 10 - The 'Add High Level Operator' function should work succesfully; The New HLO should can configure the Partner Behavior, execute the Purchase Flow and the Renewal Flow", async () => {
    //Test Case No. 10
    //User Role (LogIn):    RNS Owner
    //Function To Execute:  Add High Level Operator

    const {
      owner,
      accessControl,
      highLevelOperatorToAddOrRemove,
      PartnerConfiguration,
      regularUser,
      PartnerRegistrar,
      RIF,
      NodeOwner,
      partner,
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    await (await RIF.transfer(regularUser.address, oneRBTC.mul(10))).wait();

    //Add New HLO
    await runHighLevelOperatorCRUD(
      accessControl,
      owner,
      highLevelOperatorToAddOrRemove,
      'RNS Owner',
      'Add'
    );

    //Using the Added HLO
    const PartnerConfigurationAsHLO = PartnerConfiguration.connect(
      highLevelOperatorToAddOrRemove
    );

    //Minimum Domain Length
    let behaviorConfigurationToTest = 'Minimum Domain Length';

    let parameterNewValue = BigNumber.from('10');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfigurationAsHLO
    );

    //Maximum Domain Length
    behaviorConfigurationToTest = 'Maximum Domain Length';

    parameterNewValue = BigNumber.from('15');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfigurationAsHLO
    );

    //Minimum Duration
    behaviorConfigurationToTest = 'Minimum Duration';

    parameterNewValue = BigNumber.from('4');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfigurationAsHLO
    );

    //Maximum Duration
    behaviorConfigurationToTest = 'Maximum Duration';

    parameterNewValue = BigNumber.from('7');

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfigurationAsHLO
    );

    //Commission Fee Percentage
    behaviorConfigurationToTest = 'Commission Fee Percentage';

    parameterNewValue = oneRBTC.mul(30);

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfigurationAsHLO
    );

    //Discount Percentage
    behaviorConfigurationToTest = 'Discount Percentage';

    parameterNewValue = oneRBTC.mul(5);

    await runPartnerBehaviorConfigCRUDProcess(
      behaviorConfigurationToTest,
      parameterNewValue,
      PartnerConfigurationAsHLO
    );

    //Purchase Process
    const domainNameAndPurchaseDuration = await runPurchasesFlow(
      behaviorConfigurationToTest,
      'Purchase Of 1 Steps',
      regularUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfigurationAsHLO,
      NodeOwner,
      parameterNewValue,
      FeeManager,
      true
    );

    const domainName = domainNameAndPurchaseDuration.split(';')[0];

    const durationPurchase = domainNameAndPurchaseDuration.split(';')[1];

    const currentTimeWhenPurchased = BigNumber.from(await time.latest()); //currentTime - Blockchain Clock Current Moment

    //Renewal Process
    await runRenovateFlow(
      'Renewal Of 1 Steps',
      NodeOwner,
      regularUser,
      PartnerRenewer,
      RIF,
      partner.address,
      currentTimeWhenPurchased,
      BigNumber.from(durationPurchase),
      PartnerConfigurationAsHLO,
      FeeManager,
      domainName
    );
  }); //it

  it("Test Case No. 11 - The 'Add High Level Operator' function should throw an error message", async () => {
    //Test Case No. 11
    //User Role (LogIn):    Partner Reseller (-)
    //Function To Execute:  Add High Level Operator

    const { partner, accessControl, highLevelOperatorToAddOrRemove } =
      await loadFixture(initialSetup);

    await runHighLevelOperatorCRUD(
      accessControl,
      partner,
      highLevelOperatorToAddOrRemove,
      'Partner Reseller',
      'Add'
    );
  }); //it

  it("Test Case No. 12 - The 'Add High Level Operator' function should throw an error message", async () => {
    //Test Case No. 12
    //User Role (LogIn):    High Level Operator (-)
    //Function To Execute:  Add High Level Operator

    const { highLevelOperator, accessControl, highLevelOperatorToAddOrRemove } =
      await loadFixture(initialSetup);

    await runHighLevelOperatorCRUD(
      accessControl,
      highLevelOperator,
      highLevelOperatorToAddOrRemove,
      'High Level Operator',
      'Add'
    );
  }); //it

  it("Test Case No. 13 - The 'Remove High Level Operator' function should throw an error message", async () => {
    //Test Case No. 13
    //User Role (LogIn):    Regular User (-)
    //Function To Execute:  Remove High Level Operator

    const { regularUser, accessControl, highLevelOperatorToAddOrRemove } =
      await loadFixture(initialSetup);

    await runHighLevelOperatorCRUD(
      accessControl,
      regularUser,
      highLevelOperatorToAddOrRemove,
      'Regular User',
      'Remove'
    );
  }); //it

  it("Test Case No. 14 - The 'Remove High Level Operator' function should work succesfully; The Removed HLO Should NOT be able to update the Partner Configuration anymore", async () => {
    //Test Case No. 14
    //User Role (LogIn):    RNS Owner
    //Function To Execute:  Remove High Level Operator

    const {
      owner,
      accessControl,
      highLevelOperatorToAddOrRemove,
      PartnerConfiguration,
    } = await loadFixture(initialSetup);

    await runHighLevelOperatorCRUD(
      accessControl,
      owner,
      highLevelOperatorToAddOrRemove,
      'RNS Owner',
      'Remove'
    );

    const userToLoginWith = highLevelOperatorToAddOrRemove;

    const PartnerConfigurationLogIn =
      PartnerConfiguration.connect(userToLoginWith);

    let featureToTest = 'Discount Percentage';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      oneRBTC.mul(40),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    featureToTest = 'Maximum Duration';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('8'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    featureToTest = 'Minimum Duration';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('2'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    featureToTest = 'Maximum Domain Length';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('15'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    featureToTest = 'Minimum Domain Length';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('4'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    featureToTest = 'Commission Fee Percentage';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      oneRBTC.mul(10),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );
  }); //it

  it("Test Case No. 15 - The 'Remove High Level Operator' function should throw an error message", async () => {
    //Test Case No. 15
    //User Role (LogIn):    Partner Reseller (-)
    //Function To Execute:  Remove High Level Operator

    const { partner, accessControl, highLevelOperatorToAddOrRemove } =
      await loadFixture(initialSetup);

    await runHighLevelOperatorCRUD(
      accessControl,
      partner,
      highLevelOperatorToAddOrRemove,
      'Partner Reseller',
      'Remove'
    );
  }); //it

  it("Test Case No. 16 - The 'Remove High Level Operator' function should throw an error message", async () => {
    //Test Case No. 16
    //User Role (LogIn):    High Level Operator (-)
    //Function To Execute:  Remove High Level Operator

    const { highLevelOperator, accessControl, highLevelOperatorToAddOrRemove } =
      await loadFixture(initialSetup);

    await runHighLevelOperatorCRUD(
      accessControl,
      highLevelOperator,
      highLevelOperatorToAddOrRemove,
      'High Level Operator',
      'Remove'
    );
  }); //it

  it("Test Case No. 17 - The 'Transfer Ownership' function should throw an error message", async () => {
    //Test Case No. 17
    //User Role (LogIn):    Regular User (-)
    //Function To Execute:  Transfer Ownership
  }); //it

  it("Test Case No. 18 - The 'Transfer Ownership' function should work succesfully", async () => {
    //Test Case No. 18
    //User Role (LogIn):    RNS Owner
    //Function To Execute:  Transfer Ownership
  }); //it

  it("Test Case No. 19 - The 'Transfer Ownership' function should throw an error message", async () => {
    //Test Case No. 19
    //User Role (LogIn):    Partner Reseller (-)
    //Function To Execute:  Transfer Ownership
  }); //it

  it("Test Case No. 20 - The 'Transfer Ownership' function should throw an error message", async () => {
    //Test Case No. 20
    //User Role (LogIn):    High Level Operator (-)
    //Function To Execute:  Transfer Ownership
  }); //it

  it("Test Case No. 21 - The 'Set Maximum Duration' function should throw an error message; the parameter was NOT altered", async () => {
    //Test Case No. 21
    //User Role (LogIn):    Regular User (-)
    //Function To Execute:  Set Maximum Duration

    const { regularUser, partner, PartnerConfiguration } = await loadFixture(
      initialSetup
    );

    let userToLoginWith = regularUser;

    let PartnerConfigurationLogIn =
      PartnerConfiguration.connect(userToLoginWith);

    const featureToTest = 'Maximum Duration';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('8'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    userToLoginWith = partner;

    PartnerConfigurationLogIn = PartnerConfiguration.connect(userToLoginWith);

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('9'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );
  }); //it

  it("Test Case No. 22 - The 'Set Minimum Duration' function should throw an error message; the parameter was NOT altered", async () => {
    //Test Case No. 22
    //User Role (LogIn):    Partner Reseller (-)
    //Function To Execute:  Set Minimum Duration

    const { regularUser, partner, PartnerConfiguration } = await loadFixture(
      initialSetup
    );

    let userToLoginWith = regularUser;

    let PartnerConfigurationLogIn =
      PartnerConfiguration.connect(userToLoginWith);

    const featureToTest = 'Minimum Duration';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('2'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    userToLoginWith = partner;

    PartnerConfigurationLogIn = PartnerConfiguration.connect(userToLoginWith);

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('3'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );
  }); //it

  it("Test Case No. 23 - The 'Set Maximum Domain Length' function should throw an error message; the parameter was NOT altered", async () => {
    //Test Case No. 23
    //User Role (LogIn):    Regular User (-)
    //Function To Execute:  Set Maximum Domain Length

    const { regularUser, partner, PartnerConfiguration } = await loadFixture(
      initialSetup
    );

    let userToLoginWith = regularUser;

    let PartnerConfigurationLogIn =
      PartnerConfiguration.connect(userToLoginWith);

    const featureToTest = 'Maximum Domain Length';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('15'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    userToLoginWith = partner;

    PartnerConfigurationLogIn = PartnerConfiguration.connect(userToLoginWith);

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('13'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );
  }); //it

  it("Test Case No. 24 - The 'Set Minimum Domain Length' function should throw an error message; the parameter was NOT altered", async () => {
    //Test Case No. 24
    //User Role (LogIn):    Partner Reseller (-)
    //Function To Execute:  Set Minimum Domain Length

    const { regularUser, partner, PartnerConfiguration } = await loadFixture(
      initialSetup
    );

    let userToLoginWith = regularUser;

    let PartnerConfigurationLogIn =
      PartnerConfiguration.connect(userToLoginWith);

    const featureToTest = 'Minimum Domain Length';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('4'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    userToLoginWith = partner;

    PartnerConfigurationLogIn = PartnerConfiguration.connect(userToLoginWith);

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      BigNumber.from('3'),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );
  }); //it

  it("Test Case No. 25 - The 'Set Fee Comission Percentage' function should throw an error message; the parameter was NOT altered", async () => {
    //Test Case No. 25
    //User Role (LogIn):    Regular User (-)
    //Function To Execute:  Set Fee Comission Percentage

    const { regularUser, partner, PartnerConfiguration } = await loadFixture(
      initialSetup
    );

    let userToLoginWith = regularUser;

    let PartnerConfigurationLogIn =
      PartnerConfiguration.connect(userToLoginWith);

    const featureToTest = 'Commission Fee Percentage';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      oneRBTC.mul(10),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    userToLoginWith = partner;

    PartnerConfigurationLogIn = PartnerConfiguration.connect(userToLoginWith);

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      oneRBTC.mul(20),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );
  }); //it

  it("Test Case No. 26 - The 'Set Discount Percentage' function should throw an error message; the parameter was NOT altered", async () => {
    //Test Case No. 26
    //User Role (LogIn):    Partner Reseller (-)
    //Function To Execute:  Set Discount Percentage

    const { regularUser, partner, PartnerConfiguration } = await loadFixture(
      initialSetup
    );

    let userToLoginWith = regularUser;

    let PartnerConfigurationLogIn =
      PartnerConfiguration.connect(userToLoginWith);

    const featureToTest = 'Discount Percentage';

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      oneRBTC.mul(40),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );

    userToLoginWith = partner;

    PartnerConfigurationLogIn = PartnerConfiguration.connect(userToLoginWith);

    await runPartnerBehaviorCRUDWithNoPermissions(
      featureToTest,
      oneRBTC.mul(30),
      PartnerConfigurationLogIn,
      userToLoginWith.address
    );
  }); //it
}); // describe

const runIsOwnerRoleTest = async (
  userAddress: string,
  accessControl: Contract,
  userRoleName: string
) => {
  let errorFound: boolean = false;

  let expectedValue = false;

  let currentValue = '';

  try {
    currentValue = await accessControl.isOwnerRole(userAddress);
  } catch (error) {
    errorFound = true;
  }

  if (userRoleName.includes('RNS Owner')) {
    expectedValue = true;

    expect(
      currentValue + '',
      'BUG: The function says the RNS Owner Admin is NOT Owner Role!'
    ).to.be.equals(expectedValue + '');
  } else if (
    userRoleName.includes('Regular User') ||
    userRoleName.includes('Partner Reseller') ||
    userRoleName.includes('High Level Operator')
  ) {
    expectedValue = false;

    expect(
      currentValue + '',
      'BUG: The function says the ' + userRoleName + ' DO IS Owner Role!'
    ).to.be.equals(expectedValue + '');
  } else throw new Error('Invalid User Role Name: ' + userRoleName);

  expect(
    errorFound + '',
    'BUG: The function isOwnerRole threw an error!'
  ).to.be.equals('false');

  console.log(
    "is Owner Role: Expected '" +
      expectedValue +
      "' for " +
      userRoleName +
      ' - Test Successful!'
  );
}; // End - run isOwnerRole Test - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const runIsHLORoleTest = async (
  userAddress: string,
  accessControl: Contract,
  userRoleName: string
) => {
  let errorFound: boolean = false;

  let expectedValue = false;

  let currentValue = '';

  try {
    currentValue = await accessControl.isHighLevelOperator(userAddress);
  } catch (error) {
    errorFound = true;
  }

  if (
    userRoleName.includes('High Level Operator') ||
    userRoleName.includes('RNS Owner')
  ) {
    expectedValue = true;

    expect(
      currentValue + '',
      'BUG: The function says the High Level Operator is NOT HLO!'
    ).to.be.equals(expectedValue + '');
  } else if (
    userRoleName.includes('Regular User') ||
    userRoleName.includes('Partner Reseller')
  ) {
    expectedValue = false;

    expect(
      currentValue + '',
      'BUG: The function says the ' + userRoleName + ' DO IS HLO!'
    ).to.be.equals(expectedValue + '');
  } else throw new Error('Invalid User Role Name: ' + userRoleName);

  expect(
    errorFound + '',
    'BUG: The function isHLORole threw an error!'
  ).to.be.equals('false');

  console.log(
    "is HLO: Expected '" +
      expectedValue +
      "' for " +
      userRoleName +
      ' - Test Successful!'
  );
}; // End - run IsHLORole Test - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const runPartnerBehaviorCRUDWithNoPermissions = async (
  parameterName: string,
  parameterNewValue: BigNumber,
  PartnerConfiguration: Contract,
  userAddress: string
) => {
  const valueBeforeChange = await getPartnerParameterValue(
    parameterName,
    PartnerConfiguration
  );

  console.log(parameterName + ' BEFORE: ' + valueBeforeChange);

  let errorFound: boolean = false;

  try {
    if (parameterName.includes('Minimum Domain Length'))
      await (await PartnerConfiguration.setMinLength(parameterNewValue)).wait();
    else if (parameterName.includes('Maximum Domain Length'))
      await (await PartnerConfiguration.setMaxLength(parameterNewValue)).wait();
    else if (parameterName.includes('Minimum Duration'))
      await (
        await PartnerConfiguration.setMinDuration(parameterNewValue)
      ).wait();
    else if (parameterName.includes('Maximum Duration'))
      await (
        await PartnerConfiguration.setMaxDuration(parameterNewValue)
      ).wait();
    else if (parameterName.includes('Commission Fee Percentage'))
      await (
        await PartnerConfiguration.setFeePercentage(parameterNewValue)
      ).wait();
    else if (parameterName.includes('Discount Percentage'))
      await (await PartnerConfiguration.setDiscount(parameterNewValue)).wait();
    else throw new Error('Invalid Parameter Name Option: ' + parameterName);
  } catch (error) {
    errorFound = true;

    const currentError = error + '';

    const bugDescription =
      "BUG: The '" +
      parameterName +
      "' Update (No Permissions) Error message was NOT displayed correctly";

    expect(currentError, bugDescription).to.contains(
      'reverted with custom error'
    );

    expect(currentError, bugDescription).to.contains('OnlyHighLevelOperator');

    expect(currentError, bugDescription).to.contains(userAddress);
  }

  expect(
    errorFound + '',
    'BUG: The expected error was NOT thrown!'
  ).to.be.equals('true');

  const valueAfterChange = await getPartnerParameterValue(
    parameterName,
    PartnerConfiguration
  );

  expect(
    valueAfterChange,
    "BUG: The '" +
      parameterName +
      "' option WAS Altered With An Invalid User Role!"
  ).to.be.equals(valueBeforeChange);

  console.log(
    parameterName +
      ' AFTER: ' +
      valueAfterChange +
      ' --- Partner Behavior (NO Permissions) Test Successful!'
  );
}; // End - No Permissions - Partner Behavior CRUD Flow - - - - - - - - - - - - - - - - -

const runHighLevelOperatorCRUD = async (
  originalAccessControl: Contract,
  userToLoginWith: SignerWithAddress,
  highLevelOperatorToAddOrRemove: SignerWithAddress,
  userRoleName: string,
  CRUDOperation: string
) => {
  let isHLO = await originalAccessControl.isHighLevelOperator(
    highLevelOperatorToAddOrRemove.address
  );

  if (CRUDOperation.includes('Add')) expect(isHLO + '').to.be.equals('false');
  else if (CRUDOperation.includes('Remove')) {
    await (
      await originalAccessControl.addHighLevelOperator(
        highLevelOperatorToAddOrRemove.address
      )
    ).wait();

    isHLO = await originalAccessControl.isHighLevelOperator(
      highLevelOperatorToAddOrRemove.address
    );

    expect(isHLO + '').to.be.equals('true');
  } else throw new Error('Invalid CRUD Operation: ' + CRUDOperation);

  console.log(CRUDOperation + ' BEFORE: Is HLO? ' + isHLO + ' - Validation OK');

  let errorFound: boolean = false;

  try {
    const AccessControlLogIn = await originalAccessControl.connect(
      userToLoginWith
    );

    if (CRUDOperation.includes('Add'))
      await (
        await AccessControlLogIn.addHighLevelOperator(
          highLevelOperatorToAddOrRemove.address
        )
      ).wait();
    else if (CRUDOperation.includes('Remove'))
      await (
        await AccessControlLogIn.removeHighLevelOperator(
          highLevelOperatorToAddOrRemove.address
        )
      ).wait();
  } catch (error) {
    errorFound = true;

    const currentError = error + '';

    const bugDescription =
      'BUG: The HLO Creation (No Permissions) Error message was NOT displayed correctly';

    expect(currentError, bugDescription).to.contains(
      'reverted with custom error'
    );

    expect(currentError, bugDescription).to.contains('OnlyOwner');

    expect(currentError, bugDescription).to.contains(userToLoginWith.address);
  } //catch

  isHLO = await originalAccessControl.isHighLevelOperator(
    highLevelOperatorToAddOrRemove.address
  );

  if (
    userRoleName.includes('Regular User') ||
    userRoleName.includes('Partner Reseller') ||
    userRoleName.includes('High Level Operator')
  ) {
    expect(
      errorFound + '',
      'BUG: The function did NOT throw an expected error!'
    ).to.be.equals('true');

    if (CRUDOperation.includes('Add')) expect(isHLO + '').to.be.equals('false');
    else if (CRUDOperation.includes('Remove'))
      expect(isHLO + '').to.be.equals('true');
  } //if NOT RNS Owner
  else if (userRoleName.includes('RNS Owner')) {
    expect(
      errorFound + '',
      'BUG: The function Threw an unexpected error!'
    ).to.be.equals('false');

    if (CRUDOperation.includes('Add')) expect(isHLO + '').to.be.equals('true');
    else if (CRUDOperation.includes('Remove'))
      expect(isHLO + '').to.be.equals('false');
  } // else RNS Owner
  else throw new Error('Invalid User Role Operation: ' + userRoleName);

  console.log(
    CRUDOperation +
      ' As ' +
      userRoleName +
      ' - Error Threw? ' +
      errorFound +
      ' - Validation OK'
  );

  console.log(
    CRUDOperation + ' AFTER: Is a HLO? ' + isHLO + ' - Validation OK'
  );
}; // End - run HighLevelOperator CRUD - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
