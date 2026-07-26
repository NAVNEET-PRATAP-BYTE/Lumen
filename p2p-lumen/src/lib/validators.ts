import { CONFIG, ALLOWED_MIME_PATTERNS } from './constants';
import { formatBytes, matchMime } from './utils';

// ─── Room Code ────────────────────────────────────────────────────────────────

const ROOM_CODE_REGEX = /^[A-Za-z0-9]{6}$/;
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Returns true if the room code is a valid 6-character alphanumeric string.
 */
export function validateRoomCode(code: string): boolean {
  return ROOM_CODE_REGEX.test(code);
}

/**
 * Generates a cryptographically random 6-character alphanumeric room code.
 */
export function generateRoomCode(): string {
  const bytes = new Uint8Array(CONFIG.ROOM_CODE_LENGTH);
  (typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : { getRandomValues: (a: Uint8Array) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } }).getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length] ?? 'A')
    .join('');
}

// ─── File Validation ──────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file's size and MIME type against the allowlist.
 */
export function validateFile(file: File): ValidationResult {
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${formatBytes(CONFIG.MAX_FILE_SIZE)}`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  const mime = file.type || 'application/octet-stream';
  const isAllowed = ALLOWED_MIME_PATTERNS.some((pattern) => matchMime(mime, pattern));

  if (!isAllowed) {
    return {
      valid: false,
      error: `File type "${mime}" is not allowed`,
    };
  }

  return { valid: true };
}

// ─── Display Name ─────────────────────────────────────────────────────────────

const HTML_SPECIAL_CHARS_REGEX = /[<>"'&]/;

/**
 * Validates a display name: 2–20 chars, no HTML special chars.
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Name must be at most 20 characters' };
  }

  if (HTML_SPECIAL_CHARS_REGEX.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters (< > " \' &)' };
  }

  return { valid: true };
}
