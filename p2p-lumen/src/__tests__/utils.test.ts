import { describe, it, expect } from 'vitest';
import { formatBytes, formatTime, generateId, matchMime, shortId } from '@/lib/utils';

describe('formatBytes', () => {
  it('returns "0 Bytes" for zero', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('respects decimal places', () => {
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
    expect(formatBytes(1536, 0)).toBe('2 KB');
  });
});

describe('formatTime', () => {
  it('formats seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(3661)).toBe('61:01');
  });

  it('handles invalid input gracefully', () => {
    expect(formatTime(-1)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

describe('matchMime', () => {
  it('matches prefix patterns', () => {
    expect(matchMime('image/png', 'image/')).toBe(true);
    expect(matchMime('video/mp4', 'video/')).toBe(true);
    expect(matchMime('text/plain', 'image/')).toBe(false);
  });

  it('matches exact types', () => {
    expect(matchMime('application/pdf', 'application/pdf')).toBe(true);
    expect(matchMime('application/json', 'application/pdf')).toBe(false);
  });
});

describe('shortId', () => {
  it('returns first 8 chars uppercased', () => {
    expect(shortId('abcdefghij')).toBe('ABCDEFGH');
  });
});
