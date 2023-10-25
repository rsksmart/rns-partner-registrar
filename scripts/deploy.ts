import { ethers } from 'hardhat';
import { Contract, BigNumber } from 'ethers';
import {
  FeeManager,
  PartnerConfiguration,
  PartnerRegistrar,
  PartnerRenewer,
  RegistrarAccessControl,
} from '../typechain-types';
import fs from 'fs';
import { namehash } from 'ethers/lib/utils';
require('dotenv').config({ path: '.env.mainnet' });

console.log('Running script on env.', process.env.NODE_ENV);

// Addresses deployed on mainnet: https://dev.rootstock.io/rif/rns/mainnet/
const RNS_NODE_OWNER =
  process.env.RNS_NODE_OWNER || '0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1';

const RIF_ADDRESS =
  process.env.RIF_ADDRESS || '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5';

const POOL = process.env.POOL || '0x6cab832ec04855e67053a9509d2ad0dd25863ec7';

const RNS_ADDRESS =
  process.env.RNS_ADDRESS || '0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5';

const RESOLVER_ADDRESS =
  process.env.RESOLVER_ADDRESS || '0xD87f8121D44F3717d4bAdC50b24E50044f86D64B';

const MULTICHAIN_RESOLVER_ADDRESS =
  process.env.MULTICHAIN_RESOLVER_ADDRESS ||
  '0x99a12be4C89CbF6CFD11d1F2c029904a7B644368';
const PUBLIC_RESOLVER_ADDRESS =
  process.env.PUBLIC_RESOLVER_ADDRESS ||
  '0x4efd25e3d348f8f25a14fb7655fba6f72edfe93a';

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
    const [owner, defaultPartner] = await ethers.getSigners();

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
        rns: RNS_ADDRESS,
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
      accessControl: accessControl.address,
    });

    await (await partnerRegistrar.setFeeManager(feeManager.address)).wait();
    await (await partnerRenewer.setFeeManager(feeManager.address)).wait();

    console.log('Adding new registrar and renewer to old nodeOwner');
    const NodeOwnerContract = await ethers.getContractAt(
      'NodeOwner',
      RNS_NODE_OWNER,
      owner
    );

    await (
      await NodeOwnerContract.addRegistrar(partnerRegistrar.address)
    ).wait();

    console.log('new partner registrar added');

    await (await NodeOwnerContract.addRenewer(partnerRenewer.address)).wait();

    console.log('new partner renewer added');

    const defaultPartnerConfiguration =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        accessControl: accessControl.address,
        minLength: BigNumber.from(3),
        maxLength: BigNumber.from(7),
        minDuration: BigNumber.from(1),
        maxDuration: BigNumber.from(5),
        feePercentage: BigNumber.from(0),
        discount: BigNumber.from(0),
        minCommitmentAge: BigNumber.from(0),
      });
    console.log(
      'DefaultPartnerConfiguration:',
      defaultPartnerConfiguration.address
    );

    await (
      await partnerManager.addPartner(
        defaultPartner.address,
        defaultPartnerConfiguration.address
      )
    ).wait();

    console.log('default partner added');

    console.log('Writing contract addresses to file...');
    const content = {
      owner: owner.address,
      defaultPartner: defaultPartner.address,
      rnsNodeOwnerAddress: RNS_NODE_OWNER,
      rifToken: RIF_ADDRESS,
      pool: POOL,
      rns: RNS_ADDRESS,
      resolverAddress: RESOLVER_ADDRESS,
      multichainResolverAddress: MULTICHAIN_RESOLVER_ADDRESS,
      publicResolverAddress: PUBLIC_RESOLVER_ADDRESS,
      partnerRegistrar: partnerRegistrar.address,
      partnerRenewer: partnerRenewer.address,
      partnerManager: partnerManager.address,
      feeManager: feeManager.address,
      defaultPartnerConfiguration: defaultPartnerConfiguration.address,
      accessControl: accessControl.address,
    };

    fs.writeFileSync(
      './deployedMainnetAddresses.json',
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
