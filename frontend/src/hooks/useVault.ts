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
} from "@/lib/sui";

export interface VaultInfo {
  objectId: string;
  blobCount: number;
  createdAt: number;
  owner?: string;
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
  };
}
