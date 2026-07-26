# Data Schema (Schema.md)
## P2P File Share — TypeScript Interfaces, Types, and Validation

**Version:** 1.0.0  
**Last Updated:** 2026-07-15

---

## 1. Core Domain Types

### 1.1 Room

```typescript
// types/room.ts

export interface Room {
  code: string;                    // 6-character alphanumeric room code
  createdAt: number;               // Unix timestamp (ms)
  createdBy: string;               // Peer ID of creator
  maxPeers: number;                // Hard limit: 6
  peerIds: string[];               // List of connected peer IDs
}

export interface RoomSummary {
  code: string;
  peerCount: number;
  createdAt: number;
}
```

### 1.2 Peer

```typescript
export interface Peer {
  peerId: string;                  // Unique peer identifier (UUID or short ID)
  displayName: string;             // User-editable display name
  roomCode: string;                // Room this peer belongs to
  connectionState: RTCPeerConnectionState; // WebRTC connection state
  joinedAt: number;                // Unix timestamp (ms)
  lastSeen: number;                // Unix timestamp (ms) — updated on activity
}

export interface PeerSummary {
  peerId: string;
  displayName: string;
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'failed';
}
```

### 1.3 File Entry

```typescript
export interface FileEntry {
  id: string;                      // Unique file transfer ID (UUID)
  fileName: string;                // Original file name
  fileSize: number;                // Size in bytes
  fileType: string;                // MIME type
  senderId: string;                // Peer ID of sender
  senderName: string;              // Display name of sender
  status: FileTransferStatus;      // Current transfer status
  progress: number;                // 0–100 percentage
  chunkCount: number;              // Total chunks
  receivedChunks: number;          // Chunks received so far
}

export type FileTransferStatus = 
  | 'idle'          // File selected, not yet sent
  | 'preparing'     // Encrypting, chunking
  | 'transmitting'  // Actively sending/receiving
  | 'complete'      // Transfer finished successfully
  | 'error';        // Transfer failed

export interface FileMeta {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  chunkCount: number;
}
```

### 1.4 Encryption Keys

```typescript
export interface ECDHKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptionContext {
  ecdhKeyPair: ECDHKeyPair;
  aesKey: CryptoKey;               // Derived AES-256-GCM key
  peerPublicKeys: Map<string, CryptoKey>; // peerId → public key
}
```

---

## 2. Signaling Message Types

```typescript
// types/signaling.ts

export type SignalingMessage =
  | JoinMessage
  | LeaveMessage
  | PeersListMessage
  | UserJoinedMessage
  | UserLeftMessage
  | SignalMessage
  | ErrorMessage;

export interface BaseMessage {
  type: string;
  timestamp: number;
}

export interface JoinMessage extends BaseMessage {
  type: 'join';
  roomCode: string;
  peerId: string;
  displayName: string;
}

export interface LeaveMessage extends BaseMessage {
  type: 'leave';
  roomCode: string;
  peerId: string;
}

export interface PeersListMessage extends BaseMessage {
  type: 'peers-list';
  roomCode: string;
  peers: PeerInfo[];
}

export interface PeerInfo {
  peerId: string;
  displayName: string;
  connectedAt: number;
}

export interface UserJoinedMessage extends BaseMessage {
  type: 'user-joined';
  roomCode: string;
  peerId: string;
  displayName: string;
}

export interface UserLeftMessage extends BaseMessage {
  type: 'user-left';
  roomCode: string;
  peerId: string;
}

export interface SignalMessage extends BaseMessage {
  type: 'signal';
  roomCode: string;
  from: string;
  to?: string;                     // Optional: direct peer target
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
  code?: string;
}
```

---

## 3. WebRTC Data Channel Messages

```typescript
// types/webrtc.ts

export type DataChannelMessage =
  | FileMetaMessage
  | ChunkMessage
  | CompleteMessage
  | ErrorDataMessage;

export interface FileMetaMessage {
  type: 'file-meta';
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  chunkCount: number;
  totalChunks: number;
}

export interface ChunkMessage {
  type: 'chunk';
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  iv: Uint8Array;                  // 12 bytes for AES-GCM
  encryptedData: ArrayBuffer;      // Encrypted + compressed chunk
  originalSize: number;            // Original size before compression
}

export interface CompleteMessage {
  type: 'complete';
  fileId: string;
  totalChunks: number;
  checksum?: string;               // SHA-256 hash for integrity verification
}

export interface ErrorDataMessage {
  type: 'error';
  fileId: string;
  message: string;
}
```

---

## 4. Zustand Store Schema

```typescript
// store/roomStore.ts

export interface RoomStore {
  // Room identity
  roomCode: string | null;
  peerId: string;                  // Local peer's ID
  displayName: string;

  // Room status
  status: RoomStatus;
  error: string | null;

  // Peers
  peers: Peer[];

  // Files
  files: FileEntry[];
  selectedFiles: File[];

  // Connection
  isConnected: boolean;
  signalingConnected: boolean;

  // Actions
  setRoomCode: (code: string) => void;
  setStatus: (status: RoomStatus) => void;
  setError: (error: string | null) => void;
  setSignalingConnected: (connected: boolean) => void;
  addPeer: (peer: Peer) => void;
  removePeer: (peerId: string) => void;
  updatePeerConnectionState: (peerId: string, state: RTCPeerConnectionState) => void;
  setDisplayName: (name: string) => void;
  addFile: (file: FileEntry) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  updateFileStatus: (fileId: string, status: FileTransferStatus) => void;
  incrementReceivedChunks: (fileId: string) => void;
  setSelectedFiles: (files: File[]) => void;
  clearSelectedFiles: () => void;
  reset: () => void;
}

export type RoomStatus = 
  | 'idle'        // Initial state
  | 'joining'     // Connecting to signaling server
  | 'active'      // Connected to room, WebRTC established
  | 'error';      // Something went wrong
```

