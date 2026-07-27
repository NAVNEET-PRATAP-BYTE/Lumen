import { create } from 'zustand';
import { Peer, FileEntry, FileTransferStatus } from '../types/room';
import { generateId } from '../lib/utils';

// Re-export from types for convenience
export type { FileTransferStatus };
export type RoomStatus = 'idle' | 'joining' | 'active' | 'error';

interface RoomStoreState {
  roomCode: string | null;
  peerId: string;
  displayName: string;

  status: RoomStatus;
  error: string | null;
  isConnected: boolean;
  signalingConnected: boolean;

  peers: Peer[];
  files: FileEntry[];
  selectedFiles: File[];

  /** Injected by WebRTCProvider so UI can trigger downloads/pauses */
  downloadFile:   ((fileId: string) => void) | null;
  pauseDownload:  ((fileId: string) => void) | null;
  resumeDownload: ((fileId: string) => void) | null;
  cancelDownload: ((fileId: string) => void) | null;

  setRoomCode: (code: string | null) => void;
  setStatus: (status: RoomStatus) => void;
  setError: (error: string | null) => void;
  setSignalingConnected: (connected: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setDisplayName: (name: string) => void;

  setDownloadHandlers: (handlers: {
    downloadFile:   (fileId: string) => void;
    pauseDownload:  (fileId: string) => void;
    resumeDownload: (fileId: string) => void;
    cancelDownload: (fileId: string) => void;
  }) => void;

  addPeer:    (peer: Peer) => void;
  removePeer: (peerId: string) => void;
  updatePeerConnectionState: (peerId: string, state: RTCPeerConnectionState) => void;

  addFile:            (file: FileEntry) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  updateFileStatus:   (fileId: string, status: FileTransferStatus) => void;
  removeFile:         (fileId: string) => void;

  setSelectedFiles:  (files: File[]) => void;
  clearSelectedFiles: () => void;

  reset: () => void;
}

const initialPeerId = generateId().slice(0, 8);
const adjectives = ['Swift', 'Bold', 'Calm', 'Deft', 'Epic', 'Keen', 'Vast', 'Zeal'];
const nouns      = ['Fox',  'Owl',  'Puma', 'Lynx', 'Bear', 'Wolf', 'Hawk', 'Crow'];
const initialDisplayName =
  `${adjectives[Math.floor(Math.random() * adjectives.length)] ?? 'Swift'}-` +
  `${nouns[Math.floor(Math.random() * nouns.length)] ?? 'Fox'}`;

export const useRoomStore = create<RoomStoreState>((set) => ({
  roomCode:          null,
  peerId:            initialPeerId,
  displayName:       initialDisplayName,
  status:            'idle',
  error:             null,
  isConnected:       false,
  signalingConnected: false,
  peers:             [],
  files:             [],
  selectedFiles:     [],

  downloadFile:   null,
  pauseDownload:  null,
  resumeDownload: null,
  cancelDownload: null,

  setRoomCode:          (roomCode)          => set({ roomCode }),
  setStatus:            (status)            => set({ status }),
  setError:             (error)             => set({ error }),
  setSignalingConnected: (signalingConnected) => set({ signalingConnected }),
  setIsConnected:       (isConnected)       => set({ isConnected }),
  setDisplayName:       (displayName)       => set({ displayName }),

  setDownloadHandlers: (h) => set({
    downloadFile:   h.downloadFile,
    pauseDownload:  h.pauseDownload,
    resumeDownload: h.resumeDownload,
    cancelDownload: h.cancelDownload,
  }),

  addPeer: (peer) =>
    set((s) => {
      if (s.peers.some((p) => p.peerId === peer.peerId)) return {};
      return { peers: [...s.peers, peer] };
    }),

  removePeer: (peerId) =>
    set((s) => ({ peers: s.peers.filter((p) => p.peerId !== peerId) })),

  updatePeerConnectionState: (peerId, connectionState) =>
    set((s) => {
      const updated = s.peers.map((p) =>
        p.peerId === peerId ? { ...p, connectionState } : p
      );
      return {
        peers:       updated,
        isConnected: updated.some((p) => p.connectionState === 'connected'),
      };
    }),

  addFile: (file) =>
    set((s) => {
      if (s.files.some((f) => f.id === file.id)) return {};
      return { files: [...s.files, file] };
    }),

  updateFileProgress: (fileId, progress) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === fileId ? { ...f, progress } : f)),
    })),

  updateFileStatus: (fileId, status) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.id === fileId
          ? { ...f, status, ...(status === 'complete' ? { completedAt: Date.now() } : {}) }
          : f
      ),
    })),

  removeFile: (fileId) =>
    set((s) => ({ files: s.files.filter((f) => f.id !== fileId) })),

  setSelectedFiles:  (selectedFiles) => set({ selectedFiles }),
  clearSelectedFiles: ()              => set({ selectedFiles: [] }),

  reset: () =>
    set({
      roomCode:          null,
      status:            'idle',
      error:             null,
      isConnected:       false,
      signalingConnected: false,
      peers:             [],
      files:             [],
      selectedFiles:     [],
      downloadFile:      null,
      pauseDownload:     null,
      resumeDownload:    null,
      cancelDownload:    null,
    }),
}));
