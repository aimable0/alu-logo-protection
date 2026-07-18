# ALU Brand Protection dApp

## Project Overview
This full-stack decentralized application (dApp) protects and manages the intellectual property of the ALU logo on the blockchain. It utilizes two interconnected smart contracts: the `ALUAssetRegistry` (an ERC-721 contract) and the `ALULogoToken` (an ERC-20 contract).

The `ALUAssetRegistry` acts as the unforgeable, master record of authenticity, securely storing the exact cryptographic hash of the logo to prevent counterfeiting. Once the logo's unique identity is established as an NFT, the `ALULogoToken` contract links to this registered asset by minting 1,000,000 fungible, fractionalized shares (ALUT). This allows the university to distribute programmable equity and voting rights to students, faculty, and stakeholders without dividing the original NFT.

### Frontend Architecture
The frontend is built using **React** and connects to the local Hardhat blockchain using **Ethers.js (v6)**.
* **Admin Controls (Requires Wallet):** The app uses a `BrowserProvider` connected to MetaMask to allow authorized users (like the contract owner) to sign transactions. Through this connection, admins can register new brand assets (writing to the Registry contract) and distribute ALUT shares (writing to the Token contract).
* **Public Verification (Gasless):** The app utilizes a `JsonRpcProvider` to create a read-only tunnel to the blockchain. This allows any public user to upload a file, hash it in the browser using the Web Crypto API, and query the Registry contract to verify its authenticity without needing a MetaMask wallet or paying gas fees.

## Logo Verification Hash
To ensure the integrity of the registered logo, the exact SHA-256 hash generated from the original `alu-logo.png` file is hardcoded into the deployment. Anyone can independently verify the file against this hash:
**SHA-256 Hash:** `0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5`

## Development Environment Versions
* **Node.js:** `v18.x` or higher
* **Frontend Framework:** React (via Vite `^5.x`)
* **Solidity:** `0.8.28`
* **Hardhat:** `v3.x` (Latest)
* **Ethers.js:** `^6.x`
* **OpenZeppelin Contracts:** `^5.0.0`

---

## Installation and Deployment Guide

### 1. Backend Setup & Local Blockchain
Clone the repository and install the strict dependencies required for the modern Hardhat 3 ECMAScript Module (ESM) environment:
```bash
npm install --save-dev hardhat@latest @nomicfoundation/hardhat-toolbox-mocha-ethers ethers
npm install @openzeppelin/contracts

Start the local Hardhat node:
npx hardhat node

In a separate terminal, deploy the smart contracts to the local network:

Bash
npx hardhat run scripts/deploy.js --network localhost

Note: Copy the deployed contract addresses from the terminal output and update them in frontend/src/config.js.

2. Frontend Setup & Development Server
Navigate to the frontend directory, install the React dependencies, and start the Vite development server:

Bash
cd frontend
npm install
npm run dev
The dApp will now be running locally at http://localhost:5173/.

Usage Guide & Features
Connecting Your Wallet
To interact with the admin features of the dApp, you must configure MetaMask to connect to your local blockchain:

Open MetaMask and go to Add Network > Add a network manually.

Enter the following details:

Network Name: Hardhat Localhost

RPC URL: http://127.0.0.1:8545

Chain ID: 31337

Currency Symbol: ETH

Import Account #0 from your Hardhat terminal using its Private Key. This account acts as the contract deployer and owner.

Feature 1: Public Logo Verification (No Wallet Required)
Navigate to the Public Logo Verification portal at the top of the page.

Select "Verify by File" and upload an image, or "Verify by Hash" and paste a 0x SHA-256 string.

Click Verify Authenticity. The frontend will instantly query the blockchain (costing 0 gas) and return a green success message with metadata if the logo is authentic, or a red warning if it is a fake.

Feature 2: ALUT Token Distribution
Connect your Web3 wallet using the Admin Portal.

If you are connected with the Owner wallet, the Distribute Shares panel will unlock.

Enter a recipient's wallet address (e.g., 0x...) and an amount.

Click Send ALUT Tokens and sign the transaction in MetaMask to distribute equity. The UI will automatically update your remaining balance and ownership stake.

### Feature 3: Register New Brand Asset
Under the Register New Brand Asset section, upload a new image.

The browser will automatically generate a localized SHA-256 hash and render an image preview.

Enter an Asset Name and click Register Asset. Sign the transaction in MetaMask to permanently write the new intellectual property to the blockchain.

### Known Issues & Limitations:
Hardhat 3 Test Warnings: When running the test suite (npx hardhat test), a yellow deprecation warning for hre.network.connect() may appear. This is a known quirk with Hardhat 3 ESM migration and does not impact the passing tests or contract execution.

Blockchain Reset Desync: If the terminal running npx hardhat node is closed or restarted, the local blockchain state is wiped clean. You must redeploy the contracts, update the config.js addresses, and clear your MetaMask activity (Settings > Advanced > Clear activity tab data) to prevent BAD_DATA reading errors and incorrect nonce desyncs.

Local Environment Only: This dApp is currently configured for a local development environment (Chain ID 31337) and is not yet deployed to a public testnet like Sepolia.