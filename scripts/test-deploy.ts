import { ethers } from 'hardhat';
import { Contract, BigNumber, utils } from 'ethers';
import { PartnerRegistrar } from '../typechain-types/contracts/Registrar/PartnerRegistrar';
import { FeeManager } from '../typechain-types/contracts/FeeManager/FeeManager';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';
import fs from 'fs';
import { $RNS } from 'typechain-types/contracts-exposed/RNS.sol/$RNS';
import RNSAbi from '../test/external-abis/RNS.json';
import { deployContract, Factory } from 'utils/deployment.utils';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import NodeOwnerAbi from '../test/external-abis/NodeOwner.json';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import { $Resolver } from 'typechain-types/contracts-exposed/test-utils/Resolver.sol/$Resolver';
import ResolverAbi from '../test/external-abis/ResolverV1.json';
import MultichainResolverAbi from '../test/external-abis/MultiChainResolver.json';
import NameResolverAbi from '../test/external-abis/NameResolver.json';
import ReverseSetupAbi from '../test/external-abis/ReverseSetup.json';
import { oneRBTC } from 'test/utils/mock.utils';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar';
import {
  ERC677Token,
  PartnerRegistrarProxyFactory,
  PartnerRenewer,
  PartnerRenewerProxyFactory,
} from 'typechain-types';
import { partnerManager } from 'typechain-types/contracts';

const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');
const reverseTldAsSha3 = utils.id('reverse');
const FEE_PERCENTAGE = oneRBTC.mul(25); //5%

