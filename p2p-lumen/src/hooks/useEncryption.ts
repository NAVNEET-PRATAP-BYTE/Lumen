'use client';

import { generateKeyPair, exportPublicKey, importPublicKey, deriveAesKey } from '../lib/crypto';

/**
 * Thin hook that re-exports crypto helpers for use in components.
 * The actual state (key pair, derived AES keys) lives in WebRTCProvider refs.
 */
export function useEncryption() {
  return {
    generateKeyPair,
    exportPublicKey,
    importPublicKey,
    deriveAesKey,
  };
}
