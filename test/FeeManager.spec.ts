import { FeeManager as FeeManagerType } from '../typechain-types/contracts/FeeManager/FeeManager';
import { ethers } from 'hardhat';
import MyRIF from '../artifacts/contracts/RIF.sol/RIF.json';
import PartnerManagerJson from '../artifacts/contracts/PartnerManager/IPartnerManager.sol/IPartnerManager.json';
import MyPartnerConfiguration from '../artifacts/contracts/PartnerConfiguration/IPartnerConfiguration.sol/IPartnerConfiguration.json';
import { RegistrarAccessControl__factory } from 'typechain-types';
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
  POOL_CHANGED_EVENT,
  PARTNER_MANAGER_CHANGED_EVENT,
} from './utils/constants.utils';

async function testSetup() {
  const [
    owner,
    registrar,
    renewer,
    partnerOwnerAccount,
    account3,
    pool,
    newValue,
    attacker,
    highLevelOperator,
    ...accounts
  ] = await ethers.getSigners();

  const RIF = await deployMockContract<RIFType>(MyRIF.abi);

  const PartnerManager = await deployMockContract<PartnerManager>(
    PartnerManagerJson.abi
  );

  const PartnerConfiguration = await deployMockContract<PartnerConfiguration>(
    MyPartnerConfiguration.abi
  );

  const accessControl = await deployContract<RegistrarAccessControl__factory>(
    'RegistrarAccessControl',
    []
  );

  await (
    await accessControl.addHighLevelOperator(highLevelOperator.address)
  ).wait();

  const feeManager = await deployContract<FeeManager__factory>('FeeManager', [
    RIF.address,
    pool.address,
    accessControl.address,
    PartnerManager.address,
  ]);

  // whiteList contracts on feeManager
  await feeManager.whiteListRegistrarOrRenewer(registrar.address);
  await feeManager.whiteListRegistrarOrRenewer(renewer.address);

  return {
    RIF,
    feeManager,
    owner,
    registrar,
    renewer,
    PartnerManager,
    PartnerConfiguration,
    partnerOwnerAccount,
    account3,
    accounts,
    pool,
    newValue,
    attacker,
    oneRBTC,
    accessControl,
    highLevelOperator,
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
        throw error;
      }
    });

    it('should deposit successfully when called by a second whitelisted account', async () => {
      try {
        const {
          feeManager,
          renewer,
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
          feeManager.connect(renewer).deposit(partner.address, depositAmount)
        ).to.not.be.reverted;

        const partnerFee = depositAmount
          .mul(feePercentage)
          .div(oneRBTC.mul(100));
        expect(
          +(await feeManager.getBalance(partnerOwnerAccount.address))
        ).to.be.equal(+partnerFee);

        expect(RIF.transfer).to.have.been.calledWith(
          pool.address,
          depositAmount.sub(partnerFee).toString()
        );
      } catch (error) {
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
        throw error;
      }
    });

    it('should revert if called by a blacklisted registrar', async () => {
      try {
        const {
          feeManager,
          account3: partner,
          RIF,
          registrar,
        } = await loadFixture(testSetup);

        const depositAmount = ethers.BigNumber.from(10);

        RIF.transferFrom.returns(true);

        feeManager.blackListRegistrarOrRenewer(registrar.address);

        await expect(
          feeManager.connect(registrar).deposit(partner.address, depositAmount)
        )
          .to.be.revertedWithCustomError(feeManager, 'NotAuthorized')
          .withArgs(registrar.address);
      } catch (error) {
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
          PartnerConfiguration,
          PartnerManager,
        } = await loadFixture(testSetup);

        RIF.transferFrom.returns(false);
        RIF.transfer.returns(true);
        const depositAmount = ethers.BigNumber.from(10);
        const feePercentage = ethers.BigNumber.from(10);

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
        throw error;
      }
    });
  });

  describe('setPool', () => {
    it('Should change the pool address', async () => {
      const {
        feeManager,
        newValue: newPool,
        highLevelOperator,
      } = await testSetup();

      await feeManager.connect(highLevelOperator).setPool(newPool.address);

      const alreadyChangedPool = await feeManager.getPool();

      expect(alreadyChangedPool).to.be.equal(newPool.address);
    });

    it('Should revert if not called by an authorized entity', async () => {
      const { feeManager, newValue: newPool, attacker } = await testSetup();

      await expect(feeManager.connect(attacker).setPool(newPool.address))
        .to.be.revertedWithCustomError(feeManager, 'OnlyHighLevelOperator')
        .withArgs(attacker.address);
    });

    it('Should revert if the new pool address is the same as the old one', async () => {
      const { feeManager, highLevelOperator } = await testSetup();

      const actualPoolAddress = feeManager.getPool();

      await expect(
        feeManager.connect(highLevelOperator).setPool(actualPoolAddress)
      ).to.be.revertedWith('old value is same as new value');
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

    it('Should emit PoolChanged event', async () => {
      const {
        feeManager,
        newValue: newPool,
        highLevelOperator,
      } = await testSetup();

      await expect(
        feeManager.connect(highLevelOperator).setPool(newPool.address)
      )
        .to.emit(feeManager, POOL_CHANGED_EVENT)
        .withArgs(highLevelOperator.address, newPool.address);
    });

    it('Should emit PartnerManagerChanged event', async () => {
      const {
        feeManager,
        newValue: newPartnerManager,
        highLevelOperator,
      } = await testSetup();

      await expect(
        feeManager
          .connect(highLevelOperator)
          .setPartnerManager(newPartnerManager.address)
      )
        .to.emit(feeManager, PARTNER_MANAGER_CHANGED_EVENT)
        .withArgs(highLevelOperator.address, newPartnerManager.address);
    });
  });

  describe('Partner manager ', () => {
    it('Should change the partner manager address', async () => {
      const {
        feeManager,
        newValue: newPartnerManager,
        highLevelOperator,
      } = await testSetup();

      await feeManager
        .connect(highLevelOperator)
        .setPartnerManager(newPartnerManager.address);

      const alreadyChangedPartnerManager = await feeManager.getPartnerManager();

      expect(alreadyChangedPartnerManager).to.be.equal(
        newPartnerManager.address
      );
    });

    it('Should revert if not called by an authorized entity', async () => {
      const {
        feeManager,
        newValue: newPartnerManager,
        attacker,
      } = await testSetup();

      await expect(
        feeManager
          .connect(attacker)
          .setPartnerManager(newPartnerManager.address)
      )
        .to.be.revertedWithCustomError(feeManager, 'OnlyHighLevelOperator')
        .withArgs(attacker.address);
    });

    it('Should revert if the new partner manager address is the same as the old one', async () => {
      const { feeManager, highLevelOperator } = await testSetup();

      const actualPartnerManagerAddress = feeManager.getPartnerManager();

      await expect(
        feeManager
          .connect(highLevelOperator)
          .setPartnerManager(actualPartnerManagerAddress)
      ).to.be.revertedWith('old value is same as new value');
    });
  });
});
