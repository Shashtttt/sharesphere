import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Booking } from '../types';
import {
  ListOrdered, Clock, CheckCircle2, AlertCircle, ShieldCheck,
  ChevronRight, Users, Bell
} from 'lucide-react';

export const WaitingListView: React.FC = () => {
  const { user } = useAuth();
  const [waitlistedBookings, setWaitlistedBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWaitlist = () => {
    setIsLoading(true);
    api.getManageBookings()
      .then(bookings => {
        const waitlist = bookings.filter(b => b.status === 'waitlisted');
        setWaitlistedBookings(waitlist);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchWaitlist();
  }, [user]);

  const handleCancelWaitlist = async (id: number) => {
    if (!confirm('Cancel your waitlist reservation? This will advance the next borrower in line.')) return;
    try {
      await api.cancelBooking(id, 'Removed from waitlist by borrower');
      fetchWaitlist();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel waitlist booking');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Waiting Lists & Fair Allocation Queue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          ShareSphere prevents double-booking while ensuring equitable, transparent queue placement whenever high-demand resources are occupied.
        </p>
      </div>

      {/* Fair Allocation Policy Explanation Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ListOrdered className="w-4 h-4" /> Transparent Priority
          </div>
          <h3 className="font-bold text-sm">Deterministic FIFO Ordering</h3>
          <p className="text-xs text-slate-300">
            Queue position is assigned strictly by request timestamp and verified safety qualifications. No undisclosed priority or arbitrary overrides.
          </p>
        </div>

        <div className="space-y-1">
          <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Anti-Hoarding Limits
          </div>
          <h3 className="font-bold text-sm">Rolling Allocation Quotas</h3>
          <p className="text-xs text-slate-300">
            Enforces a maximum of 5 concurrent active bookings and resource-specific weekly frequencies to ensure underused gear is shared democratically.
          </p>
        </div>

        <div className="space-y-1">
          <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-4 h-4" /> Reactive Advance
          </div>
          <h3 className="font-bold text-sm">Instant Cancellation Re-allocation</h3>
          <p className="text-xs text-slate-300">
            When an active booking is cancelled or returned early, the database immediately notifies the #1 queued borrower.
          </p>
        </div>
      </div>

      {/* Waitlisted Queue Items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Active Waiting List Reservations ({waitlistedBookings.length})
        </h2>

        {isLoading ? (
          <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
        ) : waitlistedBookings.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 border border-slate-200 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-slate-700 font-bold text-sm">All Resources Operating Within Capacity</p>
            <p className="text-slate-400 text-xs mt-0.5">There are currently no backlogged queues across campus laboratories.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitlistedBookings.map(b => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{b.booking_code}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                      Position #{b.queue_position || 1} in Queue
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{b.resource?.title}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Borrower: <strong>{b.borrower?.full_name}</strong></span>
                    <span>•</span>
                    <span>Requested Time: {new Date(b.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{b.purpose}"</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleCancelWaitlist(b.id)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Leave Queue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
