import { FileTransferStatus } from './room';

export type DataChannelMessage =
  | { type: 'key-exchange'; publicKey: string }
  // Phase 1 – sender broadcasts metadata only (no data yet)
  | { type: 'file-offer'; fileId: string; fileName: string; fileSize: number; fileType: string; senderId: string; senderName: string; chunkCount: number }
  // Phase 2 – receiver decides
  | { type: 'download-accept';  fileId: string }
  | { type: 'download-pause';   fileId: string }
  | { type: 'download-resume';  fileId: string }
  | { type: 'download-cancel';  fileId: string }
  // Phase 3 – sender streams encrypted chunks
  | { type: 'chunk'; fileId: string; chunkIndex: number; iv: string; encryptedData: string; totalChunks: number }
  | { type: 'complete'; fileId: string; totalChunks: number }
  | { type: 'error'; fileId: string; message: string };

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
