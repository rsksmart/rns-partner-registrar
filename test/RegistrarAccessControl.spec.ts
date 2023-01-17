import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployContract } from './utils/mock.utils';
import { RegistrarAccessControl__factory } from '../typechain-types/factories/contracts/Access/RegistrarAccessControl__factory';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ONLY_OWNER_ERR } from './utils/constants.utils';

async function setup() {
  const [owner, highLevelOperator, signer2, ...otherUsers] =
    await ethers.getSigners();

  const accessControl = await deployContract<RegistrarAccessControl__factory>(
    'RegistrarAccessControl',
    []
  );

  const accessControlAsHighLevelOperator =
    accessControl.connect(highLevelOperator);
  const accessControlAsSigner2 = accessControl.connect(signer2);

  return {
    owner,
    highLevelOperator,
    signer2,
    otherUsers,
    accessControl,
    accessControlAsHighLevelOperator,
    accessControlAsSigner2,
  };
}

describe('RegistrarAccessControl', async () => {
  describe('Deployment', () => {
    it('should add account to OWNER role', async () => {
      const { accessControl, owner } = await loadFixture(setup);

      expect(await accessControl.isOwnerRole(owner.address)).to.be.true;
    });
    it('should add account to HIGH_LEVEL_OPERATOR role', async () => {
      const { accessControl, owner } = await loadFixture(setup);

      expect(await accessControl.isHighLevelOperator(owner.address)).to.be.true;
    });
  });

  describe('HighLevelOperator', () => {
    describe('isHighLevelOperator', async () => {
      it('should return false if address not added', async () => {
        const { signer2, accessControl } = await loadFixture(setup);

        const isHighLevelOperator = await accessControl.isHighLevelOperator(
          signer2.address
        );
        expect(isHighLevelOperator).to.be.false;
      });
    });

    describe('addHighLevelOperator', () => {
      it('should add account to HIGH_LEVEL_OPERATOR role', async () => {
        const { signer2, accessControl } = await loadFixture(setup);

        await accessControl.addHighLevelOperator(signer2.address);
        const isHighLevelOperator = await accessControl.isHighLevelOperator(
          signer2.address
        );
        expect(isHighLevelOperator).to.be.true;
      });
      it('should only allow owner to add administrator', async () => {
        const { signer2, accessControlAsHighLevelOperator, accessControl } =
          await loadFixture(setup);

        const promiseCloseAsOwner = accessControl.addHighLevelOperator(
          signer2.address
        );

        await expect(promiseCloseAsOwner).to.be.fulfilled;

        const promiseCloseAsAddr1 =
          accessControlAsHighLevelOperator.addHighLevelOperator(
            signer2.address
          );

        await expect(promiseCloseAsAddr1).to.be.revertedWithCustomError(
          accessControl,
          ONLY_OWNER_ERR
        );
      });
    });

    describe('removeHighLevelOperator', () => {
      it('should remove account from HIGH_LEVEL_OPERATOR role', async () => {
        const { signer2, accessControl } = await loadFixture(setup);

        await accessControl.addHighLevelOperator(signer2.address);
        await accessControl.removeHighLevelOperator(signer2.address);
        const isHighLevelOperator = await accessControl.isHighLevelOperator(
          signer2.address
        );
        expect(isHighLevelOperator).to.be.false;
      });
      it('should only allow owner to remove administrator', async () => {
        const { signer2, accessControlAsHighLevelOperator, accessControl } =
          await loadFixture(setup);

        const promiseCloseAsOwner = accessControl.removeHighLevelOperator(
          signer2.address
        );

        await expect(promiseCloseAsOwner).to.be.fulfilled;

        const promiseCloseAsAddr1 =
          accessControlAsHighLevelOperator.removeHighLevelOperator(
            signer2.address
          );

        await expect(promiseCloseAsAddr1).to.be.revertedWithCustomError(
          accessControl,
          ONLY_OWNER_ERR
        );
      });
    });
  });

  describe('Owner', () => {
    describe('transferOwnership', () => {
      it('should tranfer the ownership to new owner address', async () => {
        const { accessControl, otherUsers, owner } = await loadFixture(setup);

        const newOwnerAddr = otherUsers[0].address;

        await expect(accessControl.transferOwnership(newOwnerAddr)).to.be
          .eventually.fulfilled;

        expect(await accessControl.isOwnerRole(newOwnerAddr)).to.be.true;
        expect(await accessControl.isOwnerRole(owner.address)).to.be.false;
      });

      it('should reject if caller is not the owner', async () => {
        const { accessControlAsHighLevelOperator, otherUsers, accessControl } =
          await loadFixture(setup);
        const newOwnerAddr = otherUsers[0].address;

        const asNonOwner = accessControlAsHighLevelOperator;

        await expect(
          asNonOwner.transferOwnership(newOwnerAddr)
        ).to.be.revertedWithCustomError(accessControl, ONLY_OWNER_ERR);
      });

      it('should grant new owner the OWNER role', async () => {
        const { otherUsers, accessControl } = await loadFixture(setup);
        const newOwnerAddr = otherUsers[0].address;

        await accessControl.transferOwnership(newOwnerAddr);
        expect(await accessControl.isOwnerRole(newOwnerAddr)).to.be.true;
      });

      it('should revoke previous owner the OWNER role', async () => {
        const { otherUsers, accessControl, owner } = await loadFixture(setup);
        const newOwnerAddr = otherUsers[0].address;

        await accessControl.transferOwnership(newOwnerAddr);
        expect(await accessControl.isOwnerRole(owner.address)).to.be.false;
      });

      it('should grant new owner the HIGH_LEVEL_OPERATOR role', async () => {
        const { otherUsers, accessControl } = await loadFixture(setup);
        const newOwnerAddr = otherUsers[0].address;

        await accessControl.transferOwnership(newOwnerAddr);
        expect(await accessControl.isHighLevelOperator(newOwnerAddr)).to.be
          .true;
      });

      it('should revoke previous owner the HIGH_LEVEL_OPERATOR role', async () => {
        const { otherUsers, accessControl, owner } = await loadFixture(setup);
        const newOwnerAddr = otherUsers[0].address;

        await accessControl.transferOwnership(newOwnerAddr);
        expect(await accessControl.isHighLevelOperator(owner.address)).to.be
          .false;
      });
    });
  });
});
