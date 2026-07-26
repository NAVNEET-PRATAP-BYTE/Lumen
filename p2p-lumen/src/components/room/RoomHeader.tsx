'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, QrCode, LogOut, Wifi, WifiOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRoomStore } from '@/store/roomStore';
import { Button } from '@/components/ui/Button';

interface RoomHeaderProps {
  onLeave: () => void;
}

export function RoomHeader({ onLeave }: RoomHeaderProps) {
  const { roomCode, signalingConnected, isConnected, peers } = useRoomStore();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const joinUrl = `${appUrl}/room/${roomCode ?? ''}`;

  const copyCode = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card">
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: room code */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
            <Wifi size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Room Code</p>
            <p className="font-mono text-xl font-bold tracking-widest text-white">
              {roomCode ?? '------'}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={copyCode}
            aria-label="Copy room code"
          >
            {copied ? <Check size={14} className="text-accent-emerald" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowQR((v) => !v)}
            aria-label="Toggle QR code"
            aria-expanded={showQR}
          >
            <QrCode size={14} />
            QR
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={copyLink}
            aria-label="Copy invite link"
          >
            <Copy size={14} />
            Link
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={onLeave}
            aria-label="Leave room"
          >
            <LogOut size={14} />
            Leave
          </Button>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Signaling status */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
            signalingConnected
              ? 'bg-accent-emerald/15 text-accent-emerald'
              : 'bg-gray-500/15 text-gray-400'
          }`}
          role="status"
          aria-label={`Signaling: ${signalingConnected ? 'connected' : 'disconnected'}`}
        >
          {signalingConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {signalingConnected ? 'Signaling ✓' : 'Connecting…'}
        </div>

        {/* Peer count */}
        <div className="flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 font-medium text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
          {peers.length + 1} peer{peers.length !== 0 ? 's' : ''} in room
        </div>

        {/* P2P status */}
        {isConnected && (
          <div className="flex items-center gap-1.5 rounded-full bg-accent-cyan/15 px-3 py-1 font-medium text-accent-cyan">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-cyan" aria-hidden />
            P2P Connected
          </div>
        )}
      </div>

      {/* QR Code */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col items-center gap-3 rounded-xl border border-surface-border bg-surface-elevated p-4"
        >
          <p className="text-xs text-gray-400">Scan to join this room</p>
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={joinUrl} size={160} />
          </div>
          <p className="break-all text-center text-xs text-gray-500">{joinUrl}</p>
        </motion.div>
      )}
    </header>
  );
}
