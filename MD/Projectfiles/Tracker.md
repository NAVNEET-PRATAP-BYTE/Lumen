# Project Tracker
## P2P File Share — 5-Day Sprint Tracker

**Version:** 1.0.0  
**Last Updated:** 2026-07-15  
**Sprint Duration:** 5 days (Day 1–5)

---

## 1. Tracker Legend

| Status | Icon | Description |
|--------|------|-------------|
| **Pending** | ⬜ | Task not started |
| **In Progress** | 🔄 | Task actively being worked on |
| **Blocked** | 🚫 | Task cannot proceed due to dependency |
| **Complete** | ✅ | Task finished and verified |
| **Skipped** | ⏭️ | Task deferred to post-MVP |

---

## 2. Phase 1: Core P2P Foundation (Day 1–2)

### Day 1 — Project Setup + Signaling Server

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.1.1 | Initialize Next.js 14 + TypeScript strict mode | Dev | ⬜ | `npx create-next-app@latest --typescript --tailwind --eslint` |
| 1.1.2 | Configure tsconfig.json (strict, path aliases) | Dev | ⬜ | `strict: true`, `noUnusedLocals`, `noImplicitReturns` |
| 1.1.3 | Install core dependencies (zustand, ws, @upstash/redis, qrcode.react, lucide-react, js-file-download) | Dev | ⬜ | |
| 1.1.4 | Set up ESLint + Prettier | Dev | ⬜ | Enforce consistent formatting |
| 1.1.5 | Configure Tailwind (custom theme, dark mode) | Dev | ⬜ | |
| 1.2.1 | Create server/signaling.ts (ws + Redis) | Dev | ⬜ | Room management, message relay |
| 1.2.2 | Implement join/leave message handlers | Dev | ⬜ | Redis SET/DEL for room peers |
| 1.2.3 | Implement signal message handler (SDP/ICE relay) | Dev | ⬜ | Redis pub/sub for efficiency |
| 1.2.4 | Add rate limiting (10 joins/min per IP) | Dev | ⬜ | Redis INCR + EXPIRE |
| 1.2.5 | Add input validation + error handling | Dev | ⬜ | JSON schema validation |
| 1.3.1 | Create lib/signaling.ts WebSocket client | Dev | ⬜ | Reconnection logic |
| 1.3.2 | Implement auto-reconnect (exponential backoff, max 3) | Dev | ⬜ | |
| 1.3.3 | Implement message handlers (peers-list, user-joined, user-left, signal) | Dev | ⬜ | Dispatch to Zustand store |

**Day 1 Target:** Signaling server working, client connects, room state synced.

### Day 2 — WebRTC + File Transfer + Deploy

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.4.1 | Create hooks/useWebRTC.ts | Dev | ⬜ | RTCPeerConnection management |
| 1.4.2 | Implement createOffer/createAnswer | Dev | ⬜ | SDP generation |
| 1.4.3 | Implement ICE candidate handling | Dev | ⬜ | Trickle ICE |
| 1.4.4 | Implement DataChannel creation + events | Dev | ⬜ | onopen, onmessage, onclose, onerror |
| 1.4.5 | Add connection state machine | Dev | ⬜ | new → checking → connected → failed → closed |
| 1.5.1 | Create app/room/[code]/page.tsx | Dev | ⬜ | Room page shell |
| 1.5.2 | Build RoomHeader component (code, copy, QR, leave) | Dev | ⬜ | |
| 1.5.3 | Build PeerList component | Dev | ⬜ | Show connected peers |
| 1.5.4 | Build basic Dropzone component | Dev | ⬜ | File selection only |
| 1.5.5 | Wire up create room → navigate → join signaling → WebRTC | Dev | ⬜ | End-to-end flow |
| 1.6.1 | Implement sendFile() (basic, no encryption) | Dev | ⬜ | Read file as ArrayBuffer, send via DataChannel |
| 1.6.2 | Implement receiveFile() (basic, no encryption) | Dev | ⬜ | Collect chunks, reconstruct Blob, download |
| 1.6.3 | Build FileTable component | Dev | ⬜ | Show shared files with download button |
| 1.6.4 | Test: Host creates room, Guest joins, file send/receive | Dev | ⬜ | Manual test with two tabs |
| 1.7.1 | Deploy signaling server to Railway | Dev | ⬜ | Connect GitHub repo, set env vars |
| 1.7.2 | Deploy frontend to Vercel | Dev | ⬜ | Connect GitHub repo |
| 1.7.3 | Test live deployment (two different networks) | Dev | ⬜ | Verify HTTPS + WSS |

