# Implementation Plan
## P2P File Share — Phased Build Strategy

**Version:** 1.0.0  
**Last Updated:** 2026-07-15

---

## 1. Implementation Strategy

### 1.1 Guiding Principles
1. **Vertical Slicing:** Build complete, testable features end-to-end rather than horizontal layers (e.g., build "create room + join room + file send" together, not "all UI first").
2. **Test as You Build:** Write tests alongside implementation, not after.
3. **Deploy Early:** Get a working MVP deployed by Day 3 to catch infrastructure issues early.
4. **Keep It Simple:** Avoid premature optimization. Add compression, resume, and advanced features only after core works.

### 1.2 Development Phases Overview

| Phase | Name | Duration | Deliverable |
|-------|------|----------|-------------|
| 1 | Core P2P Foundation | Day 1–2 | Working room creation, peer connection, basic file send/receive |
| 2 | Production Hardening | Day 3 | E2E encryption, chunked streaming, validation, error handling |
| 3 | UI Polish & Visualization | Day 4 | Responsive UI, GSAP network graph, animations |
| 4 | Testing & Deployment | Day 5 | Tests, CI/CD, deployment to Vercel + Railway |

> **Note:** See `Phase.md` for the detailed day-by-day 5-day plan.

---

## 2. Phase 1: Core P2P Foundation (Day 1–2)

### 2.1 Goals
- Set up Next.js project with TypeScript strict mode and Tailwind CSS.
- Implement custom WebSocket signaling server.
- Implement room creation, joining, and basic WebRTC mesh (2 peers).
- Implement basic file send/receive (no encryption, no compression).
- Deploy to Vercel + Railway.

### 2.2 Tasks

#### Task 1.1: Project Setup
- [ ] Initialize Next.js 14 project with TypeScript (`npx create-next-app@latest`).
- [ ] Configure `tsconfig.json` with strict mode.
- [ ] Install dependencies: `tailwindcss`, `zustand`, `ws` (server), `@upstash/redis`, `qrcode.react`, `lucide-react`, `js-file-download`.
- [ ] Set up ESLint + Prettier.
- [ ] Configure Tailwind with custom colors and dark mode.

#### Task 1.2: Signaling Server
- [ ] Create `server/signaling.ts` with `ws` + Upstash Redis.
- [ ] Implement `join` message handler (room creation + joining).
- [ ] Implement `leave` message handler.
- [ ] Implement `signal` message handler (SDP/ICE relay via Redis pub/sub).
- [ ] Add basic rate limiting (10 joins per minute per IP).
- [ ] Add error handling and input validation.
- [ ] Test locally with two browser tabs.

#### Task 1.3: Frontend Signaling Client
- [ ] Create `lib/signaling.ts` WebSocket client hook (`useSignaling`).
- [ ] Implement auto-reconnect with exponential backoff (max 3 retries).
- [ ] Implement message handlers: `peers-list`, `user-joined`, `user-left`, `signal`.
- [ ] Add connection state tracking in Zustand store.

#### Task 1.4: WebRTC Core
- [ ] Create `hooks/useWebRTC.ts`.
- [ ] Implement `createPeerConnection()` with STUN/TURN config.
- [ ] Implement `createOffer()` and `createAnswer()`.
- [ ] Implement ICE candidate handling.
- [ ] Implement DataChannel creation and event listeners (`onopen`, `onmessage`, `onclose`, `onerror`).
- [ ] Add connection state machine (new → checking → connected → failed → closed).

#### Task 1.5: Room Page (Basic)
- [ ] Create `app/room/[code]/page.tsx`.
- [ ] Build `RoomHeader` component (display code, copy button, leave button).
- [ ] Build `PeerList` component (show connected peers).
- [ ] Build basic `Dropzone` component (file selection).
- [ ] Wire up: create room → navigate → join signaling → WebRTC connect.

