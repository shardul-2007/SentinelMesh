require("@nomicfoundation/hardhat-toolbox");

const accounts = process.env.BLOCKCHAIN_SIGNER_KEY ? [process.env.BLOCKCHAIN_SIGNER_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    mstTestnet: {
      url: process.env.MST_TESTNET_RPC_URL || "https://testnetrpc.mstblockchain.com",
      chainId: 91562037,
      accounts: accounts,
    },
    mstMainnet: {
      url: process.env.MST_MAINNET_RPC_URL || "https://mariorpc.mstblockchain.com/",
      chainId: 4646,
      accounts: accounts,
    },
    testnet: {
      url: process.env.BLOCKCHAIN_RPC_URL || "https://testnetrpc.mstblockchain.com",
      chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || "91562037"),
      accounts: accounts,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