**Day 2 Target:** MVP deployed, two peers can connect and share files.

---

## 3. Phase 2: Production Hardening (Day 3)

### Day 3 — Encryption + Chunking + Validation

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1.1 | Create lib/crypto.ts | Dev | ⬜ | ECDH P-384 + AES-256-GCM |
| 2.1.2 | Implement generateKeyPair() (ECDH) | Dev | ⬜ | `crypto.subtle.generateKey` |
| 2.1.3 | Implement deriveAesKey() (ECDH → HKDF → AES) | Dev | ⬜ | `crypto.subtle.deriveKey` |
| 2.1.4 | Implement encryptChunk() (AES-GCM, unique IV) | Dev | ⬜ | 12-byte IV per chunk |
| 2.1.5 | Implement decryptChunk() | Dev | ⬜ | Reverse encryption |
| 2.1.6 | Wire encryption into send/receive pipeline | Dev | ⬜ | Replace basic send/receive |
| 2.1.7 | Test: verify encrypted data unreadable without key | Dev | ⬜ | Use network inspector to verify |
| 2.2.1 | Implement readFileChunks() generator | Dev | ⬜ | 64 KB chunks, async generator |
| 2.2.2 | Implement reassembleChunks() | Dev | ⬜ | Sort by index, create Blob |
| 2.2.3 | Add backpressure handling (bufferedAmountLow) | Dev | ⬜ | Pause/resume sender |
| 2.2.4 | Add chunk-level progress tracking | Dev | ⬜ | Update Zustand store |
| 2.2.5 | Test with large file (1 GB+) | Dev | ⬜ | Monitor memory in DevTools |
| 2.3.1 | Add file validation (size, MIME type) | Dev | ⬜ | In Dropzone and sendFile |
| 2.3.2 | Add display name validation | Dev | ⬜ | 2–20 chars, no special chars |
| 2.3.3 | Add connection state error handling | Dev | ⬜ | ICE failed, disconnected |
| 2.3.4 | Add user-friendly error messages (toasts) | Dev | ⬜ | Ant Design or custom toast |
| 2.3.5 | Add auto-reconnect for signaling | Dev | ⬜ | Exponential backoff |
| 2.3.6 | Add connection timeout (15s) | Dev | ⬜ | Abort if ICE gathering too slow |
| 2.4.1 | Configure Google STUN servers | Dev | ⬜ | stun.l.google.com:19302 |
| 2.4.2 | Deploy coturn on Render (free tier) | Dev | ⬜ | Docker compose |
| 2.4.3 | Test TURN fallback on symmetric NAT | Dev | ⬜ | Mobile hotspot test |
| 2.4.4 | Add connection state logging | Dev | ⬜ | Console logs for debugging |

**Day 3 Target:** Secure, chunked file transfer with validation and error handling.

---

## 4. Phase 3: UI Polish & Visualization (Day 4)

