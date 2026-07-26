'use client';

import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { useRoomStore } from '@/store/roomStore';

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  isSelf: boolean;
}

const W = 400;
const H = 300;
const NODE_R = 24;

function positionNodes(nodes: Omit<NodeData, 'x' | 'y'>[]): NodeData[] {
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(cx, cy) - NODE_R - 12;

  if (nodes.length === 1) {
    return [{ ...nodes[0]!, x: cx, y: cy }];
  }
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return { ...n, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

export function NetworkGraph() {
  const { peers, peerId, displayName, files } = useRoomStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const particleTimelinesRef = useRef<Map<string, gsap.core.Timeline>>(new Map());

  // Build node list: self + remote peers
  const rawNodes = useMemo(() => {
    const selfNode = { id: peerId, label: displayName, isSelf: true };
    const peerNodes = peers.map((p) => ({
      id: p.peerId,
      label: p.displayName,
      isSelf: false,
    }));
    return [selfNode, ...peerNodes];
  }, [peerId, displayName, peers]);

  const nodes = useMemo(() => positionNodes(rawNodes), [rawNodes]);

  // Build edge list (full mesh)
  const edges = useMemo(() => {
    const result: Array<{ from: NodeData; to: NodeData }> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        result.push({ from: nodes[i]!, to: nodes[j]! });
      }
    }
    return result;
  }, [nodes]);

  // Animate node entrance
  useEffect(() => {
    if (!svgRef.current) return;
    const nodeEls = svgRef.current.querySelectorAll('.peer-node');
    gsap.fromTo(
      nodeEls,
      { scale: 0, opacity: 0, transformOrigin: '50% 50%' },
      { scale: 1, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.4)' }
    );
  }, [nodes.length]);

  // Animate data particles along active transfer edges
  useEffect(() => {
    const activeSends = files.filter(
      (f) => f.status === 'transmitting' && f.direction === 'send'
    );

    // Kill stale timelines
    particleTimelinesRef.current.forEach((tl, key) => {
      if (!activeSends.find((f) => f.id === key)) {
        tl.kill();
        particleTimelinesRef.current.delete(key);
      }
    });

    activeSends.forEach((transfer) => {
      if (particleTimelinesRef.current.has(transfer.id)) return;

      const selfNode = nodes.find((n) => n.id === peerId);
      if (!selfNode || !svgRef.current) return;

      const particleId = `particle-${transfer.id}`;
      const el = svgRef.current.getElementById(particleId);
      if (!el) return;

      const edge = edges.find((e) => e.from.id === peerId || e.to.id === peerId);
      if (!edge) return;

      const tl = gsap.timeline({ repeat: -1 });
      tl.fromTo(
        el,
        { attr: { cx: selfNode.x, cy: selfNode.y }, opacity: 1 },
        {
          attr: {
            cx: edge.from.id === peerId ? edge.to.x : edge.from.x,
            cy: edge.from.id === peerId ? edge.to.y : edge.from.y,
          },
          opacity: 0,
          duration: 1.2,
          ease: 'none',
        }
      );
      particleTimelinesRef.current.set(transfer.id, tl);
    });
  }, [files, nodes, edges, peerId]);

  const activeTransferId = files.find(
    (f) => f.status === 'transmitting' && f.direction === 'send'
  )?.id;

  return (
    <section
      aria-label="Network topology graph"
      className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card"
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-200">Network Topology</h2>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-hidden
        style={{ maxHeight: 260 }}
      >
        {/* Definitions */}
        <defs>
          <radialGradient id="selfGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#527dff" stopOpacity="1" />
            <stop offset="100%" stopColor="#2952ff" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="peerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a3347" stopOpacity="1" />
            <stop offset="100%" stopColor="#1c2233" stopOpacity="1" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke="#2a3347"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* Active transfer particles */}
        {activeTransferId &&
          edges
            .filter((e) => e.from.id === peerId || e.to.id === peerId)
            .map((edge, i) => (
              <circle
                key={i}
                id={`particle-${activeTransferId}`}
                r="5"
                fill="#22d3ee"
                filter="url(#glow)"
                cx={edge.from.id === peerId ? edge.from.x : edge.to.x}
                cy={edge.from.id === peerId ? edge.from.y : edge.to.y}
              />
            ))}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id} className="peer-node" transform={`translate(${node.x},${node.y})`}>
            {/* Outer ring for self */}
            {node.isSelf && (
              <circle
                r={NODE_R + 5}
                fill="none"
                stroke="#2952ff"
                strokeWidth="1"
                strokeOpacity="0.4"
                className="animate-pulse-slow"
              />
            )}
            {/* Main node circle */}
            <circle
              r={NODE_R}
              fill={node.isSelf ? 'url(#selfGrad)' : 'url(#peerGrad)'}
              stroke={node.isSelf ? '#527dff' : '#2a3347'}
              strokeWidth="1.5"
              filter={node.isSelf ? 'url(#glow)' : undefined}
            />
            {/* Initials */}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill={node.isSelf ? '#fff' : '#94a3b8'}
              fontSize="11"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {node.label.slice(0, 2).toUpperCase()}
            </text>
            {/* Display name label */}
            <text
              y={NODE_R + 14}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#64748b"
              fontSize="9"
              fontFamily="Inter, sans-serif"
            >
              {node.label.length > 10 ? `${node.label.slice(0, 10)}…` : node.label}
              {node.isSelf ? ' (you)' : ''}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
