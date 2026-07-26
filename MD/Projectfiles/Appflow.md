# Application Flow (AppFlow)
## P2P File Share — User Journeys & State Machines

**Version:** 1.0.0  
**Last Updated:** 2026-07-15

---

## 1. High-Level User Journeys

### 1.1 Host Creates a Room

```
User opens app
    │
    ▼
Landing Page (page.tsx)
    │
    ├─► User clicks "Create Room"
    │       │
    │       ▼
    │   Generate 6-char code (e.g., "a7B9zK")
    │       │
    │       ▼
    │   Navigate to /room/a7B9zK
    │       │
    │       ▼
    │   Room Page Loads
    │       │
    │       ├─► Connect to Signaling Server (WebSocket)
    │       │       │
    │       │       ▼
    │       │   Send "join" message with roomCode, peerId, displayName
    │       │       │
    │       │       ▼
    │       │   Initialize RTCPeerConnection (with STUN/TURN)
    │       │       │
    │       │       ▼
    │       │   Create DataChannel ("file-transfer")
    │       │       │
    │       │       ▼
    │       │   Create Offer → Set Local Description
    │       │       │
    │       │       ▼
    │       │   Send Offer via Signaling
    │       │       │
    │       │       ▼
    │       │   Wait for Answer + ICE Candidates
    │       │       │
    │       │       ▼
    │       │   WebRTC DataChannel Connected ✅
    │       │
    │       ▼
    │   Room Ready — Waiting for peers
    │       │
    │       ├─► Display room code + copy button + QR code
    │       ├─► Show "Waiting for connections..."
    │       └─► Enable file dropzone (ready to send)
    │
    └─► [Alternative] User clicks "Join Room"
            │
            ▼
        Input 6-char code
            │
            ▼
        Navigate to /room/{code}
            │
            ▼
        (Same Room Page flow as above, but as Guest)
```

### 1.2 Guest Joins a Room

```
User opens app
    │
    ▼
Landing Page (page.tsx)
    │
    ├─► User clicks "Join Room"
    │       │
    │       ▼
    │   Enter 6-char code (e.g., "a7B9zK")
    │       │
    │       ▼
    │   Navigate to /room/a7B9zK
    │       │
    │       ▼
    │   Room Page Loads
    │       │
    │       ├─► Connect to Signaling Server
    │       │       │
    │       │       ▼
    │       │   Send "join" message
    │       │       │
    │       │       ▼
    │       │   Receive "peers-list" (existing peers)
    │       │       │
    │       │       ▼
    │       │   For each existing peer:
    │       │       ├─► Create RTCPeerConnection
    │       │       ├─► Create Offer
    │       │       ├─► Send Offer via Signaling
    │       │       └─► Wait for Answer
    │       │
    │       ▼
    │   WebRTC Mesh Established ✅
    │       │
    │       ├─► Display all connected peers
    │       ├─► Show shared file table (if any files sent)
    │       └─► Enable file dropzone (can send files)
    │
    └─► [Alternative] User scans QR code / clicks direct link
            │
            ▼
        Navigate directly to /room/{code}
            │
            ▼
        (Same flow as above)
```

### 1.3 File Transfer Flow (Sender)

```
Sender selects file(s) via dropzone
    │
    ▼
Validate file (size, MIME type)
    │
    ▼
Add to local file queue
    │
    ▼
User clicks "Send"
    │
    ▼
For each selected file:
    │
    ├─► Update file status: "Preparing..."
    │       │
    │       ▼
    │   Generate ECDH key pair
    │       │
    │       ▼
    │   Send public key to all peers via signaling
    │       │
    │       ▼
    │   Derive AES-256-GCM key from ECDH shared secret
    │       │
    │       ▼
    │   Broadcast file metadata via signaling:
    │       { fileName, fileSize, fileType, senderName, chunkCount }
    │       │
    │       ▼
    │   For each chunk (64 KB):
    │       │
    │       ├─► Read chunk from file (FileReader / slice)
    │       │       │
    │       │       ▼
    │       │   Compress chunk (gzip via CompressionStream)
    │       │       │
    │       │       ▼
    │       │   Encrypt chunk (AES-GCM, unique IV)
    │       │       │
    │       │       ▼
    │       │   Check backpressure:
    │       │       if (dc.bufferedAmount > 256 KB) await drain
    │       │       │
    │       │       ▼
    │       │   Send encrypted chunk via DataChannel
    │       │       │
    │       │       ▼
    │       │   Update progress: "Transmitting X%"
    │       │
    │       ▼
    │   Send EOF marker: { type: "complete", chunkCount }
    │       │
    │       ▼
    │   Update file status: "Complete" ✅
```

