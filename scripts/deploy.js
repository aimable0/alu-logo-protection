import { network } from "hardhat";

async function main() {
    // Connect to the network and get the primary wallet (deployer)
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();

    const logoHash = "0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5";

    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // --- 1. Deploy Asset Registry ---
    console.log("Deploying ALUAssetRegistry...");
    const ALUAssetRegistry = await ethers.getContractFactory("ALUAssetRegistry");
    const registry = await ALUAssetRegistry.deploy();
    await registry.waitForDeployment();
    console.log(`ALUAssetRegistry deployed to: ${await registry.getAddress()}`);

    const tx1 = await registry.registerAsset("ALU Logo", "image/png", logoHash);
    await tx1.wait();
    console.log("ALU Logo registered on the ERC-721 contract successfully.");

    // --- 2. Deploy Logo Token ---
    console.log("Deploying ALULogoToken (ERC-20 shares)...");
    const ALULogoToken = await ethers.getContractFactory("ALULogoToken");
    
    // Pass the deployer's address as the initial owner in the constructor
    const token = await ALULogoToken.deploy(deployer.address);
    await token.waitForDeployment();
    console.log(`ALULogoToken deployed to: ${await token.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
