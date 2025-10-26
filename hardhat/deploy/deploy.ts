import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("Deploying FHE contracts...");

  // Deploy SecretVault contract
  console.log("Deploying SecretVault contract...");
  const SecretVault = await hre.ethers.getContractFactory("SecretVault");
  const secretVault = await SecretVault.deploy();
  await secretVault.waitForDeployment();
  const vaultAddress = await secretVault.getAddress();
  console.log(`SecretVault contract deployed to: ${vaultAddress}`);

  console.log("\n=== Deployment Summary ===");

  console.log(`SecretVault: ${vaultAddress}`);
}

// Export the main function for hardhat-deploy
export default main;

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
