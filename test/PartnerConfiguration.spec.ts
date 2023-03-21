import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  PartnerConfiguration__factory,
  RegistrarAccessControl__factory,
} from 'typechain-types';
import { deployContract, oneRBTC } from './utils/mock.utils';
import { BigNumber } from 'ethers';
import {
  UN_NECESSARY_MODIFICATION_ERROR_MSG,
  MIN_DURATION_CHANGED_EVENT,
  MAX_DURATION_CHANGED_EVENT,
  MIN_LENGTH_CHANGED_EVENT,
  MAX_LENGTH_CHANGED_EVENT,
  FEE_PERCENTAGE_CHANGED_EVENT,
  DISCOUNT_CHANGED_EVENT,
  MIN_COMMITMENT_AGE_CHANGED_EVENT,
  DEFAULT_MIN_LENGTH,
  DEFAULT_MAX_LENGTH,
  DEFAULT_MIN_DURATION,
  DEFAULT_MAX_DURATION,
  DEFAULT_MIN_COMMITMENT_AGE,
  DEFAULT_DISCOUNT,
  DEFAULT_FEE_PERCENTAGE,
  VALUE_OUT_OF_PERCENT_RANGE_ERROR_MSG,
  ONLY_HIGH_LEVEL_OPERATOR_ERR,
} from './utils/constants.utils';