---

## 5. WebRTC Configuration Types

```typescript
// types/webrtc.ts

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy: RTCPeerConnection['iceTransportPolicy'];
  iceCandidatePoolSize: number;
}

export interface PeerConnectionMap {
  [peerId: string]: RTCPeerConnection;
}

export interface DataChannelMap {
  [peerId: string]: RTCDataChannel;
}

export interface TransferSession {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  totalChunks: number;
  chunkSize: number;
  direction: 'send' | 'receive';
  receivedChunks: Map<number, ArrayBuffer>;
  aesKey: CryptoKey;
  status: FileTransferStatus;
  progress: number;
}
```

---

## 6. Validation Schemas

### 6.1 Room Code Validation

```typescript
// lib/validators.ts

export const ROOM_CODE_REGEX = /^[A-Za-z0-9]{6}$/;

export function validateRoomCode(code: string): boolean {
  return ROOM_CODE_REGEX.test(code);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

### 6.2 File Validation

```typescript
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

const ALLOWED_MIME_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File exceeds maximum size of ${formatBytes(MAX_FILE_SIZE)}` };
  }

  const isAllowed = ALLOWED_MIME_TYPES.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });

  if (!isAllowed) {
    return { valid: false, error: `File type "${file.type}" is not allowed` };
  }

  return { valid: true };
}
```

### 6.3 Display Name Validation

```typescript
export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'Name must be at most 20 characters' };
  }
  if (/[<>"'&]/.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  return { valid: true };
}
```

---

## 7. Utility Types

### 7.1 Formatters

```typescript
// lib/utils.ts

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function matchMime(type: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    return type.startsWith(pattern.slice(0, -1));
  }
  return type === pattern;
}
```

### 7.2 Chunking

```typescript
export const CHUNK_SIZE = 64 * 1024; // 64 KB

export async function* readFileChunks(file: File): AsyncGenerator<ArrayBuffer> {
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();
    offset += buffer.byteLength;
    yield buffer;
  }
}

export function reassembleChunks(chunks: Map<number, ArrayBuffer>, totalChunks: number): Blob {
  const sorted = Array.from(chunks.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, buffer]) => new Uint8Array(buffer));

  return new Blob(sorted, { type: 'application/octet-stream' });
}
```

---

## 8. API Response Types

```typescript
// types/api.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  redis: boolean;
  uptime: number;
}
```

---

## 9. Event Types

```typescript
// types/events.ts

export type RoomEvent =
  | { type: 'peer-joined'; peer: Peer }
  | { type: 'peer-left'; peerId: string }
  | { type: 'file-added'; file: FileEntry }
  | { type: 'file-updated'; fileId: string; updates: Partial<FileEntry> }
  | { type: 'connection-state-changed'; peerId: string; state: RTCPeerConnectionState };

export type WebRTCEvent =
  | { type: 'ice-candidate'; candidate: RTCIceCandidate }
  | { type: 'data-channel-open'; peerId: string }
  | { type: 'data-channel-message'; data: DataChannelMessage }
  | { type: 'connection-state-change'; state: RTCPeerConnectionState };
```

---

## 10. Configuration Constants

```typescript
// lib/constants.ts

export const CONFIG = {
  ROOM_CODE_LENGTH: 6,
  MAX_PEERS_PER_ROOM: 6,
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2 GB
  CHUNK_SIZE: 64 * 1024,                 // 64 KB
  MAX_BUFFERED_AMOUNT: 256 * 1024,       // 256 KB
  CONNECTION_TIMEOUT: 15000,             // 15 seconds
  IDLE_TIMEOUT: 5 * 60 * 1000,           // 5 minutes
  RECONNECT_MAX_ATTEMPTS: 3,
  RECONNECT_BASE_DELAY: 1000,            // 1 second
} as const;

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: `turn:${process.env.NEXT_PUBLIC_TURN_URL || 'turn.example.com'}:3478`,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME || 'user',
    credential: process.env.NEXT_PUBLIC_TURN_PASSWORD || 'pass',
  },
];

export const ALLOWED_MIME_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
```

---

## 11. Type Guards

```typescript
// lib/typeGuards.ts

export function isFileMetaMessage(msg: unknown): msg is FileMetaMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'file-meta' &&
    typeof (msg as any).fileId === 'string' &&
    typeof (msg as any).fileName === 'string' &&
    typeof (msg as any).fileSize === 'number'
  );
}

export function isChunkMessage(msg: unknown): msg is ChunkMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as any).type === 'chunk' &&
    typeof (msg as any).fileId === 'string' &&
    typeof (msg as any).chunkIndex === 'number' &&
    ArrayBuffer.isView((msg as any).encryptedData)
  );
}

export function isSignalingMessage(msg: unknown): msg is SignalingMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    typeof (msg as any).type === 'string' &&
    ['join', 'leave', 'peers-list', 'user-joined', 'user-left', 'signal', 'error'].includes((msg as any).type)
  );
}
```

---

## 12. Validation Summary

| Data | Validation Rule | Location |
|------|-----------------|----------|
| Room code | `/^[A-Za-z0-9]{6}$/` | `validators.ts` |
| Display name | 2–20 chars, no HTML special chars | `validators.ts` |
| File size | ≤ 2 GB | `validators.ts` |
| MIME type | Allowlist check | `validators.ts` |
| Signaling message | JSON parse + type guard | `signaling.ts` |
| WebRTC message | Type guard (isFileMetaMessage, isChunkMessage) | `typeGuards.ts` |
