# Development Rules & Guidelines
## P2P File Share — Code Standards, Best Practices, and Guardrails

**Version:** 1.0.0  
**Last Updated:** 2026-07-15

---

## 1. Code Quality Rules

### 1.1 TypeScript Strict Mode

**Rule:** Every file must pass `tsc --noEmit` with zero errors.

```typescript
// ✅ CORRECT — Explicit types, no 'any'
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ❌ WRONG — Using 'any'
function formatBytes(bytes: any): any {
  // ...
}
```

**Rule:** Use `unknown` instead of `any` when type is truly unknown.

```typescript
// ✅ CORRECT
function parseMessage(data: unknown): SignalingMessage {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid message format');
  }
  const msg = data as Record<string, unknown>;
  // ... validate and return typed message
}

// ❌ WRONG
function parseMessage(data: any): any {
  // ...
}
```

**Rule:** Enable all strict compiler options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 1.2 Functional Components Only

**Rule:** Use functional components with hooks. **Never use class components.**

```tsx
// ✅ CORRECT — Functional component
'use client';
import { useState, useEffect } from 'react';

export function RoomHeader({ roomCode }: { roomCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold">Room: {roomCode}</h1>
      <Button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</Button>
    </div>
  );
}

// ❌ WRONG — Class component
class RoomHeader extends React.Component {
  // NEVER DO THIS
}
```

**Rule:** All state management must use hooks (`useState`, `useReducer`, `useContext`, `useZustand`).

**Rule:** Custom hooks must follow the `use` prefix convention (`useWebRTC`, `useSignaling`, `useFileTransfer`).

### 1.3 Responsive Design

**Rule:** Every component must be responsive. Use Tailwind's mobile-first breakpoints.

```tsx
// ✅ CORRECT — Mobile-first
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4 
  p-4 
  md:p-6 
  lg:p-8
">
  {/* Content */}
</div>

// ❌ WRONG — Desktop-first, breaks on mobile
<div className="grid grid-cols-3 gap-4 p-8">
  {/* Content */}
</div>
```

**Rule:** Test every component at these viewports:
- 320 px (iPhone SE)
- 375 px (iPhone 12/13)
- 768 px (iPad portrait)
- 1024 px (iPad landscape / small desktop)
- 1440 px (standard desktop)

**Rule:** No fixed widths (e.g., `width: 500px`). Use relative units (`w-full`, `max-w-md`, `w-screen`).

### 1.4 Clean Minimal UI

**Rule:** Use Tailwind utility classes. **Never write custom CSS files.**

```tsx
// ✅ CORRECT — Tailwind utilities
<Card className="p-6 rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
    Title
  </h2>
</Card>

// ❌ WRONG — Custom CSS class
<Card className="my-card">
  /* styles.css */
  .my-card { padding: 24px; border-radius: 12px; }
</Card>
```

**Rule:** Maintain visual hierarchy with spacing and typography only. No decorative borders, shadows, or gradients unless they serve a functional purpose.

**Rule:** Limit color palette to the design tokens defined in `Design.md`:
- Primary: Indigo 600/700
- Success: Emerald 500
- Warning: Amber 500
- Error: Rose 500
- Neutrals: Slate 50–900

**Rule:** Every interactive element must have:
- A visible focus state (`focus-visible:ring-2`)
- A hover state (`hover:bg-xxx`)
- A disabled state (`disabled:opacity-50 disabled:pointer-events-none`)

---

## 2. Naming Conventions

### 2.1 Files and Folders

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `RoomHeader.tsx`, `FileTable.tsx` |
| Hooks | camelCase with `use` prefix | `useWebRTC.ts`, `useSignaling.ts` |
| Utilities | camelCase | `formatBytes.ts`, `chunker.ts` |
| Types | PascalCase for interfaces/types | `Room.ts`, `SignalingMessage.ts` |
| Pages | Route-based (Next.js convention) | `page.tsx`, `layout.tsx` |
| Stores | camelCase | `roomStore.ts` |

### 2.2 Variables and Functions

