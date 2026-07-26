# Lumen — Manual Testing & Network Scope Guide

## 1. How to Test Lumen Manually (Multi-Tab / Multi-Device)

Lumen is designed for real-time peer-to-peer file sharing. You can test the application on a single machine using multiple browser tabs or across multiple devices on the same network or the Internet.

---

### 🧪 Method A: Testing on a Single Machine (Multiple Tabs / Browsers)

#### Step 1: Start the Local Servers
Make sure both the Next.js frontend and the WebSocket signaling server are running:

```bash
# Terminal 1: Next.js Frontend (Port 3000)
cd d:/Lumen/p2p-lumen
npm run dev

# Terminal 2: Signaling Server (Port 8080)
cd d:/Lumen/p2p-lumen/server
npm run dev
```

#### Step 2: Open Browser Tab 1 (Host / Peer A)
1. Open your browser and navigate to `http://localhost:3000`.
2. Enter a custom name (e.g., **"Alice"**) or keep the randomly generated alias.
3. Click **"Create New Room"**.
4. You will be redirected to `http://localhost:3000/room/[ROOM_CODE]` (e.g. `http://localhost:3000/room/A7B9ZK`).
5. Copy the **6-character Room Code** or the full URL.

#### Step 3: Open Browser Tab 2 or Incognito Window (Guest / Peer B)
1. Open a **new tab**, an **Incognito window**, or a **different browser** (e.g. Chrome + Firefox).
2. Go to `http://localhost:3000`.
3. Enter a custom name (e.g., **"Bob"**).
4. Paste the 6-character Room Code into the **"Room Code"** input field and click **"Join Room"** (or directly paste the room URL `http://localhost:3000/room/A7B9ZK`).

#### Step 4: Verify Connection & Share Files
1. **Peer Discovery:** In both tabs, look at the **Peers** list:
   - Tab 1 will show `Alice (you)` and `Bob (Connected)`.
   - Tab 2 will show `Bob (you)` and `Alice (Connected)`.
2. **Topology Graph:** The **Network Topology** graph in both tabs will render two connected nodes with a dotted line between them.
3. **Send File:**
   - In Tab 1 (Alice), drag and drop any file (e.g. image, PDF, zip) into the **Send Files** dropzone.
   - Click **"Send File"**.
4. **Observe Real-Time Stream:**
   - Real-time progress bars will update synchronously in both tabs.
   - Data particles will visually stream along the GSAP network graph edge.
   - When completed, Tab 2 (Bob) will automatically trigger a browser file download of the decrypted file!

---

### 🧪 Method B: Testing Across Two Devices on the Same Wi-Fi / LAN

1. Find your host computer's local IP address (e.g., `192.168.1.50`).
2. Update `.env.local` or environment variables if needed so `NEXT_PUBLIC_WS_URL` points to `ws://192.168.1.50:8080`.
3. Open `http://192.168.1.50:3000` on your laptop, phone, or tablet connected to the same Wi-Fi.
4. Scan the QR code generated in the Room Header from your phone camera to join instantly!

---

### 🧪 Method B: Testing Across Multiple Devices on the Same Wi-Fi / LAN (Phone, Laptop, Tablet)

To let other devices on your local Wi-Fi or company LAN access Lumen, follow these 4 simple steps:

#### Step 1: Find Your Computer's Local IP Address

- **On Windows (PowerShell / Command Prompt):**
  ```powershell
  ipconfig
  ```
  Look for **IPv4 Address** under your active Wi-Fi or Ethernet adapter (e.g. `192.168.1.15` or `10.0.0.45`).

- **On Mac / Linux:**
  ```bash
  ifconfig
  # or
  ip a
  ```
  Look for `inet 192.168.x.x`.

---

#### Step 2: Start Next.js & Signaling Server for Network Access

To allow other devices on your Wi-Fi to open the website, bind Next.js to `0.0.0.0` (all network interfaces):

1. **Update `.env.local` in `p2p-lumen`:**
   ```env
   NEXT_PUBLIC_WS_URL=ws://YOUR_LOCAL_IP:8080
   NEXT_PUBLIC_APP_URL=http://YOUR_LOCAL_IP:3000
   ```
   *(Replace `YOUR_LOCAL_IP` with your actual IP, e.g. `ws://192.168.1.15:8080`)*

2. **Start the Frontend (bound to 0.0.0.0):**
   ```bash
   cd d:/Lumen/p2p-lumen
   npm run dev -- -H 0.0.0.0
   ```

3. **Start the Signaling Server:**
   ```bash
   cd d:/Lumen/p2p-lumen/server
   npm run dev
   ```

---

#### Step 3: Connect Devices on the Same Wi-Fi

