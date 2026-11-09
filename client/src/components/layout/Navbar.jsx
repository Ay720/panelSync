import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../ui/Button';

export const Navbar = () => {
  const { user, demoLogin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/scheduler':
        return 'Smart Multi-Panel Scheduler';
      case '/calendar':
        return 'Interview Calendar';
      case '/candidates':
        return 'Candidate Pipeline';
      case '/interviewers':
        return 'Interviewer Directory & Availability';
      case '/panels':
        return 'Interview Panels';
      case '/notifications':
        return 'Notification Center';
      case '/analytics':
        return 'Scheduling Intelligence & Analytics';
      case '/settings':
        return 'System Settings & Integrations';
      default:
        return 'PanelSync';
    }
  };

  const handleSwitchRole = async (role) => {
    setShowPersonaMenu(false);
    await demoLogin(role);
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Title & Active Timezone */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span>Your Zone: <strong>{user?.timezone || 'America/New_York'}</strong></span>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        {/* Quick Persona Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="capitalize">{user?.role || 'HR'} View</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200/80 p-1.5 z-50 text-xs animate-in fade-in duration-150">
              <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Test Persona
              </div>
              <button
                onClick={() => handleSwitchRole('admin')}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center justify-between hover:bg-slate-100 ${
                  user?.role === 'admin' ? 'bg-purple-50 text-brand-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <p className="font-semibold">Alexander Cross</p>
                  <p className="text-[10px] text-slate-400">Admin</p>
                </div>
                {user?.role === 'admin' && <span className="text-brand-600">✓</span>}
              </button>
              <button
                onClick={() => handleSwitchRole('hr')}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center justify-between hover:bg-slate-100 ${
                  user?.role === 'hr' ? 'bg-purple-50 text-brand-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <p className="font-semibold">Claire Beauchamp</p>
                  <p className="text-[10px] text-slate-400">HR / Recruiter</p>
                </div>
                {user?.role === 'hr' && <span className="text-brand-600">✓</span>}
              </button>
              <button
                onClick={() => handleSwitchRole('interviewer')}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center justify-between hover:bg-slate-100 ${
                  user?.role === 'interviewer' ? 'bg-purple-50 text-brand-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <p className="font-semibold">Dr. Sarah Chen</p>
                  <p className="text-[10px] text-slate-400">Interviewer</p>
                </div>
                {user?.role === 'interviewer' && <span className="text-brand-600">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/80 p-0 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900 text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No recent notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((item) => (
                    <div
                      key={item._id}
                      onClick={() => markAsRead(item._id)}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50/80 text-left ${
                        !item.isRead ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA: Schedule Interview */}
        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={() => navigate('/scheduler')}
          className="shadow-sm"
        >
          Schedule Interview
        </Button>
      </div>
    </header>
  );
};

export default Navbar;

