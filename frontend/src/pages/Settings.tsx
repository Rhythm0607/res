import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserPlus,
} from 'lucide-react';
import { authService, UserResponse } from '../services/authService';
import { settingsService, UserSettings } from '../services/settingsService';
import { teamService, TeamMember } from '../services/teamService';
import { workflowService, WorkflowStage } from '../services/workflowService';
import { jobService, DashboardStats } from '../services/jobService';
import api from '../services/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'AI Matching', 'Workflow', 'Team', 'Profile'];

  // User & Profile State
  const [user, setUser] = useState<UserResponse | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Recruiter');

  // Workflow State
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [newStageName, setNewStageName] = useState('');

  // Dashboard / Overview Stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'Overview') fetchDashboard();
    if (activeTab === 'Team') fetchTeam();
    if (activeTab === 'Workflow') fetchWorkflow();
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setFullName(userData.full_name);
      setEmail(userData.email);

      const userSettings = await settingsService.getSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const stats = await jobService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeam = async () => {
    try {
      const members = await teamService.getTeam();
      setTeamMembers(members);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkflow = async () => {
    try {
      const stages = await workflowService.getStages();
      setWorkflowStages(stages);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await authService.updateProfile(fullName, email);
      setUser(updated);
      alert('Profile updated successfully');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    try {
      await authService.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      alert('Password updated successfully');
    } catch (error) {
      alert('Failed to update password');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await authService.uploadAvatar(file);
      setUser(updated);
    } catch (error) {
      alert('Failed to upload avatar');
    }
  };

  const handleSettingsUpdate = async () => {
    if (!settings) return;
    try {
      await settingsService.updateSettings(settings);
      alert('Settings saved!');
    } catch (error) {
      alert('Failed to save settings');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    try {
      const newMember = await teamService.inviteMember(inviteName, inviteEmail, inviteRole);
      setTeamMembers([...teamMembers, newMember]);
      setInviteName('');
      setInviteEmail('');
    } catch (error) {
      alert('Failed to invite member');
    }
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName) return;
    try {
      const newStage = await workflowService.createStage(newStageName);
      setWorkflowStages([...workflowStages, newStage]);
      setNewStageName('');
    } catch (error) {
      alert('Failed to add stage');
    }
  };

  // Construct Avatar URL
  const getAvatarUrl = (path?: string) => {
    if (!path) return `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=random`;
    return `${api.defaults.baseURL?.replace('/api/v1', '')}${path}`;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_24px_80px_-35px_rgba(0,72,56,0.22)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <Sparkles size={14} /> Live hiring pulse
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-text">Recruiting intelligence is trending up</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Your AI shortlist quality is improving weekly, and the recruiter workflow is reducing manual review time.
              </p>
            </div>
            <div className="rounded-2xl border border-accent/60 bg-accent/70 px-3 py-2 text-sm font-black text-primary">
              Active Dashboard
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Active Jobs', value: dashboardStats?.active_jobs || 0, detail: 'Live Requisitions' },
              { label: 'Total Candidates', value: dashboardStats?.total_candidates || 0, detail: 'In Pipeline' },
              { label: 'High Matches', value: dashboardStats?.high_matches || 0, detail: 'Strong Fit' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-semibold text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-text">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <MessageSquareText size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text">System Alerts</h3>
            </div>
          </div>
          <p className="text-sm text-muted">All systems are running smoothly. Your custom thresholds are applied to all new incoming resumes.</p>
        </div>
      </div>
    </div>
  );

  const renderAIMatchingTab = () => (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text">Matching configuration</h3>
              <p className="text-sm text-muted">Adjust scoring thresholds per hiring signal.</p>
            </div>
          </div>
          <button onClick={handleSettingsUpdate} className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:bg-primary/90">
            Save
          </button>
        </div>

        {settings && (
          <div className="space-y-5">
            {[
              { label: 'Core Skills', key: 'skills_match' as keyof UserSettings },
              { label: 'Experience', key: 'experience_match' as keyof UserSettings },
              { label: 'Culture Fit', key: 'culture_match' as keyof UserSettings },
              { label: 'Communication', key: 'communication_match' as keyof UserSettings },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                  <span className="text-text">{item.label}</span>
                  <span className="text-primary">{settings[item.key]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Number(settings[item.key]) || 0}
                  onChange={(e) => setSettings({ ...settings, [item.key]: Number(e.target.value) })}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-background accent-primary"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2.5">
          <div className="rounded-2xl bg-primary/10 p-2 text-primary">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black text-text">AI Confidence Settings</h3>
            <p className="text-sm text-muted">Set global preferences for AI behavior.</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm text-muted">
            Matching intelligence thresholds control when a candidate is auto-advanced to the "Shortlist" stage. By default, candidates meeting all thresholds are prioritized.
          </p>
        </div>
      </div>
    </div>
  );

  const renderWorkflowTab = () => (
    <div className="space-y-6">
      <form onSubmit={handleAddStage} className="flex flex-col gap-3 rounded-[28px] border border-border bg-card p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black text-text">Workflow orchestration</h3>
          <p className="text-sm text-muted">Coordinate high-signal handoffs across the sourcing pipeline.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="New Stage Name" 
            value={newStageName} 
            onChange={e => setNewStageName(e.target.value)}
            className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20" 
          />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:bg-primary/90">
            <Plus size={16} /> Create
          </button>
        </div>
      </form>

      <div className="grid gap-4 xl:grid-cols-4">
        {workflowStages.map((phase) => (
          <div key={phase.id} className="rounded-[24px] border border-border bg-card p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h4 className="font-black text-text">{phase.name}</h4>
              <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-muted">Active</span>
            </div>
            <div className="text-sm text-muted text-center py-4">
              Drag candidates here
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamTab = () => (
    <div className="space-y-6">
      <form onSubmit={handleInviteMember} className="flex flex-col gap-3 rounded-[28px] border border-border bg-card p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" placeholder="Name" value={inviteName} onChange={e => setInviteName(e.target.value)} required className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <input type="email" placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Recruiter</option>
            <option>Hiring Manager</option>
            <option>Admin</option>
          </select>
        </div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-primary/90">
          <UserPlus size={16} /> Invite
        </button>
      </form>

      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-background/70 text-[11px] font-black uppercase tracking-[0.24em] text-muted">
            <tr>
              <th className="px-6 py-4">Team member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teamMembers.map((member) => (
              <tr key={member.id} className="bg-card transition hover:bg-background/70">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${member.name}`} alt={member.name} className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <span className="block font-semibold text-text">{member.name}</span>
                      <span className="block text-xs text-muted">{member.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-text">{member.role}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${member.status === 'Active' ? 'bg-accent/70 text-primary' : 'bg-background text-muted'}`}>
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
            {teamMembers.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-6 text-muted">No team members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-border bg-background">
          <img src={getAvatarUrl(user?.avatar_url)} alt="Avatar" className="h-full w-full object-cover" />
        </div>
        <div className="mt-6 text-center">
          <h3 className="text-xl font-black text-text">{user?.full_name}</h3>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
        </div>
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" />
        <button onClick={() => fileInputRef.current?.click()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-background/80">
          <Upload size={16} /> Upload photo
        </button>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleProfileUpdate} className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-black text-text mb-6">Profile Settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <button type="submit" className="mt-4 rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-primary/90">
            Save Profile
          </button>
        </form>

        <form onSubmit={handlePasswordUpdate} className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
          <h3 className="text-lg font-black text-text mb-6">Change Password</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <button type="submit" className="mt-4 rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-primary/90">
            Update Password
          </button>
        </form>

        {settings && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={16} className="text-primary" />
                <h4 className="font-black text-text">Preferences</h4>
              </div>
              <div className="mt-4 space-y-3">
                <select 
                  value={settings.theme_preference} 
                  onChange={e => {
                    const updated = { ...settings, theme_preference: e.target.value };
                    setSettings(updated);
                    settingsService.updateSettings(updated);
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>Comfortable layout</option>
                  <option>Compact layout</option>
                </select>
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <h4 className="font-black text-text">Alerts</h4>
              </div>
              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold text-text">
                  <span>Candidate match alerts</span>
                  <input type="checkbox" checked={settings.alert_match} onChange={e => {
                    const updated = { ...settings, alert_match: e.target.checked };
                    setSettings(updated);
                    settingsService.updateSettings(updated);
                  }} className="h-4 w-4 accent-primary" />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm font-semibold text-text">
                  <span>Weekly recap</span>
                  <input type="checkbox" checked={settings.alert_recap} onChange={e => {
                    const updated = { ...settings, alert_recap: e.target.checked };
                    setSettings(updated);
                    settingsService.updateSettings(updated);
                  }} className="h-4 w-4 accent-primary" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <div className="rounded-[32px] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_-35px_rgba(0,72,56,0.22)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <Sparkles size={14} /> Hiring operations center
            </p>
            <h2 className="text-3xl font-black tracking-tight text-text">Settings</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted">
              Tune your matching intelligence, review preferences, and keep the hiring pipeline aligned with your team.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeTab === tab ? 'bg-primary text-background shadow-soft' : 'text-muted hover:bg-background hover:text-text'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>{activeTab === 'Overview' && renderOverviewTab()}</div>
      <div>{activeTab === 'AI Matching' && renderAIMatchingTab()}</div>
      <div>{activeTab === 'Workflow' && renderWorkflowTab()}</div>
      <div>{activeTab === 'Team' && renderTeamTab()}</div>
      <div>{activeTab === 'Profile' && renderProfileTab()}</div>
    </div>
  );
}
