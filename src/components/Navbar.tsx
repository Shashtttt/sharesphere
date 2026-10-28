import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { NotificationItem } from '../types';
import {
  Bell, Search, Award, Check, UserCircle, LogOut,
  ChevronDown, ExternalLink, ShieldCheck, Clock, Sparkles, Key
} from 'lucide-react';

interface NavbarProps {
  onOpenDemoModal: () => void;
  onOpenAuthModal?: () => void;
  onSelectNav: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDemoModal,
  onOpenAuthModal,
  onSelectNav,
  searchQuery,
  setSearchQuery,
}) => {
  const { user, logout, demoAccounts, loginWithDemoAccount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifs = () => {
    if (user) {
      api.getNotifications()
        .then(setNotifications)
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    fetchNotifs();
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    await api.markNotificationRead(notif.id);
    fetchNotifs();
    setShowNotifMenu(false);
    if (notif.incident_id) {
      onSelectNav('incidents');
    } else if (notif.booking_id) {
      onSelectNav('bookings');
    } else if (notif.resource_id) {
      onSelectNav('catalogue');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between shadow-xs">
      
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div
          onClick={() => onSelectNav('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">ShareSphere</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                CAMPUS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">Trusted Resource Sharing & Accountability</p>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() && window.location.hash !== '#catalogue') {
                onSelectNav('catalogue');
              }
            }}
            placeholder="Search equipment, labs, 3D printers, microscopes..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        
        {/* Judge Demo Presentation button */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200 rounded-lg hover:from-indigo-100 hover:to-blue-100 transition-all shadow-2xs"
          title="Open Judge Presentation Walkthrough Script"
        >
          <Award className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Judge Demo Guide</span>
        </button>

        {/* 1-Click Role Switcher */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline font-semibold">Persona:</span>
            <span className="capitalize font-bold text-slate-900">{user?.role || 'Guest'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-slate-500 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                Switch Test Persona (1-Click)
              </div>
              <div className="py-1 max-h-72 overflow-y-auto">
                {demoAccounts.map(account => {
                  const isActive = user?.email === account.email;
                  return (
                    <button
                      key={account.email}
                      onClick={async () => {
                        await loginWithDemoAccount(account);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start justify-between hover:bg-slate-50 transition-colors ${
                        isActive ? 'bg-indigo-50/70 border-l-3 border-indigo-600' : ''
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {account.name}
                          <span className={`text-[10px] font-bold px-1 rounded uppercase ${
                            account.role === 'borrower' ? 'bg-blue-100 text-blue-700' :
                            account.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                            account.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {account.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{account.title}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notification Center */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="In-App Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold bg-rose-600 text-white rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">In-App Notifications ({notifications.length})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications right now.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs ${
                        !n.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name || 'Guest'}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                  {user?.role} Access Level
                </span>
              </div>
              <button
                onClick={() => { onSelectNav('qualifications'); setShowUserMenu(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Safety Qualifications
              </button>
              <button
                onClick={() => { onSelectNav('bookings'); setShowUserMenu(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-indigo-600" />
                My Transactions
              </button>
              {onOpenAuthModal && (
                <button
                  onClick={() => { onOpenAuthModal(); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                >
                  <Key className="w-4 h-4 text-amber-600" />
                  Sign In / Register New
                </button>
              )}
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => { logout(); setShowUserMenu(false); }}
                className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
