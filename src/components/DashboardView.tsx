import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Resource } from '../types';
import {
  CalendarClock, Clock, CheckCircle, AlertCircle, AlertTriangle,
  ArrowRight, Sparkles, ShieldCheck, ChevronRight, BarChart3,
  Users, Activity, PlusCircle, Check
} from 'lucide-react';

interface DashboardViewProps {
  onSelectNav: (view: string) => void;
  onOpenResourceDetail: (resource: Resource) => void;
  onOpenCreateResource: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectNav,
  onOpenResourceDetail,
  onOpenCreateResource,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getDashboardStats().catch(() => null),
      api.getResources().catch(() => []),
    ])
      .then(([statsData, resData]) => {
        setStats(statsData);
        setFeaturedResources(resData.slice(0, 4));
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const role = user?.role || 'borrower';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {role.toUpperCase()} CONSOLE • APEX RESEARCH CLUSTER
          </div>
          <h1 className="text-2xl font-black mt-1 tracking-tight text-white">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {role === 'borrower' && "Explore verified college labs, electronics benches, and fabrication tools. All bookings enforce safety certifications and condition accountability."}
            {role === 'owner' && "Review incoming booking applications, verify equipment handovers, and review safety compliance across your laboratory assets."}
            {(role === 'manager' || role === 'admin') && "Oversee research infrastructure utilization, evaluate fair-allocation policies, arbitrate condition disputes, and inspect system audit records."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === 'borrower' && (
            <button
              onClick={() => onSelectNav('ai-matcher')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              AI Match Equipment
            </button>
          )}
          {role === 'owner' && (
            <button
              onClick={onOpenCreateResource}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              List New Asset
            </button>
          )}
          <button
            onClick={() => onSelectNav('catalogue')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1"
          >
            Browse Catalogue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {role === 'borrower' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Active In-Use</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.active_bookings ?? 0}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Checked-in sessions</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Upcoming Approved</span>
              <CalendarClock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.upcoming_reservations ?? 0}</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1">Ready for check-in</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.pending_approvals ?? 0}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting owner signoff</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Verified Qualifications</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.verified_qualifications ?? 0}</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Valid safety certifications</div>
          </div>
        </div>
      )}

      {role === 'owner' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Listed Assets</span>
              <BarChart3 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.resources_listed ?? 0}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Under your management</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Currently Borrowed</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.currently_borrowed ?? 0}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Active live handovers</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.pending_requests ?? 0}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Action required</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Open Incidents</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.open_incidents ?? 0}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Damage / discrepancy reports</div>
          </div>
        </div>
      )}

      {(role === 'manager' || role === 'admin') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Institutional Assets</span>
              <BarChart3 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.total_resources ?? 0}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Across campus facilities</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Active In-Use</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.active_in_use ?? 0}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Live equipment utilization</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Completed Transfers</span>
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.total_completed ?? 0}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">Historical verified handovers</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Unresolved Incidents</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.unresolved_incidents ?? 0}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Awaiting dispute resolution</div>
          </div>
        </div>
      )}

      {/* Main Grid: Activity Timeline + Category Distribution / Recommended */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Activity / Bookings Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {role === 'owner' ? 'Recent Incoming Requests' : 'Your Recent Booking Timeline'}
              </h2>
              <p className="text-xs text-slate-500">Live transaction records tracked by state machine</p>
            </div>
            <button
              onClick={() => onSelectNav('bookings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2">Booking Code</th>
                  <th className="pb-2">Resource</th>
                  <th className="pb-2">Time Slot</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(role === 'owner' ? stats?.recent_requests : stats?.recent_bookings)?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No active bookings recorded yet.
                    </td>
                  </tr>
                ) : (
                  (role === 'owner' ? stats?.recent_requests : stats?.recent_bookings)?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900">{b.code}</td>
                      <td className="py-3 font-semibold text-slate-800 max-w-xs truncate">{b.resource_title}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(b.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'approved' ? 'bg-indigo-100 text-indigo-700' :
                          b.status === 'checked_in' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          b.status === 'waitlisted' ? 'bg-amber-100 text-amber-700' :
                          b.status === 'incident_under_review' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectNav('bookings')}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Institutional Category Utilization or Fast Actions */}
        <div className="space-y-6">
          
          {/* Quick Explainable AI Callout */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Explainable AI Matcher
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Need equipment for a specific research project?</h3>
            <p className="text-xs text-slate-600 mt-1">
              Input your experimental requirements, and our explainable matching assistant verifies your safety certs and returns top-matched assets with bulleted justifications.
            </p>
            <button
              onClick={() => onSelectNav('ai-matcher')}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Launch Matcher Assistant
            </button>
          </div>

          {/* Fair Allocation Policy Notice */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Fair Allocation Policy Active
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 mt-3">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>Rolling 7-day quota prevents resource hoarding.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>FIFO waitlist queue with automatic notification on cancellation.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>Mandatory condition signoffs at both check-in and checkout.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Featured Underused Assets Catalogue Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Featured Institutional Assets & Laboratories</h2>
            <p className="text-xs text-slate-500">Available for verified students, researchers, and campus innovators</p>
          </div>
          <button
            onClick={() => onSelectNav('catalogue')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Explore all 7 assets <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredResources.map(res => (
            <div
              key={res.id}
              onClick={() => onOpenResourceDetail(res)}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
            >
              <div className="relative h-36 bg-slate-100 overflow-hidden">
                <img
                  src={res.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758'}
                  alt={res.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                    {res.category}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    res.condition_status === 'excellent' ? 'bg-emerald-500 text-white' :
                    res.condition_status === 'good' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {res.condition_status}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {res.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{res.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[120px]">{res.building}</span>
                  <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    Reserve →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
