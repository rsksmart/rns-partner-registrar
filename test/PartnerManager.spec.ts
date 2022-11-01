import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { PartnerManager__factory } from '../typechain-types/factories/contracts/PartnerManager__factory';
import { PartnerManager } from '../typechain-types/contracts/PartnerManager';

async function testSetup() {
  const [owner, account1, account2, account3, ...accounts] =
    await ethers.getSigners();

  const PartnerManager = (await ethers.getContractFactory(
    'PartnerManager'
  )) as PartnerManager__factory;

  const partnerManager = (await PartnerManager.deploy()) as PartnerManager;

  await partnerManager.deployed();

  return {
    partnerManager,
    owner,
    account1,
    account2,
    account3,
    accounts,
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
      const { partnerManager, account1: partner } = await loadFixture(
        testSetup
      );

      try {
        await expect(partnerManager.addPartner(partner.address)).to.not.be
          .reverted;
        expect(await partnerManager.isPartner(partner.address)).to.be.true;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Add Partner', () => {
    it('should whitelist a partner contract', async () => {
      const { partnerManager, account1: partner } = await loadFixture(
        testSetup
      );

      try {
        await expect(partnerManager.addPartner(partner.address)).to.not.be
          .reverted;
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
      } = await loadFixture(testSetup);

      try {
        await expect(
          partnerManager.connect(account2).addPartner(partner.address)
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Revoke Partner', () => {
    it('should revoke a partner contract', async () => {
      const { partnerManager, account1: partner } = await loadFixture(
        testSetup
      );

      try {
        await expect(partnerManager.addPartner(partner.address)).to.not.be
          .reverted;

        await expect(partnerManager.removePartner(partner.address)).to.not.be
          .reverted;

        expect(await partnerManager.isPartner(partner.address)).to.be.false;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should revoke a partner contract', async () => {
      const {
        partnerManager,
        account1: partner,
        account2,
      } = await loadFixture(testSetup);

      try {
        await expect(partnerManager.addPartner(partner.address)).to.not.be
          .reverted;

        await expect(
          partnerManager.connect(account2).removePartner(partner.address)
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });
});
