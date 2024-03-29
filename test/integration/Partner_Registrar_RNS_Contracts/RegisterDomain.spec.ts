import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SECRET } from '../utils/constants';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  calculateNamePriceByDuration,
  purchaseDomainUsingTransferAndCallWithoutCommit,
  nameToTokenId,
  purchaseDomainUsingTransferAndCallWithCommit,
  generateRandomStringWithLettersAndNumbers,
  purchaseDomainWithoutCommit,
  purchaseDomainWithCommit,
  TwoStepsDomainOwnershipRenewal,
  oneStepDomainOwnershipRenewal,
  runWithdrawTestProcess,
} from '../utils/operations';
import {
  NodeOwner,
  ERC677Token,
  PartnerRenewer,
  FeeManager,
  PartnerConfiguration,
} from 'typechain-types';
import { MockContract } from '@defi-wonderland/smock';
import { calculatePercentageWPrecision, oneRBTC } from '../../utils/mock.utils';

describe('Pucharse Name By 1st Time (Domain Registration) & Renovation', () => {
  it('Test Case No. 2 - Domain should NOT be purchased; throw an error message; Money should NOT be deducted from the Balance; Commision should NOT be deposited', async () => {
    //Test Case No. 2
    //User Role:                           Regular User (OK)
    //Number of Steps:                     Two steps (OK)
    //Domain Name - Chars:                 Valid (Within Allowed Range) - Only Numbers (OK)
    //Domain Name - Is Available?:         Available (Never Purchased) (OK)
    //MinCommitmentAge:                    Greater than zero (OK)
    //Duration:                            0 Years (-)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      false,
      true
    );

    const duration = BigNumber.from('0');

    const commitAge = BigNumber.from('30');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)

    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      expect(
        currentError,
        'BUG: The ZERO duration error message was NOT displayed'
      ).to.contains('Duration less than minimum duration');

      expect(
        currentError,
        'BUG: The ZERO duration error message was NOT displayed'
      ).to.contains('InvalidDuration');
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Zero Duration'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 3 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct; Renewal Flow Should be Successful', async () => {
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
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      true
    );

    const duration = BigNumber.from('1');

    const buyerUser: SignerWithAddress = owner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    //Validate the commission was payed to the referred partner
    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('6');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 4 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commision & Price Payed Are the correct', async () => {
    //Test Case No. 4
    //User Role:                         Partner Reseller (OK)
    //Number of Steps:                   One step         (OK)
    //Domain Name - Chars:               Valid (Within Allowed Range) - Letters and Numbers (OK)
    //Domain Name - Is Available?:       Available (Never Purchased) (OK)
    //MinCommitmentAge:                  Equals To Zero   (OK)
    //Duration:                          2 years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      true
    );

    const duration = BigNumber.from('2');

    const buyerUser: SignerWithAddress = partner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //Enter Money Before Chus

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

    // Expected Results
    //Validate Domain Name ISN'T Available anymore
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      buyerUser
    );

    //Validate the correct money amount from the buyer
    let moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('12');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      true,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 5 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
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
      PartnerRenewer,
      FeeManager,
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

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('15');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 6 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commission & Price Payed Are the correct', async () => {
    //Test Case No. 6
    //User Role:                         Partner Reseller (OK)
    //Number of Steps:                   Three steps (OK)
    //Domain Name - Chars:               Valid (Within Allowed Range) - Only Numbers (OK)
    //Domain Name - Is Available?:       Available (Never Purchased)
    //MinCommitmentAge:                  Greater than zero (OK)
    //Duration:                          Between 3 and 4 Years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      false,
      true
    );

    const duration = BigNumber.from('4');

    const commitAge = BigNumber.from('20');

    const buyerUser: SignerWithAddress = partner;

    await (await RIF.transfer(buyerUser.address, oneRBTC.mul(10))).wait();

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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
    let moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('24');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 7 & 20 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct; Occupied Domain Should NOT be able to be purchased again', async () => {
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
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      true
    );

    const duration = BigNumber.from('5');

    const buyerUser: SignerWithAddress = regularUser;

    await (await RIF.transfer(buyerUser.address, oneRBTC.mul(10))).wait();

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    let balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    //Test Case No. 20
    //User Role:                      Regular User
    //Number of Steps:                One step
    //Domain Name - Is Available?:    Occupied By Regular User (-)
    let errorFound: boolean = false;

    balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      validateErrorMessageWhenDomainIsOccupied(currentError);
    }

    expect(
      errorFound,
      'BUG: NO error was thrown when I purchased the domain twice!'
    ).to.be.equals(true);

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('36');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      true,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 8 & 23 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commission & Price Payed Are the correct; Occupied Domain Should NOT be able to be purchased again', async () => {
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
      PartnerRenewer,
      FeeManager,
      owner,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const duration = BigNumber.from('5');

    const commitAge = BigNumber.from('30');

    const buyerUser: SignerWithAddress = regularUser;

    await (await RIF.transfer(buyerUser.address, oneRBTC.mul(10))).wait();

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    let balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    //Test Case No. 23
    //User Role:                      Regular User
    //Number of Steps:                Two step
    //Domain Name - Is Available?:    Occupied By Regular User (-)
    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      validateErrorMessageWhenDomainIsOccupied(currentError);
    }

    expect(
      errorFound,
      'BUG: NO error was thrown when I purchased the domain twice!'
    ).to.be.equals(true);

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('20');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 9 & 24 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commission & Price Payed Are the correct; Occupied Domain Should NOT be able to be purchased again', async () => {
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
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      false,
      true
    );

    const duration = BigNumber.from('1');

    const commitAge = BigNumber.from('10');

    const buyerUser: SignerWithAddress = regularUser;

    await (await RIF.transfer(buyerUser.address, oneRBTC.mul(10))).wait();

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    let balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    //Test Case No. 24
    //User Role:                      Regular User
    //Number of Steps:                Three step
    //Domain Name - Is Available?:    Occupied By Regular User (-)
    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      validateErrorMessageWhenDomainIsOccupied(currentError);
    }

    expect(
      errorFound,
      'BUG: NO error was thrown when I purchased the domain twice!'
    ).to.be.equals(true);

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('10');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 10 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commission & Price Payed Are the correct', async () => {
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
      PartnerRenewer,
      FeeManager,
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

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('15');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 11 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct', async () => {
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
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      true
    );

    const duration = BigNumber.from('3');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('12');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      true,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 12 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commission & Price Payed Are the correct', async () => {
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
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      false
    );

    const duration = BigNumber.from('5');

    const commitAge = BigNumber.from('20');

    const buyerUser: SignerWithAddress = regularUser;

    await (await RIF.transfer(buyerUser.address, oneRBTC.mul(10))).wait();

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('48');

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 13 - Should throw an error message; The domain was not registered; NO deducted money from balance; NO Commission Payed', async () => {
    //Test Case No. 13
    //User Role:                       Regular User (OK)
    //Number of Steps:                 One steps (OK)
    //Domain Name - Chars:             Greater Than The Maximum Allowed (-) - Only Numbers (OK)
    //Domain Name - Is Available?:     Available (Never Purchased) (OK)
    //MinCommitmentAge:                Equals To Zero (OK)
    //Duration:                        Between 3 and 4 Years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      30,
      false,
      true
    );

    const duration = BigNumber.from('4');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //Enter Money Before Chus

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)
    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Maximum Domain Length error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(
        'Name is more than max length'
      );

      expect(currentError, bugDescription).to.contains('InvalidName');

      expect(currentError, bugDescription).to.contains(domainName);

      expect(currentError, bugDescription).to.contains(
        'reverted with custom error'
      );
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Too Long Domain Name'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 14 - Should throw an error message; The domain was not registered; NO deducted money from balance; NO Commission Payed', async () => {
    //Test Case No. 14
    //User Role:                       Regular User (OK)
    //Number of Steps:                 Two step (OK)
    //Domain Name - Chars:             Smaller Than 5 (Minimum Allowed) (-) - Letters and Numbers (OK)
    //Domain Name - Is Available?:     Available (Never Purchased) (OK)
    //MinCommitmentAge:                Equals To Zero (OK)
    //Duration:                        2 years

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = 'A1';

    const duration = BigNumber.from('2');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    //INPUT
    //1st - Domain Name to Purchase
    //2nd - Duration (years)
    //4th - Role User (Regular, Partner, RNS Owner)

    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Minimum Domain Length error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(
        'Name is less than minimum length'
      );

      expect(currentError, bugDescription).to.contains('InvalidName');

      expect(currentError, bugDescription).to.contains(domainName);

      expect(currentError, bugDescription).to.contains(
        'reverted with custom error'
      );
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Too Short Domain Name'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 15 - Should throw an error message; The domain was not registered; NO deducted money from balance', async () => {
    //Test Case No. 15
    //User Role:                      Partner Reseller (OK)
    //Number of Steps:                Three steps (OK)
    //Domain Name - Chars:            Empty Domain Name (-) (OK)
    //MinCommitmentAge:               Greater Than Zero (OK)
    //Duration:                       5 years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = '';

    const duration = BigNumber.from('5');

    const commitAge = BigNumber.from('10');

    const buyerUser: SignerWithAddress = partner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Minimum Domain Length error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(
        'Name is less than minimum length'
      );

      expect(currentError, bugDescription).to.contains('InvalidName');

      expect(currentError, bugDescription).to.contains(domainName);

      expect(currentError, bugDescription).to.contains(
        'reverted with custom error'
      );
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Empty Domain Name'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  //Not Integrated yet
  it.skip('Test Case No. 16 - Should throw an error message; The domain was not registered; NO deducted money from balance', async () => {
    //Test Case No. 16
    //User Role:                       Regular User (OK)
    //Number of Steps:                 One step (OK)
    //Domain Name - Chars:             Valid Length (Within Allowed Range) - With Special Chars (-) (OK)
    //Domain Name - Is Available?:     Available (Never Purchased) (OK)
    //MinCommitmentAge:                Equals To Zero (OK)
    //Duration:                        1 year (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName =
      generateRandomStringWithLettersAndNumbers(10, true, false) + '$%/';

    const duration = BigNumber.from('1');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Minimum Domain Length error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(
        'Name is less than minimum length'
      );

      expect(currentError, bugDescription).to.contains('InvalidName');

      expect(currentError, bugDescription).to.contains(domainName);

      expect(currentError, bugDescription).to.contains(
        'reverted with custom error'
      );
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Domain With Special Characters'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 17 - Should throw an error message; The domain was not registered; NO deducted money from balance', async () => {
    //Test Case No. 17
    //User Role:                       Partner Reseller (OK)
    //Number of Steps:                 Two steps (OK)
    //Domain Name - Chars:             Valid (Within Allowed Range) - Only Letters (OK)
    //Domain Name - Is Available?:     Available (Never Purchased) (OK)
    //MinCommitmentAge:                Negative Number (-) (OK)
    //Duration:                        2 years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const duration = BigNumber.from('2');

    const commitAge = BigNumber.from('-15');

    const buyerUser: SignerWithAddress = partner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    let errorFound: boolean = false;

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Negative Commit Number error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains('value out-of-bounds');

      expect(currentError, bugDescription).to.contains('minCommitmentAge');

      expect(currentError, bugDescription).to.contains('BigNumber');

      expect(currentError, bugDescription).to.contains('code=INVALID_ARGUMENT');
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Negative Commit Value'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 18 - Should throw an error message; The domain was not registered; NO deducted money from balance; NO Commission Payed', async () => {
    //Test Case No. 18
    //User Role:                      Regular User (OK)
    //Number of Steps:                Two steps (OK)
    //Domain Name - Chars:            Valid (Within Allowed Range) - Only Numbers (OK)
    //Domain Name - Is Available?:    Available (Never Purchased) (OK)
    //MinCommitmentAge:               Negative Number (-) (OK)
    //Duration:                       Between 3 and 4 Years (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      false,
      true
    );

    const duration = BigNumber.from('4');

    const commitAge = BigNumber.from('-1');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Negative Commit Number error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains('value out-of-bounds');

      expect(currentError, bugDescription).to.contains('minCommitmentAge');

      expect(currentError, bugDescription).to.contains('BigNumber');

      expect(currentError, bugDescription).to.contains('code=INVALID_ARGUMENT');
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Negative Commit Value'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 19 - Should throw an error message; The domain was not registered; NO deducted money from balance; NO Commission Payed', async () => {
    //Test Case No. 19
    //User Role:                      RNS Owner (OK)
    //Number of Steps:                Three steps (OK)
    //Domain Name - Chars:            Valid (Within Allowed Range) - Letters and Numbers (OK)
    //Domain Name - Is Available?:    Available (Never Purchased) (OK)
    //MinCommitmentAge:               NO Commitment Provided (-) (OK)
    //Duration:                       5 years

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      owner,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      true
    );

    const duration = BigNumber.from('5');

    const commitAge = BigNumber.from('1000000');

    const buyerUser: SignerWithAddress = owner;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    let errorFound: boolean = false;

    try {
      await purchaseDomainWithCommit(
        domainName,
        duration,
        SECRET(),
        buyerUser,
        PartnerRegistrar,
        RIF,
        partner.address,
        PartnerConfiguration,
        commitAge,
        false
      );
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The NO Provided Commit error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(
        'CustomError("No commitment found")'
      );

      expect(currentError, bugDescription).to.contains(
        'Error: VM Exception while processing transaction: reverted with custom error \'CustomError("No commitment found")'
      );
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);
    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'No Commitment Provided'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 21 - Should throw an error message; The domain was not registered; NO deducted money from balance; NO Commission Payed', async () => {
    //Test Case No. 21
    //User Role:                     Regular User (OK)
    //Number of Steps:               One step (OK)
    //Domain Name - Chars:           Valid (Within Allowed Range) - Letters and Numbers (OK)
    //Domain Name - Is Available?:   Available (Never Purchased) (OK)
    //MinCommitmentAge:              Equals To Zero (OK)
    //Duration:                      Greater Than Maximum (-) (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      true
    );

    const duration = BigNumber.from('6');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    let errorFound: boolean = false;

    try {
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
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Maximum Duration error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(
        'Duration is more than max duration'
      );

      expect(currentError, bugDescription).to.contains(
        'VM Exception while processing transaction: reverted with custom error'
      );

      expect(currentError, bugDescription).to.contains('Error');

      expect(currentError, bugDescription).to.contains('InvalidDuration');
    }

    //Expected Results for Negative Tests
    const moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      moneyAfterPurchase,
      'Duration > Maximum Allowed'
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      false,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, true);
  }); //it

  it('Test Case No. 22 - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commission & Price Payed Are the correct', async () => {
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
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      20,
      true,
      true
    );

    const duration = BigNumber.from('1');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    //Expected Resultsg

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);
  }); //it "

  it('Test Case No. 16 (POSITIVE) - After Purchase & Renovation, Domain Should NOT Available; The Domain Owner, Commission & Price Payed Are the correct', async () => {
    //Test Case No. 16
    //User Role:                       Regular User (OK)
    //Number of Steps:                 Three steps (OK)
    //Domain Name - Chars:             Valid (Within Allowed Range) - Special Chars (OK)
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
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName =
      generateRandomStringWithLettersAndNumbers(10, true, false) + '#$%&';

    const duration = BigNumber.from('2');

    const commitAge = BigNumber.from('10');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    const balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

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

    await validateCorrectMoneyAmountWasPayed(
      duration,
      moneyAfterPurchase,
      moneyBeforePurchase,
      PartnerConfiguration
    );

    await validateCommissionPayedToPartner(
      duration,
      partner.address,
      balanceBeforePurchaseCommision,
      FeeManager,
      true,
      PartnerConfiguration
    );

    await runWithdrawTestProcess(partner, FeeManager, RIF, false);
  }); //it
}); // describe

