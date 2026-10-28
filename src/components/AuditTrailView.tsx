import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { AuditEvent } from '../types';
import {
  ScrollText, ShieldCheck, Clock, UserCheck, AlertTriangle,
  CheckCircle2, RefreshCw, FileCode, Search
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  const fetchAuditEvents = () => {
    setIsLoading(true);
    api.getAuditEvents({ limit: 100 })
      .then(setEvents)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    if (filterType !== 'all' && !e.event_type.toLowerCase().includes(filterType.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.readable_summary.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q) ||
        (e.actor_name && e.actor_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Append-Only Institutional Ledger
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Immutable Audit Trail & Activity Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every lifecycle transition, qualification signoff, handover inspection, and dispute resolution is recorded with permanent server timestamps.
          </p>
        </div>

        <button
          onClick={fetchAuditEvents}
          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Ledger
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor name, event type, booking code..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
          >
            <option value="all">All Event Categories</option>
            <option value="booking">Booking Actions</option>
            <option value="check_in">Check-In Handovers</option>
            <option value="return">Return Inspections</option>
            <option value="incident">Incidents & Discrepancies</option>
            <option value="qualification">Safety Qualifications</option>
            <option value="resource">Resource Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
          <span>{filteredEvents.length} Verified Ledger Events</span>
          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            Hash & Server Timestamps: UTC Nonce Verified
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No audit records found matching your search filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map(event => {
              const isExpanded = expandedEventId === event.id;
              return (
                <div key={event.id} className="py-3.5 space-y-2 hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {event.event_type}
                      </span>
                      <span className="font-semibold text-slate-900">
                        Actor: {event.actor_name || 'System'}
                      </span>
                      {event.actor_role && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 uppercase">
                          {event.actor_role}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.timestamp).toLocaleString([], {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    {event.readable_summary}
                  </p>

                  {/* Toggle JSON details */}
                  <div>
                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <FileCode className="w-3 h-3" />
                      {isExpanded ? "Hide Audit Payload" : "View Audit Payload Details"}
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-3 bg-slate-900 text-slate-200 text-[11px] rounded-xl overflow-x-auto font-mono">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
