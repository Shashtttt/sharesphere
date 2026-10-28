import React, { useState } from 'react';
import { api } from '../api';
import { Booking } from '../types';
import {
  X, CheckCircle2, ShieldCheck, Camera, FileText, AlertCircle
} from 'lucide-react';

interface CheckInModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [checklist, setChecklist] = useState({
    cleanliness_verified: true,
    accessories_intact: true,
    no_visible_damage: true,
    operational_test_passed: true,
  });
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitCheckIn(booking.id, {
        condition_checklist: checklist,
        notes: notes.trim() || undefined,
        photo_url: photoUrl.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-sm">Handover Check-In Verification</h2>
              <p className="text-[11px] text-slate-300">Booking #{booking.booking_code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 block">{booking.resource?.title}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Location: {booking.resource?.building} • {booking.resource?.room_location}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Condition Checklist */}
          <div>
            <label className="font-bold text-slate-900 block mb-2">
              Initial Operational Condition Checklist (Recorded to Audit Trail)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.cleanliness_verified}
                  onChange={(e) => setChecklist({ ...checklist, cleanliness_verified: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Cleanliness & calibration zero-point verified</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.accessories_intact}
                  onChange={(e) => setChecklist({ ...checklist, accessories_intact: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>All cables, power supplies, and lens accessories present</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.no_visible_damage}
                  onChange={(e) => setChecklist({ ...checklist, no_visible_damage: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>No visible physical damage or impact marks</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.operational_test_passed}
                  onChange={(e) => setChecklist({ ...checklist, operational_test_passed: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Power-on test passed; operating normally</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Condition Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Probe 2 impedance tested, small scratch on outer casing noted..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
            ></textarea>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              Handover Photo / Attachment URL (Optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/handover-photo.jpg"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Server timestamp will be generated upon confirmation</span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? "Confirming..." : "Confirm & Check In"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
