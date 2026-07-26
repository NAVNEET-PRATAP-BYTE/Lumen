// ─── Room & Peer Types ───────────────────────────────────────────────────────

export interface Room {
  code: string;
  createdAt: number;
  createdBy: string;
  maxPeers: number;
  peerIds: string[];
}

export interface Peer {
  peerId: string;
  displayName: string;
  roomCode: string;
  connectionState: RTCPeerConnectionState;
  joinedAt: number;
}

// ─── File Transfer Types ─────────────────────────────────────────────────────

export type FileTransferStatus =
  | 'idle'
  | 'preparing'
  | 'compressing'
  | 'encrypting'
  | 'transmitting'
  | 'complete'
  | 'error';

export interface FileEntry {
  /** Unique file transfer session ID */
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  status: FileTransferStatus;
  /** 0–100 percentage */
  progress: number;
  chunkCount?: number;
  receivedChunks?: number;
  direction: 'send' | 'receive';
  /** Timestamp when transfer started */
  startedAt?: number;
  /** Timestamp when transfer completed */
  completedAt?: number;
}