#### Task 1.6: Basic File Transfer
- [ ] Implement `sendFile()` — read file as ArrayBuffer, send via DataChannel.
- [ ] Implement `receiveFile()` — collect chunks, reconstruct Blob, trigger download.
- [ ] Add `FileTable` component (show shared files).
- [ ] Test: Host creates room, Guest joins, Host sends file, Guest downloads.

#### Task 1.7: Deployment
- [ ] Deploy signaling server to Railway (connect GitHub repo).
- [ ] Deploy frontend to Vercel (connect GitHub repo).
- [ ] Set environment variables (`NEXT_PUBLIC_WS_URL`, etc.).
- [ ] Test live deployment with two different networks.

### 2.3 Phase 1 Deliverable
A working P2P file transfer app where:
- Users can create/join rooms.
- Two peers can connect.
- One peer can send a file, the other can download it.
- Deployed and accessible publicly.

---

## 3. Phase 2: Production Hardening (Day 3)

### 3.1 Goals
- Add E2E encryption (ECDH + AES-GCM).
- Implement chunked streaming with backpressure.
- Add input validation, rate limiting, and error handling.
- Add STUN/TURN configuration.

### 3.2 Tasks

#### Task 2.1: E2E Encryption
- [ ] Create `lib/crypto.ts` with ECDH key generation.
- [ ] Implement `generateKeyPair()` (ECDH P-384).
- [ ] Implement `deriveAesKey()` (ECDH → HKDF → AES-256-GCM).
- [ ] Implement `encryptChunk()` (AES-GCM with unique IV).
- [ ] Implement `decryptChunk()`.
- [ ] Wire encryption into file send/receive pipeline.
- [ ] Test: verify encrypted data is unreadable without key.

#### Task 2.2: Chunked Streaming
- [ ] Implement `readFileChunks()` generator (64 KB chunks).
- [ ] Implement `reassembleChunks()` (sort by index, create Blob).
- [ ] Add backpressure handling (`bufferedAmountLowThreshold`, `onbufferedamountlow`).
- [ ] Add chunk-level progress tracking.
- [ ] Test with large files (1 GB+).

#### Task 2.3: Validation & Error Handling
- [ ] Add file validation (size, MIME type) in `Dropzone` and `sendFile`.
- [ ] Add display name validation.
- [ ] Add connection state error handling (ICE failed, disconnected).
- [ ] Add user-friendly error messages (toasts, inline errors).
- [ ] Add auto-reconnect logic for signaling server.
- [ ] Add connection timeout (15 seconds).

#### Task 2.4: STUN/TURN
- [ ] Configure Google STUN servers.
- [ ] Deploy coturn on Render (free tier).
- [ ] Test TURN fallback on symmetric NAT (mobile hotspot).
- [ ] Add connection state logging for debugging.

### 3.3 Phase 2 Deliverable
A production-hardened app where:
- Files are E2E encrypted.
- Large files transfer reliably with chunked streaming.
- Input validation prevents invalid data.
- Errors are handled gracefully with user feedback.
- Works behind most NATs/firewalls.

---

## 4. Phase 3: UI Polish & Visualization (Day 4)

### 4.1 Goals
- Build responsive, accessible UI with Tailwind.
- Add GSAP network topology graph.
- Add Framer Motion animations.
- Ensure mobile responsiveness.

### 4.2 Tasks

#### Task 3.1: Responsive UI
- [ ] Implement `RoomHeader` with copy, QR code, leave button.
- [ ] Implement `PeerList` with connection status indicators.
- [ ] Implement `FileTable` with progress bars and download buttons.
- [ ] Ensure all components are responsive (mobile, tablet, desktop).
- [ ] Add dark mode support (CSS variables + Tailwind dark: prefix).
- [ ] Add loading skeletons and empty states.

#### Task 3.2: Network Graph (GSAP)
- [ ] Create `components/room/NetworkGraph.tsx`.
- [ ] Render peers as SVG nodes with display names.
- [ ] Draw edges between connected peers.
- [ ] Animate node entrance with GSAP.
- [ ] Animate data particles along edges during transfer.
- [ ] Position nodes in a circle or force-directed layout.