1. **Host Computer (Device 1):**
   - Open browser to `http://192.168.1.15:3000` (or `http://localhost:3000`).
   - Click **"Create New Room"**.
   - Note the **6-character Room Code** (e.g., `A7B9ZK`) or open the **QR Code** modal in the room header.

2. **Second Device (Phone, Tablet, or Laptop on same Wi-Fi):**
   - Open your phone browser and go to `http://192.168.1.15:3000` (or scan the host's QR code directly with your phone camera!).
   - Enter your name (e.g., **"Mobile-Peer"**).
   - Enter the Room Code `A7B9ZK` and tap **"Join Room"**.

---

#### Step 4: Stream Files Over Wi-Fi
- Both devices will instantly discover each other and show `Connected` in the **Peers** list and **Network Topology** graph.
- Drag and drop files from either device — the files will stream directly over your local Wi-Fi router at full network speeds (100 Mbps – 1 Gbps) with zero cloud involvement!

### 🔌 Physical Medium & Wired Ethernet Cable Connections (Maximum Performance)

When devices are connected via **Physical Ethernet Cables** (RJ45 CAT5e/CAT6/CAT7), data travels directly through copper wire or optical fiber at physical link layer speeds (**1 Gbps, 2.5 Gbps, or 10 Gbps**).

---

#### 🌐 Scenario A: Connected via Ethernet Switch / Router (Standard Office LAN)

1. **Physical Medium Setup:** Connect both computers to your local router or network switch using Ethernet cables.
2. **Find Ethernet Network Interface IP:**
   - **Windows:** Open PowerShell and run `ipconfig`. Look under **`Ethernet adapter Ethernet`** or **`Ethernet adapter Local Area Connection`**:
     ```text
     Ethernet adapter Ethernet:
        Connection-specific DNS Suffix  . : localdomain
        IPv4 Address. . . . . . . . . . . : 192.168.1.120
        Subnet Mask . . . . . . . . . . . : 255.255.255.0
     ```
   - **Mac / Linux:** Run `ifconfig` or `ip a`. Look for network interfaces named `eth0`, `en0`, or `eno1`.

3. **Start Lumen on the Host Machine:**
   ```bash
   # Set environment variables in .env.local
   NEXT_PUBLIC_WS_URL=ws://192.168.1.120:8080
   NEXT_PUBLIC_APP_URL=http://192.168.1.120:3000

   # Start frontend bound to 0.0.0.0
   npm run dev -- -H 0.0.0.0
   ```
4. **Peer Connection:** On Peer 2, open `http://192.168.1.120:3000` in the browser, enter the 6-character room code, and enjoy hardware-rate cable transfers!

---

#### ⚡ Scenario B: Direct PC-to-PC Cable Connection (Zero Network / Switchless Setup)

You can connect two computers directly together using **a single Ethernet cable plugged from Port A to Port B**:

1. **Plug Ethernet Cable:** Plug a standard CAT5e/CAT6 cable directly into the LAN ports of both computers.
2. **Auto-IP Assignment (APIPA):** Windows/Mac will automatically assign link-local IP addresses in the `169.254.x.x` subnet.
3. **Verify IP:** Run `ipconfig` on Computer A to get its APIPA IP (e.g. `169.254.45.88`).
4. **Launch Lumen:** Set `NEXT_PUBLIC_WS_URL=ws://169.254.45.88:8080`, start Next.js, and open `http://169.254.45.88:3000` on Computer B.
5. **Result:** Ultra-secure, air-gapped, zero-cloud file transfers at full hardware cable speed!

---

## 2. Network Scope: LAN vs. Internet Compatibility

> **Short Answer:** Yes! Lumen works seamlessly over **both** local area networks (LAN / Wi-Fi / Ethernet cables) **and** across the public Internet.

### 🏠 Local Network (Company LAN / Home Wi-Fi / Direct Cable)
- **Mechanism:** WebRTC uses ICE (Interactive Connectivity Establishment) candidate gathering. When devices are connected via LAN, Ethernet cable, or Wi-Fi, WebRTC generates local host candidates (e.g., `192.168.x.x` or `169.254.x.x`).
- **No Internet Required:** Peer-to-peer data traffic travels directly over physical copper wire or local wireless spectrum.
- **Speed:** Maximum physical hardware throughput (100 Mbps – 10 Gbps), completely bypassing Internet bandwidth limits and cloud costs.

### 🌐 Public Internet (Cross-Network / Non-LAN)
- **STUN Servers:** Used to discover public IP addresses and ports when peers are behind NAT (Network Address Translation). Lumen uses Google's public STUN servers by default (`stun:stun.l.google.com:19302`).
- **TURN Relay (Fallback for Strict Corporate Firewalls):** In strict corporate environments with symmetric NATs that block direct peer connections, a TURN server relays encrypted WebRTC packets. Lumen is pre-configured to support TURN servers via environment variables (`NEXT_PUBLIC_TURN_URL`).
