'use client';

import { useRoomStore } from '../store/roomStore';

/**
 * Convenience hook that exposes the current WebRTC-related state
 * from the global Zustand store for use in display components.
 */
export function useWebRTC() {
  const { peers, isConnected, signalingConnected, status } = useRoomStore();
  return { peers, isConnected, signalingConnected, status };
}
