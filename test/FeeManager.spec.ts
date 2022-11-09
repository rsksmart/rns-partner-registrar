import { FeeManager__factory } from '../typechain-types/factories/contracts/FeeManager/FeeManager__factory';
import { FeeManager } from '../typechain-types/contracts/FeeManager/FeeManager';
import { ethers } from 'hardhat';
import { deployMockContract, MockContract } from 'ethereum-waffle';
import MyRIF from '../artifacts/contracts/Rif.sol/RIF.json';
import MyPartnerManager from '../artifacts/contracts/PartnerManager/IPartnerManager.sol/IPartnerManager.json';
import MyPartnerConfiguration from '../artifacts/contracts/PartnerConfiguration/IPartnerConfiguration.sol/IPartnerConfiguration.json';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber } from 'ethers';
import { expect } from 'chairc';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';

async function testSetup() {
  const [owner, registrar, account2, account3, ...accounts] =
    await ethers.getSigners();

  const RIF = await deployMockContract(owner, MyRIF.abi);
  const PartnerManager = await deployMockContract(owner, MyPartnerManager.abi);
  const PartnerConfiguration = await deployMockContract(
    owner,
    MyPartnerConfiguration.abi
  );

  const FeeManager = (await ethers.getContractFactory(
    'FeeManager'
  )) as FeeManager__factory;

  const feeManager = (await FeeManager.deploy(
    RIF.address,
    registrar.address,
    PartnerManager.address
  )) as FeeManager;

  await feeManager.deployed();

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
          owner,
        } = await loadFixture(testSetup);

        const depositAmount = BigNumber.from(10);
        const feePercentage = BigNumber.from(10);

        await RIF.mock.transferFrom.returns(true);
        await PartnerConfiguration.mock.getFeePercentage.returns(feePercentage);
        await PartnerManager.mock.getPartnerConfiguration.returns(
          PartnerConfiguration.address
        );

        await expect(
          feeManager.connect(registrar).deposit(partner.address, depositAmount)
        ).to.not.be.reverted;

        const partnerFee = depositAmount.mul(feePercentage).div(100);
        expect(await feeManager.balances(partner.address)).to.be.equal(
          partnerFee
        );
        expect(await feeManager.balances(owner.address)).to.be.equal(
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
        } = await loadFixture(testSetup);

        const depositAmount = BigNumber.from(10);

        await RIF.mock.transferFrom.returns(true);

        await expect(feeManager.deposit(partner.address, depositAmount)).to.be
          .reverted;
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
        } = await loadFixture(testSetup);

        const depositAmount = BigNumber.from(10);

        await RIF.mock.transferFrom.returns(false);

        await expect(
          feeManager.connect(registrar).deposit(partner.address, depositAmount)
        ).to.be.reverted;
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
      RIF: MockContract,
      PartnerManager: MockContract,
      PartnerConfiguration: MockContract;

    beforeEach(async () => {
      const vars = await loadFixture(testSetup);
      feeManager = vars.feeManager;
      registrar = vars.registrar;
      partner = vars.account3;
      RIF = vars.RIF;
      PartnerConfiguration = vars.PartnerConfiguration;
      PartnerManager = vars.PartnerManager;

      const depositAmount = BigNumber.from(10);
      const feePercentage = BigNumber.from(10);

      await RIF.mock.transfer.returns(true);
      await PartnerConfiguration.mock.getFeePercentage.returns(feePercentage);
      await PartnerManager.mock.getPartnerConfiguration.returns(
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
        await expect(feeManager.connect(partner).withdraw()).to.be.revertedWith(
          'ZeroBalance()'
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

    it('should revert if transfer fails', async () => {
      try {
        await RIF.mock.transfer.returns(false);
        await expect(feeManager.connect(partner).withdraw()).to.be.revertedWith(
          'Fee Manager: Transfer failed'
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });
});
