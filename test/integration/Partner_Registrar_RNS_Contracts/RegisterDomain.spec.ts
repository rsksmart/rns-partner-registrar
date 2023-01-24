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
  purchaseDomainUsingTransferAndCallWithCommit,
  generateRandomStringWithLettersAndNumbers,
  purchaseDomainWithoutCommit,
  purchaseDomainWithCommit,
} from '../utils/operations';
import { PartnerRegistrar, NodeOwner } from 'typechain-types';
import { namehash } from 'ethers/lib/utils';

describe.skip('Pucharse Name By 1st Time (Domain Registration)', () => {
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

  it('Test Case No. 3 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 3
    //User Role:                          RNS Owner                                            (OK)
    //Number of Steps:                    Two steps                                            (OK)
    //Domain Name - Chars:                Valid (Within Allowed Range) - Letters And Number    (OK)
    //Domain Name - Is Available?:        Available (Never Purchased)                          (OK)
    //MinCommitmentAge:                   Equals To Zero                                       (OK)
    //Duration:                           1 year                                               (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      owner,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      true
    );

    const duration = BigNumber.from('1');

    const buyerUser: SignerWithAddress = owner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainWithoutCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration
    );

    //Expected Results

    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 4 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 4
    //User Role:                         Partner Reseller (OK)
    //Number of Steps:                   One step         (OK)
    //Domain Name - Chars:               Valid (Within Allowed Range) - Letters and Numbers (OK)
    //Domain Name - Is Available?:       Available (Never Purchased) (OK)
    //MinCommitmentAge:                  Equals To Zero   (OK)
    //Duration:                          2 years (OK)

    const { NodeOwner, PartnerRegistrar, partner, RIF, PartnerConfiguration } =
      await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      true
    );

    const duration = BigNumber.from('2');

    const buyerUser: SignerWithAddress = partner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainUsingTransferAndCallWithoutCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration
    );

    //TODO - Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 5 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 5
    //User Role:                         RNS Owner (OK)
    //Number of Steps:                   Three steps (OK)
    //Domain Name - Chars:               Valid (Within Allowed Range) - Only Letters (OK)
    //Domain Name - Is Available?:       Available (Never Purchased) (OK)
    //MinCommitmentAge:                  Greater than zero (OK)
    //Duration:                          Between 3 and 4 Years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      owner,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      false
    );

    const duration = BigNumber.from('3');

    const commitAge = BigNumber.from('10');

    const buyerUser: SignerWithAddress = owner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainWithCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      commitAge
    );

    //TODO - Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 6 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 6
    //User Role:                         Partner Reseller (OK)
    //Number of Steps:                   Three steps (OK)
    //Domain Name - Chars:               Valid (Within Allowed Range) - Only Numbers (OK)
    //Domain Name - Is Available?:       Available (Never Purchased)
    //MinCommitmentAge:                  Greater than zero (OK)
    //Duration:                          Between 3 and 4 Years (OK)

    const { NodeOwner, PartnerRegistrar, partner, RIF, PartnerConfiguration } =
      await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      false,
      true
    );

    const duration = BigNumber.from('4');

    const commitAge = BigNumber.from('20');

    const buyerUser: SignerWithAddress = partner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainWithCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      commitAge
    );

    //TODO - Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 7 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 7
    //User Role:                         Regular User
    //Number of Steps:                   One step
    //Domain Name - Chars:               Valid (Within Allowed Range) - Letters and Numbers
    //Domain Name - Is Available?:       Available (Never Purchased)
    //MinCommitmentAge:                  Equals To Zero
    //Duration:                          5 years

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      true
    );

    const duration = BigNumber.from('5');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainUsingTransferAndCallWithoutCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration
    );

    //Expected Results

    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it.only('Test Case No. 8 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 8
    //User Role:                       Regular User                                          (OK)
    //Number of Steps:                 Two steps                                             (OK)
    //Domain Name - Chars:             Valid (Within Allowed Range) - Only Letters           (OK)
    //Domain Name - Is Available?:     Available (Never Purchased)                           (OK)
    //MinCommitmentAge:                Greater than zero                                     (OK)
    //Duration:                        5 years                                               (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const duration = BigNumber.from('5');

    const commitAge = BigNumber.from('30');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainUsingTransferAndCallWithCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      commitAge
    );

    //TODO - Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 9 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 9
    //User Role:                       Regular User
    //Number of Steps:                 Three steps
    //Domain Name - Chars:             Valid (Within Allowed Range) - Only Numbers
    //Domain Name - Is Available?:     Available (Never Purchased)
    //MinCommitmentAge:                Greater than zero
    //Duration:                        1 year

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      false,
      true
    );

    const duration = BigNumber.from('1');

    const commitAge = BigNumber.from('10');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainWithCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      commitAge
    );

    //TODO - Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 10 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 10
    //User Role:                       Regular User (OK)
    //Number of Steps:                 Three steps (OK)
    //Domain Name - Chars:             Valid (Within Allowed Range) - Letters and Numbers (OK)
    //Domain Name - Is Available?:     Available (Never Purchased) (OK)
    //MinCommitmentAge:                Greater than zero (OK)
    //Duration:                        2 years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      true
    );

    const duration = BigNumber.from('2');

    const commitAge = BigNumber.from('10');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainWithCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      commitAge
    );

    //TODO - Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 11 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 11
    //User Role:                       Regular User (OK)
    //Number of Steps:                 One step (OK)
    //Domain Name - Chars:             Valid (Within Allowed Range) - Letters and Numbers (OK)
    //Domain Name - Is Available?:     Available (Never Purchased) (OK)
    //MinCommitmentAge:                Equal To Zero (OK)
    //Duration:                        Between 3 and 4 Years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      true
    );

    const duration = BigNumber.from('3');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainUsingTransferAndCallWithoutCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration
    );

    //Expected Results

    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 12 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 12
    //User Role:                       Regular User (OK)
    //Number of Steps:                 Three steps (OK)
    //Domain Name - Chars:             Valid (Within Allowed Range) - Only Letters (OK)
    //Domain Name - Is Available?:     Available (Never Purchased) (OK)
    //MinCommitmentAge:                Greater than zero (OK)
    //Duration:                        5 years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      false
    );

    const duration = BigNumber.from('5');

    const commitAge = BigNumber.from('20');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainWithCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration,
      commitAge
    );

    //TODO - Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it

  it('Test Case No. 13 - ... ... ...', async () => {
    //Test Case No. 13
    //User Role:                       Partner Reseller
    //Number of Steps:                 Two steps
    //Domain Name - Chars:             Greater Than The Maximum Allowed (-) - Only Numbers
    //Domain Name - Is Available?:     Available (Never Purchased)
    //MinCommitmentAge:                Equals To Zero
    //Duration:                        Between 3 and 4 Years
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
    //Duration:                       5 years
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
    //Duration:                       5 years
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

  it('Test Case No. 22 - After Purchase Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
    //Test Case No. 22
    //User Role:                      Regular User
    //Number of Steps:                Two steps
    //Domain Name - Chars:            Valid (Within Allowed Range) - Letters And Number
    //Domain Name - Is Available?:    Available (Never Purchased)
    //MinCommitmentAge:               Equals To Zero
    //Duration:                       1 year

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      true
    );

    const duration = BigNumber.from('1');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    await purchaseDomainWithoutCommit(
      domainName,
      duration,
      SECRET(),
      buyerUser,
      PartnerRegistrar,
      RIF,
      partner.address,
      PartnerConfiguration
    );

    //Expected Results

    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase
    );
  }); //it "
}); // describe

