import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Calendar,
  Clock,
  RefreshCw,
  Edit2,
  Trash2,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

export const Interviewers = () => {
  const { addToast } = useNotification();
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    title: '',
    seniority: 'senior',
    skills: '',
    timezone: 'America/Los_Angeles',
    maxInterviewsPerDay: 3,
    maxInterviewsPerWeek: 10,
    bufferTimeMinutes: 15,
  });

  // Availability Viewer / Override Modal
  const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
  const [selectedInterviewer, setSelectedInterviewer] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideReason, setOverrideReason] = useState('Off-site / Team Offsite');

  useEffect(() => {
    fetchInterviewers();
  }, []);

  const fetchInterviewers = async () => {
    setLoading(true);
    try {
      let url = '/interviewers';
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      if (res.success) {
        setInterviewers(res.interviewers);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to fetch interviewers' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingInterviewer(null);
    setFormData({
      name: '',
      email: '',
      department: 'Engineering',
      title: '',
      seniority: 'senior',
      skills: 'React, Node.js, System Design',
      timezone: 'America/Los_Angeles',
      maxInterviewsPerDay: 3,
      maxInterviewsPerWeek: 10,
      bufferTimeMinutes: 15,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv, e) => {
    if (e) e.stopPropagation();
    setEditingInterviewer(inv);
    setFormData({
      name: inv.name,
      email: inv.email,
      department: inv.department,
      title: inv.title,
      seniority: inv.seniority,
      skills: Array.isArray(inv.skills) ? inv.skills.join(', ') : '',
      timezone: inv.timezone || 'America/Los_Angeles',
      maxInterviewsPerDay: inv.maxInterviewsPerDay || 3,
      maxInterviewsPerWeek: inv.maxInterviewsPerWeek || 10,
      bufferTimeMinutes: inv.bufferTimeMinutes || 15,
    });
    setIsModalOpen(true);
  };

  const handleSaveInterviewer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.title || !formData.department) {
      addToast({ type: 'warning', title: 'Missing Info', message: 'Please fill in all required fields' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (editingInterviewer) {
        const res = await api.put(`/interviewers/${editingInterviewer._id}`, payload);
        if (res.success) {
          addToast({ type: 'success', title: 'Updated', message: 'Interviewer profile saved.' });
        }
      } else {
        const res = await api.post('/interviewers', payload);
        if (res.success) {
          addToast({ type: 'success', title: 'Created', message: 'Interviewer added & mock calendar synced.' });
        }
      }
      setIsModalOpen(false);
      fetchInterviewers();
    } catch (err) {
      addToast({ type: 'error', title: 'Error Saving', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncInterviewerCalendar = async (id, e) => {
    if (e) e.stopPropagation();
    setSyncingId(id);
    try {
      const res = await api.post(`/interviewers/${id}/sync-calendar`);
      if (res.success) {
        addToast({ type: 'success', title: 'Calendar Synced', message: res.message });
        fetchInterviewers();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Sync Error', message: err.message });
    } finally {
      setSyncingId(null);
    }
  };

  const handleOpenAvailability = async (inv) => {
    setSelectedInterviewer(inv);
    setIsAvailModalOpen(true);
    try {
      const res = await api.get(`/availability/interviewer/${inv._id}`);
      if (res.success) {
        setAvailability(res.availability);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Could not fetch availability schedule' });
    }
  };

  const handleAddOverride = async () => {
    if (!overrideDate) {
      addToast({ type: 'warning', title: 'Date Required', message: 'Please select a date' });
      return;
    }
    try {
      const res = await api.post(`/availability/interviewer/${selectedInterviewer._id}/overrides`, {
        date: overrideDate,
        isUnavailable: true,
        reason: overrideReason,
      });
      if (res.success) {
        setAvailability(res.availability);
        addToast({ type: 'success', title: 'Override Added', message: `Marked unavailable on ${overrideDate}` });
        setOverrideDate('');
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleRemoveOverride = async (date) => {
    try {
      const res = await api.delete(`/availability/interviewer/${selectedInterviewer._id}/overrides/${date}`);
      if (res.success) {
        setAvailability(res.availability);
        addToast({ type: 'success', title: 'Override Removed', message: 'Availability restored' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Interviewer Management & Availability
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Maintain executive and engineer availability, skills matrix, and Google/Outlook calendar links.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Interviewer
        </Button>
      </div>

      {/* Grid of Interviewer Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {interviewers.map((inv) => (
            <Card
              key={inv._id}
              className="p-5 flex flex-col justify-between hover:border-brand-300 transition-all cursor-pointer"
              onClick={() => handleOpenAvailability(inv)}
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {inv.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight hover:text-brand-600 transition-colors">
                        {inv.name}
                      </h3>
                      <p className="text-xs text-slate-500">{inv.title}</p>
                    </div>
                  </div>
                  <Badge variant="purple">{inv.seniority}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <p className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Zone: <strong className="text-slate-800">{inv.timezone}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Max {inv.maxInterviewsPerDay}/day • {inv.bufferTimeMinutes}m buffer
                    </span>
                  </p>
                </div>

                {/* Skills tags */}
                {inv.skills && inv.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {inv.skills.slice(0, 4).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                    {inv.skills.length > 4 && (
                      <span className="text-[10px] text-slate-400">+{inv.skills.length - 4}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Calendar Status & Actions */}
              <div
                className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="capitalize">{inv.calendarSync?.provider || 'Google'} Connected</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={RefreshCw}
                    loading={syncingId === inv._id}
                    onClick={(e) => handleSyncInterviewerCalendar(inv._id, e)}
                    title="Simulate calendar sync"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Edit2}
                    onClick={(e) => handleOpenEdit(inv, e)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Availability & Overrides Modal */}
      {selectedInterviewer && (
        <Modal
          isOpen={isAvailModalOpen}
          onClose={() => setIsAvailModalOpen(false)}
          title={`Availability: ${selectedInterviewer.name}`}
          subtitle={`Working hours & calendar overrides (${selectedInterviewer.timezone})`}
          maxWidth="max-w-2xl"
          footer={
            <Button variant="outline" onClick={() => setIsAvailModalOpen(false)}>
              Done
            </Button>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Weekly Schedule Matrix */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Weekly Working Hours</h4>
              <div className="grid grid-cols-7 gap-2 text-center">
                {availability?.weeklySchedule?.map((sched, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border ${
                      sched.isAvailable
                        ? 'bg-purple-50/70 border-purple-200 text-brand-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <p className="font-bold text-[11px] uppercase mb-1">{daysMap[sched.dayOfWeek]}</p>
                    {sched.isAvailable ? (
                      <div className="text-[10px] space-y-0.5 font-mono">
                        {sched.slots?.map((s, si) => (
                          <span key={si} className="block leading-tight">
                            {s.startTime}-{s.endTime}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold">Off</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Date Overrides (PTO / Out of Office) */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm mb-2">
                Date Overrides & Scheduled PTO ({availability?.overrides?.length || 0})
              </h4>
              <p className="text-slate-500 mb-3 text-[11px]">
                The smart engine will avoid scheduling during these blocked dates or apply custom hour limits.
              </p>

              {/* Add Override Form */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2 mb-3">
                <input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-auto"
                />
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason (e.g. PTO, Vacation, Off-site)"
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex-1 w-full"
                />
                <Button size="sm" variant="primary" onClick={handleAddOverride} className="shrink-0">
                  Block Date
                </Button>
              </div>

              {/* Overrides List */}
              <div className="space-y-2">
                {availability?.overrides?.map((ov, oIdx) => (
                  <div
                    key={oIdx}
                    className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-900 font-mono">{ov.date}</span>
                      <span className="text-amber-700 ml-2">— {ov.reason}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveOverride(ov.date)}
                      className="text-amber-800 hover:text-rose-600 font-bold px-2 py-0.5 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Interviewer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInterviewer ? 'Edit Interviewer' : 'Add New Interviewer'}
        subtitle="Manage panelist credentials, role, and timezone"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSaveInterviewer}>
              {editingInterviewer ? 'Save Changes' : 'Create & Sync'}
            </Button>
          </>
        }
      >
        <form className="space-y-3.5" onSubmit={handleSaveInterviewer}>
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Dr. Sarah Chen"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Work Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="interviewer@panelsync.io"
            />
            <Input
              label="Job Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Staff Software Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department *"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Select
              label="Seniority"
              value={formData.seniority}
              onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Staff</option>
              <option value="director">Director</option>
              <option value="vp">VP / Executive</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Select
              label="Timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            </Select>

            <Input
              label="Max Int/Day"
              type="number"
              value={formData.maxInterviewsPerDay}
              onChange={(e) => setFormData({ ...formData, maxInterviewsPerDay: Number(e.target.value) })}
            />

            <Input
              label="Buffer (mins)"
              type="number"
              value={formData.bufferTimeMinutes}
              onChange={(e) => setFormData({ ...formData, bufferTimeMinutes: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Technical Skills & Competencies (comma separated)"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="React, Distributed Systems, Go, System Design"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Interviewers;

