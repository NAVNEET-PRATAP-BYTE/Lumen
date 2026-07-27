'use client';

import { useWebRTCContext } from '../components/providers/WebRTCProvider';
import { useRoomStore } from '../store/roomStore';

export function useFileTransfer() {
  const { sendFileOffer } = useWebRTCContext();
  const { files, selectedFiles, setSelectedFiles, clearSelectedFiles } = useRoomStore();

  const handleSendFiles = async () => {
    if (selectedFiles.length === 0) return;
    for (const file of selectedFiles) {
      await sendFileOffer(file);
    }
    clearSelectedFiles();
  };

  return {
    files,
    selectedFiles,
    setSelectedFiles,
    clearSelectedFiles,
    sendFiles: handleSendFiles,
  };
}