### Day 4 — Responsive UI + Network Graph

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.1.1 | Implement RoomHeader (copy, QR, leave) | Dev | ⬜ | Responsive layout |
| 3.1.2 | Implement PeerList with status indicators | Dev | ⬜ | Connection state colors |
| 3.1.3 | Implement FileTable with progress bars | Dev | ⬜ | Download buttons, status text |
| 3.1.4 | Ensure responsive layout (mobile, tablet, desktop) | Dev | ⬜ | Tailwind grid + breakpoints |
| 3.1.5 | Add dark mode support | Dev | ⬜ | CSS variables + dark: prefix |
| 3.1.6 | Add loading skeletons + empty states | Dev | ⬜ | Skeleton screens |
| 3.2.1 | Create NetworkGraph component (SVG) | Dev | ⬜ | GSAP-powered |
| 3.2.2 | Render peer nodes with display names | Dev | ⬜ | SVG circles + text |
| 3.2.3 | Draw edges between connected peers | Dev | ⬜ | SVG lines |
| 3.2.4 | Animate node entrance (GSAP) | Dev | ⬜ | Stagger + back.out easing |
| 3.2.5 | Animate data particles during transfer | Dev | ⬜ | GSAP motion path |
| 3.2.6 | Position nodes (circle layout) | Dev | ⬜ | Math.cos/sin or force-directed |
| 3.3.1 | Add page transition animations (Framer Motion) | Dev | ⬜ | Fade + slide |
| 3.3.2 | Add button/card hover micro-interactions | Dev | ⬜ | Scale + shadow |
| 3.3.3 | Add connection status pulse animation | Dev | ⬜ | CSS animation or Framer Motion |
| 3.3.4 | Add progress bar animations | Dev | ⬜ | Smooth width transitions |
| 3.4.1 | Add ARIA labels to interactive elements | Dev | ⬜ | All buttons, inputs, links |
| 3.4.2 | Ensure keyboard navigation | Dev | ⬜ | Tab order, enter/space |
| 3.4.3 | Add aria-live regions for status/progress | Dev | ⬜ | Connection status, transfer progress |
| 3.4.4 | Test with screen reader (VoiceOver/NVDA) | Dev | ⬜ | Verify announcements |

**Day 4 Target:** Polished, responsive, animated UI ready for user testing.

---

## 5. Phase 5: Testing & Deployment (Day 5)

### Day 5 — Tests + CI/CD + Docs + Deploy

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 4.1.1 | Test generateRoomCode/validateRoomCode | Dev | ⬜ | Vitest unit test |
| 4.1.2 | Test formatBytes/formatTime | Dev | ⬜ | Vitest unit test |
| 4.1.3 | Test readFileChunks/reassembleChunks | Dev | ⬜ | Vitest unit test |
| 4.1.4 | Test validateFile/validateDisplayName | Dev | ⬜ | Vitest unit test |
| 4.1.5 | Test encrypt/decrypt round-trip | Dev | ⬜ | Vitest unit test |
| 4.1.6 | Test Zustand store actions | Dev | ⬜ | Vitest unit test |
| 4.2.1 | Test signaling message serialization | Dev | ⬜ | Vitest integration test |
| 4.2.2 | Test Redis pub/sub relay | Dev | ⬜ | Mock Redis or use test instance |
| 4.2.3 | Test WebSocket server handlers | Dev | ⬜ | Mock WebSocket connections |
| 4.2.4 | Test WebRTC config generation | Dev | ⬜ | Vitest integration test |
| 4.3.1 | Test: Create room → verify page loads | Dev | ⬜ | Playwright E2E |
| 4.3.2 | Test: Join room → verify peer in list | Dev | ⬜ | Playwright E2E |
| 4.3.3 | Test: Send small file → verify download | Dev | ⬜ | Playwright E2E |
| 4.3.4 | Test: Send large file (100 MB) → verify progress | Dev | ⬜ | Playwright E2E |
| 4.3.5 | Test: Connection drop → verify reconnect | Dev | ⬜ | Playwright E2E |
| 4.3.6 | Test: Multiple peers → verify mesh | Dev | ⬜ | Playwright E2E (3 tabs) |
| 4.4.1 | Create .github/workflows/ci.yml | Dev | ⬜ | Lint, typecheck, test, build |
| 4.4.2 | Add CI status badges to README | Dev | ⬜ | |
| 4.4.3 | Enable Vercel preview deployments for PRs | Dev | ⬜ | |
| 4.5.1 | Write README.md | Dev | ⬜ | Live demo, architecture, tech stack, features, performance |
| 4.5.2 | Write ARCHITECTURE.md | Dev | ⬜ | Detailed system design, diagrams |
| 4.5.3 | Write CONTRIBUTING.md | Dev | ⬜ | Setup, lint, test, commit conventions |
| 4.5.4 | Add code comments for complex logic | Dev | ⬜ | WebRTC, encryption, chunking |
| 4.6.1 | Verify production build passes | Dev | ⬜ | `next build` |
| 4.6.2 | Deploy frontend to Vercel (production) | Dev | ⬜ | |
| 4.6.3 | Deploy signaling server to Railway (production) | Dev | ⬜ | |
| 4.6.4 | Run smoke tests on live deployment | Dev | ⬜ | Create room, join, send file |
| 4.6.5 | Verify HTTPS + WSS | Dev | ⬜ | Required for WebRTC |
| 4.6.6 | Test on iOS Safari + Chrome Android | Dev | ⬜ | Real devices preferred |