//Validate Domain Name IS OR ISN'T Available anymore
const validatePurchasedDomainIsNotAvailable = async (
  NodeOwner: NodeOwner,
  domainName: string
) => {
  const tokenName = nameToTokenId(domainName);

  const isNameAvailable = await NodeOwner.available(tokenName);

  expect(isNameAvailable, 'BUG: The Purchased Name IS Available!').to.be.false;
};

const validatePurchasedDomainISAvailable = async (
  NodeOwner: NodeOwner,
  domainName: string
) => {
  const tokenName = nameToTokenId(domainName);

  const isNameAvailable = await NodeOwner.available(tokenName);

  expect(
    isNameAvailable,
    'BUG: The NOT PURCHASED Purchased Name IS NOT Available!'
  ).to.be.true;
};

//Validate the Domain Name Owner Is the correct (SERGIO)
const validatePurchasedDomainHasCorrectOwner = async (
  domainName: string,
  NodeOwner: NodeOwner,
  owner: SignerWithAddress
) => {
  const TOKENID = nameToTokenId(domainName);

  const ownerOfDomainPurchased = await NodeOwner.ownerOf(TOKENID);

  expect(
    ownerOfDomainPurchased,
    'BUG: The Purchased Domain has the incorrect Owner Address'
  ).to.be.equals(owner.address);
};

//Validate the correct money amount from the buyer (SERGIO)

const validateCorrectMoneyAmountWasPayed = async (
  duration: BigNumber,
  moneyAfterPurchase: BigNumber,
  moneyBeforePurchase: BigNumber
) => {
  const expectedPrice = calculateNamePriceByDuration(duration);

  const expectedBalance = moneyBeforePurchase.sub(expectedPrice);

  expect(
    +moneyAfterPurchase,
    'BUG: The spent balance is incorrect!'
  ).to.be.equals(+expectedBalance);
};
