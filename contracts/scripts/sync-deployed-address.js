const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const targetAddress = process.argv[2] || "0xCc95344e2A223897f18Fd346D3aBa38392817bE5";
  console.log(`[SentinelMesh] Verifying on-chain state for contract: ${targetAddress}`);

  const code = await hre.ethers.provider.getCode(targetAddress);
  if (!code || code === "0x") {
    console.log(`[SentinelMesh] PENDING: No runtime bytecode found at ${targetAddress} yet. Transaction is awaiting user wallet approval.`);
    return;
  }

  const byteLength = code.length / 2 - 1;
  console.log(`[SentinelMesh] SUCCESS: Runtime bytecode verified on MST Testnet (${byteLength} bytes)!`);

  // Verify submitter authorization
  const Factory = await hre.ethers.getContractFactory("EvidenceRegistry");
  const contract = Factory.attach(targetAddress);
  const deployer = "0x145115aD79A09A91249169E13BAEE24A9eA20ab3";
  const isDeployerAuthorized = await contract.authorizedSubmitters(deployer);
  const owner = await contract.owner();
  console.log(`[SentinelMesh] Contract Owner: ${owner}`);
  console.log(`[SentinelMesh] Deployer Submitter Role: ${isDeployerAuthorized}`);

  // Synchronize configuration files
  const timestamp = Date.now();

  // 1. Update backend/.env
  const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
  if (fs.existsSync(backendEnvPath)) {
    fs.copyFileSync(backendEnvPath, `${backendEnvPath}.bak.${timestamp}`);
    let envContent = fs.readFileSync(backendEnvPath, "utf-8");
    envContent = envContent.replace(/BLOCKCHAIN_CONTRACT_ADDRESS=.*/g, `BLOCKCHAIN_CONTRACT_ADDRESS=${targetAddress}`);
    fs.writeFileSync(backendEnvPath, envContent);
    console.log("[SentinelMesh] Updated backend/.env BLOCKCHAIN_CONTRACT_ADDRESS");
  }

  // 2. Update frontend/src/lib/web3Wallet.tsx
  const web3WalletPath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "web3Wallet.tsx");
  if (fs.existsSync(web3WalletPath)) {
    fs.copyFileSync(web3WalletPath, `${web3WalletPath}.bak.${timestamp}`);
    let wwContent = fs.readFileSync(web3WalletPath, "utf-8");
    wwContent = wwContent.replace(/contractAddress: '0x[0-9a-fA-F]{40}',/g, `contractAddress: '${targetAddress}',`);
    fs.writeFileSync(web3WalletPath, wwContent);
    console.log("[SentinelMesh] Updated frontend/src/lib/web3Wallet.tsx contractAddress");
  }

  // 3. Update frontend/src/lib/clientStore.ts
  const clientStorePath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "clientStore.ts");
  if (fs.existsSync(clientStorePath)) {
    fs.copyFileSync(clientStorePath, `${clientStorePath}.bak.${timestamp}`);
    let csContent = fs.readFileSync(clientStorePath, "utf-8");
    csContent = csContent.replace(/export const MST_CONTRACT_ADDRESS = '0x[0-9a-fA-F]{40}';/g, `export const MST_CONTRACT_ADDRESS = '${targetAddress}';`);
    fs.writeFileSync(clientStorePath, csContent);
    console.log("[SentinelMesh] Updated frontend/src/lib/clientStore.ts MST_CONTRACT_ADDRESS");
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
  console.log(`[SentinelMesh] Saved deployment metadata to ${deploymentPath}`);
}

main().catch(console.error);
