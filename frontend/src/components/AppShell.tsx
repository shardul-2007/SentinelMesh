'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Menu, Shield } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5F4F0] text-[#171A1F]">
      {/* Navigation Rail */}
      <Sidebar 
        mobileOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Mobile Header Bar (<1024px) */}
        <div className="lg:hidden h-12 bg-[#171A1F] text-[#F5F4F0] px-4 flex items-center justify-between border-b border-[#242A32] sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-1 rounded text-[#737B86] hover:text-[#FFFFFF] hover:bg-[#242A32] transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#82B5F8]" />
              <span className="text-xs font-semibold tracking-tight text-[#FFFFFF]">SentinelMesh</span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242A32] text-[#8E96A2] border border-[#3D4552]">
            MST Testnet
          </span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-[#F5F4F0]">
          {children}
        </main>
      </div>
    </div>
  );
}