#### Task 3.3: Animations (Framer Motion)
- [ ] Add page transition animations (fade + slide).
- [ ] Add micro-interactions (button hover, card hover).
- [ ] Add connection status pulse animation.
- [ ] Add progress bar animations.

#### Task 3.4: Accessibility
- [ ] Add ARIA labels to all interactive elements.
- [ ] Ensure keyboard navigation works (tab order, enter/space activation).
- [ ] Add `aria-live` regions for connection status and transfer progress.
- [ ] Test with screen reader (NVDA or VoiceOver).
- [ ] Verify color contrast ratios.

### 4.3 Phase 3 Deliverable
A polished, responsive UI that:
- Looks professional on all devices.
- Includes an animated network graph.
- Has smooth animations and transitions.
- Is accessible to keyboard and screen reader users.

---

## 5. Phase 4: Testing & Deployment (Day 5)

### 5.1 Goals
- Write unit tests for core logic.
- Write E2E tests for WebRTC flows.
- Set up CI/CD pipeline.
- Deploy to production.
- Write comprehensive README.

### 5.2 Tasks

#### Task 4.1: Unit Tests (Vitest)
- [ ] Test `generateRoomCode()` and `validateRoomCode()`.
- [ ] Test `formatBytes()` and `formatTime()`.
- [ ] Test `readFileChunks()` and `reassembleChunks()`.
- [ ] Test `validateFile()` and `validateDisplayName()`.
- [ ] Test encryption utilities (encrypt → decrypt → compare).
- [ ] Test Zustand store actions (addPeer, removePeer, updateFileProgress).
- [ ] Target: > 80% coverage for `lib/` and `hooks/`.

#### Task 4.2: Integration Tests (Vitest)
- [ ] Test signaling message serialization/deserialization.
- [ ] Test Redis pub/sub message relay.
- [ ] Test WebSocket server message handlers.
- [ ] Test WebRTC configuration generation.

#### Task 4.3: E2E Tests (Playwright)
- [ ] Test: Create room → verify room page loads.
- [ ] Test: Join room with code → verify peer appears in list.
- [ ] Test: Send small file → verify receiver downloads correct file.
- [ ] Test: Send large file (100 MB) → verify progress and completion.
- [ ] Test: Connection drop → verify reconnect logic.
- [ ] Test: Multiple peers join → verify mesh connectivity.

#### Task 4.4: CI/CD
- [ ] Create `.github/workflows/ci.yml`.
- [ ] Configure lint, typecheck, test, and build jobs.
- [ ] Add status badges to README.
- [ ] Enable Vercel preview deployments for PRs.

#### Task 4.5: Documentation
- [ ] Write comprehensive `README.md` (live demo, architecture, tech stack, features, performance, cost analysis).
- [ ] Write `ARCHITECTURE.md` (detailed system design, data flow diagrams).
- [ ] Write `CONTRIBUTING.md` (setup, lint, test, commit conventions).
- [ ] Add code comments for complex logic (WebRTC, encryption).

#### Task 4.6: Final Deployment
- [ ] Verify production build (`next build`) passes.
- [ ] Deploy to Vercel (production branch).
- [ ] Deploy signaling server to Railway (production branch).
- [ ] Run smoke tests on live deployment.
- [ ] Verify HTTPS and WSS work (required for WebRTC).
- [ ] Test on real mobile devices (iOS Safari, Chrome Android).

### 5.3 Phase 4 Deliverable
A fully tested, deployed, documented project ready for resume/portfolio.

---

## 6. File-by-File Implementation Order

### 6.1 Configuration Files (Day 1, Morning)
1. `tsconfig.json` — Strict mode, path aliases
2. `tailwind.config.ts` — Custom theme, dark mode
3. `postcss.config.js` — Tailwind + Autoprefixer
4. `.eslintrc.json` + `.prettierrc` — Linting and formatting
5. `.env.example` — Environment variable templates
6. `next.config.js` — Next.js config (if needed)

