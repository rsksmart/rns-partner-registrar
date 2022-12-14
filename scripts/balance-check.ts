import { ethers } from 'hardhat';
import { formatEther, namehash } from 'ethers/lib/utils';

async function main() {
  try {
    const [owner, partner, userAccount, pool] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('FeeManager');
    const feeManager = factory.attach(
      '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
    );

    const balance = await feeManager.balances(
      '0x524F04724632eED237cbA3c37272e018b3A7967e'
    );
    console.log(`Balance:  ${+formatEther(balance)} RIF`);

    console.log('Done.');
  } catch (err) {
    throw err;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
