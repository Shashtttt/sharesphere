import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle2, ShieldAlert, Award, PlayCircle, Key, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNav: (view: string) => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({ isOpen, onClose, onSelectNav }) => {
  const { demoAccounts, user, loginWithDemoAccount } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                ShareSphere — Judge Presentation & Demo Guide
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Hackathon Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Problem Statement: "Unlock Underused Equipment and Spaces" with strict safety, eligibility, and accountability.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          
          {/* Quick Role Switcher Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                1-Click Persona Switcher for Evaluation
              </h3>
              <span className="text-xs text-slate-500">
                Currently logged in as: <strong className="text-indigo-700">{user?.full_name} ({user?.role})</strong>
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              {demoAccounts.map(account => {
                const isCurrent = user?.email === account.email;
                return (
                  <button
                    key={account.email}
                    onClick={async () => {
                      await loginWithDemoAccount(account);
                    }}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{account.name.split(' ')[0]}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                        account.role === 'borrower' ? 'bg-blue-100 text-blue-700' :
                        account.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                        account.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {account.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{account.title}</p>
                    {isCurrent && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-indigo-600">
                        ● Active Persona
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Minute Judge Presentation Script */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-indigo-600" />
              Recommended 3-Minute Walkthrough Flow
            </h3>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">Explainable AI Matching & Resource Discovery</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Click "AI Matcher" in the sidebar. Enter a project goal like <em>"Need to engrave precision acrylic microfluidics"</em>.
                        The engine evaluates equipment capabilities, verifies your safety qualifications, and explains with clear bullet points why each match is recommended.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onSelectNav('ai-matcher'); onClose(); }}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 flex items-center gap-1"
                  >
                    Open AI Matcher <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">Mandatory Safety Gate Enforcement (No Bypasses)</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Switch persona to <strong>Alex Chen (Undergrad)</strong>. Open the <em>Epilog CO2 Laser Cutter</em> and try submitting a booking.
                        The backend strictly prevents uncertified reservation with an explicit notice: <em>"Missing mandatory verified qualification: laser_safety_l2"</em>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const alex = demoAccounts.find(a => a.email === 'borrower2@sharesphere.edu');
                      if (alex) await loginWithDemoAccount(alex);
                      onSelectNav('catalogue');
                      onClose();
                    }}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 flex items-center gap-1"
                  >
                    Test Restriction <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">End-to-End Booking, Handover & Condition Checklists</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Switch to <strong>Dr. Maya Lin (Certified)</strong>. In "My Bookings", view her active bookings. Check-in to the Digital Oscilloscope,
                        record physical condition checklist, submit return with clean condition, and switch to <strong>Prof. Vance (Owner)</strong> to confirm signoff.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onSelectNav('bookings'); onClose(); }}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 flex items-center gap-1"
                  >
                    Open Bookings <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">Incident Management & Discrepancy Dispute Resolution</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Inspect incident <em>INC-2026-0041</em> on the Sony FX6 Cinema Kit (filter scratch & missing tether cable).
                        Switch to <strong>Dr. Sarah Jenkins (Manager)</strong> to review evidence and add resolution decision.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onSelectNav('incidents'); onClose(); }}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded-md hover:bg-rose-100 flex items-center gap-1"
                  >
                    Open Incidents <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      5
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">Append-Only Audit Trail & Accountability</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Every single submission, qualification review, approval, handover check-in, return discrepancy, and resolution is permanently recorded in the immutable audit log with server timestamps.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onSelectNav('audit-trail'); onClose(); }}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100 flex items-center gap-1"
                  >
                    Open Audit Trail <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Credentials Reference */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              Pre-Configured Demo Credentials Reference (Password for all: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">demo1234</code>)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-1.5 font-semibold">User</th>
                    <th className="pb-1.5 font-semibold">Role</th>
                    <th className="pb-1.5 font-semibold">Verified Safety Qualifications</th>
                    <th className="pb-1.5 font-semibold">Key Testing Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-1.5 font-medium">borrower1@sharesphere.edu</td>
                    <td className="py-1.5"><span className="text-blue-700 font-semibold">Borrower</span></td>
                    <td className="py-1.5">Laser Safety L2, Cleanroom ISO 6</td>
                    <td className="py-1.5">Full access borrower; owns active oscilloscope session.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">borrower2@sharesphere.edu</td>
                    <td className="py-1.5"><span className="text-blue-700 font-semibold">Borrower</span></td>
                    <td className="py-1.5">General Safety Only</td>
                    <td className="py-1.5">Test restricted booking block; holds waitlist slot #1.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">owner1@sharesphere.edu</td>
                    <td className="py-1.5"><span className="text-amber-800 font-semibold">Owner</span></td>
                    <td className="py-1.5">Lab Director / Admin</td>
                    <td className="py-1.5">Manage 7 lab resources, approve requests, sign off handovers.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">manager1@sharesphere.edu</td>
                    <td className="py-1.5"><span className="text-purple-700 font-semibold">Manager</span></td>
                    <td className="py-1.5">Dean of Research Infra</td>
                    <td className="py-1.5">Institutional analytics, dispute resolution, verify qualifications.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-medium">admin1@sharesphere.edu</td>
                    <td className="py-1.5"><span className="text-slate-800 font-semibold">Admin</span></td>
                    <td className="py-1.5">System Administrator</td>
                    <td className="py-1.5">Full governance, security audits, platform config.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            ShareSphere MVP • Full REST API Backend + SQLite • Complies with Fair Access & State Machine Integrity
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Start Exploring App
          </button>
        </div>

      </div>
    </div>
  );
};
