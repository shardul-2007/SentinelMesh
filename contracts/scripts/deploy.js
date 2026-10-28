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
}

main().catch((error) => {
  console.error("[SentinelMesh] Deployment failed:", error);
  process.exitCode = 1;
});
