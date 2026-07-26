'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { useRoomStore } from '@/store/roomStore';
import { shortId } from '@/lib/utils';

interface StateCfg { label: string; color: string; icon: React.ReactNode }

const STATE_CONFIG: Record<string, StateCfg> = {
  new:          { label: 'New',           color: 'text-gray-400',        icon: <Loader2 size={12} className="animate-spin" /> },
  connecting:   { label: 'Connecting…',  color: 'text-accent-amber',    icon: <Loader2 size={12} className="animate-spin" /> },
  checking:     { label: 'Checking…',    color: 'text-accent-amber',    icon: <Loader2 size={12} className="animate-spin" /> },
  connected:    { label: 'Connected',    color: 'text-accent-emerald',  icon: <Wifi size={12} /> },
  completed:    { label: 'Connected',    color: 'text-accent-emerald',  icon: <Wifi size={12} /> },
  disconnected: { label: 'Disconnected', color: 'text-accent-rose',     icon: <WifiOff size={12} /> },
  failed:       { label: 'Failed',       color: 'text-accent-rose',     icon: <AlertCircle size={12} /> },
  closed:       { label: 'Closed',       color: 'text-gray-500',        icon: <WifiOff size={12} /> },
};

const DEFAULT_STATE_CFG: StateCfg = STATE_CONFIG['new']!;

export function PeerList() {
  const { peers, peerId, displayName } = useRoomStore();

  return (
    <section
      aria-label="Peers in room"
      className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <Users size={16} className="text-brand-400" />
        <h2 className="text-sm font-semibold text-gray-200">
          Peers <span className="ml-1 rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-300">{peers.length + 1}</span>
        </h2>
      </div>

      <ul className="space-y-2">
        {/* Self */}
        <li className="flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {displayName} <span className="text-xs text-brand-400">(you)</span>
            </p>
            <p className="text-xs text-gray-500 font-mono">{shortId(peerId)}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-accent-emerald font-medium">
            <Wifi size={12} />
            Local
          </div>
        </li>

        {/* Remote peers */}
        <AnimatePresence>
          {peers.map((peer) => {
            const cfg = STATE_CONFIG[peer.connectionState] ?? DEFAULT_STATE_CFG;
            return (
              <motion.li
                key={peer.peerId}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: `hsl(${(peer.peerId.charCodeAt(0) * 30) % 360}, 60%, 35%)`,
                    color: `hsl(${(peer.peerId.charCodeAt(0) * 30) % 360}, 80%, 85%)`,
                  }}
                >
                  {peer.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{peer.displayName}</p>
                  <p className="text-xs text-gray-500 font-mono">{shortId(peer.peerId)}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>

        {peers.length === 0 && (
          <motion.li
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 text-center text-sm text-gray-500"
          >
            Waiting for others to join…
          </motion.li>
        )}
      </ul>
    </section>
  );
}
