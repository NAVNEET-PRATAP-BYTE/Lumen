import { WebSocketServer, WebSocket } from 'ws';
import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
import * as http from 'http';

// ─── Environment ─────────────────────────────────────────────────────────────

dotenv.config();

const PORT = parseInt(process.env['PORT'] ?? '8080', 10);

// ─── In-Memory Room State (fast O(1) lookup) ──────────────────────────────────

interface ClientMeta {
  peerId: string;
  roomCode: string;
  displayName: string;
  connectedAt: number;
  /** Tracks signaling messages per minute for rate limiting */
  msgCount: number;
  msgWindowStart: number;
}

const rooms = new Map<string, Set<WebSocket>>();
const socketMeta = new Map<WebSocket, ClientMeta>();

// ─── Optional Upstash Redis ────────────────────────────────────────────────────

let redis: Redis | null = null;
const upstashUrl = process.env['UPSTASH_URL'];
const upstashToken = process.env['UPSTASH_TOKEN'];

if (upstashUrl && upstashToken) {
  try {
    redis = new Redis({ url: upstashUrl, token: upstashToken });
    console.log('[signaling] Upstash Redis connected');
  } catch (err) {
    console.error('[signaling] Redis init failed:', err);
  }
} else {
  console.log('[signaling] Running in local in-memory mode (no Redis)');
}

// ─── HTTP Server (health check) ───────────────────────────────────────────────

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size, peers: socketMeta.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// ─── WebSocket Server ─────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server });

