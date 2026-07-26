'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useSignaling } from '../../hooks/useSignaling';
import { ICE_SERVERS, CONFIG } from '../../lib/constants';
import { PeerInfo } from '../../types/signaling';
import { DataChannelMessage } from '../../types/webrtc';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveAesKey,
  encryptChunk,
  decryptChunk,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '../../lib/crypto';
import {
  readFileChunks,
  compressChunk,
  decompressChunk,
  reassembleChunks,
} from '../../lib/chunker';
import { generateId } from '../../lib/utils';
import download from 'js-file-download';

// ─── Context ─────────────────────────────────────────────────────────────────

interface WebRTCContextType {
  sendFile: (file: File) => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export function useWebRTCContext(): WebRTCContextType {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error('useWebRTCContext must be used within <WebRTCProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const {
    roomCode,
    peerId,
    displayName,
    addPeer,
    removePeer,
    updatePeerConnectionState,
    addFile,
    updateFileProgress,
    updateFileStatus,
  } = useRoomStore();

  // WebRTC native maps (keyed by remote peerId)
  const pcMap = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dcMap = useRef<Map<string, RTCDataChannel>>(new Map());
  const aesKeyMap = useRef<Map<string, CryptoKey>>(new Map());

  // Incoming file chunks: fileId → Map<chunkIndex, ArrayBuffer>
  const incomingChunksRef = useRef<Map<string, Map<number, ArrayBuffer>>>(new Map());

  // Local ECDH key pair, generated once on mount
  const [localKeyPair, setLocalKeyPair] = useState<CryptoKeyPair | null>(null);
  const localKeyPairRef = useRef<CryptoKeyPair | null>(null);

  // ── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    generateKeyPair().then((kp) => {
      setLocalKeyPair(kp);
      localKeyPairRef.current = kp;
      console.log('[WebRTC] ECDH key pair generated');
    });
  }, []);

  useEffect(() => {
    return () => cleanupAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Peer cleanup ──────────────────────────────────────────────────────────

  const cleanupPeer = (targetPeerId: string) => {
    console.log(`[WebRTC] Cleaning up peer ${targetPeerId}`);

    const dc = dcMap.current.get(targetPeerId);
    if (dc) { dc.close(); dcMap.current.delete(targetPeerId); }

    const pc = pcMap.current.get(targetPeerId);
    if (pc) { pc.close(); pcMap.current.delete(targetPeerId); }

    aesKeyMap.current.delete(targetPeerId);
    removePeer(targetPeerId);
  };

  const cleanupAll = () => {
    Array.from(pcMap.current.keys()).forEach(cleanupPeer);
  };

  // ── RTCPeerConnection Setup ───────────────────────────────────────────────

  const setupPeerConnection = (targetPeerId: string, pc: RTCPeerConnection) => {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalRef.current(targetPeerId, {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] ${targetPeerId} connection → ${state}`);
      updatePeerConnectionState(targetPeerId, state);

      if (state === 'failed' || state === 'closed') {
        cleanupPeer(targetPeerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        // Give ICE 3 s to self-heal before tearing down
        setTimeout(() => {
          if (pcMap.current.get(targetPeerId)?.iceConnectionState === 'disconnected') {
            cleanupPeer(targetPeerId);
          }
        }, 3000);
      }
    };
  };

  // ── DataChannel Setup ────────────────────────────────────────────────────

  const setupDataChannel = (targetPeerId: string, dc: RTCDataChannel) => {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = CONFIG.MAX_BUFFERED_AMOUNT;

    dc.onopen = async () => {
      console.log(`[WebRTC] DataChannel open with ${targetPeerId}`);
      const kp = localKeyPairRef.current;
      if (!kp) return;
      try {
        const pubKeyB64 = await exportPublicKey(kp.publicKey);
        const msg: DataChannelMessage = { type: 'key-exchange', publicKey: pubKeyB64 };
        dc.send(JSON.stringify(msg));
      } catch (err) {
        console.error('[WebRTC] Failed to send public key:', err);
      }
    };

    dc.onmessage = async (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as DataChannelMessage;
        await handleDataChannelMessage(targetPeerId, dc, msg);
      } catch (err) {
        console.error('[WebRTC] Failed to handle DataChannel message:', err);
      }
    };

    dc.onclose = () => {
      console.log(`[WebRTC] DataChannel closed with ${targetPeerId}`);
      dcMap.current.delete(targetPeerId);
    };

    dc.onerror = (err) => {
      console.error(`[WebRTC] DataChannel error with ${targetPeerId}:`, err);
    };
  };

  // ── DataChannel Message Handling ──────────────────────────────────────────

  const handleDataChannelMessage = async (
    targetPeerId: string,
    _dc: RTCDataChannel,
    msg: DataChannelMessage
  ) => {
    switch (msg.type) {
      case 'key-exchange': {
        const kp = localKeyPairRef.current;
        if (!kp) return;
        try {
          const remotePub = await importPublicKey(msg.publicKey);
          const aesKey = await deriveAesKey(kp.privateKey, remotePub);
          aesKeyMap.current.set(targetPeerId, aesKey);
          console.log(`[WebRTC] AES-256-GCM key derived for ${targetPeerId}`);
          updatePeerConnectionState(targetPeerId, 'connected');
        } catch (err) {
          console.error('[WebRTC] Key exchange failed:', err);
        }
        break;
      }

      case 'file-meta': {
        console.log(`[WebRTC] Incoming file: ${msg.fileName} (${msg.fileSize} B)`);
        addFile({
          id: msg.fileId,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          fileType: msg.fileType,
          senderId: msg.senderId,
          senderName: msg.senderName,
          status: 'preparing',
          progress: 0,
          chunkCount: msg.chunkCount,
          receivedChunks: 0,
          direction: 'receive',
          startedAt: Date.now(),
        });
        incomingChunksRef.current.set(msg.fileId, new Map());
        updateFileStatus(msg.fileId, 'transmitting');
        break;
      }

      case 'chunk': {
        const chunksMap = incomingChunksRef.current.get(msg.fileId);
        if (!chunksMap) { console.error(`[WebRTC] No chunk map for ${msg.fileId}`); return; }

        const aesKey = aesKeyMap.current.get(targetPeerId);
        if (!aesKey) { console.error(`[WebRTC] No AES key for ${targetPeerId}`); return; }

        try {
          const iv = new Uint8Array(base64ToArrayBuffer(msg.iv));
          const encryptedBuf = base64ToArrayBuffer(msg.encryptedData);
          const decrypted = await decryptChunk(aesKey, iv, encryptedBuf);
          const decompressed = await decompressChunk(decrypted);
          chunksMap.set(msg.chunkIndex, decompressed);

          const progress = Math.round((chunksMap.size / msg.totalChunks) * 100);
          updateFileProgress(msg.fileId, progress);
        } catch (err) {
          console.error(`[WebRTC] Chunk decryption failed (idx=${msg.chunkIndex}):`, err);
          updateFileStatus(msg.fileId, 'error');
        }
        break;
      }

      case 'complete': {
        const chunksMap = incomingChunksRef.current.get(msg.fileId);
        if (!chunksMap) return;

        updateFileStatus(msg.fileId, 'complete');
        const fileEntry = useRoomStore.getState().files.find((f) => f.id === msg.fileId);
        if (fileEntry) {
          const blob = reassembleChunks(chunksMap, fileEntry.fileType);
          download(blob, fileEntry.fileName, fileEntry.fileType);
        }
        incomingChunksRef.current.delete(msg.fileId);
        console.log(`[WebRTC] File ${msg.fileId} received and downloaded`);
        break;
      }

      case 'error':
        console.error(`[WebRTC] Peer transfer error: ${msg.message}`);
        updateFileStatus(msg.fileId, 'error');
        break;
    }
  };

  // ── Signaling Callbacks (stable refs to avoid stale closure) ──────────────

  const sendSignalRef = useRef<(to: string, signal: Record<string, unknown>) => void>(
    () => { console.warn('[WebRTC] sendSignal not yet ready'); }
  );

  const onPeersList = (peerList: PeerInfo[]) => {
    console.log('[WebRTC] Peers list:', peerList);
    peerList.forEach((p) => {
      if (p.peerId !== peerId && !pcMap.current.has(p.peerId)) {
        addPeer({
          peerId: p.peerId,
          displayName: p.displayName,
          roomCode: roomCode ?? '',
          connectionState: 'new',
          joinedAt: p.connectedAt,
        });
        void initiateConnection(p.peerId);
      }
    });
  };

  const onUserJoined = (newPeerId: string, name: string) => {
    console.log(`[WebRTC] User joined: ${name} (${newPeerId})`);
    addPeer({
      peerId: newPeerId,
      displayName: name,
      roomCode: roomCode ?? '',
      connectionState: 'new',
      joinedAt: Date.now(),
    });
  };

  const onUserLeft = (oldPeerId: string) => {
    console.log(`[WebRTC] User left: ${oldPeerId}`);
    cleanupPeer(oldPeerId);
  };

  const onSignalReceived = async (
    from: string,
    signal: Record<string, unknown>
  ) => {
    console.log(`[WebRTC] Signal from ${from}:`, signal['type'] ?? 'candidate');

    let pc = pcMap.current.get(from);

    if (signal['type'] === 'offer') {
      if (!pc) {
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcMap.current.set(from, pc);
        setupPeerConnection(from, pc);

        pc.ondatachannel = (event) => {
          console.log(`[WebRTC] Received DataChannel from ${from}`);
          dcMap.current.set(from, event.channel);
          setupDataChannel(from, event.channel);
        };
      }

      const sdp = signal['sdp'] as string;
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignalRef.current(from, { type: 'answer', sdp: answer.sdp });

    } else if (signal['type'] === 'answer') {
      if (pc) {
        const sdp = signal['sdp'] as string;
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
      }

    } else if (signal['candidate']) {
      if (pc) {
        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(signal['candidate'] as RTCIceCandidateInit)
          );
        } catch (err) {
          console.error('[WebRTC] Failed to add ICE candidate:', err);
        }
      }
    }
  };

  // ── useSignaling hook ─────────────────────────────────────────────────────

  const { sendSignal, disconnect: _disconnect } = useSignaling({
    roomCode,
    onPeersList,
    onUserJoined,
    onUserLeft,
    onSignalReceived,
  });

  // Keep sendSignalRef in sync
  useEffect(() => {
    sendSignalRef.current = sendSignal;
  }, [sendSignal]);

  // ── Initiate WebRTC Connection ────────────────────────────────────────────

  const initiateConnection = async (targetPeerId: string) => {
    console.log(`[WebRTC] Creating offer to ${targetPeerId}`);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcMap.current.set(targetPeerId, pc);
    setupPeerConnection(targetPeerId, pc);

    const dc = pc.createDataChannel('file-transfer', { ordered: true });
    dcMap.current.set(targetPeerId, dc);
    setupDataChannel(targetPeerId, dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignalRef.current(targetPeerId, { type: 'offer', sdp: offer.sdp });
  };

  // ── Send File (compress → encrypt → stream) ───────────────────────────────

  const sendFile = async (file: File): Promise<void> => {
    const activeDcs = Array.from(dcMap.current.entries()).filter(
      ([, dc]) => dc.readyState === 'open'
    );

    if (activeDcs.length === 0) {
      console.warn('[WebRTC] No open DataChannels — cannot send file');
      return;
    }

    const fileId = generateId();
    const totalChunks = Math.ceil(file.size / CONFIG.CHUNK_SIZE);

    console.log(`[WebRTC] Sending "${file.name}" (${file.size} B, ${totalChunks} chunks)`);

    addFile({
      id: fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      senderId: peerId,
      senderName: displayName,
      status: 'preparing',
      progress: 0,
      chunkCount: totalChunks,
      receivedChunks: 0,
      direction: 'send',
      startedAt: Date.now(),
    });

    // 1 ── Broadcast file metadata
    const metaMsg: DataChannelMessage = {
      type: 'file-meta',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      senderId: peerId,
      senderName: displayName,
      chunkCount: totalChunks,
    };
    activeDcs.forEach(([, dc]) => dc.send(JSON.stringify(metaMsg)));
    updateFileStatus(fileId, 'transmitting');

    // 2 ── Read → compress → encrypt → send chunks
    let chunkIndex = 0;
    try {
      for await (const rawChunk of readFileChunks(file)) {
        const compressed = await compressChunk(rawChunk);

        for (const [pid, dc] of activeDcs) {
          const aesKey = aesKeyMap.current.get(pid);
          if (!aesKey) {
            console.error(`[WebRTC] No AES key for ${pid} — skipping chunk`);
            continue;
          }

          const { iv, encryptedData } = await encryptChunk(aesKey, compressed);

          // Backpressure: wait for buffer to drain
          while (dc.bufferedAmount > CONFIG.MAX_BUFFERED_AMOUNT) {
            await new Promise<void>((resolve) => {
              dc.onbufferedamountlow = () => {
                dc.onbufferedamountlow = null;
                resolve();
              };
            });
          }

          const chunkMsg: DataChannelMessage = {
            type: 'chunk',
            fileId,
            chunkIndex,
            iv: arrayBufferToBase64(iv),
            encryptedData: arrayBufferToBase64(encryptedData),
            totalChunks,
          };
          dc.send(JSON.stringify(chunkMsg));
        }

        chunkIndex++;
        updateFileProgress(fileId, Math.round((chunkIndex / totalChunks) * 100));
      }

      // 3 ── Send EOF marker
      const doneMsg: DataChannelMessage = { type: 'complete', fileId, totalChunks };
      activeDcs.forEach(([, dc]) => dc.send(JSON.stringify(doneMsg)));
      updateFileStatus(fileId, 'complete');
      console.log(`[WebRTC] "${file.name}" sent successfully`);
    } catch (err) {
      console.error('[WebRTC] Send pipeline error:', err);
      updateFileStatus(fileId, 'error');

      const errMsg: DataChannelMessage = {
        type: 'error',
        fileId,
        message: err instanceof Error ? err.message : 'Unknown error',
      };
      activeDcs.forEach(([, dc]) => {
        if (dc.readyState === 'open') dc.send(JSON.stringify(errMsg));
      });
    }
  };

  // Expose localKeyPair in a no-op way to suppress unused warning
  void localKeyPair;

  return (
    <WebRTCContext.Provider value={{ sendFile }}>
      {children}
    </WebRTCContext.Provider>
  );
}