```typescript
// ✅ CORRECT
const peerConnection = new RTCPeerConnection(config);
const chunkSize = 64 * 1024;
const isConnected = false;
const handleSendFile = () => {};

// ❌ WRONG
const pc = new RTCPeerConnection(config);
const CHUNK_SIZE = 64 * 1024; // Use constants.ts instead
const connected = false; // Use 'is' prefix for booleans
const sendFile = () => {}; // Use 'handle' prefix for event handlers
```

**Rule:** Boolean variables must start with `is`, `has`, `should`, `can`.

```typescript
// ✅ CORRECT
const isConnected = true;
const hasError = false;
const shouldRetry = true;
const canSend = true;

// ❌ WRONG
const connected = true;
const error = false;
const retry = true;
const send = true;
```

**Rule:** Event handlers must start with `handle`.

```typescript
// ✅ CORRECT
const handleClick = () => {};
const handleSubmit = () => {};
const handleFileSelect = () => {};

// ❌ WRONG
const click = () => {};
const submit = () => {};
const onFileSelect = () => {}; // 'on' prefix is reserved for props
```

**Rule:** Constants must be in UPPER_SNAKE_CASE and defined in `lib/constants.ts`.

```typescript
// ✅ CORRECT
export const CHUNK_SIZE = 64 * 1024;
export const MAX_PEERS = 6;

// ❌ WRONG
export const chunkSize = 64 * 1024;
export const maxPeers = 6;
```

### 2.3 Types and Interfaces

```typescript
// ✅ CORRECT
interface Room {
  code: string;
  createdAt: number;
}

type RoomStatus = 'idle' | 'joining' | 'active' | 'error';

// ❌ WRONG
interface room {
  code: string;
}

type roomStatus = 'idle' | 'joining' | 'active' | 'error';
```

**Rule:** Use `interface` for object shapes, `type` for unions, intersections, and complex types.

---

## 3. Component Rules

### 3.1 Component Structure

```tsx
// ✅ CORRECT — Standard component structure
'use client'; // Required for Next.js App Router components using hooks

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number;
  disabled?: boolean;
}

export function Dropzone({ onFilesSelected, maxSize = 2 * 1024 * 1024 * 1024, disabled = false }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // ...
  };

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      {/* Content */}
    </div>
  );
}
```

**Rule:** Every component file must export a single component (or a named export + a default export for pages).

**Rule:** All components using hooks must have `'use client'` at the top (Next.js App Router requirement).

**Rule:** Props must be explicitly typed with an interface.

### 3.2 Children and Composition

```tsx
// ✅ CORRECT — Use ReactNode for children
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

// Usage
<Card title="Files">
  <FileTable />
</Card>
```

---

## 4. State Management Rules

### 4.1 Zustand Store

**Rule:** All global state must live in Zustand stores. **Never use React Context for global state.**

```typescript
// ✅ CORRECT — Zustand store
import { create } from 'zustand';

interface RoomStore {
  roomCode: string | null;
  peers: Peer[];
  addPeer: (peer: Peer) => void;
  removePeer: (peerId: string) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomCode: null,
  peers: [],
  addPeer: (peer) => set((state) => ({ peers: [...state.peers, peer] })),
  removePeer: (peerId) => set((state) => ({ peers: state.peers.filter(p => p.peerId !== peerId) })),
}));

// ❌ WRONG — React Context for global state
const RoomContext = createContext<RoomState | undefined>(undefined);
```

**Rule:** Keep stores flat and focused. One store per domain (e.g., `roomStore`, `uiStore`).

**Rule:** Derive computed values in selectors, not in the store.

```typescript
// ✅ CORRECT — Selector with derived value
const connectedPeers = useRoomStore((state) => 
  state.peers.filter(p => p.connectionState === 'connected')
);

// ❌ WRONG — Storing derived value in store
interface RoomStore {
  peers: Peer[];
  connectedPeers: Peer[]; // Don't do this — it's derived
}
```

### 4.2 Local State

**Rule:** Use `useState` for component-local state. Use `useReducer` for complex local state logic.

