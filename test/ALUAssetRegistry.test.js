import { expect } from "chai";
import { network } from "hardhat";

describe("ALU Final Project Contracts", function () {
    // 1. We declare 'ethers' here so every single test can see it
    let registry, token, owner, addr1, ethers;
    const logoHash = "0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5";

    beforeEach(async function () {
        // 2. We initialize the environment exactly the way you originally had it!
        const hre = await network.connect();
        ethers = hre.ethers;

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
            expect(ownerBalance).to.equal(1000000n * 10n ** 18n);
        });

        it("distributeShares() correctly transfers the specified number of tokens to a recipient address", async function () {
            const transferAmount = ethers.parseUnits("50000", 18);
            await token.distributeShares(addr1.address, transferAmount);

            const recipientBalance = await token.balanceOf(addr1.address);
            expect(recipientBalance).to.equal(transferAmount);
        });

        it("ownershipPercentage() returns the correct percentage for a wallet that holds a known number of tokens", async function () {
            const transferAmount = ethers.parseUnits("250000", 18);
            await token.distributeShares(addr1.address, transferAmount);

            const percentage = await token.ownershipPercentage(addr1.address);
            expect(percentage).to.equal(25n);
        });
    });

    describe("Frontend Integration & Distribution Tests", function () {
        it("1. Should correctly read the total ALUT token supply as 1,000,000", async function () {
            const totalSupply = await token.totalSupply();
            expect(ethers.formatUnits(totalSupply, 18)).to.equal("1000000.0");
        });

        it("2. Should format the SHA-256 hash correctly in bytes32 format", async function () {
            const mockFileContent = "ALU Official Logo Data";
            const sha256Hash = ethers.sha256(ethers.toUtf8Bytes(mockFileContent));

            expect(sha256Hash).to.match(/^0x[a-fA-F0-9]{64}$/);
        });

        it("3. Should return a verification success result for the correct ALU logo hash", async function () {
            const correctHash = ethers.sha256(ethers.toUtf8Bytes("authentic alu logo"));
            await registry.registerAsset("ALU Official Logo", "PNG", correctHash);

            const [isAuthentic, ] = await registry.verifyLogoIntegrity(1, correctHash);
            expect(isAuthentic).to.be.true;
        });

        it("4. Should return a verification failure result for an incorrect hash", async function () {
            await registry.registerAsset("ALU Official Logo", "PNG", logoHash);
            const fakeHash = ethers.sha256(ethers.toUtf8Bytes("fake modified logo"));

            const [isAuthentic, ] = await registry.verifyLogoIntegrity(1, fakeHash);
            expect(isAuthentic).to.be.false;
        });

        it("5. Should correctly update the recipient's balance after distributeShares()", async function () {
            const transferAmount = ethers.parseUnits("50000", 18);
            await token.distributeShares(addr1.address, transferAmount);

            const recipientBalance = await token.balanceOf(addr1.address);
            expect(ethers.formatUnits(recipientBalance, 18)).to.equal("50000.0");
        });
    });
});