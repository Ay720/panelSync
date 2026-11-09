import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCheck,
  Video,
  ArrowRight,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

export const Notifications = () => {
  const { markAsRead, markAllRead } = useNotification();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let url = '/notifications?limit=50';
      if (filter === 'unread') url += '&isRead=false';
      const res = await api.get(url);
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.data?.interviewId) {
      navigate('/calendar');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'interview_scheduled':
        return <Calendar className="w-5 h-5 text-brand-600" />;
      case 'interview_rescheduled':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'interview_cancelled':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'conflict_detected':
        return <AlertTriangle className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-brand-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Notification Center
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Audited dispatch logs for invitations, schedule shifts, cancellations, and calendar alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'unread' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Unread
            </button>
          </div>

          <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notifications Card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">
              <Skeleton className="h-16 w-full" count={4} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No notifications to display.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 md:p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                    !notif.isRead ? 'bg-purple-50/30' : ''
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>Recipient: <strong>{notif.recipientEmail}</strong></span>
                      <span>• Status: <strong className="text-emerald-600 capitalize">{notif.deliveryStatus}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;