```tsx
// ✅ CORRECT — useState for simple state
const [isOpen, setIsOpen] = useState(false);
const [fileName, setFileName] = useState('');

// ✅ CORRECT — useReducer for complex state
type State = { status: 'idle' | 'loading' | 'success' | 'error' };
type Action = { type: 'start' } | { type: 'success' } | { type: 'error'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start': return { ...state, status: 'loading' };
    case 'success': return { ...state, status: 'success' };
    case 'error': return { ...state, status: 'error', error: action.error };
    default: return state;
  }
}

const [state, dispatch] = useReducer(reducer, { status: 'idle' });
```

---

## 5. Error Handling Rules

### 5.1 Try-Catch Best Practices

```typescript
// ✅ CORRECT — Catch specific errors, log, and show user-friendly message
async function sendFile(file: File, dc: RTCDataChannel) {
  try {
    const chunks = readFileChunks(file);
    for await (const chunk of chunks) {
      await sendChunk(chunk, dc);
    }
  } catch (error) {
    console.error('File transfer failed:', error);
    if (error instanceof Error) {
      showToast(`Transfer failed: ${error.message}`);
    } else {
      showToast('Transfer failed: Unknown error');
    }
    throw error; // Re-throw for upstream handling
  }
}

// ❌ WRONG — Silent catch
async function sendFile(file: File, dc: RTCDataChannel) {
  try {
    // ...
  } catch (error) {
    // Silent failure — bad!
  }
}
```

### 5.2 WebRTC Error Handling

```typescript
// ✅ CORRECT — Handle all WebRTC states
pc.oniceconnectionstatechange = () => {
  console.log('ICE state:', pc.iceConnectionState);
  
  switch (pc.iceConnectionState) {
    case 'connected':
    case 'completed':
      setConnectionStatus('connected');
      break;
    case 'disconnected':
      setConnectionStatus('disconnected');
      // Attempt reconnect after 3 seconds
      setTimeout(() => attemptReconnect(), 3000);
      break;
    case 'failed':
      setConnectionStatus('failed');
      showToast('Connection failed. Trying TURN server...');
      break;
    case 'closed':
      setConnectionStatus('closed');
      break;
  }
};

// ❌ WRONG — Ignoring connection states
pc.oniceconnectionstatechange = () => {
  // Do nothing — leads to zombie connections!
};
```

**Rule:** Always clean up resources in `useEffect` cleanup functions.

```typescript
// ✅ CORRECT
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  
  return () => {
    ws.close(); // Cleanup on unmount
  };
}, [url]);

// ❌ WRONG — No cleanup, causes memory leaks
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
}, [url]);
```

---

## 6. Performance Rules

### 6.1 Backpressure Handling

**Rule:** Never send data faster than the DataChannel can drain. Monitor `bufferedAmount`.

```typescript
// ✅ CORRECT — Backpressure-aware sender
async function sendChunk(chunk: ArrayBuffer, dc: RTCDataChannel) {
  while (dc.bufferedAmount > 256 * 1024) {
    await new Promise<void>((resolve) => {
      dc.onbufferedamountlow = () => {
        dc.onbufferedamountlow = null;
        resolve();
      };
    });
  }
  dc.send(chunk);
}

// ❌ WRONG — No backpressure, causes crashes
function sendChunk(chunk: ArrayBuffer, dc: RTCDataChannel) {
  dc.send(chunk); // Sending too fast = buffer overflow = crash
}
```

### 6.2 Memory Management

**Rule:** Always revoke Object URLs after use.

```typescript
// ✅ CORRECT
const blob = new Blob(chunks, { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);
download(url, fileName);
URL.revokeObjectURL(url); // Clean up immediately

// ❌ WRONG — Memory leak
const blob = new Blob(chunks, { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);
download(url, fileName);
// URL never revoked — memory leak!
```

**Rule:** Use `AbortController` for cancellable async operations.

```typescript
// ✅ CORRECT
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(data => setData(data));
  
  return () => controller.abort(); // Cancel on unmount
}, []);
```

