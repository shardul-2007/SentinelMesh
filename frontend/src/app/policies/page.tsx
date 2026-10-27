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
    <div className="flex flex-col min-h-full">
      <Header 
        title="Security Policies Engine" 
        subtitle="Deterministic rules evaluated by the SentinelMesh core engine"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Architecture Notice */}
        <div className="p-4 rounded-xl bg-graphite-900 border border-graphite-750 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Zero-Trust Policy Architecture
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              All agent requests pass through this deterministic rule matrix. Blocked and approval-required operations are immediately isolated before reaching any host environment or API gateway.
            </p>
          </div>
        </div>

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 py-12 text-center text-slate-500 text-xs font-sans">
              Loading active policies from backend...
            </div>
          ) : policies.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-500 text-xs font-sans">
              No policies registered in the database.
            </div>
          ) : (
            policies.map((policy) => (
              <div 
                key={policy.id}
                className="p-5 rounded-xl bg-graphite-900 border border-graphite-750 flex flex-col justify-between space-y-4 hover:border-graphite-650 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-graphite-800 text-slate-200 font-mono text-xs font-bold border border-graphite-700">
                        {policy.id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">v{policy.version}</span>
                    </div>
                    <StatusBadge type="decision" value={policy.decision} size="sm" />
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 mb-1.5">{policy.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{policy.description}</p>
                </div>

                <div className="pt-3 border-t border-graphite-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Action Match:</span>
                    <span className="font-mono text-slate-300 bg-graphite-950 px-2 py-0.5 rounded border border-graphite-800">
                      {policy.action_pattern}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Resource Scope:</span>
                    <span className="font-mono text-slate-300 bg-graphite-950 px-2 py-0.5 rounded border border-graphite-800 max-w-[220px] truncate" title={policy.resource_pattern}>
                      {policy.resource_pattern}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 text-[11px]">Server Risk Tier:</span>
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
