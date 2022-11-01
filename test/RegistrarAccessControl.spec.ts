import { ethers } from 'hardhat';
import {
  RegistrarAccessControl,
  RegistrarAccessControl__factory,
} from '../typechain-types';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';

const PARTNER_ROLE = keccak256(toUtf8Bytes('PARTNER'));

async function testSetup() {
  const [owner, account1, account2, account3, ...accounts] =
    await ethers.getSigners();

  const RegistrarAccessControl = (await ethers.getContractFactory(
    'RegistrarAccessControl'
  )) as RegistrarAccessControl__factory;

  const registrarAccessControl =
    (await RegistrarAccessControl.deploy()) as RegistrarAccessControl;

  await registrarAccessControl.deployed();

  return {
    registrarAccessControl,
    owner,
    account1,
    account2,
    account3,
    accounts,
  };
}

describe('RegistrarAccessControl', () => {
  describe('Add Partner', () => {
    it('should whitelist a partner contract', async () => {
      const { registrarAccessControl, account1: partner } = await loadFixture(
        testSetup
      );

      try {
        await expect(registrarAccessControl.addPartner(partner.address)).to.not
          .be.reverted;
        expect(
          await registrarAccessControl.hasRole(PARTNER_ROLE, partner.address)
        ).to.be.true;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should revert if not called by owner', async () => {
      const {
        registrarAccessControl,
        account1: partner,
        account2,
      } = await loadFixture(testSetup);

      try {
        await expect(
          registrarAccessControl.connect(account2).addPartner(partner.address)
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });

  describe('Revoke Partner', () => {
    it('should revoke a partner contract', async () => {
      const { registrarAccessControl, account1: partner } = await loadFixture(
        testSetup
      );

      try {
        await expect(registrarAccessControl.addPartner(partner.address)).to.not
          .be.reverted;

        await expect(registrarAccessControl.removePartner(partner.address)).to
          .not.be.reverted;

        expect(
          await registrarAccessControl.hasRole(PARTNER_ROLE, partner.address)
        ).to.be.false;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it('should revoke a partner contract', async () => {
      const {
        registrarAccessControl,
        account1: partner,
        account2,
      } = await loadFixture(testSetup);

      try {
        await expect(registrarAccessControl.addPartner(partner.address)).to.not
          .be.reverted;

        await expect(
          registrarAccessControl
            .connect(account2)
            .removePartner(partner.address)
        ).to.be.reverted;
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });
});
