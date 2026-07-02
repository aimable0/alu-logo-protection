# ALU Logo Asset Registry & Tokenization

## Project Overview
This decentralized application (dApp) protects and manages the intellectual property of the ALU logo on the blockchain. It utilizes two interconnected smart contracts: the `ALUAssetRegistry` (an ERC-721 contract) and the `ALULogoToken` (an ERC-20 contract). The `ALUAssetRegistry` acts as the unforgeable, master record of authenticity, securely storing the exact cryptographic hash of the logo to prevent counterfeiting. Once the logo's unique identity is established as an NFT, the `ALULogoToken` contract links to this registered asset by minting 1,000,000 fungible, fractionalized shares (ALUT). This allows the university to distribute programmable equity and voting rights to students, faculty, and stakeholders without dividing the original NFT.

## Logo Verification Hash
To ensure the integrity of the registered logo, the exact SHA-256 hash generated from the original `alu-logo.png` file is hardcoded into the deployment. Anyone can independently verify the file against this hash:
**SHA-256 Hash:** `0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5`

## Development Environment Versions
* **Solidity:** `0.8.28`
* **Hardhat:** `v3.x` (Latest)
* **OpenZeppelin Contracts:** `^5.0.0`

## Installation and Deployment Guide

### 1. Install Dependencies
First, ensure you are running Node.js. Clone the repository and install the strict dependencies required for the modern Hardhat 3 ECMAScript Module (ESM) environment:
```bash
npm install --save-dev hardhat@latest @nomicfoundation/hardhat-toolbox-mocha-ethers ethers
npm install @openzeppelin/contracts