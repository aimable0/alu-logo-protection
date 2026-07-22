# ALU Brand Protection dApp

## Live Testnet Deployment
This dApp is fully deployed on the public Ethereum Sepolia Testnet (Chain ID 11155111). The frontend is configured to interact with the live smart contracts using an Alchemy RPC provider for read-only calls and MetaMask for signed transactions.
* **Registry (ERC-721):** `0x258Ca10734fa6A203B44E9202BC0b02c3f2f76Fe`
* **Token (ERC-20):** `0x83196fF6820E94e66f706a49B5E36808575b930C`
* **Demo Video:** https://youtu.be/EJrRTBUGJt8

## Project Overview
This full-stack decentralized application (dApp) protects and manages the intellectual property of the ALU logo on the blockchain. It utilizes two interconnected smart contracts: the `ALUAssetRegistry` (an ERC-721 contract) and the `ALULogoToken` (an ERC-20 contract).

The `ALUAssetRegistry` acts as the unforgeable, master record of authenticity, securely storing the exact cryptographic hash of the logo to prevent counterfeiting. Once the logo's unique identity is established as an NFT, the `ALULogoToken` contract links to this registered asset by minting 1,000,000 fungible, fractionalized shares (ALUT). This allows the university to distribute programmable equity and voting rights to students, faculty, and stakeholders without dividing the original NFT.

### Frontend Architecture
The frontend is built using **React** and connects to the Sepolia blockchain using **Ethers.js (v6)**.
* **Admin Controls (Requires Wallet):** The app uses a `BrowserProvider` connected to MetaMask to allow authorized users (like the contract owner) to sign transactions on the Sepolia network. Through this connection, admins can register new brand assets (writing to the Registry contract) and distribute ALUT shares (writing to the Token contract).
* **Public Verification (Gasless):** The app utilizes a `JsonRpcProvider` connected via Alchemy to create a read-only tunnel to the blockchain. This allows any public user to upload a file, hash it in the browser using the Web Crypto API, and query the Registry contract to verify its authenticity without needing a MetaMask wallet or paying gas fees.

## Logo Verification Hash
To ensure the integrity of the registered logo, the exact SHA-256 hash generated from the original `alu-logo.png` file is hardcoded into the deployment. Anyone can independently verify the file against this hash:
**SHA-256 Hash:** `0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5`

## Development Environment Versions
* **Node.js:** `v18.x` or higher
* **Frontend Framework:** React (via Vite `^5.x`)
* **Solidity:** `0.8.28`
* **Hardhat:** `v3.x` (Latest, ESM Configuration)
* **Ethers.js:** `^6.x`
* **OpenZeppelin Contracts:** `^5.0.0`

---

## Installation and Deployment Guide

### 1. Smart Contract Setup & Deployment
Clone the repository and install the strict dependencies required for the modern Hardhat 3 ECMAScript Module (ESM) environment:
```bash
npm install --save-dev hardhat@latest @nomicfoundation/hardhat-toolbox-mocha-ethers ethers
npm install @openzeppelin/contracts dotenv
```

Create a .env file in your root directory with your Sepolia credentials:

```bash
SEPOLIA_RPC_URL="your_alchemy_rpc_url_here"
PRIVATE_KEY="your_wallet_private_key_here"
```

Run the automated test suite to verify contract logic:
```bash
npx hardhat test
```

Deploy the smart contracts to the live Sepolia testnet:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Smart Contract Setup & Deployment
Navigate to the frontend directory, install the React dependencies, and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```
The dApp will now be running locally at http://localhost:5173/ and is securely connected to the Sepolia testnet.

---

## Usage Guide & Features

### Security Warning
🚨 **CRITICAL: Never commit your `.env` file to version control.** Your `.env` file contains sensitive information, including your wallet's private key and RPC URLs. Always ensure that `.env` is explicitly listed in your `.gitignore` file before running `git push`. Exposing your private key to a public GitHub repository will result in the immediate loss of all funds associated with that wallet.

---

### Connecting Your Wallet
To interact with the admin features of the dApp, you must connect your wallet to the live testnet:
1. Open MetaMask.
2. Click the network dropdown in the top left and select **Sepolia**. *(Ensure "Show test networks" is toggled on in your MetaMask settings if it is hidden).*
3. Ensure you have Sepolia test ETH in your wallet to cover gas fees for administrative transactions.

### Feature 1: Public Logo Verification (No Wallet Required)
1. Navigate to the Public Logo Verification portal at the top of the page.
2. Select **"Verify by File"** and upload an image, or **"Verify by Hash"** and paste a `0x` SHA-256 string.
3. Click **Verify Authenticity**. The frontend will instantly query the Sepolia blockchain via Alchemy (costing 0 gas) and return a green success message with metadata if the logo is authentic, or a red warning if it is a fake.

### Feature 2: ALUT Token Distribution
1. Connect your Web3 wallet using the Admin Portal.
2. If you are connected with the Owner wallet, the Distribute Shares panel will unlock.
3. Enter a recipient's wallet address (e.g., `0x...`) and an amount.
4. Click **Send ALUT Tokens** and sign the transaction in MetaMask to distribute equity. The UI will automatically update your remaining balance and ownership stake once the Sepolia block is confirmed.

### Feature 3: Register New Brand Asset
1. Under the Register New Brand Asset section, upload a new image.
2. The browser will automatically generate a localized SHA-256 hash and render an image preview.
3. Enter an Asset Name and click **Register Asset**. Sign the transaction in MetaMask to permanently write the new intellectual property to the blockchain.

---

## Known Issues
* **Hardhat 3 Test Warnings:** When running the test suite (`npx hardhat test`), a yellow deprecation warning for `hre.network.connect()` may appear. This is a known quirk with Hardhat 3 ESM migration and does not impact the passing tests or contract execution.