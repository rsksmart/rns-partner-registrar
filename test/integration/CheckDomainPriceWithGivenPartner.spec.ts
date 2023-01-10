import { initialSetup } from './utils/initialSetup';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  NAME,
  namePriceForOneYear,
  NameWithNumbersOnly,
  NameWithNumbersOnlyHashed,
  OneYearDuration,
} from './utils/constants';
import { oneRBTC } from 'test/utils/mock.utils';
import { expect } from 'chai';

describe('Check Domain Price With Given Partner', () => {
  //Rol As:  Regular User
  //Domain Name: Valid Value (Only Numbers)
  //Domain: Available
  //1 year

  it('Should return the correct price for a domain with a given partner', async () => {
    const { PartnerRegistrar, partner, regularUser, NodeOwner } =
      await loadFixture(initialSetup);

    //how do I speficy that the role execuing the operation is a regular user?
    //by connecting the contract to a regular user account.

    const isNameAvailable = await NodeOwner.available(
      NameWithNumbersOnlyHashed
    );

    expect(isNameAvailable).to.be.true;

    const PartnerRegistrarAsRegularUser = PartnerRegistrar.connect(regularUser);

    const namePrice = await PartnerRegistrarAsRegularUser.price(
      NameWithNumbersOnly,
      0,
      OneYearDuration,
      partner.address
    );

    expect(+namePriceForOneYear).to.equal(+namePrice);
  });
});
