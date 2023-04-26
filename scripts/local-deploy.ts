import { ethers } from 'hardhat';
import { BigNumber, Contract, utils } from 'ethers';
import fs from 'fs';
import RNSAbi from '../test/external-abis/RNS.json';
import { deployContract, Factory } from 'utils/deployment.utils';
import { namehash } from 'ethers/lib/utils';
import NodeOwnerAbi from '../test/external-abis/NodeOwner.json';
import DefinitiveResolver from '../test/external-abis/ResolverV1.json';
import PublicResolver from '../test/external-abis/PublicResolver.json';
import MultichainResolverAbi from '../test/external-abis/MultiChainResolver.json';
import NameResolverAbi from '../test/external-abis/NameResolver.json';
import ReverseSetupAbi from '../test/external-abis/ReverseSetup.json';
import ReverseRegistrarJson from '../test/external-abis/ReverseRegistrar.json';
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

const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');
const reverseTldAsSha3 = utils.id('reverse');
const ZERO_FEE_PERCENTAGE = oneRBTC.mul(0); //0%
const HALF_FEE_PERCENTAGE = oneRBTC.mul(50); //50%
const HALF_DISCOUNT_PERCENTAGE = oneRBTC.mul(50); //50%

async function main() {
  try {
    const [owner, partner, iov, userAccount, pool, partnerTwo] =
      await ethers.getSigners();

    console.log('Deploying contracts with the account:', owner.address);

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

    console.log('Definitive Resolver:', DefinitiveResolverContract.address);

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

    const { contract: RIF } = await deployContract<ERC677Token>('ERC677Token', {
      beneficiary: owner.address,
      initialAmount: oneRBTC.mul(100000000000000),
      tokenName: 'ERC677',
      tokenSymbol: 'MOCKCOIN',
    });

    console.log('RIF:', RIF.address);

    const { contract: RegistrarAccessControlContract } =
      await deployContract<RegistrarAccessControl>(
        'RegistrarAccessControl',
        {}
      );
    console.log(
      'RegistrarAccessControl:',
      RegistrarAccessControlContract.address
    );

    const { contract: PartnerManagerContract } =
      await deployContract<PartnerManager>('PartnerManager', {
        accessControl: RegistrarAccessControlContract.address,
      });
    console.log('PartnerManager:', PartnerManagerContract.address);

    const { contract: PartnerRegistrarContract } =
      await deployContract<PartnerRegistrar>('PartnerRegistrar', {
        accessControl: RegistrarAccessControlContract.address,
        nodeOwner: NodeOwnerContract.address,
        rif: RIF.address,
        partnerManager: PartnerManagerContract.address,
        rns: RNSContract.address,
        rootNode: tldNode,
      });

    const { contract: PartnerRenewerContract } =
      await deployContract<PartnerRenewer>('PartnerRenewer', {
        accessControl: RegistrarAccessControlContract.address,
        nodeOwner: NodeOwnerContract.address,
        rif: RIF.address,
        partnerManager: PartnerManagerContract.address,
      });

    console.log('PartnerRegistrar:', PartnerRegistrarContract.address);

    const { contract: FeeManager } = await deployContract<FeeManager>(
      'FeeManager',
      {
        rif: RIF.address,
        partnerRegistrar: PartnerRegistrarContract.address,
        partnerRenewer: PartnerRenewerContract.address,
        partnerManager: PartnerManagerContract.address,
        pool: pool.address,
      }
    );

    console.log('FeeManager:', FeeManager.address);

    await (
      await PartnerRegistrarContract.setFeeManager(FeeManager.address)
    ).wait();
    await (
      await PartnerRenewerContract.setFeeManager(FeeManager.address)
    ).wait();

    const { contract: DefaultPartnerConfiguration } =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        accessControl: RegistrarAccessControlContract.address,
        minLength: BigNumber.from(5),
        maxLength: BigNumber.from(20),
        minDuration: BigNumber.from(1),
        maxDuration: BigNumber.from(5),
        feePercentage: ZERO_FEE_PERCENTAGE,
        discount: BigNumber.from(0),
        minCommitmentAge: 0,
      });

    console.log(
      'DefaultPartnerConfiguration:',
      DefaultPartnerConfiguration.address
    );

    const { contract: PartnerOneConfiguration } =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        accessControl: RegistrarAccessControlContract.address,
        minLength: BigNumber.from(4),
        maxLength: BigNumber.from(25),
        minDuration: BigNumber.from(3),
        maxDuration: BigNumber.from(8),
        feePercentage: ZERO_FEE_PERCENTAGE,
        discount: BigNumber.from(0),
        minCommitmentAge: 0,
      });

    console.log('PartnerOneConfiguration:', PartnerOneConfiguration.address);

    const { contract: PartnerTwoConfiguration } =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        accessControl: RegistrarAccessControlContract.address,
        minLength: BigNumber.from(3),
        maxLength: BigNumber.from(10),
        minDuration: BigNumber.from(2),
        maxDuration: BigNumber.from(7),
        feePercentage: HALF_FEE_PERCENTAGE,
        discount: HALF_DISCOUNT_PERCENTAGE,
        minCommitmentAge: 1,
      });

    console.log('PartnerTwoConfiguration:', PartnerTwoConfiguration.address);

    console.log('setting up contracts');

    await (
      await PartnerManagerContract.addPartner(
        iov.address,
        DefaultPartnerConfiguration.address
      )
    ).wait();

    await (
      await PartnerManagerContract.addPartner(
        partner.address,
        PartnerOneConfiguration.address
      )
    ).wait();

    await (
      await PartnerManagerContract.addPartner(
        partnerTwo.address,
        PartnerTwoConfiguration.address
      )
    ).wait();

    await (
      await RNSContract.setSubnodeOwner(
        rootNodeId,
        tldAsSha3,
        NodeOwnerContract.address
      )
    ).wait();

    console.log('partner added ', partner.address);

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
      await NodeOwnerContract.addRegistrar(PartnerRegistrarContract.address)
    ).wait();
    console.log('rootNodeId set');
    await (
      await NodeOwnerContract.addRenewer(PartnerRenewerContract.address)
    ).wait();

    console.log('PartnerRegistrar added to nodeowner');

    await (
      await RNSContract.setDefaultResolver(PublicResolverContract.address)
    ).wait();
    console.log('default resolver set');
    await (
      await NodeOwnerContract.setRootResolver(PublicResolverContract.address)
    ).wait();
    console.log('node root resolver set');

    await (await RIF.transfer(userAccount.address, oneRBTC.mul(100))).wait();

    console.log('Writing contract addresses to file...');
    const content = {
      rns: RNSContract.address.toLowerCase(),
      registrar: PartnerRegistrarContract.address.toLowerCase(),
      reverseRegistrar: ReverseRegistrar.address.toLowerCase(),
      publicResolver: PublicResolverContract.address.toLowerCase(),
      nameResolver: NameResolver.address.toLowerCase(),
      multiChainResolver: MultiChainResolver.address.toLowerCase(),
      definitiveResolver: DefinitiveResolverContract.address.toLowerCase(),
      // TODO: Replace with actual string resolver contract?
      stringResolver: '0x0000000000000000000000000000000000000000',
      rif: RIF.address.toLowerCase(),
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
          account: iov.address.toLowerCase(),
          config: DefaultPartnerConfiguration.address.toLowerCase(),
        },
        buenbit: {
          account: partner.address.toLowerCase(),
          config: PartnerOneConfiguration.address.toLowerCase(),
        },
        thefellowship: {
          account: partnerTwo.address.toLowerCase(),
          config: PartnerTwoConfiguration.address.toLowerCase(),
        },
      },
    };

    fs.writeFileSync(
      './deployedAddresses.json',
      JSON.stringify(content, null, 2)
    );

    console.log(
      'owner balance ',
      owner.address,
      ' ',
      (await RIF.balanceOf(owner.address)).toString()
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