### 1.4 File Transfer Flow (Receiver)

```
Receiver sees file metadata in shared table (broadcast via signaling)
    │
    ▼
Receiver clicks "Download"
    │
    ▼
Initialize receive state:
    - receivedChunks: Map<number, ArrayBuffer>
    - expectedChunks: totalChunks
    - fileMeta: { fileName, fileSize, fileType }
    │
    ▼
Listen for DataChannel messages:
    │
    ├─► Message: { type: "file-meta", ... }
    │       │
    │       ▼
    │   Store metadata, update status: "Receiving..."
    │
    ├─► Message: { type: "chunk", chunkIndex, encryptedData, iv }
    │       │
    │       ▼
    │   Decrypt chunk (AES-GCM)
    │       │
    │       ▼
    │   Decompress chunk (gzip via DecompressionStream)
    │       │
    │       ▼
    │   Store in receivedChunks Map
    │       │
    │       ▼
    │   Update progress: "Receiving X%"
    │
    └─► Message: { type: "complete", chunkCount }
            │
            ▼
        Verify all chunks received (chunkIndex 0 to chunkCount-1)
            │
            ▼
        Reassemble chunks in order → Blob
            │
            ▼
        Trigger download: js-file-download(blob, fileName, fileType)
            │
            ▼
        Update status: "Complete" ✅
```

---

## 2. State Machines

### 2.1 Room State Machine

```
                    ┌──────────┐
                    │  idle    │
                    └────┬─────┘
                         │ createRoom() / joinRoom()
                         ▼
                    ┌──────────┐
                    │ joining  │
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │  active  │         │  error   │
        └────┬─────┘         └──────────┘
             │
             │ leaveRoom() / disconnect()
             ▼
        ┌──────────┐
        │  closed  │
        └──────────┘
```

### 2.2 Peer Connection State Machine

```
                    ┌──────────┐
                    │  new     │
                    └────┬─────┘
                         │ createOffer() / createAnswer()
                         ▼
                    ┌──────────┐
                    │  local   │ (local description set)
                    └────┬─────┘
                         │ signaling exchange
                         ▼
                    ┌──────────┐
                    │ remote   │ (remote description set)
                    └────┬─────┘
                         │ ICE candidates exchanged
                         ▼
                    ┌──────────┐
                    │ checking │ (ICE connectivity checks)
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │ connected│         │  failed  │
        └────┬─────┘         └──────────┘
             │
             │ close() / disconnect
             ▼
        ┌──────────┐
        │  closed  │
        └──────────┘
```

### 2.3 File Transfer State Machine

```
                    ┌──────────┐
                    │  idle    │
                    └────┬─────┘
                         │ selectFile() + click Send
                         ▼
                    ┌──────────┐
                    │preparing │ (encrypting, chunking)
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │transmitting│ (sending chunks)
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │ complete │         │  error   │
        └──────────┘         └──────────┘
```

---

## 3. Component-Level Flow

### 3.1 App Entry → Room Page

```
layout.tsx
    │
    ├─► Providers (WebRTCProvider, ThemeProvider)
    │
    ▼
page.tsx (Landing)
    │
    ├─► State: roomCode (string | null)
    │
    ├─► User clicks "Create Room"
    │       │
    │       ▼
    │   generateRoomCode() → "a7B9zK"
    │       │
    │       ▼
    │   router.push(`/room/${code}`)
    │
    └─► User enters code + clicks "Join"
            │
            ▼
        router.push(`/room/${code}`)
            │
            ▼
        [room/[code]]/page.tsx
            │
            ├─► Read roomCode from params
            │
            ├─► Initialize roomStore:
            │       - roomCode: "a7B9zK"
            │       - peers: []
            │       - files: []
            │       - status: "joining"
            │
            ├─► useEffect:
            │       ├─► Connect to signaling server
            │       ├─► Initialize WebRTC (create PeerConnection, DataChannel)
            │       └─► Send "join" message
            │
            ▼
        Render:
            ├─► RoomHeader (code, copy, QR, leave)
            ├─► PeerList (connected peers)
            ├─► NetworkGraph (GSAP visualization)
            ├─► FileTable (shared files)
            └─► Dropzone (file upload)
```

