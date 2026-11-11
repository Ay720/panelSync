import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Clock,
  ExternalLink,
  Tag,
  Link2,
  Copy,
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

export const Candidates = () => {
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Candidate Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobRole: '',
    department: 'Engineering',
    status: 'applied',
    timezone: 'America/New_York',
    notes: '',
  });

  // Candidate Profile View Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      let url = '/candidates?limit=50';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.success) {
        setCandidates(res.candidates);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to fetch candidates' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleOpenCreate = () => {
    setEditingCandidate(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobRole: '',
      department: 'Engineering',
      status: 'applied',
      timezone: 'America/New_York',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (candidate, e) => {
    if (e) e.stopPropagation();
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      jobRole: candidate.jobRole,
      department: candidate.department || 'Engineering',
      status: candidate.status,
      timezone: candidate.timezone || 'America/New_York',
      notes: candidate.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveCandidate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.jobRole) {
      addToast({ type: 'warning', title: 'Missing Info', message: 'Name, email, and job role are required' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCandidate) {
        const res = await api.put(`/candidates/${editingCandidate._id}`, formData);
        if (res.success) {
          addToast({ type: 'success', title: 'Candidate Updated', message: 'Profile details saved.' });
        }
      } else {
        const res = await api.post('/candidates', formData);
        if (res.success) {
          addToast({ type: 'success', title: 'Candidate Created', message: 'Candidate added to pipeline.' });
        }
      }
      setIsModalOpen(false);
      fetchCandidates();
    } catch (err) {
      addToast({ type: 'error', title: 'Error Saving', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCandidate = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;

    try {
      const res = await api.delete(`/candidates/${id}`);
      if (res.success) {
        addToast({ type: 'success', title: 'Candidate Deleted', message: res.message });
        fetchCandidates();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setIsViewModalOpen(true);
  };

  const handleCopyBookingLink = (candidateId, e) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/book/${candidateId}`;
    navigator.clipboard.writeText(link);
    addToast({
      type: 'success',
      title: 'Booking Link Copied!',
      message: 'Candidate self-scheduling link copied to clipboard.',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Candidate Management
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Complete hiring candidate profiles, timezone tracking, and scheduled loops.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Candidate
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <Input
            icon={Search}
            placeholder="Search candidates by name, email, or job role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Stages</option>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="interview_completed">Interview Completed</option>
            <option value="offered">Offer Extended</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </div>

      {/* Candidates Table / List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" count={4} />
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No candidates found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-5">Candidate</th>
                    <th className="py-3 px-5">Job Role</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Timezone</th>
                    <th className="py-3 px-5">Interview History</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((candidate) => (
                    <tr
                      key={candidate._id}
                      onClick={() => handleViewProfile(candidate)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {candidate.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                              {candidate.name}
                            </p>
                            <p className="text-slate-400 text-xs">{candidate.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-800">{candidate.jobRole}</p>
                        <p className="text-slate-400 text-[11px]">{candidate.department}</p>
                      </td>

                      <td className="py-4 px-5">
                        <Badge variant={candidate.status}>{candidate.status.replace('_', ' ')}</Badge>
                      </td>

                      <td className="py-4 px-5 font-mono text-slate-600 text-[11px]">
                        {candidate.timezone}
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-700">
                          {candidate.interviewHistory?.length || 0} rounds
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Sparkles}
                            onClick={() => navigate(`/scheduler?candidateId=${candidate._id}`)}
                            title="Schedule Interview Loop"
                          >
                            Schedule
                          </Button>
                          <button
                            onClick={(e) => handleOpenEdit(candidate, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="Edit Candidate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCandidate(candidate._id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Profile Details View Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={selectedCandidate.name}
          subtitle={`Profile Details • Applied for ${selectedCandidate.jobRole}`}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="primary"
                icon={Sparkles}
                onClick={() => {
                  setIsViewModalOpen(false);
                  navigate(`/scheduler?candidateId=${selectedCandidate._id}`);
                }}
              >
                Launch Smart Scheduler
              </Button>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                <p className="font-bold text-slate-900">{selectedCandidate.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone</span>
                <p className="font-bold text-slate-900">{selectedCandidate.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Timezone</span>
                <p className="font-mono text-brand-700 font-bold">{selectedCandidate.timezone}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Stage</span>
                <Badge variant={selectedCandidate.status}>{selectedCandidate.status}</Badge>
              </div>
            </div>

            {selectedCandidate.notes && (
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Recruiter Notes
                </span>
                <p className="text-slate-700 leading-relaxed">{selectedCandidate.notes}</p>
              </div>
            )}

            <div>
              <p className="font-bold text-slate-900 text-sm mb-2">Interview History</p>
              {selectedCandidate.interviewHistory?.length === 0 ? (
                <p className="text-slate-400 text-xs">No interviews logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCandidate.interviewHistory?.map((int, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{int.title}</p>
                        <p className="text-slate-500 text-[11px]">
                          {new Date(int.scheduledStartTime).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={int.status}>{int.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Candidate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
        subtitle="Manage candidate profile, timezone, and pipeline stage"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSaveCandidate}>
              {editingCandidate ? 'Save Changes' : 'Create Candidate'}
            </Button>
          </>
        }
      >
        <form className="space-y-3.5" onSubmit={handleSaveCandidate}>
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Jordan Vance"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="candidate@example.com"
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Job Role *"
              value={formData.jobRole}
              onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
              placeholder="e.g. Senior Full-Stack Engineer"
            />
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
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
              label="Pipeline Stage"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="interview_completed">Interview Completed</option>
              <option value="offered">Offer Extended</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recruiter Notes
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-200 text-sm p-3 text-slate-800 focus:outline-none focus:border-brand-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Candidate background, salary expectations, preferred interview time..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Candidates;

