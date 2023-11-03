import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SECRET } from '../utils/constants';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  purchaseDomainUsingTransferAndCallWithoutCommit,
  nameToTokenId,
  generateRandomStringWithLettersAndNumbers,
  purchaseDomainWithoutCommit,
  purchaseDomainWithCommit,
  runWithdrawTestProcess,
  TwoStepsDomainOwnershipRenewal,
  oneStepDomainOwnershipRenewal,
  calculateNamePriceByDuration,
} from '../utils/operations';

import {
  runRenewalTestFlow,
  validateCommissionPayedToPartner,
  validateCorrectMoneyAmountWasPayed,
  validatePurchasedDomainHasCorrectOwner,
  validatePurchasedDomainISAvailable,
  validatePurchasedDomainIsNotAvailable,
  validateRenewalExpectedResults,
} from './RegisterDomain.spec';
import { oneRBTC } from 'test/utils/mock.utils';

describe('Registration With Emojis & Transfer Validation', () => {
  it('Test Case No. 1 - Name Ending By Emoji: After Purchase & Renovation, Domain Should NOT Available; The Domain Owner & Price Payed Are the correct; Renewal Flow Should be Successful', async () => {
    //Test Case No. 1
    //User Role:                          Regular User                                         (OK)
    //Number of Steps:                    One Step                                             (OK)
    //Domain Name - Chars:                Only Numbers + Emoji                                 (OK)
    //Domain Name - Is Available?:        Available (Never Purchased)                          (OK)
    //Duration:                           1 year                                               (OK)
    //Renewal Type:                       1 Step
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
    let moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

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

    const newNameOwner = owner;

    const NodeOwnerAsBuyer = NodeOwner.connect(buyerUser);

    await (
      await NodeOwnerAsBuyer.transferFrom(
        buyerUser.address,
        newNameOwner.address,
        nameToTokenId(domainName)
      )
    ).wait();

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      newNameOwner
    );

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('6');

    moneyAfterPurchase = await RIF.balanceOf(newNameOwner.address);

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      newNameOwner,
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      true,
      duration,
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
    //Renewal Type:                       2 Steps
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
      generateRandomStringWithLettersAndNumbers(5, true, false);

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
    let moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

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

    const newNameOwner = partner;

    const NodeOwnerAsBuyer = NodeOwner.connect(buyerUser);

    await (
      await NodeOwnerAsBuyer.transferFrom(
        buyerUser.address,
        newNameOwner.address,
        nameToTokenId(domainName)
      )
    ).wait();

    //Validate the Domain Name Owner Is the correct
    await validatePurchasedDomainHasCorrectOwner(
      domainName,
      NodeOwner,
      newNameOwner
    );

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('6');

    moneyAfterPurchase = await RIF.balanceOf(newNameOwner.address);

    await runRenewalTestFlow(
      numberOfMonthsToSimulate,
      duration,
      domainName,
      partner.address,
      newNameOwner, // New Owner Of The Name Will Renew
      PartnerRenewer,
      RIF,
      NodeOwner,
      moneyAfterPurchase,
      false,
      duration,
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
  }); //it

  it('Test Case No. 4 - Renewal With Extra Money: Additional Money was not deducted from buyer balance or added to partner commission', async () => {
    //Test Case No. 4
    //User Role:                          Regular User                                         (OK)
    //Domain Name - Chars:                Only Numbers + Emoji                                 (OK)
    //Renewal Type:                       1 Step (Additional Money)

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
      '🥹' + generateRandomStringWithLettersAndNumbers(9, false, true) + '🥹';

    const duration = BigNumber.from('1');

    const buyerUser: SignerWithAddress = regularUser;

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    let balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

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
    let moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

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

    balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('6');

    moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    const partnerAddress = partner.address;

    const namePrice = await calculateNamePriceByDuration(duration);

    let currentTimeWhenPurchased = BigNumber.from(await time.latest()); //currentTime - Blockchain Clock Current Moment

    await oneStepDomainOwnershipRenewal(
      domainName,
      duration,
      namePrice.add(oneRBTC.mul(BigNumber.from('5'))), //Additional Money
      partnerAddress,
      buyerUser,
      PartnerRenewer,
      RIF,
      numberOfMonthsToSimulate
    );

    let moneyAfterRenovation = await RIF.balanceOf(buyerUser.address);

    await validateRenewalExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyAfterPurchase,
      moneyAfterRenovation,
      duration,
      currentTimeWhenPurchased,
      duration,
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

    balanceBeforePurchaseCommision = await FeeManager.getBalance(
      partner.address
    );

    moneyAfterPurchase = await RIF.balanceOf(buyerUser.address);

    const renewalDurationInSeconds = duration.mul(BigNumber.from('31536000'));

    currentTimeWhenPurchased = currentTimeWhenPurchased.add(
      renewalDurationInSeconds
    ); //currentTime - Blockchain Clock Current Moment

    await TwoStepsDomainOwnershipRenewal(
      domainName,
      duration,
      namePrice.add(oneRBTC.mul(BigNumber.from('4'))), //additionalMoney
      partnerAddress,
      buyerUser,
      PartnerRenewer,
      RIF,
      numberOfMonthsToSimulate
    );

    moneyAfterRenovation = await RIF.balanceOf(buyerUser.address);

    await validateRenewalExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyAfterPurchase,
      moneyAfterRenovation,
      duration,
      currentTimeWhenPurchased,
      duration,
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
  }); //it
}); // describe
