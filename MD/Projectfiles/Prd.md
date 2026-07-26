# Product Requirements Document (PRD)
## P2P File Share — Decentralized, E2E Encrypted File Transfer

**Version:** 1.0.0  
**Last Updated:** 2026-07-15  
**Status:** Draft — Ready for Development  
**Owner:** Full-Stack Developer (Student Project / Internship Portfolio)

---

## 1. Problem Statement

### The Problem
In today's digital landscape, sharing large files between devices remains cumbersome:

1. **Email attachments** have size limits (25 MB for Gmail, etc.).
2. **Cloud storage** (Google Drive, Dropbox) requires upload to a central server, consuming bandwidth, storage quota, and time. Files pass through third-party servers, creating privacy risks.
3. **Messaging apps** (WhatsApp, Telegram) compress files, impose size limits, and store metadata on servers.
4. **USB drives / physical media** are inconvenient for remote sharing.

### The Solution
A **browser-based, peer-to-peer (P2P), end-to-end encrypted (E2EE)** file-sharing application that:

- Transfers files **directly between browsers** without intermediate server storage.
- Uses **WebRTC DataChannels** for high-throughput, low-latency binary transfer.
- Implements **E2E encryption** (ECDH key agreement + AES-256-GCM) so only sender and receiver can read the file.
- Requires **no login, no installation, no file size limits** (within browser constraints).
- Is **100% free** to host and use, built on free-tier cloud services.

### Why This Matters for a Resume
This project demonstrates:
- Full-stack engineering (Next.js + custom WebSocket signaling + Redis).
- Real-time systems expertise (WebRTC, state machines, concurrency).
- Security awareness (E2E encryption, input validation, rate limiting).
- Infrastructure knowledge (free-tier deployment, horizontal scaling with Redis pub/sub).
- Product thinking (clean UI, accessibility, error handling, performance optimization).

---

## 2. Target Users

| User Segment | Description | Primary Need |
|--------------|-------------|--------------|
| **Students** | University/college students sharing lecture notes, project files, and media | Quick, free, no-registration file sharing within study groups |
| **Freelancers / Creatives** | Designers, video editors, developers sharing large assets with clients | Transfer 1–5 GB files without cloud storage limits or compression |
| **Remote Teams** | Small teams collaborating on sensitive documents | E2E encrypted transfer for confidential data |
| **Developers / Tech Enthusiasts** | Users who value privacy and decentralization | Zero-knowledge sharing with full transparency |
| **Interviewers / Recruiters** | Evaluating the candidate's full-stack capabilities | A well-architected, deployed, documented live project |

### Primary User Persona
**Name:** Alex  
**Age:** 22  
**Role:** Computer Science Student  
**Tech Comfort:** High (uses Git, VS Code, familiar with CLI)  
**Scenario:** Alex needs to share a 3 GB dataset with a project teammate. Email fails. Google Drive requires 2 hours to upload + download. Alex opens the P2P app, creates a room, shares the link, and the teammate downloads directly from Alex's browser in 8 minutes.

---

## 3. Core Features (MVP)

### 3.1 Room-Based Sharing
- Any user can **create a room** by clicking "Create Room."
- Room is identified by a **6-character alphanumeric code** (e.g., `a7B9zK`).
- Room is also accessible via a **direct link** (`/room/a7B9zK`) and a **QR code**.
- Any user with the code/link can **join the room**.
- Room supports **up to 6 peers** in a full-mesh topology.

### 3.2 Peer Discovery & Connection
- Users see a **real-time list of connected peers** in the room.
- Each peer has a **editable display name** (default: "Peer-XXXX").
- Connection status indicators: **Connecting → Connected → Disconnected**.
- **WebRTC DataChannel** established directly between every pair of peers in the room.

### 3.3 File Sharing
- **Drag-and-drop** file upload zone + standard file picker.
- **Multi-file queuing** — select multiple files before sending.
- File metadata displayed in a **shared table** visible to all room participants:
  - File name, size (formatted bytes), MIME type, sender name, status, action button.
- **One-click download** for receivers.
- **Chunked streaming** with backpressure to prevent browser crashes on large files.

### 3.4 End-to-End Encryption
- **ECDH P-384** key agreement for secure key exchange.
- **AES-256-GCM** encryption for file chunks.
- Unique **12-byte IV per chunk**.
- Keys are **ephemeral** (generated per room session) — no persistent storage.
- Zero-knowledge: the signaling server cannot read file contents.

