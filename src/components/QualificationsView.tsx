import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Qualification, UserQualification } from '../types';
import {
  ShieldCheck, ShieldAlert, Award, Clock, CheckCircle2,
  AlertCircle, Plus, FileText, Check, X
} from 'lucide-react';

export const QualificationsView: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'borrower';

  const [allQualifications, setAllQualifications] = useState<Qualification[]>([]);
  const [myQualifications, setMyQualifications] = useState<UserQualification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [docRef, setDocRef] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      api.getQualifications().catch(() => []),
      api.getMyQualifications().catch(() => []),
    ])
      .then(([quals, myQuals]) => {
        setAllQualifications(quals);
        setMyQualifications(myQuals);
        if (quals.length > 0 && !selectedCode) {
          setSelectedCode(quals[0].code);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode) return;
    try {
      await api.requestQualification(selectedCode, docRef.trim() || undefined);
      setMessage("Verification request submitted for institutional manager review.");
      setIsRequestModalOpen(false);
      setDocRef('');
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to submit request.");
    }
  };

  const handleVerify = async (userQualId: number, action: 'approve' | 'reject') => {
    try {
      await api.verifyQualification(userQualId, action, `Reviewed by ${user?.full_name}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to verify qualification.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Safety Qualifications & Training Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified institutional safety certifications required to unlock hazardous fabrication tools, laser cutters, and cleanroom instruments.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Request Qualification Verification
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* User's Verified Certifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Your Safety Certifications & Status ({user?.full_name})
        </h2>

        {isLoading ? (
          <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
        ) : myQualifications.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-slate-500 text-xs">No qualifications registered in your profile yet.</p>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="mt-2 text-indigo-600 font-bold text-xs hover:underline"
            >
              Request verification now →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myQualifications.map(uq => (
              <div
                key={uq.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-slate-900 text-xs">{uq.qualification.name}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    uq.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                    uq.status === 'pending_verification' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {uq.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">{uq.qualification.description}</p>

                <div className="text-[10px] text-slate-500 space-y-0.5 pt-2 border-t border-slate-200">
                  <div>Issuing Body: <strong>{uq.qualification.issuing_body}</strong></div>
                  {uq.document_ref && <div>Document Ref: <code className="bg-white px-1 rounded">{uq.document_ref}</code></div>}
                  {uq.expires_at && (
                    <div>Valid Until: {new Date(uq.expires_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  )}
                  {uq.verification_notes && (
                    <div className="text-slate-600 italic">Notes: {uq.verification_notes}</div>
                  )}
                </div>

                {/* Manager / Admin verification controls */}
                {(role === 'manager' || role === 'admin') && uq.status === 'pending_verification' && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleVerify(uq.id, 'approve')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Approve Certification
                    </button>
                    <button
                      onClick={() => handleVerify(uq.id, 'reject')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Institutional Safety Qualifications Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          Campus Safety Training Catalog
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allQualifications.map(q => (
            <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {q.code}
              </span>
              <h3 className="font-bold text-slate-900 text-xs">{q.name}</h3>
              <p className="text-[11px] text-slate-600">{q.description}</p>
              <div className="text-[10px] text-slate-400 pt-1">
                Authorized by: {q.issuing_body} ({q.validity_days} days validity)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Verification Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Submit Qualification For Review</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRequestVerification} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Qualification</label>
                <select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {allQualifications.map(q => (
                    <option key={q.code} value={q.code}>{q.name} ({q.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Training Certificate Reference / ID</label>
                <input
                  type="text"
                  value={docRef}
                  onChange={(e) => setDocRef(e.target.value)}
                  placeholder="e.g. CERT-EHS-2026-9921.pdf"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-[11px]">
                Note: In accordance with institutional safety governance, submission does not automatically grant authorization. A designated safety manager will inspect your submitted training credentials.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit For Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
