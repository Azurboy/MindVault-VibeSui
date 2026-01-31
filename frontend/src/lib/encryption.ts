/**
 * MindVault Encryption Service
 *
 * Client-side AES-256-GCM encryption with key derivation from wallet signature.
 * The encryption key never leaves the browser - only the user can decrypt their data.
 */

export class EncryptionService {
  private key: CryptoKey | null = null;
  private initialized = false;

  /**
   * Derive encryption key from wallet signature
   * Uses HKDF to derive a deterministic AES-256 key from the wallet's signature
   */
  async deriveKeyFromWallet(
    signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  ): Promise<void> {
    // 1. Sign a fixed message to get deterministic key material
    const message = new TextEncoder().encode("mindvault-encryption-key-v1");
    const { signature } = await signMessage(message);

    // 2. Import signature as key material for HKDF
    // Create a new ArrayBuffer to ensure compatibility
    const signatureBuffer = new ArrayBuffer(signature.length);
    new Uint8Array(signatureBuffer).set(signature);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      signatureBuffer,
      "HKDF",
      false,
      ["deriveKey"]
    );

    // 3. Derive AES-256-GCM key using HKDF
    const saltBuffer = new ArrayBuffer(17);
    new Uint8Array(saltBuffer).set(new TextEncoder().encode("mindvault-salt-v1"));

    const infoBuffer = new ArrayBuffer(11);
    new Uint8Array(infoBuffer).set(new TextEncoder().encode("aes-gcm-key"));

    this.key = await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: saltBuffer,
        info: infoBuffer,
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    this.initialized = true;
  }

  /**
   * Check if encryption service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.key !== null;
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * Returns ciphertext and IV (initialization vector)
   */
  async encrypt(plaintext: string): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
    if (!this.key) {
      throw new Error("Encryption key not initialized. Call deriveKeyFromWallet first.");
    }

    // Generate random IV for each encryption
    const ivBuffer = new ArrayBuffer(12);
    const iv = new Uint8Array(ivBuffer);
    crypto.getRandomValues(iv);

    const encoded = new TextEncoder().encode(plaintext);
    const encodedBuffer = new ArrayBuffer(encoded.length);
    new Uint8Array(encodedBuffer).set(encoded);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: ivBuffer },
      this.key,
      encodedBuffer
    );

    return {
      ciphertext: new Uint8Array(ciphertext),
      iv,
    };
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   */
  async decrypt(ciphertext: Uint8Array, iv: Uint8Array): Promise<string> {
    if (!this.key) {
      throw new Error("Encryption key not initialized. Call deriveKeyFromWallet first.");
    }

    // Create proper ArrayBuffers
    const ivBuffer = new ArrayBuffer(iv.length);
    new Uint8Array(ivBuffer).set(iv);

    const ciphertextBuffer = new ArrayBuffer(ciphertext.length);
    new Uint8Array(ciphertextBuffer).set(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      this.key,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Clear the encryption key from memory
   */
  clear(): void {
    this.key = null;
    this.initialized = false;
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}

/**
 * Utility: Convert Uint8Array to hex string
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Utility: Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Utility: Convert Uint8Array to base64
 */
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Utility: Convert base64 to Uint8Array
 */
export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
