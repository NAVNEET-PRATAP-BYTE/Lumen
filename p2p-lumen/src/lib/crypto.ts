// ─── Web Crypto API Utilities (E2E Encryption) ───────────────────────────────
//
//  Protocol:
//    1. Each peer generates an ephemeral ECDH P-384 key pair on session start.
//    2. Public keys are exchanged over the open DataChannel (key-exchange msg).
//    3. Both sides independently derive the same AES-256-GCM symmetric key via ECDH.
//    4. Every chunk is encrypted with a unique 12-byte IV; IV + ciphertext are sent together.

const getCrypto = (): Crypto => {
  if (typeof globalThis.crypto !== 'undefined') return globalThis.crypto;
  throw new Error('Web Crypto API is not available in this environment');
};

// ─── Base64 Helpers ───────────────────────────────────────────────────────────

/** Converts an ArrayBuffer to a base64-encoded string. */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/** Converts a base64-encoded string back to an ArrayBuffer. */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── ECDH Key Generation & Export ─────────────────────────────────────────────

/**
 * Generates an ephemeral ECDH P-384 key pair.
 * Both keys are extractable so the public key can be exported for exchange.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return getCrypto().subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-384' },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Exports a CryptoKey public key to a base64-encoded raw bytes string.
 * The raw format is the uncompressed point representation (97 bytes for P-384).
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await getCrypto().subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Imports a base64-encoded raw public key back into a CryptoKey object.
 */
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const buffer = base64ToArrayBuffer(base64);
  return getCrypto().subtle.importKey(
    'raw',
    buffer,
    { name: 'ECDH', namedCurve: 'P-384' },
    true,
    [] // public keys have no usage flags
  );
}

// ─── AES-256-GCM Key Derivation ───────────────────────────────────────────────

/**
 * Derives a symmetric AES-256-GCM key from the local private key and the
 * remote peer's public key using ECDH key agreement.
 */
export async function deriveAesKey(
  localPrivateKey: CryptoKey,
  remotePublicKey: CryptoKey
): Promise<CryptoKey> {
  return getCrypto().subtle.deriveKey(
    { name: 'ECDH', public: remotePublicKey },
    localPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable — stays in memory only
    ['encrypt', 'decrypt']
  );
}

// ─── Chunk Encryption / Decryption ────────────────────────────────────────────

/** Encrypts one chunk of data using AES-256-GCM with a unique random IV. */
export async function encryptChunk(
  aesKey: CryptoKey,
  data: ArrayBuffer
): Promise<{ iv: Uint8Array; encryptedData: ArrayBuffer }> {
  const crypto = getCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );
  return { iv, encryptedData };
}

/** Decrypts one chunk using AES-256-GCM with its paired IV. */
export async function decryptChunk(
  aesKey: CryptoKey,
  iv: Uint8Array,
  encryptedData: ArrayBuffer
): Promise<ArrayBuffer> {
  return getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedData
  );
}