### 3.2 Signaling Message Flow

```
Client (Next.js)
    │
    ├─► useSignaling.ts hook
    │       │
    │       ├─► Creates WebSocket connection
    │       │       ws = new WebSocket(NEXT_PUBLIC_WS_URL)
    │       │
    │       ├─► On open:
    │       │       send({ type: 'join', roomCode, peerId, displayName })
    │       │
    │       ├─► On message:
    │       │       parse JSON
    │       │       dispatch to appropriate handler
    │       │
    │       ├─► Handlers:
    │       │       - 'peers-list' → update roomStore.peers
    │       │       - 'user-joined' → create RTCPeerConnection for new peer
    │       │       - 'user-left' → close RTCPeerConnection, remove from store
    │       │       - 'signal' → handleOffer / handleAnswer / handleIceCandidate
    │       │       - 'error' → show toast notification
    │       │
    │       └─► On close:
    │               attempt reconnect (exponential backoff, max 3)
    │
    ▼
Signaling Server (ws + Redis)
    │
    ├─► Receives message
    │
    ├─► Validates (room exists, peer not banned, rate limit)
    │
    ├─► Updates Redis state
    │
    ├─► Publishes to Redis pub/sub channel (room:{code}:signal)
    │
    └─► Broadcasts to other WebSocket clients in room
            │
            ▼
        Other clients receive signal
            │
            ▼
        Client processes SDP/ICE → updates RTCPeerConnection
```

### 3.3 WebRTC Connection Establishment (Mesh)

```
Host (A) wants to connect to Guest (B)
    │
    ▼
A creates RTCPeerConnection(config)
    │
    ▼
A creates DataChannel("file-transfer")
    │
    ▼
A creates Offer (SDP)
    │
    ▼
A sets LocalDescription (offer)
    │
    ▼
A sends Offer to B via Signaling
    │
    ▼
B receives Offer
    │
    ▼
B creates RTCPeerConnection(config)
    │
    ▼
B sets RemoteDescription (offer from A)
    │
    ▼
B creates Answer (SDP)
    │
    ▼
B sets LocalDescription (answer)
    │
    ▼
B sends Answer to A via Signaling
    │
    ▼
A receives Answer
    │
    ▼
A sets RemoteDescription (answer from B)
    │
    ▼
ICE Candidate Exchange (both ways)
    │
    ▼
Connection State: connected ✅
    │
    ▼
DataChannel open event fires
    │
    ▼
Ready for file transfer
```

---

## 4. File Transfer Flow (Detailed)

### 4.1 Chunking Pipeline (Sender)

```
File Input (File object, 1 GB)
    │
    ▼
┌─────────────────────────────────────────┐
│ Chunk Reader (FileReader + slice)       │
│ - Offset: 0 → file.size                 │
│ - Chunk size: 64 KB                     │
│ - Yields: ArrayBuffer per chunk         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Compression Block (CompressionStream)  │
│ - Algorithm: gzip                       │
│ - Input: Uint8Array (chunk)             │
│ - Output: compressed Uint8Array         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Encryption Block (Web Crypto API)       │
│ - Key: AES-256-GCM (derived from ECDH) │
│ - IV: 12 bytes (crypto.getRandomValues) │
│ - Input: compressed ArrayBuffer         │
│ - Output: { iv, encryptedData }         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Backpressure Check                      │
│ - if dc.bufferedAmount > 256 KB:        │
│     await 'bufferedamountlow' event     │
└─────────────────────────────────────────┘
    │
    ▼
DataChannel.send({ iv, encryptedData, chunkIndex, totalChunks })
    │
    ▼
[Repeat for next chunk]
```