const initialSetup = async () => {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const highLevelOperator = signers[1];

  const accessControl = await deployContract<RegistrarAccessControl__factory>(
    'RegistrarAccessControl',
    []
  );

  const PartnerConfiguration =
    await deployContract<PartnerConfiguration__factory>(
      'PartnerConfiguration',
      [
        accessControl.address,
        DEFAULT_MIN_LENGTH,
        DEFAULT_MAX_LENGTH,
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
    accessControl,
    highLevelOperator,
  };
};

describe('Partner Configuration', () => {
  describe('when the contract is deployed', () => {
    it('should revert if the min length is 0', async () => {
      const { PartnerConfiguration, accessControl } = await loadFixture(
        initialSetup
      );

      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          accessControl.address,
          0,
          DEFAULT_MAX_LENGTH,
          DEFAULT_MIN_DURATION,
          DEFAULT_MAX_DURATION,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });

    it('should revert if the max length is less than the min length', async () => {
      const { PartnerConfiguration, accessControl } = await loadFixture(
        initialSetup
      );
      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          accessControl.address,
          DEFAULT_MIN_LENGTH,
          2,
          DEFAULT_MIN_DURATION,
          DEFAULT_MAX_DURATION,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });

    it('should revert if the min duration is 0', async () => {
      const { PartnerConfiguration, accessControl } = await loadFixture(
        initialSetup
      );
      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          accessControl.address,
          DEFAULT_MIN_LENGTH,
          DEFAULT_MAX_LENGTH,
          0,
          DEFAULT_MAX_DURATION,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });

    it('should revert if the max duration is less than the min duration', async () => {
      const { PartnerConfiguration, accessControl } = await loadFixture(
        initialSetup
      );
      await expect(
        deployContract<PartnerConfiguration__factory>('PartnerConfiguration', [
          accessControl.address,
          DEFAULT_MIN_LENGTH,
          DEFAULT_MAX_LENGTH,
          3,
          2,
          DEFAULT_FEE_PERCENTAGE,
          DEFAULT_DISCOUNT,
          DEFAULT_MIN_COMMITMENT_AGE,
        ])
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
  });

  describe('Check Defaults', () => {
    it('Should return the default min length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      expect(await PartnerConfiguration.getMinLength()).to.equal(
        DEFAULT_MIN_LENGTH
      );
    });
    it('Should return the default max length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      expect(await PartnerConfiguration.getMaxLength()).to.equal(
        DEFAULT_MAX_LENGTH
      );
    });
    it('Should return the default min duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      expect(await PartnerConfiguration.getMinDuration()).to.equal(
        DEFAULT_MIN_DURATION
      );
    });
    it('Should return the default max duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      expect(await PartnerConfiguration.getMaxDuration()).to.equal(
        DEFAULT_MAX_DURATION
      );
    });
    it('Should return the default fee percentage', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      expect(await PartnerConfiguration.getFeePercentage()).to.equal(
        DEFAULT_FEE_PERCENTAGE
      );
    });
    it('Should return the default discount', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      expect(await PartnerConfiguration.getDiscount()).to.equal(
        DEFAULT_DISCOUNT
      );
    });
    it('Should return the default commitment age', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      expect(await PartnerConfiguration.getMinCommitmentAge()).to.equal(
        DEFAULT_MIN_COMMITMENT_AGE
      );
    });
  });

  describe('getPrice', () => {
    it('Should return the correct price', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const expires = BigNumber.from(1);
      const name = 'cheta';

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

    it('Should return price as zero when discount is 100%', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const expires = BigNumber.from(1);
      const name = 'cheta';

      (await PartnerConfiguration.setDiscount(oneRBTC.mul(100))).wait();

      const duration = BigNumber.from(1);
      const price = await PartnerConfiguration.getPrice(
        name,
        expires,
        duration
      );
      expect(price).to.be.equal(ethers.constants.Zero);
    });
  });
  describe('validateName', () => {
    it('Should revert if duration is less than min duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const duration = BigNumber.from(1);
      const name = 'cheta';

      await PartnerConfiguration.setMinDuration(DEFAULT_MAX_DURATION);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });

    it('Should revert if duration is more than max duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const duration = BigNumber.from(6);
      const name = 'cheta';

      await PartnerConfiguration.setMaxDuration(5);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });

    it('Should revert if length is less than min length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const duration = BigNumber.from(2);
      const name = 'cheta';

      await PartnerConfiguration.setMinLength(DEFAULT_MAX_LENGTH);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidName');
    });

    it('Should revert if length is more than max length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const duration = BigNumber.from(2);
      const name = 'cheta';

      await PartnerConfiguration.setMaxLength(3);

      await expect(
        PartnerConfiguration.validateName(name, duration)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidName');
    });

    it('Should check if the name is valid', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const duration = BigNumber.from(2);
      const name = 'cheta';

      await expect(PartnerConfiguration.validateName(name, duration)).to.be
        .fulfilled;
    });
  });

  describe('Set New Config Values', () => {
    it('Should revert if min length is 0', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_LENGTH = 0;
      await expect(
        PartnerConfiguration.setMinLength(NEW_MIN_LENGTH)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });
    it('Should revert if min length is more than max length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_LENGTH = DEFAULT_MAX_LENGTH + 1;
      await expect(
        PartnerConfiguration.setMinLength(NEW_MIN_LENGTH)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });
    it('Should revert if max length is less than min length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_LENGTH = 4;
      await PartnerConfiguration.setMinLength(NEW_MIN_LENGTH);

      await expect(
        PartnerConfiguration.setMaxLength(3)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidLength');
    });
    it('Should revert if min duration is 0', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_DURATION = 0;
      await expect(
        PartnerConfiguration.setMinDuration(NEW_MIN_DURATION)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
    it('Should revert if min duration more than max duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_DURATION = DEFAULT_MAX_DURATION + 1;
      await expect(
        PartnerConfiguration.setMinDuration(NEW_MIN_DURATION)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
    it('Should revert if max duration is less than min duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await PartnerConfiguration.setMinDuration(DEFAULT_MAX_DURATION);

      await expect(
        PartnerConfiguration.setMaxDuration(1)
      ).to.be.revertedWithCustomError(PartnerConfiguration, 'InvalidDuration');
    });
    it('Should set a new min length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_LENGTH = 4;
      const tx = await PartnerConfiguration.setMinLength(NEW_MIN_LENGTH);
      tx.wait();
      expect(await PartnerConfiguration.getMinLength()).to.equal(
        NEW_MIN_LENGTH
      );
    });
    it('Should set a new max length', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MAX_LENGTH = 8;
      const tx = await PartnerConfiguration.setMaxLength(NEW_MAX_LENGTH);
      tx.wait();
      expect(await PartnerConfiguration.getMaxLength()).to.equal(
        NEW_MAX_LENGTH
      );
    });
    it('Should set a new min duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_DURATION = 2;
      const tx = await PartnerConfiguration.setMinDuration(NEW_MIN_DURATION);
      tx.wait();
      expect(await PartnerConfiguration.getMinDuration()).to.equal(
        NEW_MIN_DURATION
      );
    });
    it('Should set a new max duration', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MAX_DURATION = 3;
      const tx = await PartnerConfiguration.setMaxDuration(NEW_MAX_DURATION);
      tx.wait();
      expect(await PartnerConfiguration.getMaxDuration()).to.equal(
        NEW_MAX_DURATION
      );
    });
    it('Should set a new fee percentage', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
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
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_DISCOUNT = 3;
      const tx = await PartnerConfiguration.setDiscount(NEW_DISCOUNT);
      tx.wait();
      expect(await PartnerConfiguration.getDiscount()).to.equal(NEW_DISCOUNT);
    });
    it('Should return the default commitment age', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
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

  describe('Config modification events', () => {
    it('Should emit the MinDurationChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_DURATION = DEFAULT_MIN_DURATION + 1;
      await expect(PartnerConfiguration.setMinDuration(NEW_MIN_DURATION))
        .to.emit(PartnerConfiguration, MIN_DURATION_CHANGED_EVENT)
        .withArgs(DEFAULT_MIN_DURATION, NEW_MIN_DURATION);
    });
    it('Should emit the MaxDurationChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MAX_DURATION = DEFAULT_MAX_DURATION + 1;
      await expect(PartnerConfiguration.setMaxDuration(NEW_MAX_DURATION))
        .to.emit(PartnerConfiguration, MAX_DURATION_CHANGED_EVENT)
        .withArgs(DEFAULT_MAX_DURATION, NEW_MAX_DURATION);
    });

    it('Should emit the MinLengthChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_LENGTH = DEFAULT_MIN_LENGTH + 1;
      await expect(PartnerConfiguration.setMinLength(NEW_MIN_LENGTH))
        .to.emit(PartnerConfiguration, MIN_LENGTH_CHANGED_EVENT)
        .withArgs(DEFAULT_MIN_LENGTH, NEW_MIN_LENGTH);
    });

    it('Should emit the MaxLengthChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MAX_LENGTH = DEFAULT_MAX_LENGTH + 1;
      await expect(PartnerConfiguration.setMaxLength(NEW_MAX_LENGTH))
        .to.emit(PartnerConfiguration, MAX_LENGTH_CHANGED_EVENT)
        .withArgs(DEFAULT_MAX_LENGTH, NEW_MAX_LENGTH);
    });

    it('Should emit the FeePercentageChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_FEE_PERCENTAGE = DEFAULT_FEE_PERCENTAGE + 1;
      await expect(PartnerConfiguration.setFeePercentage(NEW_FEE_PERCENTAGE))
        .to.emit(PartnerConfiguration, FEE_PERCENTAGE_CHANGED_EVENT)
        .withArgs(DEFAULT_FEE_PERCENTAGE, NEW_FEE_PERCENTAGE);
    });

    it('Should emit the DiscountChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_DISCOUNT = DEFAULT_DISCOUNT + 1;
      await expect(PartnerConfiguration.setDiscount(NEW_DISCOUNT))
        .to.emit(PartnerConfiguration, DISCOUNT_CHANGED_EVENT)
        .withArgs(DEFAULT_DISCOUNT, NEW_DISCOUNT);
    });

    it('Should emit the MinCommitmentAgeChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const NEW_MIN_COMMITMENT_AGE = DEFAULT_MIN_COMMITMENT_AGE + 1;
      await expect(
        PartnerConfiguration.setMinCommitmentAge(NEW_MIN_COMMITMENT_AGE)
      )
        .to.emit(PartnerConfiguration, MIN_COMMITMENT_AGE_CHANGED_EVENT)
        .withArgs(DEFAULT_MIN_COMMITMENT_AGE, NEW_MIN_COMMITMENT_AGE);
    });
  });

  describe('Config checks', () => {
    it('Should emit the MinDurationChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await expect(
        PartnerConfiguration.setMinDuration(DEFAULT_MIN_DURATION)
      ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
    });
    it('Should emit the MaxDurationChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await expect(
        PartnerConfiguration.setMaxDuration(DEFAULT_MAX_DURATION)
      ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
    });

    it('Should emit the MinLengthChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await expect(
        PartnerConfiguration.setMinLength(DEFAULT_MIN_LENGTH)
      ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
    });

    it('Should emit the MaxLengthChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await expect(
        PartnerConfiguration.setMaxLength(DEFAULT_MAX_LENGTH)
      ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
    });

    it('Should emit the FeePercentageChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await expect(
        PartnerConfiguration.setFeePercentage(DEFAULT_FEE_PERCENTAGE)
      ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
    });

    it('Should emit the DiscountChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await expect(
        PartnerConfiguration.setDiscount(DEFAULT_DISCOUNT)
      ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
    });

    it('Should emit the MinCommitmentAgeChanged event with the correct params', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      await expect(
        PartnerConfiguration.setMinCommitmentAge(DEFAULT_MIN_COMMITMENT_AGE)
      ).to.be.revertedWith(UN_NECESSARY_MODIFICATION_ERROR_MSG);
    });

    it('Should revert if value being set is outside of allowed range for the discount', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const OUT_OF_RANGE_DISCOUNT = oneRBTC.mul(101);
      await expect(
        PartnerConfiguration.setDiscount(OUT_OF_RANGE_DISCOUNT)
      ).to.be.revertedWith(VALUE_OUT_OF_PERCENT_RANGE_ERROR_MSG);
    });

    it('Should revert if value being set is outside of allowed range for the fee percentage', async () => {
      const { PartnerConfiguration } = await loadFixture(initialSetup);
      const OUT_OF_RANGE_FEE_PERCENTAGE = oneRBTC.mul(101);
      await expect(
        PartnerConfiguration.setFeePercentage(OUT_OF_RANGE_FEE_PERCENTAGE)
      ).to.be.revertedWith(VALUE_OUT_OF_PERCENT_RANGE_ERROR_MSG);
    });
  });

  describe('Access Control', () => {
    it('Should revert if the caller is not the high level operator', async () => {
      const { PartnerConfiguration, highLevelOperator, signers } =
        await loadFixture(initialSetup);

      const unAuthorizedCaller = signers[2];
      await expect(
        PartnerConfiguration.connect(unAuthorizedCaller).setMinDuration(1)
      ).to.be.revertedWithCustomError(
        PartnerConfiguration,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        PartnerConfiguration.connect(unAuthorizedCaller).setMinLength(1)
      ).to.be.revertedWithCustomError(
        PartnerConfiguration,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        PartnerConfiguration.connect(unAuthorizedCaller).setMaxLength(1)
      ).to.be.revertedWithCustomError(
        PartnerConfiguration,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        PartnerConfiguration.connect(unAuthorizedCaller).setMinCommitmentAge(1)
      ).to.be.revertedWithCustomError(
        PartnerConfiguration,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        PartnerConfiguration.connect(unAuthorizedCaller).setFeePercentage(1)
      ).to.be.revertedWithCustomError(
        PartnerConfiguration,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        PartnerConfiguration.connect(unAuthorizedCaller).setDiscount(1)
      ).to.be.revertedWithCustomError(
        PartnerConfiguration,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );

      await expect(
        PartnerConfiguration.connect(unAuthorizedCaller).setMaxDuration(1)
      ).to.be.revertedWithCustomError(
        PartnerConfiguration,
        ONLY_HIGH_LEVEL_OPERATOR_ERR
      );
    });

    it('Should succeed if the caller is the high level operator', async () => {
      const { PartnerConfiguration, highLevelOperator, accessControl } =
        await loadFixture(initialSetup);

      await accessControl.addHighLevelOperator(highLevelOperator.address);

      await expect(
        PartnerConfiguration.connect(highLevelOperator).setMinDuration(
          DEFAULT_MIN_DURATION + 1
        )
      ).to.be.fulfilled;

      await expect(
        PartnerConfiguration.connect(highLevelOperator).setMinLength(
          DEFAULT_MIN_LENGTH + 1
        )
      ).to.be.fulfilled;

      await expect(
        PartnerConfiguration.connect(highLevelOperator).setMaxLength(
          DEFAULT_MAX_LENGTH + 1
        )
      ).to.be.fulfilled;

      await expect(
        PartnerConfiguration.connect(highLevelOperator).setMinCommitmentAge(
          DEFAULT_MIN_COMMITMENT_AGE + 1
        )
      ).to.be.fulfilled;

      await expect(
        PartnerConfiguration.connect(highLevelOperator).setFeePercentage(
          DEFAULT_FEE_PERCENTAGE + 1
        )
      ).to.be.fulfilled;

      await expect(
        PartnerConfiguration.connect(highLevelOperator).setDiscount(
          DEFAULT_DISCOUNT + 1
        )
      ).to.be.fulfilled;

      await expect(
        PartnerConfiguration.connect(highLevelOperator).setMaxDuration(
          DEFAULT_MAX_DURATION + 1
        )
      ).to.be.fulfilled;
    });
  });
});
