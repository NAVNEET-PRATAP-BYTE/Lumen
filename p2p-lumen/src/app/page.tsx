'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Cpu,
  Lock,
  QrCode,
  Sparkles,
  CheckCircle2,
  Github,
  Users2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { generateRoomCode, validateRoomCode, validateDisplayName } from '@/lib/validators';
import { useRoomStore } from '@/store/roomStore';

// ─── Startup Feature List ───────────────────────────────────────────────────

const STARTUP_FEATURES = [
  {
    icon: Lock,
    title: 'ECDH P-384 + AES-256-GCM',
    desc: 'Military-grade end-to-end encryption. Symmetric keys derived in-browser; zero plaintexts over wire.',
    tag: 'Cryptographic Core',
  },
  {
    icon: Globe2,
    title: 'True Mesh WebRTC',
    desc: 'Direct browser-to-browser binary DataChannels. Zero servers in the data path, zero cloud storage.',
    tag: 'P2P Architecture',
  },
  {
    icon: Cpu,
    title: '2 GB Stream Chunking',
    desc: 'Sequential 64 KB streaming with active backpressure control prevents browser buffer overflows.',
    tag: 'High Throughput',
  },
  {
    icon: QrCode,
    title: 'Instant QR & Link Share',
    desc: 'Connect desktop to mobile in seconds with auto-generated room QR codes and shareable URLs.',
    tag: 'Zero Setup',
  },
  {
    icon: Users2,
    title: 'Multi-Peer Mesh Support',
    desc: 'Simultaneously stream files to up to 6 peers in a fully interconnected mesh room.',
    tag: 'Multi-Peer',
  },
  {
    icon: Layers,
    title: 'Gzip Hardware Compression',
    desc: 'In-flight native stream compression shrinks file payloads before encryption and dispatch.',
    tag: 'Optimized Speed',
  },
];

// ─── Comparison Data ─────────────────────────────────────────────────────────

const COMPARISON = [
  { feature: 'End-to-End Encrypted', lumen: true, wetransfer: false, gdrive: false },
  { feature: 'Zero Server Storage', lumen: true, wetransfer: false, gdrive: false },
  { feature: 'No File Size Limit', lumen: 'Up to 2GB P2P', wetransfer: '2GB (capped)', gdrive: '15GB Free' },
  { feature: 'No Account Required', lumen: true, wetransfer: true, gdrive: false },
  { feature: 'Direct LAN Speeds', lumen: '1 Gbps+', wetransfer: 'Internet throttled', gdrive: 'Internet throttled' },
];