async function main() {
  try {
    const [owner, partner, userAccount, pool] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', owner.address);

    const { contract: RNSContract } = await deployContract<$RNS>(
      'RNS',
      {},
      (await ethers.getContractFactory(
        RNSAbi.abi,
        RNSAbi.bytecode
      )) as Factory<$RNS>
    );

    console.log('RNS:', RNSContract.address);

    const { contract: NodeOwnerContract } = await deployContract<$NodeOwner>(
      'NodeOwner',
      {
        _rns: RNSContract.address,
        _rootNode: tldNode,
      },
      (await ethers.getContractFactory(
        NodeOwnerAbi.abi,
        NodeOwnerAbi.bytecode
      )) as Factory<$NodeOwner>
    );
    console.log('NodeOwner:', NodeOwnerContract.address);

    const { contract: Resolver } = await deployContract<$Resolver>(
      'ResolverV1',
      {},
      (await ethers.getContractFactory(
        ResolverAbi.abi,
        ResolverAbi.bytecode
      )) as Factory<$Resolver>
    );

    console.log('ResolverV1:', Resolver.address);

    await (await Resolver.initialize(RNSContract.address)).wait();

    const { contract: MultiChainResolver } = await deployContract<Contract>(
      'MultiChainResolver',
      {
        _rns: RNSContract.address,
        _publicResolver: Resolver.address,
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

    const { contract: PartnerManagerContract } =
      await deployContract<$PartnerManager>('$PartnerManager', {});
    console.log('PartnerManager:', PartnerManagerContract.address);

    const { contract: PartnerRegistrar } =
      await deployContract<$PartnerRegistrar>('$PartnerRegistrar', {
        nodeOwner: NodeOwnerContract.address,
        rif: RIF.address,
        partnerManager: PartnerManagerContract.address,
        rns: RNSContract.address,
        rootNode: tldNode,
      });

    console.log('PartnerRegistrar:', PartnerRegistrar.address);

    const { contract: PartnerRenewerContract } =
      await deployContract<PartnerRenewer>('PartnerRenewer', {
        nodeOwner: NodeOwnerContract.address,
        rif: RIF.address,
        partnerManager: PartnerManagerContract.address,
      });

    console.log('PartnerRenewer:', PartnerRenewerContract.address);

    const { contract: FeeManager } = await deployContract<FeeManager>(
      'FeeManager',
      {
        rif: RIF.address,
        partnerRegistrar: PartnerRegistrar.address,
        partnerRenewer: PartnerRenewerContract.address,
        partnerManager: PartnerManagerContract.address,
        pool: pool.address,
      }
    );

    console.log('FeeManager:', FeeManager.address);

    await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();

    const { contract: DefaultPartnerConfiguration } =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        minLength: BigNumber.from(5),
        maxLength: BigNumber.from(20),
        isUnicodeSupported: true,
        minDuration: BigNumber.from(1),
        maxDuration: BigNumber.from(5),
        feePercentage: FEE_PERCENTAGE,
        discount: BigNumber.from(0),
        minCommitmentAge: BigNumber.from(0),
      });

    console.log(
      'DefaultPartnerConfiguration:',
      DefaultPartnerConfiguration.address
    );

    const { contract: PartnerRegistrarContract } =
      await deployContract<PartnerRegistrar>('PartnerRegistrar', {
        nodeOwner: NodeOwnerContract.address,
        rif: RIF.address,
        partnerManager: PartnerManagerContract.address,
        rns: RNSContract.address,
        rootNode: tldNode,
      });

    const { contract: PartnerRegistrarProxyFactoryContract } =
      await deployContract<PartnerRegistrarProxyFactory>(
        'PartnerRegistrarProxyFactory',
        {
          _rif: RIF.address,
          _partnerRegistrar: PartnerRegistrarContract.address,
          _partnerRenewer: PartnerRenewerContract.address,
        }
      );

    const { contract: PartnerRenewerProxyFactoryContract } =
      await deployContract<PartnerRenewerProxyFactory>(
        'PartnerRenewerProxyFactory',
        {
          _rif: RIF.address,
          _partnerRegistrar: PartnerRegistrarContract.address,
          _partnerRenewer: PartnerRenewerContract.address,
        }
      );

    console.log(
      'PartnerRegistrarProxyFactoryContract:',
      PartnerRegistrarProxyFactoryContract.address
    );
    console.log(
      'PartnerRenewerProxyFactoryContract:',
      PartnerRenewerProxyFactoryContract.address
    );

    const FIFSADDRProxyName = 'FIFSADDR';
    await (
      await PartnerRegistrarProxyFactoryContract.createNewPartnerProxy(
        partner.address,
        FIFSADDRProxyName
      )
    ).wait();

    const FIFSADDRpartnerProxyAddress = (
      await PartnerRegistrarProxyFactoryContract.getPartnerProxy(
        partner.address,
        FIFSADDRProxyName
      )
    ).proxy;

    console.log('FIFSADDRpartnerProxyAddress:', FIFSADDRpartnerProxyAddress);

    const FIFSProxyName = 'FIFS';
    await (
      await PartnerRegistrarProxyFactoryContract.createNewPartnerProxy(
        partner.address,
        FIFSProxyName
      )
    ).wait();

    const FIFSpartnerProxyAddress = (
      await PartnerRegistrarProxyFactoryContract.getPartnerProxy(
        partner.address,
        FIFSProxyName
      )
    ).proxy;

    console.log('FIFSpartnerProxyAddress:', FIFSpartnerProxyAddress);

    const RenewerProxyName = 'Renewer';
    await PartnerRenewerProxyFactoryContract.createNewPartnerProxy(
      partner.address,
      RenewerProxyName
    );

    const RenewerProxyAddress = (
      await PartnerRenewerProxyFactoryContract.getPartnerProxy(
        partner.address,
        RenewerProxyName
      )
    ).proxy;

    console.log('RenewerProxyAddress:', RenewerProxyAddress);

    console.log('setting up contracts');

    await (
      await PartnerManagerContract.addPartner(
        FIFSADDRpartnerProxyAddress,
        partner.address
      )
    ).wait();

    console.log('partner added ', FIFSADDRpartnerProxyAddress);

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
      await RNSContract.setSubnodeOwner(
        rootNodeId,
        tldAsSha3,
        NodeOwnerContract.address
      )
    ).wait();
    console.log('rootNodeId set');
    await (
      await NodeOwnerContract.addRegistrar(PartnerRegistrar.address)
    ).wait();

    console.log('PartnerRegistrar added to nodeowner');

    await (await RNSContract.setDefaultResolver(Resolver.address)).wait();
    console.log('default resolver set');
    await (await NodeOwnerContract.setRootResolver(Resolver.address)).wait();
    console.log('node root resolver set');
    await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();
    console.log('fee manager set');
    await (
      await PartnerManagerContract.setPartnerConfiguration(
        FIFSADDRpartnerProxyAddress,
        DefaultPartnerConfiguration.address
      )
    ).wait();
    console.log('partner configuration set');
    await (await RIF.transfer(userAccount.address, oneRBTC.mul(100))).wait();

    console.log('Writing contract addresses to file...');
    const content = {
      rns: RNSContract.address,
      registrar: PartnerRegistrar.address,
      reverseRegistrar: ReverseRegistrar.address,
      publicResolver: Resolver.address,
      nameResolver: NameResolver.address,
      multiChainResolver: MultiChainResolver.address,
      rif: RIF.address,
      fifsRegistrar: FIFSpartnerProxyAddress, // TODO
      fifsAddrRegistrar: FIFSADDRpartnerProxyAddress, // TODO
      rskOwner: NodeOwnerContract.address,
      renewer: RenewerProxyAddress, // TODO
      partnerManager: PartnerManagerContract.address,
      feeManager: FeeManager.address,
      defaultPartnerConfiguration: DefaultPartnerConfiguration.address,
      demoPartnerProxyInstance: FIFSADDRpartnerProxyAddress,
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
