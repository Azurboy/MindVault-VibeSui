"use client";

import { useState, useCallback, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import {
  buildCreateVaultTx,
  buildStoreBlobTx,
  buildGrantAccessTx,
  buildRevokeAccessTx,
  getUserVaults,
  getVaultDetails,
  getAllBlobRefs,
  BlobRefData,
} from "@/lib/sui";
import { downloadFromWalrus } from "@/lib/walrus";

export interface VaultInfo {
  objectId: string;
  blobCount: number;
  createdAt: number;
  owner?: string;
}

/**
 * Stored message structure - matches what we encrypt and store
 */
export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  blobIndex?: number;
  blobId?: string;
  chainTimestamp?: number;
}

export function useVault() {
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [currentVault, setCurrentVault] = useState<VaultInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Fetch user's vaults
  const fetchVaults = useCallback(async () => {
    if (!account?.address) return;

    setIsLoading(true);
    setError(null);

    try {
      const userVaults = await getUserVaults(account.address);
      setVaults(userVaults);

      // Set current vault to the first one if not set
      if (userVaults.length > 0 && !currentVault) {
        setCurrentVault(userVaults[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch vaults";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, currentVault]);

  // Fetch vaults when account changes
  useEffect(() => {
    if (account?.address) {
      fetchVaults();
    } else {
      setVaults([]);
      setCurrentVault(null);
    }
  }, [account?.address, fetchVaults]);

  // Create a new vault
  const createVault = useCallback(async () => {
    if (!account?.address) {
      setError("Wallet not connected");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = buildCreateVaultTx();
      const result = await signAndExecute({
        transaction: tx,
      });

      // Refresh vaults after creation
      await fetchVaults();

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create vault";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, signAndExecute, fetchVaults]);

  // Store a blob reference
  const storeBlob = useCallback(
    async (blobId: Uint8Array, blobType: number, iv: Uint8Array) => {
      if (!currentVault) {
        setError("No vault selected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = buildStoreBlobTx(currentVault.objectId, blobId, blobType, iv);
        const result = await signAndExecute({
          transaction: tx,
        });

        // Refresh vault details
        const details = await getVaultDetails(currentVault.objectId);
        if (details) {
          setCurrentVault(details);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to store blob";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentVault, signAndExecute]
  );

  // Grant access to a provider
  const grantAccess = useCallback(
    async (provider: string, scope: number, expiresAt: number = 0) => {
      if (!currentVault) {
        setError("No vault selected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = buildGrantAccessTx(currentVault.objectId, provider, scope, expiresAt);
        const result = await signAndExecute({
          transaction: tx,
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to grant access";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentVault, signAndExecute]
  );

  // Revoke access from a provider
  const revokeAccess = useCallback(
    async (provider: string) => {
      if (!currentVault) {
        setError("No vault selected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = buildRevokeAccessTx(currentVault.objectId, provider);
        const result = await signAndExecute({
          transaction: tx,
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to revoke access";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentVault, signAndExecute]
  );

  // Load chat history from Walrus
  const loadHistory = useCallback(
    async (
      decrypt: (ciphertext: Uint8Array, iv: Uint8Array) => Promise<string>
    ): Promise<StoredMessage[]> => {
      if (!currentVault) {
        return [];
      }

      try {
        // Get all blob references from chain
        const blobRefs = await getAllBlobRefs(currentVault.objectId);

        if (blobRefs.length === 0) {
          return [];
        }

        const messages: StoredMessage[] = [];

        // Download and decrypt each blob
        for (const ref of blobRefs) {
          try {
            // Download encrypted data from Walrus
            const encryptedData = await downloadFromWalrus(ref.blobId);

            // Decrypt the data
            const decrypted = await decrypt(encryptedData, ref.iv);

            // Parse the message
            try {
              const parsed = JSON.parse(decrypted) as StoredMessage;
              messages.push({
                ...parsed,
                blobIndex: ref.index,
                blobId: ref.blobId,
                chainTimestamp: ref.createdAt,
              });
            } catch {
              // If not JSON, treat as plain text (legacy format)
              messages.push({
                role: "user",
                content: decrypted,
                timestamp: ref.createdAt,
                blobIndex: ref.index,
                blobId: ref.blobId,
                chainTimestamp: ref.createdAt,
              });
            }
          } catch (err) {
            console.error(`Failed to load blob ${ref.index}:`, err);
          }
        }

        // Sort by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);

        return messages;
      } catch (err) {
        console.error("Failed to load history:", err);
        return [];
      }
    },
    [currentVault]
  );

  // Get blob references (for proof generation)
  const getBlobRefs = useCallback(async (): Promise<BlobRefData[]> => {
    if (!currentVault) {
      return [];
    }
    return getAllBlobRefs(currentVault.objectId);
  }, [currentVault]);

  return {
    vaults,
    currentVault,
    setCurrentVault,
    isLoading,
    error,
    fetchVaults,
    createVault,
    storeBlob,
    grantAccess,
    revokeAccess,
    loadHistory,
    getBlobRefs,
  };
}
