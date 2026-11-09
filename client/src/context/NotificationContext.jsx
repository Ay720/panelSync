import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Toast dispatch
  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications?limit=20');
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // Silent error for background notification polling
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // 15s refresh
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast({ type: 'success', title: 'Marked All Read', message: 'All notifications cleared.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to mark all as read.' });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addToast,
        removeToast,
        fetchNotifications,
        markAsRead,
        markAllRead,
      }}
    >
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 text-sm flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-white/95 border-emerald-200 text-slate-800 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-white/95 border-rose-200 text-slate-800 shadow-rose-500/10'
                : toast.type === 'warning'
                ? 'bg-white/95 border-amber-200 text-slate-800 shadow-amber-500/10'
                : 'bg-white/95 border-purple-200 text-slate-800 shadow-purple-500/10'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-500 ring-4 ring-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-rose-500 ring-4 ring-rose-100'
                  : toast.type === 'warning'
                  ? 'bg-amber-500 ring-4 ring-amber-100'
                  : 'bg-purple-600 ring-4 ring-purple-100'
              }`}
            />
            <div className="flex-1 min-w-0">
              {toast.title && <p className="font-semibold text-slate-900 leading-snug">{toast.title}</p>}
              <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

