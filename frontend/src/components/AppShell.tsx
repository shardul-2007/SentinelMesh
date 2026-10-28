'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DemoModeIndicator } from '@/components/DemoModeIndicator';
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
    <div className="flex min-h-screen bg-[#1A1D20] text-[#FFFFFF] font-sans">
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
        <header className="lg:hidden h-14 bg-[#2D3238] text-[#FFFFFF] px-4 flex items-center justify-between border-b border-[#414850] sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-lg text-[#A0A5AD] hover:text-[#FFFFFF] hover:bg-[#353B42] border border-[#414850] transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#00FA9A]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00FA9A]/15 border border-[#00FA9A]/30 flex items-center justify-center text-[#00FA9A]">
                <Shield className="w-4 h-4 text-[#00FA9A]" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-[#FFFFFF]">SentinelMesh</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[#1A1D20] text-[#00FA9A] border border-[#00FA9A]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FA9A] animate-pulse"></span>
              MST Testnet
            </span>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 min-h-0 bg-[#1A1D20] focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
