'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File as FileIcon, X, AlertCircle } from 'lucide-react';
import { validateFile } from '@/lib/validators';
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/cn';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

export function Dropzone({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  disabled = false,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const valid: File[] = [];
      const errs: string[] = [];

      Array.from(fileList).forEach((file) => {
        const result = validateFile(file);
        if (result.valid) {
          valid.push(file);
        } else {
          errs.push(`${file.name}: ${result.error}`);
        }
      });

      if (errs.length > 0) setErrors(errs);
      if (valid.length > 0) {
        setErrors([]);
        onFilesSelected([...selectedFiles, ...valid]);
      }
    },
    [selectedFiles, onFilesSelected]
  );

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) processFiles(e.dataTransfer.files);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-selected
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <label
        htmlFor="file-input"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-300',
          isDragging
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-surface-border bg-surface-elevated hover:border-brand-500/60 hover:bg-surface-card',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        aria-label="Drop files here or click to browse"
        role="button"
      >
        <motion.div
          animate={isDragging ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-400"
        >
          <Upload size={28} />
        </motion.div>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-200">
            {isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-gray-500">Max 2 GB per file</p>
        </div>

        <input
          id="file-input"
          type="file"
          multiple
          onChange={onInputChange}
          disabled={disabled}
          className="sr-only"
          aria-hidden
        />
      </label>

      {/* Validation Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 p-3"
          >
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-accent-rose">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected File Queue */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-gray-400">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} queued
            </p>
            {selectedFiles.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-elevated px-4 py-2.5"
              >
                <FileIcon size={16} className="shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => onRemoveFile(idx)}
                  className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-accent-rose/20 hover:text-accent-rose transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
