import React, { useState, useEffect } from 'react';
import { Search, Calendar, Eye, Filter, RefreshCw, Activity } from 'lucide-react';
import { auditApi } from '../../../services/api';
import AuditLogDetailsModal from './AuditLogDetailsModal';

const AuditLogsTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await auditApi.getLogs({
                search: searchTerm,
                module: moduleFilter,
                from: dateFrom,
                to: dateTo
            });
            setLogs(data.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [moduleFilter, dateFrom, dateTo]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLogs();
    };

    const modules = ['Auth', 'Users', 'Drugs', 'Inventory', 'Purchase Orders', 'Promotions', 'Orders', 'Prescriptions', 'System'];

    const getActionBadgeColor = (action: string) => {
        const a = (action || '').toLowerCase();
        if (a.includes('create') || a.includes('add')) return 'bg-emerald-500/10 text-emerald-400';
        if (a.includes('update') || a.includes('change') || a.includes('adjust')) return 'bg-blue-500/10 text-blue-400';
        if (a.includes('delete') || a.includes('remove') || a.includes('cancel')) return 'bg-red-500/10 text-red-400';
        if (a.includes('login') || a.includes('logout') || a.includes('auth')) return 'bg-purple-500/10 text-purple-400';
        if (a.includes('view')) return 'bg-white/10 text-[#a09eb5]';
        return 'bg-white/10 text-[#a09eb5]';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
                    <p className="text-[#a09eb5]">Monitor system activity, user actions, and security events.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#232136] text-[#a09eb5] hover:text-white border border-white/5 hover:bg-white/5 rounded-xl font-medium transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            <div className="bg-[#232136] p-6 rounded-2xl border border-white/5 space-y-4">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09eb5]" size={20} />
                        <input
                            type="text"
                            placeholder="Search user, action, description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#110f22] border border-white/5 text-white rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors"
                        />
                    </div>
                    
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09eb5]" size={20} />
                        <select
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-[#110f22] border border-white/5 text-[#a09eb5] rounded-xl focus:outline-none focus:border-[#9b51e0] appearance-none transition-colors"
                        >
                            <option value="">All Modules</option>
                            {modules.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09eb5]" size={20} />
                            <input
                                type="date"
                                value={dateFrom}
                                max={dateTo || undefined}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-[#110f22] border border-white/5 text-[#a09eb5] rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors style-color-scheme-dark"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <span className="text-[#a09eb5]">to</span>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09eb5]" size={20} />
                            <input
                                type="date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-[#110f22] border border-white/5 text-[#a09eb5] rounded-xl focus:outline-none focus:border-[#9b51e0] transition-colors style-color-scheme-dark"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-2 bg-[#9b51e0] text-white font-bold rounded-xl hover:bg-[#8b45cd] transition-colors shadow-lg shadow-[#9b51e0]/20"
                    >
                        Search
                    </button>
                </form>
            </div>

            <div className="bg-[#232136] rounded-2xl border border-white/5 overflow-hidden">
                {error ? (
                    <div className="p-10 text-center text-red-400 bg-red-500/5">{error}</div>
                ) : loading ? (
                    <div className="p-10 text-center text-[#a09eb5]">Loading audit logs...</div>
                ) : logs.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-[#a09eb5]">
                            <Activity size={24} />
                        </div>
                        <div className="text-[#a09eb5]">No audit logs found.</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Module</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#a09eb5] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white font-medium">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-[#a09eb5]">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9b51e0]/20 to-[#7a39b7]/20 flex items-center justify-center text-[#9b51e0] font-bold text-xs">
                                                    {(log.username || 'S')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{log.username || 'System'}</div>
                                                    <div className="text-xs text-[#a09eb5] capitalize">{(log.role || '').replace('_', ' ')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 text-xs font-medium bg-white/5 text-[#a09eb5] rounded-full border border-white/10">
                                                {log.module || 'System'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white max-w-md truncate">
                                                {log.description}
                                            </div>
                                            {log.target_table && (
                                                <div className="text-xs text-[#a09eb5] mt-1 flex items-center space-x-1">
                                                    <span>Target: {log.target_table}</span>
                                                    {log.target_id && <span className="font-mono text-white/70">#{log.target_id}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-lg transition-colors inline-flex"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedLog && (
                <AuditLogDetailsModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
};

export default AuditLogsTab;
