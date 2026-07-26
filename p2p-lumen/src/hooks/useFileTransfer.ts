'use client';

import { useWebRTCContext } from '../components/providers/WebRTCProvider';
import { useRoomStore } from '../store/roomStore';

/**
 * Hook encapsulating the file queue and the sendFile action.
 * Delegates actual transfer to WebRTCProvider.
 */
export function useFileTransfer() {
  const { sendFile } = useWebRTCContext();
  const { files, selectedFiles, setSelectedFiles, clearSelectedFiles } = useRoomStore();

  /**
   * Sends all queued files, one after the other, then clears the queue.
   */
  const handleSendFiles = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      await sendFile(file);
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
