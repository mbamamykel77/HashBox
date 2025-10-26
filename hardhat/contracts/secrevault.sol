// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Secret Vault
/// @notice A secure vault for storing encrypted secrets on-chain
/// @dev Users can store multiple secrets, each encrypted using FHEVM
contract SecretVault is SepoliaConfig {
    
    // Structure to hold each secret
    struct Secret {
        uint256 id;              // Unique secret ID
        euint32 encryptedData;   // Encrypted secret value (can store numbers, codes, etc.)
        string label;            // Plain text label (e.g., "Bank PIN", "Recovery Code")
        uint256 createdAt;       // Timestamp when secret was stored
        bool exists;             // Check if secret exists
    }

    // Mapping: user address => secret ID => Secret
    mapping(address => mapping(uint256 => Secret)) private userSecrets;
    
    // Track next secret ID for each user
    mapping(address => uint256) private nextSecretId;
    
    // Storage fee (optional - to prevent spam)
    uint256 public storageFee = 0.001 ether;
    address public owner;

    // Events
    event SecretStored(address indexed user, uint256 indexed secretId, string label, uint256 timestamp);
    event SecretUpdated(address indexed user, uint256 indexed secretId, uint256 timestamp);
    event SecretDeleted(address indexed user, uint256 indexed secretId, uint256 timestamp);
    event StorageFeeChanged(uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier secretExists(uint256 secretId) {
        require(userSecrets[msg.sender][secretId].exists, "Secret does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Store a new encrypted secret
    /// @param encryptedSecret The encrypted secret value (e.g., PIN, code)
    /// @param inputProof The proof for the encrypted input
    /// @param label A plain text label to identify the secret
    function storeSecret(
        externalEuint32 encryptedSecret,
        bytes calldata inputProof,
        string calldata label
    ) external payable {
        require(msg.value >= storageFee, "Insufficient storage fee");
        require(bytes(label).length > 0, "Label cannot be empty");
        require(bytes(label).length <= 50, "Label too long");

        uint256 secretId = nextSecretId[msg.sender];
        nextSecretId[msg.sender]++;

        // Import and store the encrypted secret
        euint32 secret = FHE.fromExternal(encryptedSecret, inputProof);
        
        Secret storage newSecret = userSecrets[msg.sender][secretId];
        newSecret.id = secretId;
        newSecret.encryptedData = secret;
        newSecret.label = label;
        newSecret.createdAt = block.timestamp;
        newSecret.exists = true;

        // Allow this contract to work with the encrypted data
        FHE.allowThis(newSecret.encryptedData);
        // Allow the user to decrypt their own secret
        FHE.allow(newSecret.encryptedData, msg.sender);

        emit SecretStored(msg.sender, secretId, label, block.timestamp);
    }

    /// @notice Update an existing secret
    /// @param secretId The ID of the secret to update
    /// @param encryptedSecret The new encrypted secret value
    /// @param inputProof The proof for the encrypted input
    function updateSecret(
        uint256 secretId,
        externalEuint32 encryptedSecret,
        bytes calldata inputProof
    ) external secretExists(secretId) {
        euint32 secret = FHE.fromExternal(encryptedSecret, inputProof);
        
        Secret storage existingSecret = userSecrets[msg.sender][secretId];
        existingSecret.encryptedData = secret;

        FHE.allowThis(existingSecret.encryptedData);
        FHE.allow(existingSecret.encryptedData, msg.sender);

        emit SecretUpdated(msg.sender, secretId, block.timestamp);
    }

    /// @notice Delete a secret from storage
    /// @param secretId The ID of the secret to delete
    function deleteSecret(uint256 secretId) external secretExists(secretId) {
        delete userSecrets[msg.sender][secretId];
        emit SecretDeleted(msg.sender, secretId, block.timestamp);
    }

    /// @notice Get encrypted secret data (for decryption on frontend)
    /// @param secretId The ID of the secret to retrieve
    /// @return encryptedData The encrypted secret as bytes32
    function getSecret(uint256 secretId) external view secretExists(secretId) returns (bytes32 encryptedData) {
        Secret storage secret = userSecrets[msg.sender][secretId];
        encryptedData = FHE.toBytes32(secret.encryptedData);
    }

    /// @notice Get secret metadata (non-encrypted information)
    /// @param secretId The ID of the secret
    /// @return label The secret's label
    /// @return createdAt Timestamp when created
    /// @return exists Whether the secret exists
    function getSecretInfo(uint256 secretId) external view returns (
        string memory label,
        uint256 createdAt,
        bool exists
    ) {
        Secret storage secret = userSecrets[msg.sender][secretId];
        return (
            secret.label,
            secret.createdAt,
            secret.exists
        );
    }



    /// @notice Set the storage fee (only owner)
    /// @param newFee The new fee in wei
    function setStorageFee(uint256 newFee) external onlyOwner {
        storageFee = newFee;
        emit StorageFeeChanged(newFee);
    }

    /// @notice Withdraw collected fees (only owner)
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner).transfer(balance);
        emit FeesWithdrawn(owner, balance);
    }
    /// @notice Get the total number of secrets stored by the caller
    /// @return count The number of secrets
    function getSecretCount() external view returns (uint256 count) {
        return nextSecretId[msg.sender];
    }

    /// @notice Get all secret IDs for the caller
    /// @return secretIds Array of all secret IDs (including deleted ones marked as non-existent)
    /// @return activeCount Count of active (existing) secrets
    function getAllSecrets() external view returns (uint256[] memory secretIds, uint256 activeCount) {
        uint256 totalIds = nextSecretId[msg.sender];
        secretIds = new uint256[](totalIds);
        activeCount = 0;
        
        for (uint256 i = 0; i < totalIds; i++) {
            secretIds[i] = i;
            if (userSecrets[msg.sender][i].exists) {
                activeCount++;
            }
        }
        
        return (secretIds, activeCount);
    }

    /// @notice Get all active secret IDs for the caller
    /// @return activeSecretIds Array of only active secret IDs
    function getActiveSecrets() external view returns (uint256[] memory activeSecretIds) {
        uint256 totalIds = nextSecretId[msg.sender];
        uint256 activeCount = 0;
        
        // First pass: count active secrets
        for (uint256 i = 0; i < totalIds; i++) {
            if (userSecrets[msg.sender][i].exists) {
                activeCount++;
            }
        }
        
        // Second pass: populate array with active secret IDs
        activeSecretIds = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < totalIds; i++) {
            if (userSecrets[msg.sender][i].exists) {
                activeSecretIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeSecretIds;
    }

    /// @notice Check if a specific secret ID exists for the caller
    /// @param secretId The ID to check
    /// @return exists Whether the secret exists
    function secretExistsForUser(uint256 secretId) external view returns (bool exists) {
        return userSecrets[msg.sender][secretId].exists;
    }
}