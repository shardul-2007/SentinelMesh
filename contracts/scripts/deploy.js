const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`[SentinelMesh] Deploying EvidenceRegistry to ${hre.network.name}...`);
  const [deployer] = await hre.ethers.getSigners();
  console.log("[SentinelMesh] Deployer account:", deployer ? deployer.address : "No signer configured");

  const Factory = await hre.ethers.getContractFactory("EvidenceRegistry");
  const registryContract = await Factory.deploy();
  const deployTx = registryContract.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : null;
  console.log("[SentinelMesh] Broadcasted deployment transaction hash:", txHash);

  await registryContract.waitForDeployment();
  const contractAddress = await registryContract.getAddress();
  console.log("[SentinelMesh] EvidenceRegistry successfully deployed to:", contractAddress);

  // Verify real mined receipt and bytecode existence
  if (deployTx) {
    const receipt = await deployTx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Deployment transaction reverted or failed on-chain! Status: ${receipt?.status}`);
    }
    console.log(`[SentinelMesh] Transaction mined in block #${receipt.blockNumber} (Gas used: ${receipt.gasUsed})`);
  }

  const bytecode = await hre.ethers.provider.getCode(contractAddress);
  if (!bytecode || bytecode === "0x") {
    throw new Error(`Bytecode verification failed! No runtime bytecode detected at ${contractAddress}`);
  }
  console.log(`[SentinelMesh] Bytecode successfully confirmed on-chain (${bytecode.length / 2 - 1} bytes).`);

  if (deployer) {
    const isDeployerAuthorized = await registryContract.authorizedSubmitters(deployer.address);
    console.log(`[SentinelMesh] Initial submitter authorization for deployer ${deployer.address}: ${isDeployerAuthorized}`);
  }

  const deploymentData = {
    contractName: "EvidenceRegistry",
    address: contractAddress,
    transactionHash: txHash,
    deployer: deployer ? deployer.address : "Unknown",
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    compilerVersion: "0.8.20",
    rpcUrl: hre.network.config.url || "Local Hardhat",
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("[SentinelMesh] Deployment metadata written to:", deploymentPath);

  // Write ABI artifact to backend directory for Python Web3 client
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "EvidenceRegistry.sol", "EvidenceRegistry.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const backendAbiDir = path.join(__dirname, "..", "..", "backend", "app", "blockchain");
    if (!fs.existsSync(backendAbiDir)) {
      fs.mkdirSync(backendAbiDir, { recursive: true });
    }
    const backendAbiPath = path.join(backendAbiDir, "EvidenceRegistry.json");
    fs.writeFileSync(backendAbiPath, JSON.stringify(artifact, null, 2));
    console.log("[SentinelMesh] EvidenceRegistry ABI exported to backend at:", backendAbiPath);
  }

  // If deployed to a live network (e.g. mstTestnet or testnet), sync the address to config files
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    try {
      // 1. Update backend .env
      const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
      if (fs.existsSync(backendEnvPath)) {
        let envContent = fs.readFileSync(backendEnvPath, "utf-8");
        envContent = envContent.replace(
          /BLOCKCHAIN_CONTRACT_ADDRESS=.*/g,
          `BLOCKCHAIN_CONTRACT_ADDRESS=${contractAddress}`
        );
        fs.writeFileSync(backendEnvPath, envContent);
        console.log("[SentinelMesh] Synchronized backend/.env BLOCKCHAIN_CONTRACT_ADDRESS");
      }

      // 2. Update frontend web3Wallet.tsx
      const web3WalletPath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "web3Wallet.tsx");
      if (fs.existsSync(web3WalletPath)) {
        let wwContent = fs.readFileSync(web3WalletPath, "utf-8");
        wwContent = wwContent.replace(
          /contractAddress: '0x[0-9a-fA-F]{40}',/g,
          `contractAddress: '${contractAddress}',`
        );
        fs.writeFileSync(web3WalletPath, wwContent);
        console.log("[SentinelMesh] Synchronized frontend/src/lib/web3Wallet.tsx contractAddress");
      }

      // 3. Update frontend clientStore.ts
      const clientStorePath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "clientStore.ts");
      if (fs.existsSync(clientStorePath)) {
        let csContent = fs.readFileSync(clientStorePath, "utf-8");
        csContent = csContent.replace(
          /export const MST_CONTRACT_ADDRESS = '0x[0-9a-fA-F]{40}';/g,
          `export const MST_CONTRACT_ADDRESS = '${contractAddress}';`
        );
        fs.writeFileSync(clientStorePath, csContent);
        console.log("[SentinelMesh] Synchronized frontend/src/lib/clientStore.ts MST_CONTRACT_ADDRESS");
      }
    } catch (syncErr) {
      console.warn("[SentinelMesh] Address sync warning:", syncErr.message);
    }
  }
}

main().catch((error) => {
  console.error("[SentinelMesh] Deployment failed:", error);
  process.exitCode = 1;
});