### 4.2 Reassembly Pipeline (Receiver)

```
DataChannel.onmessage event
    │
    ▼
Parse message: { type, chunkIndex?, iv?, encryptedData?, fileName?, ... }
    │
    ├─► type === 'file-meta':
    │       Store metadata, initialize receive state
    │
    ├─► type === 'chunk':
    │       │
    │       ▼
    │   ┌─────────────────────────────────────────┐
    │   │ Decryption Block (Web Crypto API)       │
    │   │ - Key: AES-256-GCM                      │
    │   │ - IV: from message                      │
    │   │ - Input: encryptedData                   │
    │   │ - Output: decrypted ArrayBuffer          │
    │   └─────────────────────────────────────────┘
    │       │
    │       ▼
    │   ┌─────────────────────────────────────────┐
    │   │ Decompression Block (DecompressionStream)│
    │   │ - Algorithm: gzip                        │
    │   │ - Input: decrypted Uint8Array            │
    │   │ - Output: original chunk ArrayBuffer     │
    │   └─────────────────────────────────────────┘
    │       │
    │       ▼
    │   Store in receivedChunks Map<chunkIndex, ArrayBuffer>
    │       │
    │       ▼
    │   Update progress: (receivedChunks.size / totalChunks) * 100
    │
    └─► type === 'complete':
            │
            ▼
        Verify all chunks received (no gaps)
            │
            ▼
        Sort chunks by index
            │
            ▼
        Create Blob from sorted ArrayBuffers
            │
            ▼
        Trigger download (URL.createObjectURL + <a> click)
            │
            ▼
        Revoke ObjectURL after download
```

---

## 5. Error Recovery Flow

### 5.1 Connection Drop & Reconnect

```
ICE Connection State: disconnected
    │
    ▼
Wait 3 seconds (allow for temporary network blip)
    │
    ├─► State returns to 'connected' → Resume normal operation
    │
    └─► State remains 'disconnected' or moves to 'failed':
            │
            ▼
        Close RTCPeerConnection
            │
            ▼
        Notify user: "Connection lost. Reconnecting..."
            │
            ▼
        Attempt to re-establish via signaling:
            ├─► Create new RTCPeerConnection
            ├─► Exchange new SDP/ICE
            └─► Re-create DataChannel
            │
            ▼
        If reconnection succeeds within 10 seconds:
            │
            ▼
        Resume file transfer from last acknowledged chunk
        (Requires chunk-level ACK — Post-MVP feature)
            │
            ▼
        If reconnection fails:
            │
            ▼
        Notify user: "Connection lost. File transfer incomplete."
        Offer retry
```

### 5.2 Signaling Server Reconnection

```
WebSocket closes unexpectedly
    │
    ▼
Exponential backoff:
    - Attempt 1: wait 1 second
    - Attempt 2: wait 2 seconds
    - Attempt 3: wait 4 seconds
    │
    ├─► Reconnect succeeds:
    │       │
    │       ▼
    │   Re-join room (send "join" message)
    │       │
    │       ▼
    │   Receive updated peers-list
    │       │
    │       ▼
    │   Re-establish WebRTC connections with all peers
    │
    └─► Reconnect fails after 3 attempts:
            │
            ▼
        Notify user: "Signaling server unavailable. Please refresh."
```

---

## 6. Zustand Store Schema