### 3.5 Real-Time Network Visualization
- **Interactive SVG/Canvas network graph** showing all peers as nodes.
- Animated **connection lines** between peers.
- **Data particle animations** when a file is being transferred (GSAP-powered).
- Peer names and connection status overlaid on nodes.

### 3.6 Responsive, Minimal UI
- **Tailwind CSS** for clean, minimal styling.
- **Framer Motion** for smooth transitions and micro-interactions.
- Fully **responsive** layout (mobile, tablet, desktop).
- **Dark mode** support.
- Accessible: keyboard navigation, ARIA labels, screen reader support.

---

## 4. Success Criteria

### 4.1 Functional Success
| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Room creation & join | < 3 seconds end-to-end | Stopwatch from "Create" to "Connected" status |
| File transfer success rate | > 99% for files < 1 GB | Automated Playwright test (100 iterations) |
| Connection success rate | > 95% across networks | Manual testing on WiFi, 4G, corporate VPN |
| UI responsiveness | All breakpoints functional | Manual test on iPhone SE, iPad, 1080p desktop |
| Memory usage | < 100 MB during 1 GB transfer | Chrome DevTools heap snapshot |

### 4.2 Technical Success
| Criterion | Target | Measurement |
|-----------|--------|-------------|
| TypeScript strict mode | 0 errors | `tsc --noEmit` |
| ESLint | 0 warnings | `eslint . --ext .ts,.tsx` |
| Test coverage | > 80% for core logic | Vitest coverage report |
| Bundle size (gzipped) | < 250 KB initial load | `next build` analysis |
| Lighthouse score | > 90 Performance, Accessibility | Chrome DevTools |

### 4.3 Business / Portfolio Success
| Criterion | Target |
|-----------|--------|
| Live demo deployed | Yes (Vercel) |
| GitHub repo public | Yes, with README, architecture docs, CI badge |
| Recruiter demo-ready | Can explain architecture in < 5 minutes |
| Internship applications | 3+ interview requests within 2 weeks of posting |

---

## 5. MVP Scope

### 5.1 In Scope (Must Have)
- [ ] Next.js 14 App Router setup with TypeScript strict mode
- [ ] Room creation with 6-character code generation
- [ ] Direct link routing (`/room/[code]`)
- [ ] QR code generation (client-side)
- [ ] Custom WebSocket signaling server (`ws` library)
- [ ] Upstash Redis for room state + pub/sub
- [ ] WebRTC full-mesh (max 6 peers)
- [ ] STUN/TURN configuration (Google STUN + coturn fallback)
- [ ] File selection (drag-and-drop + file picker)
- [ ] Chunked file transfer (64 KB chunks) with backpressure
- [ ] E2E encryption (ECDH P-384 + AES-256-GCM)
- [ ] Shared file metadata table
- [ ] Download trigger with Blob URL
- [ ] Basic responsive UI (mobile + desktop)
- [ ] Connection status indicators
- [ ] Deploy to Vercel (frontend) + Railway (signaling)

### 5.2 Out of Scope (Post-MVP)
- [ ] User accounts / authentication (OAuth, email/password)
- [ ] File preview (image/video inline preview in chat)
- [ ] Chat / messaging alongside file transfer
- [ ] File expiration / self-destructing links
- [ ] Cloud backup / sync
- [ ] Mobile native apps (iOS/Android)
- [ ] Browser extension
- [ ] SFU (Selective Forwarding Unit) for >6 peers
- [ ] Resume/pause of interrupted transfers
- [ ] Compression (gzip/deflate) — can be added later
- [ ] WebRTC screen sharing / video calling
- [ ] Admin dashboard / analytics
- [ ] Monetization / premium features

### 5.3 Not To Build
| Feature | Reason |
|---------|--------|
| Custom STUN/TURN server cluster | Overkill for student project. Use free Google STUN + 1 coturn instance. |
| Blockchain / IPFS integration | Adds complexity without clear user value for this use case. |
| Electron / desktop wrapper | Browser-only is simpler and demonstrates core WebRTC skills better. |
| Payment integration | Project must remain free. No ads, no premium tiers. |
| Social features (likes, comments, profiles) | Distracts from core P2P file-sharing value proposition. |
| Machine learning / smart categorization | Not relevant to core functionality. |

---

## 6. Success Metrics (Post-Launch)

