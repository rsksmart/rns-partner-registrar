import { ethers } from 'hardhat';
import { Contract, BigNumber, utils } from 'ethers';
import { PartnerRegistrar } from '../typechain-types/contracts/Registrar/PartnerRegistrar';
import { FeeManager } from '../typechain-types/contracts/FeeManager/FeeManager';
import { PartnerConfiguration } from '../typechain-types/contracts/PartnerConfiguration/PartnerConfiguration';
import fs from 'fs';
import { $RNS } from 'typechain-types/contracts-exposed/RNS.sol/$RNS';
import RNSAbi from '../test/external-abis/RNS.json';
import { deployContract, Factory } from 'utils/deployment.utils';
import { namehash } from 'ethers/lib/utils';
import NodeOwnerAbi from '../test/external-abis/NodeOwner.json';
import { $NodeOwner } from 'typechain-types/contracts-exposed/NodeOwner.sol/$NodeOwner';
import { $Resolver } from 'typechain-types/contracts-exposed/test-utils/Resolver.sol/$Resolver';
import ResolverAbi from '../test/external-abis/ResolverV1.json';
import { oneRBTC } from 'test/utils/mock.utils';
import { $PartnerManager } from 'typechain-types/contracts-exposed/PartnerManager/PartnerManager.sol/$PartnerManager';
import { ERC677 } from 'typechain-types';
import { $PartnerRegistrar } from 'typechain-types/contracts-exposed/Registrar/PartnerRegistrar.sol/$PartnerRegistrar';

const rootNodeId = ethers.constants.HashZero;
const tldNode = namehash('rsk');
const tldAsSha3 = utils.id('rsk');

// TODO: Define POOL address
const POOL = '0x39e00d2616e792f50ddd33bbe46e8bf55eadebee';

async function main() {
  try {
    const [owner, partner] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', owner.address);

    console.log('Account balance:', (await owner.getBalance()).toString());

    const { contract: RNS } = await deployContract<$RNS>(
      'RNS',
      {},
      (await ethers.getContractFactory(
        RNSAbi.abi,
        RNSAbi.bytecode
      )) as Factory<$RNS>
    );

    const { contract: NodeOwner } = await deployContract<$NodeOwner>(
      'NodeOwner',
      {
        _rns: RNS.address,
        _rootNode: tldNode,
      },
      (await ethers.getContractFactory(
        NodeOwnerAbi.abi,
        NodeOwnerAbi.bytecode
      )) as Factory<$NodeOwner>
    );

    const { contract: Resolver } = await deployContract<$Resolver>(
      'ResolverV1',
      {},
      (await ethers.getContractFactory(
        ResolverAbi.abi,
        ResolverAbi.bytecode
      )) as Factory<$Resolver>
    );

    await (await Resolver.initialize(RNS.address)).wait();

    const { contract: RIF } = await deployContract<ERC677>('ERC677', {
      beneficiary: owner.address,
      initialAmount: oneRBTC.mul(100000000000000),
      tokenName: 'ERC677',
      tokenSymbol: 'MOCKCOIN',
    });

    const { contract: PartnerManager } = await deployContract<$PartnerManager>(
      '$PartnerManager',
      {}
    );

    const { contract: PartnerRegistrar } =
      await deployContract<$PartnerRegistrar>('$PartnerRegistrar', {
        nodeOwner: NodeOwner.address,
        rif: RIF.address,
        partnerManager: PartnerManager.address,
        rns: RNS.address,
        rootNode: tldNode,
      });

    const { contract: FeeManager } = await deployContract<FeeManager>(
      'FeeManager',
      {
        rif: RIF.address,
        partnerRegistrar: PartnerRegistrar.address,
        partnerManager: PartnerManager.address,
        pool: POOL,
      }
    );

    await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();

    const { contract: DefaultPartnerConfiguration } =
      await deployContract<PartnerConfiguration>('PartnerConfiguration', {
        minLength: BigNumber.from(3),
        maxLength: BigNumber.from(0),
        isUnicodeSupported: false,
        minDuration: BigNumber.from(0),
        maxDuration: BigNumber.from(0),
        feePercentage: BigNumber.from(10),
        discount: BigNumber.from(0),
        minCommittmentAge: BigNumber.from(0),
      });

    console.log('setting up contracts');

    await (
      await RNS.setSubnodeOwner(rootNodeId, tldAsSha3, NodeOwner.address)
    ).wait();

    await (await NodeOwner.addRegistrar(PartnerRegistrar.address)).wait();

    await (await RNS.setDefaultResolver(Resolver.address)).wait();

    await (await NodeOwner.setRootResolver(Resolver.address)).wait();

    await (await PartnerRegistrar.setFeeManager(FeeManager.address)).wait();

    await (await PartnerManager.addPartner(partner.address)).wait();
    await (
      await PartnerManager.setPartnerConfiguration(
        partner.address,
        DefaultPartnerConfiguration.address
      )
    ).wait();

    await (await RIF.transfer(partner.address, oneRBTC.mul(10))).wait();

    console.log('Writing contract addresses to file...');
    const content = {
      rns: RNS.address,
      registrar: PartnerRegistrar.address,
      reverseRegistrar: PartnerRegistrar.address, // TODO
      publicResolver: Resolver.address,
      nameResolver: Resolver.address, // TODO
      multiChainResolver: Resolver.address, // TODO
      rif: RIF.address,
      fifsRegistrar: PartnerRegistrar.address, // TODO
      fifsAddrRegistrar: PartnerRegistrar.address, // TODO
      rskOwner: NodeOwner.address,
      renewer: Resolver.address, // TODO
      partnerManager: PartnerRegistrar.address,
      feeManager: PartnerRegistrar.address,
      defaultPartnerConfiguration: DefaultPartnerConfiguration.address,
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
