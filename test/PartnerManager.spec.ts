import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { PartnerManager__factory } from 'typechain-types';
import {
  PARTNER_CONFIGURATION_CHANGED_EVENT,
  ONLY_HIGH_LEVEL_OPERATOR_ERR,
} from './utils/constants.utils';
import { deployContract } from './utils/mock.utils';
import { RegistrarAccessControl__factory } from 'typechain-types';

async function testSetup() {
  const [
    owner,
    account1,
    account2,
    account3,
    partnerOwnerAccount,
    highLevelOperator,
    ...accounts
  ] = await ethers.getSigners();

  const accessControl = await deployContract<RegistrarAccessControl__factory>(
    'RegistrarAccessControl',
    []
  );

  const partnerManager = await deployContract<PartnerManager__factory>(
    'PartnerManager',
    [accessControl.address]
  );

  await partnerManager.deployed();

  return {
    partnerManager,
    owner,
    account1,
    account2,
    account3,
    accounts,
    partnerOwnerAccount,
    accessControl,
    highLevelOperator,
  };
}

describe('partnerManager', () => {
  describe('Is Partner', () => {
    it('should return false if it is not partner', async () => {
      const { partnerManager, owner } = await loadFixture(testSetup);

      try {
        expect(await partnerManager.isPartner(owner.address)).to.be.false;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should return true if partner address is passed', async () => {
      const {
        partnerManager,
        account1: partner,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.eventually.fulfilled;
        expect(await partnerManager.isPartner(partner.address)).to.be.true;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Add Partner', () => {
    it('should whitelist a partner contract', async () => {
      const {
        partnerManager,
        account1: partner,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.not.be.reverted;
        expect(await partnerManager.isPartner(partner.address)).to.be.true;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should revert if not called by owner', async () => {
      const {
        partnerManager,
        account1: partner,
        account2,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager
            .connect(account2)
            .addPartner(partner.address, partnerOwnerAccount.address)
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Remove Partner', () => {
    it('should remove a partner contract', async () => {
      const {
        partnerManager,
        account1: partner,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.not.be.reverted;

        await expect(partnerManager.removePartner(partner.address)).to.not.be
          .reverted;

        expect(await partnerManager.isPartner(partner.address)).to.be.false;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should remove a partner contract', async () => {
      const {
        partnerManager,
        account1: partner,
        account2,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.not.be.reverted;

        await expect(
          partnerManager.connect(account2).removePartner(partner.address)
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Set Partner Configuration', () => {
    it('should successfully set partner configuration', async () => {
      const {
        partnerManager,
        account1: partner,
        account3,
        partnerOwnerAccount,
        accounts,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.eventually.be.fulfilled;

        await expect(
          partnerManager.setPartnerConfiguration(
            partner.address,
            accounts[4].address
          )
        ).to.eventually.be.fulfilled;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('Should emit the PartnerConfigurationSet event when partner configuration is set', async () => {
      const {
        partnerManager,
        account1: partner,
        account3,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      await partnerManager.addPartner(
        partner.address,
        partnerOwnerAccount.address
      );

      await expect(
        partnerManager.setPartnerConfiguration(
          partner.address,
          account3.address
        )
      )
        .to.emit(partnerManager, PARTNER_CONFIGURATION_CHANGED_EVENT)
        .withArgs(partner.address, account3.address);
    });

    it('should revert if not partner address', async () => {
      const {
        partnerManager,
        account1: partner,
        account3,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.setPartnerConfiguration(
            partner.address,
            account3.address
          )
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should revert if called with invalid configuration', async () => {
      const {
        partnerManager,
        account1: partner,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.not.be.reverted;

        await expect(
          partnerManager.setPartnerConfiguration(
            partner.address,
            ethers.constants.AddressZero
          )
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should revert if not called by owner', async () => {
      const {
        partnerManager,
        account1: partner,
        account2,
        account3,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.not.be.reverted;

        await expect(
          partnerManager
            .connect(account2)
            .setPartnerConfiguration(partner.address, account3.address)
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Get Partner Configuration', () => {
    it('should return partner configuration', async () => {
      const {
        partnerManager,
        account1: partner,
        account3,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.addPartner(
            partner.address,
            partnerOwnerAccount.address
          )
        ).to.not.be.reverted;

        await expect(
          partnerManager.setPartnerConfiguration(
            partner.address,
            account3.address
          )
        ).to.not.be.reverted;

        expect(
          await partnerManager.getPartnerConfiguration(partner.address)
        ).to.be.eq(account3.address);
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Access Control', () => {
    it('Should revert if the caller is not the high level operator', async () => {
      const {
        partnerManager,
        account1: partner,
        account2,
        partnerOwnerAccount,
      } = await loadFixture(testSetup);

      await expect(
        partnerManager
          .connect(account2)
          .addPartner(partner.address, partnerOwnerAccount.address)
      ).to.be.revertedWithCustomError(
        partnerManager,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        partnerManager
          .connect(account2)
          .setPartnerConfiguration(partner.address, account2.address)
      ).to.be.revertedWithCustomError(
        partnerManager,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        partnerManager.connect(account2).removePartner(partner.address)
      ).to.be.revertedWithCustomError(
        partnerManager,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );
    });

    it('Should succeed if the caller is the high level operator', async () => {
      const {
        partnerManager,
        account1: partner,
        account2,
        partnerOwnerAccount,
        accessControl,
        highLevelOperator,
      } = await loadFixture(testSetup);

      await accessControl.addHighLevelOperator(highLevelOperator.address);

      await expect(
        partnerManager
          .connect(highLevelOperator)
          .addPartner(partner.address, partnerOwnerAccount.address)
      ).to.be.fulfilled;

      await expect(
        partnerManager
          .connect(highLevelOperator)
          .setPartnerConfiguration(partner.address, account2.address)
      ).to.be.fulfilled;

      await expect(
        partnerManager.connect(highLevelOperator).removePartner(partner.address)
      ).to.be.fulfilled;
    });
  });
});
