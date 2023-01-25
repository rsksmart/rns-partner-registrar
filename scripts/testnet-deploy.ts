import { ethers } from 'hardhat';
import { BigNumber, Contract, utils } from 'ethers';
import fs from 'fs';
import RNSAbi from '../test/external-abis/RNS.json';
import { deployContract, Factory } from 'utils/deployment.utils';
import { namehash } from 'ethers/lib/utils';
import NodeOwnerAbi from '../test/external-abis/NodeOwner.json';
import ResolverAbi from '../test/external-abis/ResolverV1.json';
import MultichainResolverAbi from '../test/external-abis/MultiChainResolver.json';
import NameResolverAbi from '../test/external-abis/NameResolver.json';
import ReverseSetupAbi from '../test/external-abis/ReverseSetup.json';
import { oneRBTC } from 'test/utils/mock.utils';
import {
  ERC677Token,
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
import { partnerConfiguration } from 'typechain-types/contracts';

const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');
const reverseTldAsSha3 = utils.id('reverse');
const FEE_PERCENTAGE = oneRBTC.mul(0); //0%

async function main() {
  try {
    const [owner, highLevelOperator, partner, userAccount, pool, partnerOwner] =
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

    const { contract: ResolverContract } = await deployContract<Resolver>(
      'ResolverV1',
      {},
      (await ethers.getContractFactory(
        ResolverAbi.abi,
        ResolverAbi.bytecode
      )) as Factory<Resolver>
    );

    console.log('ResolverV1:', ResolverContract.address);

    await (await ResolverContract.initialize(RNSContract.address)).wait();

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
        NameResolverAbi.abi,
        NameResolverAbi.bytecode
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

    const { contract: RIF } = await deployContract<ERC677Token>('ERC677Token', {
      beneficiary: owner.address,
      initialAmount: oneRBTC.mul(100000000000000),
      tokenName: 'ERC677',
      tokenSymbol: 'MOCKCOIN',
    });

    console.log('RIF:', RIF.address);

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
      await RNSContract.setDefaultResolver(ResolverContract.address)
    ).wait();
    console.log('default resolver set');
    await (
      await NodeOwnerContract.setRootResolver(ResolverContract.address)
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
          rif: RIF.address,
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
          rif: RIF.address,
          partnerManager: PartnerManagerContract.address,
        },
        undefined,
        highLevelOperator
      );

    console.log('PartnerRenewer:', PartnerRenewerContract.address);

    const { contract: FeeManager } = await deployContract<FeeManager>(
      'FeeManager',
      {
        rif: RIF.address,
        partnerRegistrar: PartnerRegistrarContract.address,
        partnerRenewer: PartnerRenewerContract.address,
        partnerManager: PartnerManagerContract.address,
        pool: pool.address,
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

    const { contract: DefaultPartnerConfiguration } =
      await deployContract<PartnerConfiguration>(
        'PartnerConfiguration',
        {
          accessControl: RegistrarAccessControlContract.address,
          minLength: BigNumber.from(5),
          maxLength: BigNumber.from(20),
          isUnicodeSupported: true,
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

    console.log('******* setting up new suite contracts contracts *********');

    await (
      await NodeOwnerContract.addRegistrar(PartnerRegistrarContract.address)
    ).wait();

    console.log('new partner registrar added');

    await (
      await NodeOwnerContract.addRenewer(PartnerRenewerContract.address)
    ).wait();

    console.log('new partner renewer added');

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
      rns: RNSContract.address,
      registrar: PartnerRegistrarContract.address,
      reverseRegistrar: ReverseRegistrar.address,
      publicResolver: ResolverContract.address,
      nameResolver: NameResolver.address,
      rif: RIF.address,
      fifsRegistrar: PartnerRegistrarContract.address,
      fifsAddrRegistrar: PartnerRegistrarContract.address,
      rskOwner: NodeOwnerContract.address,
      renewer: PartnerRenewerContract.address,
      partnerManager: PartnerManagerContract.address,
      feeManager: FeeManager.address,
      defaultPartnerConfiguration: DefaultPartnerConfiguration.address,
      registrarAccessControl: RegistrarAccessControlContract.address,
    };

    fs.writeFileSync(
      './testnetDeployedAddresses.json',
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
