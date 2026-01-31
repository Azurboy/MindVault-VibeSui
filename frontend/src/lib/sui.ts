/**
 * Sui Client Configuration
 */

import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";

// Network configuration
export const NETWORK = "testnet";
export const SUI_FULLNODE_URL = getJsonRpcFullnodeUrl(NETWORK);

// Contract configuration - Update after deployment
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x0";
export const MODULE_NAME = "data_vault";

// Create Sui client
export const suiClient = new SuiJsonRpcClient({ url: SUI_FULLNODE_URL, network: NETWORK });

/**
 * Build transaction to create a new DataVault
 */
export function buildCreateVaultTx(): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::create_vault`,
    arguments: [tx.object("0x6")], // Clock object
  });

  return tx;
}

/**
 * Build transaction to store a blob reference
 */
export function buildStoreBlobTx(
  vaultId: string,
  blobId: Uint8Array,
  blobType: number,
  iv: Uint8Array
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::store_blob`,
    arguments: [
      tx.object(vaultId),
      tx.pure.vector("u8", Array.from(blobId)),
      tx.pure.u8(blobType),
      tx.pure.vector("u8", Array.from(iv)),
      tx.object("0x6"), // Clock object
    ],
  });

  return tx;
}

/**
 * Build transaction to grant access to a provider
 */
export function buildGrantAccessTx(
  vaultId: string,
  provider: string,
  scope: number,
  expiresAt: number
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::grant_access`,
    arguments: [
      tx.object(vaultId),
      tx.pure.address(provider),
      tx.pure.u8(scope),
      tx.pure.u64(expiresAt),
      tx.object("0x6"), // Clock object
    ],
  });

  return tx;
}

/**
 * Build transaction to revoke access from a provider
 */
export function buildRevokeAccessTx(
  vaultId: string,
  provider: string
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::revoke_access`,
    arguments: [
      tx.object(vaultId),
      tx.pure.address(provider),
    ],
  });

  return tx;
}

/**
 * Build transaction to delete a blob reference
 */
export function buildDeleteBlobTx(
  vaultId: string,
  index: number
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::delete_blob`,
    arguments: [
      tx.object(vaultId),
      tx.pure.u64(index),
    ],
  });

  return tx;
}

/**
 * Query user's DataVault objects
 */
export async function getUserVaults(owner: string): Promise<Array<{
  objectId: string;
  blobCount: number;
  createdAt: number;
}>> {
  const objects = await suiClient.getOwnedObjects({
    owner,
    filter: {
      StructType: `${PACKAGE_ID}::${MODULE_NAME}::DataVault`,
    },
    options: {
      showContent: true,
    },
  });

  return objects.data
    .filter((obj) => obj.data?.content?.dataType === "moveObject")
    .map((obj) => {
      const content = obj.data!.content as unknown as {
        dataType: "moveObject";
        fields: { blob_count: string; created_at: string };
      };
      return {
        objectId: obj.data!.objectId,
        blobCount: parseInt(content.fields.blob_count || "0"),
        createdAt: parseInt(content.fields.created_at || "0"),
      };
    });
}

/**
 * Get vault details including dynamic fields
 */
export async function getVaultDetails(vaultId: string): Promise<{
  objectId: string;
  blobCount: number;
  createdAt: number;
  owner: string;
} | null> {
  try {
    const object = await suiClient.getObject({
      id: vaultId,
      options: {
        showContent: true,
        showOwner: true,
      },
    });

    if (!object.data?.content || object.data.content.dataType !== "moveObject") {
      return null;
    }

    const content = object.data.content as unknown as {
      dataType: "moveObject";
      fields: { blob_count: string; created_at: string };
    };

    const owner = object.data.owner;
    const ownerAddress = owner && typeof owner === "object" && "AddressOwner" in owner
      ? owner.AddressOwner
      : "";

    return {
      objectId: object.data.objectId,
      blobCount: parseInt(content.fields.blob_count || "0"),
      createdAt: parseInt(content.fields.created_at || "0"),
      owner: ownerAddress,
    };
  } catch {
    return null;
  }
}
