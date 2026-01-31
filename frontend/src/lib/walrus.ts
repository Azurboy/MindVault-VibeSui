/**
 * Walrus Storage Service
 *
 * Handles encrypted blob storage on Walrus decentralized storage.
 */

// Walrus aggregator and publisher endpoints
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";

export interface WalrusUploadResult {
  blobId: string;
  endEpoch: number;
}

export interface WalrusBlob {
  data: Uint8Array;
}

/**
 * Upload encrypted data to Walrus
 */
export async function uploadToWalrus(
  encryptedData: Uint8Array,
  epochs: number = 5
): Promise<WalrusUploadResult> {
  // Create a proper ArrayBuffer for the body
  const bodyBuffer = new ArrayBuffer(encryptedData.length);
  new Uint8Array(bodyBuffer).set(encryptedData);

  const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: bodyBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to Walrus: ${error}`);
  }

  const result = await response.json();

  // Handle both newlyCreated and alreadyCertified responses
  if (result.newlyCreated) {
    return {
      blobId: result.newlyCreated.blobObject.blobId,
      endEpoch: result.newlyCreated.blobObject.storage.endEpoch,
    };
  } else if (result.alreadyCertified) {
    return {
      blobId: result.alreadyCertified.blobId,
      endEpoch: result.alreadyCertified.endEpoch,
    };
  }

  throw new Error("Unexpected Walrus response format");
}

/**
 * Download encrypted data from Walrus
 */
export async function downloadFromWalrus(blobId: string): Promise<Uint8Array> {
  const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to download from Walrus: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Check if a blob exists on Walrus
 */
export async function blobExists(blobId: string): Promise<boolean> {
  try {
    const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`, {
      method: "HEAD",
    });
    return response.ok;
  } catch {
    return false;
  }
}
