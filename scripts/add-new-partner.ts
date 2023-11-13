import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

async function main() {
  try {
    console.log('...Creating partner wallet');
    const newPartnerAddress = '0x7a8f9c15dd417840902f80d7145ca6107592f47f';

    console.log('...Creating owner wallet');
    const [owner] = await ethers.getSigners();

    console.log('...Partner Manager setup');
    const PartnerManager = await ethers.getContractAt(
      'PartnerManager',
      '0x015799ae6e5b287dc6b91a4f8f89648ee6017af4'
    );

    console.log('...Partner Config setup');
    const PartnerConfigurationFactory = await ethers.getContractFactory(
      'PartnerConfiguration'
    );
    const PartnerConfiguration = await PartnerConfigurationFactory.connect(
      owner
    ).deploy(
      '0x806be3326052c305386f661793f786ef3e876d3f',
      BigNumber.from(3),
      BigNumber.from(20),
      BigNumber.from(2),
      BigNumber.from(8),
      BigNumber.from(2),
      BigNumber.from(1),
      BigNumber.from(1)
    );

    await PartnerConfiguration.deployed();
    console.log(
      '...Partner config deployed at: ',
      PartnerConfiguration.address
    );

    console.log('...adding new partner');
    await (
      await PartnerManager.connect(owner).addPartner(
        newPartnerAddress,
        PartnerConfiguration.address
      )
    ).wait();

    console.log('...partner added');

    console.log(`
      partner address: ${newPartnerAddress},
      partner configuration: ${PartnerConfiguration.address}
  `);
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