**Day 5 Target:** Fully tested, CI/CD-enabled, deployed project with documentation.

---

## 6. Milestones

| Milestone | Criteria | Target Date |
|-----------|----------|-------------|
| **M1: Project Scaffolded** | Next.js + Tailwind + server skeleton | Day 1 EOD |
| **M2: Signaling Working** | Two clients can join room, exchange messages | Day 1 EOD |
| **M3: WebRTC Connected** | Two peers establish DataChannel | Day 2 Morning |
| **M4: Basic File Transfer** | Send/receive file without encryption | Day 2 EOD |
| **M5: MVP Deployed** | Live on Vercel + Railway, file transfer works | Day 2 EOD |
| **M6: Encrypted Transfer** | E2E encryption working end-to-end | Day 3 EOD |
| **M7: Chunked Streaming** | Large files transfer without memory issues | Day 3 EOD |
| **M8: Polished UI** | Responsive, animated, accessible interface | Day 4 EOD |
| **M9: Tests Passing** | Unit + integration + E2E tests green | Day 5 Morning |
| **M10: Production Ready** | CI/CD, docs, live demo, portfolio-ready | Day 5 EOD |

---

## 7. Daily Standup Checklist

Each day, answer these three questions:

1. **What did I complete yesterday?**
   - Check tasks marked ✅ from previous day.
2. **What will I work on today?**
   - Select tasks from current day's table, move to 🔄.
3. **What is blocking me?**
   - Identify any 🚫 tasks, document the blocker, and find a workaround or ask for help.

---

## 8. Burn-Down Chart (Ideal)

```
Tasks Remaining
|
|  [M10] 40
|  [M9]  35
|  [M8]  30
|  [M7]  25
|  [M6]  20
|  [M5]  15
|  [M4]  10
|  [M3]   5
|  [M2]   2
|  [M1]   0
|
+------------------ Day 1    Day 2    Day 3    Day 4    Day 5
```

---

## 9. Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| WebRTC fails on specific browser | Medium | High | Add browser detection, graceful fallback message | Dev |
| Railway free tier exhausted | Low | Medium | Monitor usage, implement usage alerts | Dev |
| Redis rate limit hit | Low | Medium | Optimize with pub/sub, cache aggressively | Dev |
| Large file causes memory crash | Medium | High | Implement chunking + backpressure, test early | Dev |
| Coturn TURN server unreachable | Medium | Medium | Add fallback TURN servers, test connectivity | Dev |
| Scope creep (adding too many features) | High | Medium | Strictly follow Phase.md, defer post-MVP features | Dev |

---

## 10. Success Metrics for This Sprint

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tasks completed | 90%+ | Tracker completion rate |
| Build passing | 100% | `next build` succeeds on all days |
| TypeScript errors | 0 | `tsc --noEmit` |
| ESLint warnings | 0 | `eslint .` |
| Test coverage | > 80% | Vitest coverage report |
| Deploy uptime | > 99% | Vercel + Railway status pages |
| Live demo functional | Yes | Manual smoke test on Day 5 |

---

## 11. Next Steps After Sprint

1. **Gather feedback:** Share live demo with peers, collect bug reports and feature requests.
2. **Add post-MVP features:** Resume/pause, compression, chat, user accounts.
3. **Optimize performance:** Bundle analysis, lazy loading, image optimization.
4. **Write blog post:** Document the build process, share on LinkedIn/Dev.to.
5. **Apply for internships:** Use live demo + GitHub repo as portfolio proof.
