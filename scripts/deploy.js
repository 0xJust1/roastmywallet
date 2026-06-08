import hre from "hardhat";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not set in .env.local");
  }

  // Derive the public signing address from the private key
  const wallet = new hre.ethers.Wallet(privateKey);
  const authorizedSignerAddress = wallet.address;

  console.log(`Starting deployment of DegenBadge...`);
  console.log(`Authorized backend signer set to: ${authorizedSignerAddress}`);

  const degenBadge = await hre.ethers.deployContract("DegenBadge", [authorizedSignerAddress]);
  await degenBadge.waitForDeployment();

  console.log(`DegenBadge successfully deployed to: ${degenBadge.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
