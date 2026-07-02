import { expect } from "chai";
import { network } from "hardhat";

describe("ALU Final Project Contracts", function () {
    let registry, token, owner, addr1;
    const logoHash = "0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5";

    // Setup hook: deploys fresh contracts and gets wallets before every single test
    beforeEach(async function () {
        const { ethers } = await network.connect();
        [owner, addr1] = await ethers.getSigners();

        // Deploy Registry
        const ALUAssetRegistry = await ethers.getContractFactory("ALUAssetRegistry");
        registry = await ALUAssetRegistry.deploy();
        await registry.waitForDeployment();

        // Deploy Token
        const ALULogoToken = await ethers.getContractFactory("ALULogoToken");
        token = await ALULogoToken.deploy(owner.address);
        await token.waitForDeployment();
    });

    describe("Part B: ALUAssetRegistry (ERC-721)", function () {
        it("Registers the ALU logo successfully and returns a token ID", async function () {
            const tx = await registry.registerAsset("ALU Logo", "image/png", logoHash);
            await tx.wait();
            expect(await registry.isHashRegistered(logoHash)).to.be.true;
        });

        it("Attempting to register the same hash a second time is rejected with an error", async function () {
            await registry.registerAsset("ALU Logo", "image/png", logoHash);
            await expect(
                registry.registerAsset("Duplicate Logo", "image/png", logoHash)
            ).to.be.revertedWith("Error: This content hash has already been registered");
        });

        it("verifyLogoIntegrity() returns true when the correct hash is supplied", async function () {
            await registry.registerAsset("ALU Logo", "image/png", logoHash);
            const result = await registry.verifyLogoIntegrity(1, logoHash);
            expect(result[0]).to.be.true;
            expect(result[1]).to.equal("Logo is authentic.");
        });

        it("verifyLogoIntegrity() returns false when an incorrect hash is supplied", async function () {
            await registry.registerAsset("ALU Logo", "image/png", logoHash);
            const fakeHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const result = await registry.verifyLogoIntegrity(1, fakeHash);
            expect(result[0]).to.be.false;
            expect(result[1]).to.equal("Warning: logo does not match.");
        });

        it("getAsset() returns the correct asset name and file type for a registered token", async function () {
            await registry.registerAsset("ALU Logo", "image/png", logoHash);
            const asset = await registry.getAsset(1);
            expect(asset.name).to.equal("ALU Logo");
            expect(asset.fileType).to.equal("image/png");
            expect(asset.contentHash).to.equal(logoHash);
        });
    });

    describe("Part C: ALULogoToken (ERC-20)", function () {
        it("Mints the full supply of 1,000,000 ALUT tokens to the logo owner upon deployment", async function () {
            const ownerBalance = await token.balanceOf(owner.address);
            const totalSupply = await token.totalSupply();
            
            expect(ownerBalance).to.equal(totalSupply);
            // Verify it is exactly 1,000,000 with 18 decimal places using BigInt
            expect(ownerBalance).to.equal(1000000n * 10n ** 18n);
        });

        it("distributeShares() correctly transfers the specified number of tokens to a recipient address", async function () {
            const { ethers } = await network.connect();
            // Prep 50,000 tokens, accounting for the 18 standard ERC20 decimals
            const transferAmount = ethers.parseUnits("50000", 18);
            
            await token.distributeShares(addr1.address, transferAmount);
            
            const recipientBalance = await token.balanceOf(addr1.address);
            expect(recipientBalance).to.equal(transferAmount);
        });

        it("ownershipPercentage() returns the correct percentage for a wallet that holds a known number of tokens", async function () {
            const { ethers } = await network.connect();
            // Transfer 250,000 tokens (which equals 25% of the 1,000,000 supply)
            const transferAmount = ethers.parseUnits("250000", 18);
            await token.distributeShares(addr1.address, transferAmount);
            
            const percentage = await token.ownershipPercentage(addr1.address);
            // Should mathematically return exactly 25
            expect(percentage).to.equal(25n);
        });
    });
});
