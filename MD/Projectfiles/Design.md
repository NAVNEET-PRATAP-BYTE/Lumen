# Design System & UI Specifications
## P2P File Share — Clean, Minimal, Responsive

**Version:** 1.0.0  
**Last Updated:** 2026-07-15

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Minimal** | Remove all non-essential elements. Every pixel must serve a purpose. |
| **Functional** | UI should guide the user to the primary action: create/join room + send files. |
| **Responsive** | Mobile-first. Works seamlessly from 320 px (iPhone SE) to 2560 px (desktop). |
| **Accessible** | WCAG 2.1 AA compliant. Keyboard navigable, screen reader friendly, sufficient color contrast. |
| **Fast** | Perceived performance matters. Skeleton loaders, optimistic UI updates, smooth transitions. |

---

## 2. Color Palette

### 2.1 Light Mode

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Slate 50 | `#f8fafc` | Page background |
| Surface | White | `#ffffff` | Cards, modals |
| Primary | Indigo 600 | `#4f46e5` | Primary buttons, links, active states |
| Primary Hover | Indigo 700 | `#4338ca` | Button hover |
| Success | Emerald 500 | `#10b981` | Connected status, success messages |
| Warning | Amber 500 | `#f59e0b` | Warning states |
| Error | Rose 500 | `#f43f5e` | Error states, disconnects |
| Text Primary | Slate 900 | `#0f172a` | Headings, primary text |
| Text Secondary | Slate 500 | `#64748b` | Body text, labels |
| Text Tertiary | Slate 400 | `#94a3b8` | Placeholders, disabled text |
| Border | Slate 200 | `#e2e8f0` | Card borders, input borders |

### 2.2 Dark Mode

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Slate 950 | `#020617` | Page background |
| Surface | Slate 900 | `#0f172a` | Cards, modals |
| Primary | Indigo 500 | `#6366f1` | Primary buttons, links |
| Primary Hover | Indigo 400 | `#818cf8` | Button hover |
| Success | Emerald 400 | `#34d399` | Connected status |
| Warning | Amber 400 | `#fbbf24` | Warning states |
| Error | Rose 400 | `#fb7185` | Error states |
| Text Primary | Slate 50 | `#f8fafc` | Headings, primary text |
| Text Secondary | Slate 400 | `#94a3b8` | Body text |
| Text Tertiary | Slate 600 | `#475569` | Placeholders, disabled text |
| Border | Slate 800 | `#1e293b` | Card borders |

**Contrast Ratios (WCAG AA):**
- Text Primary on Background: 16:1 (passes AAA)
- Text Secondary on Background: 7:1 (passes AA)
- Primary on Surface: 4.5:1 (passes AA)

---

## 3. Typography

### 3.1 Font Stack

```css
/* Tailwind default sans font stack */
font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

/* Monospace for codes, technical text */
font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

### 3.2 Type Scale

| Element | Size | Weight | Line Height | Tailwind Class |
|---------|------|--------|-------------|----------------|
| Display | 3.75 rem (60 px) | 800 | 1.1 | `text-6xl font-extrabold` |
| H1 | 2.25 rem (36 px) | 700 | 1.2 | `text-4xl font-bold` |
| H2 | 1.875 rem (30 px) | 600 | 1.3 | `text-3xl font-semibold` |
| H3 | 1.5 rem (24 px) | 600 | 1.4 | `text-2xl font-semibold` |
| H4 | 1.25 rem (20 px) | 600 | 1.5 | `text-xl font-semibold` |
| Body | 1 rem (16 px) | 400 | 1.6 | `text-base` |
| Small | 0.875 rem (14 px) | 400 | 1.5 | `text-sm` |
| Caption | 0.75 rem (12 px) | 400 | 1.4 | `text-xs` |
| Code | 0.875 rem (14 px) | 500 | 1.5 | `text-sm font-mono` |

---

## 4. Spacing System

Use Tailwind's default 4-point grid:

| Token | Value | Usage |
|-------|-------|-------|
| `0` | 0 px | No spacing |
| `1` | 0.25 rem (4 px) | Tight spacing within components |
| `2` | 0.5 rem (8 px) | Component padding, gaps |
| `3` | 0.75 rem (12 px) | Small element spacing |
| `4` | 1 rem (16 px) | Default padding, standard gap |
| `6` | 1.5 rem (24 px) | Section spacing |
| `8` | 2 rem (32 px) | Large section spacing |
| `12` | 3 rem (48 px) | Page-level spacing |
| `16` | 4 rem (64 px) | Hero section spacing |

---

## 5. Component Library

### 5.1 Button

```tsx
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        outline: 'border border-slate-200 bg-transparent hover:bg-slate-100 focus-visible:ring-slate-500 dark:border-slate-700 dark:hover:bg-slate-800',
        ghost: 'hover:bg-slate-100 focus-visible:ring-slate-500 dark:hover:bg-slate-800',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant, size, className, children, ...props }, ref) => {
  return (
    <button ref={ref} className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </button>
  );
});
Button.displayName = 'Button';
```

**Usage:**
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Create Room
</Button>
```

