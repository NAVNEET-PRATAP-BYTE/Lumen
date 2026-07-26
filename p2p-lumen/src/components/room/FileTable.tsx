'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Files,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useRoomStore } from '@/store/roomStore';
import { FileEntry, FileTransferStatus } from '@/types/room';
import { formatBytes } from '@/lib/utils';

const STATUS_CONFIG: Record<
  FileTransferStatus,
  { label: string; color: string; icon: React.ReactNode; bg: string }
> = {
  idle:         { label: 'Queued',       color: 'text-gray-400',       bg: 'bg-gray-500/10',         icon: <Clock size={12} /> },
  preparing:    { label: 'Preparing',    color: 'text-accent-amber',   bg: 'bg-accent-amber/10',     icon: <Loader2 size={12} className="animate-spin" /> },
  compressing:  { label: 'Compressing', color: 'text-accent-violet',  bg: 'bg-accent-violet/10',    icon: <Loader2 size={12} className="animate-spin" /> },
  encrypting:   { label: 'Encrypting',  color: 'text-accent-cyan',    bg: 'bg-accent-cyan/10',      icon: <Loader2 size={12} className="animate-spin" /> },
  transmitting: { label: 'Transferring',color: 'text-brand-300',      bg: 'bg-brand-500/10',        icon: <Loader2 size={12} className="animate-spin" /> },
  complete:     { label: 'Complete',    color: 'text-accent-emerald', bg: 'bg-accent-emerald/10',   icon: <CheckCircle2 size={12} /> },
  error:        { label: 'Error',       color: 'text-accent-rose',    bg: 'bg-accent-rose/10',      icon: <AlertCircle size={12} /> },
};

function FileRow({ file }: { file: FileEntry }) {
  const cfg = STATUS_CONFIG[file.status] ?? STATUS_CONFIG.idle;
  const isActive = file.status === 'transmitting';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-xl border border-surface-border bg-surface-elevated p-4"
    >
      <div className="flex items-start gap-3">
        {/* Direction icon */}
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            file.direction === 'send'
              ? 'bg-brand-500/20 text-brand-400'
              : 'bg-accent-cyan/20 text-accent-cyan'
          }`}
          aria-label={file.direction === 'send' ? 'Uploading' : 'Downloading'}
        >
          {file.direction === 'send' ? <Upload size={14} /> : <Download size={14} />}
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-white">{file.fileName}</p>
            <span
              className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatBytes(file.fileSize)}</span>
            <span>·</span>
            <span>{file.fileType || 'unknown'}</span>
            <span>·</span>
            <span>by {file.senderName}</span>
          </div>

          {/* Progress bar */}
          {(isActive || (file.status === 'complete' && file.progress > 0)) && (
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-cyan"
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                transition={{ ease: 'linear', duration: 0.3 }}
              />
              {isActive && (
                <div
                  className="absolute inset-0 animate-pulse bg-white/10 rounded-full"
                  aria-hidden
                />
              )}
            </div>
          )}

          {isActive && (
            <p className="text-xs text-brand-300" role="status" aria-live="polite">
              {file.progress}% — {file.direction === 'send' ? 'Sending' : 'Receiving'}…
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function FileTable() {
  const { files } = useRoomStore();

  return (
    <section
      aria-label="Shared files"
      className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <Files size={16} className="text-brand-400" />
        <h2 className="text-sm font-semibold text-gray-200">
          Shared Files{' '}
          <span className="ml-1 rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-300">
            {files.length}
          </span>
        </h2>
      </div>

      <AnimatePresence mode="popLayout">
        {files.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10 text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated text-gray-600">
              <Files size={24} />
            </div>
            <p className="text-sm text-gray-500">No files shared yet.</p>
            <p className="mt-1 text-xs text-gray-600">Drop a file below to share it.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
