import './globals.css';
import { AppShell } from '@/components/AppShell';
import { RBACProvider } from '@/lib/rbac';
import { Web3WalletProvider } from '@/lib/web3Wallet';

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
      <body className="bg-[#090D16] text-[#F8FAFC] min-h-screen font-sans antialiased selection:bg-[#38BDF8]/20 selection:text-[#38BDF8]">
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