### 6.3 Dynamic Imports

**Rule:** Use dynamic imports for heavy libraries (GSAP, QR code) to reduce initial bundle size.

```tsx
// ✅ CORRECT — Dynamic import
import dynamic from 'next/dynamic';

const NetworkGraph = dynamic(() => import('@/components/room/NetworkGraph'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-200 h-64 rounded-xl" />,
});

// ❌ WRONG — Static import (increases bundle size)
import { NetworkGraph } from '@/components/room/NetworkGraph';
```

---

## 7. Security Rules

### 7.1 Input Validation

**Rule:** Validate all user input on both client and server.

```typescript
// Client-side validation
function handleJoinRoom(code: string) {
  if (!validateRoomCode(code)) {
    showToast('Invalid room code. Use 6 alphanumeric characters.');
    return;
  }
  router.push(`/room/${code}`);
}

// Server-side validation (signaling server)
if (!ROOM_CODE_REGEX.test(msg.roomCode)) {
  ws.send(JSON.stringify({ type: 'error', message: 'Invalid room code' }));
  return;
}
```

**Rule:** Sanitize display names to prevent XSS.

```typescript
// ✅ CORRECT — Sanitize user input
function sanitizeDisplayName(name: string): string {
  return name.trim().replace(/[<>"']/g, '');
}

// ❌ WRONG — No sanitization
function sanitizeDisplayName(name: string): string {
  return name; // XSS vulnerability!
}
```

### 7.2 Rate Limiting

**Rule:** Implement rate limiting on all server endpoints and WebSocket actions.

```typescript
// ✅ CORRECT — Redis-based rate limiter
async function checkRateLimit(ip: string, action: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `ratelimit:${action}:${ip}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  return current <= limit;
}
```

### 7.3 Secrets Management

**Rule:** Never commit secrets to Git. Use environment variables.

```typescript
// ✅ CORRECT — Environment variable
const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;

// ❌ WRONG — Hardcoded secret
const turnUrl = 'turn:user:pass@turn.example.com';
```

**Rule:** Prefix client-side environment variables with `NEXT_PUBLIC_` (Next.js convention).

---

## 8. Testing Rules

### 8.1 Test Naming

```typescript
// ✅ CORRECT — Descriptive test names
test('generateRoomCode returns 6-character alphanumeric string', () => {
  const code = generateRoomCode();
  expect(code).toMatch(/^[A-Za-z0-9]{6}$/);
});

test('validateRoomCode rejects strings shorter than 6 characters', () => {
  expect(validateRoomCode('abc')).toBe(false);
});

// ❌ WRONG — Vague test names
test('generateRoomCode works', () => {
  // ...
});

