import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Filter,
  RefreshCw,
  Video,
  Clock,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Download,
} from 'lucide-react';
import CalendarView from '../components/calendar/CalendarView';
import RescheduleModal from '../components/scheduler/RescheduleModal';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

export const CalendarPage = () => {
  const { addToast } = useNotification();
  const [interviews, setInterviews] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Selected event inspection
  const [inspectedInterview, setInspectedInterview] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Cancellation state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Schedule coordination change');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [selectedInterviewerId, selectedStatus]);

  const fetchInitial = async () => {
    try {
      const invRes = await api.get('/interviewers');
      if (invRes.success) setInterviewers(invRes.interviewers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      let url = '/calendar/feed?viewMode=all';
      if (selectedInterviewerId) url += `&interviewerId=${selectedInterviewerId}`;

      const res = await api.get(url);
      if (res.success) {
        let filtered = res.interviews || [];
        if (selectedStatus !== 'all') {
          filtered = filtered.filter((i) => i.status === selectedStatus);
        }
        setInterviews(filtered);
        setCalendarEvents(res.calendarEvents || []);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Could not load calendar feed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/calendar/sync-all');
      if (res.success) {
        addToast({ type: 'success', title: 'Calendar Synced', message: res.message });
        await fetchFeed();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Sync Failed', message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleEventClick = (interview) => {
    setInspectedInterview(interview);
    setIsDetailModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!inspectedInterview) return;
    setCancelling(true);
    try {
      const res = await api.post(`/interviews/${inspectedInterview._id}/cancel`, {
        reason: cancelReason,
      });
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Interview Cancelled',
          message: 'Calendar blocks released and cancellation notices emailed.',
        });
        setIsCancelModalOpen(false);
        setIsDetailModalOpen(false);
        await fetchFeed();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Cancellation Error', message: err.message });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Interview Calendar
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Real-time schedule visualization with Google Calendar & Outlook integration.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              value={selectedInterviewerId}
              onChange={(e) => setSelectedInterviewerId(e.target.value)}
            >
              <option value="">All Interviewers</option>
              {interviewers.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-36">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Calendar Component */}
      <CalendarView
        interviews={interviews}
        calendarEvents={calendarEvents}
        onEventClick={handleEventClick}
        onSyncAll={handleSyncAll}
        syncing={syncing}
      />

      {/* Inspection Modal */}
      {inspectedInterview && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={inspectedInterview.title}
          subtitle={`Interview with ${inspectedInterview.candidate?.name || 'Candidate'}`}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                {inspectedInterview.status !== 'cancelled' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setIsCancelModalOpen(true);
                    }}
                  >
                    Cancel Session
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/interviews/${inspectedInterview._id}/ics`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> .ics
                </a>
                <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
                {inspectedInterview.status !== 'cancelled' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setIsRescheduleOpen(true);
                    }}
                  >
                    Reschedule
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Status & Round */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <Badge variant={inspectedInterview.status}>{inspectedInterview.status}</Badge>
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  {inspectedInterview.roundType} Round
                </span>
              </div>
              <span className="font-mono text-slate-600">
                {inspectedInterview.durationMinutes} Minutes
              </span>
            </div>

            {/* Time Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Candidate Time ({inspectedInterview.timezone || 'America/New_York'})
                </span>
                <p className="font-bold text-slate-900 mt-1">
                  {new Date(inspectedInterview.scheduledStartTime).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="font-mono text-brand-700 font-bold mt-0.5">
                  {new Date(inspectedInterview.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(inspectedInterview.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Candidate Profile
                </span>
                <p className="font-bold text-slate-900 mt-1">
                  {inspectedInterview.candidate?.name}
                </p>
                <p className="text-slate-500 mt-0.5">{inspectedInterview.candidate?.email}</p>
              </div>
            </div>

            {/* Interviewer Panelists */}
            <div>
              <p className="font-bold text-slate-700 mb-2">Assigned Interviewer Panel:</p>
              <div className="space-y-1.5">
                {inspectedInterview.interviewers?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.interviewer?.name}</p>
                      <p className="text-[10px] text-slate-500">{item.interviewer?.title} • {item.interviewer?.timezone}</p>
                    </div>
                    <Badge variant="success">Confirmed</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Virtual Meeting Room Link */}
            {inspectedInterview.meetingLink && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-brand-600" />
                  <span className="font-medium text-brand-900 truncate max-w-xs font-mono">
                    {inspectedInterview.meetingLink}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Video}
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigate(`/room/${inspectedInterview._id}`);
                  }}
                >
                  Enter Room
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {inspectedInterview && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Interview Session"
          subtitle="This will release interviewer calendar blocks and send notification emails."
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
                Keep Session
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={cancelling}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <Input
              label="Cancellation Reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Candidate withdrew, position filled, etc."
            />
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {inspectedInterview && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          interview={inspectedInterview}
          onRescheduled={async () => {
            await fetchFeed();
          }}
        />
      )}
    </div>
  );
};

export default CalendarPage;

