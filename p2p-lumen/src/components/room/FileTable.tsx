'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Files, Download, Upload, CheckCircle2, AlertCircle,
  Loader2, Clock, Pause, Play, X, Ban,
} from 'lucide-react';
import { useRoomStore } from '@/store/roomStore';
import { FileEntry, FileTransferStatus } from '@/types/room';
import { formatBytes } from '@/lib/utils';

// ── Status display config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  FileTransferStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  idle:         { label: 'Queued',      color: 'text-gray-400',       bg: 'bg-gray-500/10',       icon: <Clock size={12} /> },
  pending:      { label: 'Awaiting',    color: 'text-accent-amber',   bg: 'bg-accent-amber/10',   icon: <Download size={12} /> },
  preparing:    { label: 'Preparing',   color: 'text-accent-amber',   bg: 'bg-accent-amber/10',   icon: <Loader2 size={12} className="animate-spin" /> },
  transmitting: { label: 'Transferring',color: 'text-brand-300',      bg: 'bg-brand-500/10',      icon: <Loader2 size={12} className="animate-spin" /> },
  paused:       { label: 'Paused',      color: 'text-accent-violet',  bg: 'bg-accent-violet/10',  icon: <Pause size={12} /> },
  complete:     { label: 'Complete',    color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', icon: <CheckCircle2 size={12} /> },
  cancelled:    { label: 'Cancelled',   color: 'text-gray-500',       bg: 'bg-gray-500/10',       icon: <Ban size={12} /> },
  error:        { label: 'Error',       color: 'text-accent-rose',    bg: 'bg-accent-rose/10',    icon: <AlertCircle size={12} /> },
};

// ── FileRow ───────────────────────────────────────────────────────────────────

function FileRow({ file }: { file: FileEntry }) {
  const { downloadFile, pauseDownload, resumeDownload, cancelDownload } = useRoomStore();

  const cfg      = STATUS_CONFIG[file.status] ?? STATUS_CONFIG.idle;
  const isActive = file.status === 'transmitting';
  const isPaused = file.status === 'paused';
  const isPending = file.status === 'pending';
  const isReceiver = file.direction === 'receive';
  const showProgress = isActive || isPaused || (file.status === 'complete' && file.progress > 0);

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
        >
          {file.direction === 'send' ? <Upload size={14} /> : <Download size={14} />}
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Name + status badge */}
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-white">{file.fileName}</p>
            <span
              className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatBytes(file.fileSize)}</span>
            <span>·</span>
            <span>{file.fileType || 'unknown'}</span>
            <span>·</span>
            <span>by {file.senderName}</span>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${
                  isPaused ? 'from-accent-violet to-accent-violet/60' : 'from-brand-500 to-accent-cyan'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                transition={{ ease: 'linear', duration: 0.3 }}
              />
              {isActive && (
                <div className="absolute inset-0 animate-pulse rounded-full bg-white/10" aria-hidden />
              )}
            </div>
          )}

          {(isActive || isPaused) && (
            <p className="text-xs text-brand-300" role="status" aria-live="polite">
              {file.progress}% — {file.direction === 'send' ? 'Sending' : 'Receiving'}
              {isPaused ? ' (Paused)' : '…'}
            </p>
          )}

          {/* ── Receiver action buttons ─────────────────────────────────── */}
          {isReceiver && (
            <div className="flex flex-wrap items-center gap-2 pt-1">

              {/* PENDING: show Download button */}
              {isPending && (
                <button
                  id={`btn-download-${file.id}`}
                  onClick={() => downloadFile?.(file.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 active:scale-95"
                >
                  <Download size={12} />
                  Download
                </button>
              )}

              {/* TRANSFERRING: show Pause + Cancel */}
              {isActive && (
                <>
                  <button
                    id={`btn-pause-${file.id}`}
                    onClick={() => pauseDownload?.(file.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-accent-violet/20 px-3 py-1.5 text-xs font-semibold text-accent-violet transition hover:bg-accent-violet/30"
                  >
                    <Pause size={12} />
                    Pause
                  </button>
                  <button
                    id={`btn-cancel-${file.id}`}
                    onClick={() => cancelDownload?.(file.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-accent-rose/20 px-3 py-1.5 text-xs font-semibold text-accent-rose transition hover:bg-accent-rose/30"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                </>
              )}

              {/* PAUSED: show Resume + Cancel */}
              {isPaused && (
                <>
                  <button
                    id={`btn-resume-${file.id}`}
                    onClick={() => resumeDownload?.(file.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-accent-emerald/20 px-3 py-1.5 text-xs font-semibold text-accent-emerald transition hover:bg-accent-emerald/30"
                  >
                    <Play size={12} />
                    Resume
                  </button>
                  <button
                    id={`btn-cancel-${file.id}`}
                    onClick={() => cancelDownload?.(file.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-accent-rose/20 px-3 py-1.5 text-xs font-semibold text-accent-rose transition hover:bg-accent-rose/30"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── FileTable ─────────────────────────────────────────────────────────────────

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
