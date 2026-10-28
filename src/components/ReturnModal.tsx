import React, { useState } from 'react';
import { api } from '../api';
import { Booking } from '../types';
import {
  X, CheckCircle, AlertTriangle, AlertCircle, Camera, CheckSquare
} from 'lucide-react';

interface ReturnModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [checklist, setChecklist] = useState({
    item_cleaned: true,
    all_cables_returned: true,
    no_new_damage: true,
    properly_shutdown: true,
  });
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [missingParts, setMissingParts] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitReturn(booking.id, {
        final_condition_checklist: checklist,
        discrepancy_notes: discrepancyNotes.trim() || undefined,
        missing_parts_flag: missingParts,
        photo_url: photoUrl.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit return');
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
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-sm">Return & Condition Inspection</h2>
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
              Scheduled Return: {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              Final Equipment Return Checklist
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.item_cleaned}
                  onChange={(e) => setChecklist({ ...checklist, item_cleaned: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Equipment & workspace cleaned and restored to standard</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.all_cables_returned}
                  onChange={(e) => setChecklist({ ...checklist, all_cables_returned: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>All cables, power adapters, and accessories returned</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.no_new_damage}
                  onChange={(e) => setChecklist({ ...checklist, no_new_damage: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>No new wear, scratches, or component damage</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={checklist.properly_shutdown}
                  onChange={(e) => setChecklist({ ...checklist, properly_shutdown: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Safely shut down according to operating procedures</span>
              </label>
            </div>
          </div>

          {/* Missing parts flag */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={missingParts}
                onChange={(e) => setMissingParts(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span className="font-bold text-amber-900">
                Flag missing items, accessories, or suspected component damage
              </span>
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Discrepancy / Inspection Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={discrepancyNotes}
              onChange={(e) => setDiscrepancyNotes(e.target.value)}
              placeholder="Record any issues, notes for next borrower, or equipment feedback..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
            ></textarea>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              Return Condition Photo URL (Optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/return-photo.jpg"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Handover recorded to append-only audit trail</span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Return Report"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
