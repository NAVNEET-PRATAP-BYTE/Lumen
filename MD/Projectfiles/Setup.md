# Local Development Setup
## P2P File Share — Get Running in 15 Minutes

**Version:** 1.0.0  
**Last Updated:** 2026-07-15  
**Prerequisites:** Node.js 20+, Git, npm

---

## 1. Quick Start

```bash
# 1. Create Next.js project
npx create-next-app@latest p2p-file-share --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd p2p-file-share

# 2. Install frontend dependencies with exact versions
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Step 2)

# 4. Set up signaling server
mkdir server && cd server
cp .env.example .env
# Edit .env with your Upstash Redis credentials
npm init -y
npm install
cd ..

# 5. Start development servers (two terminals)
# Terminal 1 — Signaling server
cd server && npm run dev

# Terminal 2 — Next.js frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 2. Environment Variables Setup

### 2.1 Frontend (`.env.local`)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NEXT_PUBLIC_TURN_URL=turn:localhost:3478
NEXT_PUBLIC_TURN_USERNAME=user
NEXT_PUBLIC_TURN_PASSWORD=pass
```

### 2.2 Signaling Server (`server/.env`)

Create `server/.env`:

```env
PORT=8080
UPSTASH_URL=https://your-redis.upstash.io
UPSTASH_TOKEN=your-upstash-token
NODE_ENV=development
```

**Get Upstash Redis credentials:**
1. Sign up at https://upstash.com (free tier)
2. Create a new Redis database
3. Copy the **REST URL** and **Token** from the console

---

## 3. Project Structure

```
p2p-file-share/
├── .env.example                 ← Frontend env template
├── .env.local                   ← Frontend env (git-ignored)
├── .eslintrc.json
├── .gitignore
├── .nvmrc                       ← Node version (20)
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── room/[code]/page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── room/
│   ├── hooks/
│   ├── lib/
│   ├── store/
│   └── types/
├── server/
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
└── MD/
    └── Projectfiles/            ← Documentation
```

---

## 4. Development Commands

### Frontend (project root)

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler (no emit)
npm run test         # Run Vitest unit tests
npm run test:coverage # Run tests with coverage report
npm run format       # Format code with Prettier
npm run check        # Run lint + typecheck + test
```

### Signaling Server (`server/` directory)

```bash
npm run dev          # Start with tsx (watch mode)
npm run build        # Compile TypeScript to dist/
npm run start        # Start compiled server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
```

---

## 5. Testing the Application

### 5.1 Local Testing (Two Browser Tabs)

1. Start both frontend and signaling servers.
2. Open `http://localhost:3000` in Tab 1.
3. Click **Create Room** → Copy the room code.
4. Open `http://localhost:3000` in Tab 2 (incognito window recommended).
5. Click **Join Room** → Paste the room code.
6. Verify both tabs show each other in the peer list.
7. Send a file from Tab 1 → Verify download in Tab 2.

### 5.2 Network Testing

To test WebRTC across different networks:

1. Deploy frontend to Vercel (see `Implementationplan.md`).
2. Deploy signaling server to Railway (see `Implementationplan.md`).
3. Update `NEXT_PUBLIC_WS_URL` in Vercel to point to Railway server.
4. Test from:
   - WiFi ↔ 4G hotspot
   - Two different ISPs
   - Mobile device + desktop

---

## 6. Common Issues & Solutions

| Issue | Solution |
|--------|----------|
| `npm run dev` fails with `EACCES` | Run terminal as Administrator (Windows) or use `sudo` (macOS/Linux) |
| Port 3000 already in use | Run `npx kill-port 3000` or use `PORT=3001 npm run dev` |
| Port 8080 already in use | Run `npx kill-port 8080` or change `PORT` in `server/.env` |
| WebSocket connection fails | Ensure signaling server is running (`cd server && npm run dev`) |
| Redis connection refused | Verify `UPSTASH_URL` and `UPSTASH_TOKEN` in `server/.env` |
| `tsc --noEmit` fails | Run `npm install` to ensure all types are installed |
| Module not found errors | Delete `node_modules` and `package-lock.json`, then `npm install` |
| Tailwind classes not working | Ensure `tailwind.config.ts` includes correct content paths |
| WebRTC fails on localhost | Some browsers block WebRTC on non-HTTPS (except localhost). Use `localhost`, not `127.0.0.1`. |

---

## 7. Git Setup

```bash
# Configure Git (first time only)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Create feature branch
git checkout -b feature/phase1-signaling

# Stage and commit
git add .
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind"

# Push to remote
git remote add origin https://github.com/yourusername/p2p-file-share.git
git push -u origin feature/phase1-signaling
```

---

## 8. Pre-Commit Checklist

Before committing, run:

```bash
npm run check          # Lint + typecheck + test
npm run format         # Format code
```

**Checklist:**
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run test` passes
- [ ] Code formatted with Prettier
- [ ] No `console.log` statements left in code
- [ ] No hardcoded secrets or API keys
- [ ] Commit message follows Conventional Commits format

---

## 9. IDE Setup (VS Code Recommended)

### Extensions

| Extension | Purpose |
|-----------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| Tailwind CSS IntelliSense | Tailwind class autocomplete |
| TypeScript Vue Plugin (for TSX) | TypeScript support |
| GitLens | Git integration |
| Error Lens | Inline error display |
| Path Intellisense | Path autocomplete |

### Settings (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## 10. Production Deployment

### 10.1 Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

**Environment Variables in Vercel:**
- `NEXT_PUBLIC_WS_URL` = `wss://your-signaling-server.railway.app`
- `NEXT_PUBLIC_TURN_URL` = `turn:your-turn-server.com:3478`
- `NEXT_PUBLIC_TURN_USERNAME` = `user`
- `NEXT_PUBLIC_TURN_PASSWORD` = `pass`

### 10.2 Signaling Server (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Environment Variables in Railway:**
- `UPSTASH_URL` = `https://your-redis.upstash.io`
- `UPSTASH_TOKEN` = `your-token`
- `PORT` = `8080`

### 10.3 TURN Server (Render)

Deploy coturn using the Docker compose in `Techspec.md` Section 3.3.

---

## 11. Getting Help

| Resource | Link |
|----------|------|
| Next.js Docs | https://nextjs.org/docs |
| WebRTC Docs | https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API |
| PeerJS Docs | https://peerjs.com/docs/ |
| Upstash Redis Docs | https://docs.upstash.com/redis |
| Zustand Docs | https://docs.pmnd.rs/zustand |
| Tailwind Docs | https://tailwindcss.com/docs |
| GSAP Docs | https://gsap.com/docs/ |

**Internal Docs:**
- `Prd.md` — Product requirements
- `Techspec.md` — Technical specifications
- `Appflow.md` — Application flow
- `Design.md` — Design system
- `Schema.md` — Data schemas
- `Implementationplan.md` — Implementation plan
- `Tracker.md` — Sprint tracker
- `Rules.md` — Code rules
- `Phase.md` — 5-day sprint plan

---

## 12. Next Steps After Setup

1. Read `Phase.md` to understand the 5-day sprint plan.
2. Read `Rules.md` to understand code standards.
3. Start **Phase 1: Core P2P Foundation** (Day 1).
4. Follow `Implementationplan.md` Section 6 for file implementation order.

**Good luck! 🚀**
