import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  User,
  Users,
  Check,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import SlotCard from '../components/scheduler/SlotCard';
import ConflictAlert from '../components/scheduler/ConflictAlert';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

export const Scheduler = () => {
  const [searchParams] = useSearchParams();
  const preselectedCandidateId = searchParams.get('candidateId');
  const navigate = useNavigate();
  const { addToast } = useNotification();

  // Data sources
  const [candidates, setCandidates] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form selections
  const [selectedCandidateId, setSelectedCandidateId] = useState(preselectedCandidateId || '');
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Next 7 days
    return d.toISOString().split('T')[0];
  });
  const [candidateTimezone, setCandidateTimezone] = useState('America/New_York');
  const [roundType, setRoundType] = useState('technical');
  const [interviewTitle, setInterviewTitle] = useState('');

  // Engine state
  const [searchingSlots, setSearchingSlots] = useState(false);
  const [engineResults, setEngineResults] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);

  // Load initial candidate, interviewer, and panel lists
  useEffect(() => {
    const loadResources = async () => {
      setLoadingInitial(true);
      try {
        const [candRes, invRes, panelRes] = await Promise.all([
          api.get('/candidates?limit=50'),
          api.get('/interviewers'),
          api.get('/panels'),
        ]);

        if (candRes.success) setCandidates(candRes.candidates);
        if (invRes.success) setInterviewers(invRes.interviewers);
        if (panelRes.success) setPanels(panelRes.panels);

        // Pre-select candidate if ID provided
        if (preselectedCandidateId && candRes.candidates) {
          const match = candRes.candidates.find((c) => c._id === preselectedCandidateId);
          if (match) {
            setSelectedCandidateId(match._id);
            setCandidateTimezone(match.timezone || 'America/New_York');
            setInterviewTitle(`${match.jobRole} - Technical Interview`);
          }
        }
      } catch (err) {
        addToast({ type: 'error', title: 'Loading Error', message: err.message });
      } finally {
        setLoadingInitial(false);
      }
    };

    loadResources();
  }, [preselectedCandidateId]);

  // When candidate changes, auto-populate details
  const handleCandidateChange = (candId) => {
    setSelectedCandidateId(candId);
    const candidate = candidates.find((c) => c._id === candId);
    if (candidate) {
      setCandidateTimezone(candidate.timezone || 'America/New_York');
      setInterviewTitle(`${candidate.jobRole} - Technical Round`);
    }
    setEngineResults(null);
    setSelectedSlot(null);
  };

  // When panel changes, auto-select its interviewers
  const handlePanelChange = (pId) => {
    setSelectedPanelId(pId);
    if (!pId) return;
    const panel = panels.find((p) => p._id === pId);
    if (panel) {
      const invIds = panel.interviewers.map((m) => m.interviewer._id || m.interviewer);
      setSelectedInterviewerIds(invIds);
      if (panel.defaultDurationMinutes) {
        setDurationMinutes(panel.defaultDurationMinutes);
      }
    }
    setEngineResults(null);
    setSelectedSlot(null);
  };

  const toggleInterviewer = (id) => {
    setSelectedInterviewerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setSelectedPanelId(''); // Custom selection overrides preset panel
    setEngineResults(null);
    setSelectedSlot(null);
  };

  // Run the Smart Scheduling Engine
  const handleFindSlots = async (e) => {
    if (e) e.preventDefault();

    if (!selectedCandidateId) {
      addToast({ type: 'warning', title: 'Candidate Required', message: 'Please select a candidate.' });
      return;
    }
    if (selectedInterviewerIds.length === 0) {
      addToast({ type: 'warning', title: 'Interviewers Required', message: 'Select at least one interviewer.' });
      return;
    }

    setSearchingSlots(true);
    setEngineResults(null);
    setSelectedSlot(null);

    try {
      const res = await api.post('/interviews/find-slots', {
        candidateId: selectedCandidateId,
        interviewerIds: selectedInterviewerIds,
        durationMinutes: Number(durationMinutes),
        startDate,
        endDate,
        candidateTimezone,
        bufferMinutes: 15,
      });

      if (res.success) {
        setEngineResults(res);
        if (res.recommendedSlots.length > 0) {
          setSelectedSlot(res.recommendedSlots[0]); // Auto-highlight best slot
        }
        addToast({
          type: 'success',
          title: 'Slots Calculated',
          message: `Found ${res.totalSlotsFound} conflict-free multi-panel slots!`,
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Engine Evaluation Error', message: err.message });
    } finally {
      setSearchingSlots(false);
    }
  };

  // 1-Click Book Interview
  const handleBookInterview = async () => {
    if (!selectedSlot) {
      addToast({ type: 'warning', title: 'Slot Required', message: 'Please select a time slot.' });
      return;
    }

    setBooking(true);
    try {
      const candidate = candidates.find((c) => c._id === selectedCandidateId);
      const res = await api.post('/interviews', {
        candidateId: selectedCandidateId,
        panelId: selectedPanelId || undefined,
        interviewers: selectedInterviewerIds.map((id) => ({ interviewer: id, role: 'Lead Interviewer' })),
        title: interviewTitle || `${candidate?.jobRole || 'Engineering'} Interview`,
        jobRole: candidate?.jobRole || 'Software Engineer',
        roundType,
        scheduledStartTime: selectedSlot.startTime,
        scheduledEndTime: selectedSlot.endTime,
        durationMinutes: selectedSlot.durationMinutes,
        timezone: candidateTimezone,
      });

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Interview Confirmed!',
          message: 'Calendar blocks created and .ics invites emailed to all participants.',
        });
        navigate('/calendar');
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Booking Failed', message: err.message });
    } finally {
      setBooking(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c._id === selectedCandidateId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-brand-700 border border-purple-200 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Multi-Panel Coordination Engine</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Smart Interview Scheduler
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Coordinate multi-interviewer loops, convert all timezones to UTC, and detect overlapping events automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Parameter Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card>
            <CardHeader
              title="1. Select Candidate"
              subtitle="Target candidate profile & timezone"
            />
            <CardContent className="space-y-4">
              <Select
                label="Candidate"
                value={selectedCandidateId}
                onChange={(e) => handleCandidateChange(e.target.value)}
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.jobRole} ({c.timezone})
                  </option>
                ))}
              </Select>

              {selectedCandidate && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{selectedCandidate.name}</p>
                  <p className="text-slate-600">Email: {selectedCandidate.email}</p>
                  <p className="text-slate-600">Role: <strong>{selectedCandidate.jobRole}</strong></p>
                  <p className="text-brand-700 font-semibold">
                    Preferred Time: {selectedCandidate.preferredTimesOfDay?.join(', ') || 'Any'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Candidate Timezone"
                  value={candidateTimezone}
                  onChange={(e) => setCandidateTimezone(e.target.value)}
                >
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Denver">America/Denver (MST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </Select>

                <Select
                  label="Interview Round"
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value)}
                >
                  <option value="screening">Screening</option>
                  <option value="technical">Technical Coding</option>
                  <option value="system_design">System Design</option>
                  <option value="behavioral">Behavioral / Culture</option>
                  <option value="bar_raiser">Bar Raiser</option>
                  <option value="final">Final Executive</option>
                </Select>
              </div>

              <Input
                label="Interview Title"
                value={interviewTitle}
                onChange={(e) => setInterviewTitle(e.target.value)}
                placeholder="e.g. System Design Architecture Review"
              />
            </CardContent>
          </Card>

          {/* Panel & Interviewers Selection */}
          <Card>
            <CardHeader
              title="2. Select Interviewers & Panel"
              subtitle="Pick a predefined loop or choose multiple interviewers"
            />
            <CardContent className="space-y-4">
              {panels.length > 0 && (
                <div>
                  <Select
                    label="Quick Preset Panel (Optional)"
                    value={selectedPanelId}
                    onChange={(e) => handlePanelChange(e.target.value)}
                  >
                    <option value="">-- Custom Interviewer Selection --</option>
                    {panels.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.interviewers?.length} panelists)
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Assigned Interviewers ({selectedInterviewerIds.length} selected)
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {interviewers.map((inv) => {
                    const isSelected = selectedInterviewerIds.includes(inv._id);
                    return (
                      <div
                        key={inv._id}
                        onClick={() => toggleInterviewer(inv._id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-purple-50/80 border-brand-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {inv.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{inv.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {inv.title} • {inv.timezone}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold capitalize">
                            {inv.seniority}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                              isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timing Parameters */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <Select
                  label="Duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins</option>
                  <option value={120}>120 mins</option>
                </Select>

                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                onClick={handleFindSlots}
                loading={searchingSlots}
                icon={Sparkles}
                className="w-full shadow-md shadow-brand-500/20 py-2.5 font-bold"
              >
                Run Smart Scheduling Engine
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Output Area: Smart Engine Recommendations (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {!engineResults && !searchingSlots ? (
            <Card className="p-12 text-center border-dashed">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Smart Multi-Panel Engine Ready
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Select your candidate and panel members on the left, then click <strong>Run Smart Scheduling Engine</strong> to compute non-conflicting slots scored by energy comfort, timezones, and candidate preferences.
              </p>
            </Card>
          ) : searchingSlots ? (
            <Card className="p-12 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 text-base">
                Calculating Common Free Intervals...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Converting candidate and interviewer local times to UTC, mapping calendar busy blocks, applying buffer periods, and scoring slot quality.
              </p>
            </Card>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Conflict Warnings or Near-Miss Alternatives */}
              <ConflictAlert
                warnings={engineResults.conflictWarnings}
                alternativeSlots={engineResults.alternativeSlots}
                onSelectAlternative={(alt) => {
                  setSelectedSlot({
                    ...alt,
                    rankingCategory: 'Acceptable',
                    score: 60,
                    candidateLocalTime: {
                      formatted: new Date(alt.startTime).toLocaleString(),
                      timezone: candidateTimezone,
                    },
                    interviewerLocalTimes: alt.availableInterviewers.map((i) => ({
                      interviewerId: i.id,
                      name: i.name,
                      formatted: new Date(alt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    })),
                  });
                }}
              />

              {/* Booking CTA Bar if slot is selected */}
              {selectedSlot && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-brand-600 to-purple-800 text-white shadow-lg flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block">
                      Ready to Schedule
                    </span>
                    <p className="text-sm font-bold">
                      {selectedSlot.candidateLocalTime?.formatted || new Date(selectedSlot.startTime).toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-200">
                      Duration: {selectedSlot.durationMinutes} mins • {selectedInterviewerIds.length} Interviewers
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-white text-brand-900 hover:bg-slate-100 font-bold shrink-0 shadow-md"
                    loading={booking}
                    onClick={handleBookInterview}
                    icon={Check}
                  >
                    Confirm & Dispatch Invites (.ics)
                  </Button>
                </div>
              )}

              {/* Recommended Slots List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    Recommended Common Available Slots ({engineResults.totalSlotsFound} total)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Ranked by prime energy hours & preference
                  </span>
                </div>

                {engineResults.recommendedSlots.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border text-xs text-slate-500">
                    No overlapping free slots found in this range. Try adjusting the date range or duration.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {engineResults.recommendedSlots.map((slot, idx) => (
                      <SlotCard
                        key={idx}
                        slot={slot}
                        isSelected={
                          selectedSlot?.startTime === slot.startTime &&
                          selectedSlot?.endTime === slot.endTime
                        }
                        onSelect={(s) => setSelectedSlot(s)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* All Additional Common Slots */}
              {engineResults.commonSlots.length > engineResults.recommendedSlots.length && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Additional Available Slots ({engineResults.commonSlots.length - engineResults.recommendedSlots.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {engineResults.commonSlots.slice(engineResults.recommendedSlots.length, 12).map((slot, idx) => (
                      <SlotCard
                        key={idx}
                        slot={slot}
                        isSelected={
                          selectedSlot?.startTime === slot.startTime &&
                          selectedSlot?.endTime === slot.endTime
                        }
                        onSelect={(s) => setSelectedSlot(s)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scheduler;
