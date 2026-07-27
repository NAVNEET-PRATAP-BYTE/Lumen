'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useSignaling } from '../../hooks/useSignaling';
import { ICE_SERVERS, CONFIG } from '../../lib/constants';
import { PeerInfo } from '../../types/signaling';
import { DataChannelMessage } from '../../types/webrtc';
import {
  generateKeyPair, exportPublicKey, importPublicKey,
  deriveAesKey, encryptChunk, decryptChunk,
  arrayBufferToBase64, base64ToArrayBuffer,
} from '../../lib/crypto';
import { readFileChunks, compressChunk, decompressChunk, reassembleChunks } from '../../lib/chunker';
import { generateId } from '../../lib/utils';
import download from 'js-file-download';

// ─── Context ──────────────────────────────────────────────────────────────────

interface WebRTCContextType {
  sendFileOffer: (file: File) => Promise<void>;
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
    roomCode, peerId, displayName,
    addPeer, removePeer, updatePeerConnectionState,
    addFile, updateFileProgress, updateFileStatus, removeFile,
    setDownloadHandlers,
  } = useRoomStore();

  // ── Native WebRTC maps (by remote peerId) ────────────────────────────────
  const pcMap  = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dcMap  = useRef<Map<string, RTCDataChannel>>(new Map());
  const aesMap = useRef<Map<string, CryptoKey>>(new Map());

  // ── Per-file send state (sender side) ────────────────────────────────────
  // abortMap: fileId → AbortController (lets us pause/cancel sending)
  const abortMap  = useRef<Map<string, AbortController>>(new Map());
  // pauseMap: fileId → resolve-fn (set when waiting on pause)
  const pauseResolvers = useRef<Map<string, () => void>>(new Map());
  const pauseFlags     = useRef<Map<string, boolean>>(new Map());

  // ── Per-file receive state ────────────────────────────────────────────────
  const incomingChunks = useRef<Map<string, Map<number, ArrayBuffer>>>(new Map());
  // senderPeer: fileId → senderId (so we know who to send control msgs to)
  const fileSenderMap  = useRef<Map<string, string>>(new Map());

  // ── Local ECDH key pair ───────────────────────────────────────────────────
  const localKP = useRef<CryptoKeyPair | null>(null);
  useEffect(() => {
    generateKeyPair().then((kp) => { localKP.current = kp; });
  }, []);

  // ── sendSignal stable ref (populated after useSignaling) ─────────────────
  const sendSignalRef = useRef<(to: string, sig: Record<string, unknown>) => void>(
    () => console.warn('[WebRTC] sendSignal not ready')
  );

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanupPeer = (pid: string) => {
    dcMap.current.get(pid)?.close(); dcMap.current.delete(pid);
    pcMap.current.get(pid)?.close(); pcMap.current.delete(pid);
    aesMap.current.delete(pid);
    removePeer(pid);
  };
  useEffect(() => () => { pcMap.current.forEach((_, pid) => cleanupPeer(pid)); }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // PERFECT NEGOTIATION PATTERN
  // Each side independently decides whether it is the "impolite" peer
  // (determined by lexicographic comparison of peerIds — higher = impolite).
  // Both sides call initiateOrNegotiate() on onPeersList and onUserJoined,
  // so no side passively waits.
  // ══════════════════════════════════════════════════════════════════════════

  const isImpolite = (remotePeerId: string): boolean => peerId > remotePeerId;

  const getOrCreatePC = (remotePeerId: string): RTCPeerConnection => {
    let pc = pcMap.current.get(remotePeerId);
    if (pc) return pc;

    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcMap.current.set(remotePeerId, pc);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignalRef.current(remotePeerId, { type: 'candidate', candidate: candidate.toJSON() });
    };

    pc.onconnectionstatechange = () => {
      const state = pc!.connectionState;
      updatePeerConnectionState(remotePeerId, state);
      if (state === 'failed' || state === 'closed') cleanupPeer(remotePeerId);
    };

    pc.onnegotiationneeded = async () => {
      // Only the impolite peer initiates when negotiation is needed
      if (!isImpolite(remotePeerId)) return;
      try {
        const offer = await pc!.createOffer();
        await pc!.setLocalDescription(offer);
        sendSignalRef.current(remotePeerId, { type: 'offer', sdp: pc!.localDescription!.sdp });
      } catch (err) {
        console.error('[WebRTC] onnegotiationneeded error:', err);
      }
    };

    // Receiver side: accept incoming DataChannel
    pc.ondatachannel = ({ channel }) => {
      dcMap.current.set(remotePeerId, channel);
      setupDataChannel(remotePeerId, channel);
    };

    return pc;
  };

  /** Called by BOTH sides when a peer is discovered (PeersList + UserJoined). */
  const initiateOrNegotiate = (remotePeerId: string, remoteName: string) => {
    addPeer({
      peerId:           remotePeerId,
      displayName:      remoteName,
      roomCode:         roomCode ?? '',
      connectionState:  'new',
      joinedAt:         Date.now(),
    });

    const pc = getOrCreatePC(remotePeerId);

    // Impolite peer creates the DataChannel — triggers onnegotiationneeded
    if (isImpolite(remotePeerId) && !dcMap.current.has(remotePeerId)) {
      const dc = pc.createDataChannel('lumen', { ordered: true });
      dcMap.current.set(remotePeerId, dc);
      setupDataChannel(remotePeerId, dc);
    }
  };

  // ── DataChannel setup ─────────────────────────────────────────────────────

  const setupDataChannel = (remotePeerId: string, dc: RTCDataChannel) => {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = CONFIG.MAX_BUFFERED_AMOUNT;

    dc.onopen = async () => {
      console.log(`[WebRTC] DC open with ${remotePeerId}`);
      const kp = localKP.current;
      if (!kp) return;
      const pubKeyB64 = await exportPublicKey(kp.publicKey);
      const msg: DataChannelMessage = { type: 'key-exchange', publicKey: pubKeyB64 };
      dc.send(JSON.stringify(msg));
    };

    dc.onmessage = async ({ data }: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(data) as DataChannelMessage;
        await handleDCMessage(remotePeerId, dc, msg);
      } catch (err) {
        console.error('[WebRTC] DC message error:', err);
      }
    };

    dc.onclose = () => { dcMap.current.delete(remotePeerId); };
    dc.onerror = (err) => console.error('[WebRTC] DC error:', err);
  };

  // ── DataChannel message handler ───────────────────────────────────────────

  const handleDCMessage = async (
    remotePeerId: string,
    _dc: RTCDataChannel,
    msg: DataChannelMessage
  ) => {
    switch (msg.type) {

      case 'key-exchange': {
        const kp = localKP.current;
        if (!kp) return;
        const remotePub = await importPublicKey(msg.publicKey);
        const aesKey    = await deriveAesKey(kp.privateKey, remotePub);
        aesMap.current.set(remotePeerId, aesKey);
        updatePeerConnectionState(remotePeerId, 'connected');
        break;
      }

      // ── Sender received: receiver accepted download ───────────────────────
      case 'download-accept': {
        const ac = abortMap.current.get(msg.fileId);
        if (!ac) return; // stale
        // If paused, un-pause
        const resolve = pauseResolvers.current.get(msg.fileId);
        if (resolve) { pauseResolvers.current.delete(msg.fileId); resolve(); }
        pauseFlags.current.set(msg.fileId, false);
        updateFileStatus(msg.fileId, 'transmitting');
        break;
      }

      case 'download-pause': {
        pauseFlags.current.set(msg.fileId, true);
        updateFileStatus(msg.fileId, 'paused');
        break;
      }

      case 'download-resume': {
        pauseFlags.current.set(msg.fileId, false);
        const resolve = pauseResolvers.current.get(msg.fileId);
        if (resolve) { pauseResolvers.current.delete(msg.fileId); resolve(); }
        updateFileStatus(msg.fileId, 'transmitting');
        break;
      }

      case 'download-cancel': {
        abortMap.current.get(msg.fileId)?.abort();
        abortMap.current.delete(msg.fileId);
        updateFileStatus(msg.fileId, 'cancelled');
        break;
      }

      // ── Receiver received: sender is advertising a file ───────────────────
      case 'file-offer': {
        fileSenderMap.current.set(msg.fileId, remotePeerId);
        incomingChunks.current.set(msg.fileId, new Map());
        addFile({
          id:          msg.fileId,
          fileName:    msg.fileName,
          fileSize:    msg.fileSize,
          fileType:    msg.fileType,
          senderId:    msg.senderId,
          senderName:  msg.senderName,
          status:      'pending',   // waiting for user to click Download
          progress:    0,
          chunkCount:  msg.chunkCount,
          direction:   'receive',
          startedAt:   Date.now(),
        });
        break;
      }

      case 'chunk': {
        const chunksMap = incomingChunks.current.get(msg.fileId);
        const aesKey    = aesMap.current.get(remotePeerId);
        if (!chunksMap || !aesKey) return;

        const iv          = new Uint8Array(base64ToArrayBuffer(msg.iv));
        const encBuf      = base64ToArrayBuffer(msg.encryptedData);
        const decrypted   = await decryptChunk(aesKey, iv, encBuf);
        const decompressed = await decompressChunk(decrypted);
        chunksMap.set(msg.chunkIndex, decompressed);

        const progress = Math.round((chunksMap.size / msg.totalChunks) * 100);
        updateFileProgress(msg.fileId, progress);
        break;
      }

      case 'complete': {
        const chunksMap = incomingChunks.current.get(msg.fileId);
        if (!chunksMap) return;
        updateFileStatus(msg.fileId, 'complete');
        const fileEntry = useRoomStore.getState().files.find((f) => f.id === msg.fileId);
        if (fileEntry) {
          const blob = reassembleChunks(chunksMap, fileEntry.fileType);
          download(blob, fileEntry.fileName, fileEntry.fileType);
        }
        incomingChunks.current.delete(msg.fileId);
        fileSenderMap.current.delete(msg.fileId);
        break;
      }

      case 'error':
        updateFileStatus(msg.fileId, 'error');
        break;
    }
  };

  // ── Signaling callbacks ───────────────────────────────────────────────────

  const onPeersList = (peerList: PeerInfo[]) => {
    peerList.forEach((p) => {
      if (p.peerId !== peerId) initiateOrNegotiate(p.peerId, p.displayName);
    });
  };

  const onUserJoined = (newPeerId: string, name: string) => {
    // Both sides initiate — Perfect Negotiation handles collision gracefully
    initiateOrNegotiate(newPeerId, name);
  };

  const onUserLeft = (oldPeerId: string) => cleanupPeer(oldPeerId);

  const onSignalReceived = async (from: string, signal: Record<string, unknown>) => {
    const impolite = isImpolite(from); // WE are impolite relative to `from`

    let pc = pcMap.current.get(from);

    if (signal['type'] === 'offer') {
      if (!pc) pc = getOrCreatePC(from);

      const offerCollision =
        signal['type'] === 'offer' &&
        (pc.signalingState !== 'stable' || pc.connectionState === 'new');

      // Impolite peer ignores colliding offers; polite peer rolls back
      if (offerCollision && impolite) return;
      if (offerCollision && !impolite) {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: signal['sdp'] as string })
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignalRef.current(from, { type: 'answer', sdp: pc.localDescription!.sdp });

    } else if (signal['type'] === 'answer') {
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: signal['sdp'] as string })
        );
      }

    } else if (signal['candidate']) {
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal['candidate'] as RTCIceCandidateInit));
        } catch (_err) {
          if (!impolite) throw _err;
        }
      }
    }
  };

  // ── useSignaling ─────────────────────────────────────────────────────────

  const { sendSignal } = useSignaling({
    roomCode,
    onPeersList,
    onUserJoined,
    onUserLeft,
    onSignalReceived,
  });

  useEffect(() => { sendSignalRef.current = sendSignal; }, [sendSignal]);

  // ── Sender: broadcast file-offer (metadata only) ─────────────────────────

  const sendFileOffer = async (file: File): Promise<void> => {
    const activeDcs = [...dcMap.current.entries()].filter(([, dc]) => dc.readyState === 'open');
    if (activeDcs.length === 0) { console.warn('[WebRTC] No open DCs'); return; }

    const fileId      = generateId();
    const totalChunks = Math.ceil(file.size / CONFIG.CHUNK_SIZE);
    const ac          = new AbortController();
    abortMap.current.set(fileId, ac);
    pauseFlags.current.set(fileId, true); // start paused — wait for each peer to accept

    addFile({
      id:         fileId,
      fileName:   file.name,
      fileSize:   file.size,
      fileType:   file.type || 'application/octet-stream',
      senderId:   peerId,
      senderName: displayName,
      status:     'preparing',
      progress:   0,
      chunkCount: totalChunks,
      direction:  'send',
      startedAt:  Date.now(),
    });

    // Broadcast file-offer to all peers
    const offerMsg: DataChannelMessage = {
      type:       'file-offer',
      fileId,
      fileName:   file.name,
      fileSize:   file.size,
      fileType:   file.type || 'application/octet-stream',
      senderId:   peerId,
      senderName: displayName,
      chunkCount: totalChunks,
    };
    activeDcs.forEach(([, dc]) => dc.send(JSON.stringify(offerMsg)));

    // Wait until first peer accepts (download-accept sets pauseFlags to false
    // and resolves any pauseResolvers). We use a simple polling loop.
    // Actual sending is triggered by the accept handler setting status to 'transmitting'.
    try {
      updateFileStatus(fileId, 'preparing');
      // Wait until not paused (accept clicked) or aborted
      await waitForAcceptOrAbort(fileId, ac.signal);
      if (ac.signal.aborted) return;

      updateFileStatus(fileId, 'transmitting');

      let chunkIndex = 0;
      for await (const rawChunk of readFileChunks(file)) {
        if (ac.signal.aborted) break;

        // Check pause
        while (pauseFlags.current.get(fileId)) {
          await new Promise<void>((resolve) => {
            pauseResolvers.current.set(fileId, resolve);
          });
          if (ac.signal.aborted) break;
        }
        if (ac.signal.aborted) break;

        const compressed = await compressChunk(rawChunk);

        for (const [pid, dc] of activeDcs) {
          if (dc.readyState !== 'open') continue;
          const aesKey = aesMap.current.get(pid);
          if (!aesKey) continue;

          // Backpressure
          while (dc.bufferedAmount > CONFIG.MAX_BUFFERED_AMOUNT) {
            await new Promise<void>((res) => { dc.onbufferedamountlow = () => { dc.onbufferedamountlow = null; res(); }; });
          }

          const { iv, encryptedData } = await encryptChunk(aesKey, compressed);
          const chunkMsg: DataChannelMessage = {
            type:          'chunk',
            fileId,
            chunkIndex,
            iv:            arrayBufferToBase64(iv),
            encryptedData: arrayBufferToBase64(encryptedData),
            totalChunks,
          };
          dc.send(JSON.stringify(chunkMsg));
        }

        chunkIndex++;
        updateFileProgress(fileId, Math.round((chunkIndex / totalChunks) * 100));
      }

      if (!ac.signal.aborted) {
        const doneMsg: DataChannelMessage = { type: 'complete', fileId, totalChunks };
        activeDcs.forEach(([, dc]) => { if (dc.readyState === 'open') dc.send(JSON.stringify(doneMsg)); });
        updateFileStatus(fileId, 'complete');
      } else {
        updateFileStatus(fileId, 'cancelled');
      }
    } catch (err) {
      console.error('[WebRTC] Send error:', err);
      updateFileStatus(fileId, 'error');
    } finally {
      abortMap.current.delete(fileId);
      pauseFlags.current.delete(fileId);
      pauseResolvers.current.delete(fileId);
    }
  };

  /** Waits until pauseFlags[fileId] becomes false OR signal is aborted */
  const waitForAcceptOrAbort = (fileId: string, signal: AbortSignal): Promise<void> =>
    new Promise<void>((resolve) => {
      if (!pauseFlags.current.get(fileId)) { resolve(); return; }
      const check = () => {
        if (signal.aborted || !pauseFlags.current.get(fileId)) { resolve(); return; }
        pauseResolvers.current.set(fileId, () => { resolve(); });
      };
      check();
    });

  // ── Receiver download controls (exposed via roomStore) ────────────────────

  const sendControlMsg = (fileId: string, type: DataChannelMessage['type']) => {
    const senderPeerId = fileSenderMap.current.get(fileId);
    if (!senderPeerId) return;
    const dc = dcMap.current.get(senderPeerId);
    if (dc?.readyState === 'open') {
      dc.send(JSON.stringify({ type, fileId }));
    }
  };

  const downloadFile   = (fileId: string) => {
    sendControlMsg(fileId, 'download-accept');
    updateFileStatus(fileId, 'transmitting');
  };
  const pauseDownload  = (fileId: string) => {
    sendControlMsg(fileId, 'download-pause');
    updateFileStatus(fileId, 'paused');
  };
  const resumeDownload = (fileId: string) => {
    sendControlMsg(fileId, 'download-resume');
    updateFileStatus(fileId, 'transmitting');
  };
  const cancelDownload = (fileId: string) => {
    sendControlMsg(fileId, 'download-cancel');
    incomingChunks.current.delete(fileId);
    fileSenderMap.current.delete(fileId);
    removeFile(fileId);
  };

  // Register handlers into store so FileTable can call them
  useEffect(() => {
    setDownloadHandlers({ downloadFile, pauseDownload, resumeDownload, cancelDownload });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WebRTCContext.Provider value={{ sendFileOffer }}>
      {children}
    </WebRTCContext.Provider>
  );
}
