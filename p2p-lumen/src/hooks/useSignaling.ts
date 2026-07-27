'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '../store/roomStore';
import { SignalingMessage, PeerInfo } from '../types/signaling';
import { CONFIG } from '../lib/constants';

interface UseSignalingProps {
  roomCode: string | null;
  onPeersList: (peers: PeerInfo[]) => void;
  onUserJoined: (peerId: string, displayName: string) => void;
  onUserLeft: (peerId: string) => void;
  onSignalReceived: (from: string, signal: Record<string, unknown>) => void;
}

export function useSignaling({
  roomCode,
  onPeersList,
  onUserJoined,
  onUserLeft,
  onSignalReceived,
}: UseSignalingProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedRoomCode = roomCode ? roomCode.trim().toUpperCase() : null;

  // Keep callbacks in refs so they never re-trigger the connect effect
  const onPeersListRef = useRef(onPeersList);
  const onUserJoinedRef = useRef(onUserJoined);
  const onUserLeftRef = useRef(onUserLeft);
  const onSignalReceivedRef = useRef(onSignalReceived);

  useEffect(() => { onPeersListRef.current = onPeersList; });
  useEffect(() => { onUserJoinedRef.current = onUserJoined; });
  useEffect(() => { onUserLeftRef.current = onUserLeft; });
  useEffect(() => { onSignalReceivedRef.current = onSignalReceived; });

  const { peerId, displayName, setSignalingConnected, setStatus } = useRoomStore();

  // Store peerId & displayName in refs so they don't cause re-connection
  const peerIdRef = useRef(peerId);
  const displayNameRef = useRef(displayName);
  useEffect(() => { peerIdRef.current = peerId; });
  useEffect(() => { displayNameRef.current = displayName; });

  const sendJson = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[signaling] WS not open, message dropped:', message);
    }
  }, []);

  const connect = useCallback(() => {
    if (!normalizedRoomCode) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Close any existing connection
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080';
    console.log(`[signaling] Connecting to ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[signaling] Connected');
      setSignalingConnected(true);
      setStatus('active');
      reconnectCountRef.current = 0;
      sendJson({
        type: 'join',
        roomCode: normalizedRoomCode,
        peerId: peerIdRef.current,
        displayName: displayNameRef.current,
      });
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as SignalingMessage;
        const pid = peerIdRef.current;

        switch (msg.type) {
          case 'peers-list':
            onPeersListRef.current(msg.peers);
            break;
          case 'user-joined':
            if (msg.peerId !== pid) {
              onUserJoinedRef.current(msg.peerId, msg.displayName);
            }
            break;
          case 'user-left':
            if (msg.peerId !== pid) {
              onUserLeftRef.current(msg.peerId);
            }
            break;
          case 'signal':
            if (msg.from !== pid && (!msg.to || msg.to === pid)) {
              onSignalReceivedRef.current(msg.from, msg.signal);
            }
            break;
          case 'error':
            console.error('[signaling] Server error:', msg.message);
            setStatus('error');
            break;
        }
      } catch (err) {
        console.error('[signaling] Failed to parse message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`[signaling] Disconnected (code=${event.code})`);
      setSignalingConnected(false);
      wsRef.current = null;

      if (reconnectCountRef.current < CONFIG.RECONNECT_MAX_ATTEMPTS) {
        const delay = CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, reconnectCountRef.current);
        reconnectCountRef.current += 1;
        console.log(
          `[signaling] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${CONFIG.RECONNECT_MAX_ATTEMPTS})`
        );
        reconnectTimerRef.current = setTimeout(() => connect(), delay);
      } else {
        console.error('[signaling] Max reconnect attempts reached');
        setStatus('error');
      }
    };

    ws.onerror = () => {
      console.error('[signaling] WebSocket error');
      setStatus('error');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRoomCode, sendJson, setSignalingConnected, setStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectCountRef.current = CONFIG.RECONNECT_MAX_ATTEMPTS;

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        sendJson({ type: 'leave', roomCode: normalizedRoomCode ?? '', peerId: peerIdRef.current });
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setSignalingConnected(false);
  }, [normalizedRoomCode, sendJson, setSignalingConnected]);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  const sendSignal = useCallback(
    (to: string, signal: Record<string, unknown>) => {
      sendJson({
        type: 'signal',
        roomCode: normalizedRoomCode ?? '',
        from: peerIdRef.current,
        to,
        signal,
      });
    },
    [normalizedRoomCode, sendJson]
  );

  return { sendSignal, disconnect, reconnect: connect };
}
