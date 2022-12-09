import { ethers } from 'hardhat';
import { BigNumber, utils } from 'ethers';
import { FeeManager } from '../typechain-types/contracts/FeeManager/FeeManager';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';
import fs from 'fs';
import RNSAbi from '../test/external-abis/RNS.json';
import { deployContract, Factory } from 'utils/deployment.utils';
import { namehash } from 'ethers/lib/utils';
import NodeOwnerAbi from '../test/external-abis/NodeOwner.json';
import ResolverAbi from '../test/external-abis/ResolverV1.json';
import { oneRBTC } from 'test/utils/mock.utils';
import {
  ERC677Token,
  NodeOwner,
  PartnerManager,
  PartnerRegistrar,
  PartnerRegistrarProxy,
  PartnerRegistrarProxyFactory,
  PartnerRenewer,
  PartnerRenewerProxy,
  PartnerRenewerProxyFactory,
  Resolver,
  RNS,
} from 'typechain-types';

const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');
const FEE_PERCENTAGE = oneRBTC.mul(25); //5%

async function main() {
  try {
    const [owner, partner, userAccount, pool] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', owner.address);

    const { contract: RNSContract } = await deployContract<RNS>(
      'RNS',
      {},
      (await ethers.getContractFactory(
        RNSAbi.abi,
        RNSAbi.bytecode
      )) as Factory<RNS>
    );

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

    const { contract: ResolverContract } = await deployContract<Resolver>(
      'ResolverV1',
      {},
      (await ethers.getContractFactory(
        ResolverAbi.abi,
        ResolverAbi.bytecode
      )) as Factory<Resolver>
    );

    await (await ResolverContract.initialize(RNSContract.address)).wait();

    const { contract: RIF } = await deployContract<ERC677Token>('ERC677Token', {
      beneficiary: owner.address,
      initialAmount: oneRBTC.mul(100000000000000),
      tokenName: 'ERC677',
      tokenSymbol: 'MOCKCOIN',
    });

    const { contract: PartnerManagerContract } =
      await deployContract<PartnerManager>('PartnerManager', {});

    const { contract: PartnerRegistrarContract } =
      await deployContract<PartnerRegistrar>('PartnerRegistrar', {
        nodeOwner: NodeOwnerContract.address,
        rif: RIF.address,
        partnerManager: PartnerManagerContract.address,
        rns: RNSContract.address,
        rootNode: tldNode,
      });

    const { contract: PartnerRenewerContract } =
      await deployContract<PartnerRenewer>('PartnerRenewer', {
        nodeOwner: NodeOwnerContract.address,
        rif: RIF.address,
        partnerManager: PartnerManagerContract.address,
      });

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

    await (
      await PartnerRegistrarContract.setFeeManager(FeeManager.address)
    ).wait();
    await (
      await PartnerRenewerContract.setFeeManager(FeeManager.address)
    ).wait();

    const { contract: DefaultPartnerConfiguration } =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        minLength: BigNumber.from(5),
        maxLength: BigNumber.from(20),
        isUnicodeSupported: true,
        minDuration: BigNumber.from(1),
        maxDuration: BigNumber.from(5),
        feePercentage: FEE_PERCENTAGE,
        discount: BigNumber.from(0),
        minCommittmentAge: BigNumber.from(0),
      });

    const { contract: MasterRegistrarProxyContract } =
      await deployContract<PartnerRegistrarProxy>('PartnerRegistrarProxy', {});

    const { contract: MasterRenewerProxyContract } =
      await deployContract<PartnerRenewerProxy>('PartnerRenewerProxy', {});

    const { contract: PartnerRegistrarProxyFactoryContract } =
      await deployContract<PartnerRegistrarProxyFactory>(
        'PartnerRegistrarProxyFactory',
        {
          _masterProxy: MasterRegistrarProxyContract.address,
          _rif: RIF.address,
        }
      );

    const { contract: PartnerRenewerProxyFactoryContract } =
      await deployContract<PartnerRenewerProxyFactory>(
        'PartnerRenewerProxyFactory',
        {
          _masterProxy: MasterRenewerProxyContract.address,
          _rif: RIF.address,
        }
      );

    const FIFSADDRProxyName = 'FIFSADDR';
    await (
      await PartnerRegistrarProxyFactoryContract.createNewPartnerProxy(
        partner.address,
        FIFSADDRProxyName,
        PartnerRegistrarContract.address
      )
    ).wait();

    const FIFSADDRpartnerProxyAddress = (
      await PartnerRegistrarProxyFactoryContract.getPartnerProxy(
        partner.address,
        FIFSADDRProxyName
      )
    ).proxy;

    const FIFSProxyName = 'FIFS';
    await (
      await PartnerRegistrarProxyFactoryContract.createNewPartnerProxy(
        partner.address,
        FIFSProxyName,
        PartnerRegistrarContract.address
      )
    ).wait();

    const FIFSPartnerProxyAddress =
      await PartnerRegistrarProxyFactoryContract.getPartnerProxy(
        partner.address,
        FIFSProxyName
      );

    const RenewerProxyName = 'Renewer';
    await PartnerRenewerProxyFactoryContract.createNewPartnerProxy(
      partner.address,
      RenewerProxyName,
      PartnerRegistrarContract.address,
      PartnerRenewerContract.address
    );

    const RenewerProxyAddress = (
      await PartnerRenewerProxyFactoryContract.getPartnerProxy(
        partner.address,
        RenewerProxyName
      )
    ).proxy;

    console.log('setting up contracts');

    await (
      await PartnerManagerContract.addPartner(FIFSADDRpartnerProxyAddress)
    ).wait();
    await (await PartnerManagerContract.addPartner(RenewerProxyAddress)).wait();

    await (
      await RNSContract.setSubnodeOwner(
        rootNodeId,
        tldAsSha3,
        NodeOwnerContract.address
      )
    ).wait();

    await (
      await NodeOwnerContract.addRegistrar(PartnerRegistrarContract.address)
    ).wait();

    await (
      await NodeOwnerContract.addRenewer(PartnerRenewerContract.address)
    ).wait();

    await (
      await RNSContract.setDefaultResolver(ResolverContract.address)
    ).wait();

    await (
      await NodeOwnerContract.setRootResolver(ResolverContract.address)
    ).wait();

    await (
      await PartnerRegistrarContract.setFeeManager(FeeManager.address)
    ).wait();

    await (
      await PartnerManagerContract.setPartnerConfiguration(
        FIFSADDRpartnerProxyAddress,
        DefaultPartnerConfiguration.address
      )
    ).wait();

    await (await RIF.transfer(userAccount.address, oneRBTC.mul(10))).wait();

    console.log('Writing contract addresses to file...');
    const content = {
      rns: RNSContract.address,
      registrar: PartnerRegistrarContract.address,
      reverseRegistrar: PartnerRegistrarContract.address, // TODO
      publicResolver: ResolverContract.address,
      nameResolver: ResolverContract.address, // TODO
      multiChainResolver: ResolverContract.address, // TODO
      rif: RIF.address,
      fifsRegistrar: FIFSPartnerProxyAddress, // TODO
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