```typescript
// store/roomStore.ts
import { create } from 'zustand';

interface Peer {
  peerId: string;
  displayName: string;
  connectionState: RTCPeerConnectionState;
}

interface FileEntry {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  senderId: string;
  senderName: string;
  status: 'idle' | 'preparing' | 'transmitting' | 'complete' | 'error';
  progress: number; // 0–100
}

interface RoomState {
  // Room
  roomCode: string | null;
  status: 'idle' | 'joining' | 'active' | 'error';
  error: string | null;

  // Peers
  peers: Peer[];
  displayName: string;

  // Files
  files: FileEntry[];
  selectedFiles: File[];

  // Connection
  isConnected: boolean;

  // Actions
  setRoomCode: (code: string) => void;
  setStatus: (status: RoomState['status']) => void;
  setError: (error: string | null) => void;
  addPeer: (peer: Peer) => void;
  removePeer: (peerId: string) => void;
  updatePeerConnectionState: (peerId: string, state: RTCPeerConnectionState) => void;
  setDisplayName: (name: string) => void;
  addFile: (file: FileEntry) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  updateFileStatus: (fileId: string, status: FileEntry['status']) => void;
  setSelectedFiles: (files: File[]) => void;
  clearSelectedFiles: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: null,
  status: 'idle',
  error: null,
  peers: [],
  displayName: `Peer-${Math.random().toString(36).substring(2, 6)}`,
  files: [],
  selectedFiles: [],
  isConnected: false,

  setRoomCode: (code) => set({ roomCode: code }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  addPeer: (peer) => set((state) => ({ peers: [...state.peers, peer] })),
  removePeer: (peerId) => set((state) => ({ peers: state.peers.filter(p => p.peerId !== peerId) })),
  updatePeerConnectionState: (peerId, connectionState) =>
    set((state) => ({
      peers: state.peers.map(p => p.peerId === peerId ? { ...p, connectionState } : p)
    })),
  setDisplayName: (displayName) => set({ displayName }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  updateFileProgress: (fileId, progress) =>
    set((state) => ({
      files: state.files.map(f => f.id === fileId ? { ...f, progress } : f)
    })),
  updateFileStatus: (fileId, status) =>
    set((state) => ({
      files: state.files.map(f => f.id === fileId ? { ...f, status } : f)
    })),
  setSelectedFiles: (selectedFiles) => set({ selectedFiles }),
  clearSelectedFiles: () => set({ selectedFiles: [] }),
  reset: () => set({
    roomCode: null,
    status: 'idle',
    error: null,
    peers: [],
    files: [],
    selectedFiles: [],
    isConnected: false
  })
}));
```

---

## 7. Page Routes

```
/                              → Landing page (create/join room)
/room/[code]                   → Room page (WebRTC, file transfer)
```

### 7.1 Landing Page (`/`)

```
┌─────────────────────────────────────────┐
│           P2P File Share                │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │   [Create Room]                 │   │
│   │                                 │   │
│   │   ───────── or ─────────        │   │
│   │                                 │   │
│   │   [Enter Room Code]  [Join]     │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   No signup. No uploads. E2E encrypted. │
└─────────────────────────────────────────┘
```

### 7.2 Room Page (`/room/[code]`)

```
┌─────────────────────────────────────────────────────────────┐
│ Room: a7B9zK                                [Copy] [QR] [Leave] │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────────────────────────────┐ │
│ │              │  │                                      │ │
│ │   Network    │  │   Peers (3)                          │ │
│ │   Graph      │  │   - Alice (Connected)                │ │
│ │   (GSAP)     │  │   - Bob (Connected)                  │ │
│ │              │  │   - Charlie (Connecting...)          │ │
│ │              │  │                                      │ │
│ └──────────────┘  └──────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Shared Files                                            │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Name          │ Size  │ Sender  │ Status │ Action  │ │ │
│ │ ├─────────────────────────────────────────────────────┤ │ │
│ │ │ project.zip   │ 45 MB │ Alice   │ Ready  │ [Down]  │ │ │
│ │ │ notes.pdf     │ 2 MB  │ Bob     │ Ready  │ [Down]  │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Drop files here or click to browse                      │ │
│ │ [Select Files]                            [Send]        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Responsive Layout Behavior

| Viewport | Layout |
|----------|--------|
| **Mobile (< 640 px)** | Single column. Network graph stacks above peer list. File table scrolls horizontally. Dropzone full width. |
| **Tablet (640–1024 px)** | Two columns: Network graph (left) + Peer list + File table (right). Dropzone full width below. |
| **Desktop (> 1024 px)** | Three columns: Network graph (left, 40%), Peer list (center, 30%), File table (right, 30%). Dropzone full width below. |

**Tailwind classes pattern:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-1">Network Graph</div>
  <div className="lg:col-span-1">Peer List</div>
  <div className="lg:col-span-1">File Table</div>
</div>
```
