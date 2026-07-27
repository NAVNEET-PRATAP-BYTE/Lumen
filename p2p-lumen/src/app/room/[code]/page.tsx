'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRoomStore } from '@/store/roomStore';
import { WebRTCProvider } from '@/components/providers/WebRTCProvider';
import { RoomHeader } from '@/components/room/RoomHeader';
import { PeerList } from '@/components/room/PeerList';
import { FileTable } from '@/components/room/FileTable';
import { NetworkGraph } from '@/components/room/NetworkGraph';
import { ConnectionStatus } from '@/components/room/ConnectionStatus';
import { Dropzone } from '@/components/ui/Dropzone';
import { Button } from '@/components/ui/Button';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { validateRoomCode } from '@/lib/validators';
import { Send } from 'lucide-react';

// ─── Inner room content (needs WebRTCProvider context) ────────────────────────

function RoomContent() {
  const { selectedFiles, setSelectedFiles, sendFiles } =
    useFileTransfer();
  const { isConnected } = useRoomStore();

  const handleRemoveFile = (idx: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* Left column: main content */}
      <div className="flex flex-col gap-4">
        {/* On mobile and tablet (< lg screens), display Peers at the top */}
        <div className="block lg:hidden">
          <PeerList />
        </div>

        <ConnectionStatus />
        <FileTable />

        {/* File send panel */}
        <section
          aria-label="Send files"
          className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card"
        >
          <h2 className="mb-4 text-sm font-semibold text-gray-200">Send Files</h2>
          <Dropzone
            onFilesSelected={setSelectedFiles}
            selectedFiles={selectedFiles}
            onRemoveFile={handleRemoveFile}
            disabled={!isConnected}
          />
          {selectedFiles.length > 0 && (
            <Button
              id="send-files-btn"
              className="mt-4 w-full"
              size="lg"
              onClick={sendFiles}
              disabled={!isConnected || selectedFiles.length === 0}
            >
              <Send size={18} />
              Send {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
          )}
          {!isConnected && (
            <p className="mt-3 text-center text-xs text-gray-500">
              Waiting for a peer to connect before you can send files.
            </p>
          )}
        </section>
      </div>

      {/* Right column (desktop): peers + graph */}
      <div className="flex flex-col gap-4">
        {/* On desktop (>= lg screens), display PeerList in sidebar */}
        <div className="hidden lg:block">
          <PeerList />
        </div>
        <NetworkGraph />
      </div>
    </div>
  );
}

// ─── Room page wrapper ─────────────────────────────────────────────────────────

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params['code']) ? params['code'][0] : params['code'];
  const code = rawCode ? rawCode.toUpperCase() : '';

  const { setRoomCode, setStatus, reset } = useRoomStore();

  useEffect(() => {
    if (!code || !validateRoomCode(code)) {
      router.replace('/');
      return;
    }
    setRoomCode(code);
    setStatus('joining');
  }, [code, setRoomCode, setStatus, router]);

  const handleLeave = () => {
    reset();
    router.push('/');
  };

  if (!code || !validateRoomCode(code)) return null;

  return (
    <WebRTCProvider>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen bg-surface px-4 py-6 md:px-8"
      >
        {/* Background decorations */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-brand-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-60 w-60 rounded-full bg-accent-violet/8 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl space-y-4">
          <RoomHeader onLeave={handleLeave} />
          <RoomContent />
        </div>
      </motion.main>
    </WebRTCProvider>
  );
}
