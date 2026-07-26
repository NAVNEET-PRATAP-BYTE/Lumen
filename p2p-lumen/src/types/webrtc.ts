import { FileTransferStatus } from './room';

// ─── WebRTC Configuration ────────────────────────────────────────────────────

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  iceCandidatePoolSize?: number;
}

// ─── DataChannel Message Protocol ────────────────────────────────────────────

/** Sent over the DataChannel as JSON (except chunk encryptedData which is base64) */
export type DataChannelMessage =
  | {
      type: 'key-exchange';
      /** Base64-encoded ECDH P-384 public key (raw format) */
      publicKey: string;
    }
  | {
      type: 'file-meta';
      fileId: string;
      fileName: string;
      fileSize: number;
      fileType: string;
      senderId: string;
      senderName: string;
      chunkCount: number;
    }
  | {
      type: 'chunk';
      fileId: string;
      chunkIndex: number;
      /** Base64-encoded 12-byte IV */
      iv: string;
      /** Base64-encoded encrypted+compressed chunk data */
      encryptedData: string;
      totalChunks: number;
    }
  | {
      type: 'complete';
      fileId: string;
      totalChunks: number;
    }
  | {
      type: 'error';
      fileId: string;
      message: string;
    };

// ─── Transfer Session (in-memory state) ──────────────────────────────────────

export interface TransferSession {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  totalChunks: number;
  direction: 'send' | 'receive';
  receivedChunks: Map<number, ArrayBuffer>;
  aesKey?: CryptoKey;
  status: FileTransferStatus;
  progress: number;
}
