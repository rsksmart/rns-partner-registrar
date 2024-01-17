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
import { oneRBTC } from 'test/utils/mock.utils';
require('dotenv').config({ path: '.env.mainnet' });

console.log('Running script on env.', process.env.NODE_ENV);

const tldNode = namehash('rsk');
const ZERO_PERCENTAGE = oneRBTC.mul(0); // 0%
const FIVE_PERCENTAGE = ethers.utils.parseEther('5'); //5%
const TEN_PERCENTAGE = ethers.utils.parseEther('10'); //10%

const POOL = process.env.NEW_MULTISIG_ADDRESS; // multisig mainnet address
const NEW_MULITSIG_WALLET_ADDRESS = process.env.NEW_MULTISIG_ADDRESS;
const DEFAULT_PARTNER_ADDRESS = ''; // address of default partner, pool?

// Addresses deployed on mainnet: https://dev.rootstock.io/rif/rns/mainnet/
const RIF_ADDRESS =
  process.env.RIF_ADDRESS?.toLowerCase() ||
  '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5';
const RNS_NODE_OWNER =
  process.env.RNS_NODE_OWNER?.toLowerCase() ||
  '0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1';

const RNS_ADDRESS =
  process.env.RNS_ADDRESS?.toLowerCase() ||
  '0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5';

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
  const [owner] = await ethers.getSigners();

  //================ NEW SUITES DEPLOY ======================

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

  // =========== NEW SUITES SETUP ======================
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
      feePercentage: ZERO_PERCENTAGE,
      discount: ZERO_PERCENTAGE,
      minCommitmentAge: BigNumber.from(1),
    });
  console.log(
    'DefaultPartnerConfiguration:',
    defaultPartnerConfiguration.address
  );

  await (
    await partnerManager.addPartner(
      DEFAULT_PARTNER_ADDRESS,
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

  // ============== OWNERSHIP TRANSFER ============================
  console.log(
    `Transferring ownership of new suite contracts to the account: ${NEW_MULITSIG_WALLET_ADDRESS} from ${owner}`
  );
  await (
    await accessControl.transferOwnership(NEW_MULITSIG_WALLET_ADDRESS as string)
  ).wait();
  console.log('New suite ownership transferred');

  // =============== WRITE NEW SUITE ADDRESS TO FILE ==============
  console.log('Writing contract addresses to file...');
  const content = {
    rns: RNS_ADDRESS,
    registrar: partnerRegistrar.address.toLowerCase(),
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
        account: DEFAULT_PARTNER_ADDRESS.toLowerCase(),
        config: defaultPartnerConfiguration.address.toLowerCase(),
      },
    },
  };

  fs.writeFileSync(
    './deployedNewSuiteMainnetAddresses.json',
    JSON.stringify(content, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
