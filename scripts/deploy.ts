import { ethers } from 'hardhat';
import { Contract, BigNumber } from 'ethers';
import { PartnerRegistrar } from '../typechain-types/contracts/Registrar/PartnerRegistrar';
import { FeeManager } from '../typechain-types/contracts/FeeManager/FeeManager';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';
import fs from 'fs';

// TODO: define nodeOwner
const RNS_NODE_OWNER =
  process.env.RNS_NODE_OWNER || '0xb938d659D5409E57EC1396F617565Aa96aF5B214';

// TODO: define RIF address
const RIF_ADDRESS =
  process.env.RIF_ADDRESS || '0xb938d659D5409E57EC1396F617565Aa96aF5B214';

async function deployContract<T extends Contract>(
  name: string,
  args: Record<string, any> = {}
): Promise<T> {
  const contractFactory = await ethers.getContractFactory(name);

  const contract = (await contractFactory.deploy(...Object.values(args))) as T;

  await contract.deployed();

  return contract;
}

async function main() {
  try {
    const [owner] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', owner.address);

    console.log('Account balance:', (await owner.getBalance()).toString());

    const partnerManager = await deployContract('PartnerManager');

    const partnerRegistrar = await deployContract<PartnerRegistrar>(
      'PartnerRegistrar',
      {
        nodeOwner: RNS_NODE_OWNER,
        rif: RIF_ADDRESS,
        partnerManager: partnerManager.address,
      }
    );

    const feeManager = await deployContract<FeeManager>('FeeManager', {
      rif: RIF_ADDRESS,
      partnerRegistrar: partnerRegistrar.address,
      partnerManager: partnerManager.address,
    });

    await (await partnerRegistrar.setFeeManager(feeManager.address)).wait();

    const defaultPartnerConfiguration =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        minLength: BigNumber.from(3),
        maxLength: BigNumber.from(0),
        isUnicodeSupported: false,
        minDuration: BigNumber.from(0),
        maxDuration: BigNumber.from(0),
        feePercentage: BigNumber.from(10),
        discount: BigNumber.from(0),
        minCommittmentAge: BigNumber.from(0),
      });

    console.log('Writing contract addresses to file...');
    const content = {
      partnerRegistrar: partnerRegistrar.address,
      partnerManager: partnerManager.address,
      feeManager: feeManager.address,
      defaultPartnerConfiguration: defaultPartnerConfiguration.address,
    };

    fs.writeFileSync(
      './deployedAddresses.json',
      JSON.stringify(content, null, 2)
    );
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
