import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Booking } from '../types';
import {
  CalendarClock, Clock, CheckCircle2, AlertTriangle, AlertCircle,
  XCircle, ArrowRight, ShieldCheck, FileText, Check, ChevronRight
} from 'lucide-react';

interface BookingsViewProps {
  onOpenCheckIn: (booking: Booking) => void;
  onOpenReturn: (booking: Booking) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  onOpenCheckIn,
  onOpenReturn,
}) => {
  const { user } = useAuth();
  const role = user?.role || 'borrower';

  const [activeTab, setActiveTab] = useState<'my' | 'manage'>(role === 'owner' ? 'manage' : 'my');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);

  const fetchBookings = () => {
    setIsLoading(true);
    const fetcher = activeTab === 'manage' ? api.getManageBookings() : api.getMyBookings();
    fetcher
      .then(setBookings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab, user]);

  const handleReviewAction = async (bookingId: number, action: 'approve' | 'reject' | 'waitlist') => {
    let reason = '';
    if (action === 'reject') {
      const input = prompt('Please enter a reason for rejecting this booking:');
      if (input === null) return;
      reason = input;
    } else if (action === 'approve') {
      reason = 'Requirements & safety qualification confirmed.';
    }

    try {
      await api.reviewBooking(bookingId, action, reason);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleCancel = async (bookingId: number) => {
    const reason = prompt('Please enter cancellation reason:');
    if (reason === null) return;
    try {
      await api.cancelBooking(bookingId, reason);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const handleOwnerConfirmReturn = async (bookingId: number, discrepancy: boolean) => {
    let ownerNotes = '';
    if (discrepancy) {
      const input = prompt('Specify damage or discrepancy details for the incident report:');
      if (input === null) return;
      ownerNotes = input;
    } else {
      ownerNotes = 'Equipment returned in good condition. Handover accepted.';
    }

    try {
      await api.confirmReturn(bookingId, { discrepancy_flag: discrepancy, owner_notes: ownerNotes });
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Return confirmation failed');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return b.status === 'checked_in';
    if (statusFilter === 'pending') return b.status === 'pending_approval' || b.status === 'pending_eligibility';
    if (statusFilter === 'approved') return b.status === 'approved';
    if (statusFilter === 'completed') return b.status === 'completed';
    if (statusFilter === 'waitlisted') return b.status === 'waitlisted';
    if (statusFilter === 'incident') return b.status === 'incident_under_review' || b.status === 'overdue';
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reservations & Handover Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict state machine tracking: draft → pending → approved → checked in → return inspected → completed.
          </p>
        </div>

        {/* Tab Switcher for Owners/Managers */}
        {(role === 'owner' || role === 'manager' || role === 'admin') && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'my' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Reservations
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'manage' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incoming Requests ({role === 'owner' ? 'Owner Review' : 'Manager Overview'})
            </button>
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'all', label: 'All Transactions' },
          { id: 'active', label: 'Active In-Use' },
          { id: 'approved', label: 'Approved (Ready to Check-In)' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'waitlisted', label: 'Waitlisted' },
          { id: 'completed', label: 'Completed' },
          { id: 'incident', label: 'Disputes & Overdue' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-xs">No bookings found in this status category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Column: Booking Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={b.resource?.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758'}
                    alt={b.resource?.title || 'Resource'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">{b.booking_code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      b.status === 'approved' ? 'bg-indigo-100 text-indigo-700' :
                      b.status === 'checked_in' ? 'bg-emerald-100 text-emerald-700' :
                      b.status === 'return_pending' ? 'bg-purple-100 text-purple-700' :
                      b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      b.status === 'waitlisted' ? 'bg-amber-100 text-amber-700' :
                      b.status === 'incident_under_review' ? 'bg-rose-100 text-rose-700' :
                      b.status === 'rejected' || b.status === 'cancelled' ? 'bg-slate-200 text-slate-600' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    {b.queue_position && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        Queue #{b.queue_position}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{b.resource?.title}</h3>
                  
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span>Borrower: <strong>{b.borrower?.full_name}</strong></span>
                    <span>•</span>
                    <span>
                      {new Date(b.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-slate-50 px-2 py-1 rounded-md max-w-xl">
                    "{b.purpose}"
                  </p>
                </div>
              </div>

              {/* Right Column: Dynamic Action Buttons based on State Machine */}
              <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                
                {/* 1. Borrower Check-In Action */}
                {b.status === 'approved' && (
                  <button
                    onClick={() => onOpenCheckIn(b)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify & Check In
                  </button>
                )}

                {/* 2. Borrower Return Action */}
                {(b.status === 'checked_in' || b.status === 'overdue') && (
                  <button
                    onClick={() => onOpenReturn(b)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Return & Condition Signoff
                  </button>
                )}

                {/* 3. Owner Review Actions (Approve / Reject / Waitlist) */}
                {b.status === 'pending_approval' && (role === 'owner' || role === 'manager' || role === 'admin') && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReviewAction(b.id, 'approve')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewAction(b.id, 'waitlist')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Waitlist
                    </button>
                    <button
                      onClick={() => handleReviewAction(b.id, 'reject')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* 4. Owner Return Inspection Confirmation */}
                {b.status === 'return_pending' && (role === 'owner' || role === 'manager' || role === 'admin') && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOwnerConfirmReturn(b.id, false)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Accept Handover
                    </button>
                    <button
                      onClick={() => handleOwnerConfirmReturn(b.id, true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Flag Discrepancy
                    </button>
                  </div>
                )}

                {/* 5. Cancel Action for non-terminal states */}
                {['draft', 'pending_approval', 'pending_eligibility', 'approved', 'waitlisted'].includes(b.status) && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 py-1"
                  >
                    Cancel Booking
                  </button>
                )}

                {/* 6. Transaction Details Button */}
                <button
                  onClick={() => setSelectedBookingForDetails(b)}
                  className="px-3 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Inspect Audit Details
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Booking #{selectedBookingForDetails.booking_code} Full Records
                </h3>
                <span className="text-xs text-slate-500">{selectedBookingForDetails.resource?.title}</span>
              </div>
              <button onClick={() => setSelectedBookingForDetails(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
              
              {/* CheckIn Record if present */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Handover Check-In Record
                  </span>
                  <span className="text-slate-400 font-normal">
                    {selectedBookingForDetails.check_in_record ? new Date(selectedBookingForDetails.check_in_record.checked_in_at).toLocaleString() : 'Not Checked In'}
                  </span>
                </div>
                {selectedBookingForDetails.check_in_record ? (
                  <div>
                    <p className="text-slate-600 mt-1">
                      Checklist: {JSON.stringify(selectedBookingForDetails.check_in_record.condition_checklist)}
                    </p>
                    {selectedBookingForDetails.check_in_record.notes && (
                      <p className="text-slate-600 mt-1">Notes: {selectedBookingForDetails.check_in_record.notes}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No check-in record filed yet.</p>
                )}
              </div>

              {/* Return Record if present */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Return & Condition Record
                  </span>
                  <span className="text-slate-400 font-normal">
                    {selectedBookingForDetails.return_record ? new Date(selectedBookingForDetails.return_record.returned_at).toLocaleString() : 'Not Returned'}
                  </span>
                </div>
                {selectedBookingForDetails.return_record ? (
                  <div>
                    <p className="text-slate-600 mt-1">
                      Checklist: {JSON.stringify(selectedBookingForDetails.return_record.final_condition_checklist)}
                    </p>
                    {selectedBookingForDetails.return_record.discrepancy_notes && (
                      <p className="text-amber-800 font-semibold mt-1">
                        Discrepancy Notes: {selectedBookingForDetails.return_record.discrepancy_notes}
                      </p>
                    )}
                    {selectedBookingForDetails.return_record.missing_parts_flag && (
                      <span className="inline-block mt-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        ⚠ Missing Parts Flagged
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No return record filed yet.</p>
                )}
              </div>

            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
