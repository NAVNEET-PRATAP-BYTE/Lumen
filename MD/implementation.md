You are a Principal Full-Stack Engineer and Core WebRTC Architect. Write the complete, production-grade business logic, state machines, and components for a decentralized, real-time P2P file-sharing application.

### 1. Technology Stack Requirements
- **Framework:** Next.js (App Router) with strict TypeScript.
- **Styling & Animation:** Tailwind CSS, Framer Motion (for layout changes and micro-interactions), and GSAP (for high-performance canvas/SVG connection graph animations).
- **State Management:** React hooks for local component state and potentially Redux Toolkit for complex global state management (if needed).
- **Hosting:** vercel or Render 
- **Real-Time Coordination:** WebSockets (via Socket.io or native WebSockets) acting strictly as an orchestration/signaling layer.
- **P2P Transport Layer:** WebRTC DataChannels (`RTCDataChannel`) configured for reliable, high-throughput binary transmission (`binaryType = "arraybuffer"`).

---

### 2. Core Feature: Room Creation & Multi-Peer Discovery
- **Room Hosting:** Any client can initialize a session. The system must support multi-peer groups (e.g., User A, User B, and User C simultaneously in the same space).
- **Access Vectors (3-Way Ingress):**
  1. **Direct Link:** Dynamic URL configuration matching the application route.
  2. **QR Code Engine:** Client-side rendered QR code pointing to the direct link.
  3. **6-Character Alphanumeric Code:** A high-entropy token containing mixed-case alphanumeric strings (e.g., `a7B9zK`).
- **Orchestration Flow:**
  - The signaling server maintains minimal state: mapping socket IDs to room tokens.
  - When User B or C joins using any ingress vector, the signaling server triggers a mesh-network handshake, exchanging SDP offers, answers, and ICE candidates so every user establishes a direct P2P data channel with every other user in the room (Full-Mesh topology).

---

### 3. Core Feature: Interactive Topology Network Graph & UI 
- **Network Topology Visualizer:** Implement an interactive canvas or SVG-based network graph using GSAP. 
  - Represent each peer as a node labeled with their custom/generated name.
  - Draw dynamic vector lines connecting peers representing established WebRTC data links.
  - **Active Transfer Overlays:** When User A initiates a file transfer to User B, animate data particles along the specific link vector from Node A to Node B in real time, reflecting data transmission states.
- **File Stage Area:**
  - Build a dropzone component with hybrid drag-and-drop triggers and a standard OS native file explorer fallback.
  - Multi-file queuing capability before explicit user confirmation to transfer.

---

### 4. Core Feature: Real-Time Global Metadata Registry (The Sharing Table)
- When a user selects a file for sharing, the metadata is pushed out to all mesh participants immediately via WebRTC data channel broadcast (or fallback signaling broadcast).
- Render a unified reactive table displayed uniformly across all client instances.
- **Schema Fields:** - `File Name` (String)
  - `Sender Name/ID` (String)
  - `Size` (Formatted bytes)
  - `MIME Type` (String)
  - `Status` (Idle / Compressing / Encrypting / Transmitting [X%] / Complete)
  - `Action Button` (Download trigger)

---

### 5. Core Feature: Performance-Optimized File Processing & Streaming Pipeline
When a peer clicks "Download" on a shared entry, the local machine containing the asset transitions into a server-equivalent source node. Implement a zero-memory-leak streaming processing pipeline structured as follows:

#### [Phase A: Outbound Serialization (Sender Loop)]
1. **File Chunking:** Stream the local source file in fixed sizes (e.g., 64KB ArrayBuffers) using `ReadableStream` or `FileReader.readAsArrayBuffer()` to prevent V8 engine memory crashes.
2. **Compression Block:** Compress the raw binary chunk using the browser’s native **Compression Streams API** (`Zstandard` algorithm via `CompressionStream`) to lower transmission overhead.
3. **Encryption Block:** Encrypt the compressed data payload using **Web Crypto API** (recommended: `AES-GCM` mode with unique Initialization Vectors [IV] per transaction) ensuring absolute security during transport.
4. **Transport:** Push chunks down the designated `RTCDataChannel`.

#### [Phase B: Inbound Deserialization (Receiver Loop)]
1. **Buffer Processing:** Catch arriving chunks inside the `dataChannel.onmessage` handler.
2. **Decryption Block:** Decrypt the encrypted block using the Web Crypto API framework.
3. **Decompression Block:** Pass decrypted data through a `DecompressionStream` instance.
4. **Blob Reconstruction & Save:** Stream chunks directly into a `WritableStream` or collect them within a growing array buffer. Assemble into a single master `Blob` upon transmission termination, triggering a clean client-side asset download (`URL.createObjectURL`).

---

### 6. Code Architecture Outputs Requested
Provide clean, functional TypeScript implementations for:
1. The client-side P2P Mesh configuration engine (`useWebRTCMesh.ts`).
2. The sender/receiver optimization engine containing the Compressing $\rightarrow$ Encrypting processing pipeline.
3. The real-time interactive UI structural components utilizing Tailwind and Framer Motion layout definitions.