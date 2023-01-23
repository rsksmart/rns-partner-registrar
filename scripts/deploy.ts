import { ethers } from 'hardhat';
import { Contract, BigNumber } from 'ethers';
import {
  PartnerRegistrar,
  FeeManager,
  PartnerConfiguration,
  PartnerManager,
  PartnerRenewer,
  RegistrarAccessControl,
} from '../typechain-types';
import fs from 'fs';
import { namehash } from 'ethers/lib/utils';

// TODO: define nodeOwner
const RNS_NODE_OWNER =
  process.env.RNS_NODE_OWNER || '0xb938d659D5409E57EC1396F617565Aa96aF5B214';

// TODO: define RIF address
const RIF_ADDRESS =
  process.env.RIF_ADDRESS || '0xb938d659D5409E57EC1396F617565Aa96aF5B214';

// TODO: define POOL address
const POOL = process.env.POOL || '0xb938d659D5409E57EC1396F617565Aa96aF5B214';

// TODO: define RNS address
const RNS = process.env.RNS || '0xb938d659D5409E57EC1396F617565Aa96aF5B214';

// TODO: define the new owner of the RNS contracts
const NEW_RNS_OWNER =
  process.env.NEW_RNS_OWNER || '0xb938d659D5409E57EC1396F617565Aa96aF5B214';

const tldNode = namehash('rsk');

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

    const accessControl = await deployContract<RegistrarAccessControl>(
      'RegistrarAccessControl'
    );

    const partnerManager = await deployContract('PartnerManager', {
      accessControl: accessControl.address,
    });

    const partnerRegistrar = await deployContract<PartnerRegistrar>(
      'PartnerRegistrar',
      {
        accessControl: accessControl.address,
        nodeOwner: RNS_NODE_OWNER,
        rif: RIF_ADDRESS,
        partnerManager: partnerManager.address,
        rns: RNS,
        rootNode: tldNode,
      }
    );

    const partnerRenewer = await deployContract<PartnerRenewer>(
      'PartnerRenewer',
      {
        accessControl: accessControl.address,
        nodeOwner: RNS_NODE_OWNER,
        rif: RIF_ADDRESS,
        partnerManager: partnerManager.address,
      }
    );

    const feeManager = await deployContract<FeeManager>('FeeManager', {
      rif: RIF_ADDRESS,
      partnerRegistrar: partnerRegistrar.address,
      partnerRenewer: partnerRenewer.address,
      partnerManager: partnerManager.address,
      pool: POOL,
    });

    await (await partnerRegistrar.setFeeManager(feeManager.address)).wait();
    await (await partnerRenewer.setFeeManager(feeManager.address)).wait();

    const defaultPartnerConfiguration =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        accessControl: accessControl.address,
        minLength: BigNumber.from(3),
        maxLength: BigNumber.from(7),
        isUnicodeSupported: false,
        minDuration: BigNumber.from(1),
        maxDuration: BigNumber.from(5),
        feePercentage: BigNumber.from(0),
        discount: BigNumber.from(0),
        minCommitmentAge: BigNumber.from(0),
      });

    await (await accessControl.transferOwnership(NEW_RNS_OWNER)).wait();

    console.log('Writing contract addresses to file...');
    const content = {
      partnerRegistrar: partnerRegistrar.address,
      partnerRenewer: partnerRenewer.address,
      partnerManager: partnerManager.address,
      feeManager: feeManager.address,
      defaultPartnerConfiguration: defaultPartnerConfiguration.address,
      accessControl: accessControl.address,
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
