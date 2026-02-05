/**
 * Sui Client Configuration
 */

import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";

// Network configuration
export const NETWORK = "testnet";
export const SUI_FULLNODE_URL = getJsonRpcFullnodeUrl(NETWORK);

// Contract configuration - Update after deployment
// IMPORTANT: Set NEXT_PUBLIC_PACKAGE_ID in Vercel environment variables
const _packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;

if (!_packageId || _packageId === "0x0" || _packageId.length < 10) {
  console.error(
    "CRITICAL: NEXT_PUBLIC_PACKAGE_ID is not set or invalid. " +
    "Please set it in Vercel Environment Variables. " +
    "Current value:", _packageId
  );
}

export const PACKAGE_ID = _packageId || "0xd8e2b3eeeeacbf0f42c0be6c86cc4a95b0a86b884c63678d13fc055afc3d82a6";
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

/**
 * BlobRef data structure from dynamic fields
 */
export interface BlobRefData {
  index: number;
  blobId: string;
  blobType: number;
  iv: Uint8Array;
  createdAt: number;
}

/**
 * Get all blob references from a vault's dynamic fields
 */
export async function getAllBlobRefs(vaultId: string): Promise<BlobRefData[]> {
  const blobRefs: BlobRefData[] = [];

  try {
    // Get vault details to know how many blobs exist
    const vault = await getVaultDetails(vaultId);
    if (!vault || vault.blobCount === 0) {
      return [];
    }

    // Query dynamic fields for the vault
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await suiClient.getDynamicFields({
        parentId: vaultId,
        cursor,
        limit: 50,
      });

      for (const field of response.data) {
        // Check if this is a BlobKey dynamic field
        if (field.name.type.includes("BlobKey")) {
          try {
            // Get the full dynamic field object
            const fieldObject = await suiClient.getDynamicFieldObject({
              parentId: vaultId,
              name: field.name,
            });

            if (fieldObject.data?.content?.dataType === "moveObject") {
              const content = fieldObject.data.content as unknown as {
                fields: {
                  name: { fields: { index: string } };
                  value: {
                    fields: {
                      blob_id: number[];
                      blob_type: string;
                      iv: number[];
                      created_at: string;
                    };
                  };
                };
              };

              const blobIdBytes = new Uint8Array(content.fields.value.fields.blob_id);
              const blobIdStr = new TextDecoder().decode(blobIdBytes);

              blobRefs.push({
                index: parseInt(content.fields.name.fields.index),
                blobId: blobIdStr,
                blobType: parseInt(content.fields.value.fields.blob_type),
                iv: new Uint8Array(content.fields.value.fields.iv),
                createdAt: parseInt(content.fields.value.fields.created_at),
              });
            }
          } catch (err) {
            console.error(`Failed to fetch blob ref for field:`, err);
          }
        }
      }

      hasNextPage = response.hasNextPage;
      cursor = response.nextCursor ?? null;
    }

    // Sort by index
    blobRefs.sort((a, b) => a.index - b.index);

    return blobRefs;
  } catch (err) {
    console.error("Failed to get blob refs:", err);
    return [];
  }
}

/**
 * Get a single blob reference by index
 */
export async function getBlobRef(
  vaultId: string,
  index: number
): Promise<BlobRefData | null> {
  try {
    const fieldObject = await suiClient.getDynamicFieldObject({
      parentId: vaultId,
      name: {
        type: `${PACKAGE_ID}::${MODULE_NAME}::BlobKey`,
        value: { index: index.toString() },
      },
    });

    if (fieldObject.data?.content?.dataType === "moveObject") {
      const content = fieldObject.data.content as unknown as {
        fields: {
          name: { fields: { index: string } };
          value: {
            fields: {
              blob_id: number[];
              blob_type: string;
              iv: number[];
              created_at: string;
            };
          };
        };
      };

      const blobIdBytes = new Uint8Array(content.fields.value.fields.blob_id);
      const blobIdStr = new TextDecoder().decode(blobIdBytes);

      return {
        index: parseInt(content.fields.name.fields.index),
        blobId: blobIdStr,
        blobType: parseInt(content.fields.value.fields.blob_type),
        iv: new Uint8Array(content.fields.value.fields.iv),
        createdAt: parseInt(content.fields.value.fields.created_at),
      };
    }

    return null;
  } catch {
    return null;
  }
}
