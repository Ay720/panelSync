import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Globe,
  ArrowRight,
  Download,
  Video,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../services/api';

export const CandidateBooking = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedInterview, setConfirmedInterview] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, [id]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/candidates/${id}/public-slots`);
      if (res.success) {
        setData(res);
        if (res.availableSlots?.length > 0) {
          setSelectedSlot(res.availableSlots[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load scheduling slots');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/candidates/${id}/self-book`, { slot: selectedSlot });
      if (res.success) {
        setConfirmedInterview(res.interview);
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            Finding common available times with hiring panel...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invitation Link Expired or Invalid</h2>
          <p className="text-xs text-slate-500">{error || 'Please contact your talent coordinator for a new link.'}</p>
          <Link to="/login" className="inline-block text-xs font-bold text-brand-600">
            Return to PanelSync Portal
          </Link>
        </Card>
      </div>
    );
  }

  if (confirmedInterview) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Interview Confirmed!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              A calendar invite and confirmation email have been sent to <strong>{data.candidate?.email}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-left space-y-2 text-xs">
            <p className="text-brand-900 font-bold text-sm">{confirmedInterview.title}</p>
            <p className="text-slate-600 flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-brand-600" />
              {new Date(confirmedInterview.scheduledStartTime).toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-slate-600 flex items-center gap-1.5 font-mono font-bold">
              <Clock className="w-4 h-4 text-brand-600" />
              {new Date(confirmedInterview.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {new Date(confirmedInterview.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({data.candidate?.timezone})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={`/api/interviews/${confirmedInterview._id}/ics`}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4 text-brand-600" />
              Add to Calendar (.ics)
            </a>

            <Link
              to={`/room/${confirmedInterview._id}`}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Video className="w-4 h-4" />
              Virtual Room Preview
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-400 items-center justify-center text-white font-bold text-base shadow-md mb-1">
            PS
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Schedule Your Interview
          </h1>
          <p className="text-xs text-slate-500">
            Hi <strong>{data.candidate?.name}</strong>, select a convenient time for your{' '}
            <strong>{data.candidate?.jobRole}</strong> interview loop.
          </p>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
            <Globe className="w-3.5 h-3.5 text-brand-600" />
            <span>Times shown in your zone: <strong>{data.candidate?.timezone}</strong></span>
          </div>
        </div>

        {/* Available Slots Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Available Time Slots ({data.availableSlots?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-400">
              Duration: {data.panel?.duration || 60} mins
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {data.availableSlots?.map((slot, idx) => {
              const isSelected =
                selectedSlot?.startTime === slot.startTime &&
                selectedSlot?.endTime === slot.endTime;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-50/90 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {slot.candidateLocalTime?.formatted || new Date(slot.startTime).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Confirmed panelist availability • No buffer conflicts
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedSlot && (
            <div className="pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                loading={submitting}
                onClick={handleConfirm}
                className="w-full py-2.5 font-bold shadow-md shadow-brand-500/20 text-sm"
                icon={CheckCircle2}
              >
                Confirm This Time Slot
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CandidateBooking;