//Aid Functions - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//Validate Domain Name IS OR ISN'T Available anymore
export const validatePurchasedDomainIsNotAvailable = async (
  NodeOwner: NodeOwner,
  domainName: string
) => {
  const tokenName = nameToTokenId(domainName);

  const isNameAvailable = await NodeOwner.available(tokenName);

  expect(isNameAvailable, 'BUG: The Purchased Name IS Available!').to.be.false;
};

export const validatePurchasedDomainISAvailable = async (
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
export const validatePurchasedDomainHasCorrectOwner = async (
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

//Validate the correct money amount from the buyer
export const validateCorrectMoneyAmountWasPayed = async (
  duration: BigNumber,
  moneyAfterPurchase: BigNumber,
  moneyBeforePurchase: BigNumber,
  PartnerConfiguration: PartnerConfiguration
) => {
  const discountPercentage = await PartnerConfiguration.getDiscount();

  let expectedPrice = calculateNamePriceByDuration(duration);

  const oneHundred = oneRBTC.mul(100);

  const discountedAmount = expectedPrice
    .mul(discountPercentage)
    .div(oneHundred);

  expectedPrice = expectedPrice.sub(discountedAmount);

  const expectedBalance = moneyBeforePurchase.sub(expectedPrice);

  expect(
    moneyAfterPurchase + '',
    'BUG: The spent balance is incorrect (The balance after purchase is incorrect)!'
  ).to.be.equals(expectedBalance + '');
};

export const validateNegativeFlowExpectedResults = async (
  errorFound: boolean,
  NodeOwner: NodeOwner,
  domainName: string,
  buyerUser: SignerWithAddress,
  moneyBeforePurchase: BigNumber,
  moneyAfterPurchase: BigNumber,
  additionalBUGInformation: string
) => {
  //Expected Result - Validate Error was displayed
  expect(
    errorFound + '',
    'BUG: Error Message (' + additionalBUGInformation + ') was NOT thrown!'
  ).to.be.equals('true');

  //Expected Result - Domains should be available yet (NOT Purchased)
  await validatePurchasedDomainISAvailable(NodeOwner, domainName);

  //Expected Result - Money should NOT be deducted from the Balance
  expect(
    moneyBeforePurchase + '',
    'BUG: NOT Purchased domain was deducted from User Balance!'
  ).to.be.equals(moneyAfterPurchase + '');
}; // End - Validate Negative Flow

const validateErrorMessageWhenDomainIsOccupied = (currentError: string) => {
  const bugDescription =
    'Error Message (purchase a occupied domain) Is not displayed correctly!';

  expect(currentError, bugDescription).contains(
    'Error: VM Exception while processing transaction: reverted with reason'
  );

  expect(currentError, bugDescription).contains('Not available');
}; // End - Validate Error Message When Occupied

export const validateRenewalExpectedResults = async (
  NodeOwner: NodeOwner,
  domainName: string,
  buyerUser: SignerWithAddress,
  moneyBeforeRenovation: BigNumber,
  moneyAfterRenovation: BigNumber,
  duration: BigNumber,
  currentTimeWhenPurchased: BigNumber,
  durationPurchase: BigNumber,
  PartnerConfiguration: PartnerConfiguration
) => {
  await validatePurchasedDomainHasCorrectOwner(
    domainName,
    NodeOwner,
    buyerUser
  );

  await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);

  await validateCorrectMoneyAmountWasPayed(
    duration,
    moneyAfterRenovation,
    moneyBeforeRenovation,
    PartnerConfiguration
  );

  //Validate Expiration Time Is Correct according to the Duration Renovation and Time Simulated
  const tokenId = nameToTokenId(domainName);

  const currentExpirationTimeAfterRenovation = await NodeOwner.expirationTime(
    tokenId
  );

  const secondsAtAYear = BigNumber.from('31536000');

  const renewalDurationInSeconds = duration.mul(secondsAtAYear);

  const purchaseDurationInSeconds = durationPurchase.mul(secondsAtAYear);

  const expectedExpirationAfterRenovation = currentTimeWhenPurchased
    .add(renewalDurationInSeconds)
    .add(purchaseDurationInSeconds); // I need also to include the number of years of the initial purchase

  const timeDifference = currentExpirationTimeAfterRenovation
    .sub(expectedExpirationAfterRenovation)
    .abs();

  expect(
    timeDifference,
    'BUG: Expiration Date Is Incorrect (More Than 5 Minutes Of Difference)!'
  ).to.be.lessThanOrEqual(300);
}; //End - Validate Renewal Expected Results

export const runRenewalTestFlow = async (
  numberOfMonthsToSimulate: BigNumber,
  duration: BigNumber,
  domainName: string,
  partnerAddress: string,
  buyerUser: SignerWithAddress,
  partnerRenewer: PartnerRenewer,
  RIF: MockContract<ERC677Token>,
  NodeOwner: NodeOwner,
  moneyAfterPurchase: BigNumber,
  isOneStep: boolean,
  durationPurchase: BigNumber,
  PartnerConfiguration: PartnerConfiguration
) => {
  const namePrice = await calculateNamePriceByDuration(duration);

  const currentTimeWhenPurchased = BigNumber.from(await time.latest()); //currentTime - Blockchain Clock Current Moment

  if (isOneStep) {
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
  } else {
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
  }

  const moneyAfterRenovation = await RIF.balanceOf(buyerUser.address);

  await validateRenewalExpectedResults(
    NodeOwner,
    domainName,
    buyerUser,
    moneyAfterPurchase,
    moneyAfterRenovation,
    duration,
    currentTimeWhenPurchased,
    durationPurchase,
    PartnerConfiguration
  );
}; //End - Renewal Flow

export const validateCommissionPayedToPartner = async (
  duration: BigNumber,
  partnerAddress: string,
  balanceBeforePurchaseCommision: BigNumber,
  FeeManager: FeeManager,
  wasPurchaseSuccessful: boolean,
  PartnerConfiguration: Contract
) => {
  const currentBalanceAfterPurchaseCommision = await FeeManager.getBalance(
    partnerAddress
  );

  const feePercentage = await PartnerConfiguration.getFeePercentage();

  if (wasPurchaseSuccessful) {
    let expectedPrice = calculateNamePriceByDuration(duration);

    const discountPercentage = await PartnerConfiguration.getDiscount();

    const oneHundred = oneRBTC.mul(100);

    const discountedAmount = expectedPrice
      .mul(discountPercentage)
      .div(oneHundred);

    expectedPrice = expectedPrice.sub(discountedAmount);

    const expectedCommision = calculatePercentageWPrecision(
      expectedPrice,
      feePercentage
    );

    const expectedBalanceAfterPurchaseCommision =
      balanceBeforePurchaseCommision.add(expectedCommision);

    expect(
      +currentBalanceAfterPurchaseCommision,
      'BUG: Fee balance of the Partner was NOT updated as expected!'
    ).to.be.equals(+expectedBalanceAfterPurchaseCommision);
  } else {
    expect(
      +currentBalanceAfterPurchaseCommision,
      'BUG: Fee Balance of the Partner was altered, despite of the failed purchase!'
    ).to.be.equals(+balanceBeforePurchaseCommision);
  }
}; //End - Renewal Flow
