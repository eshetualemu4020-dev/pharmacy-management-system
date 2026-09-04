import React, { useState, useEffect } from 'react';
import { User, Shield, Phone, Mail, Clock, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { profileApi } from '../../services/api';

export default function PharmacistProfileTab() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ username: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [infoSaving, setInfoSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setInfoForm({
        username: data.username || '',
        phone: data.phone || ''
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load your profile.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoForm.username.trim()) {
      showError('Full Name is required');
      return;
    }
    
    setInfoSaving(true);
    try {
      await profileApi.updateProfile({
        username: infoForm.username.trim(),
        phone: infoForm.phone.trim() || undefined
      });
      showSuccess('Profile updated successfully.');
      setIsEditingInfo(false);
      await fetchProfile();
    } catch (err: any) {
      showError(err.message || 'Failed to update profile.');
    } finally {
      setInfoSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showError('All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordSaving(true);
    try {
      await profileApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showSuccess('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showError(err.message || 'Unable to update your password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-base">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-main flex items-center gap-3">
            <User className="w-8 h-8 text-emerald-500" />
            Profile
          </h1>
          <p className="text-muted mt-2">
            Manage your personal account information and security settings.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Information */}
            <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
              <div className="p-6 border-b border-subtle flex justify-between items-center">
                <h2 className="text-xl font-bold text-main">Personal Information</h2>
                {!isEditingInfo && (
                  <button 
                    onClick={() => setIsEditingInfo(true)}
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-4 py-2 bg-emerald-400/10 rounded-lg"
                  >
                    Edit Info
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {isEditingInfo ? (
                  <form onSubmit={handleInfoSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-muted mb-2">Full Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={infoForm.username}
                          onChange={(e) => setInfoForm({...infoForm, username: e.target.value})}
                          className="w-full bg-base border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted mb-2">Email Address (Read-only)</label>
                        <input
                          type="email"
                          value={profile?.email || ''}
                          className="w-full bg-base/50 border border-subtle rounded-xl px-4 py-3 text-muted cursor-not-allowed"
                          disabled
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={infoForm.phone}
                          onChange={(e) => setInfoForm({...infoForm, phone: e.target.value})}
                          className="w-full bg-base border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          placeholder="e.g. +1 234 567 8900"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingInfo(false);
                          setInfoForm({ username: profile?.username || '', phone: profile?.phone || '' });
                        }}
                        className="px-6 py-2.5 rounded-xl font-medium text-muted hover:bg-hover transition-colors"
                        disabled={infoSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={infoSaving}
                        className="px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {infoSaving && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-medium text-muted mb-1">Full Name</p>
                      <p className="text-main text-lg">{profile?.username}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted mb-1">Email Address</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        <p className="text-main">{profile?.email}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted mb-1">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        <p className="text-main">{profile?.phone || <span className="text-slate-500 italic">Not provided</span>}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security / Password */}
            <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
              <div className="p-6 border-b border-subtle">
                <h2 className="text-xl font-bold text-main flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-500" />
                  Security
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full bg-base border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full bg-base border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full bg-base border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-6 py-2.5 rounded-xl font-medium bg-base border border-subtle-hover text-main hover:bg-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {passwordSaving && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column - Account Info */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl border border-subtle overflow-hidden p-6">
              <div className="flex flex-col items-center justify-center py-6 border-b border-subtle mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
                  {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <h3 className="text-xl font-bold text-main">{profile?.username}</h3>
                <p className="text-emerald-400 font-medium mt-1 uppercase tracking-wider text-sm">{profile?.role}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-base rounded-xl border border-subtle">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-main">Account Status</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    profile?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {profile?.status ? profile.status.toUpperCase() : 'UNKNOWN'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-base rounded-xl border border-subtle">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-main">Member Since</span>
                  </div>
                  <span className="text-sm text-muted">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