export default function LandingPage() {
  const router = useRouter();
  const { setRoomCode, setStatus, displayName, setDisplayName } = useRoomStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [nameInput, setNameInput] = useState(displayName);
  const [nameError, setNameError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateName = (): boolean => {
    const result = validateDisplayName(nameInput);
    if (!result.valid) {
      setNameError(result.error ?? 'Invalid display name');
      return false;
    }
    setNameError('');
    setDisplayName(nameInput.trim());
    return true;
  };

  const handleCreate = async () => {
    if (!validateName()) return;
    setIsLoading(true);
    const code = generateRoomCode();
    setRoomCode(code);
    setStatus('joining');
    router.push(`/room/${code}`);
  };

  const handleJoin = async () => {
    if (!validateName()) return;
    const code = joinCode.trim().toUpperCase();
    if (!validateRoomCode(code)) {
      setJoinError('Enter a valid 6-character room code');
      return;
    }
    setJoinError('');
    setIsLoading(true);
    setRoomCode(code);
    setStatus('joining');
    router.push(`/room/${code}`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* ── Background Aesthetics & Glows ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-brand-500/15 via-accent-violet/10 to-accent-cyan/15 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-brand-500/10 blur-[100px]" />
        <div className="absolute bottom-10 right-0 h-[450px] w-[450px] rounded-full bg-accent-cyan/10 blur-[130px]" />
      </div>

      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-surface/80 border-b border-surface-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand">
              <Zap size={22} className="text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Lumen
            </span>
            <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-300">
              v1.0 Release
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#architecture" className="transition hover:text-white">Architecture</a>
            <a href="#comparison" className="transition hover:text-white">Comparison</a>
            <a href="#security" className="transition hover:text-white">Security</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              <Github size={15} />
              <span>GitHub</span>
            </a>
            <a
              href="#app-launcher"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan px-4 py-2 text-xs font-semibold text-white shadow-glow-brand transition hover:opacity-95"
            >
              Launch App
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-xs font-medium text-brand-300">
              <Sparkles size={14} className="text-brand-400" />
              <span>Decentralized P2P File Transfer Engine</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-6xl leading-[1.1]">
              Share files at lightspeed.{' '}
              <span className="bg-gradient-to-r from-brand-400 via-accent-cyan to-accent-violet bg-clip-text text-transparent">
                Directly browser-to-browser.
              </span>
            </h1>

            <p className="max-w-2xl text-lg text-slate-400 font-normal leading-relaxed mx-auto lg:mx-0">
              Lumen bypasses cloud servers completely. Stream unlimited files straight to your peers over WebRTC with hardware-accelerated ECDH P-384 & AES-256-GCM encryption.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <CheckCircle2 size={16} className="text-accent-emerald" />
                <span>Zero Server Storage</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <CheckCircle2 size={16} className="text-accent-emerald" />
                <span>No Accounts Required</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <CheckCircle2 size={16} className="text-accent-emerald" />
                <span>LAN & Internet Speeds</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Funded Startup Interactive Room Card */}
          <motion.div
            id="app-launcher"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-3xl border border-surface-border bg-surface-card/90 p-7 shadow-card backdrop-blur-xl transition-all hover:border-brand-500/40">
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-brand-500 to-accent-cyan px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Instant Access
              </div>

              {/* Card Header Tabs */}
              <div className="mb-6 flex rounded-xl bg-surface-elevated p-1 border border-surface-border">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'create'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create New Room
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'join'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Join Existing Room
                </button>
              </div>

              {/* Display Name Input (common to both) */}
              <div className="mb-5 space-y-1">
                <Input
                  id="display-name"
                  label="Your Display Alias"
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
                  error={nameError}
                  placeholder="e.g. Swift-Fox"
                  maxLength={20}
                  autoComplete="off"
                />
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'create' ? (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-slate-400">
                      Generate a secure, ephemeral 6-character room code and invite peers via link or QR code.
                    </p>
                    <Button
                      id="create-room-btn"
                      className="w-full shadow-glow-brand"
                      size="lg"
                      onClick={handleCreate}
                      isLoading={isLoading}
                    >
                      <Zap size={18} />
                      Create Secure Room
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="join"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <Input
                      id="room-code-input"
                      label="Room Code"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                      error={joinError}
                      placeholder="A7B9ZK"
                      maxLength={6}
                      autoComplete="off"
                      className="font-mono tracking-widest text-center uppercase text-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                    <Button
                      id="join-room-btn"
                      className="w-full shadow-glow-brand"
                      size="lg"
                      variant="secondary"
                      onClick={handleJoin}
                      isLoading={isLoading}
                    >
                      Join Room
                      <ArrowRight size={18} />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Security Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-surface-border/60 pt-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-accent-emerald" />
                  E2E Encrypted Session
                </span>
                <span>WebRTC Mesh Engine</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Highlights Grid ── */}
      <section id="features" className="relative z-10 border-t border-surface-border/60 bg-surface-elevated/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-brand-400">Architecture & Features</h2>
            <p className="text-3xl font-bold text-white sm:text-4xl">Engineered for zero trust & high velocity</p>
            <p className="text-sm text-slate-400">Built with modern browser standards to eliminate cloud dependencies entirely.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STARTUP_FEATURES.map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-surface-border bg-surface-card p-7 transition-all hover:border-brand-500/40 hover:shadow-card-hover"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-[10px] font-semibold text-slate-400 border border-surface-border">
                    {tag}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Step-by-Step ── */}
      <section id="architecture" className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-accent-cyan">Simple 3-Step Flow</h2>
            <p className="text-3xl font-bold text-white sm:text-4xl">How P2P file sharing works</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-surface-border bg-surface-card p-6 relative">
              <span className="text-4xl font-black text-brand-500/30 mb-2 block">01</span>
              <h3 className="text-lg font-bold text-white mb-2">Create Room</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an ephemeral room code. Your browser creates a unique ECDH P-384 cryptographic keypair locally.
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-card p-6 relative">
              <span className="text-4xl font-black text-accent-cyan/30 mb-2 block">02</span>
              <h3 className="text-lg font-bold text-white mb-2">Share Code or QR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send the 6-character code or scan the QR code from another desktop or mobile device on LAN or Internet.
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-card p-6 relative">
              <span className="text-4xl font-black text-accent-violet/30 mb-2 block">03</span>
              <h3 className="text-lg font-bold text-white mb-2">Direct Encrypted Stream</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                WebRTC DataChannels open. Chunks are compressed, encrypted with AES-256-GCM, and streamed straight to peers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section id="comparison" className="relative z-10 border-t border-surface-border/60 bg-surface-elevated/30 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-14 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-brand-400">Why Choose Lumen</h2>
            <p className="text-3xl font-bold text-white">Lumen vs Cloud Services</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-elevated border-b border-surface-border text-slate-200">
                <tr>
                  <th className="p-4 font-semibold">Feature</th>
                  <th className="p-4 font-bold text-brand-300">Lumen P2P</th>
                  <th className="p-4 font-medium text-slate-400">WeTransfer</th>
                  <th className="p-4 font-medium text-slate-400">Google Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="p-4 font-medium text-white">{row.feature}</td>
                    <td className="p-4 font-bold text-brand-400">
                      {typeof row.lumen === 'boolean' ? (
                        row.lumen ? <CheckCircle2 size={16} className="text-accent-emerald" /> : '—'
                      ) : (
                        row.lumen
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      {typeof row.wetransfer === 'boolean' ? (
                        row.wetransfer ? <CheckCircle2 size={16} className="text-slate-500" /> : '—'
                      ) : (
                        row.wetransfer
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      {typeof row.gdrive === 'boolean' ? (
                        row.gdrive ? <CheckCircle2 size={16} className="text-slate-500" /> : '—'
                      ) : (
                        row.gdrive
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border/60 bg-surface/90 py-12 text-slate-500 text-xs">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-xs">
              ⚡
            </div>
            <span className="text-sm font-bold text-white">Lumen</span>
            <span>— Decentralized P2P File Transfer Protocol</span>
          </div>

          <div className="flex items-center gap-6">
            <span>WebRTC</span>
            <span>•</span>
            <span>ECDH P-384</span>
            <span>•</span>
            <span>AES-256-GCM</span>
          </div>

          <p>© 2026 Lumen. Open Source Portfolio Project.</p>
        </div>
      </footer>
    </div>
  );
}
