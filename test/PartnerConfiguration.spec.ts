import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { $PartnerConfiguration } from 'typechain-types/contracts-exposed/PartnerConfiguration/PartnerConfiguration.sol/$PartnerConfiguration';
import { deployContract } from 'utils/deployment.utils';

const DEFAULT_MIN_LENGTH = 3;
const DEFAULT_MAX_LENGTH = 7;
const DEFAULT_MIN_DURATION = 1;
const DEFAULT_MAX_DURATION = 2;
const DEFAULT_MIN_COMMITMENT_AGE = 0;
const DEFAULT_DISCOUNT = 4;
const DEFAULT_IS_UNICODE_SUPPORTED = false;
const DEFAULT_FEE_PERCENTAGE = 5;

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];

  const { contract: PartnerConfiguration } =
    await deployContract<$PartnerConfiguration>('$PartnerConfiguration', {
      minLength: DEFAULT_MIN_LENGTH,
      maxLength: DEFAULT_MAX_LENGTH,
      isUnicodeSupported: DEFAULT_IS_UNICODE_SUPPORTED,
      minDuration: DEFAULT_MIN_DURATION,
      maxDuration: DEFAULT_MAX_DURATION,
      feePercentage: DEFAULT_FEE_PERCENTAGE,
      discount: DEFAULT_DISCOUNT,
      minCommittmentAge: DEFAULT_MIN_COMMITMENT_AGE,
    });

  return {
    PartnerConfiguration,
    owner,
    signers,
  };
};

describe('Partner Configuration', () => {
  let PartnerConfiguration: $PartnerConfiguration;
  beforeEach(async () => {
    ({ PartnerConfiguration } = await loadFixture(initialSetup));
  });

  context('Check Defaults', () => {
    it('Should return the default min length', async () => {
      await expect(await PartnerConfiguration.getMinLength()).to.equal(
        DEFAULT_MIN_LENGTH
      );
    });
    it('Should return the default max length', async () => {
      await expect(await PartnerConfiguration.getMaxLength()).to.equal(
        DEFAULT_MAX_LENGTH
      );
    });
    it('Should return the default flag for unicode support', async () => {
      await expect(await PartnerConfiguration.getUnicodeSupport()).to.equal(
        DEFAULT_IS_UNICODE_SUPPORTED
      );
    });
    it('Should return the default min duration', async () => {
      await expect(await PartnerConfiguration.getMinDuration()).to.equal(
        DEFAULT_MIN_DURATION
      );
    });
    it('Should return the default max duration', async () => {
      await expect(await PartnerConfiguration.getMaxDuration()).to.equal(
        DEFAULT_MAX_DURATION
      );
    });
    it('Should return the default fee percentage', async () => {
      await expect(await PartnerConfiguration.getFeePercentage()).to.equal(
        DEFAULT_FEE_PERCENTAGE
      );
    });
    it('Should return the default discount', async () => {
      await expect(await PartnerConfiguration.getDiscount()).to.equal(
        DEFAULT_DISCOUNT
      );
    });
    it('Should return the default commitement age', async () => {
      await expect(await PartnerConfiguration.getMinCommittmentAge()).to.equal(
        DEFAULT_MIN_COMMITMENT_AGE
      );
    });
  });

  context('Set New Config Values', () => {
    it('Should set a new min length', async () => {
      const NEW_MIN_LENGTH = 4;
      const tx = await PartnerConfiguration.setMinLength(NEW_MIN_LENGTH);
      tx.wait();
      await expect(await PartnerConfiguration.getMinLength()).to.equal(
        NEW_MIN_LENGTH
      );
    });
    it('Should set a new max length', async () => {
      const NEW_MAX_LENGTH = 8;
      const tx = await PartnerConfiguration.setMaxLength(NEW_MAX_LENGTH);
      tx.wait();
      await expect(await PartnerConfiguration.getMaxLength()).to.equal(
        NEW_MAX_LENGTH
      );
    });
    it('Should set a new flag for unicode support', async () => {
      const tx = await PartnerConfiguration.setUnicodeSupport(true);
      tx.wait();
      await expect(await PartnerConfiguration.getUnicodeSupport()).to.be.true;
    });
    it('Should set a new min duration', async () => {
      const NEW_MIN_DURATION = 2;
      const tx = await PartnerConfiguration.setMinDuration(NEW_MIN_DURATION);
      tx.wait();
      await expect(await PartnerConfiguration.getMinDuration()).to.equal(
        NEW_MIN_DURATION
      );
    });
    it('Should set a new max duration', async () => {
      const NEW_MAX_DURATION = 3;
      const tx = await PartnerConfiguration.setMaxDuration(NEW_MAX_DURATION);
      tx.wait();
      await expect(await PartnerConfiguration.getMaxDuration()).to.equal(
        NEW_MAX_DURATION
      );
    });
    it('Should set a new fee percentage', async () => {
      const NEW_FEE_PERCENTAGE = 2;
      const tx = await PartnerConfiguration.setFeePercentage(
        NEW_FEE_PERCENTAGE
      );
      tx.wait();
      await expect(await PartnerConfiguration.getFeePercentage()).to.equal(
        NEW_FEE_PERCENTAGE
      );
    });
    it('Should set a new discount', async () => {
      const NEW_DISCOUNT = 3;
      const tx = await PartnerConfiguration.setDiscount(NEW_DISCOUNT);
      tx.wait();
      await expect(await PartnerConfiguration.getDiscount()).to.equal(
        NEW_DISCOUNT
      );
    });
    it('Should return the default commitement age', async () => {
      const NEW_MIN_COMMITMENT_AGE = 6;
      const tx = await PartnerConfiguration.setMinCommittmentAge(
        NEW_MIN_COMMITMENT_AGE
      );
      tx.wait();
      await expect(await PartnerConfiguration.getMinCommittmentAge()).to.equal(
        NEW_MIN_COMMITMENT_AGE
      );
    });
  });
});
