import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export const RescheduleModal = ({ isOpen, onClose, interview, onRescheduled }) => {
  const { addToast } = useNotification();
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alternativeSlots, setAlternativeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('Executive schedule conflict / urgent request');
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (isOpen && interview) {
      loadRescheduleData();
    }
  }, [isOpen, interview]);

  const loadRescheduleData = async () => {
    setLoadingOptions(true);
    try {
      // 1. Check current conflicts
      const conflictRes = await api.get(`/interviews/${interview._id}/conflicts`);
      if (conflictRes.hasConflict) {
        setConflicts(conflictRes.conflicts);
      } else {
        setConflicts([]);
      }

      // 2. Fetch intelligent alternative slots
      const altRes = await api.get(`/interviews/${interview._id}/reschedule-options?daysForward=10`);
      if (altRes.success) {
        setAlternativeSlots(altRes.alternativeSlots || []);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSlot) {
      addToast({ type: 'warning', title: 'Selection Required', message: 'Please select a new time slot.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/interviews/${interview._id}/reschedule`, {
        newStartTime: selectedSlot.startTime,
        newEndTime: selectedSlot.endTime,
        reason,
      });

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Interview Rescheduled',
          message: 'Calendar invites and notifications updated for candidate & interviewers.',
        });
        if (onRescheduled) onRescheduled(res.interview);
        onClose();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Reschedule Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!interview) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Intelligent Interview Rescheduling"
      subtitle={`Resolve conflict and coordinate new slot for ${interview.candidate?.name || 'Candidate'}`}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmReschedule}
            loading={submitting}
            disabled={!selectedSlot}
            icon={Check}
          >
            Confirm & Notify Participants
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Current Schedule Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Current Session
            </span>
            <p className="font-bold text-slate-900 text-sm">{interview.title}</p>
            <p className="text-slate-600 mt-0.5">
              Candidate: <strong>{interview.candidate?.name}</strong> ({interview.jobRole})
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Scheduled Time
            </span>
            <p className="font-bold text-slate-800">
              {new Date(interview.scheduledStartTime).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-brand-600 font-semibold font-mono">
              {new Date(interview.scheduledStartTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              -{' '}
              {new Date(interview.scheduledEndTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Conflict Warning Alert if Overlap Detected */}
        {conflicts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
            <div className="flex items-center gap-1.5 font-bold text-rose-800 text-sm mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Interviewer Calendar Conflict Detected</span>
            </div>
            <p className="text-rose-700">
              The following conflict overlaps with this session:
            </p>
            <ul className="mt-1 list-disc list-inside font-medium text-rose-800">
              {conflicts.map((c, i) => (
                <li key={i}>
                  {c.interviewerName} has "{c.conflictingEventTitle}" at this time.
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reschedule Reason Input */}
        <div>
          <Input
            label="Reason for Rescheduling (Included in update email)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Executive conflict, candidate requested change, etc."
          />
        </div>

        {/* Smart Alternative Slots Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Engine Recommended Alternative Slots
            </h4>
            <span className="text-[11px] text-slate-500">
              {alternativeSlots.length} verified slots found
            </span>
          </div>

          {loadingOptions ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                Scanning interviewer calendars & calculating time zones...
              </p>
            </div>
          ) : alternativeSlots.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border text-xs text-slate-500">
              No direct common slots found in the next 7 days. Try expanding the date range.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {alternativeSlots.map((slot, index) => {
                const isSelected =
                  selectedSlot?.startTime === slot.startTime &&
                  selectedSlot?.endTime === slot.endTime;

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-50/90 border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">
                          {slot.candidateLocalTime?.formatted ||
                            new Date(slot.startTime).toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            slot.rankingCategory === 'Optimal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {slot.score}/100 Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Duration: {slot.durationMinutes} mins • Verified zero conflicts for all panelists
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? 'primary' : 'outline'}
                      className="shrink-0"
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RescheduleModal;

