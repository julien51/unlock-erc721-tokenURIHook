require("@nomiclabs/hardhat-waffle");
require("@unlock-protocol/hardhat-plugin");

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
      accounts: []
    }
  },
  solidity: {
    version: '0.8.7',
    // optimizer is required to deploy unlock contracts
    optimizer: {
      enabled: true,
      runs: 20,
    },
  },
}
