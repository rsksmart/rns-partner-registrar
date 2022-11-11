import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from '../chairc';
import { deployContract } from 'utils/deployment.utils';
import { $PartnerProxy } from 'typechain-types/contracts-exposed/PartnerProxy/PartnerProxy.sol/$PartnerProxy';
import { $PartnerProxyFactory } from 'typechain-types/contracts-exposed/PartnerProxy/PartnerProxyFactory.sol/$PartnerProxyFactory';

async function initialSetup() {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const partner1 = signers[1];
  const partner2 = signers[2];

  const { contract: PartnerProxy } = await deployContract<$PartnerProxy>(
    '$PartnerProxy',
    {}
  );

  const { contract: PartnerProxyFactory } =
    await deployContract<$PartnerProxyFactory>('$PartnerProxyFactory', {
      _masterProxy: PartnerProxy.address,
    });

  return {
    PartnerProxy,
    PartnerProxyFactory,
    owner,
    partner1,
    partner2,
    signers,
  };
}
describe('Deploy PartnerProxyFactory and create new Proxy Instances', () => {
  it('should successfully create new partner proxies', async () => {
    const { PartnerProxyFactory, partner1, partner2 } = await loadFixture(
      initialSetup
    );

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerPorxy(
      partner1.address,
      'PartnerOne'
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(partner1.address);

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerPorxy(
      partner2.address,
      'PartnerTwo'
    );
    await partnerTwoProxy.wait();
    const tx2 = await PartnerProxyFactory.getPartnerProxy(partner2.address);

    expect([tx1.name, tx2.name]).to.deep.equal(['PartnerOne', 'PartnerTwo']);
  });

  it('should successfully create new partner proxies', async () => {
    const {
      PartnerProxy,
      PartnerProxyFactory,
      owner,
      partner1,
      partner2,
      signers,
    } = await loadFixture(initialSetup);

    const partnerOneProxy = await PartnerProxyFactory.createNewPartnerPorxy(
      partner1.address,
      'PartnerOne'
    );
    await partnerOneProxy.wait();
    const tx1 = await PartnerProxyFactory.getPartnerProxy(partner1.address);

    const partnerTwoProxy = await PartnerProxyFactory.createNewPartnerPorxy(
      partner2.address,
      'PartnerTwo'
    );
    await partnerTwoProxy.wait();
    const tx2 = await PartnerProxyFactory.getPartnerProxy(partner2.address);

    expect([tx1.name, tx2.name]).to.deep.equal(['PartnerOne', 'PartnerTwo']);
  });
});
