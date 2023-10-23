import { ethers } from 'hardhat';
import { BigNumber, Contract, utils } from 'ethers';
import fs from 'fs';
import RNSAbi from '../test/external-abis/RNS.json';
import { deployContract, Factory } from 'utils/deployment.utils';
import { namehash } from 'ethers/lib/utils';
import NodeOwnerAbi from '../test/external-abis/NodeOwner.json';
import DefinitiveResolver from '../test/external-abis/ResolverV1.json';
import PublicResolver from '../test/external-abis/PublicResolver.json';
import NameResolverAbi from '../test/external-abis/NameResolver.json';
import ReverseSetupAbi from '../test/external-abis/ReverseSetup.json';
import MultichainResolverAbi from '../test/external-abis/MultiChainResolver.json';
import ReverseRegistrarJson from '../test/external-abis/ReverseRegistrar.json';
import { oneRBTC } from 'test/utils/mock.utils';
import {
  FeeManager,
  NodeOwner,
  PartnerConfiguration,
  PartnerManager,
  PartnerRegistrar,
  PartnerRenewer,
  Resolver,
  RNS,
  RegistrarAccessControl,
} from 'typechain-types';
require('dotenv').config({ path: '.env.testnet' });

console.log('Running script on env.', process.env.NODE_ENV);

const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');
const reverseTldAsSha3 = utils.id('reverse');
const FEE_PERCENTAGE = oneRBTC.mul(0); //0%
const POOL_ADDRESS = '0xcd32d5b7c2e1790029d3106d9f8347f42a3dfd60'; // multisig testnet address

// TODO: define tRIF address
const tRIF_ADDRESS =
  process.env.tRIF_ADDRESS || '0x19F64674D8A5B4E652319F5e239eFd3bc969A1fE';