### 6.1 Technical Metrics
- **Uptime:** > 99.5% (excluding maintenance windows)
- **Average connection time:** < 3 seconds
- **Average transfer speed:** > 80% of direct network speed (WebRTC overhead < 20%)
- **Error rate:** < 1% of transfers fail due to connection drops
- **Page load time:** < 2 seconds on 4G (Lighthouse Performance > 90)

### 6.2 User Metrics
- **Room creation rate:** Target 10+ rooms/day within first month
- **Average room size:** 2–3 peers (expected for P2P)
- **Retention:** 30% of users return within 7 days
- **Geographic diversity:** Users from > 3 countries within first month

### 6.3 Portfolio Metrics
- **GitHub stars:** 50+ within 3 months
- **Live demo traffic:** 100+ unique visitors/week
- **Recruiter engagement:** 3+ interview requests within 2 weeks of LinkedIn/GitHub post
- **Code quality:** All PRs reviewed, CI/CD passing, no critical security vulnerabilities

---

## 7. Tech Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend Framework** | Next.js 14 (App Router) | Full-stack React, API routes, optimal for Vercel deployment |
| **Language** | TypeScript 5 (strict mode) | Type safety, better IDE support, fewer runtime bugs |
| **Styling** | Tailwind CSS v3 | Utility-first, responsive by default, zero CSS bloat |
| **Animations** | Framer Motion + GSAP | Framer for UI transitions, GSAP for network graph canvas |
| **State Management** | Zustand | Lightweight (~1 KB), simpler than Redux, perfect for this scale |
| **P2P Transport** | WebRTC DataChannels (native API) | Direct browser-to-browser binary transfer |
| **Signaling** | `ws` (Node.js WebSocket library) | Lightweight, low RAM, perfect for free-tier hosting |
| **Signaling State** | Upstash Redis | Free tier (10k commands/day), pub/sub for horizontal scaling |
| **Hosting (Frontend)** | Vercel (Hobby) | Free, HTTPS (required for WebRTC), automatic CI/CD |
| **Hosting (Backend)** | Railway ($5 credit/month) | Free WebSocket hosting, easy Redis integration |
| **STUN/TURN** | Google STUN + self-hosted coturn | STUN free, coturn free on Render/Railway free tier |
| **Testing** | Vitest + Playwright | Vitest for unit tests, Playwright for E2E WebRTC flows |
| **Linting** | ESLint + Prettier | Standard, free, enforced via CI |
| **Icons** | lucide-react | Free, tree-shakeable, consistent design |

---

## 8. Constraints & Assumptions

### 8.1 Constraints
- **Budget:** $0/month. Must work on free-tier services.
- **Team:** Solo developer (student). Code must be understandable and maintainable.
- **Timeline:** 5-day MVP build + 1-day testing (see `Phase.md`).
- **Browser Support:** Modern browsers only (Chrome 80+, Firefox 80+, Safari 14.1+, Edge 80+).
- **File Size:** Hard limit 2 GB per file (browser memory constraints).
- **Room Size:** Maximum 6 peers per room (full-mesh limit).

### 8.2 Assumptions
- Users have modern browsers with WebRTC support.
- Users have stable internet connections (4G or WiFi).
- Upstash Redis free tier remains available (10k commands/day).
- Railway free tier remains available ($5 credit/month).
- Signaling server traffic is low enough for free-tier hosting.
- Users are comfortable sharing peer IDs / room codes (no authentication required for MVP).

---

## 9. Dependencies & Risks

| Dependency | Risk | Mitigation |
|------------|------|------------|
| Upstash Redis free tier | Rate limits at high traffic | Optimize with Redis pub/sub (1 publish = N subscribers = 1 command) |
| Railway free tier | $5 credit exhaustion | Monitor usage, implement usage alerts, fallback to Render |
| WebRTC support | Older browsers fail | Add browser detection + graceful fallback message |
| STUN/TURN availability | Google STUN downtime | Add backup STUN servers, deploy coturn as fallback |
| Vercel free tier | Bandwidth limits (100 GB/month) | Compress responses, lazy-load images, optimize assets |

---

## 10. Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| **Developer (You)** | Full-stack portfolio piece, internship qualification |
| **Recruiters** | Evidence of production-grade full-stack skills |
| **Users** | Free, fast, private file sharing |
| **University / Advisors** | Demonstrated capability for internships/jobs |
| **Open Source Community** | Clean, well-documented reference implementation |

---

## 11. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Developer | | | |
