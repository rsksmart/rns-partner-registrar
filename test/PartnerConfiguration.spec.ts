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
const DEFAULT_DISCOUNT = 1;
const DEFAULT_IS_UNICODE_SUPPORTED = false;
const DEFAULT_FEE_PERCENTAGE = 1;

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
  it('Should return the default min length', async () => {
    await expect(await PartnerConfiguration.getMinLength()).to.equal(
      DEFAULT_MIN_LENGTH
    );
  });
  it('Should return the default max length', async () => {
    await expect(await PartnerConfiguration.getMinLength()).to.equal(
      DEFAULT_MIN_LENGTH
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
    await expect(await PartnerConfiguration.getMinDuration()).to.equal(
      DEFAULT_DISCOUNT
    );
  });
  it('Should return the default commitement age', async () => {
    await expect(await PartnerConfiguration.getMinCommittmentAge()).to.equal(
      DEFAULT_MIN_COMMITMENT_AGE
    );
  });
});
