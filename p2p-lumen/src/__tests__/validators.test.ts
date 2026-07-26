import { describe, it, expect } from 'vitest';
import {
  validateRoomCode,
  generateRoomCode,
  validateFile,
  validateDisplayName,
} from '@/lib/validators';

// ─── validateRoomCode ─────────────────────────────────────────────────────────

describe('validateRoomCode', () => {
  it('accepts valid 6-char alphanumeric codes', () => {
    expect(validateRoomCode('A7B9ZK')).toBe(true);
    expect(validateRoomCode('aAbBcC')).toBe(true);
    expect(validateRoomCode('123456')).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(validateRoomCode('')).toBe(false);
    expect(validateRoomCode('AB12')).toBe(false);
    expect(validateRoomCode('A7B9ZKX')).toBe(false);
  });

  it('rejects special characters', () => {
    expect(validateRoomCode('A7!9ZK')).toBe(false);
    expect(validateRoomCode('A7 9ZK')).toBe(false);
    expect(validateRoomCode('A7_9ZK')).toBe(false);
  });
});

// ─── generateRoomCode ─────────────────────────────────────────────────────────

describe('generateRoomCode', () => {
  it('generates a valid 6-char code', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(validateRoomCode(code)).toBe(true);
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 200 }, generateRoomCode));
    expect(codes.size).toBeGreaterThan(190); // very unlikely to repeat
  });
});

// ─── validateFile ─────────────────────────────────────────────────────────────

describe('validateFile', () => {
  const makeFile = (name: string, size: number, type: string) =>
    new File(['x'.repeat(Math.min(size, 100))], name, { type });

  it('accepts valid file types', () => {
    expect(validateFile(makeFile('photo.jpg', 1000, 'image/jpeg')).valid).toBe(true);
    expect(validateFile(makeFile('doc.pdf', 1000, 'application/pdf')).valid).toBe(true);
    expect(validateFile(makeFile('data.json', 100, 'application/json')).valid).toBe(true);
    expect(validateFile(makeFile('bin.exe', 100, 'application/octet-stream')).valid).toBe(true);
  });

  it('rejects empty files', () => {
    const result = validateFile(new File([], 'empty.txt', { type: 'text/plain' }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('rejects files over 2 GB', () => {
    const oversized = makeFile('big.zip', 1000, 'application/zip');
    Object.defineProperty(oversized, 'size', { value: 3 * 1024 * 1024 * 1024 });
    const result = validateFile(oversized);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });
});

// ─── validateDisplayName ─────────────────────────────────────────────────────

describe('validateDisplayName', () => {
  it('accepts valid names', () => {
    expect(validateDisplayName('Alice').valid).toBe(true);
    expect(validateDisplayName('Swift-Fox').valid).toBe(true);
    expect(validateDisplayName('ab').valid).toBe(true);
  });

  it('rejects names that are too short', () => {
    expect(validateDisplayName('a').valid).toBe(false);
    expect(validateDisplayName(' ').valid).toBe(false);
  });

  it('rejects names that are too long', () => {
    expect(validateDisplayName('a'.repeat(21)).valid).toBe(false);
  });

  it('rejects names with HTML characters', () => {
    expect(validateDisplayName('<script>').valid).toBe(false);
    expect(validateDisplayName('Me & You').valid).toBe(false);
    expect(validateDisplayName('"name"').valid).toBe(false);
  });
});
