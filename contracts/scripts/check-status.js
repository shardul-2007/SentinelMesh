const hre = require("hardhat");

async function main() {
  const deployer = "0x145115aD79A09A91249169E13BAEE24A9eA20ab3";
  const expectedAddr = hre.ethers.getCreateAddress({ from: deployer, nonce: 0 });
  console.log("Expected Contract Address at Nonce 0:", expectedAddr);
  
  const balance = await hre.ethers.provider.getBalance(deployer);
  const nonce = await hre.ethers.provider.getTransactionCount(deployer);
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("Network Chain ID:", network.chainId.toString());
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "tMSTC");
  console.log("Deployer Nonce:", nonce);
  
  const code = await hre.ethers.provider.getCode(expectedAddr);
  console.log("Bytecode at expected address:", code === "0x" ? "None (Not deployed yet)" : `Exists (${code.length / 2 - 1} bytes)`);
}

main().catch(console.error);
