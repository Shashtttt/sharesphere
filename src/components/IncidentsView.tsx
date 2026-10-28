import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Incident, Resource } from '../types';
import {
  AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2,
  Clock, Plus, FileText, ChevronRight, X
} from 'lucide-react';

export const IncidentsView: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'borrower';

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedIncidentForResolution, setSelectedIncidentForResolution] = useState<Incident | null>(null);

  // New incident form state
  const [resourceId, setResourceId] = useState<number | ''>('');
  const [incidentType, setIncidentType] = useState<string>('damage');
  const [severity, setSeverity] = useState<string>('medium');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Resolution form state
  const [resolutionStatus, setResolutionStatus] = useState<string>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      api.getIncidents().catch(() => []),
      api.getResources().catch(() => []),
    ])
      .then(([incData, resData]) => {
        setIncidents(incData);
        setResources(resData);
        if (resData.length > 0 && !resourceId) {
          setResourceId(resData[0].id);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId) return;
    try {
      await api.createIncident({
        resource_id: Number(resourceId),
        incident_type: incidentType,
        severity,
        title: title.trim(),
        description: description.trim(),
      });
      setIsReportModalOpen(false);
      setTitle('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit incident report');
    }
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentForResolution) return;
    try {
      await api.updateIncident(selectedIncidentForResolution.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes.trim(),
      });
      setSelectedIncidentForResolution(null);
      setResolutionNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update incident');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Incident Management & Dispute Resolution
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent reporting for damaged equipment, late returns, missing parts, and safety protocol violations.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          File Incident Report
        </button>
      </div>

      {/* Incidents List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-slate-700 font-bold text-sm">No Open Incidents</p>
          <p className="text-slate-400 text-xs mt-0.5">All equipment handovers and condition inspections are verified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map(inc => (
            <div
              key={inc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">{inc.incident_number}</span>
                  
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    inc.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                    inc.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    inc.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {inc.severity} Severity
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    inc.status === 'open' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    inc.status === 'under_review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    inc.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {inc.status.replace(/_/g, ' ')}
                  </span>

                  <span className="text-[10px] text-slate-500">
                    Reported on {new Date(inc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{inc.title}</h3>
                
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {inc.description}
                </p>

                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-4 pt-1">
                  <span>Resource: <strong>{inc.resource?.title}</strong></span>
                  <span>•</span>
                  <span>Type: <strong className="capitalize">{inc.incident_type.replace(/_/g, ' ')}</strong></span>
                  <span>•</span>
                  <span>Reported by: <strong>{inc.reporter?.full_name}</strong></span>
                </div>

                {inc.resolution_notes && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <span className="font-bold block">Institutional Decision & Resolution:</span>
                    <span className="mt-0.5 block">{inc.resolution_notes}</span>
                    {inc.resolved_at && (
                      <span className="text-[10px] text-emerald-700 block mt-1">
                        Resolved: {new Date(inc.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action column for Manager or Owner */}
              {(role === 'manager' || role === 'owner' || role === 'admin') && inc.status !== 'resolved' && (
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => {
                      setSelectedIncidentForResolution(inc);
                      setResolutionNotes(inc.resolution_notes || '');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Review & Arbitrate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Incident Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                File Incident or Discrepancy Report
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Related Resource</label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.title} ({r.building})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Incident Type</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="damage">Physical Damage</option>
                    <option value="missing_item">Missing Item / Parts</option>
                    <option value="late_return">Late Return</option>
                    <option value="unsafe_use">Unsafe Usage Protocol</option>
                    <option value="access_issue">Access / Lock Issue</option>
                    <option value="scheduling_conflict">Scheduling Conflict</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="low">Low (Cosmetic/Minor Delay)</option>
                    <option value="medium">Medium (Component Wear/Missing Cable)</option>
                    <option value="high">High (Equipment Inoperable)</option>
                    <option value="critical">Critical (Safety Hazard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title / Summary</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scratched filter ring and missing tether cable"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Evidence Details</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise inspection notes, timestamps, and observed discrepancies..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Incident Dialog for Manager/Owner */}
      {selectedIncidentForResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Review & Arbitrate Dispute</h3>
                <span className="text-[11px] text-slate-500">Incident #{selectedIncidentForResolution.incident_number}</span>
              </div>
              <button onClick={() => setSelectedIncidentForResolution(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleResolveIncident} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">{selectedIncidentForResolution.title}</span>
                <p className="text-slate-600">{selectedIncidentForResolution.description}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Set Decision Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                >
                  <option value="under_review">Keep Under Review</option>
                  <option value="awaiting_information">Awaiting Information from Borrower</option>
                  <option value="resolved">Resolved (Approved Repair / Replaced)</option>
                  <option value="dismissed">Dismissed (Normal Wear / Inconsequential)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Resolution Decision & Reasoning</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record justification, repair costs, or mutual agreement notes..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncidentForResolution(null)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Record Decision & Notify Parties
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
