import { initialSetup } from '../utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SECRET } from '../utils/constants';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  calculateNamePriceByDuration,
  generateRandomStringWithLettersAndNumbers,
  nameToTokenId,
  oneStepDomainOwnershipRenewal,
  purchaseDomainUsingTransferAndCallWithoutCommit,
  purchaseDomainWithoutCommit,
  TwoStepsDomainOwnershipRenewal,
} from '../utils/operations';
import { NodeOwner, ERC677Token, PartnerConfiguration } from 'typechain-types';

import {
  validateCorrectMoneyAmountWasPayed,
  validateNegativeFlowExpectedResults,
  validatePurchasedDomainHasCorrectOwner,
  validatePurchasedDomainISAvailable,
  validatePurchasedDomainIsNotAvailable,
  validateRenewalExpectedResults,
} from './RegisterDomain.spec';
import { MockContract } from '@defi-wonderland/smock';
import { oneRBTC } from 'test/utils/mock.utils';

describe('Renewal Name - Negative Test Cases', () => {
  it('Test Case No. 11 - Should Throw an Error; No Money Was Payed for Renotation & Expiration Date Is NOT Altered', async () => {
    //Test Case No. 11
    //User Role:                    Regular User (OK)
    //Renewal's Number Of Steps:    One Step (Transfer And Call) (OK)
    //Domain Status:                Ready to Be Renovate (OK)
    //Duration:                     0 Years (-) (OK)
    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      PartnerRenewer,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const duration = BigNumber.from('2');

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

    validatePurchaseExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      duration,
      RIF,
      PartnerConfiguration
    );

    const moneyBeforeRenovation = await RIF.balanceOf(buyerUser.address);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('12');

    const durationforRenovation = BigNumber.from('0');

    const namePrice = await calculateNamePriceByDuration(durationforRenovation);

    const errorFound: boolean = false;

    const expirationTimeBeforeRenovation = await NodeOwner.expirationTime(
      nameToTokenId(domainName)
    );

    await oneStepDomainOwnershipRenewal(
      domainName,
      durationforRenovation,
      namePrice,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      numberOfMonthsToSimulate
    );

    const moneyAfterRenovation = await RIF.balanceOf(buyerUser.address);

    //Expected Result - Money should NOT be deducted from the Balance
    expect(
      moneyBeforeRenovation + '',
      'BUG: Money for Renewal With Duration = 0 was deducted from User Balance!'
    ).to.be.equals(moneyAfterRenovation + '');

    //Expected Result - Expiration Date Was Not Deducted!
    const expirationTimeAfterRenovation = await NodeOwner.expirationTime(
      nameToTokenId(domainName)
    );

    expect(
      expirationTimeBeforeRenovation,
      'BUG: Domain Expiration Time Was Altered But The Renewal Failed!'
    ).equals(expirationTimeAfterRenovation);

    //Expected Result - Name Isn't Available After Renewal
    await validatePurchasedDomainIsNotAvailable(NodeOwner, domainName);
  }); //it

  it('Test Case No. 12 - Should Throw an Error; No Money Was Payed for Renotation; Expiration Time was not altered', async () => {
    //Test Case No. 12
    //User Role:                    Regular User (OK)
    //Renewal's Number Of Steps:    One Step (Transfer And Call) (OK)
    //Domain Status:                Expired (Should Be Purchased As 1st Time) (-) (OK)
    //Duration:                     1 year (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      PartnerRenewer,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const durationInt = 2;

    const duration = BigNumber.from(durationInt + '');

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

    validatePurchaseExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      duration,
      RIF,
      PartnerConfiguration
    );

    //Expired (Should Be Purchased As 1st Time)
    await time.increase(31536000 * (durationInt + 1)); //31536000 = 1 Year (To Make The Name Expires)

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    const moneyBeforeRenovation = await RIF.balanceOf(buyerUser.address);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('1');

    const durationforRenovation = BigNumber.from('1');

    const namePrice = await calculateNamePriceByDuration(durationforRenovation);

    let errorFound: boolean = false;

    const expirationTimeBeforeRenovation = await NodeOwner.expirationTime(
      nameToTokenId(domainName)
    );

    try {
      await oneStepDomainOwnershipRenewal(
        domainName,
        durationforRenovation,
        namePrice,
        partner.address,
        buyerUser,
        PartnerRenewer,
        RIF,
        numberOfMonthsToSimulate
      );
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Expired Name Renewal Error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains('Name already expired');

      expect(currentError, bugDescription).to.contains(
        'VM Exception while processing transaction: reverted with reason'
      );

      expect(currentError, bugDescription).to.contains('Error');
    }

    const moneyAfterRenovationFailed = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforeRenovation,
      moneyAfterRenovationFailed,
      'Renewal for Expired Name'
    );

    const expirationTimeAfterRenovation = await NodeOwner.expirationTime(
      nameToTokenId(domainName)
    );

    expect(
      expirationTimeBeforeRenovation,
      'BUG: Domain Expiration Time Was Altered But The Renewal Failed!'
    ).equals(expirationTimeAfterRenovation);
  }); //it

  it('Test Case No. 13 - Should Throw an Error; No Money Was Payed for Renotation', async () => {
    //Test Case No. 13
    //User Role:                    Regular User (OK)
    //Renewal's Number Of Steps:    Two Steps (Approve And Register Or Commit And Transfer)
    //Domain Status:                Available (Never Purchased) (-) (OK)
    //Duration:                     1 year (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      PartnerRenewer,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const buyerUser: SignerWithAddress = regularUser;

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    const moneyBeforeRenovation = await RIF.balanceOf(buyerUser.address);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('1');

    const durationforRenovation = BigNumber.from('1');

    const namePrice = await calculateNamePriceByDuration(durationforRenovation);

    let errorFound: boolean = false;

    const expirationTimeBeforeRenovation = await NodeOwner.expirationTime(
      nameToTokenId(domainName)
    );

    try {
      await TwoStepsDomainOwnershipRenewal(
        domainName,
        durationforRenovation,
        namePrice,
        partner.address,
        buyerUser,
        PartnerRenewer,
        RIF,
        numberOfMonthsToSimulate,
        false
      );
    } catch (error) {
      errorFound = true;

      const currentError = error + '';

      const bugDescription =
        'BUG: The Never Purchased Name Renewal Error message was NOT displayed correctly';

      expect(currentError, bugDescription).to.contains(
        'Name already expired' //'Name Has Never Been Purchased'
      );

      expect(currentError, bugDescription).to.contains(
        'VM Exception while processing transaction: reverted with reason'
      );

      expect(currentError, bugDescription).to.contains('Error');
    }

    const moneyAfterRenovationFailed = await RIF.balanceOf(buyerUser.address);

    await validateNegativeFlowExpectedResults(
      errorFound,
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforeRenovation,
      moneyAfterRenovationFailed,
      'Renewal for Never-Purchased Name'
    );

    const expirationTimeAfterRenovation = await NodeOwner.expirationTime(
      nameToTokenId(domainName)
    );

    expect(
      expirationTimeBeforeRenovation,
      'BUG: Domain Expiration Time Was Altered But The Renewal Failed!'
    ).equals(expirationTimeAfterRenovation);
  }); //it

  it('Test Case No. 14 - Renewal Owner should be correct; Renewal Price was payed; Expiration Time Was correctly Updated', async () => {
    //Test Case No. 14
    //User Role:                    Regular User (OK)
    //Renewal's Number Of Steps:    One Step (Transfer And Call) (OK)
    //Domain Status:                Recent Purchased (Doesn't Need Renovation yet) (-) (OK)
    //Duration:                     1 year (OK)

    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      PartnerRenewer,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const durationInt = 1;

    const duration = BigNumber.from(durationInt + '');

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

    validatePurchaseExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      duration,
      RIF,
      PartnerConfiguration
    );

    const currentTimeWhenPurchased = BigNumber.from(await time.latest()); //currentTime - Blockchain Clock Current Moment

    const moneyBeforeRenovation = await RIF.balanceOf(buyerUser.address);

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('0');

    const durationforRenovation = BigNumber.from('1');

    const namePrice = await calculateNamePriceByDuration(durationforRenovation);

    await oneStepDomainOwnershipRenewal(
      domainName,
      durationforRenovation,
      namePrice,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      numberOfMonthsToSimulate
    );

    const moneyAfterRenovation = await RIF.balanceOf(buyerUser.address);

    await validateRenewalExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforeRenovation,
      moneyAfterRenovation,
      durationforRenovation,
      currentTimeWhenPurchased,
      duration,
      PartnerConfiguration
    );
  }); //it

  it('Test Case No. 15 - Should NOT Throw an Error; Money Was Payed for Renovation & Expiration Date Is Altered', async () => {
    //Test Case No. 15
    //User Role:                    Regular User (OK)
    //Renewal's Number Of Steps:    Two Steps (Approve And Register Or Commit And Transfer) (OK)
    //Domain Status:                Ready to Be Renovate (OK)
    //Duration:                     Greater Than Maximum (-)
    const {
      NodeOwner,
      PartnerRegistrar,
      partner,
      RIF,
      PartnerConfiguration,
      regularUser,
      PartnerRenewer,
    } = await loadFixture(initialSetup);

    const domainName = generateRandomStringWithLettersAndNumbers(
      10,
      true,
      false
    );

    const duration = BigNumber.from('2');

    const buyerUser: SignerWithAddress = regularUser;

    await (await RIF.transfer(buyerUser.address, oneRBTC.mul(10))).wait(); //To Make User Has Money To Both Purchase and Renovate

    const moneyBeforePurchase = await RIF.balanceOf(buyerUser.address);

    await validatePurchasedDomainISAvailable(NodeOwner, domainName);

    const currentTimeWhenPurchased = BigNumber.from(await time.latest()); //currentTime - Blockchain Clock Current Moment

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

    validatePurchaseExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforePurchase,
      duration,
      RIF,
      PartnerConfiguration
    );

    //Domain Renewal Flow - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const numberOfMonthsToSimulate = BigNumber.from('12');

    const durationforRenovation = BigNumber.from('6');

    const namePrice = await calculateNamePriceByDuration(durationforRenovation);

    const moneyBeforeRenovation = await RIF.balanceOf(buyerUser.address);

    await TwoStepsDomainOwnershipRenewal(
      domainName,
      durationforRenovation,
      namePrice,
      partner.address,
      buyerUser,
      PartnerRenewer,
      RIF,
      numberOfMonthsToSimulate
    );

    const moneyAfterRenovation = await RIF.balanceOf(buyerUser.address);

    await validateRenewalExpectedResults(
      NodeOwner,
      domainName,
      buyerUser,
      moneyBeforeRenovation,
      moneyAfterRenovation,
      durationforRenovation,
      currentTimeWhenPurchased,
      duration,
      PartnerConfiguration
    );
  }); //it
}); // End - Describe

export const validatePurchaseExpectedResults = async (
  NodeOwner: NodeOwner,
  domainName: string,
  buyerUser: SignerWithAddress,
  moneyBeforePurchase: BigNumber,
  duration: BigNumber,
  RIF: MockContract<ERC677Token>,
  PartnerConfiguration: PartnerConfiguration
) => {
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
};
