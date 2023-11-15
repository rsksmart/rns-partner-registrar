import { ethers } from 'hardhat';
import { BigNumber, utils } from 'ethers';
import fs from 'fs';
import { deployContract } from 'utils/deployment.utils';
import { namehash } from 'ethers/lib/utils';
import { oneRBTC } from 'test/utils/mock.utils';
import {
  FeeManager,
  PartnerConfiguration,
  PartnerManager,
  PartnerRegistrar,
  PartnerRenewer,
  RegistrarAccessControl,
} from 'typechain-types';
require('dotenv').config({ path: '.env.testnet' });

console.log('Running script on env.', process.env.NODE_ENV);

const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');
const reverseTldAsSha3 = utils.id('reverse');
const ZERO_PERCENTAGE = oneRBTC.mul(0); // 0%
const FIVE_PERCENTAGE = ethers.utils.parseEther('0.05'); // 5%
const TEN_PERCENTAGE = ethers.utils.parseEther('0.1'); // 10%
const POOL_ADDRESS = '0xcd32d5b7c2e1790029d3106d9f8347f42a3dfd60'; // multisig testnet address

// Addresses deployed on testnet: https://dev.rootstock.io/rif/rns/testnet/
const RNS_NODE_OWNER =
  process.env.RNS_NODE_OWNER?.toLowerCase() ||
  '0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71';

const tRIF_ADDRESS =
  process.env.RIF_ADDRESS?.toLowerCase() ||
  '0x19f64674d8a5b4e652319f5e239efd3bc969a1fe';

const POOL = process.env.POOL?.toLowerCase() || POOL_ADDRESS;

const RNS_ADDRESS =
  process.env.RNS_ADDRESS?.toLowerCase() ||
  '0x7d284aaac6e925aad802a53c0c69efe3764597b8';

const NAME_RESOLVER_ADDRESS =
  process.env.NAME_RESOLVER_ADDRESS?.toLowerCase() ||
  '0x8587385ad60038bB181aFfDF687c4D1B80C4787e';

const RESOLVER_ADDRESS =
  process.env.RESOLVER_ADDRESS?.toLowerCase() ||
  '0x25c289cccfff700c6a38722f4913924fe504de0e';

const MULTICHAIN_RESOLVER_ADDRESS =
  process.env.MULTICHAIN_RESOLVER_ADDRESS?.toLowerCase() ||
  '0x404308f2a2eec2cdc3cb53d7d295af11c903414e';

const PUBLIC_RESOLVER_ADDRESS =
  process.env.PUBLIC_RESOLVER_ADDRESS?.toLowerCase() ||
  '0x1e7ae43e3503efb886104ace36051ea72b301cdf';

const REVERSE_REGISTRAR_ADDRESS =
  process.env.REVERSE_REGISTRAR_ADDRESS?.toLowerCase() ||
  '0xc1cb803d5169e0a9894bf0f8dcdf83090999842a';

