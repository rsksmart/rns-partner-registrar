import { FeeManager as FeeManagerType } from '../typechain-types/contracts/FeeManager/FeeManager';
import { ethers } from 'hardhat';
import MyRIF from '../artifacts/contracts/RIF.sol/RIF.json';
import PartnerManagerJson from '../artifacts/contracts/PartnerManager/IPartnerManager.sol/IPartnerManager.json';
import MyPartnerConfiguration from '../artifacts/contracts/PartnerConfiguration/IPartnerConfiguration.sol/IPartnerConfiguration.json';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chairc';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  deployMockContract,
  oneRBTC,
  deployContract,
} from './utils/mock.utils';
import { FeeManager__factory, RIF as RIFType } from 'typechain-types';
import { PartnerManager } from '../typechain-types/contracts/PartnerManager/PartnerManager';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';
import { FakeContract, MockContract } from '@defi-wonderland/smock';
import {
  DEPOSIT_SUCCESSFUL_EVENT,
  WITHDRAWAL_SUCCESSFUL_EVENT,
} from './utils/constants.utils';

async function testSetup() {
  const [
    owner,
    registrar,
    renewer,
    partnerOwnerAccount,
    account3,
    pool,
    ...accounts
  ] = await ethers.getSigners();

  const RIF = await deployMockContract<RIFType>(MyRIF.abi);

  const PartnerManager = await deployMockContract<PartnerManager>(
    PartnerManagerJson.abi
  );

  const PartnerConfiguration = await deployMockContract<PartnerConfiguration>(
    MyPartnerConfiguration.abi
  );

  const feeManager = await deployContract<FeeManager__factory>('FeeManager', [
    RIF.address,
    registrar.address,
    renewer.address,
    PartnerManager.address,
    pool.address,
  ]);

  return {
    RIF,
    feeManager,
    owner,
    registrar,
    PartnerManager,
    PartnerConfiguration,
    partnerOwnerAccount,
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
          partnerOwnerAccount,
        } = await loadFixture(testSetup);

        const depositAmount = ethers.BigNumber.from(10);
        const feePercentage = ethers.BigNumber.from(10);

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
        expect(
          +(await feeManager.getBalance(partnerOwnerAccount.address))
        ).to.be.equal(+partnerFee);

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

        const depositAmount = ethers.BigNumber.from(10);

        RIF.transferFrom.returns(true);

        await expect(feeManager.deposit(partner.address, depositAmount))
          .to.be.revertedWithCustomError(feeManager, 'NotAuthorized')
          .withArgs(owner.address);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert if transfer fails (1)', async () => {
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
          partnerOwnerAccount,
        } = await loadFixture(testSetup);

        RIF.transferFrom.returns(false);
        RIF.transfer.returns(true);
        const depositAmount = ethers.BigNumber.from(10);
        const feePercentage = ethers.BigNumber.from(10);
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
          .withArgs(registrar.address, feeManager.address, depositAmount);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
    it('should revert if transfer fails (2)', async () => {
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
          partnerOwnerAccount,
        } = await loadFixture(testSetup);

        RIF.transferFrom.returns(true);
        RIF.transfer.returns(false);
        const depositAmount = ethers.BigNumber.from(10);
        const feePercentage = ethers.BigNumber.from(10);
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
    let feeManager: MockContract<FeeManagerType>,
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
      ).eventually.fulfilled;
    });

    it('should withdraw successfully', async () => {
      try {
        await expect(feeManager.connect(partner).withdraw()).to.eventually
          .fulfilled;
        expect(await feeManager.getBalance(partner.address)).to.be.equals(
          ethers.constants.Zero
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert when user has no balance', async () => {
      try {
        await expect(feeManager.connect(partner).withdraw()).to.eventually
          .fulfilled;
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
            await feeManager.connect(partner).getBalance(partner.address)
          );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });

  describe('Fee Manager Events', () => {
    it('Should emit the DepositSuccessful on successful deposit', async () => {
      try {
        const {
          feeManager,
          registrar,
          account3: partner,
          PartnerManager,
          PartnerConfiguration,
          RIF,
          partnerOwnerAccount,
        } = await loadFixture(testSetup);

        const depositAmount = ethers.BigNumber.from(10);
        const feePercentage = ethers.BigNumber.from(10);

        RIF.transferFrom.returns(true);
        RIF.transfer.returns(true);
        PartnerConfiguration.getFeePercentage.returns(feePercentage);
        PartnerManager.getPartnerConfiguration.returns(
          PartnerConfiguration.address
        );

        await expect(
          feeManager.connect(registrar).deposit(partner.address, depositAmount)
        )
          .to.emit(feeManager, DEPOSIT_SUCCESSFUL_EVENT)
          .withArgs(depositAmount, partner.address);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('Should emit the WithdrawalSuccessful event on successful withdraw', async () => {
      const {
        feeManager,
        registrar,
        account3,
        RIF,
        PartnerConfiguration,
        PartnerManager,
      } = await loadFixture(testSetup);

      const depositAmount = oneRBTC.mul(5);
      const feePercentage = oneRBTC.mul(5);

      RIF.transferFrom.returns(true);
      RIF.transfer.returns(true);
      PartnerConfiguration.getFeePercentage.returns(feePercentage);
      PartnerManager.getPartnerConfiguration.returns(
        PartnerConfiguration.address
      );

      await feeManager
        .connect(registrar)
        .deposit(account3.address, depositAmount);

      const partnerBalance = await feeManager.getBalance(account3.address);

      await expect(feeManager.connect(account3).withdraw())
        .to.emit(feeManager, WITHDRAWAL_SUCCESSFUL_EVENT)
        .withArgs(partnerBalance, account3.address);
    });
  });
});
