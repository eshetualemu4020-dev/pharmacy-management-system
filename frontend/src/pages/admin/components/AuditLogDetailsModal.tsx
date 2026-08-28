import React from 'react';
import { X, Clock, User, Box, Activity, FileText } from 'lucide-react';

interface AuditLogDetailsModalProps {
    log: any;
    onClose: () => void;
}

const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({ log, onClose }) => {
    
    // Safely parse JSON strings for old_value and new_value
    const parseValue = (val: string | null) => {
        if (!val) return null;
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    };

    const oldValue = parseValue(log.old_value);
    const newValue = parseValue(log.new_value);

    // Formatter for JSON viewing
    const JsonViewer = ({ data }: { data: any }) => {
        if (!data) return <span className="text-[#a09eb5] italic">None</span>;
        
        if (typeof data !== 'object') {
            return <span className="text-white">{String(data)}</span>;
        }

        return (
            <pre className="bg-[#110f22] p-4 rounded-xl text-sm text-[#a09eb5] overflow-x-auto whitespace-pre-wrap font-mono border border-white/5">
                {JSON.stringify(data, null, 2)}
            </pre>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#232136] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#9b51e0]/10 flex items-center justify-center text-[#9b51e0]">
                            <Activity size={20} />
                        </div>
                        Audit Log Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#110f22] p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-sm text-[#a09eb5] mb-2 font-medium">
                                <Clock size={16} /> Date & Time
                            </div>
                            <div className="text-white">
                                {new Date(log.created_at).toLocaleString()}
                            </div>
                        </div>

                        <div className="bg-[#110f22] p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-sm text-[#a09eb5] mb-2 font-medium">
                                <User size={16} /> User
                            </div>
                            <div className="text-white">
                                {log.username || 'System'} <span className="text-[#a09eb5] font-normal capitalize">({(log.role || 'N/A').replace('_', ' ')})</span>
                            </div>
                        </div>

                        <div className="bg-[#110f22] p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-sm text-[#a09eb5] mb-2 font-medium">
                                <Box size={16} /> Module / Target
                            </div>
                            <div className="text-white">
                                {log.module || 'System'}
                                {log.target_table && (
                                    <span className="text-[#a09eb5] font-normal block mt-1">
                                        Target: {log.target_table} {log.target_id ? <span className="font-mono text-white/80">#{log.target_id}</span> : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#110f22] p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-sm text-[#a09eb5] mb-2 font-medium">
                                <Activity size={16} /> Action
                            </div>
                            <div className="text-white font-medium">
                                {log.action}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-[#9b51e0]/10 p-5 rounded-xl border border-[#9b51e0]/20">
                        <div className="flex items-center gap-2 text-[#9b51e0] font-bold mb-2">
                            <FileText size={18} /> Description
                        </div>
                        <div className="text-white">
                            {log.description || <span className="text-[#a09eb5] italic">No description provided</span>}
                        </div>
                        {/* Fallback for old logs that used details column instead of description */}
                        {log.details && (
                            <div className="mt-3 pt-3 border-t border-[#9b51e0]/20 text-sm text-[#a09eb5]">
                                <span className="font-medium text-white/70">Raw Details:</span> {log.details}
                            </div>
                        )}
                    </div>

                    {/* State Changes */}
                    {(oldValue || newValue) && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                                State Changes
                            </h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="text-sm font-bold text-red-400 flex items-center gap-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        Previous State
                                    </div>
                                    <JsonViewer data={oldValue} />
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        New State
                                    </div>
                                    <JsonViewer data={newValue} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-white/10 bg-white/[0.02] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[#110f22] text-white border border-white/10 font-bold rounded-xl hover:bg-white/10 transition-colors"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogDetailsModal;
