import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Globe,
  Mail,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Database,
  Shield,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useNotification();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    timezone: user?.timezone || 'America/New_York',
  });
  const [saving, setSaving] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.success) {
        updateUser(res.user);
        addToast({ type: 'success', title: 'Profile Updated', message: 'Your preferences have been saved.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSeedData = async () => {
    if (!window.confirm('Reset database and reload default sample candidates, interviewers, and calendars?')) return;
    setReseeding(true);
    try {
      const res = await api.post('/seed');
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Database Reloaded',
          message: 'Default interviewers, candidates, and calendars restored.',
        });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Seed Failed', message: err.message });
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Profile & System Settings
        </h2>
        <p className="text-slate-500 text-xs md:text-sm">
          Manage your personal profile, global time zone preferences, and calendar sync providers.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader
            title="User Profile & Preferences"
            subtitle="Your contact information and primary scheduling timezone"
          />
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
                <Select
                  label="Primary Timezone"
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
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" loading={saving}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Calendar & Email Integrations Card */}
        <Card>
          <CardHeader
            title="Calendar & Email Integrations"
            subtitle="Connected cloud accounts and mock testing configurations"
          />
          <CardContent className="space-y-4">
            {/* Google Calendar */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-brand-700 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Google Calendar API</h4>
                  <p className="text-xs text-slate-500">
                    Syncs panelist calendars, standup meetings, and blocks out interview slots.
                  </p>
                </div>
              </div>
              <Badge variant="success">Active (Mock Mode)</Badge>
            </div>

            {/* Microsoft Outlook */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Microsoft Outlook Calendar API</h4>
                  <p className="text-xs text-slate-500">
                    Microsoft Graph API connector for enterprise Exchange calendars.
                  </p>
                </div>
              </div>
              <Badge variant="success">Active (Mock Mode)</Badge>
            </div>

            {/* Email Service */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Nodemailer Email & .ics Generator</h4>
                  <p className="text-xs text-slate-500">
                    Dispatches HTML notifications with RFC 5545 calendar attachments.
                  </p>
                </div>
              </div>
              <Badge variant="success">Ready (Ethereal / SMTP)</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Management Card */}
        <Card className="border-rose-200">
          <CardHeader
            title="Database & Demo Data Reset"
            subtitle="Reset the platform to original sample interviewers, candidates, and calendars"
          />
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-600">
                Wipes and reloads the MongoDB database with realistic multi-timezone interview loops, standups, and candidate profiles.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={reseeding}
              onClick={handleResetSeedData}
            >
              Reset Seed Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

