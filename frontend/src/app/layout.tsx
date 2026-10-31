import './globals.css';
import { AppShell } from '@/components/AppShell';
import { RBACProvider } from '@/lib/rbac';
import { Web3WalletProvider } from '@/lib/web3Wallet';

export const metadata = {
  title: 'SentinelMesh — Verifiable Security for AI Agents',
  description: 'Zero-Trust governance gateway for AI agents, enforcing security policies, controlling sensitive operations, and generating cryptographically verifiable evidence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F7F8FA] text-[#172B4D] min-h-screen font-sans antialiased selection:bg-[#2563EB]/15 selection:text-[#2563EB]">
        <Web3WalletProvider>
          <RBACProvider>
            <AppShell>
              {children}
            </AppShell>
          </RBACProvider>
        </Web3WalletProvider>
      </body>
    </html>
  );
}