async function main() {
  try {
    const [owner, highLevelOperator, defaultPartner] =
      await ethers.getSigners();

    /* ********** RNS OLD SUITE DEPLOY STARTS HERE ********** */

    console.log(
      'Deploying old suite contracts with the account:',
      owner.address
    );

    const { contract: RNSContract } = await deployContract<RNS>(
      'RNS',
      {},
      (await ethers.getContractFactory(
        RNSAbi.abi,
        RNSAbi.bytecode
      )) as Factory<RNS>
    );
    console.log('RNS:', RNSContract.address);

    const { contract: NodeOwnerContract } = await deployContract<NodeOwner>(
      'NodeOwner',
      {
        _rns: RNSContract.address,
        _rootNode: tldNode,
      },
      (await ethers.getContractFactory(
        NodeOwnerAbi.abi,
        NodeOwnerAbi.bytecode
      )) as Factory<NodeOwner>
    );

    console.log('NodeOwner:', NodeOwnerContract.address);

    const { contract: DefinitiveResolverContract } =
      await deployContract<Resolver>(
        'ResolverV1',
        {},
        (await ethers.getContractFactory(
          DefinitiveResolver.abi,
          DefinitiveResolver.bytecode
        )) as Factory<Resolver>
      );

    console.log(
      'DefinitiveResolverContract:',
      DefinitiveResolverContract.address
    );

    await (
      await DefinitiveResolverContract.initialize(RNSContract.address)
    ).wait();

    const { contract: PublicResolverContract } = await deployContract<Resolver>(
      'PublicResolver',
      {
        _rns: RNSContract.address,
      },
      (await ethers.getContractFactory(
        PublicResolver.abi,
        PublicResolver.bytecode
      )) as Factory<Resolver>
    );

    console.log('Public Resolver:', PublicResolverContract.address);

    const { contract: MultiChainResolver } = await deployContract<Contract>(
      'MultiChainResolver',
      {
        _rns: RNSContract.address,
        _publicResolver: PublicResolverContract.address,
      },
      (await ethers.getContractFactory(
        MultichainResolverAbi.abi,
        MultichainResolverAbi.bytecode
      )) as Factory<Contract>
    );

    console.log('MultiChainResolver:', MultiChainResolver.address);

    const { contract: NameResolver } = await deployContract<Contract>(
      'NameResolver',
      {
        _rns: RNSContract.address,
      },
      (await ethers.getContractFactory(
        NameResolverAbi.abi,
        NameResolverAbi.bytecode
      )) as Factory<Contract>
    );

    console.log('NameResolver:', NameResolver.address);

    const { contract: ReverseRegistrar } = await deployContract<Contract>(
      'ReverseRegistrar',
      {
        _rns: RNSContract.address,
      },
      (await ethers.getContractFactory(
        ReverseRegistrarJson.abi,
        ReverseRegistrarJson.bytecode
      )) as Factory<Contract>
    );

    console.log('ReverseRegistrar:', ReverseRegistrar.address);

    const { contract: ReverseSetup } = await deployContract<Contract>(
      'ReverseSetup',
      {
        _rns: RNSContract.address,
        _nameResolver: NameResolver.address,
        _reverseRegistrar: ReverseRegistrar.address,
        _from: owner.address,
      },
      (await ethers.getContractFactory(
        ReverseSetupAbi.abi,
        ReverseSetupAbi.bytecode
      )) as Factory<Contract>
    );

    console.log('ReverseSetup:', ReverseSetup.address);

    console.log('******* setting up old suite contracts contracts *********');

    await (
      await RNSContract.setSubnodeOwner(
        rootNodeId,
        tldAsSha3,
        NodeOwnerContract.address
      )
    ).wait();

    await (
      await RNSContract.setSubnodeOwner(
        rootNodeId,
        reverseTldAsSha3,
        ReverseSetup.address
      )
    ).wait();

    console.log('reverse tld set');

    await (await ReverseSetup.run()).wait();

    console.log('reverse run');

    await (
      await RNSContract.setDefaultResolver(PublicResolverContract.address)
    ).wait();
    console.log('default resolver set');
    await (
      await NodeOwnerContract.setRootResolver(PublicResolverContract.address)
    ).wait();
    console.log('node root resolver set');

    /* ********** RNS OLD SUITE DEPLOY ENDS HERE ********** */

    /* ********** RNS NEW SUITE DEPLOY STARTS HERE ********** */
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
        partnerRegistrar: PartnerRegistrarContract.address,
        partnerRenewer: PartnerRenewerContract.address,
        partnerManager: PartnerManagerContract.address,
        pool: POOL_ADDRESS,
      },
      undefined,
      highLevelOperator
    );

    console.log('FeeManager:', FeeManager.address);

    await (
      await PartnerRegistrarContract.setFeeManager(FeeManager.address)
    ).wait();
    await (
      await PartnerRenewerContract.setFeeManager(FeeManager.address)
    ).wait();

    console.log('******* setting up new suite contracts contracts *********');

    await (
      await NodeOwnerContract.addRegistrar(PartnerRegistrarContract.address)
    ).wait();

    console.log('new partner registrar added');

    await (
      await NodeOwnerContract.addRenewer(PartnerRenewerContract.address)
    ).wait();

    console.log('new partner renewer added');

    // create and add default Partner
    console.log('adding default partner');

    const { contract: DefaultPartnerConfiguration } =
      await deployContract<PartnerConfiguration>(
        'PartnerConfiguration',
        {
          accessControl: RegistrarAccessControlContract.address,
          minLength: BigNumber.from(5),
          maxLength: BigNumber.from(20),
          minDuration: BigNumber.from(1),
          maxDuration: BigNumber.from(5),
          feePercentage: FEE_PERCENTAGE,
          discount: BigNumber.from(0),
          minCommitmentAge: 0,
        },
        undefined,
        highLevelOperator
      );

    console.log(
      'DefaultPartnerConfiguration:',
      DefaultPartnerConfiguration.address
    );

    await (
      await PartnerManagerContract.addPartner(
        defaultPartner.address,
        DefaultPartnerConfiguration.address
      )
    ).wait();

    console.log('default partner added');

    // Ownership transfer
    console.log(
      `Transferring ownership of new suite contracts to the account: ${owner.address} from ${highLevelOperator.address}`
    );
    await (
      await RegistrarAccessControlContract.transferOwnership(owner.address)
    ).wait();

    console.log('New suite ownership transferred');

    /* ********** RNS NEW SUITE DEPLOY ENDS HERE ********** */

    console.log('Writing contract addresses to file...');
    const content = {
      rns: RNSContract.address.toLowerCase(),
      registrar: PartnerRegistrarContract.address.toLowerCase(),
      reverseRegistrar: ReverseRegistrar.address.toLowerCase(),
      publicResolver: PublicResolverContract.address.toLowerCase(),
      nameResolver: NameResolver.address.toLowerCase(),
      multiChainResolver: MultiChainResolver.address.toLowerCase(),
      definitiveResolver: DefinitiveResolverContract.address.toLowerCase(),
      stringResolver: '0x0000000000000000000000000000000000000000',
      rif: tRIF_ADDRESS.toLowerCase(),
      fifsRegistrar: PartnerRegistrarContract.address.toLowerCase(),
      fifsAddrRegistrar: PartnerRegistrarContract.address.toLowerCase(),
      rskOwner: NodeOwnerContract.address.toLowerCase(),
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
      },
    };

    fs.writeFileSync(
      './deployedTestnetAddresses.json',
      JSON.stringify(content, null, 2)
    );

    console.log('Script successfully executed!');
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
