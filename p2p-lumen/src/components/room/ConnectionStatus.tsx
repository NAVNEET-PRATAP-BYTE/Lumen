'use client';

import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { useRoomStore } from '@/store/roomStore';

export function ConnectionStatus() {
  const { signalingConnected, isConnected, status } = useRoomStore();

  if (status === 'joining') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-4 py-2.5 text-sm text-accent-amber"
      >
        <Loader2 size={14} className="animate-spin" />
        Joining room…
      </div>
    );
  }

  if (!signalingConnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-2.5 text-sm text-accent-rose"
      >
        <WifiOff size={14} />
        Signaling server unreachable — reconnecting…
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-xl border border-gray-600/30 bg-gray-500/10 px-4 py-2.5 text-sm text-gray-400"
      >
        <AlertCircle size={14} />
        Waiting for peers to connect…
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-xl border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-2.5 text-sm text-accent-emerald"
    >
      <Wifi size={14} />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-emerald" aria-hidden />
      Peer-to-peer channel active — E2E encrypted
    </div>
  );
}
