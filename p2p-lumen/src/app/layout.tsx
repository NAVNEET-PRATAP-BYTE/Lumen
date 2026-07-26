import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumen — Decentralized P2P File Transfer',
  description:
    'Share files securely and directly in your browser. No cloud storage. End-to-end encrypted WebRTC data channels with zero file-size limits.',
  keywords: ['p2p', 'file transfer', 'webrtc', 'encrypted', 'peer-to-peer', 'decentralized'],
  openGraph: {
    title: 'Lumen — Decentralized P2P File Transfer',
    description: 'Share files securely, browser-to-browser. No servers involved.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumen — Decentralized P2P File Transfer',
    description: 'Share files securely, browser-to-browser. No servers involved.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f1117" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
      </head>
      <body className="noise antialiased">{children}</body>
    </html>
  );
}
