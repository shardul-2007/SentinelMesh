import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata = {
  title: 'SentinelMesh — Trust, Without Blind Faith',
  description: 'Agent-action governance, deterministic policy enforcement, cryptographic evidence infrastructure, and MST Blockchain anchoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F5F4F0] text-[#171A1F] min-h-screen font-sans antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