async function main() {
  try {
    const [owner, highLevelOperator, defaultPartner, alternatePartner, pool] =
      await ethers.getSigners();

    /* ********** RNS OLD SUITE DEPLOY STARTS HERE ********** */

    console.log(
      'Deploying old suite contracts with the account:',
      owner.address
    );

    const RNSContract = await ethers.getContractAt('RNS', RNS_ADDRESS, owner);

    const NodeOwnerContract = await ethers.getContractAt(
      'NodeOwner',
      RNS_NODE_OWNER,
      owner
    );

    /* ********** RNS OLD SUITE DEPLOY ENDS HERE ********** */

    /* ********** RNS NEW SUITE DEPLOY STARTS HERE ********** */

    console.log('Definitive Resolver:', RESOLVER_ADDRESS);

    console.log('NameResolver:', NAME_RESOLVER_ADDRESS);

    console.log('ReverseRegistrar:', REVERSE_REGISTRAR_ADDRESS);

    console.log(
      'Deploying new suite contracts with the account:',
      highLevelOperator.address
    );

    const { contract: RegistrarAccessControlContract } =
      await deployContract<RegistrarAccessControl>(
        'RegistrarAccessControl',
        {},
        undefined,
        highLevelOperator
      );
    console.log(
      'RegistrarAccessControl:',
      RegistrarAccessControlContract.address
    );

    const { contract: PartnerManagerContract } =
      await deployContract<PartnerManager>(
        'PartnerManager',
        {
          accessControl: RegistrarAccessControlContract.address,
        },
        undefined,
        highLevelOperator
      );
    console.log('PartnerManager:', PartnerManagerContract.address);

    const { contract: PartnerRegistrarContract } =
      await deployContract<PartnerRegistrar>(
        'PartnerRegistrar',
        {
          accessControl: RegistrarAccessControlContract.address,
          nodeOwner: NodeOwnerContract.address,
          rif: tRIF_ADDRESS,
          partnerManager: PartnerManagerContract.address,
          rns: RNSContract.address,
          rootNode: tldNode,
        },
        undefined,
        highLevelOperator
      );

    console.log('PartnerRegistrar:', PartnerRegistrarContract.address);

    const { contract: PartnerRenewerContract } =
      await deployContract<PartnerRenewer>(
        'PartnerRenewer',
        {
          accessControl: RegistrarAccessControlContract.address,
          nodeOwner: NodeOwnerContract.address,
          rif: tRIF_ADDRESS,
          partnerManager: PartnerManagerContract.address,
        },
        undefined,
        highLevelOperator
      );

    console.log('PartnerRenewer:', PartnerRenewerContract.address);

    const { contract: FeeManager } = await deployContract<FeeManager>(
      'FeeManager',
      {
        rif: tRIF_ADDRESS,
        pool: POOL || pool.address,
        accessControl: RegistrarAccessControlContract.address,
        partnerManager: PartnerManagerContract.address,
      },
      undefined,
      highLevelOperator
    );

    console.log('FeeManager:', FeeManager.address);

    await (
      await PartnerRegistrarContract.setFeeManager(FeeManager.address)
    ).wait();

    console.log('Registrar set FeeManager', FeeManager.address);

    await (
      await PartnerRenewerContract.setFeeManager(FeeManager.address)
    ).wait();

    console.log('Renewer set FeeManager', FeeManager.address);

    console.log('******* setting up new suite contracts contracts *********');

    const { contract: DefaultPartnerConfiguration } =
      await deployContract<PartnerConfiguration>(
        'PartnerConfiguration',
        {
          accessControl: RegistrarAccessControlContract.address,
          minLength: BigNumber.from(5),
          maxLength: BigNumber.from(20),
          minDuration: BigNumber.from(1),
          maxDuration: BigNumber.from(5),
          feePercentage: ZERO_PERCENTAGE,
          discount: ZERO_PERCENTAGE,
          minCommitmentAge: 0,
        },
        undefined,
        highLevelOperator
      );

    console.log(
      'DefaultPartnerConfiguration:',
      DefaultPartnerConfiguration.address
    );

    const { contract: AlternatePartnerConfiguration } =
      await deployContract<PartnerConfiguration>(
        'PartnerConfiguration',
        {
          accessControl: RegistrarAccessControlContract.address,
          minLength: BigNumber.from(5),
          maxLength: BigNumber.from(20),
          minDuration: BigNumber.from(1),
          maxDuration: BigNumber.from(5),
          feePercentage: FIVE_PERCENTAGE,
          discount: TEN_PERCENTAGE,
          minCommitmentAge: 0,
        },
        undefined,
        highLevelOperator
      );

    console.log(
      'AlternatePartnerConfiguration:',
      AlternatePartnerConfiguration.address
    );

    await (
      await PartnerManagerContract.addPartner(
        defaultPartner.address,
        DefaultPartnerConfiguration.address
      )
    ).wait();

    console.log('default partner added', defaultPartner.address);

    await (
      await PartnerManagerContract.addPartner(
        alternatePartner.address,
        AlternatePartnerConfiguration.address
      )
    ).wait();

    console.log('Alternate partner added', alternatePartner.address);

    await (
      await FeeManager.connect(highLevelOperator).whiteListRegistrarOrRenewer(
        PartnerRegistrarContract.address
      )
    ).wait();

    console.log(
      'Whitelisted Partner Registrar',
      PartnerRegistrarContract.address
    );

    await (
      await FeeManager.connect(highLevelOperator).whiteListRegistrarOrRenewer(
        PartnerRenewerContract.address
      )
    ).wait();

    console.log('Whitelisted Partner Renewer', PartnerRenewerContract.address);

    // Ownership transfer
    console.log(
      `Transferring ownership of new suite contracts to the account: ${owner.address} from ${highLevelOperator.address}`
    );
    await (
      await RegistrarAccessControlContract.connect(
        highLevelOperator
      ).transferOwnership(owner.address)
    ).wait();

    console.log('New suite ownership transferred');

    if (process.env.OLD_PRIVATE_KEY) {
      const provider = new ethers.providers.JsonRpcProvider(
        'https://public-node.testnet.rsk.co'
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
          PartnerRegistrarContract.address
        )
      ).wait();

      console.log(
        'new partner registrar added to old node owner',
        PartnerRegistrarContract.address
      );

      await (
        await OldNodeOwner.connect(old_owner).addRenewer(
          PartnerRenewerContract.address
        )
      ).wait();

      console.log(
        'new partner renewer added to old node owner',
        PartnerRenewerContract.address
      );
    }
    /* ********** RNS NEW SUITE DEPLOY ENDS HERE ********** */

    console.log('Writing contract addresses to file...');
    const content = {
      rns: RNS_ADDRESS,
      registrar: PartnerRegistrarContract.address.toLowerCase(),
      reverseRegistrar: REVERSE_REGISTRAR_ADDRESS,
      publicResolver: PUBLIC_RESOLVER_ADDRESS,
      nameResolver: NAME_RESOLVER_ADDRESS,
      multiChainResolver: MULTICHAIN_RESOLVER_ADDRESS,
      definitiveResolver: RESOLVER_ADDRESS,
      stringResolver: '0x0000000000000000000000000000000000000000',
      rif: tRIF_ADDRESS,
      fifsRegistrar: PartnerRegistrarContract.address.toLowerCase(),
      fifsAddrRegistrar: PartnerRegistrarContract.address.toLowerCase(),
      rskOwner: RNS_NODE_OWNER,
      renewer: PartnerRenewerContract.address.toLowerCase(),
      partnerManager: PartnerManagerContract.address.toLowerCase(),
      feeManager: FeeManager.address.toLowerCase(),
      registrarAccessControl:
        RegistrarAccessControlContract.address.toLowerCase(),
      partners: {
        default: {
          account: defaultPartner.address.toLowerCase(),
          config: DefaultPartnerConfiguration.address.toLowerCase(),
        },
        thefellowship: {
          account: alternatePartner.address.toLowerCase(),
          config: AlternatePartnerConfiguration.address.toLowerCase(),
        },
      },
    };

    fs.writeFileSync(
      './deployedTestnetAddresses.json',
      JSON.stringify(content, null, 2)
    );

    console.log('Done.');
  } catch (error) {
    throw error;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
