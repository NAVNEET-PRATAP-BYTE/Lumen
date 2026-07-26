// ─── Signaling Message Types ─────────────────────────────────────────────────

export interface PeerInfo {
  peerId: string;
  displayName: string;
  connectedAt: number;
}

export type SignalingMessage =
  | { type: 'join'; roomCode: string; peerId: string; displayName: string }
  | { type: 'leave'; roomCode: string; peerId: string }
  | {
      type: 'signal';
      roomCode: string;
      from: string;
      to?: string;
      // signal can be RTCSessionDescriptionInit | RTCIceCandidateInit | key-exchange
      signal: Record<string, unknown>;
    }
  | { type: 'user-joined'; roomCode: string; peerId: string; displayName: string }
  | { type: 'user-left'; roomCode: string; peerId: string }
  | { type: 'peers-list'; roomCode: string; peers: PeerInfo[] }
  | { type: 'error'; message: string };
