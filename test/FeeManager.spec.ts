import { FeeManager as FeeManagerType } from '../typechain-types/contracts/FeeManager/FeeManager';
import { ethers } from 'hardhat';
import MyRIF from '../artifacts/contracts/RIF.sol/RIF.json';
import MyPartnerManager from '../artifacts/contracts/PartnerManager/IPartnerManager.sol/IPartnerManager.json';
import MyPartnerConfiguration from '../artifacts/contracts/PartnerConfiguration/IPartnerConfiguration.sol/IPartnerConfiguration.json';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber } from 'ethers';
import { expect } from 'chairc';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployMockContract, oneRBTC } from './utils/mock.utils';
import { RIF as RIFType } from 'typechain-types';
import { PartnerManager } from '../typechain-types/contracts/PartnerManager/PartnerManager';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';
import { FakeContract } from '@defi-wonderland/smock';
import { deployContract } from 'utils/deployment.utils';

async function testSetup() {
  const [owner, registrar, account2, account3, pool, ...accounts] =
    await ethers.getSigners();

  const RIF = await deployMockContract<RIFType>(MyRIF.abi);

  const PartnerManager = await deployMockContract<PartnerManager>(
    MyPartnerManager.abi
  );
  const PartnerConfiguration = await deployMockContract<PartnerConfiguration>(
    MyPartnerConfiguration.abi
  );

  const { contract: feeManager } = await deployContract<FeeManagerType>(
    'FeeManager',
    {
      rif: RIF.address,
      registrar: registrar.address,
      partnerManager: PartnerManager.address,
      pool: pool.address,
    }
  );

  await feeManager.deployed();

  const oneRBTC = BigNumber.from(10).pow(18);

  return {
    RIF,
    feeManager,
    owner,
    registrar,
    PartnerManager,
    PartnerConfiguration,
    account2,
    account3,
    accounts,
    pool,
    oneRBTC,
  };
}

describe('Fee Manager', () => {
  describe('Deposit', () => {
    it('should deposit successfully', async () => {
      try {
        const {
          feeManager,
          registrar,
          account3: partner,
          PartnerManager,
          PartnerConfiguration,
          RIF,
          pool,
          oneRBTC,
        } = await loadFixture(testSetup);

        const depositAmount = BigNumber.from(10);
        const feePercentage = BigNumber.from(10);

        RIF.transferFrom.returns(true);
        RIF.transfer.returns(true);
        PartnerConfiguration.getFeePercentage.returns(feePercentage);
        PartnerManager.getPartnerConfiguration.returns(
          PartnerConfiguration.address
        );

        await expect(
          feeManager.connect(registrar).deposit(partner.address, depositAmount)
        ).to.not.be.reverted;

        const partnerFee = depositAmount
          .mul(feePercentage)
          .div(oneRBTC.mul(100));
        expect(await feeManager.balances(partner.address)).to.be.equal(
          partnerFee
        );

        expect(RIF.transfer).to.have.been.calledOnceWith(
          pool.address,
          depositAmount.sub(partnerFee)
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert if not called by registrar', async () => {
      try {
        const {
          feeManager,
          account3: partner,
          RIF,
          owner,
        } = await loadFixture(testSetup);

        const depositAmount = BigNumber.from(10);

        RIF.transferFrom.returns(true);

        await expect(feeManager.deposit(partner.address, depositAmount))
          .to.be.revertedWithCustomError(feeManager, 'NotAuthorized')
          .withArgs(owner.address);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert if transfer fails', async () => {
      try {
        const {
          feeManager,
          registrar,
          account3: partner,
          RIF,
          pool,
          PartnerConfiguration,
          PartnerManager,
          oneRBTC,
        } = await loadFixture(testSetup);

        RIF.transfer.returns(false);
        const depositAmount = BigNumber.from(10);
        const feePercentage = BigNumber.from(10);
        const partnerFee = depositAmount
          .mul(feePercentage)
          .div(oneRBTC.mul(100));

        PartnerConfiguration.getFeePercentage.returns(feePercentage);
        PartnerManager.getPartnerConfiguration.returns(
          PartnerConfiguration.address
        );

        await expect(
          feeManager.connect(registrar).deposit(partner.address, depositAmount)
        )
          .to.be.revertedWithCustomError(feeManager, 'TransferFailed')
          .withArgs(
            feeManager.address,
            pool.address,
            depositAmount.sub(partnerFee)
          );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });

  describe('Withdraw', () => {
    let feeManager: FeeManagerType,
      registrar: SignerWithAddress,
      partner: SignerWithAddress,
      RIF: FakeContract<RIFType>,
      PartnerManager: FakeContract<PartnerManager>,
      PartnerConfiguration: FakeContract<PartnerConfiguration>;

    beforeEach(async () => {
      const vars = await loadFixture(testSetup);
      feeManager = vars.feeManager;
      registrar = vars.registrar;
      partner = vars.account3;
      RIF = vars.RIF;
      PartnerConfiguration = vars.PartnerConfiguration;
      PartnerManager = vars.PartnerManager;

      const depositAmount = oneRBTC.mul(5);
      const feePercentage = oneRBTC.mul(5);

      RIF.transfer.returns(true);
      PartnerConfiguration.getFeePercentage.returns(feePercentage);
      PartnerManager.getPartnerConfiguration.returns(
        PartnerConfiguration.address
      );

      await expect(
        feeManager.connect(registrar).deposit(partner.address, depositAmount)
      ).to.not.be.reverted;
    });

    it('should withdraw successfully', async () => {
      try {
        await expect(feeManager.connect(partner).withdraw()).to.not.be.reverted;
        expect(await feeManager.balances(partner.address)).to.be.equals(
          ethers.constants.Zero
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert when user has no balance', async () => {
      try {
        await expect(feeManager.connect(partner).withdraw()).to.not.be.reverted;
        await expect(
          feeManager.connect(partner).withdraw()
        ).to.be.revertedWithCustomError(feeManager, 'ZeroBalance');
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert if transfer fails', async () => {
      try {
        RIF.transfer.returns(false);
        await expect(feeManager.connect(partner).withdraw())
          .to.be.revertedWithCustomError(feeManager, 'TransferFailed')
          .withArgs(
            feeManager.address,
            partner.address,
            await feeManager.connect(partner).balances(partner.address)
          );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });
});
