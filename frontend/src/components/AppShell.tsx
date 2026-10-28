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
    <div className="flex min-h-screen bg-[#000000] text-[#FFFFFF] font-sans">
      {/* Navigation Rail (Collapsible Desktop + Accessible Mobile Drawer) */}
      <Sidebar 
        mobileOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Mobile Header Bar (<1024px) */}
        <header className="lg:hidden h-14 bg-[#121212] text-[#FFFFFF] px-4 flex items-center justify-between border-b border-[#27272A] sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-lg text-[#D4D4D8] hover:text-[#FFFFFF] hover:bg-[#1C1C1C] border border-[#27272A] transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#FACC15]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FACC15]/15 border border-[#FACC15]/30 flex items-center justify-center text-[#FACC15]">
                <Shield className="w-4 h-4 text-[#FACC15]" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-[#FFFFFF]">SentinelMesh</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[#000000] text-[#FACC15] border border-[#FACC15]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse"></span>
              MST Testnet
            </span>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 min-h-0 bg-[#000000] focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
