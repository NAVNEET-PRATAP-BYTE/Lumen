# Phase Plan
## P2P File Share — 5-Day Sprint Breakdown

**Version:** 1.0.0  
**Last Updated:** 2026-07-15  
**Total Duration:** 5 days  
**Methodology:** Vertical slicing (complete features end-to-end)

---

## Overview

This phase plan divides the project into **4 development phases** and **1 testing phase**, spread across 5 days. Each phase builds on the previous one, ensuring a working, deployable product at every milestone.

| Phase | Name | Days | Focus |
|-------|------|------|-------|
| 1 | Core P2P Foundation | Day 1–2 | Signaling, WebRTC, basic file transfer |
| 2 | Production Hardening | Day 3 | Encryption, chunking, validation, error handling |
| 3 | UI Polish & Visualization | Day 4 | Responsive UI, GSAP graph, animations |
| 4 | Testing & Documentation | Day 5 | Tests, CI/CD, docs, deployment |

> **Testing is integrated throughout**, but Phase 4 is dedicated to comprehensive testing and final polish.

---

## Phase 1: Core P2P Foundation (Day 1–2)

**Goal:** Two browsers can connect and transfer files.

### Day 1 — Project Setup + Signaling Server

#### Morning

| Task | Deliverable |
|------|-------------|
| Initialize Next.js 14 + TypeScript strict mode | `next.config.js`, `tsconfig.json` |
| Install dependencies + configure Tailwind | `tailwind.config.ts`, `postcss.config.js` |
| Set up ESLint + Prettier | `.eslintrc.json`, `.prettierrc` |
| Create signaling server (`server/signaling.ts`) | WebSocket server with `ws` + Redis |
| Implement room management (join/leave) | Redis-backed room state |
| Implement signal relay (SDP/ICE via Redis pub/sub) | Signaling messages working |

#### Afternoon

| Task | Deliverable |
|------|-------------|
| Create WebSocket client hook (`useSignaling`) | Client connects, joins room |
| Implement auto-reconnect + message handlers | Reconnection with exponential backoff |
| Create Zustand store (`roomStore`) | Global state for room, peers, files |
| Create landing page (`app/page.tsx`) | Create/Join room UI |

**Day 1 End State:**
- Signaling server running locally.
- Client can connect, create/join rooms.
- Room state synced across clients.

### Day 2 — WebRTC + File Transfer + Deploy

#### Morning

| Task | Deliverable |
|------|-------------|
| Create `useWebRTC` hook | RTCPeerConnection management |
| Implement offer/answer + ICE candidates | WebRTC handshake logic |
| Implement DataChannel (create + events) | DataChannel open, message, close |
| Wire mesh connections (host → guest) | Full-mesh for 2 peers |

#### Afternoon

| Task | Deliverable |
|------|-------------|
| Implement basic `sendFile()` + `receiveFile()` | Blob transfer via DataChannel |
| Build `RoomHeader`, `PeerList`, `FileTable` | Room page UI components |
| Test end-to-end (two browser tabs) | Host creates room, guest joins, file sent/downloaded |
| Deploy to Vercel + Railway | Live demo accessible publicly |

**Day 2 End State:**
- MVP deployed.
- Two peers can connect and transfer files.
- Live demo URL ready for sharing.

---

## Phase 2: Production Hardening (Day 3)

**Goal:** Secure, reliable, large-file-capable transfer.

### Day 3 — Encryption + Chunking + Validation

#### Morning

| Task | Deliverable |
|------|-------------|
| Create `lib/crypto.ts` (ECDH + AES-GCM) | Key generation, derivation, encrypt/decrypt |
| Implement `generateKeyPair()` + `deriveAesKey()` | ECDH P-384 key agreement |
| Implement `encryptChunk()` + `decryptChunk()` | AES-256-GCM with unique IV per chunk |
| Wire encryption into send/receive pipeline | E2E encrypted file transfer |

#### Afternoon

| Task | Deliverable |
|------|-------------|
| Implement chunked streaming (`readFileChunks`) | 64 KB chunks, async generator |
| Implement backpressure (`bufferedAmountLow`) | No more browser crashes |
| Add input validation (file size, MIME, display name) | Validation + user-friendly errors |
| Add connection state error handling + timeout | Graceful failure + auto-reconnect |

**Day 3 End State:**
- Files are E2E encrypted.
- Large files transfer reliably (tested with 1 GB+).
- Input validated, errors handled gracefully.
- Connection resilient to drops.

---

## Phase 3: UI Polish & Visualization (Day 4)

**Goal:** Professional, responsive, animated interface.

### Day 4 — Responsive UI + Network Graph

#### Morning

| Task | Deliverable |
|------|-------------|
| Build responsive `RoomHeader` | Copy code, QR, leave button |
| Build `PeerList` with status indicators | Connected/connecting/disconnected states |
| Build `FileTable` with progress bars | Shared files, download buttons, progress |
| Ensure responsive layout (mobile, tablet, desktop) | Tailwind grid + breakpoints |

#### Afternoon

| Task | Deliverable |
|------|-------------|
| Add dark mode support | CSS variables + Tailwind `dark:` |
| Build GSAP network graph (`NetworkGraph.tsx`) | SVG nodes + edges + animations |
| Add Framer Motion animations | Page transitions, micro-interactions |
| Accessibility audit (ARIA, keyboard nav, contrast) | WCAG 2.1 AA compliant |

**Day 4 End State:**
- Polished, responsive UI.
- Animated network graph.
- Dark mode support.
- Accessible to keyboard and screen reader users.

---

## Phase 4: Testing & Deployment (Day 5)

**Goal:** Tested, documented, production-ready.

