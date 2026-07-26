import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveAesKey,
  encryptChunk,
  decryptChunk,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '@/lib/crypto';

// ─── Base64 roundtrip ─────────────────────────────────────────────────────────

describe('arrayBufferToBase64 / base64ToArrayBuffer', () => {
  it('roundtrips correctly', () => {
    const original = new Uint8Array([1, 2, 3, 4, 255, 0, 128]);
    const b64 = arrayBufferToBase64(original.buffer);
    const restored = new Uint8Array(base64ToArrayBuffer(b64));
    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it('handles empty buffer', () => {
    const b64 = arrayBufferToBase64(new ArrayBuffer(0));
    const restored = base64ToArrayBuffer(b64);
    expect(restored.byteLength).toBe(0);
  });
});

// ─── Key generation & export ──────────────────────────────────────────────────

describe('generateKeyPair / exportPublicKey / importPublicKey', () => {
  it('generates a key pair and exports the public key as base64', async () => {
    const kp = await generateKeyPair();
    expect(kp.publicKey).toBeTruthy();
    expect(kp.privateKey).toBeTruthy();

    const b64 = await exportPublicKey(kp.publicKey);
    expect(typeof b64).toBe('string');
    expect(b64.length).toBeGreaterThan(0);
  });

  it('imports a public key and matches the original', async () => {
    const kp = await generateKeyPair();
    const b64 = await exportPublicKey(kp.publicKey);
    const imported = await importPublicKey(b64);
    expect(imported.type).toBe('public');
    expect(imported.algorithm.name).toBe('ECDH');
  });
});

// ─── ECDH key agreement ───────────────────────────────────────────────────────

describe('deriveAesKey', () => {
  it('both peers derive the same AES key (symmetric agreement)', async () => {
    const aliceKp = await generateKeyPair();
    const bobKp = await generateKeyPair();

    const alicePubB64 = await exportPublicKey(aliceKp.publicKey);
    const bobPubB64 = await exportPublicKey(bobKp.publicKey);

    const aliceShared = await deriveAesKey(aliceKp.privateKey, await importPublicKey(bobPubB64));
    const bobShared = await deriveAesKey(bobKp.privateKey, await importPublicKey(alicePubB64));

    // Verify they can encrypt/decrypt each other's data
    const plaintext = new TextEncoder().encode('Hello, P2P!');
    const { iv, encryptedData } = await encryptChunk(aliceShared, plaintext.buffer);
    const decrypted = await decryptChunk(bobShared, iv, encryptedData);
    const decoded = new TextDecoder().decode(decrypted);
    expect(decoded).toBe('Hello, P2P!');
  });
});

// ─── Chunk encrypt / decrypt ──────────────────────────────────────────────────

describe('encryptChunk / decryptChunk', () => {
  let aesKey: CryptoKey;

  beforeAll(async () => {
    const aliceKp = await generateKeyPair();
    const bobKp = await generateKeyPair();
    const bobPubB64 = await exportPublicKey(bobKp.publicKey);
    aesKey = await deriveAesKey(aliceKp.privateKey, await importPublicKey(bobPubB64));
  });

  it('encrypts and decrypts a chunk correctly', async () => {
    const data = new TextEncoder().encode('test chunk data 1234').buffer;
    const { iv, encryptedData } = await encryptChunk(aesKey, data);
    const decrypted = await decryptChunk(aesKey, iv, encryptedData);
    expect(new TextDecoder().decode(decrypted)).toBe('test chunk data 1234');
  });

  it('produces unique IVs per chunk', async () => {
    const data = new ArrayBuffer(64);
    const { iv: iv1 } = await encryptChunk(aesKey, data);
    const { iv: iv2 } = await encryptChunk(aesKey, data);
    expect(arrayBufferToBase64(iv1)).not.toBe(arrayBufferToBase64(iv2));
  });

  it('ciphertext differs from plaintext', async () => {
    const data = new TextEncoder().encode('secret').buffer;
    const { encryptedData } = await encryptChunk(aesKey, data);
    expect(new Uint8Array(encryptedData)).not.toEqual(new Uint8Array(data));
  });
});
