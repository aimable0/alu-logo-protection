// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ALUAssetRegistry is ERC721 {
    // Counter to ensure each registered asset gets a unique Token ID
    uint256 private _nextTokenId = 1;

    // Data Structure required by the assignment
    struct AssetMetadata {
        string name;
        string fileType;
        bytes32 contentHash;
        address registeredBy;
        uint256 registeredAt;
    }

    // Mappings
    mapping(uint256 => AssetMetadata) private _assets;
    mapping(bytes32 => bool) public isHashRegistered;

    // Event to emit when an asset is successfully registered
    event AssetRegistered(uint256 tokenId, bytes32 contentHash, address registeredBy);

    constructor() ERC721("ALU Asset Registry", "ALUAR") {}

    // Function 1: Register a new asset
    function registerAsset(string memory _name, string memory _fileType, bytes32 _contentHash) public returns (uint256) {
        // Revert transaction if the hash already exists
        require(!isHashRegistered[_contentHash], "Error: This content hash has already been registered");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        // Mint the NFT to the caller
        _safeMint(msg.sender, tokenId);

        // Store the metadata in the mapping
        _assets[tokenId] = AssetMetadata({
            name: _name,
            fileType: _fileType,
            contentHash: _contentHash,
            registeredBy: msg.sender,
            registeredAt: block.timestamp
        });

        // Mark the hash as used to prevent duplicates
        isHashRegistered[_contentHash] = true;

        // Emit the registration event
        emit AssetRegistered(tokenId, _contentHash, msg.sender);

        return tokenId;
    }

    // Function 2: Verify logo integrity
    function verifyLogoIntegrity(uint256 _tokenId, bytes32 _contentHash) public view returns (bool, string memory) {
        // Compare the stored hash with the hash provided by the caller
        if (_assets[_tokenId].contentHash == _contentHash) {
            return (true, "Logo is authentic.");
        } else {
            return (false, "Warning: logo does not match.");
        }
    }

    // Function 3: Get asset details
    function getAsset(uint256 _tokenId) public view returns (AssetMetadata memory) {
        return _assets[_tokenId];
    }
}
