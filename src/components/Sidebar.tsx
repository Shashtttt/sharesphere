import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Layers, Sparkles, CalendarClock,
  Briefcase, ShieldCheck, AlertTriangle, ListOrdered,
  ScrollText, ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectNav: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenDemoGuide: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectNav,
  isCollapsed,
  setIsCollapsed,
  onOpenDemoGuide,
}) => {
  const { user } = useAuth();
  const role = user?.role || 'borrower';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
    {
      id: 'catalogue',
      label: 'Resource Catalogue',
      icon: Layers,
      badge: '7 Assets',
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
    {
      id: 'ai-matcher',
      label: 'AI Equipment Matcher',
      icon: Sparkles,
      badge: 'AI Smart',
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
    {
      id: 'bookings',
      label: role === 'owner' ? 'Approvals & Bookings' : 'My Bookings',
      icon: CalendarClock,
      badge: null,
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
    {
      id: 'owner-management',
      label: 'Manage Inventory',
      icon: Briefcase,
      badge: null,
      roles: ['owner', 'manager', 'admin'],
    },
    {
      id: 'qualifications',
      label: 'Safety Qualifications',
      icon: ShieldCheck,
      badge: null,
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
    {
      id: 'incidents',
      label: 'Incident Management',
      icon: AlertTriangle,
      badge: '1 Active',
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
    {
      id: 'waiting-list',
      label: 'Waiting Lists',
      icon: ListOrdered,
      badge: null,
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
    {
      id: 'audit-trail',
      label: 'Immutable Audit Trail',
      icon: ScrollText,
      badge: 'Audit',
      roles: ['borrower', 'owner', 'manager', 'admin'],
    },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 select-none shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Institution Info */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="overflow-hidden">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Institutional Hub</div>
            <div className="text-sm font-bold text-white truncate">Apex Institute of Tech</div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Judge Guide Trigger in Sidebar */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onOpenDemoGuide}
          className={`w-full flex items-center space-x-2 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          {!isCollapsed && (
            <div className="text-left">
              <div className="font-semibold text-white">Judge Demo Tour</div>
              <div className="text-[10px] text-slate-400">3-min scripted flow</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