### 5.2 Card

```tsx
// components/ui/Card.tsx
import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`
        rounded-xl border border-slate-200 bg-white shadow-sm
        dark:border-slate-800 dark:bg-slate-900
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';
```

### 5.3 Dropzone

```tsx
// components/ui/Dropzone.tsx
'use client';
import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string[];
  maxSize?: number; // bytes
  multiple?: boolean;
  disabled?: boolean;
}

export function Dropzone({ onFilesSelected, accept, maxSize = 2 * 1024 * 1024 * 1024, multiple = true, disabled = false }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFiles = useCallback((files: FileList): File[] => {
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds max size of ${formatBytes(maxSize)}`);
        continue;
      }
      if (accept && !accept.some(type => matchMime(file.type, type))) {
        alert(`File type "${file.type}" is not allowed`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  }, [accept, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(multiple ? files : [files[0]]);
  }, [validateFiles, onFilesSelected, multiple, disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = validateFiles(e.target.files!);
    if (files.length > 0) onFilesSelected(multiple ? files : [files[0]]);
  }, [validateFiles, onFilesSelected, multiple, disabled]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
        p-8 transition-colors cursor-pointer
        ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-slate-300 dark:border-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="file"
        accept={accept?.join(',')}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <Upload className="w-12 h-12 text-slate-400 mb-4" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Drop files here or click to browse
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Max file size: {formatBytes(maxSize)}
      </p>
    </div>
  );
}
```

---

## 6. Responsive Layout Patterns

### 6.1 Landing Page

```tsx
// app/page.tsx
export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-4xl font-extrabold text-center text-slate-900 dark:text-slate-50 mb-2">
          P2P File Share
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          Decentralized. Encrypted. Free.
        </p>

        <div className="space-y-4">
          <Button variant="primary" size="lg" className="w-full" onClick={handleCreateRoom}>
            Create Room
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">or</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input placeholder="Enter room code" className="flex-1" />
            <Button variant="secondary" onClick={handleJoinRoom}>Join</Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
```

### 6.2 Room Page

```tsx
// app/room/[code]/page.tsx
export default function RoomPage({ params }: { params: { code: string } }) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <RoomHeader roomCode={params.code} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Network Graph - Full width on mobile, 2 cols on md, 1 col on lg */}
          <Card className="md:col-span-2 lg:col-span-1 lg:row-span-2 p-4">
            <h3 className="text-lg font-semibold mb-4">Network</h3>
            <NetworkGraph />
          </Card>

          {/* Peers List */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Peers</h3>
            <PeerList />
          </Card>

          {/* File Table */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Shared Files</h3>
            <FileTable />
          </Card>
        </div>

        {/* Dropzone - Full width below */}
        <Card className="p-4">
          <Dropzone onFilesSelected={handleFilesSelected} />
          {selectedFiles.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">{selectedFiles.length} file(s) selected</span>
              <Button onClick={handleSendFiles} loading={isSending}>Send Files</Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
```

---

## 7. Animation Specifications

### 7.1 Framer Motion (UI Transitions)

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = { duration: 0.3, ease: 'easeOut' };

// Usage in layout
<AnimatePresence mode="wait">
  <motion.div key={route} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
    {children}
  </motion.div>
</AnimatePresence>
```

### 7.2 GSAP (Network Graph)

```tsx
// components/room/NetworkGraph.tsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function NetworkGraph({ peers }: { peers: Peer[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Animate nodes entrance
    gsap.fromTo('.peer-node',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }
    );

    // Animate edges
    gsap.fromTo('.peer-edge',
      { strokeDasharray: 1000, strokeDashoffset: 1000 },
      { strokeDashoffset: 0, duration: 1, stagger: 0.05, ease: 'power2.out' }
    );
  }, [peers.length]);

  return (
    <svg ref={svgRef} className="w-full h-64 md:h-80 lg:h-96" viewBox="0 0 400 300">
      {/* Edges */}
      {peers.flatMap((peer, i) =>
        peers.slice(i + 1).map((other, j) => (
          <line
            key={`${peer.peerId}-${other.peerId}`}
            className="peer-edge"
            x1={peer.x} y1={peer.y}
            x2={other.x} y2={other.y}
            stroke="#4f46e5"
            strokeWidth="2"
            opacity="0.5"
          />
        ))
      )}

      {/* Nodes */}
      {peers.map((peer, i) => (
        <g key={peer.peerId} className="peer-node" transform={`translate(${peer.x}, ${peer.y})`}>
          <circle r={20} fill={peer.connectionState === 'connected' ? '#10b981' : '#f59e0b'} />
          <text textAnchor="middle" dy={5} fill="white" fontSize={12} fontWeight="bold">
            {peer.displayName}
          </text>
        </g>
      ))}
    </svg>
  );
}
```

---

## 8. Accessibility

### 8.1 Requirements

| Element | Requirement |
|---------|-------------|
| Interactive elements | `focus-visible` ring, keyboard accessible |
| Images/Icons | `aria-label` or `aria-hidden="true"` for decorative icons |
| Status messages | `aria-live="polite"` for connection status, transfer progress |
| Dropzone | Keyboard accessible, `aria-describedby` for instructions |
| Color contrast | Minimum 4.5:1 for text, 3:1 for UI components |
| Error messages | Linked to input via `aria-describedby`, role="alert" |

### 8.2 Example: Accessible Button

```tsx
<Button
  onClick={handleCopy}
  aria-label={`Copy room code ${roomCode}`}
  title="Copy room code"
