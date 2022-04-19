require("@nomiclabs/hardhat-waffle");
require("@unlock-protocol/hardhat-plugin");
require("@nomiclabs/hardhat-etherscan");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      // needed to deploy the contracts protocol locally
      gas: 1000000000,
      allowUnlimitedContractSize: true,
      blockGasLimit: 1000000000,
    },
    rinkeby: {
      chainId: 4,
      url: `https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      accounts: ["0x99e506e8843b39060db15e6fa28e9edf9c9bb5271431fee1ca3df03f44958fc9"]
    },
    mainnet: {
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/6idtzGwDtRbzil3s6QbYHr2Q_WBfn100`,
    }
  },
  etherscan: {
    apiKey: {
      mainnet: 'HPSH1KQDPJTNAPU3335G931SC6Y3ZYK3BF'
    }
  },
  unlock: {
    4: {
      name: 'rinkeby',
      unlockAddress: '0xd8c88be5e8eb88e38e6ff5ce186d764676012b0b', // your own unlock deployment address
    },
    1: {
      name: 'mainnet',
      unlockAddress: '0x3d5409CcE1d45233dE1D4eBDEe74b8E004abDD13', // your own unlock deployment address
    },
  },
  solidity: {
    version: '0.8.7',
    // optimizer is required to deploy unlock contracts
    optimizer: {
      enabled: true,
      runs: 20,
    },
  },
  initialDate: new Date("2022-04-10T06:00:00.000Z")
}