test('test validation', () => {
  // ...
});
```

### 8.2 Test Structure

```typescript
// ✅ CORRECT — Arrange, Act, Assert
test('encrypt then decrypt returns original data', async () => {
  // Arrange
  const keyPair = await generateKeyPair();
  const aesKey = await deriveAesKey(keyPair.privateKey, keyPair.publicKey);
  const original = new TextEncoder().encode('Hello, World!');

  // Act
  const { encryptedData, iv } = await encryptChunk(aesKey, original.buffer);
  const decrypted = await decryptChunk(aesKey, iv, encryptedData);

  // Assert
  expect(new Uint8Array(decrypted)).toEqual(original);
});
```

### 8.3 Test Coverage Targets

| Module | Target Coverage |
|--------|-----------------|
| `lib/utils.ts` | 100% |
| `lib/validators.ts` | 100% |
| `lib/crypto.ts` | 90% |
| `lib/chunker.ts` | 90% |
| `hooks/useWebRTC.ts` | 80% |
| `store/roomStore.ts` | 90% |
| `components/` | 70% (focus on logic, not styling) |

---

## 9. Git Rules

### 9.1 Commit Convention

Use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring (no feature change, no bug fix)
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance (dependencies, build, CI)
- `revert`: Revert previous commit

**Examples:**
```
feat(webrtc): add ECDH key exchange for E2E encryption
fix(file): handle backpressure in DataChannel sender
docs(readme): add architecture diagram and cost analysis
test(crypto): add encrypt/decrypt round-trip test
chore(deps): upgrade Next.js to 14.2
```

### 9.2 Branch Naming

```
feature/phase1-signaling
feature/phase2-encryption
fix/datachannel-backpressure
chore/update-dependencies
```

**Rule:** Never commit directly to `main`. Always use feature branches and PRs.

---

## 10. Code Review Checklist

Before merging any PR, verify:

- [ ] TypeScript strict mode passes (`tsc --noEmit`)
- [ ] ESLint passes with zero warnings
- [ ] All new tests pass (`npm test`)
- [ ] No `any` types introduced
- [ ] All new components are responsive (tested at 320 px and 1440 px)
- [ ] All interactive elements have focus, hover, and disabled states
- [ ] No hardcoded secrets or API keys
- [ ] Environment variables documented in `.env.example`
- [ ] Error handling implemented for all async operations
- [ ] Memory leaks prevented (ObjectURLs revoked, event listeners cleaned up)
- [ ] Backpressure handling added for all DataChannel sends
- [ ] Input validation added for all user inputs
- [ ] Accessibility checked (ARIA labels, keyboard navigation)

---

## 11. Forbidden Patterns

| Pattern | Why Forbidden | Alternative |
|---------|---------------|-------------|
| `any` type | Loses type safety | Use `unknown` or proper interfaces |
| Class components | Outdated, less performant | Functional components + hooks |
| `alert()` / `confirm()` | Blocks UI, poor UX | Custom toast notifications |
| Inline styles | Breaks Tailwind consistency | Use Tailwind utilities |
| Hardcoded URLs | Breaks in production | Use environment variables |
| Magic numbers | Hard to maintain | Use named constants from `constants.ts` |
| Mutating state directly | Causes React bugs | Use immutable updates (`...spread`, `map`, `filter`) |
| Missing cleanup in useEffect | Memory leaks | Always return cleanup function |
| Synchronous file reading | Blocks main thread | Use async generators + FileReader |
| Unbounded arrays/loops | Memory crash | Limit array size, use chunking |

---

## 12. Performance Budget

| Metric | Budget |
|--------|--------|
| Initial JS bundle | < 250 KB gzipped |
| Total page weight | < 500 KB |
| Time to Interactive | < 3 seconds on 4G |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |
| Memory usage during 1 GB transfer | < 100 MB |

---

## 13. Documentation Rules

**Rule:** Every public function must have a JSDoc comment.

```typescript
/**
 * Reads a file in chunks using an async generator.
 * @param file - The File object to read.
 * @param chunkSize - Size of each chunk in bytes (default: 64 KB).
 * @yields ArrayBuffer for each chunk.
 */
export async function* readFileChunks(file: File, chunkSize = 64 * 1024): AsyncGenerator<ArrayBuffer> {
  // ...
}
```

**Rule:** Every complex algorithm must have a comment explaining the "why", not just the "what".

```typescript
// Use HKDF-SHA256 to derive a symmetric key from ECDH shared secret.
// This ensures the AES key is cryptographically strong and independent
// of the ECDH private key material.
const aesKey = await crypto.subtle.deriveKey(
  { name: 'ECDH', public: peerPublicKey },
  privateKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

---

## 14. Pre-Commit Checklist

Before every commit, ensure:

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] No console.log statements (use a logger or remove)
- [ ] No commented-out code
- [ ] No debugger statements
- [ ] All imports are used (no unused imports)
- [ ] All variables are used (no unused variables)
- [ ] Commit message follows Conventional Commits format

---

## 15. Post-MVP Rules

These rules apply after the MVP is complete:

- **No new features without tests.** Every new feature must include unit + E2E tests.
- **No dependencies without approval.** Adding a new npm package requires documenting why it's needed and evaluating alternatives.
- **No breaking changes without migration guide.** Changing a public API or type requires a migration guide in the changelog.
- **All PRs require review.** Even solo projects benefit from a "self-review" step before merging.
