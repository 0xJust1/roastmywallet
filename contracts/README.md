# DegenBadge - Deployment Guide (Base L2)

This smart contract implements a **Soulbound Token (SBT)** representing the player's Degen Score and classification.

## Contract Architecture

The contract is written in Solidity `^0.8.20` and inherits from OpenZeppelin `ERC721URIStorage`. It overrides the internal `_update` hook to prevent any token transfers, anchoring the badge permanently to the minter's address.

- **OnlyOwner Minting**: Only the backend API signing wallet can call `mintBadge` to prevent players from minting high scores they didn't earn.
- **Auto-Update**: If a player gets re-audited, the contract updates their existing badge's metadata and stats instead of minting a new token.

---

## Deployment via Hardhat (Recommended)

### 1. Install Dependencies
Initialize hardhat or install the required smart contract packages inside `/Users/Dev/roastmywallet`:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

### 2. Hardhat Config (`hardhat.config.js`)
Create a simple configuration file:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY,
      "base-sepolia": process.env.BASESCAN_API_KEY
    }
  }
};
```

### 3. Deploy Script (`scripts/deploy.js`)
Create a deployment script:
```javascript
const hre = require("hardhat");

async main() {
  const degenBadge = await hre.ethers.deployContract("DegenBadge");
  await degenBadge.waitForDeployment();
  console.log(`DegenBadge deployed to: ${degenBadge.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 4. Commands
- Compile: `npx hardhat compile`
- Deploy to Base Sepolia (Testnet): `npx hardhat run scripts/deploy.js --network base-sepolia`
- Deploy to Base (Mainnet): `npx hardhat run scripts/deploy.js --network base`
- Verify Contract: `npx hardhat verify --network base [CONTRACT_ADDRESS]`
