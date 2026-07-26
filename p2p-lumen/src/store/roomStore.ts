import { create } from 'zustand';
import { Peer, FileEntry, FileTransferStatus } from '../types/room';
import { generateId } from '../lib/utils';

export type RoomStatus = 'idle' | 'joining' | 'active' | 'error';

interface RoomStoreState {
  // ── Identity ─────────────────────────────────────────────────────────────
  roomCode: string | null;
  peerId: string;
  displayName: string;

  // ── Status ────────────────────────────────────────────────────────────────
  status: RoomStatus;
  error: string | null;
  isConnected: boolean;
  signalingConnected: boolean;

  // ── Collections ──────────────────────────────────────────────────────────
  peers: Peer[];
  files: FileEntry[];
  selectedFiles: File[];

  // ── Actions ───────────────────────────────────────────────────────────────
  setRoomCode: (code: string | null) => void;
  setStatus: (status: RoomStatus) => void;
  setError: (error: string | null) => void;
  setSignalingConnected: (connected: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setDisplayName: (name: string) => void;

  addPeer: (peer: Peer) => void;
  removePeer: (peerId: string) => void;
  updatePeerConnectionState: (peerId: string, state: RTCPeerConnectionState) => void;

  addFile: (file: FileEntry) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  updateFileStatus: (fileId: string, status: FileTransferStatus) => void;

  setSelectedFiles: (files: File[]) => void;
  clearSelectedFiles: () => void;

  reset: () => void;
}

// Generate ephemeral peer ID and a friendly default display name
const initialPeerId = generateId().slice(0, 8);
const adjectives = ['Swift', 'Bold', 'Calm', 'Deft', 'Epic', 'Keen', 'Vast', 'Zeal'];
const nouns = ['Fox', 'Owl', 'Puma', 'Lynx', 'Bear', 'Wolf', 'Hawk', 'Crow'];
const initialDisplayName = `${adjectives[Math.floor(Math.random() * adjectives.length)] ?? 'Swift'}-${nouns[Math.floor(Math.random() * nouns.length)] ?? 'Fox'}`;

export const useRoomStore = create<RoomStoreState>((set) => ({
  // ── Identity ──────────────────────────────────────────────────────────────
  roomCode: null,
  peerId: initialPeerId,
  displayName: initialDisplayName,

  // ── Status ────────────────────────────────────────────────────────────────
  status: 'idle',
  error: null,
  isConnected: false,
  signalingConnected: false,

  // ── Collections ───────────────────────────────────────────────────────────
  peers: [],
  files: [],
  selectedFiles: [],

  // ── Actions ───────────────────────────────────────────────────────────────
  setRoomCode: (roomCode) => set({ roomCode }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setSignalingConnected: (signalingConnected) => set({ signalingConnected }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setDisplayName: (displayName) => set({ displayName }),

  addPeer: (peer) =>
    set((state) => {
      if (state.peers.some((p) => p.peerId === peer.peerId)) return {};
      return { peers: [...state.peers, peer] };
    }),

  removePeer: (peerId) =>
    set((state) => ({
      peers: state.peers.filter((p) => p.peerId !== peerId),
    })),

  updatePeerConnectionState: (peerId, connectionState) =>
    set((state) => {
      const updated = state.peers.map((p) =>
        p.peerId === peerId ? { ...p, connectionState } : p
      );
      return {
        peers: updated,
        isConnected: updated.some((p) => p.connectionState === 'connected'),
      };
    }),

  addFile: (file) =>
    set((state) => {
      if (state.files.some((f) => f.id === file.id)) return {};
      return { files: [...state.files, file] };
    }),

  updateFileProgress: (fileId, progress) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, progress } : f)),
    })),

  updateFileStatus: (fileId, status) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId
          ? { ...f, status, ...(status === 'complete' ? { completedAt: Date.now() } : {}) }
          : f
      ),
    })),

  setSelectedFiles: (selectedFiles) => set({ selectedFiles }),
  clearSelectedFiles: () => set({ selectedFiles: [] }),

  reset: () =>
    set({
      roomCode: null,
      status: 'idle',
      error: null,
      isConnected: false,
      signalingConnected: false,
      peers: [],
      files: [],
      selectedFiles: [],
    }),
}));
