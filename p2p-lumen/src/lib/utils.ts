// ─── Formatting Utilities ────────────────────────────────────────────────────

/**
 * Formats raw bytes into a human-readable string (e.g. "10.50 MB").
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const label = sizes[i] ?? 'Bytes';
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${label}`;
}

/**
 * Formats seconds into "MM:SS" display string.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generates a cryptographically random UUID v4.
 */
export function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Checks if a MIME type matches a prefix pattern (e.g. "image/" matches "image/png").
 */
export function matchMime(type: string, pattern: string): boolean {
  if (pattern.endsWith('/')) {
    return type.startsWith(pattern);
  }
  return type === pattern;
}

/**
 * Returns a short display variant of a peer ID (first 8 chars).
 */
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns a promise that resolves after `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
