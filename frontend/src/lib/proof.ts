/**
 * MindVault Proof Generation and Verification
 *
 * Generates cryptographic proofs of conversation authenticity using on-chain data.
 * Proofs can be verified by anyone without accessing the plaintext content.
 */

import { suiClient, PACKAGE_ID, NETWORK } from "./sui";
import { blobExists } from "./walrus";

/**
 * Conversation proof structure
 */
export interface ConversationProof {
  // Chain data
  vaultId: string;
  vaultOwner: string;
  blobIndex: number;
  blobId: string;
  chainTimestamp: number;
  storeTxDigest?: string;

  // Content hash (optional - doesn't expose plaintext)
  contentHash?: string;

  // Verification info
  network: "testnet" | "mainnet";
  packageId: string;
  version: string;
}

/**
 * Verification result
 */
export interface VerifyResult {
  valid: boolean;
  details: string;
  checks: {
    vaultExists: boolean;
    blobExists: boolean;
    timestampValid: boolean;
    transactionValid?: boolean;
  };
}

/**
 * Generate SHA-256 hash of content
 */
export async function sha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a conversation proof
 */
export async function generateProof(params: {
  vaultId: string;
  vaultOwner: string;
  blobIndex: number;
  blobId: string;
  chainTimestamp: number;
  storeTxDigest?: string;
  content?: string;
}): Promise<ConversationProof> {
  const proof: ConversationProof = {
    vaultId: params.vaultId,
    vaultOwner: params.vaultOwner,
    blobIndex: params.blobIndex,
    blobId: params.blobId,
    chainTimestamp: params.chainTimestamp,
    storeTxDigest: params.storeTxDigest,
    network: NETWORK as "testnet" | "mainnet",
    packageId: PACKAGE_ID,
    version: "1.0.0",
  };

  // Add content hash if content is provided
  if (params.content) {
    proof.contentHash = await sha256(params.content);
  }

  return proof;
}

/**
 * Verify a conversation proof
 */
export async function verifyProof(proof: ConversationProof): Promise<VerifyResult> {
  const checks = {
    vaultExists: false,
    blobExists: false,
    timestampValid: false,
    transactionValid: undefined as boolean | undefined,
  };

  try {
    // 1. Verify vault exists and has correct owner
    const vaultObject = await suiClient.getObject({
      id: proof.vaultId,
      options: {
        showContent: true,
        showOwner: true,
      },
    });

    if (!vaultObject.data) {
      return {
        valid: false,
        details: "Vault not found on chain",
        checks,
      };
    }

    const owner = vaultObject.data.owner;
    const ownerAddress =
      owner && typeof owner === "object" && "AddressOwner" in owner
        ? owner.AddressOwner
        : "";

    if (ownerAddress !== proof.vaultOwner) {
      return {
        valid: false,
        details: `Vault owner mismatch. Expected ${proof.vaultOwner}, got ${ownerAddress}`,
        checks,
      };
    }

    checks.vaultExists = true;

    // 2. Verify blob exists on Walrus
    const blobExistsResult = await blobExists(proof.blobId);
    if (!blobExistsResult) {
      return {
        valid: false,
        details: "Blob not found on Walrus storage",
        checks,
      };
    }

    checks.blobExists = true;

    // 3. Verify timestamp is reasonable (not in the future)
    const now = Date.now();
    if (proof.chainTimestamp > now + 60000) {
      // Allow 1 minute tolerance
      return {
        valid: false,
        details: "Timestamp is in the future",
        checks,
      };
    }

    checks.timestampValid = true;

    // 4. Verify transaction if provided
    if (proof.storeTxDigest) {
      try {
        const tx = await suiClient.getTransactionBlock({
          digest: proof.storeTxDigest,
          options: {
            showEvents: true,
            showEffects: true,
          },
        });

        if (!tx) {
          checks.transactionValid = false;
          return {
            valid: false,
            details: "Transaction not found on chain",
            checks,
          };
        }

        // Check if transaction was successful
        const status = tx.effects?.status?.status;
        if (status !== "success") {
          checks.transactionValid = false;
          return {
            valid: false,
            details: `Transaction failed with status: ${status}`,
            checks,
          };
        }

        // Look for BlobStored event
        const blobStoredEvent = tx.events?.find((e) =>
          e.type.includes("BlobStored")
        );

        if (blobStoredEvent) {
          const eventData = blobStoredEvent.parsedJson as {
            vault_id: string;
            index: string;
          };

          // Verify vault ID matches
          if (eventData.vault_id !== proof.vaultId) {
            checks.transactionValid = false;
            return {
              valid: false,
              details: "Transaction vault ID does not match proof",
              checks,
            };
          }

          // Verify index matches
          if (parseInt(eventData.index) !== proof.blobIndex) {
            checks.transactionValid = false;
            return {
              valid: false,
              details: "Transaction blob index does not match proof",
              checks,
            };
          }
        }

        checks.transactionValid = true;
      } catch (err) {
        console.error("Failed to verify transaction:", err);
        checks.transactionValid = false;
      }
    }

    // All checks passed
    const timestamp = new Date(proof.chainTimestamp).toISOString();
    return {
      valid: true,
      details: `Verified: Message stored at ${timestamp} on ${proof.network}`,
      checks,
    };
  } catch (err) {
    console.error("Proof verification error:", err);
    return {
      valid: false,
      details: `Verification error: ${err instanceof Error ? err.message : "Unknown error"}`,
      checks,
    };
  }
}

/**
 * Export proof as downloadable JSON file
 */
export function downloadProof(proof: ConversationProof, filename?: string): void {
  const json = JSON.stringify(proof, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `mindvault-proof-${proof.blobIndex}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse proof from JSON string
 */
export function parseProof(jsonString: string): ConversationProof | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (
      !parsed.vaultId ||
      !parsed.vaultOwner ||
      typeof parsed.blobIndex !== "number" ||
      !parsed.blobId ||
      !parsed.chainTimestamp ||
      !parsed.network ||
      !parsed.packageId
    ) {
      return null;
    }

    return parsed as ConversationProof;
  } catch {
    return null;
  }
}
