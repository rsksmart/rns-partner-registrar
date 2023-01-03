import { time } from '@nomicfoundation/hardhat-network-helpers';

async function main() {
  try {
    await time.increase(1);
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
