import { ethers } from 'hardhat';

async function main() {
  const [owner] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', owner.address);

  console.log('Account balance:', (await owner.getBalance()).toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
