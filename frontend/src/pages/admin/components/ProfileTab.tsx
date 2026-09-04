import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { userApi } from '../../../services/api';

const ProfileTab: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        role: '',
        status: ''
    });
    
    // Passwords
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            const localUserStr = localStorage.getItem('user');
            if (localUserStr) {
                const localUser = JSON.parse(localUserStr);
                // Fetch latest data just to be safe, but localUser is enough for ID
                const users = await userApi.getUsers({ search: localUser.email });
                const currentUser = users.find((u: any) => u.id === localUser.id) || localUser;
                setUser(currentUser);
                setFormData({
                    username: currentUser.username,
                    email: currentUser.email,
                    phone: currentUser.phone || '',
                    role: currentUser.role,
                    status: currentUser.status || 'active'
                });
            }
        } catch (err: any) {
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setSaving(true);
        setError(null);
        setSuccessMsg(null);
        
        try {
            await userApi.updateUser(user.id, formData);
            setSuccessMsg('Profile updated successfully!');
            // Update local storage user just in case
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long.');
            return;
        }

        setPasswordSaving(true);
        try {
            await userApi.resetPassword(user.id, passwordData.newPassword);
            setPasswordSuccess('Password changed successfully!');
            setPasswordData({ newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordSuccess(null), 3000);
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to change password');
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-muted">Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-main mb-2">My Profile</h1>
                <p className="text-muted">Manage your account details and security settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Details Form */}
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-subtle p-8 shadow-xl">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9b51e0] to-[#7a39b7] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#9b51e0]/20">
                            {formData.username ? formData.username.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-main">{formData.username}</h2>
                            <p className="text-muted capitalize">{formData.role.replace('_', ' ')}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6 flex items-center gap-3">
                            <AlertTriangle size={20} />
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 mb-6 flex items-center gap-3">
                            <Check size={20} />
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Full Name / Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#787596] w-5 h-5" />
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.username} 
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3 bg-base border border-subtle text-main rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#787596] w-5 h-5" />
                                    <input 
                                        type="email" 
                                        required
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3 bg-base border border-subtle text-main rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-muted mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#787596] w-5 h-5" />
                                    <input 
                                        type="text" 
                                        value={formData.phone} 
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        placeholder="Optional"
                                        className="w-full pl-12 pr-4 py-3 bg-base border border-subtle text-main rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="flex items-center px-6 py-3 bg-[#9b51e0] hover:bg-[#8b45cd] disabled:bg-[#9b51e0]/50 text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#9b51e0]/20"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Change Form */}
                <div className="bg-surface rounded-2xl border border-subtle p-8 shadow-xl h-fit">
                    <div className="flex items-center space-x-3 mb-6 border-b border-subtle pb-4">
                        <ShieldAlert className="w-6 h-6 text-amber-400" />
                        <h2 className="text-xl font-bold text-main">Security</h2>
                    </div>

                    {passwordError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm mb-6">
                            {passwordSuccess}
                        </div>
                    )}

                    <form onSubmit={handlePasswordUpdate} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#787596] w-5 h-5" />
                                <input 
                                    type="password" 
                                    required
                                    value={passwordData.newPassword} 
                                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3 bg-base border border-subtle text-main rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#787596] w-5 h-5" />
                                <input 
                                    type="password" 
                                    required
                                    value={passwordData.confirmPassword} 
                                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3 bg-base border border-subtle text-main rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={passwordSaving}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20 mt-4"
                        >
                            {passwordSaving ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
