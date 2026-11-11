import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Video,
  Activity,
  Layers,
  RefreshCw,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import RescheduleModal from '../components/scheduler/RescheduleModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedInterviewForReschedule, setSelectedInterviewForReschedule] = useState(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.success) {
        setStats(res);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load dashboard metrics' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReschedule = (interview) => {
    setSelectedInterviewForReschedule(interview);
    setIsRescheduleModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-brand-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Smart Multi-Panel Scheduling Active</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Welcome back, {user?.name?.split(' ')[0] || 'Claire'}
          </h2>
          <p className="mt-1 text-slate-300 text-xs md:text-sm leading-relaxed">
            Coordinating interview panels across all candidate time zones, interviewer calendars, and buffer requirements.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 hover:text-white"
            onClick={() => navigate('/calendar')}
          >
            Open Calendar
          </Button>
          <Button
            variant="primary"
            icon={Sparkles}
            onClick={() => navigate('/scheduler')}
            className="shadow-lg shadow-brand-500/30"
          >
            Launch Smart Scheduler
          </Button>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5 bg-white rounded-xl border border-slate-200 animate-pulse h-28" />
          ))
        ) : (
          <>
            <Card hover={false} className="p-5 border-l-4 border-l-brand-600">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Interviews
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {stats?.metrics?.totalInterviews || 0}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                <span>Active loops across all roles</span>
              </div>
            </Card>

            <Card hover={false} className="p-5 border-l-4 border-l-purple-500">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Upcoming
              </span>
              <p className="text-2xl font-black text-purple-700 mt-1">
                {stats?.metrics?.upcomingInterviews || 0}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-1">
                <span>Scheduled next 7 days</span>
              </div>
            </Card>

            <Card hover={false} className="p-5 border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Completed
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {stats?.metrics?.completedInterviews || 0}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
                <span>Feedback collected</span>
              </div>
            </Card>

            <Card hover={false} className="p-5 border-l-4 border-l-amber-500">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Rescheduled
              </span>
              <p className="text-2xl font-black text-amber-700 mt-1">
                {stats?.metrics?.rescheduledInterviews || 0}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
                <span>Resolved via Smart Engine</span>
              </div>
            </Card>

            <Card hover={false} className="p-5 border-l-4 border-l-slate-400">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Interviewers
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {stats?.metrics?.totalInterviewers || 0}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
                <span>Calendar-synced panelists</span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Grid: Upcoming Sessions & Candidate Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Interviews List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Upcoming Interview Sessions"
              subtitle="Coordinated multi-panel interviews awaiting execution"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
                  Full Calendar →
                </Button>
              }
            />
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full" count={3} />
                </div>
              ) : stats?.upcomingInterviewsList?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No upcoming interviews scheduled. Use the Smart Scheduler to book one!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats?.upcomingInterviewsList?.map((item) => (
                    <div
                      key={item._id}
                      className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.candidate?.name || 'Candidate'}
                          </span>
                          <Badge variant={item.status}>{item.status}</Badge>
                          <span className="text-xs text-slate-400">• {item.jobRole}</span>
                        </div>

                        <p className="text-xs font-semibold text-brand-700">
                          {item.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(item.scheduledStartTime).toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            @{' '}
                            {new Date(item.scheduledStartTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {item.interviewers?.length || 1} Panelists (
                            {item.interviewers?.map((i) => i.interviewer?.name || 'Panelist').join(', ')}
                            )
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="soft"
                          size="sm"
                          icon={Video}
                          onClick={() => navigate(`/room/${item._id}`)}
                          className="font-bold"
                        >
                          Join Room
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReschedule(item)}
                        >
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Platform Capabilities Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/scheduler')}
              className="p-4 rounded-xl bg-gradient-to-br from-white to-purple-50/40 border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Smart Scheduling Engine</h4>
              <p className="text-xs text-slate-500 mt-1">
                Instantly intersect free intervals across 3+ executive calendars.
              </p>
            </div>

            <div
              onClick={() => navigate('/interviewers')}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Mock & Live Calendar Sync</h4>
              <p className="text-xs text-slate-500 mt-1">
                Google Calendar & Microsoft Outlook bidirectional sync simulator.
              </p>
            </div>

            <div
              onClick={() => navigate('/candidates')}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Candidate Pipeline CRM</h4>
              <p className="text-xs text-slate-500 mt-1">
                Full lifecycle tracking with automated iCalendar (.ics) invitations.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pipeline Stages & Recent Activity */}
        <div className="space-y-6">
          {/* Candidate Pipeline Card */}
          <Card>
            <CardHeader
              title="Candidate Pipeline Stages"
              subtitle="Active candidates across hiring pipeline"
            />
            <CardContent className="space-y-3">
              {[
                { stage: 'Applied', key: 'applied', color: 'bg-slate-400' },
                { stage: 'Screening', key: 'screening', color: 'bg-sky-500' },
                { stage: 'Interview Scheduled', key: 'interview_scheduled', color: 'bg-purple-600' },
                { stage: 'Interview Completed', key: 'interview_completed', color: 'bg-emerald-500' },
                { stage: 'Offer Extended', key: 'offered', color: 'bg-teal-500' },
              ].map((item) => {
                const count = stats?.candidatePipeline?.[item.key] || 0;
                return (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="font-medium text-slate-700">{item.stage}</span>
                    </div>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Audit Activities */}
          <Card>
            <CardHeader
              title="Audit & Activity Log"
              subtitle="Latest scheduling actions and sync logs"
              action={<Activity className="w-4 h-4 text-slate-400" />}
            />
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                {stats?.recentActivities?.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">No activity logged yet</div>
                ) : (
                  stats?.recentActivities?.map((act) => (
                    <div key={act._id} className="p-3.5 hover:bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] font-mono">
                          {act.action}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Target: {act.targetEntity} • User:{' '}
                        <strong>{act.performedBy?.name || 'System Engine'}</strong>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reschedule Modal */}
      {selectedInterviewForReschedule && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => {
            setIsRescheduleModalOpen(false);
            setSelectedInterviewForReschedule(null);
          }}
          interview={selectedInterviewForReschedule}
          onRescheduled={() => fetchDashboardData()}
        />
      )}
    </div>
  );
};

export default Dashboard;

