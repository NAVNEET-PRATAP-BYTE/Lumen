// ─── Room & Peer Types ───────────────────────────────────────────────────────

export interface Peer {
  peerId: string;
  displayName: string;
  roomCode: string;
  connectionState: RTCPeerConnectionState;
  joinedAt: number;
}

export type FileTransferStatus =
  | 'idle'
  | 'pending'       // receiver: offer received, waiting for user action
  | 'preparing'
  | 'transmitting'
  | 'paused'        // receiver paused mid-download
  | 'complete'
  | 'cancelled'
  | 'error';

export interface FileEntry {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  status: FileTransferStatus;
  progress: number;
  chunkCount?: number;
  direction: 'send' | 'receive';
  startedAt?: number;
  completedAt?: number;
}
