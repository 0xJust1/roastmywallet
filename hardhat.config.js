import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

// Load next.js environment variables
dotenv.config({ path: ".env.local" });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || ""
  }
};

export default config;