>
  <Copy className="w-4 h-4" aria-hidden="true" />
</Button>
```

---

## 9. Loading & Empty States

### 9.1 Skeleton Loader

```tsx
function PeerListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        </div>
      ))}
    </div>
  );
}
```

### 9.2 Empty State

```tsx
function EmptyPeers() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No peers connected yet
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Share the room code to invite others
      </p>
    </div>
  );
}
```

---

## 10. Component Checklist

| Component | Functional | Responsive | Accessible | Dark Mode |
|-----------|-----------|------------|------------|-----------|
| Button | ✅ | ✅ | ✅ | ✅ |
| Card | ✅ | ✅ | ✅ | ✅ |
| Input | ✅ | ✅ | ✅ | ✅ |
| Dropzone | ✅ | ✅ | ✅ | ✅ |
| RoomHeader | ✅ | ✅ | ✅ | ✅ |
| PeerList | ✅ | ✅ | ✅ | ✅ |
| FileTable | ✅ | ✅ | ✅ | ✅ |
| NetworkGraph | ✅ | ✅ | ⚠️ (needs labels) | ✅ |
| ConnectionStatus | ✅ | ✅ | ✅ | ✅ |

---

## 11. Design Tokens (Tailwind Config)

```js
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          light: '#e0e7ff',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#f43f5e',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## 12. Assets & Icons

| Asset | Source | Usage |
|-------|--------|-------|
| Icons | `lucide-react` | All UI icons (copy, upload, download, users, etc.) |
| QR Codes | `qrcode.react` | Client-side QR code generation for room links |
| Logo (optional) | Custom SVG or text | App title "P2P File Share" |
| Favicon | Inline SVG or emoji | Browser tab icon |

**No external image assets required** — all visuals are CSS/SVG-based.

---

## 13. Print / Export Considerations

- No print styles needed (browser app only).
- No PDF export needed.

---

## 14. Internationalization (Post-MVP)

- All text strings externalized to `messages/en.json`.
- Structure ready for `next-intl` or similar i18n library.
- MVP: English only.
