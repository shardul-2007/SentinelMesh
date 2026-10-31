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

      // Suppress benign third-party browser extension errors
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reasonMsg = event?.reason?.message || String(event?.reason || '');
        if (
          reasonMsg.includes('A listener indicated an asynchronous response') ||
          reasonMsg.includes('message channel closed') ||
          reasonMsg.includes('Video element not found')
        ) {
          event.preventDefault();
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
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#172B4D] font-sans overflow-x-hidden">
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
        <header className="lg:hidden h-14 bg-[#FFFFFF] text-[#172B4D] px-4 flex items-center justify-between border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-[#F1F5F9] border border-[#E5E7EB] transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                <Shield className="w-4 h-4 text-[#2563EB]" />
              </div>
              <span className="text-sm font-bold tracking-tight text-[#172B4D]">SentinelMesh</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#2563EB] border border-[#E5E7EB]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
              MST Testnet
            </span>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 min-h-0 bg-[#F7F8FA] focus:outline-none overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
