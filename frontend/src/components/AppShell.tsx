'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DemoModeIndicator } from '@/components/DemoModeIndicator';
import { Menu, Shield, Boxes } from 'lucide-react';

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
    <div className="flex min-h-screen bg-[#0B0F17] text-[#F8FAFC]">
      {/* Navigation Rail (Collapsible Desktop + Accessible Mobile Drawer) */}
      <Sidebar 
        mobileOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Global Evaluation & Demo Mode Indicator */}
        <DemoModeIndicator />

        {/* Mobile Header Bar (<1024px) */}
        <header className="lg:hidden h-14 bg-[#131A24] text-[#F8FAFC] px-4 flex items-center justify-between border-b border-[#263244] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2332] border border-[#263244] transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-sm font-bold tracking-tight text-[#F8FAFC]">SentinelMesh</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-[#0B0F17] text-[#38BDF8] border border-[#263244]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              MST Testnet
            </span>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 min-h-0 bg-[#0B0F17] focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