### Day 5 — Tests + CI/CD + Docs + Deploy

#### Morning

| Task | Deliverable |
|------|-------------|
| Write unit tests (Vitest) | `validators`, `utils`, `crypto`, `store` |
| Write integration tests | Signaling messages, WebSocket handlers |
| Write E2E tests (Playwright) | Room creation, join, file transfer |
| Set up CI/CD (GitHub Actions) | Lint, typecheck, test, build on every push |

#### Afternoon

| Task | Deliverable |
|------|-------------|
| Write documentation (README, ARCHITECTURE, CONTRIBUTING) | Comprehensive docs with diagrams |
| Final code review + cleanup | Remove console.logs, add comments |
| Production deploy + smoke tests | Vercel + Railway, live tests |
| Portfolio preparation | GitHub repo polished, demo video recorded |

**Day 5 End State:**
- All tests passing.
- CI/CD pipeline active.
- Documentation complete.
- Live demo deployed and verified.
- Portfolio-ready.

---

## Daily Schedule Template

Each day follows this schedule:

```
09:00 — 09:15 | Standup: Review yesterday, plan today
09:15 — 13:00 | Deep Work Block 1 (Morning)
13:00 — 14:00 | Lunch + Break
14:00 — 18:00 | Deep Work Block 2 (Afternoon)
18:00 — 18:15 | End-of-day review: What was completed, what's tomorrow
```

**Deep Work Rules:**
- No social media during work blocks.
- Phone on silent.
- One task at a time (no multitasking).
- 5-minute break every 45 minutes (Pomodoro).

---

## Milestone Checklist

| Milestone | Criteria | Check |
|-----------|----------|-------|
| **M1: Project Scaffolded** | Next.js + Tailwind + server skeleton working | ☐ |
| **M2: Signaling Working** | Two clients join room, exchange messages | ☐ |
| **M3: WebRTC Connected** | Two peers establish DataChannel | ☐ |
| **M4: Basic File Transfer** | Send/receive file without encryption | ☐ |
| **M5: MVP Deployed** | Live on Vercel + Railway, file transfer works | ☐ |
| **M6: Encrypted Transfer** | E2E encryption working end-to-end | ☐ |
| **M7: Chunked Streaming** | Large files transfer without memory issues | ☐ |
| **M8: Polished UI** | Responsive, animated, accessible interface | ☐ |
| **M9: Tests Passing** | Unit + integration + E2E tests green | ☐ |
| **M10: Production Ready** | CI/CD, docs, live demo, portfolio-ready | ☐ |

---

## Risk Mitigation Timeline

| Risk | When to Address | Action |
|------|-----------------|--------|
| WebRTC fails on specific browser | Day 2 | Test on Chrome, Firefox, Safari early |
| Redis free tier exhausted | Day 1 | Monitor command count, use pub/sub |
| Large file memory crash | Day 3 | Test with 1 GB file on Day 3 morning |
| Coturn TURN unreachable | Day 3 | Test TURN fallback on mobile hotspot |
| Scope creep | Every day | Follow Phase.md strictly, defer post-MVP features |
| Burnout | Every day | Take breaks, sleep 7+ hours, don't pull all-nighters |

---

## Success Criteria for Each Phase

### Phase 1 Success Criteria
- [ ] Signaling server accepts WebSocket connections.
- [ ] Client can create/join rooms.
- [ ] Two peers can establish WebRTC DataChannel.
- [ ] Basic file (10 MB) transfers successfully.
- [ ] Deployed to Vercel + Railway.

### Phase 2 Success Criteria
- [ ] Files are encrypted in transit (verify with Wireshark or console logs).
- [ ] 1 GB file transfers without browser crash.
- [ ] All user inputs validated (room code, file size, MIME type).
- [ ] Connection drops handled gracefully (auto-reconnect).
- [ ] No memory leaks (Chrome DevTools heap snapshot stable).

### Phase 3 Success Criteria
- [ ] UI looks good on iPhone SE, iPad, 1080p desktop.
- [ ] Dark mode works across all pages.
- [ ] Network graph animates smoothly (GSAP).
- [ ] All interactive elements keyboard accessible.
- [ ] Color contrast passes WCAG AA.

### Phase 4 Success Criteria
- [ ] Unit test coverage > 80% for `lib/` and `hooks/`.
- [ ] All E2E tests pass in CI.
- [ ] `tsc --noEmit` passes with zero errors.
- [ ] `eslint .` passes with zero warnings.
- [ ] README includes live demo, architecture, tech stack.
- [ ] Live demo accessible at public URL.

---

## Post-Sprint Actions

1. **Share the project:**
   - Post on LinkedIn with live demo link.
   - Share on GitHub with detailed README.
   - Write a blog post on Dev.to / Medium about the build process.

2. **Apply for internships:**
   - Update resume with project link.
   - Prepare 2-minute demo video.
   - Practice explaining architecture (WebRTC, signaling, encryption).

3. **Gather feedback:**
   - Share with peers for usability testing.
   - Collect bug reports and feature requests.
   - Prioritize post-MVP features.

4. **Iterate:**
   - Add resume/pause for interrupted transfers.
   - Add file compression (gzip).
   - Add chat/messaging alongside file transfer.
   - Add user accounts (OAuth).

---

## Notes

- **This is a guide, not a contract.** Adjust daily based on progress.
- **If you fall behind, prioritize core functionality over polish.** A working, deployed MVP is better than a half-finished polished app.
- **Document blockers immediately.** If stuck for > 1 hour, write down the problem and move to a different task. Return with fresh eyes.
- **Celebrate small wins.** Each completed phase is a major achievement. Take breaks, stay motivated.
