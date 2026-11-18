'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('SentinelMesh runtime boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172B4D] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#172B4D]">View Recovery Required</h2>
            <p className="text-xs text-[#64748B]">SentinelMesh caught an unexpected interface error.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono text-[#64748B] break-words">
          {error?.message || 'Unexpected client-side exception occurred while rendering this module.'}
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] text-xs font-bold transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry View</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#172B4D] border border-[#E5E7EB] text-xs font-bold transition shadow-xs"
          >
            <Home className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
