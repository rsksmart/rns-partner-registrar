import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  SECRET,
  MINIMUM_DOMAIN_NAME_LENGTH,
  MAXIMUM_DOMAIN_NAME_LENGTH,
  FEE_PERCENTAGE,
} from '../utils/constants';
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
  PartnerRegistrar,
  NodeOwner,
  ERC677Token,
  PartnerRenewer,
  FeeManager,
  PartnerConfiguration,
} from 'typechain-types';
import { MockContract } from '@defi-wonderland/smock';
import { ConstructorFragment } from '@ethersproject/abi';
import { calculatePercentageWPrecision, oneRBTC } from '../../utils/mock.utils';
import { partnerConfiguration } from 'typechain-types/contracts';
import {
  runRenewalTestFlow,
  validateCommissionPayedToPartner,
  validateCorrectMoneyAmountWasPayed,
  validatePurchasedDomainHasCorrectOwner,
  validatePurchasedDomainISAvailable,
  validatePurchasedDomainIsNotAvailable,
} from './RegisterDomain.spec';

describe('Registration With Emojis', () => {
  it('Test Case No. 1 - Name Ending By Emoji: After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct; Renewal Flow Should be Successful', async () => {
    //Test Case No. 1
    //User Role:                          Regular User                                         (OK)
    //Number of Steps:                    One Step                                             (OK)
    //Domain Name - Chars:                Only Numbers + Emoji                                 (OK)
    //Domain Name - Is Available?:        Available (Never Purchased)                          (OK)
    //Duration:                           1 year                                               (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      owner,
      regularUser,
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName =
      generateRandomStringWithLettersAndNumbers(10, false, true) + '🥹';

    console.log('Name: ' + domainName);

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
      true,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 2 - Name Starting By Emoji: After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct; Renewal Flow Should be Successful', async () => {
    //Test Case No. 2
    //User Role:                          Regular User                                         (OK)
    //Number of Steps:                    Two steps                                            (OK)
    //Domain Name - Chars:                Emojis + Only Letters                                (OK)
    //Domain Name - Is Available?:        Available (Never Purchased)                          (OK)
    //Duration:                           2 year                                               (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      owner,
      regularUser,
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName =
      '😄' + generateRandomStringWithLettersAndNumbers(10, true, false);

    console.log('Name: ' + domainName);

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

  it('Test Case No. 3 - Emoji Amid the Name: After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct; Renewal Flow Should be Successful', async () => {
    //Test Case No. 3
    //User Role:                          Regular User                                         (OK)
    //Number of Steps:                    Three steps                                          (OK)
    //Domain Name - Chars:                Letters & Number + Emojis At the Middle              (OK)
    //Domain Name - Is Available?:        Available (Never Purchased)                          (OK)
    //Duration:                           3 year                                               (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      owner,
      regularUser,
      PartnerRenewer,
      FeeManager,
    } = await loadFixture(initialSetup);

    const domainName =
      generateRandomStringWithLettersAndNumbers(5, true, false) +
      '🧐' +
      generateRandomStringWithLettersAndNumbers(5, false, true);

    const commitAge = BigNumber.from('10');

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
}); // describe
