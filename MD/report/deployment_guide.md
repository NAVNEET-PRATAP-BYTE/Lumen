# Lumen — Complete Deployment & Upstash Redis Guide

This guide details how to push your code to **GitHub** and deploy both the **Frontend** and **Signaling Server** for **100% FREE** without incurring any charges.

---

## 1. Pushing Code to GitHub

### Step 1: Initialize Git Repository
In your workspace directory:

```bash
cd d:/Lumen/p2p-lumen

# Initialize git if not already done
git init

# Stage all project files
git add .

# Commit changes
git commit -m "feat: complete production-grade P2P Lumen file sharing app"
```

### Step 2: Create GitHub Repository & Push
1. Go to [GitHub New Repository](https://github.com/new).
2. Name the repository `p2p-lumen`.
3. Set visibility to **Public** or **Private**.
4. Run the following commands in your terminal:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/p2p-lumen.git
git branch -M main
git push -u origin main
```

---

## 2. Free Hosting Deployment Setup

### 🅰️ Frontend Deployment (Vercel — 100% Free)

1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New"** → **"Project"** and import `p2p-lumen`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_WS_URL`: `wss://your-signaling-server.up.railway.app` (or Render URL)
   - `NEXT_PUBLIC_APP_URL`: `https://your-lumen-app.vercel.app`
4. Click **Deploy**. Vercel will build and host your Next.js frontend globally on CDN for free.

---

### 🅱️ Signaling Server Deployment (Railway or Render — 100% Free Tier)

#### Option 1: Railway (Recommended)
1. Log in to [Railway](https://railway.app).
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select your `p2p-lumen` repository and specify the root directory as `/server`.
4. Add Environment Variable:
   - `PORT`: `8080`
5. Railway will automatically build and assign a public `wss://` domain.

#### Option 2: Render (Alternative Free Tier)
1. Log in to [Render](https://render.com).
2. Create a **New Web Service** pointing to your repository.
3. Set **Root Directory** to `server`.
4. Set **Build Command** to `npm install && npm run build`.
5. Set **Start Command** to `npm start`.
6. Set Environment Variable `PORT` to `8080`.

---

## 3. In-Depth Analysis: Upstash Redis

### ❓ Is Upstash Redis Mandatory or Optional?
> **Answer: Upstash Redis is 100% OPTIONAL.**

Lumen is engineered with a **dual-mode signaling architecture**. You can run the application with or without Upstash Redis without making a single line of code change!

---

### 💡 Why is Upstash Redis Used in the Tech Spec?

#### 1. Single-Instance Server (Without Upstash Redis) — Default Zero-Cost Mode
- When running a single signaling server instance (e.g. on Railway or Render free tier), room codes and peer presences are stored in the server's **high-speed in-memory JavaScript `Map`**.
- **Pros:** Zero configuration, zero external service dependency, zero cost, ultra-low latency.
- **Cons:** If the signaling server restarts, active room metadata resets (though open WebRTC DataChannels remain connected!).

#### 2. Multi-Instance Cluster (With Upstash Redis) — Production Scale Mode
- When scaling up to multiple signaling server instances behind a global load balancer, users connected to Server A need to signal users connected to Server B.
- Upstash Redis provides **Serverless Pub/Sub** and **Distributed Session Storage**:
  - `room:[CODE]:peers` set keeps room state synced across server instances.
  - IP-based join rate limiting via Redis key expiration (`ratelimit:join:[IP]`).
- **Pros:** Horizontally scalable across multiple global regions.

---

### 🛠️ Does your project require code changes to work with Upstash?
> **No code changes required!**

The signaling server (`server/src/index.ts`) contains graceful auto-detection logic:

```typescript
// Auto-detects Upstash configuration dynamically
if (upstashUrl && upstashToken) {
  redis = new Redis({ url: upstashUrl, token: upstashToken });
  console.log('[signaling] Upstash Redis connected');
} else {
  console.log('[signaling] Running in local in-memory mode (no Redis)');
}
```

- **If environment variables `UPSTASH_URL` and `UPSTASH_TOKEN` are omitted:** The server automatically operates in local in-memory mode.
- **If you provide Upstash credentials:** The server automatically enables Redis persistence and IP rate-limiting with zero code modifications!

---

### 🎁 Free Upstash Setup (If you choose to enable it later)
1. Create a free account at [Upstash](https://upstash.com).
2. Create a **Redis Database** (Free Tier gives 10,000 commands/day).
3. Copy the `UPSTASH_URL` and `UPSTASH_TOKEN` into your signaling server's environment variables.