### 6.2 Library / Utilities (Day 1, Afternoon)
1. `lib/constants.ts` — All constants (chunk size, timeouts, etc.)
2. `lib/validators.ts` — Validation functions
3. `lib/utils.ts` — Formatting utilities (bytes, time, IDs)
4. `lib/crypto.ts` — Encryption utilities (ECDH, AES-GCM)
5. `lib/chunker.ts` — File chunking and reassembly

### 6.3 Types (Day 1, Afternoon)
1. `types/signaling.ts` — Signaling message types
2. `types/webrtc.ts` — WebRTC and DataChannel types
3. `types/room.ts` — Room, Peer, FileEntry types
4. `types/events.ts` — Event types

### 6.4 Server (Day 1, Evening)
1. `server/signaling.ts` — WebSocket server with Redis
2. `server/index.ts` — Entry point

### 6.5 Store (Day 2, Morning)
1. `store/roomStore.ts` — Zustand store for room state

### 6.6 Hooks (Day 2, Morning)
1. `hooks/useSignaling.ts` — WebSocket client hook
2. `hooks/useWebRTC.ts` — WebRTC connection management
3. `hooks/useEncryption.ts` — Encryption key management
4. `hooks/useFileTransfer.ts` — Send/receive file pipeline

### 6.7 Components (Day 2, Afternoon)
1. `components/ui/Button.tsx`
2. `components/ui/Card.tsx`
3. `components/ui/Input.tsx`
4. `components/ui/Dropzone.tsx`
5. `components/room/RoomHeader.tsx`
6. `components/room/PeerList.tsx`
7. `components/room/FileTable.tsx`
8. `components/room/NetworkGraph.tsx`
9. `components/room/ConnectionStatus.tsx`
10. `components/providers/WebRTCProvider.tsx`

### 6.8 Pages (Day 2, Afternoon)
1. `app/layout.tsx` — Root layout with providers
2. `app/page.tsx` — Landing page
3. `app/room/[code]/page.tsx` — Room page

### 6.9 Tests (Day 5, Morning)
1. `__tests__/lib/validators.test.ts`
2. `__tests__/lib/utils.test.ts`
3. `__tests__/lib/crypto.test.ts`
4. `__tests__/hooks/useWebRTC.test.ts`
5. `__tests__/store/roomStore.test.ts`
6. `e2e/room.spec.ts` — Playwright E2E tests

### 6.10 Documentation & Deployment (Day 5, Afternoon)
1. `README.md`
2. `ARCHITECTURE.md`
3. `CONTRIBUTING.md`
4. `.github/workflows/ci.yml`
5. Deploy to Vercel + Railway

---

## 7. Dependency Installation

```bash
# Core
npm install next react react-dom typescript @types/react @types/node
npm install -D tailwindcss postcss autoprefixer

# State & UI
npm install zustand framer-motion gsap lucide-react qrcode.react js-file-download

# Server
npm install ws @upstash/redis

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
npm install -D @playwright/test

# Linting
npm install -D eslint eslint-config-next prettier
```

---

## 8. Git Workflow

```bash
# Branch naming
feature/phase1-signaling
feature/phase2-encryption
feature/phase3-network-graph
fix/datachannel-backpressure
chore/update-dependencies

# Commit convention (Conventional Commits)
feat: add WebRTC mesh connection logic
fix: handle DataChannel buffer overflow
docs: update architecture diagram
test: add encryption unit tests
chore: upgrade Next.js to 14.2
```

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WebRTC fails on some networks | Implement STUN/TURN, add connection timeout, graceful error messages |
| Redis free tier exhausted | Use Redis pub/sub (1 publish = N subscribers), monitor command count |
| Browser memory crash | Implement chunked streaming + backpressure, test with large files |
| Signaling server downtime | Auto-reconnect logic, fallback messaging |
| Large bundle size | Dynamic imports for GSAP/QR code, analyze with `@next/bundle-analyzer` |
