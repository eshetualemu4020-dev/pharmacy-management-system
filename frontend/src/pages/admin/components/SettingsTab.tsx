import React, { useState, useEffect } from 'react';
import { 
    Building, Settings as SettingsIcon, ShoppingBag, Package, 
    CreditCard, Bell, Shield, Save, RefreshCw, AlertTriangle, Check
} from 'lucide-react';
import { settingsApi } from '../../../services/api';

const SETTING_TABS = [
    { id: 'pharmacy', label: 'Pharmacy Info', icon: Building },
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
];

const SettingsTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState('pharmacy');
    const [originalSettings, setOriginalSettings] = useState<Record<string, any>>({});
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [pendingTab, setPendingTab] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await settingsApi.getSettings();
            setOriginalSettings(data);
            setSettings(JSON.parse(JSON.stringify(data))); // Deep copy
        } catch (err: any) {
            setError(err.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    const handleTabChange = (tabId: string) => {
        if (hasChanges) {
            setPendingTab(tabId);
            setShowUnsavedWarning(true);
        } else {
            setActiveTab(tabId);
        }
    };

    const confirmTabChange = () => {
        setSettings(JSON.parse(JSON.stringify(originalSettings))); // Revert
        setShowUnsavedWarning(false);
        if (pendingTab) setActiveTab(pendingTab);
        setPendingTab(null);
    };

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        if (successMsg) setSuccessMsg(null);
        if (error) setError(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);
        try {
            await settingsApi.updateSettings(settings);
            setOriginalSettings(JSON.parse(JSON.stringify(settings)));
            setSuccessMsg('Settings saved successfully');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const renderInput = (key: string, label: string, type: string = 'text', placeholder?: string) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-[#a09eb5] mb-2">{label}</label>
            <input
                type={type}
                value={settings[key] || ''}
                onChange={(e) => handleChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2 bg-[#110f22] border border-white/10 text-white rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
            />
        </div>
    );

    const renderToggle = (key: string, label: string, description?: string) => (
        <div className="flex items-center justify-between p-4 bg-[#110f22] border border-white/5 rounded-xl mb-4">
            <div>
                <div className="font-medium text-white">{label}</div>
                {description && <div className="text-sm text-[#a09eb5]">{description}</div>}
            </div>
            <button
                type="button"
                onClick={() => handleChange(key, !settings[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] ? 'bg-[#9b51e0]' : 'bg-gray-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    const renderSelect = (key: string, label: string, options: { value: string, label: string }[]) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-[#a09eb5] mb-2">{label}</label>
            <select
                value={settings[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-4 py-2 bg-[#110f22] border border-white/10 text-white rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors appearance-none"
            >
                <option value="" disabled>Select {label}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );

    if (loading) {
        return <div className="p-10 text-center text-[#a09eb5]">Loading settings...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
                    <p className="text-[#a09eb5]">Manage pharmacy-wide configurations and preferences.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    {hasChanges && (
                        <span className="text-amber-400 text-sm font-medium animate-pulse">
                            Unsaved changes
                        </span>
                    )}
                    <button
                        onClick={fetchSettings}
                        disabled={saving}
                        className="p-2.5 bg-[#232136] text-[#a09eb5] hover:text-white border border-white/5 rounded-xl transition-colors"
                        title="Reload from server"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-colors shadow-lg
                            ${hasChanges && !saving 
                                ? 'bg-[#9b51e0] hover:bg-[#8b45cd] text-white shadow-[#9b51e0]/20' 
                                : 'bg-[#232136] text-gray-500 border border-white/5 shadow-none'}`}
                    >
                        {saving ? (
                            <RefreshCw size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
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

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-[#232136] rounded-2xl border border-white/5 p-3 flex flex-col gap-1">
                        {SETTING_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left
                                        ${isActive 
                                            ? 'bg-[#9b51e0]/10 text-[#9b51e0]' 
                                            : 'text-[#a09eb5] hover:bg-white/5 hover:text-white'}`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-[#232136] rounded-2xl border border-white/5 p-8">
                    {activeTab === 'pharmacy' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Pharmacy Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput('pharmacy_name', 'Pharmacy Name')}
                                {renderInput('phone_number', 'Phone Number')}
                                {renderInput('email_address', 'Email Address', 'email')}
                                {renderInput('city', 'City')}
                                {renderInput('country', 'Country')}
                            </div>
                            {renderInput('address', 'Full Address')}
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">General Preferences</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderSelect('currency', 'Currency', [
                                    { value: 'USD', label: 'US Dollar (USD)' },
                                    { value: 'ETB', label: 'Ethiopian Birr (ETB)' },
                                    { value: 'EUR', label: 'Euro (EUR)' },
                                    { value: 'GBP', label: 'British Pound (GBP)' },
                                    { value: 'CAD', label: 'Canadian Dollar (CAD)' }
                                ])}
                                {renderSelect('timezone', 'Timezone', [
                                    { value: 'UTC', label: 'UTC' },
                                    { value: 'America/New_York', label: 'Eastern Time (ET)' },
                                    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                                    { value: 'Europe/London', label: 'London (GMT/BST)' }
                                ])}
                                {renderSelect('date_format', 'Date Format', [
                                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-08-27)' },
                                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (27/08/2026)' },
                                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (08/27/2026)' }
                                ])}
                                {renderSelect('time_format', 'Time Format', [
                                    { value: '24h', label: '24-hour (14:30)' },
                                    { value: '12h', label: '12-hour (02:30 PM)' }
                                ])}
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Order Settings</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput('min_order_amount', 'Minimum Order Amount ($)', 'number')}
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Inventory Operations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput('low_stock_threshold', 'Global Low Stock Threshold (units)', 'number')}
                                {renderInput('expiry_warning_days', 'Expiry Warning Period (days)', 'number')}
                            </div>
                            <p className="text-sm text-[#a09eb5] mt-4">
                                These global thresholds apply to all drugs unless overridden on a per-drug basis.
                            </p>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Payment Methods</h2>
                            <p className="text-[#a09eb5] mb-4">Toggle the payment methods you wish to accept in-store.</p>
                            
                            <div className="space-y-2 max-w-md">
                                <div className="flex items-center justify-between p-4 bg-[#110f22] border border-white/5 rounded-xl mb-4">
                                    <div className="font-medium text-white">Cash</div>
                                    <div className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">Always Enabled</div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-[#110f22] border border-white/5 rounded-xl mb-4">
                                    <div className="font-medium text-white">Credit / Debit Card</div>
                                    <div className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">Enabled</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">System Notifications</h2>
                            <div className="max-w-xl">
                                {renderToggle('notify_low_stock', 'Low Stock Alerts', 'Receive dashboard notifications when a drug falls below the threshold')}
                                {renderToggle('notify_expiry', 'Expiry Alerts', 'Receive alerts for drugs expiring soon')}
                                {renderToggle('notify_new_order', 'New Customer Orders', 'Notify admins when a customer places an online order')}
                                {renderToggle('notify_prescription', 'Prescription Submissions', 'Notify when a new prescription requires pharmacist review')}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Security Preferences</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput('session_timeout', 'Session Timeout (minutes)', 'number')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Unsaved Changes Modal */}
            {showUnsavedWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#232136] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 text-amber-400 mb-4">
                            <AlertTriangle size={24} />
                            <h3 className="text-xl font-bold text-white">Unsaved Changes</h3>
                        </div>
                        <p className="text-[#a09eb5] mb-6">
                            You have unsaved changes in the current tab. If you leave now, your changes will be lost.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowUnsavedWarning(false);
                                    setPendingTab(null);
                                }}
                                className="px-5 py-2.5 text-[#a09eb5] hover:text-white font-medium transition-colors"
                            >
                                Continue Editing
                            </button>
                            <button
                                onClick={confirmTabChange}
                                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-xl transition-colors"
                            >
                                Discard Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsTab;
