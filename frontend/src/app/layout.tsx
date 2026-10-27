import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata = {
  title: 'SentinelMesh — Trust, Without Blind Faith',
  description: 'Security & Accountability Platform for Autonomous AI Agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-graphite-950 text-slate-100 flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
