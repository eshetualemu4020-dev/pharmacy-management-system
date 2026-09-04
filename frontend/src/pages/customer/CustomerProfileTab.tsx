import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Bell, MapPin, Check, Plus, Trash2, Edit2, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { customerProfileApi } from '../../services/api';

const CustomerProfileTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);

  // Forms state
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // UI states
  const [activeTab, setActiveTab] = useState<'personal' | 'addresses' | 'security' | 'notifications'>('personal');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState({ label: '', region: '', city: '', sub_city: '', street: '', details: '', phone: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, addrRes, prefRes] = await Promise.all([
        customerProfileApi.getProfile(),
        customerProfileApi.getAddresses(),
        customerProfileApi.getPreferences()
      ]);
      setProfile(profRes);
      setPersonalInfo({ name: profRes.name, email: profRes.email, phone: profRes.phone || '' });
      setAddresses(addrRes);
      setPreferences(prefRes);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await customerProfileApi.updateProfile(personalInfo);
      setProfile(updated);
      showMessage('success', 'Profile updated successfully.');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match.');
      return;
    }
    try {
      await customerProfileApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      showMessage('success', 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to change password.');
    }
  };

  const handleUpdatePreferences = async (field: string, value: boolean) => {
    const newPrefs = { ...preferences, [field]: value };
    setPreferences(newPrefs);
    try {
      await customerProfileApi.updatePreferences(newPrefs);
      showMessage('success', 'Notification preferences updated.');
    } catch (err: any) {
      setPreferences(preferences); // revert
      showMessage('error', err.message || 'Failed to update preferences.');
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await customerProfileApi.updateAddress(editingAddress.id, addressForm);
        showMessage('success', 'Address updated successfully.');
      } else {
        await customerProfileApi.addAddress(addressForm);
        showMessage('success', 'Address added successfully.');
      }
      setAddressModalOpen(false);
      const addrRes = await customerProfileApi.getAddresses();
      setAddresses(addrRes);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await customerProfileApi.deleteAddress(id);
      showMessage('success', 'Address deleted successfully.');
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await customerProfileApi.setDefaultAddress(id);
      showMessage('success', 'Default address updated.');
      const addrRes = await customerProfileApi.getAddresses();
      setAddresses(addrRes);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to set default address.');
    }
  };

  const openAddressModal = (addr: any = null) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        label: addr.label,
        region: addr.region || '',
        city: addr.city,
        sub_city: addr.sub_city || '',
        street: addr.street,
        details: addr.details || '',
        phone: addr.phone || ''
      });
    } else {
      setEditingAddress(null);
      setAddressForm({ label: '', region: '', city: '', sub_city: '', street: '', details: '', phone: '' });
    }
    setAddressModalOpen(true);
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted">
        <div className="w-10 h-10 border-4 border-[#6b4cff]/30 border-t-[#6b4cff] rounded-full animate-spin"></div>
        <p className="mt-4 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base text-muted">
      {/* Header section */}
      <div className="p-6 pb-2 border-b border-subtle bg-surface-alt">
        <h1 className="text-2xl font-bold text-main mb-2">My Profile</h1>
        <p className="text-sm">Manage your personal information and account settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <div className="bg-surface-alt rounded-2xl border border-subtle p-4 mb-4 text-center">
            <div className="w-20 h-20 bg-[#6b4cff]/20 text-[#6b4cff] rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3 border border-[#6b4cff]/30">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-main font-bold">{profile?.name}</h2>
            <p className="text-xs text-muted mt-1 break-all">{profile?.email}</p>
          </div>

          {[
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#6b4cff] text-white shadow-lg shadow-[#6b4cff]/20'
                  : 'bg-transparent text-muted hover:bg-surface-alt hover:text-main'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface-alt rounded-2xl border border-subtle overflow-y-auto custom-scrollbar relative">
          
          {message && (
            <div className={`absolute top-4 right-4 z-10 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg ${
              message.type === 'success' ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <div className="p-6 md:p-8 max-w-3xl mx-auto">
            {activeTab === 'personal' && (
              <form onSubmit={handleUpdatePersonal} className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-[#6b4cff]" />
                  <h2 className="text-xl font-bold text-main">Personal Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={personalInfo.name}
                      onChange={e => setPersonalInfo({...personalInfo, name: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={personalInfo.email}
                      onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={personalInfo.phone}
                      onChange={e => setPersonalInfo({...personalInfo, phone: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-subtle-hover">
                  <button type="submit" className="px-6 py-3 bg-[#6b4cff] hover:bg-[#5a3ee0] text-white rounded-xl font-bold transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="w-6 h-6 text-[#6b4cff]" />
                  <h2 className="text-xl font-bold text-main">Security & Password</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-3 text-main focus:outline-none focus:border-[#6b4cff] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-subtle-hover">
                  <button type="submit" className="px-6 py-3 bg-[#6b4cff] hover:bg-[#5a3ee0] text-white rounded-xl font-bold transition-colors">
                    Change Password
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-6 h-6 text-[#6b4cff]" />
                  <h2 className="text-xl font-bold text-main">Notification Preferences</h2>
                </div>

                {preferences && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface-alt border border-subtle rounded-xl">
                      <div>
                        <h3 className="font-bold text-main">Order Updates</h3>
                        <p className="text-sm text-muted">Receive updates about your order status</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={preferences.order_updates} onChange={e => handleUpdatePreferences('order_updates', e.target.checked)} />
                        <div className="w-11 h-6 bg-surface-alt peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-alt border border-subtle rounded-xl">
                      <div>
                        <h3 className="font-bold text-main">Prescription Updates</h3>
                        <p className="text-sm text-muted">Get notified when your prescription is approved or rejected</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={preferences.prescription_updates} onChange={e => handleUpdatePreferences('prescription_updates', e.target.checked)} />
                        <div className="w-11 h-6 bg-surface-alt peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-alt border border-subtle rounded-xl">
                      <div>
                        <h3 className="font-bold text-main">Promotional Updates</h3>
                        <p className="text-sm text-muted">Receive discounts and offers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={preferences.promotional_updates} onChange={e => handleUpdatePreferences('promotional_updates', e.target.checked)} />
                        <div className="w-11 h-6 bg-surface-alt peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-[#6b4cff]" />
                    <h2 className="text-xl font-bold text-main">Delivery Addresses</h2>
                  </div>
                  <button onClick={() => openAddressModal()} className="flex items-center gap-2 px-4 py-2 bg-[#6b4cff] text-white rounded-xl font-bold hover:bg-[#5a3ee0] transition-colors">
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12 bg-surface-alt rounded-xl border border-subtle">
                    <MapPin className="w-12 h-12 text-[#6b4cff]/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-main mb-2">No addresses saved</h3>
                    <p className="text-muted">Add a delivery address to checkout faster next time.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`p-4 rounded-xl border ${addr.is_default ? 'bg-[#6b4cff]/5 border-[#6b4cff]/30' : 'bg-surface-alt border-subtle'} flex flex-col sm:flex-row justify-between gap-4`}>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-main">{addr.label}</h3>
                            {addr.is_default && (
                              <span className="text-xs font-bold px-2 py-0.5 bg-[#00e5ff]/20 text-[#00e5ff] rounded-md border border-[#00e5ff]/30">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-muted mb-1">{addr.street}{addr.sub_city ? `, ${addr.sub_city}` : ''}</p>
                          <p className="text-sm text-muted mb-1">{addr.city}{addr.region ? `, ${addr.region}` : ''}</p>
                          {addr.phone && <p className="text-sm text-muted flex items-center gap-1"><Phone className="w-3 h-3" /> {addr.phone}</p>}
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          <button onClick={() => openAddressModal(addr)} className="text-muted hover:text-[#00e5ff] transition-colors p-2 rounded-lg hover:bg-[#00e5ff]/10">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-muted hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefaultAddress(addr.id)} className="text-xs font-bold text-[#6b4cff] hover:text-white transition-colors py-1 px-2 border border-[#6b4cff]/30 rounded-lg hover:bg-[#6b4cff]/20 mt-auto">
                              Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-alt rounded-2xl w-full max-w-lg overflow-hidden border border-subtle-hover shadow-2xl">
            <div className="p-6 border-b border-subtle flex justify-between items-center">
              <h2 className="text-xl font-bold text-main">{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
              <button onClick={() => setAddressModalOpen(false)} className="text-muted hover:text-main">✕</button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-main mb-1">Label (e.g. Home, Office)</label>
                <input required type="text" value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#6b4cff]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-main mb-1">City</label>
                  <input required type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#6b4cff]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-main mb-1">Region / State</label>
                  <input type="text" value={addressForm.region} onChange={e => setAddressForm({...addressForm, region: e.target.value})} className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#6b4cff]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-main mb-1">Sub-city / Area</label>
                  <input type="text" value={addressForm.sub_city} onChange={e => setAddressForm({...addressForm, sub_city: e.target.value})} className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#6b4cff]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-main mb-1">Phone Number (optional)</label>
                  <input type="tel" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#6b4cff]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-main mb-1">Street Address</label>
                <input required type="text" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#6b4cff]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-main mb-1">Additional Details (Apt, Suite, Building)</label>
                <input type="text" value={addressForm.details} onChange={e => setAddressForm({...addressForm, details: e.target.value})} className="w-full bg-surface-alt border border-subtle-hover rounded-xl px-4 py-2.5 text-main focus:outline-none focus:border-[#6b4cff]" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAddressModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-surface-alt hover:bg-white/10 border border-subtle-hover transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#6b4cff] hover:bg-[#5a3ee0] transition-colors">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfileTab;
