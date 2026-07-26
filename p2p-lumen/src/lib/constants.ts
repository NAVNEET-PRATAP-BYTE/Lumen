// ─── Application-wide Constants ──────────────────────────────────────────────

export const CONFIG = {
  /** Room code: 6-character alphanumeric string */
  ROOM_CODE_LENGTH: 6,
  /** Maximum peers allowed in a single room */
  MAX_PEERS_PER_ROOM: 6,
  /** 2 GB file size limit */
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024,
  /** 64 KB chunk size for streaming */
  CHUNK_SIZE: 64 * 1024,
  /** DataChannel backpressure threshold: pause if buffer exceeds this */
  MAX_BUFFERED_AMOUNT: 256 * 1024,
  /** WebRTC connection timeout in ms */
  CONNECTION_TIMEOUT: 15_000,
  /** Auto-close idle DataChannel after 5 minutes */
  IDLE_TIMEOUT: 5 * 60 * 1000,
  /** Max WebSocket reconnect attempts */
  RECONNECT_MAX_ATTEMPTS: 3,
  /** Base delay for exponential backoff in ms */
  RECONNECT_BASE_DELAY: 1_000,
} as const;

// ─── ICE Server Configuration ─────────────────────────────────────────────────

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // TURN server — set env vars to enable (helps with symmetric NAT)
  ...(process.env.NEXT_PUBLIC_TURN_URL
    ? [
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? '',
          credential: process.env.NEXT_PUBLIC_TURN_PASSWORD ?? '',
        },
      ]
    : []),
];

// ─── Allowed File Types ───────────────────────────────────────────────────────

export const ALLOWED_MIME_PATTERNS: string[] = [
  'image/',
  'video/',
  'audio/',
  'text/',
  'application/pdf',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json',
  'application/x-tar',
  'application/octet-stream',
];
