require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");
const path = require("path");

// Load local environment files if present
function loadEnvFiles() {
  const envCandidates = [
    path.join(__dirname, ".env"),
    path.join(__dirname, "..", "backend", ".env"),
    path.join(__dirname, "..", ".env"),
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      try {
        const lines = fs.readFileSync(envPath, "utf-8").split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [key, ...vals] = trimmed.split("=");
            const k = key.trim();
            const v = vals.join("=").trim().replace(/^['"]|['"]$/g, "");
            if (k && !process.env[k]) {
              process.env[k] = v;
            }
          }
        }
      } catch (err) {
        // ignore read errors
      }
    }
  }
}
loadEnvFiles();

const rawKey = (
  process.env.BLOCKCHAIN_SIGNER_KEY ||
  process.env.DEPLOYER_PRIVATE_KEY ||
  process.env.PRIVATE_KEY ||
  ""
).trim();

const accounts = rawKey ? [rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`] : [];

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
