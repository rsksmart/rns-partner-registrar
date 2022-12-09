import { FeeManager__factory } from '../typechain-types/factories/contracts/FeeManager/FeeManager__factory';
import { FeeManager } from '../typechain-types/contracts/FeeManager/FeeManager';
import { ethers } from 'hardhat';
import MyRIF from '../artifacts/contracts/RIF.sol/RIF.json';
import PartnerManagerJson from '../artifacts/contracts/PartnerManager/IPartnerManager.sol/IPartnerManager.json';
import MyPartnerConfiguration from '../artifacts/contracts/PartnerConfiguration/IPartnerConfiguration.sol/IPartnerConfiguration.json';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber } from 'ethers';
import { expect } from 'chairc';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployMockContract, MockContract, oneRBTC } from './utils/mock.utils';
import { RIF as RIFType } from 'typechain-types';
import { PartnerManager } from '../typechain-types/contracts/PartnerManager/PartnerManager';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';
import { smock, FakeContract } from '@defi-wonderland/smock';

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

  const RIF = await smock.fake<RIFType>(MyRIF.abi);

  const PartnerManager = await deployMockContract<PartnerManager>(
    owner,
    PartnerManagerJson.abi
  );

  const PartnerConfiguration = await deployMockContract<PartnerConfiguration>(
    owner,
    MyPartnerConfiguration.abi
  );

  const FeeManager = (await ethers.getContractFactory(
    'FeeManager'
  )) as FeeManager__factory;

  const feeManager = (await FeeManager.deploy(
    RIF.address,
    registrar.address,
    renewer.address,
    PartnerManager.address,
    pool.address
  )) as FeeManager;

  await feeManager.deployed();

  const oneRBTC = BigNumber.from(10).pow(18);

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

        const depositAmount = BigNumber.from(10);
        const feePercentage = BigNumber.from(10);

        RIF.transferFrom.returns(true);
        RIF.transfer.returns(true);
        await PartnerConfiguration.mock.getFeePercentage.returns(feePercentage);
        await PartnerManager.mock.getPartnerConfiguration.returns(
          PartnerConfiguration.address
        );

        await PartnerManager.mock.getPartnerOwnerAccount.returns(
          partnerOwnerAccount.address
        );

        await expect(
          feeManager.connect(registrar).deposit(partner.address, depositAmount)
        ).to.not.be.reverted;

        const partnerFee = depositAmount
          .mul(feePercentage)
          .div(oneRBTC.mul(100));
        await expect(
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
          partnerOwnerAccount,
        } = await loadFixture(testSetup);

        RIF.transferFrom.returns(true);
        RIF.transfer.returns(false);
        const depositAmount = BigNumber.from(10);
        const feePercentage = BigNumber.from(10);
        const partnerFee = depositAmount
          .mul(feePercentage)
          .div(oneRBTC.mul(100));

        await PartnerConfiguration.mock.getFeePercentage.returns(feePercentage);
        await PartnerManager.mock.getPartnerConfiguration.returns(
          PartnerConfiguration.address
        );
        await PartnerManager.mock.getPartnerOwnerAccount.returns(
          partnerOwnerAccount.address
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
    let feeManager: FeeManager,
      registrar: SignerWithAddress,
      partner: SignerWithAddress,
      partnerOwnerAccount: SignerWithAddress,
      RIF: FakeContract<RIFType>,
      PartnerManager: MockContract<PartnerManager>,
      PartnerConfiguration: MockContract<PartnerConfiguration>;

    beforeEach(async () => {
      const vars = await loadFixture(testSetup);
      feeManager = vars.feeManager;
      registrar = vars.registrar;
      partner = vars.account3;
      RIF = vars.RIF;
      PartnerConfiguration = vars.PartnerConfiguration;
      PartnerManager = vars.PartnerManager;
      partnerOwnerAccount = vars.partnerOwnerAccount;

      const depositAmount = oneRBTC.mul(5);
      const feePercentage = oneRBTC.mul(5);

      RIF.transfer.returns(true);
      RIF.transferFrom.returns(true);
      await PartnerConfiguration.mock.getFeePercentage.returns(feePercentage);
      await PartnerManager.mock.getPartnerConfiguration.returns(
        PartnerConfiguration.address
      );
      await PartnerManager.mock.getPartnerOwnerAccount.returns(
        partnerOwnerAccount.address
      );

      await expect(
        feeManager.connect(registrar).deposit(partner.address, depositAmount)
      ).eventually.fulfilled;
    });

    it('should withdraw successfully', async () => {
      try {
        await expect(feeManager.connect(partnerOwnerAccount).withdraw()).to
          .eventually.fulfilled;
        expect(
          await feeManager.getBalance(partnerOwnerAccount.address)
        ).to.be.equals(ethers.constants.Zero);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert when user has no balance', async () => {
      try {
        await expect(feeManager.connect(partnerOwnerAccount).withdraw()).to
          .eventually.fulfilled;
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
        await expect(feeManager.connect(partnerOwnerAccount).withdraw())
          .to.be.revertedWithCustomError(feeManager, 'TransferFailed')
          .withArgs(
            feeManager.address,
            partnerOwnerAccount.address,
            await feeManager
              .connect(partnerOwnerAccount.address)
              .getBalance(partnerOwnerAccount.address)
          );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });
});
