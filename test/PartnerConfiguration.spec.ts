import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  PartnerConfiguration,
  PartnerConfiguration__factory,
} from 'typechain-types';
import { deployContract, oneRBTC } from './utils/mock.utils';
import { MockContract } from '@defi-wonderland/smock';
import { BigNumber } from 'ethers';

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

  const PartnerConfiguration =
    await deployContract<PartnerConfiguration__factory>(
      'PartnerConfiguration',
      [
        DEFAULT_MIN_LENGTH,
        DEFAULT_MAX_LENGTH,
        DEFAULT_IS_UNICODE_SUPPORTED,
        DEFAULT_MIN_DURATION,
        DEFAULT_MAX_DURATION,
        DEFAULT_FEE_PERCENTAGE,
        DEFAULT_DISCOUNT,
        DEFAULT_MIN_COMMITMENT_AGE,
      ]
    );

  return {
    PartnerConfiguration,
    owner,
    signers,
  };
};

describe('Partner Configuration', () => {
  let PartnerConfiguration: MockContract<PartnerConfiguration>;
  beforeEach(async () => {
    const vars = await loadFixture(initialSetup);

    PartnerConfiguration = vars.PartnerConfiguration;
  });

  context('when the contract is deployed', () => {
    it('should revert if the min length is 0', async () => {
      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          0,
          DEFAULT_MAX_LENGTH,
          DEFAULT_IS_UNICODE_SUPPORTED,
          DEFAULT_MIN_DURATION,
          DEFAULT_MAX_DURATION,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });

    it('should revert if the max length is less than the min length', async () => {
      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          DEFAULT_MIN_LENGTH,
          2,
          DEFAULT_IS_UNICODE_SUPPORTED,
          DEFAULT_MIN_DURATION,
          DEFAULT_MAX_DURATION,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });

    it('should revert if the min duration is 0', async () => {
      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          DEFAULT_MIN_LENGTH,
          DEFAULT_MAX_LENGTH,
          DEFAULT_IS_UNICODE_SUPPORTED,
          0,
          DEFAULT_MAX_DURATION,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });

    it('should revert if the max duration is less than the min duration', async () => {
      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          DEFAULT_MIN_LENGTH,
          DEFAULT_MAX_LENGTH,
          DEFAULT_IS_UNICODE_SUPPORTED,
          3,
          2,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
  });

  context('Check Defaults', () => {
    it('Should return the default min length', async () => {
      expect(await PartnerConfiguration.getMinLength()).to.equal(
        DEFAULT_MIN_LENGTH
      );
    });
    it('Should return the default max length', async () => {
      expect(await PartnerConfiguration.getMaxLength()).to.equal(
        DEFAULT_MAX_LENGTH
      );
    });
    it('Should return the default flag for unicode support', async () => {
      expect(await PartnerConfiguration.getUnicodeSupport()).to.equal(
        DEFAULT_IS_UNICODE_SUPPORTED
      );
    });
    it('Should return the default min duration', async () => {
      expect(await PartnerConfiguration.getMinDuration()).to.equal(
        DEFAULT_MIN_DURATION
      );
    });
    it('Should return the default max duration', async () => {
      expect(await PartnerConfiguration.getMaxDuration()).to.equal(
        DEFAULT_MAX_DURATION
      );
    });
    it('Should return the default fee percentage', async () => {
      expect(await PartnerConfiguration.getFeePercentage()).to.equal(
        DEFAULT_FEE_PERCENTAGE
      );
    });
    it('Should return the default discount', async () => {
      expect(await PartnerConfiguration.getDiscount()).to.equal(
        DEFAULT_DISCOUNT
      );
    });
    it('Should return the default commitement age', async () => {
      expect(await PartnerConfiguration.getMinCommitmentAge()).to.equal(
        DEFAULT_MIN_COMMITMENT_AGE
      );
    });
  });

  context('getPrice', () => {
    it('Should return the correct price', async () => {
      const expires = BigNumber.from(1);
      const name = 'cheta';

      await PartnerConfiguration.setMaxDuration(BigNumber.from(7));

      let duration = BigNumber.from(2);
      expect(
        await PartnerConfiguration.getPrice(name, expires, duration)
      ).to.be.equal(oneRBTC.mul(BigNumber.from(4)));

      duration = BigNumber.from(1);
      expect(
        await PartnerConfiguration.getPrice(name, expires, duration)
      ).to.be.equal(oneRBTC.mul(BigNumber.from(2)));

      duration = BigNumber.from(5);
      expect(
        await PartnerConfiguration.getPrice(name, expires, duration)
      ).to.be.equal(oneRBTC.mul(BigNumber.from(2).add(duration)));

      duration = BigNumber.from(6);
      expect(
        await PartnerConfiguration.getPrice(name, expires, duration)
      ).to.be.equal(oneRBTC.mul(BigNumber.from(2).add(duration)));
    });
  });
  context('validateName', () => {
    it('Should revert if duration is less than min duration', async () => {
      const duration = BigNumber.from(1);
      const name = 'cheta';

      await PartnerConfiguration.setMinDuration(DEFAULT_MAX_DURATION);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });

    it('Should revert if duration is more than max duration', async () => {
      const duration = BigNumber.from(6);
      const name = 'cheta';

      await PartnerConfiguration.setMaxDuration(5);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });

    it('Should revert if length is less than min length', async () => {
      const duration = BigNumber.from(2);
      const name = 'cheta';

      await PartnerConfiguration.setMinLength(DEFAULT_MAX_LENGTH);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidName');
    });

    it('Should revert if length is more than max length', async () => {
      const duration = BigNumber.from(2);
      const name = 'cheta';

      await PartnerConfiguration.setMaxLength(3);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidName');
    });

    it('Should check if the name is valid', async () => {
      const duration = BigNumber.from(2);
      const name = 'cheta';

      await expect(PartnerConfiguration.validateName(name, duration)).to.be
        .fulfilled;
    });
  });

  context('Set New Config Values', () => {
    it('Should revert if min length is 0', async () => {
      const NEW_MIN_LENGTH = 0;
      await expect(
        PartnerConfiguration.setMinLength(NEW_MIN_LENGTH)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });
    it('Should revert if min length is more than max length', async () => {
      const NEW_MIN_LENGTH = DEFAULT_MAX_LENGTH + 1;
      await expect(
        PartnerConfiguration.setMinLength(NEW_MIN_LENGTH)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });
    it('Should revert if max length is less than min length', async () => {
      const NEW_MIN_LENGTH = 4;
      await PartnerConfiguration.setMinLength(NEW_MIN_LENGTH);

      await expect(
        PartnerConfiguration.setMaxLength(3)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });
    it('Should revert if min duration is 0', async () => {
      const NEW_MIN_DURATION = 0;
      await expect(
        PartnerConfiguration.setMinDuration(NEW_MIN_DURATION)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
    it('Should revert if min duration more than max duration', async () => {
      const NEW_MIN_DURATION = DEFAULT_MAX_DURATION + 1;
      await expect(
        PartnerConfiguration.setMinDuration(NEW_MIN_DURATION)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
    it('Should revert if max duration is less than min duration', async () => {
      await PartnerConfiguration.setMinDuration(DEFAULT_MAX_DURATION);

      await expect(
        PartnerConfiguration.setMaxDuration(1)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
    it('Should set a new min length', async () => {
      const NEW_MIN_LENGTH = 4;
      const tx = await PartnerConfiguration.setMinLength(NEW_MIN_LENGTH);
      tx.wait();
      expect(await PartnerConfiguration.getMinLength()).to.equal(
        NEW_MIN_LENGTH
      );
    });
    it('Should set a new max length', async () => {
      const NEW_MAX_LENGTH = 8;
      const tx = await PartnerConfiguration.setMaxLength(NEW_MAX_LENGTH);
      tx.wait();
      expect(await PartnerConfiguration.getMaxLength()).to.equal(
        NEW_MAX_LENGTH
      );
    });
    it('Should set a new flag for unicode support', async () => {
      const tx = await PartnerConfiguration.setUnicodeSupport(true);
      tx.wait();
      expect(await PartnerConfiguration.getUnicodeSupport()).to.be.true;
    });
    it('Should set a new min duration', async () => {
      const NEW_MIN_DURATION = 2;
      const tx = await PartnerConfiguration.setMinDuration(NEW_MIN_DURATION);
      tx.wait();
      expect(await PartnerConfiguration.getMinDuration()).to.equal(
        NEW_MIN_DURATION
      );
    });
    it('Should set a new max duration', async () => {
      const NEW_MAX_DURATION = 3;
      const tx = await PartnerConfiguration.setMaxDuration(NEW_MAX_DURATION);
      tx.wait();
      expect(await PartnerConfiguration.getMaxDuration()).to.equal(
        NEW_MAX_DURATION
      );
    });
    it('Should set a new fee percentage', async () => {
      const NEW_FEE_PERCENTAGE = 2;
      const tx = await PartnerConfiguration.setFeePercentage(
        NEW_FEE_PERCENTAGE
      );
      tx.wait();
      expect(await PartnerConfiguration.getFeePercentage()).to.equal(
        NEW_FEE_PERCENTAGE
      );
    });
    it('Should set a new discount', async () => {
      const NEW_DISCOUNT = 3;
      const tx = await PartnerConfiguration.setDiscount(NEW_DISCOUNT);
      tx.wait();
      expect(await PartnerConfiguration.getDiscount()).to.equal(NEW_DISCOUNT);
    });
    it('Should return the default commitement age', async () => {
      const NEW_MIN_COMMITMENT_AGE = 6;
      const tx = await PartnerConfiguration.setMinCommitmentAge(
        NEW_MIN_COMMITMENT_AGE
      );
      tx.wait();
      expect(await PartnerConfiguration.getMinCommitmentAge()).to.equal(
        NEW_MIN_COMMITMENT_AGE
      );
    });
  });

  context('Config modification events', () => {
    it('Should emit the MinDurationChanged event with the correct params', async () => {
      const NEW_MIN_DURATION = DEFAULT_MIN_DURATION + 1;
      await expect(PartnerConfiguration.setMinDuration(NEW_MIN_DURATION))
        .to.emit(PartnerConfiguration, 'MinDurationChanged')
        .withArgs(DEFAULT_MIN_DURATION, NEW_MIN_DURATION);
    });
    it('Should emit the MaxDurationChanged event with the correct params', async () => {
      const NEW_MAX_DURATION = DEFAULT_MAX_DURATION + 1;
      await expect(PartnerConfiguration.setMaxDuration(NEW_MAX_DURATION))
        .to.emit(PartnerConfiguration, 'MaxDurationChanged')
        .withArgs(DEFAULT_MAX_DURATION, NEW_MAX_DURATION);
    });

    it('Should emit the UnicodeSupportChanged event with the correct params', async () => {
      const NEW_IS_UNICODE_SUPPORTED = !DEFAULT_IS_UNICODE_SUPPORTED;
      await expect(
        PartnerConfiguration.setUnicodeSupport(NEW_IS_UNICODE_SUPPORTED)
      )
        .to.emit(PartnerConfiguration, 'UnicodeSupportChanged')
        .withArgs(DEFAULT_IS_UNICODE_SUPPORTED, NEW_IS_UNICODE_SUPPORTED);
    });

    it('Should emit the MinLengthChanged event with the correct params', async () => {
      const NEW_MIN_LENGTH = DEFAULT_MIN_LENGTH + 1;
      await expect(PartnerConfiguration.setMinLength(NEW_MIN_LENGTH))
        .to.emit(PartnerConfiguration, 'MinLengthChanged')
        .withArgs(DEFAULT_MIN_LENGTH, NEW_MIN_LENGTH);
    });

    it('Should emit the MaxLengthChanged event with the correct params', async () => {
      const NEW_MAX_LENGTH = DEFAULT_MAX_LENGTH + 1;
      await expect(PartnerConfiguration.setMaxLength(NEW_MAX_LENGTH))
        .to.emit(PartnerConfiguration, 'MaxLengthChanged')
        .withArgs(DEFAULT_MAX_LENGTH, NEW_MAX_LENGTH);
    });

    it('Should emit the FeePercentageChanged event with the correct params', async () => {
      const NEW_FEE_PERCENTAGE = DEFAULT_FEE_PERCENTAGE + 1;
      await expect(PartnerConfiguration.setFeePercentage(NEW_FEE_PERCENTAGE))
        .to.emit(PartnerConfiguration, 'FeePercentageChanged')
        .withArgs(DEFAULT_FEE_PERCENTAGE, NEW_FEE_PERCENTAGE);
    });

    it('Should emit the DiscountChanged event with the correct params', async () => {
      const NEW_DISCOUNT = DEFAULT_DISCOUNT + 1;
      await expect(PartnerConfiguration.setDiscount(NEW_DISCOUNT))
        .to.emit(PartnerConfiguration, 'DiscountChanged')
        .withArgs(DEFAULT_DISCOUNT, NEW_DISCOUNT);
    });

    it('Should emit the MinCommitmentAgeChanged event with the correct params', async () => {
      const NEW_MIN_COMMITMENT_AGE = DEFAULT_MIN_COMMITMENT_AGE + 1;
      await expect(
        PartnerConfiguration.setMinCommitmentAge(NEW_MIN_COMMITMENT_AGE)
      )
        .to.emit(PartnerConfiguration, 'MinCommitmentAgeChanged')
        .withArgs(DEFAULT_MIN_COMMITMENT_AGE, NEW_MIN_COMMITMENT_AGE);
    });
  });
});
