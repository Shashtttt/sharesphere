import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Resource, UserQualification } from '../types';
import {
  X, MapPin, Calendar, Clock, ShieldAlert, ShieldCheck,
  CheckCircle, AlertTriangle, Users, Sparkles, AlertCircle, FileText
} from 'lucide-react';

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  onBookingCreated,
}) => {
  const { user } = useAuth();
  const [userQuals, setUserQuals] = useState<UserQualification[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  
  // Booking Form State
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startHour, setStartHour] = useState<string>("10:00");
  const [endHour, setEndHour] = useState<string>("12:00");
  const [purpose, setPurpose] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && resource) {
      setSubmitError(null);
      setSubmitSuccess(null);
      // Fetch user qualifications
      api.getMyQualifications().then(setUserQuals).catch(() => []);
      // Fetch resource availability & booked slots
      api.getResourceAvailability(resource.id).then(setAvailability).catch(() => null);
    }
  }, [isOpen, resource, user]);

  if (!isOpen || !resource) return null;

  // Determine user qualification status
  const verifiedCodes = new Set(
    userQuals.filter(uq => uq.status === 'verified').map(uq => uq.qualification.code)
  );
  const pendingCodes = new Set(
    userQuals.filter(uq => uq.status === 'pending_verification').map(uq => uq.qualification.code)
  );

  const missingRequirements = resource.required_qualifications.filter(req => !verifiedCodes.has(req));
  const hasPendingReqs = missingRequirements.some(req => pendingCodes.has(req));
  const isEligible = missingRequirements.length === 0;

  // Calculate requested duration in hours
  const startDateTime = new Date(`${date}T${startHour}:00`);
  const endDateTime = new Date(`${date}T${endHour}:00`);
  const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

  // Check if requested time has conflict with existing booked slots
  const hasConflict = availability?.booked_slots?.some((slot: any) => {
    const slotStart = new Date(slot.start_time);
    const slotEnd = new Date(slot.end_time);
    return (
      (startDateTime <= slotStart && endDateTime > slotStart) ||
      (startDateTime < slotEnd && endDateTime >= slotEnd) ||
      (startDateTime >= slotStart && endDateTime <= slotEnd)
    );
  });

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) {
      setSubmitError("You cannot submit a reservation request without fulfilling all mandatory safety qualifications.");
      return;
    }
    if (durationHours <= 0) {
      setSubmitError("End time must be after start time.");
      return;
    }
    if (durationHours < resource.min_duration_hours) {
      setSubmitError(`Minimum booking duration is ${resource.min_duration_hours} hour(s).`);
      return;
    }
    if (durationHours > resource.max_duration_hours) {
      setSubmitError(`Maximum booking duration is ${resource.max_duration_hours} hour(s).`);
      return;
    }
    if (!purpose.trim() || purpose.trim().length < 5) {
      setSubmitError("Please provide a descriptive purpose for this reservation (min 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.createBooking({
        resource_id: resource.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        purpose: purpose.trim(),
      });

      if (res.status === 'waitlisted') {
        setSubmitSuccess(`Slot is currently occupied. Booking created on the Waitlist at Queue Position #${res.queue_position}!`);
      } else if (res.status === 'approved') {
        setSubmitSuccess("Booking automatically approved for instant access!");
      } else {
        setSubmitSuccess(`Booking #${res.booking_code} submitted successfully for owner review!`);
      }
      setTimeout(() => {
        onBookingCreated();
        onClose();
      }, 1800);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0">
          <img
            src={resource.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758'}
            alt={resource.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                {resource.category}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                resource.condition_status === 'excellent' ? 'bg-emerald-500 text-white' :
                resource.condition_status === 'good' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {resource.condition_status.toUpperCase()}
              </span>
              {resource.approval_required && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Approval Required
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight">{resource.title}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-300 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {resource.building} • {resource.room_location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {resource.min_duration_hours}h - {resource.max_duration_hours}h max per booking
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Eligibility Banner */}
          {resource.required_qualifications.length > 0 && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              isEligible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {isEligible ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold text-sm">
                  {isEligible ? "Safety Verification Complete" : "Mandatory Safety Gate — Action Required"}
                </div>
                <div className="mt-1">
                  {isEligible ? (
                    <p className="text-emerald-800">
                      ✓ You have verified certifications for all required safety modules ({resource.required_qualifications.join(', ')}). You may submit a reservation request.
                    </p>
                  ) : (
                    <div>
                      <p className="text-rose-800">
                        This high-impact asset requires verified certification: <strong className="font-semibold">{missingRequirements.join(', ')}</strong>.
                        Your current profile does not meet the safety requirements.
                      </p>
                      {hasPendingReqs && (
                        <p className="text-amber-800 font-semibold mt-1">
                          ⌛ Your qualification verification is currently pending review by an institutional manager.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description & Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Equipment Overview</h3>
                <p className="text-slate-600 leading-relaxed">{resource.description}</p>
              </div>

              {resource.usage_rules && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Usage & Safety Rules
                  </h4>
                  <p className="text-slate-600">{resource.usage_rules}</p>
                </div>
              )}

              <div className="flex items-center gap-6 text-slate-600 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Security Deposit</span>
                  <span className="font-bold text-slate-900">${resource.security_deposit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Weekly Frequency Limit</span>
                  <span className="font-bold text-slate-900">Max {resource.max_booking_frequency_per_week} times/week</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operating Hours</span>
                  <span className="font-bold text-slate-900">{resource.availability_schedule?.hours || "08:00 - 20:00"}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Reservation Request Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Reserve this Resource
              </h3>
              <p className="text-slate-500 text-[11px] mb-4">
                Availability is protected by database conflict checks and fair allocation quotas.
              </p>

              {submitError && (
                <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reservation Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Calculated Duration: <strong>{durationHours > 0 ? `${durationHours} hour(s)` : 'Invalid'}</strong></span>
                  {hasConflict && (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Overlaps slot → Will Waitlist
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intended Purpose & Project Scope</label>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe your research, fabrication, or experimental project details..."
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isEligible}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all flex items-center justify-center gap-2 ${
                    !isEligible
                      ? 'bg-slate-400 cursor-not-allowed opacity-80'
                      : hasConflict
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? (
                    "Processing Request..."
                  ) : !isEligible ? (
                    "Missing Mandatory Safety Certification"
                  ) : hasConflict ? (
                    "Request Placement on Waitlist Queue"
                  ) : (
                    "Submit Booking Request"
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
