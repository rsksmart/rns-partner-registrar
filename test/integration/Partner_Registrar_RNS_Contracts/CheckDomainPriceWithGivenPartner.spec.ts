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

describe('Check Domain Price With Given Partner', () => {
  it('Test Case No. 1 - Should throw an warning of White List. Should not deliver price', async () => {
    //Test Case No. 1
    //User Role:                     Partner Reseller (NOT AT WHITE LIST)
    //Domain Name - Chars:           Valid Value (Only Letters)
    //Domain Name - Is Available?:   Available (Never Purchased)

    const { PartnerRegistrar, partner, pool, NodeOwner, regularUser } =
      await loadFixture(initialSetup);

    const domain = 'ListaNegraTest'; // Never Purchased

    const domainHashed = namehash(domain);

    const duration = 1;

    let errorCapturado: boolean = false;

    try {
      await runCheckPriceNegativeFlow(
        PartnerRegistrar,
        NodeOwner,
        duration,
        regularUser,
        domainHashed,
        pool.address,
        domain
      );
    } catch (error) {
      errorCapturado = true;

      const expectedError =
        'Error: call revert exception; VM Exception while processing transaction: reverted with reason string ';

      const currentError = error + '';

      console.log(
        "Expected: '" + expectedError + "'. Current: '" + currentError + "'"
      );

      expect(
        currentError,
        'BUG: The contract did not send the Call Revert Error Message'
      ).to.contains(expectedError);

      expect(
        currentError,
        'BUG: The contract did not send the NotPartner Error Message'
      ).to.contains('Not a partner');
    }

    expect(errorCapturado).to.be.true;
  }); //it

  it('Test Case No. 2 - Should return the correct price, NO discounts and RIFF currency', async () => {
    //Test Case No. 2
    //User Role:                     Regular User
    //Domain Name - Chars:           Valid Value (Only Numbers)
    //Domain Name - Is Available?:   Occupied (By A Regular User)
    //Duration:                      1 year

    const { PartnerRegistrar, partner, regularUser, NodeOwner, RIF } =
      await loadFixture(initialSetup);

    const domain = '95122411002'; //Occupied

    const domainHashed = namehash(domain);

    const tokenName = nameToTokenId(domain);

    const shouldnDomainBeAvailableByExpiration = false;

    const duration = 1;

    const isPurchased = true;

    //Domain Name - Is Available?: Occupied (By A Regular User)
    const isNameAvailable = await NodeOwner.available(tokenName);

    if (isNameAvailable)
      await purchaseName(
        domain,
        BigNumber.from(duration),
        SECRET,
        regularUser,
        PartnerRegistrar,
        RIF,
        partner.address
      );

    const isNameAvailableAfterPossiblePurchase = await NodeOwner.available(
      tokenName
    );

    expect(
      isNameAvailableAfterPossiblePurchase,
      "The Domain Name Shouldn't Be Available, Since a Regular User bought it!"
    ).to.be.false;

    await runCheckPricePositiveFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      regularUser,
      domainHashed,
      partner.address,
      shouldnDomainBeAvailableByExpiration,
      domain,
      isPurchased
    );
  });

  it.skip('Test Case No. 3 - Should Throw A Warning Message (Duration Zero), Or Price 0 was delivered', async () => {
    //Test Case No. 3
    //User Role:                     Partner Reseller
    //Domain Name - Chars:           Valid Value
    //Domain Name - Is Available?:   Available (Never Purchased)
    //Duration:                      0 Years (-)

    const { PartnerRegistrar, partner, NodeOwner, regularUser } =
      await loadFixture(initialSetup);

    const domain = 'DurationOfZeroYears';

    const domainHashed = namehash(domain);

    const duration = 0;

    await runCheckPriceNegativeFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      partner,
      domainHashed,
      partner.address,
      domain
    );
  });

  it('Test Case No. 4 - Should return the correct price, with discounts and RIFF currency', async () => {
    //Test Case No. 4
    //User Role:                     Regular User                        (OK)
    //Domain Name - Chars:           Valid Value (Letters and Numbers)   (OK)
    //Domain Name - Is Available?:   Available (NEVER Purchased)         (OK)
    //Duration:                      Between 3 and 4 Years               (OK)

    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    const domain = 'ColombiaTesting12345'; //Never Purchased

    const domainHashed = namehash(domain);

    const shouldnDomainBeAvailableByExpiration = false;

    const duration = 3;

    const isPurchased = false;

    //Inputs:
    //3rd: Duration (Normal Number)
    //4th: User Role
    //5th: Domain Name - ENCRYPTED
    //7th: Will Be Domain Name Available By Expiration? (Boolean)
    //8th: Domain Name - NOT ENCRYPTED
    await runCheckPricePositiveFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      regularUser,
      domainHashed,
      partner.address,
      shouldnDomainBeAvailableByExpiration,
      domain,
      isPurchased
    );
  });

  it('Test Case No. 5 - Should return the correct price, with discounts and RIFF currency', async () => {
    //Test Case No. 5
    //User Role:                     Regular User                       (OK)
    //Domain Name - Chars:           Valid Value (Only Letters)         (OK)
    //Domain Name - Is Available?:   Available (Expired, Not Renovated) (OK)
    //Duration:                      5 years                            (OK)

    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    const domain = 'ColombiaTesting';

    const domainHashed = namehash(domain);

    const shouldnDomainBeAvailableByExpiration = true;

    const duration = 5;

    const isPurchased = false;

    await runCheckPricePositiveFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      regularUser,
      domainHashed,
      partner.address,
      shouldnDomainBeAvailableByExpiration,
      domain,
      isPurchased
    );
  }); //it

  it('Test Case No. 6 - Should return the correct price, with discounts and RIFF currency (As RNS Owner)', async () => {
    //Test Case No. 6
    //User Role:                     RNS Owner
    //Domain Name - Chars:           Valid Value (Only Letters)
    //Domain Name - Is Available?:   Available (Expired, Not Renovated)
    //Duration:                      5 years

    const { PartnerRegistrar, partner, owner, NodeOwner } = await loadFixture(
      initialSetup
    );

    const domain = 'CaliTesting';

    const domainHashed = namehash(domain);

    const shouldnDomainBeAvailableByExpiration = true;

    const duration = 5;

    const isPurchased = false;

    await runCheckPricePositiveFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      owner,
      domainHashed,
      partner.address,
      shouldnDomainBeAvailableByExpiration,
      domain,
      isPurchased
    );
  });

  it('Test Case No. 7 - Should return the correct price, NO discounts and RIFF currency', async () => {
    //Test Case No. 7
    //User Role:                     Partner Reseller
    //Domain Name - Chars:           Valid Value (Only Numbers)
    //Domain Name - Is Available?:   Available (Never Purchased)
    //Duration:                      1 year

    const { PartnerRegistrar, partner, NodeOwner, RIF } = await loadFixture(
      initialSetup
    );

    const domain = '1144191672';

    const domainHashed = namehash(domain);

    const shouldnDomainBeAvailableByExpiration = false;

    const duration = 1;

    const isPurchased = false;

    await runCheckPricePositiveFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      partner,
      domainHashed,
      partner.address,
      shouldnDomainBeAvailableByExpiration,
      domain,
      isPurchased
    );
  });

  it('Test Case No. 8 - Should return the correct price, NO discounts and RIFF currency', async () => {
    //Test Case No. 8
    //User Role:                     Regular User
    //Domain Name - Chars:           Valid Value (Letters and Numbers)
    //Domain Name - Is Available?:   Available (Expired, Not Renovated)
    //Duration:                      2 years

    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    const domain = 'NombreExpirado12345';

    const domainHashed = namehash(domain);

    const shouldnDomainBeAvailableByExpiration = true;

    const duration = 2;

    const isPurchased = false;

    await runCheckPricePositiveFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      regularUser,
      domainHashed,
      partner.address,
      shouldnDomainBeAvailableByExpiration,
      domain,
      isPurchased
    );
  });

  it.skip('Test Case No. 9 - Should Throw A Warning Message (Empty Domain Name) & NO Price was delivered', async () => {
    //Test Case No. 9
    //User Role:                     Regular User
    //Domain Name - Chars:           Empty String (-)
    //Duration:                      1 year

    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    const domain = '';

    const domainHashed = namehash(domain);

    const duration = 1;

    await runCheckPriceNegativeFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      regularUser,
      domainHashed,
      partner.address,
      domain
    );
  });

  it('Test Case No. 10 - Should Throw A Warning Message (Invalid Chars) & NO Price was delivered', async () => {
    //Test Case No. 10
    //User Role:                     Regular User
    //Domain Name - Chars:           With Special Chars (-)
    //Duration:                      1 year

    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    const domain = 'Invalido_#_Con&_Especiale$%'; //It must has one of these chars to work: $ _ % & #

    const duration = 1;

    let errorCapturado: boolean = false;

    try {
      const domainHashed = namehash(domain);

      await runCheckPriceNegativeFlow(
        PartnerRegistrar,
        NodeOwner,
        duration,
        regularUser,
        domainHashed,
        partner.address,
        domain
      );
    } catch (error) {
      errorCapturado = true;

      const expectedError = 'Error: Disallowed codepoint: 0x23';

      const currentError = error + '';

      console.log(
        "Expected: '" + expectedError + "'. Current: '" + currentError + "'"
      );

      expect(
        currentError,
        'BUG: The contract did not send the Not-Allowed Characters Message'
      ).to.equal(expectedError);
    }

    expect(errorCapturado, 'BUG: The contract did not throw Exception!').to.be
      .true;
  });

  it.skip('Test Case No. 11 - Should Throw A Warning Message (Long Domain Name) & NO Price was delivered', async () => {
    //Test Case No. 11
    //User Role:                     Regular User
    //Domain Name - Chars:           String Too Long (Greater Than Maximun Length) (-)
    //Duration:                      1 year

    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    const domain =
      'CadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLargaCadenaDemasiadoLarga';

    const domainHashed = namehash(domain);

    const duration = 1;

    await runCheckPriceNegativeFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      regularUser,
      domainHashed,
      partner.address,
      domain
    );
  });

  it.skip('Test Case No. 12 - Should Throw A Warning Message (Short Domain Name) & NO Price was delivered', async () => {
    //Test Case No. 12
    //User Role:                     Regular User
    //Domain Name - Chars:           String Too Short (Lower Than Minimum Length) (-)
    //Duration:                      1 year

    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    const domain = 'a';

    const domainHashed = namehash(domain);

    const duration = 1;

    await runCheckPriceNegativeFlow(
      PartnerRegistrar,
      NodeOwner,
      duration,
      regularUser,
      domainHashed,
      partner.address,
      domain
    );
  });

  it('Test Case No. 13 - Should Throw A Warning Message (Negative Duration) & NO Price was delivered', async () => {
    //Test Case No. 13
    //User Role:                     Partner Reseller
    //Domain Name - Chars:           Valid Value
    //Domain Name - Is Available?:   Available (Never Purchased)
    //Duration:                      -1 year (Negative)

    const { PartnerRegistrar, partner, NodeOwner } = await loadFixture(
      initialSetup
    );

    const domain = 'DurationNegativeMinus1';

    const domainHashed = namehash(domain);

    const duration = -1;

    let errorCapturado: boolean = false;

    try {
      await runCheckPriceNegativeFlow(
        PartnerRegistrar,
        NodeOwner,
        duration,
        partner,
        domainHashed,
        partner.address,
        domain
      );
    } catch (error) {
      errorCapturado = true;

      const expectedError = 'Error: value out-of-bounds';

      const currentError = error + '';

      console.log(
        "Expected: '" + expectedError + "'. Current: '" + currentError + "'"
      );

      expect(
        currentError,
        'BUG: The contract did not send the Out-Of-Bounds Message'
      ).to.contains(expectedError);
    }

    expect(errorCapturado, 'BUG: The contract did not throw Exception!').to.be
      .true;
  });
}); // describe

