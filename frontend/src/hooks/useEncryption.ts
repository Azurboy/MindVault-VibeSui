"use client";

import { useState, useCallback, useEffect } from "react";
import { getEncryptionService } from "@/lib/encryption";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";

export function useEncryption() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const encryptionService = getEncryptionService();

  // Check initialization status and try to restore from cache
  useEffect(() => {
    const checkAndRestore = async () => {
      // Already initialized
      if (encryptionService.isInitialized()) {
        setIsInitialized(true);
        return;
      }

      // Try to restore from session cache if wallet is connected
      if (account?.address) {
        setIsInitializing(true);
        try {
          const restored = await encryptionService.tryRestoreFromCache(account.address);
          if (restored) {
            setIsInitialized(true);
          }
        } catch {
          // Ignore restore errors
        } finally {
          setIsInitializing(false);
        }
      }
    };

    checkAndRestore();
  }, [encryptionService, account?.address]);

  // Initialize encryption when wallet connects
  const initialize = useCallback(async () => {
    if (!account) {
      setError("Wallet not connected");
      return false;
    }

    if (isInitialized) {
      return true;
    }

    setIsInitializing(true);
    setError(null);

    try {
      await encryptionService.deriveKeyFromWallet(async (message: Uint8Array) => {
        const result = await signPersonalMessage({
          message,
        });
        // Convert base64 signature to Uint8Array
        const signature = Uint8Array.from(atob(result.signature), c => c.charCodeAt(0));
        return { signature };
      }, account.address);

      setIsInitialized(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize encryption";
      setError(message);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [account, isInitialized, encryptionService, signPersonalMessage]);

  // Encrypt data
  const encrypt = useCallback(
    async (plaintext: string) => {
      if (!isInitialized) {
        const success = await initialize();
        if (!success) {
          throw new Error("Failed to initialize encryption");
        }
      }
      return encryptionService.encrypt(plaintext);
    },
    [isInitialized, initialize, encryptionService]
  );

  // Decrypt data
  const decrypt = useCallback(
    async (ciphertext: Uint8Array, iv: Uint8Array) => {
      if (!isInitialized) {
        const success = await initialize();
        if (!success) {
          throw new Error("Failed to initialize encryption");
        }
      }
      return encryptionService.decrypt(ciphertext, iv);
    },
    [isInitialized, initialize, encryptionService]
  );

  // Clear encryption key
  const clear = useCallback(() => {
    encryptionService.clear();
    setIsInitialized(false);
  }, [encryptionService]);

  return {
    isInitialized,
    isInitializing,
    error,
    initialize,
    encrypt,
    decrypt,
    clear,
  };
}
