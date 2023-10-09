import { ethers } from 'hardhat';
import { keccak256, namehash, toUtf8Bytes } from 'ethers/lib/utils';
import { getAddrRegisterData, hashName } from 'test/utils/mock.utils';
import PublicResolver from '../test/external-abis/PublicResolver.json';
import { Factory } from 'utils/deployment.utils';
import { Resolver } from 'typechain-types';

async function main() {
  try {
    const registrarAddress = '0xffa7ca1aeeebbc30c874d32c7e22f052bbea0429';
    const [owner, partner, dos, userAccount, pool, another, another2] =
      await ethers.getSigners();
    const factory = await ethers.getContractFactory('PartnerRegistrar');
    const registrar = factory.attach(registrarAddress);

    const riffactory = await ethers.getContractFactory('ERC677Token');
    const RIF = riffactory.attach('0x276c216d241856199a83bf27b2286659e5b877d3');

    const ResolverFactory = (await ethers.getContractFactory(
      PublicResolver.abi,
      PublicResolver.bytecode
    )) as Factory<Resolver>;

    const Resolver = ResolverFactory.attach(
      '0xd0141e899a65c95a556fe2b27e5982a6de7fdd7a'
    );

    const SECRET = keccak256(toUtf8Bytes('test'));
    const duration = ethers.BigNumber.from('1');
    const domainName = 'cheta';
    const partnerAddress = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
    const data = getAddrRegisterData(
      domainName,
      userAccount.address,
      SECRET,
      duration,
      userAccount.address,
      partnerAddress
    );

    const RIFAsRegularUser = RIF.connect(userAccount);
    const PartnerRegistrarAsRegularUser = registrar.connect(userAccount);
    const NameWithLettersOnlyHashed = hashName(domainName);
    const currentNamePrice = await PartnerRegistrarAsRegularUser.price(
      NameWithLettersOnlyHashed,
      0,
      duration,
      partnerAddress
    ); // Contract Execution

    console.log(
      'balance: ',
      +(await RIFAsRegularUser.balanceOf(userAccount.address))
    );
    // await (
    //   await RIFAsRegularUser.approve(registrarAddress, currentNamePrice)
    // ).wait(); // Contract Execution

    // const tx = await (
    //   await PartnerRegistrarAsRegularUser.register(
    //     domainName,
    //     userAccount.address,
    //     SECRET,
    //     duration,
    //     userAccount.address,
    //     partnerAddress
    //   )
    // ).wait(); // Contract Execution

    const resolvedName = await Resolver['addr(bytes32)'](
      namehash(domainName + '.rsk')
    );
    // console.log('stat: ', tx.status);
    console.log('owner: ', userAccount.address);
    console.log('domain owner: ', resolvedName);
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
