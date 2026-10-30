const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const deployer = "0x145115aD79A09A91249169E13BAEE24A9eA20ab3";

async function main() {
  const provider = hre.ethers.provider;
  console.log(`[SentinelMesh Watcher] Monitoring MST Testnet for deployer ${deployer}...`);

  const initialNonce = await provider.getTransactionCount(deployer);
  console.log(`[SentinelMesh Watcher] Current deployer nonce: ${initialNonce}`);

  const expectedAddr = hre.ethers.getCreateAddress({ from: deployer, nonce: 0 });
  console.log(`[SentinelMesh Watcher] Expected contract address: ${expectedAddr}`);

  // Check if already deployed
  let code = await provider.getCode(expectedAddr);
  if (code && code !== "0x") {
    console.log(`[SentinelMesh Watcher] ALREADY MINED! Bytecode length: ${code.length / 2 - 1} bytes.`);
    await syncFiles(expectedAddr);
    return;
  }

  // Poll for up to 90 seconds
  console.log("[SentinelMesh Watcher] Awaiting BridgeKey approval and block confirmation...");
  const start = Date.now();
  while (Date.now() - start < 90000) {
    await new Promise((r) => setTimeout(r, 3000));
    
    code = await provider.getCode(expectedAddr);
    if (code && code !== "0x") {
      console.log(`[SentinelMesh Watcher] TRANSACTION CONFIRMED ON-CHAIN!`);
      console.log(`[SentinelMesh Watcher] Contract Address: ${expectedAddr}`);
      console.log(`[SentinelMesh Watcher] Bytecode Size: ${code.length / 2 - 1} bytes`);
      await syncFiles(expectedAddr);
      return;
    }
  }

  console.log("[SentinelMesh Watcher] Timeout waiting for on-chain confirmation.");
}

async function syncFiles(targetAddress) {
  const timestamp = Date.now();

  // 1. Update backend/.env
  const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
  if (fs.existsSync(backendEnvPath)) {
    fs.copyFileSync(backendEnvPath, `${backendEnvPath}.bak.${timestamp}`);
    let envContent = fs.readFileSync(backendEnvPath, "utf-8");
    envContent = envContent.replace(/BLOCKCHAIN_CONTRACT_ADDRESS=.*/g, `BLOCKCHAIN_CONTRACT_ADDRESS=${targetAddress}`);
    fs.writeFileSync(backendEnvPath, envContent);
    console.log("[SentinelMesh Watcher] Synchronized backend/.env");
  }

  // 2. Update frontend/src/lib/web3Wallet.tsx
  const web3WalletPath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "web3Wallet.tsx");
  if (fs.existsSync(web3WalletPath)) {
    fs.copyFileSync(web3WalletPath, `${web3WalletPath}.bak.${timestamp}`);
    let wwContent = fs.readFileSync(web3WalletPath, "utf-8");
    wwContent = wwContent.replace(/contractAddress: '0x[0-9a-fA-F]{40}',/g, `contractAddress: '${targetAddress}',`);
    fs.writeFileSync(web3WalletPath, wwContent);
    console.log("[SentinelMesh Watcher] Synchronized frontend/src/lib/web3Wallet.tsx");
  }

  // 3. Update frontend/src/lib/clientStore.ts
  const clientStorePath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "clientStore.ts");
  if (fs.existsSync(clientStorePath)) {
    fs.copyFileSync(clientStorePath, `${clientStorePath}.bak.${timestamp}`);
    let csContent = fs.readFileSync(clientStorePath, "utf-8");
    csContent = csContent.replace(/export const MST_CONTRACT_ADDRESS = '0x[0-9a-fA-F]{40}';/g, `export const MST_CONTRACT_ADDRESS = '${targetAddress}';`);
    fs.writeFileSync(clientStorePath, csContent);
    console.log("[SentinelMesh Watcher] Synchronized frontend/src/lib/clientStore.ts");
  }

  // 4. Update deployment.json
  const deploymentData = {
    contractName: "EvidenceRegistry",
    address: targetAddress,
    deployer: deployer,
    network: "mstTestnet",
    chainId: 91562037,
    deployedAt: new Date().toISOString(),
    compilerVersion: "0.8.20",
    rpcUrl: "https://testnetrpc.mstblockchain.com",
    explorerUrl: `https://testnet.mstscan.com/address/${targetAddress}`
  };
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("[SentinelMesh Watcher] Deployment record written.");
}

main().catch(console.error);
