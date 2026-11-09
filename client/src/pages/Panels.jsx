import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Users, Sparkles, Edit2, Trash2, Clock, Check } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

export const Panels = () => {
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [panels, setPanels] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: 'Engineering',
    targetRole: 'Senior Software Engineer',
    defaultDurationMinutes: 60,
    selectedInterviewers: [], // [{ interviewerId, role }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [panelRes, invRes] = await Promise.all([
        api.get('/panels'),
        api.get('/interviewers'),
      ]);
      if (panelRes.success) setPanels(panelRes.panels);
      if (invRes.success) setInterviewers(invRes.interviewers);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load interview panels' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPanel(null);
    setFormData({
      name: '',
      description: '',
      department: 'Engineering',
      targetRole: 'Senior Software Engineer',
      defaultDurationMinutes: 60,
      selectedInterviewers: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (panel) => {
    setEditingPanel(panel);
    setFormData({
      name: panel.name,
      description: panel.description || '',
      department: panel.department,
      targetRole: panel.targetRole || '',
      defaultDurationMinutes: panel.defaultDurationMinutes || 60,
      selectedInterviewers: panel.interviewers?.map((i) => ({
        interviewerId: i.interviewer?._id || i.interviewer,
        role: i.role || 'Evaluator',
      })) || [],
    });
    setIsModalOpen(true);
  };

  const handleToggleInterviewer = (invId) => {
    setFormData((prev) => {
      const exists = prev.selectedInterviewers.some((i) => i.interviewerId === invId);
      if (exists) {
        return {
          ...prev,
          selectedInterviewers: prev.selectedInterviewers.filter((i) => i.interviewerId !== invId),
        };
      } else {
        return {
          ...prev,
          selectedInterviewers: [
            ...prev.selectedInterviewers,
            { interviewerId: invId, role: 'Lead Evaluator' },
          ],
        };
      }
    });
  };

  const handleRoleChange = (invId, role) => {
    setFormData((prev) => ({
      ...prev,
      selectedInterviewers: prev.selectedInterviewers.map((i) =>
        i.interviewerId === invId ? { ...i, role } : i
      ),
    }));
  };

  const handleSavePanel = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.selectedInterviewers.length === 0) {
      addToast({
        type: 'warning',
        title: 'Validation',
        message: 'Panel name and at least one interviewer are required.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        department: formData.department,
        targetRole: formData.targetRole,
        defaultDurationMinutes: Number(formData.defaultDurationMinutes),
        interviewers: formData.selectedInterviewers.map((i) => ({
          interviewer: i.interviewerId,
          role: i.role,
          isRequired: true,
        })),
      };

      if (editingPanel) {
        const res = await api.put(`/panels/${editingPanel._id}`, payload);
        if (res.success) {
          addToast({ type: 'success', title: 'Panel Updated', message: 'Changes saved successfully.' });
        }
      } else {
        const res = await api.post('/panels', payload);
        if (res.success) {
          addToast({ type: 'success', title: 'Panel Created', message: 'New interview panel ready.' });
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePanel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this panel?')) return;
    try {
      const res = await api.delete(`/panels/${id}`);
      if (res.success) {
        addToast({ type: 'success', title: 'Deleted', message: 'Panel removed.' });
        fetchData();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Interview Panels
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Configure reusable interviewer combinations for standardized multi-panel hiring loops.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create Panel
        </Button>
      </div>

      {/* Grid of Panels */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {panels.map((panel) => (
            <Card key={panel._id} className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {panel.name}
                    </h3>
                    <p className="text-xs text-brand-600 font-semibold mt-0.5">
                      {panel.department} • {panel.targetRole || 'Any Engineering Role'}
                    </p>
                  </div>
                  <Badge variant="purple">{panel.defaultDurationMinutes} mins</Badge>
                </div>

                {panel.description && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {panel.description}
                  </p>
                )}

                {/* Interviewers in this panel */}
                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Panelists ({panel.interviewers?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {panel.interviewers?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            {item.interviewer?.name}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-1.5">
                            ({item.interviewer?.timezone})
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {item.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={Sparkles}
                  onClick={() => navigate(`/scheduler`)}
                >
                  Schedule with Panel
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(panel)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => handleDeletePanel(panel._id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Panel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPanel ? 'Edit Interview Panel' : 'Create New Interview Panel'}
        subtitle="Combine interviewers into an aligned interview panel"
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSavePanel}>
              {editingPanel ? 'Save Changes' : 'Create Panel'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSavePanel}>
          <Input
            label="Panel Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Senior Full-Stack Architecture Loop"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department *"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Input
              label="Target Role"
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
              placeholder="e.g. Lead Architect"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Default Session Duration"
              value={formData.defaultDurationMinutes}
              onChange={(e) => setFormData({ ...formData, defaultDurationMinutes: Number(e.target.value) })}
            >
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-200 text-sm p-2 text-slate-800 focus:outline-none focus:border-brand-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Evaluation focus, guidelines, scoring rubrics..."
            />
          </div>

          {/* Select Panelists */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Panelists ({formData.selectedInterviewers.length} chosen)
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {interviewers.map((inv) => {
                const isSelected = formData.selectedInterviewers.some(
                  (i) => i.interviewerId === inv._id
                );
                const currentItem = formData.selectedInterviewers.find(
                  (i) => i.interviewerId === inv._id
                );

                return (
                  <div
                    key={inv._id}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-50/70 border-brand-500'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div
                      onClick={() => handleToggleInterviewer(inv._id)}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{inv.name}</p>
                        <p className="text-[10px] text-slate-400">{inv.title} • {inv.timezone}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-44 shrink-0">
                        <input
                          type="text"
                          value={currentItem?.role || ''}
                          onChange={(e) => handleRoleChange(inv._id, e.target.value)}
                          placeholder="Panel Role (e.g. Lead)"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Panels;

