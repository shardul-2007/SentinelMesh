'use client';

import React, { useEffect, useState } from 'react';
import { Sliders, Shield, CheckCircle, Info, Lock } from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { SecurityPolicy } from '@/lib/types';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await api.getPolicies();
        setPolicies(data);
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-[#0B0F17]">
      <Header 
        title="Policy Studio" 
        subtitle="Deterministic rule matrix evaluated by the SentinelMesh policy enforcement gateway"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Architecture Notice */}
        <div className="p-4 rounded bg-[#131A24] border border-[#263244] flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] flex-shrink-0 mt-0.5">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              Deterministic Policy Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-3xl">
              Every agent request is evaluated against this server-side rule matrix with explicit precedence. Blocked and approval-required operations are immediately halted before touching target resources.
            </p>
          </div>
        </div>

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 py-12 text-center text-[#94A3B8] text-xs font-sans">
              Loading active policies from backend...
            </div>
          ) : policies.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-[#94A3B8] text-xs font-sans">
              No policies registered in the database.
            </div>
          ) : (
            policies.map((policy) => (
              <div 
                key={policy.id}
                className="p-5 rounded bg-[#131A24] border border-[#263244] flex flex-col justify-between space-y-4 hover:border-[#38BDF8] transition shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#0B0F17] text-[#38BDF8] font-mono text-xs font-bold border border-[#263244]">
                        {policy.id}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono">v{policy.version}</span>
                    </div>
                    <StatusBadge type="decision" value={policy.decision} size="sm" />
                  </div>

                  <h4 className="text-sm font-semibold text-[#F8FAFC] mb-1">{policy.name}</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{policy.description}</p>
                </div>

                <div className="pt-3 border-t border-[#263244] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] text-[11px]">Action Pattern:</span>
                    <span className="font-mono text-[#F8FAFC] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#263244]">
                      {policy.action_pattern}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] text-[11px]">Resource Scope:</span>
                    <span className="font-mono text-[#F8FAFC] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#263244] max-w-[220px] truncate" title={policy.resource_pattern}>
                      {policy.resource_pattern}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#94A3B8] text-[11px]">Derived Server Risk:</span>
                    <StatusBadge type="risk" value={policy.risk_tier} size="sm" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
