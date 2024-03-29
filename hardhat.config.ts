import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-contract-sizer';
import 'hardhat-docgen';
import 'hardhat-packager';
import 'hardhat-watcher';
import 'tsconfig-paths/register';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
// REPLACE path for the desired .env file to be used
require('dotenv').config({ path: '.env.testnet' });

import { HardhatUserConfig } from 'hardhat/config';

export default <HardhatUserConfig>{
  solidity: {
    compilers: [
      {
        version: '0.8.16',
        settings: {
          outputSelection: {
            '*': {
              '*': ['storageLayout'],
            },
          },
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    regtest: {
      url: 'http://localhost:4444',
    },
    ganache: {
      url: 'http://127.0.0.1:7545',
      chainId: 1337,
      blockGasLimit: 12450000,
    },
    testnet: {
      url: 'https://public-node.testnet.rsk.co',
      accounts: {
        mnemonic: process.env.HDWALLET_MNEMONIC || '',
      },
      chainId: 31,
    },
    mainnet: {
      url: 'https://public-node.rsk.co',
      accounts: {
        mnemonic: process.env.HDWALLET_MNEMONIC || '',
      },
      chainId: 30,
    },
  },
  typechain: {
    target: 'ethers-v5',
    outDir: 'typechain-types',
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
  watcher: {
    compilation: {
      tasks: ['compile'],
      files: ['./contracts'],
      verbose: true,
    },
    tdd: {
      tasks: [
        // 'clean',
        // { command: 'compile', params: { quiet: true } },
        {
          command: 'test',
          params: {
            noCompile: true,
            testFiles: ['{path}'],
          },
        },
      ],
      files: ['./test/**/*.ts'],
      verbose: true,
    },
  },
  packager: {
    includeFactories: false,
    contracts: ['PartnerRegistrar'],
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: false,
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['storageLayout'],
      },
    },
  },

  reporter: {
    mocha: 'json',
  },
};