//Generic Flow Function (ReUse At Every Positive Test Case) - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const runCheckPricePositiveFlow = async (
  registrar: PartnerRegistrar,
  nodeOwner: NodeOwner,
  duration: number,
  userRoleAccount: SignerWithAddress,
  domainHashed: string,
  partnerAddress: string,
  shouldBeAvailableByExpiration: boolean,
  domain: string,
  isDomainPurchased: boolean
) => {
  //Role User (Partner, Regular, RNS Owner)
  const PartnerRegistrarAsRegularUser = registrar.connect(userRoleAccount);

  //Duration (Years)
  const durationAsBN = BigNumber.from(duration.toString());

  const tokenName = nameToTokenId(domain);

  //Domain Name (Availability Review)
  if (!isDomainPurchased) {
    const isNameAvailableBeforePurchase = await nodeOwner.available(tokenName);

    expect(
      isNameAvailableBeforePurchase,
      'BUG: The contract says the domain is NOT Available, when it is NEITHER purchased or renovated'
    ).to.be.true;
  }

  //Domain Expiration Flow (Available, Not Renovated)
  if (shouldBeAvailableByExpiration) {
    const { partner, RIF } = await loadFixture(initialSetup);

    await purchaseName(
      domain,
      durationAsBN,
      SECRET,
      userRoleAccount,
      registrar,
      RIF,
      partnerAddress
    );

    await time.increase(31536000 * (duration + 1)); //31536000 = 1 Year (To Make The Name Expires)

    const isNameAvailableAfterPurchase = await nodeOwner.available(tokenName);

    expect(
      isNameAvailableAfterPurchase,
      'BUG: The contract says the domain is NOT Available, when it expired by not renovation!'
    ).to.be.true;
  }

  //Contract Execution
  const currentNamePriceAfterExpiration =
    await PartnerRegistrarAsRegularUser.price(
      domainHashed,
      0,
      durationAsBN,
      partnerAddress
    );

  //Expected Result - Validate price equation: 2*Duration, Duration+2 (50% Discount)
  //Expected Result - Validate price currency is at 'RIFF'
  const expectedNamePrice = calculateDiscountByDuration(durationAsBN);

  console.log(
    'Expected: ' +
      expectedNamePrice +
      '. Current: ' +
      currentNamePriceAfterExpiration
  );

  expect(
    +currentNamePriceAfterExpiration,
    'The calculated domain price is incorrect!'
  ).to.equal(+expectedNamePrice);
}; // End - runCheckPricePositiveFlow

