const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying SentinelMeshAuditAnchor smart contract...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer account:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("SentinelMeshAuditAnchor");
  const anchorContract = await Factory.deploy();
  await anchorContract.waitForDeployment();

  const contractAddress = await anchorContract.getAddress();
  console.log("SentinelMeshAuditAnchor deployed to:", contractAddress);

  // Save contract deployment info for backend and frontend consumption
  const deploymentData = {
    address: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("Deployment info written to:", deploymentPath);

  // Also write ABI artifact to backend directory for clean python web3 usage
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "SentinelMeshAuditAnchor.sol", "SentinelMeshAuditAnchor.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const backendAbiDir = path.join(__dirname, "..", "..", "backend", "app", "blockchain");
    if (!fs.existsSync(backendAbiDir)) {
      fs.mkdirSync(backendAbiDir, { recursive: true });
    }
    const backendAbiPath = path.join(backendAbiDir, "SentinelMeshAuditAnchor.json");
    fs.writeFileSync(backendAbiPath, JSON.stringify(artifact, null, 2));
    console.log("Contract ABI exported to backend at:", backendAbiPath);
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
