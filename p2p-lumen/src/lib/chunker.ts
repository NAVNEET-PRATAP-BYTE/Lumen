import { CONFIG } from './constants';

// ─── File Chunking ────────────────────────────────────────────────────────────

/**
 * Reads a File in sequential 64 KB chunks as an async generator.
 * Memory-safe: never loads the whole file at once.
 */
export async function* readFileChunks(file: File): AsyncGenerator<ArrayBuffer, void, unknown> {
  let offset = 0;

  while (offset < file.size) {
    const slice = file.slice(offset, offset + CONFIG.CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();
    offset += buffer.byteLength;
    yield buffer;
  }
}

// ─── Compression ─────────────────────────────────────────────────────────────

/**
 * Compresses an ArrayBuffer using the native CompressionStream API (gzip).
 * Falls back gracefully if the API is unavailable (e.g. older browsers).
 */
export async function compressChunk(data: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof CompressionStream === 'undefined') {
    return data; // no-op fallback
  }
  try {
    const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
    return await new Response(stream).arrayBuffer();
  } catch {
    console.warn('[chunker] Compression failed — sending uncompressed');
    return data;
  }
}

/**
 * Decompresses a gzip-compressed ArrayBuffer using DecompressionStream.
 * Falls back gracefully if the API is unavailable.
 */
export async function decompressChunk(data: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === 'undefined') {
    return data; // no-op fallback
  }
  try {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).arrayBuffer();
  } catch {
    console.warn('[chunker] Decompression failed — using raw buffer');
    return data;
  }
}

// ─── Chunk Reassembly ─────────────────────────────────────────────────────────

/**
 * Reassembles chunks stored by index into a final Blob, preserving order.
 */
export function reassembleChunks(
  chunks: Map<number, ArrayBuffer>,
  fileType: string
): Blob {
  const sorted = Array.from(chunks.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, buf]) => buf);

  return new Blob(sorted, { type: fileType || 'application/octet-stream' });
}