//Generic Flow Function (ReUse At Every Negative Test Case) - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const runCheckPriceNegativeFlow = async (
  registrar: PartnerRegistrar,
  nodeOwner: NodeOwner,
  duration: number,
  userRoleAccount: SignerWithAddress,
  domainHashed: string,
  partnerAddress: string,
  domain: string
) => {
  //Role User (Partner, Regular, RNS Owner)
  const PartnerRegistrarAsRegularUser = registrar.connect(userRoleAccount);

  //Duration (Years)
  const durationAsBN = BigNumber.from(duration.toString());

  const tokenName = nameToTokenId(domain);

  //Domain Name (Availability Review)
  const isNameAvailableBeforePurchase = await nodeOwner.available(tokenName);

  expect(
    isNameAvailableBeforePurchase,
    'BUG: The contracts says the NOT-PURCHASED domain is NOT Available'
  ).to.be.true;

  //Contract Execution
  const currentNamePriceAfterExpiration =
    await PartnerRegistrarAsRegularUser.price(
      domainHashed,
      0,
      durationAsBN,
      partnerAddress
    );

  //Expected Result - Validate Error Messages
  if (durationAsBN.eq(0)) {
    const expectedNamePrice = calculateDiscountByDuration(durationAsBN);

    expect(
      +currentNamePriceAfterExpiration,
      'Given price is NOT the expected one (for duration equals to Zero)'
    ).to.equal(+expectedNamePrice);
  } else if (durationAsBN.lt(0)) {
    const expectedNamePrice =
      'Invalid Duration! Given Duration Cannot Be Lower Than 0';

    expect(
      currentNamePriceAfterExpiration,
      'The expected warning error is NOT given (Duration Zero)'
    ).to.equal(expectedNamePrice);
  } else if (domain.length == 0) {
    const expectedNamePrice =
      'Invalid Name! Domain Name Cannot Be An Empty String';

    expect(
      currentNamePriceAfterExpiration + '',
      'The expected warning error is NOT given (Empty Domain)'
    ).to.equal(expectedNamePrice);
  } else if (domain.length < MINIMUM_DOMAIN_NAME_LENGTH) {
    const expectedNamePrice =
      'Invalid Name! Domain Name Length Cannot Be Lower Than ' +
      MINIMUM_DOMAIN_NAME_LENGTH;

    expect(
      currentNamePriceAfterExpiration + '',
      'The expected warning error is NOT given (Too Short Domain)'
    ).to.equal(expectedNamePrice);
  } else if (domain.length > MAXIMUM_DOMAIN_NAME_LENGTH) {
    const expectedNamePrice =
      'Invalid Name! Domain Name Length Cannot Be Greater Than ' +
      MAXIMUM_DOMAIN_NAME_LENGTH;

    expect(
      currentNamePriceAfterExpiration + '',
      'The expected warning error is NOT given (Too Long Domain)'
    ).to.equal(expectedNamePrice);
  }
}; // End - runCheckPriceNegativeFlow
