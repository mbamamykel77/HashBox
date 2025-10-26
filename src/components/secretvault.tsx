import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  Loader2,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Shield,
  AlertCircle,
} from "lucide-react";
import { createEncryptedInput, publicDecrypt } from "../lib/fhevm";

const VAULT_CONTRACT_ADDRESS = "0x8FD3f2fd65579f4812C2511623d3E7dfd817064E";
const VAULT_CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FeesWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "SecretDeleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "label",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "SecretStored",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "SecretUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newFee",
        type: "uint256",
      },
    ],
    name: "StorageFeeChanged",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
    ],
    name: "deleteSecret",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveSecrets",
    outputs: [
      {
        internalType: "uint256[]",
        name: "activeSecretIds",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllSecrets",
    outputs: [
      {
        internalType: "uint256[]",
        name: "secretIds",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "activeCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
    ],
    name: "getSecret",
    outputs: [
      {
        internalType: "bytes32",
        name: "encryptedData",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSecretCount",
    outputs: [
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
    ],
    name: "getSecretInfo",
    outputs: [
      {
        internalType: "string",
        name: "label",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
    ],
    name: "secretExistsForUser",
    outputs: [
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newFee",
        type: "uint256",
      },
    ],
    name: "setStorageFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "storageFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "externalEuint32",
        name: "encryptedSecret",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "label",
        type: "string",
      },
    ],
    name: "storeSecret",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "secretId",
        type: "uint256",
      },
      {
        internalType: "externalEuint32",
        name: "encryptedSecret",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    name: "updateSecret",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export default function SecretVaultUI({ account, isConnected }) {
  const [activeTab, setActiveTab] = useState("store");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // Contract state
  const [storageFee, setStorageFee] = useState("0");
  const [secrets, setSecrets] = useState([]);
  const [secretCount, setSecretCount] = useState(0);
  const [contractBalance, setContractBalance] = useState("0");
  const [isOwner, setIsOwner] = useState(false);

  // Loading states
  const [isStoring, setIsStoring] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(null);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [isCheckingExists, setIsCheckingExists] = useState(false);
  const [isViewingSecret, setIsViewingSecret] = useState(false);

  // Form states
  const [newSecretValue, setNewSecretValue] = useState("");
  const [newSecretLabel, setNewSecretLabel] = useState("");
  const [updateSecretId, setUpdateSecretId] = useState("");
  const [updateSecretValue, setUpdateSecretValue] = useState("");
  const [deleteSecretId, setDeleteSecretId] = useState("");
  const [viewSecretId, setViewSecretId] = useState("");
  const [viewSecretData, setViewSecretData] = useState(null);
  const [checkExistsId, setCheckExistsId] = useState("");
  const [existsResult, setExistsResult] = useState(null);

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const tabs = [
    { id: "store", label: "Store Secret", icon: Plus },
    { id: "update", label: "Update Secret", icon: Edit },
    { id: "view", label: "View Secret", icon: Eye },
    { id: "list", label: "List All", icon: Shield },
    { id: "delete", label: "Delete Secret", icon: Trash2 },
    { id: "check", label: "Check Exists", icon: AlertCircle },
  ];

  // FUNCTION: Load Contract Data
  const loadContractData = useCallback(async () => {
    if (!isConnected) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        provider
      );

      const [fee, owner, balance, count] = await Promise.all([
        contract.storageFee(),
        contract.owner(),
        provider.getBalance(VAULT_CONTRACT_ADDRESS),
        contract.getSecretCount(),
      ]);

      setStorageFee(ethers.formatEther(fee));
      setContractBalance(ethers.formatEther(balance));
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      setSecretCount(Number(count));
    } catch (error) {
      console.error("Error loading contract data:", error);
      showMessage("❌ Error loading contract data", "error");
    }
  }, [isConnected, account]);

  // FUNCTION: Load All Secrets using getActiveSecrets
  const loadAllSecrets = async () => {
    if (!isConnected) return;
    setIsLoadingSecrets(true);
    showMessage("📥 Loading your secrets...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        provider
      );

      // Get all active secret IDs
      const activeSecretIds = await contract.getActiveSecrets();
      console.log("Active secret IDs:", activeSecretIds);

      const result = [];
      for (let id of activeSecretIds) {
        try {
          const [label, createdAt, exists] = await contract.getSecretInfo(
            Number(id)
          );

          if (exists) {
            result.push({
              id: Number(id),
              label,
              createdAt: Number(createdAt),
              exists,
              decryptedValue: null,
            });
          }
        } catch (error) {
          console.error(`Error loading secret ${id}:`, error);
        }
      }

      setSecrets(result);
      showMessage(
        result.length > 0
          ? `✅ Loaded ${result.length} secret${result.length > 1 ? "s" : ""}`
          : "📭 No secrets found. Store your first secret!",
        "success"
      );
    } catch (error) {
      console.error("Error loading secrets:", error);
      showMessage("❌ Failed to load secrets: " + error.message, "error");
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  // FUNCTION: Store New Secret
  const storeSecret = async () => {
    if (!newSecretValue || !newSecretLabel) {
      showMessage("⚠️ Please fill in both fields", "warning");
      return;
    }

    setIsStoring(true);
    showMessage("🔐 Encrypting and storing secret...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        signer
      );

      const encrypted = await createEncryptedInput(
        VAULT_CONTRACT_ADDRESS,
        account,
        parseInt(newSecretValue)
      );

      const tx = await contract.storeSecret(
        encrypted.encryptedData,
        encrypted.proof,
        newSecretLabel,
        {
          value: ethers.parseEther(storageFee),
        }
      );

      showMessage(
        "⏳ Transaction submitted, waiting for confirmation...",
        "info"
      );
      await tx.wait();

      showMessage("✅ Secret stored successfully!", "success");
      setNewSecretValue("");
      setNewSecretLabel("");

      // Reload everything
      await loadContractData();
      await loadAllSecrets();
    } catch (error) {
      console.error("Error storing secret:", error);
      showMessage("❌ Failed to store secret: " + error.message, "error");
    } finally {
      setIsStoring(false);
    }
  };

  // FUNCTION: Update Secret
  const updateSecret = async () => {
    if (!updateSecretId || !updateSecretValue) {
      showMessage("⚠️ Please fill in both fields", "warning");
      return;
    }

    setIsUpdating(true);
    showMessage("🔄 Updating secret...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        signer
      );

      const encrypted = await createEncryptedInput(
        VAULT_CONTRACT_ADDRESS,
        account,
        parseInt(updateSecretValue)
      );

      const tx = await contract.updateSecret(
        parseInt(updateSecretId),
        encrypted.encryptedData,
        encrypted.proof
      );

      showMessage(
        "⏳ Transaction submitted, waiting for confirmation...",
        "info"
      );
      await tx.wait();

      showMessage("✅ Secret updated successfully!", "success");
      setUpdateSecretId("");
      setUpdateSecretValue("");

      await loadAllSecrets();
    } catch (error) {
      console.error("Error updating secret:", error);
      showMessage("❌ Failed to update secret: " + error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // FUNCTION: View Single Secret
  const viewSecret = async () => {
    if (!viewSecretId) {
      showMessage("⚠️ Please enter a secret ID", "warning");
      return;
    }

    setIsViewingSecret(true);
    showMessage(`🔍 Fetching secret #${viewSecretId}...`, "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        provider
      );

      // Check if secret exists first
      const exists = await contract.secretExistsForUser(parseInt(viewSecretId));

      if (!exists) {
        showMessage(`❌ Secret #${viewSecretId} does not exist`, "error");
        setViewSecretData(null);
        setIsViewingSecret(false);
        return;
      }

      // Get secret info
      const [label, createdAt] = await contract.getSecretInfo(
        parseInt(viewSecretId)
      );

      setViewSecretData({
        id: parseInt(viewSecretId),
        label,
        createdAt: Number(createdAt),
        exists: true,
      });

      showMessage(`✅ Secret #${viewSecretId} retrieved`, "success");
    } catch (error) {
      console.error("Error viewing secret:", error);
      showMessage("❌ Failed to view secret: " + error.message, "error");
      setViewSecretData(null);
    } finally {
      setIsViewingSecret(false);
    }
  };

  // FUNCTION: Decrypt Secret from View Tab
  const decryptViewSecret = async () => {
    if (!viewSecretData) return;

    setIsDecrypting(viewSecretData.id);
    showMessage(`🔓 Decrypting secret #${viewSecretData.id}...`, "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        provider
      );

      const encryptedData = await contract.getSecret(viewSecretData.id);
      const decrypted = await publicDecrypt(encryptedData);

      setViewSecretData((prev) => ({ ...prev, decryptedValue: decrypted }));
      showMessage(`✅ Secret #${viewSecretData.id} decrypted`, "success");
    } catch (error) {
      console.error("Error decrypting secret:", error);
      showMessage("❌ Failed to decrypt secret", "error");
    } finally {
      setIsDecrypting(null);
    }
  };

  // FUNCTION: Decrypt Secret from List
  const decryptSecret = async (id: any | ethers.Overrides) => {
    setIsDecrypting(id);
    showMessage(`🔓 Decrypting secret #${id}...`, "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        provider
      );

      const encryptedData = await contract.getSecret(id);
      const decrypted = await publicDecrypt(encryptedData);

      setSecrets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, decryptedValue: decrypted } : s))
      );
      showMessage(`✅ Secret #${id} decrypted`, "success");
    } catch (error) {
      console.error("Error decrypting secret:", error);
      showMessage("❌ Failed to decrypt secret", "error");
    } finally {
      setIsDecrypting(null);
    }
  };

  // FUNCTION: Delete Secret
  const deleteSecretAction = async () => {
    if (!deleteSecretId) {
      showMessage("⚠️ Please enter a secret ID", "warning");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete secret #${deleteSecretId}?`
      )
    ) {
      return;
    }

    setIsDeleting(deleteSecretId);
    showMessage("🗑️ Deleting secret...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        signer
      );

      const tx = await contract.deleteSecret(parseInt(deleteSecretId));
      await tx.wait();

      showMessage("✅ Secret deleted successfully", "success");
      setDeleteSecretId("");

      await loadContractData();
      await loadAllSecrets();
    } catch (error) {
      console.error("Error deleting secret:", error);
      showMessage("❌ Failed to delete secret: " + error.message, "error");
    } finally {
      setIsDeleting(null);
    }
  };

  // FUNCTION: Delete Secret from List
  const deleteSecretFromList = async (id) => {
    if (!window.confirm(`Are you sure you want to delete secret #${id}?`)) {
      return;
    }

    setIsDeleting(id);
    showMessage("🗑️ Deleting secret...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        signer
      );

      const tx = await contract.deleteSecret(id);
      await tx.wait();

      showMessage("✅ Secret deleted", "success");
      await loadAllSecrets();
    } catch (error) {
      console.error("Error deleting secret:", error);
      showMessage("❌ Failed to delete secret", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  // FUNCTION: Check if Secret Exists
  const checkExists = async () => {
    if (!checkExistsId) {
      showMessage("⚠️ Please enter a secret ID", "warning");
      return;
    }

    setIsCheckingExists(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        provider
      );

      const exists = await contract.secretExistsForUser(
        parseInt(checkExistsId)
      );
      setExistsResult(exists);

      showMessage(
        exists
          ? `✅ Secret #${checkExistsId} exists`
          : `❌ Secret #${checkExistsId} does not exist`,
        exists ? "success" : "error"
      );
    } catch (error) {
      console.error("Error checking existence:", error);
      showMessage("❌ Failed to check secret existence", "error");
      setExistsResult(null);
    } finally {
      setIsCheckingExists(false);
    }
  };

  // FUNCTION: Withdraw Fees (Owner Only)
  const withdrawFees = async () => {
    if (!isOwner) {
      showMessage("❌ Only owner can withdraw fees", "error");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_CONTRACT_ABI,
        signer
      );

      const tx = await contract.withdrawFees();
      await tx.wait();

      showMessage("✅ Fees withdrawn successfully", "success");
      await loadContractData();
    } catch (error) {
      console.error("Error withdrawing fees:", error);
      showMessage("❌ Failed to withdraw fees", "error");
    }
  };

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      showMessage("✅ Wallet connected", "success");
    } catch (error) {
      console.error("Connection error:", error);
      showMessage("❌ Failed to connect wallet", "error");
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadContractData();
      loadAllSecrets();
    }
  }, [isConnected, loadContractData]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-2">SecretVault</h1>
          <p className="text-zinc-400 mb-8">FHE-Powered Secure Storage</p>
          <button
            onClick={connectWallet}
            className="px-8 py-4 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <Lock className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">SecretVault</h1>
                <p className="text-sm opacity-80">FHE-Powered Secure Storage</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Connected</p>
              <p className="font-mono text-sm font-semibold">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Secrets</p>
              <p className="text-2xl font-bold text-yellow-400">
                {secretCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Storage Fee</p>
              <p className="text-2xl font-bold text-yellow-400">
                {storageFee} ETH
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Contract Balance</p>
              <p className="text-2xl font-bold text-yellow-400">
                {contractBalance} ETH
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`${
            messageType === "success"
              ? "bg-green-500/20 border-green-500"
              : messageType === "error"
              ? "bg-red-500/20 border-red-500"
              : messageType === "warning"
              ? "bg-yellow-500/20 border-yellow-400"
              : "bg-blue-500/20 border-blue-500"
          } border-b`}
        >
          <div className="max-w-7xl mx-auto px-6 py-3">
            <p className="text-sm text-center">{message}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setViewSecretData(null);
                  setExistsResult(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  activeTab === tab.id
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-2" />
                <p className="text-xs">{tab.label}</p>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Store Secret */}
            {activeTab === "store" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">Store New Secret</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Secret Value (Number)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1234"
                      value={newSecretValue}
                      onChange={(e) => setNewSecretValue(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Label (max 50 characters)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Bank PIN"
                      maxLength={50}
                      value={newSecretLabel}
                      onChange={(e) => setNewSecretLabel(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={storeSecret}
                    disabled={isStoring}
                    className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isStoring ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Storing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Store Secret
                      </>
                    )}
                  </button>

                  <p className="text-xs text-zinc-500 text-center">
                    Fee: {storageFee} ETH + Gas
                  </p>
                </div>
              </div>
            )}

            {/* Update Secret */}
            {activeTab === "update" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <Edit className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">Update Existing Secret</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Secret ID
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 0"
                      value={updateSecretId}
                      onChange={(e) => setUpdateSecretId(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      New Secret Value
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 5678"
                      value={updateSecretValue}
                      onChange={(e) => setUpdateSecretValue(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={updateSecret}
                    disabled={isUpdating}
                    className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-5 h-5" />
                        Update Secret
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* View Secret */}
            {activeTab === "view" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">View Secret</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Secret ID
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 0"
                      value={viewSecretId}
                      onChange={(e) => setViewSecretId(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={viewSecret}
                    disabled={isViewingSecret}
                    className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isViewingSecret ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        View Secret
                      </>
                    )}
                  </button>

                  {viewSecretData && (
                    <div className="mt-6 bg-black border-2 border-zinc-800 rounded-lg p-5">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-400" />
                        {viewSecretData.label}
                      </h3>
                      <div className="space-y-3 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ID:</span>
                          <span className="text-white font-mono">
                            {viewSecretData.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Created:</span>
                          <span className="text-white">
                            {new Date(
                              viewSecretData.createdAt * 1000
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Status:</span>
                          <span className="px-2 py-1 bg-yellow-400/20 border border-yellow-400/30 rounded text-xs text-yellow-400">
                            Encrypted
                          </span>
                        </div>
                      </div>

                      {viewSecretData.decryptedValue !== null ? (
                        <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg mb-3">
                          <p className="text-xs text-zinc-400 mb-2">
                            Decrypted Value:
                          </p>
                          <p className="text-3xl font-bold text-yellow-400 font-mono">
                            {viewSecretData.decryptedValue}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg mb-3">
                          <p className="text-sm text-zinc-500 text-center">
                            🔐 Click decrypt to reveal
                          </p>
                        </div>
                      )}

                      <button
                        onClick={decryptViewSecret}
                        disabled={isDecrypting === viewSecretData.id}
                        className="w-full py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isDecrypting === viewSecretData.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Decrypting...
                          </>
                        ) : viewSecretData.decryptedValue !== null ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            Decrypted
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Decrypt
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* List All Secrets */}
            {activeTab === "list" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-bold">All Secrets</h2>
                  </div>
                  <button
                    onClick={loadAllSecrets}
                    disabled={isLoadingSecrets}
                    className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        isLoadingSecrets ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                </div>

                {isLoadingSecrets ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-400" />
                    <p className="text-zinc-400">Loading secrets...</p>
                  </div>
                ) : secrets.length > 0 ? (
                  <div className="space-y-4">
                    {secrets.map((secret) => (
                      <div
                        key={secret.id}
                        className="bg-black border-2 border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                              <Lock className="w-4 h-4 text-yellow-400" />
                              {secret.label}
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                              ID: {secret.id} •{" "}
                              {new Date(
                                secret.createdAt * 1000
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs text-yellow-400 font-semibold">
                            Encrypted
                          </span>
                        </div>

                        {secret.decryptedValue !== null ? (
                          <div className="mb-3 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                            <p className="text-xs text-zinc-400 mb-2">
                              Decrypted Value:
                            </p>
                            <p className="text-3xl font-bold text-yellow-400 font-mono">
                              {secret.decryptedValue}
                            </p>
                          </div>
                        ) : (
                          <div className="mb-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-500 text-center">
                              🔐 Click decrypt to reveal
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => decryptSecret(secret.id)}
                            disabled={isDecrypting === secret.id}
                            className="flex-1 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isDecrypting === secret.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Decrypting...
                              </>
                            ) : secret.decryptedValue !== null ? (
                              <>
                                <Unlock className="w-4 h-4" />
                                Decrypted
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4" />
                                Decrypt
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteSecretFromList(secret.id)}
                            disabled={isDeleting === secret.id}
                            className="px-6 py-3 bg-red-500/20 border-2 border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
                          >
                            {isDeleting === secret.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-400 mb-2">No secrets found</p>
                    <p className="text-sm text-zinc-600">
                      Store your first secret to get started
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Delete Secret */}
            {activeTab === "delete" && (
              <div className="bg-zinc-900 border-2 border-red-500/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Delete Secret</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Secret ID
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 0"
                      value={deleteSecretId}
                      onChange={(e) => setDeleteSecretId(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={deleteSecretAction}
                    disabled={isDeleting}
                    className="w-full py-4 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Delete Secret
                      </>
                    )}
                  </button>

                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-red-400">
                      ⚠️ This action cannot be undone. The secret will be
                      permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Check Exists */}
            {activeTab === "check" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">Check Secret Exists</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Secret ID
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 0"
                      value={checkExistsId}
                      onChange={(e) => {
                        setCheckExistsId(e.target.value);
                        setExistsResult(null);
                      }}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={checkExists}
                    disabled={isCheckingExists}
                    className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckingExists ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        Check Exists
                      </>
                    )}
                  </button>

                  {existsResult !== null && (
                    <div
                      className={`p-5 border-2 rounded-lg ${
                        existsResult
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <p
                        className={`font-bold text-center text-lg ${
                          existsResult ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {existsResult
                          ? `✅ Secret #${checkExistsId} exists`
                          : `❌ Secret #${checkExistsId} does not exist`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-6 space-y-6  ">
              {isOwner && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-yellow-400">
                    <Shield className="w-5 h-5" />
                    Owner Functions
                  </h3>
                  <button
                    onClick={withdrawFees}
                    className="w-full py-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 transition-all"
                  >
                    💰 Withdraw Fees
                  </button>
                  <p className="text-xs text-zinc-500 text-center mt-3">
                    Available: {contractBalance} ETH
                  </p>
                </div>
              )}

              {/* Security Note */}
              <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  Security Warning
                </h3>
                <p className="text-xs text-zinc-400">
                  This is a testnet demo. Never store real sensitive information
                  on testnets or experimental contracts.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Info */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <Shield className="w-5 h-5" />
                Contract Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Address</p>
                  <p className="font-mono text-xs break-all text-yellow-400">
                    {VAULT_CONTRACT_ADDRESS}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Network</p>
                  <p className="text-white">Zama Sepolia</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Encryption</p>
                  <p className="text-white">FHE (euint32)</p>
                </div>
              </div>
            </div>

            {/* Functions */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <Lock className="w-5 h-5" />
                Available Functions
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  "storeSecret()",
                  "updateSecret()",
                  "getSecret()",
                  "getSecretInfo()",
                  "getSecretCount()",
                  "getAllSecrets()",
                  "getActiveSecrets()",
                  "deleteSecret()",
                  "secretExistsForUser()",
                ].map((func) => (
                  <div key={func} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                    <span className="text-zinc-400 font-mono text-xs">
                      {func}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                How It Works
              </h3>
              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex gap-3">
                  <span className="text-yellow-400 font-bold">1.</span>
                  <p>Encrypt secrets with FHE before storing on-chain</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-yellow-400 font-bold">2.</span>
                  <p>Only you can decrypt using your private key</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-yellow-400 font-bold">3.</span>
                  <p>Each secret has unique ID and label</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-yellow-400 font-bold">4.</span>
                  <p>Delete secrets anytime permanently</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Owner Functions */}
      <div className="max-w-7xl mx-auto px-6 mb-12 grid gap-2 grid-cols-3">
        {isOwner && (
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-yellow-400">
              <Shield className="w-5 h-5" />
              Owner Functions
            </h3>
            <button
              onClick={withdrawFees}
              className="w-full py-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500 transition-all"
            >
              💰 Withdraw Fees
            </button>
            <p className="text-xs text-zinc-500 text-center mt-3">
              Available: {contractBalance} ETH
            </p>
          </div>
        )}

        {/* Security Note */}
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            Security Warning
          </h3>
          <p className="text-xs text-zinc-400">
            This is a testnet demo. Never store real sensitive information on
            testnets or experimental contracts.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-yellow-400">
            <Shield className="w-5 h-5" />
            Your Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black border border-zinc-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {secrets.length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Active</p>
            </div>
            <div className="bg-black border border-zinc-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {secretCount}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 bg-zinc-900 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-zinc-600 text-sm">
          <p className="mb-2">
            Powered by Zama fhEVM • Fully Homomorphic Encryption
          </p>
          <p className="font-mono text-xs">{VAULT_CONTRACT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
}
