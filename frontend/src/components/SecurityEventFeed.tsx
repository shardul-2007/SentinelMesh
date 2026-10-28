'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  Eye, 
  Clock, 
  ArrowRight, 
  Boxes, 
  Lock, 
  RefreshCw 
} from 'lucide-react';
import { api } from '@/lib/api';
import { AuditEventSummary, AuditEventDetail } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { EventDetailModal } from '@/components/EventDetailModal';

export function SecurityEventFeed() {
  const [events, setEvents] = useState<AuditEventSummary[]>([]);
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEvents({ page_size: 20 });
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to load event feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleInspect = async (eventId: string) => {
    try {
      const detail = await api.getEventDetail(eventId);
      setSelectedEvent(detail);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to inspect event:', err);
    }
  };

  const filtered = events.filter((e) => {
    const matchesSearch = 
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.agent_id.toLowerCase().includes(search.toLowerCase()) ||
      e.resource.toLowerCase().includes(search.toLowerCase()) ||
      e.policy_id.toLowerCase().includes(search.toLowerCase());
    const matchesDecision = filterDecision === 'ALL' || e.policy_decision === filterDecision;
    return matchesSearch && matchesDecision;
  });

  return (
    <div className="mst-card p-4 sm:p-5 rounded-xl bg-[#2D3238] border border-[#414850] shadow-xl space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#414850]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#00FA9A]" />
          <h3 className="text-sm font-extrabold text-[#FFFFFF]">Live Security Event Feed</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1D20] text-[#00FA9A] border border-[#414850] font-bold">
            {filtered.length} Events
          </span>
        </div>

        <button
          type="button"
          onClick={loadFeed}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-[#1A1D20] hover:bg-[#353B42] text-[#A0A5AD] hover:text-[#FFFFFF] border border-[#414850] transition self-end sm:self-auto"
          title="Refresh event stream"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#00FA9A] ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
        <div className="sm:col-span-8 relative">
          <Search className="w-3.5 h-3.5 text-[#A0A5AD] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by agent, resource, event ID or policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#1A1D20] border border-[#414850] text-[#FFFFFF] placeholder-[#A0A5AD] focus:outline-none focus:border-[#00FA9A] font-mono text-xs"
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#1A1D20] border border-[#414850] text-[#FFFFFF] focus:outline-none focus:border-[#00FA9A] font-mono text-xs font-semibold"
          >
            <option value="ALL">All Decisions</option>
            <option value="ALLOW">ALLOW (Permitted)</option>
            <option value="BLOCK">BLOCK (Denied)</option>
            <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Escalated)</option>
          </select>
        </div>
      </div>

      {/* Events Table / Card List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-[#A0A5AD] font-sans font-medium">
          Loading live security event feed...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#A0A5AD] font-sans font-medium">
          No security events match your search criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-[#414850] text-[#A0A5AD] font-mono text-[10px] uppercase font-bold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Operation &amp; Scope</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Policy ID</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#414850]/60 font-mono">
              {filtered.map((evt) => (
                <tr key={evt.id} className="mst-table-row hover:bg-[#353B42]/60 transition">
                  <td className="py-2.5 px-3 text-[#A0A5AD] text-[11px] whitespace-nowrap font-medium">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#FFFFFF] whitespace-nowrap">
                    {evt.agent_id}
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate" title={evt.resource}>
                    <span className="text-[#00FA9A] mr-1.5 font-bold">{evt.action_type}</span>
                    <span className="text-[#A0A5AD]">{evt.resource}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge type="decision" value={evt.policy_decision} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-[#A0A5AD] text-[11px] font-medium">
                    {evt.policy_id}
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => handleInspect(evt.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#1A1D20] border border-[#414850] text-[#00FA9A] hover:text-[#FFFFFF] hover:border-[#00FA9A] transition text-[11px] font-bold"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Modal */}
      {isModalOpen && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