server.listen(PORT, () => {
  console.log(`[signaling] Server running on port ${PORT}`);
});

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown';

  console.log(`[signaling] New connection from ${ip}`);

  ws.on('message', async (rawData: Buffer) => {
    const meta = socketMeta.get(ws);

    // Rate limit: 100 messages per minute per connection
    if (meta) {
      const now = Date.now();
      if (now - meta.msgWindowStart > 60_000) {
        meta.msgCount = 0;
        meta.msgWindowStart = now;
      }
      meta.msgCount++;
      if (meta.msgCount > 100) {
        sendError(ws, 'Rate limit exceeded (100 messages/minute)');
        return;
      }
    }

    try {
      if (rawData.byteLength > 64 * 1024) {
        sendError(ws, 'Message too large (max 64 KB)');
        return;
      }

      const msg = JSON.parse(rawData.toString()) as Record<string, unknown>;
      const type = msg['type'] as string | undefined;

      switch (type) {
        case 'join':
          await handleJoin(ws, ip, msg);
          break;
        case 'leave':
          await handleLeave(ws);
          break;
        case 'signal':
          handleSignal(ws, msg);
          break;
        default:
          sendError(ws, `Unknown message type: ${type ?? 'undefined'}`);
      }
    } catch (err) {
      console.error('[signaling] Message handling error:', err);
      sendError(ws, 'Invalid message format');
    }
  });

  ws.on('close', async () => {
    await handleLeave(ws);
  });

  ws.on('error', (err) => {
    console.error('[signaling] Socket error:', err.message);
  });
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleJoin(
  ws: WebSocket,
  ip: string,
  msg: Record<string, unknown>
): Promise<void> {
  const roomCode = (msg['roomCode'] as string | undefined)?.trim().toUpperCase();
  const peerId = (msg['peerId'] as string | undefined)?.trim();
  const displayName = (msg['displayName'] as string | undefined)?.trim();

  if (!roomCode || !peerId || !displayName) {
    sendError(ws, 'Missing roomCode, peerId, or displayName');
    return;
  }

  if (!/^[A-Za-z0-9]{6}$/.test(roomCode)) {
    sendError(ws, 'Invalid roomCode format');
    return;
  }

  if (displayName.length < 2 || displayName.length > 20) {
    sendError(ws, 'displayName must be 2–20 characters');
    return;
  }

  // IP-based join rate limit via Redis
  if (redis) {
    try {
      const key = `ratelimit:join:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 60);
      if (count > 10) {
        sendError(ws, 'Too many join attempts — try again in a minute');
        ws.close();
        return;
      }
    } catch (err) {
      console.warn('[signaling] Redis rate limit check failed:', err);
    }
  }

  // Room capacity
  const roomSockets = rooms.get(roomCode) ?? new Set<WebSocket>();
  if (roomSockets.size >= 6) {
    sendError(ws, 'Room is full (max 6 peers)');
    ws.close();
    return;
  }

  // Register
  rooms.set(roomCode, roomSockets);
  roomSockets.add(ws);
  socketMeta.set(ws, {
    peerId,
    roomCode,
    displayName,
    connectedAt: Date.now(),
    msgCount: 0,
    msgWindowStart: Date.now(),
  });

  console.log(`[signaling] ${displayName} (${peerId}) joined room ${roomCode}`);

  // Persist to Redis if available
  if (redis) {
    try {
      await redis.sadd(`room:${roomCode}:peers`, peerId);
      await redis.hset(`peer:${peerId}`, { displayName, roomCode, joinedAt: Date.now() });
      await redis.expire(`room:${roomCode}:peers`, 86_400);
      await redis.expire(`peer:${peerId}`, 86_400);
    } catch (err) {
      console.warn('[signaling] Redis write failed:', err);
    }
  }

  // Build existing peers list (exclude self)
  const existingPeers: Array<{ peerId: string; displayName: string; connectedAt: number }> = [];
  roomSockets.forEach((clientWs) => {
    if (clientWs === ws) return;
    const m = socketMeta.get(clientWs);
    if (m) existingPeers.push({ peerId: m.peerId, displayName: m.displayName, connectedAt: m.connectedAt });
  });

  // Send peers list to new joiner
  send(ws, { type: 'peers-list', roomCode, peers: existingPeers });

  // Notify existing peers
  broadcastToRoom(roomCode, { type: 'user-joined', roomCode, peerId, displayName }, ws);
}

async function handleLeave(ws: WebSocket): Promise<void> {
  const meta = socketMeta.get(ws);
  if (!meta) return;

  const { peerId, roomCode, displayName } = meta;
  console.log(`[signaling] ${displayName} (${peerId}) left room ${roomCode}`);

  socketMeta.delete(ws);
  const roomSockets = rooms.get(roomCode);
  if (roomSockets) {
    roomSockets.delete(ws);
    if (roomSockets.size === 0) rooms.delete(roomCode);
  }

  if (redis) {
    try {
      await redis.srem(`room:${roomCode}:peers`, peerId);
      await redis.del(`peer:${peerId}`);
    } catch (err) {
      console.warn('[signaling] Redis delete failed:', err);
    }
  }

  broadcastToRoom(roomCode, { type: 'user-left', roomCode, peerId });
}

function handleSignal(ws: WebSocket, msg: Record<string, unknown>): void {
  const meta = socketMeta.get(ws);
  const roomCode = (msg['roomCode'] as string | undefined)?.trim().toUpperCase();

  if (!meta || meta.roomCode !== roomCode) {
    sendError(ws, 'Not in this room');
    return;
  }

  const targetPeerId = msg['to'] as string | undefined;

  if (targetPeerId) {
    // Unicast — send to specific peer
    const targetWs = findSocketByPeerId(meta.roomCode, targetPeerId);
    if (targetWs?.readyState === WebSocket.OPEN) {
      send(targetWs, msg);
    }
  } else {
    // Broadcast to all peers in room
    broadcastToRoom(meta.roomCode, msg, ws);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function send(ws: WebSocket, payload: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function sendError(ws: WebSocket, message: string): void {
  send(ws, { type: 'error', message });
}

function broadcastToRoom(
  roomCode: string,
  payload: Record<string, unknown>,
  exclude?: WebSocket
): void {
  const roomSockets = rooms.get(roomCode);
  if (!roomSockets) return;

  const data = JSON.stringify(payload);
  roomSockets.forEach((clientWs) => {
    if (clientWs !== exclude && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });
}

function findSocketByPeerId(roomCode: string, targetPeerId: string): WebSocket | null {
  const roomSockets = rooms.get(roomCode);
  if (!roomSockets) return null;

  for (const clientWs of roomSockets) {
    const m = socketMeta.get(clientWs);
    if (m?.peerId === targetPeerId) return clientWs;
  }
  return null;
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

const shutdown = () => {
  console.log('[signaling] Shutting down…');
  wss.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
