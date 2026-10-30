'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Menu, Shield } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sentinel_sidebar_collapsed');
      if (stored === 'true') {
        setIsSidebarCollapsed(true);
      }

      // Suppress benign third-party browser extension errors (e.g. video grabbers, wallet message channel drops)
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reasonMsg = event?.reason?.message || String(event?.reason || '');
        if (
          reasonMsg.includes('A listener indicated an asynchronous response') ||
          reasonMsg.includes('message channel closed') ||
          reasonMsg.includes('Video element not found')
        ) {
          event.preventDefault(); // Prevents logging "Uncaught (in promise)" in the console
        }
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }
  }, []);

  const toggleSidebarCollapse = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentinel_sidebar_collapsed', String(next));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090D16] text-[#F8FAFC] font-sans overflow-x-hidden">
      {/* Navigation Rail (Collapsible Desktop + Accessible Mobile Drawer) */}
      <Sidebar 
        mobileOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden">
        {/* Mobile Header Bar (<1024px) */}
        <header className="lg:hidden h-14 bg-[#101827] text-[#F8FAFC] px-4 flex items-center justify-between border-b border-[#263449] sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-[#263449] transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                <Shield className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-[#F8FAFC]">SentinelMesh</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[#151F30] text-[#38BDF8] border border-[#38BDF8]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
              MST Testnet
            </span>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 min-h-0 bg-[#090D16] focus:outline-none overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
