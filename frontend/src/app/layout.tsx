import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata = {
  title: 'SentinelMesh — Trust, Without Blind Faith',
  description: 'Enterprise AI Agent Governance, Deterministic Policy Enforcement, Cryptographic Canonical Evidence & MST Blockchain Anchoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-[#F8FAFC] min-h-screen font-sans antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
