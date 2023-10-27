import { ethers } from 'hardhat';

async function main() {
  const rnsAddress = '0xa9d6d2bbfc49a217c9ec97b095060f5059df9139'; // Replace with the actual RNS address
  const rskDomain = ethers.constants.HashZero; // root domain
  const newOwnerAddress =
    '0xcd32D5B7C2e1790029D3106D9F8347F42a3Dfd60'.toLowerCase(); // Replace with the new owner's address
  const nodeOwnerContractAddress = '0x674a2f5ab4ca1937d38b661ece2f427cdd7ff091';
  const partnerRegistrarAddress = '0xac03fca25957c866cf44430d9c8dc9e09d5b19c3';
  const renewerContract = '0x08d059d6b7f8d6084e3d36cf09c4fc3e01e5152c';

  const rns = await ethers.getContractAt('RNS', rnsAddress);

  const currentOwner = await rns.owner(rskDomain);
  console.log(`Current owner of ${rskDomain} domain: ${currentOwner}`);

  await (await rns.setOwner(rskDomain, newOwnerAddress)).wait();

  // console.log(`Transaction hash: ${tx.hash}`);

  const newOwner = await rns.owner(rskDomain);
  console.log(`New owner of ${rskDomain} domain: ${newOwner}`);

  const nodeOwnerContract = await ethers.getContractAt(
    'NodeOwner',
    nodeOwnerContractAddress
  );
  await (
    await nodeOwnerContract.transferOwnership(nodeOwnerContractAddress)
  ).wait();

  // await (await nodeOwnerContract.addRegistrar(partnerRegistrarAddress)).wait();

  // await (await nodeOwnerContract.addRenewer(renewerContract)).wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
