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
  process.env.RNS_NODE_OWNER?.toLowerCase() ||
  '0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1';

const RIF_ADDRESS =
  process.env.RIF_ADDRESS?.toLowerCase() ||
  '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5';

const POOL =
  process.env.POOL?.toLowerCase() ||
  '0x6cab832ec04855e67053a9509d2ad0dd25863ec7';

const RNS_ADDRESS =
  process.env.RNS_ADDRESS?.toLowerCase() ||
  '0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5';

const NAME_RESOLVER_ADDRESS =
  process.env.NAME_RESOLVER_ADDRESS?.toLowerCase() ||
  '0x4b1a11bf6723e60b9d2e02aa3ece34e24bde77d9';

const RESOLVER_ADDRESS =
  process.env.RESOLVER_ADDRESS?.toLowerCase() ||
  '0xD87f8121D44F3717d4bAdC50b24E50044f86D64B';

const MULTICHAIN_RESOLVER_ADDRESS =
  process.env.MULTICHAIN_RESOLVER_ADDRESS?.toLowerCase() ||
  '0x99a12be4C89CbF6CFD11d1F2c029904a7B644368';

const PUBLIC_RESOLVER_ADDRESS =
  process.env.PUBLIC_RESOLVER_ADDRESS?.toLowerCase() ||
  '0x4efd25e3d348f8f25a14fb7655fba6f72edfe93a';

const REVERSE_REGISTRAR_ADDRESS =
  process.env.REVERSE_REGISTRAR_ADDRESS?.toLowerCase() ||
  '0xd25c3f94a743b93ecffecbe691beea51c3c2d9d1';

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
    const [owner, defaultPartner, highLevelOperator] =
      await ethers.getSigners();

    console.log('Deploying contracts with the account:', owner.address);

    console.log('Account balance:', +(await owner.getBalance()) / 1e18, 'RBTC');

    const RNSContract = await ethers.getContractAt('RNS', RNS_ADDRESS, owner);

    const NodeOwnerContract = await ethers.getContractAt(
      'NodeOwner',
      RNS_NODE_OWNER,
      owner
    );

    console.log('Definitive Resolver:', RESOLVER_ADDRESS);

    console.log('NameResolver:', NAME_RESOLVER_ADDRESS);

    console.log('ReverseRegistrar:', REVERSE_REGISTRAR_ADDRESS);

    const accessControl = await deployContract<RegistrarAccessControl>(
      'RegistrarAccessControl'
    );
    console.log('accessControl deployed', accessControl.address);

    const partnerManager = await deployContract('PartnerManager', {
      accessControl: accessControl.address,
    });
    console.log('partnerManager deployed', partnerManager.address);

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
    console.log('partnerRegistrar deployed', partnerRegistrar.address);

    const partnerRenewer = await deployContract<PartnerRenewer>(
      'PartnerRenewer',
      {
        accessControl: accessControl.address,
        nodeOwner: RNS_NODE_OWNER,
        rif: RIF_ADDRESS,
        partnerManager: partnerManager.address,
      }
    );
    console.log('partnerRenewer deployed', partnerRenewer.address);

    const feeManager = await deployContract<FeeManager>('FeeManager', {
      rif: RIF_ADDRESS,
      pool: POOL,
      accessControl: accessControl.address,
      partnerManager: partnerManager.address,
    });
    console.log('Fee manager deployed', feeManager.address);

    await (await partnerRegistrar.setFeeManager(feeManager.address)).wait();
    console.log('Set Fee manager on partner registrar');
    await (await partnerRenewer.setFeeManager(feeManager.address)).wait();
    console.log('et Fee manager on partner renewer');

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

    await (
      await feeManager.whiteListRegistrarOrRenewer(partnerRegistrar.address)
    ).wait();

    console.log('Whitelisted Partner Registrar', partnerRegistrar.address);

    await (
      await feeManager.whiteListRegistrarOrRenewer(partnerRenewer.address)
    ).wait();

    console.log('Whitelisted Partner Renewer', partnerRenewer.address);

    if (process.env.OLD_PRIVATE_KEY) {
      const provider = new ethers.providers.JsonRpcProvider(
        'https://public-node.rsk.co'
      );
      const old_owner = new ethers.Wallet(
        process.env.OLD_PRIVATE_KEY,
        provider
      );

      const OldNodeOwner = await ethers.getContractAt(
        'NodeOwner',
        RNS_NODE_OWNER,
        old_owner
      );

      await (
        await OldNodeOwner.connect(old_owner).addRegistrar(
          partnerRegistrar.address
        )
      ).wait();

      console.log(
        'new partner registrar added to old node owner',
        partnerRegistrar.address
      );

      await (
        await OldNodeOwner.connect(old_owner).addRenewer(partnerRenewer.address)
      ).wait();

      console.log(
        'new partner renewer added to old node owner',
        partnerRenewer.address
      );
    }

    console.log('Writing contract addresses to file...');

    const content = {
      rns: RNS_ADDRESS,
      registrar: partnerRegistrar.address.toLowerCase(),
      reverseRegistrar: REVERSE_REGISTRAR_ADDRESS,
      publicResolver: PUBLIC_RESOLVER_ADDRESS,
      nameResolver: NAME_RESOLVER_ADDRESS,
      multiChainResolver: MULTICHAIN_RESOLVER_ADDRESS,
      definitiveResolver: RESOLVER_ADDRESS,
      stringResolver: '0x0000000000000000000000000000000000000000',
      rif: RIF_ADDRESS,
      fifsRegistrar: partnerRegistrar.address.toLowerCase(),
      fifsAddrRegistrar: partnerRegistrar.address.toLowerCase(),
      rskOwner: RNS_NODE_OWNER,
      renewer: partnerRenewer.address.toLowerCase(),
      partnerManager: partnerManager.address.toLowerCase(),
      feeManager: feeManager.address.toLowerCase(),
      registrarAccessControl: accessControl.address.toLowerCase(),
      partners: {
        default: {
          account: defaultPartner.address.toLowerCase(),
          config: defaultPartnerConfiguration.address.toLowerCase(),
        },
      },
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
