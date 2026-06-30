import { useState, useEffect } from 'react';
import { User, ShieldAlert, Key, Palette, Bell, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preferences State
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [notifyOnUpload, setNotifyOnUpload] = useState(true);
  const [notifyOnMatch, setNotifyOnMatch] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Pre-load user details when context resolves
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
    }
  }, [user]);

  // Handle Dark Mode toggle
  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Profile Update Submit
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setProfileLoading(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      const res = await api.put('/auth/profile', {
        full_name: fullName,
        email: email
      });
      setUser(res.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileError(err.response?.data?.detail || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change Submit
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    try {
      await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update password:', err);
      setPasswordError(err.response?.data?.detail || 'Failed to update account password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Preferences Submit
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-black text-text tracking-tight mb-2">Recruiter Settings</h2>
        <p className="text-muted text-sm font-medium">Manage your personal credentials, contact profile, and application preferences.</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <User size={16} />
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'preferences'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Palette size={16} />
          App Preferences
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1: Account Info */}
          <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <User size={18} />
                </div>
                <h3 className="font-bold text-lg text-text">Account Details</h3>
              </div>
              <p className="text-xs text-muted font-medium mb-6">Update your recruiter display name and correspondence email.</p>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileSuccess && (
                  <div className="p-3 bg-success/5 border border-success/20 text-success text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Account details saved successfully.
                  </div>
                )}
                {profileError && (
                  <div className="p-3 bg-danger/5 border border-danger/20 text-danger text-xs font-semibold rounded-xl flex items-center gap-2">
                    <ShieldAlert size={14} />
                    {profileError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:border-primary transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-soft hover:bg-primary/95 transition disabled:opacity-50 mt-6"
                >
                  {profileLoading ? 'Saving...' : 'Save Details'}
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Password Update */}
          <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Key size={18} />
                </div>
                <h3 className="font-bold text-lg text-text">Change Password</h3>
              </div>
              <p className="text-xs text-muted font-medium mb-6">Change your current recruiter account password regularly for safety.</p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {passwordSuccess && (
                  <div className="p-3 bg-success/5 border border-success/20 text-success text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Password updated successfully.
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 bg-danger/5 border border-danger/20 text-danger text-xs font-semibold rounded-xl flex items-center gap-2">
                    <ShieldAlert size={14} />
                    {passwordError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:border-primary transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-soft hover:bg-primary/95 transition disabled:opacity-50 mt-6"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Palette size={18} />
            </div>
            <h3 className="font-bold text-lg text-text">Display & Notifications</h3>
          </div>
          <p className="text-xs text-muted font-medium mb-8">Personalize theme interfaces and system notification options.</p>

          <form onSubmit={handleSavePreferences} className="space-y-6">
            {prefSuccess && (
              <div className="p-3 bg-success/5 border border-success/20 text-success text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 size={14} />
                Preferences updated successfully.
              </div>
            )}

            {/* Dark Mode Switcher Option */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="space-y-0.5">
                <p className="font-bold text-sm text-text flex items-center gap-2">
                  {darkMode ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-warning" />}
                  Dark Theme Interface
                </p>
                <p className="text-xs text-muted font-medium">Turn the HireSense dashboard dark for lower eye strain.</p>
              </div>
              <button
                type="button"
                onClick={() => handleThemeToggle(!darkMode)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  darkMode ? 'bg-primary' : 'bg-muted/30'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Checkbox notifications */}
            <div className="space-y-4">
              <p className="font-bold text-xs text-muted uppercase tracking-wider block">System Notifications</p>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnUpload}
                  onChange={(e) => setNotifyOnUpload(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary mt-0.5"
                />
                <div>
                  <p className="font-bold text-sm text-text flex items-center gap-1.5">
                    <Bell size={14} className="text-muted" />
                    Resume Upload Completed Alerts
                  </p>
                  <p className="text-xs text-muted font-medium">Notify when background parsers finish processing candidate resumes.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnMatch}
                  onChange={(e) => setNotifyOnMatch(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary mt-0.5"
                />
                <div>
                  <p className="font-bold text-sm text-text flex items-center gap-1.5">
                    <Bell size={14} className="text-muted" />
                    Interview Invitation accepted Alerts
                  </p>
                  <p className="text-xs text-muted font-medium">Notify when candidates respond to recruiter email outreach.</p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-soft hover:bg-primary/95 transition mt-8"
            >
              Save Preferences
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
