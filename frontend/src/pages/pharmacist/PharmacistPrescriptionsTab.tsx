import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, FileText, AlertTriangle, Play, Download } from 'lucide-react';
import { prescriptionApi } from '../../services/api';

export default function PharmacistPrescriptionsTab({ navigationContext }: { navigationContext?: any }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Note: API currently doesn't implement pagination for prescriptions natively in controller
  // We'll handle basic display for now
  
  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await prescriptionApi.getPrescriptions({
        search: searchTerm,
        status: statusFilter,
        from: dateFilter === 'today' ? new Date().toISOString().split('T')[0] : ''
      });
      setPrescriptions(res);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    if (navigationContext?.contextId) {
      openPrescriptionDetails(navigationContext.contextId);
      if (navigationContext.search) {
        setSearchTerm(navigationContext.search);
      }
    }
  }, [navigationContext]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrescriptions();
  };

  const openPrescriptionDetails = async (id: number) => {
    try {
      const res = await prescriptionApi.getPrescriptionById(id);
      setSelectedPrescription(res);
      setIsViewModalOpen(true);
      setReviewNotes('');
      setIsRejecting(false);
      setActionError('');
    } catch (err: any) {
      alert(err.message || 'Failed to fetch prescription details');
    }
  };

  const handleStatusUpdate = async (newStatus: string, requireReason = false) => {
    if (!selectedPrescription) return;
    
    if (requireReason && !reviewNotes.trim()) {
      setActionError('A reason/note is required for this action.');
      return;
    }

    if (!window.confirm(`Are you sure you want to change the status to ${newStatus.toUpperCase()}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      await prescriptionApi.reviewPrescription(selectedPrescription.id, {
        status: newStatus,
        notes: reviewNotes
      });
      setIsViewModalOpen(false);
      fetchPrescriptions();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update prescription status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
      case 'under_review': return <span className="bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full text-xs font-bold">Under Review</span>;
      case 'approved': return <span className="bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-full text-xs font-bold">Approved</span>;
      case 'rejected': return <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-xs font-bold">Rejected</span>;
      default: return <span className="bg-gray-500/10 text-gray-400 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">Prescriptions Management</h1>
          <p className="text-muted">Review and validate customer prescriptions.</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-subtle p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Rx #, Customer Name, Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-base border border-subtle-hover rounded-xl py-3 pl-12 pr-4 text-main focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-base border border-subtle-hover rounded-xl py-3 px-4 text-main focus:outline-none focus:border-[#10b981] transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-base border border-subtle-hover rounded-xl py-3 px-4 text-main focus:outline-none focus:border-[#10b981] transition-colors"
          >
            <option value="">Any Time</option>
            <option value="today">Today</option>
          </select>

          <button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-main px-6 py-3 rounded-xl font-medium transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-2xl border border-subtle overflow-hidden">
        {loading && <div className="p-8 text-center text-muted">Loading prescriptions...</div>}
        {error && <div className="p-8 text-center text-red-400">{error}</div>}
        
        {!loading && !error && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-subtle">
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Rx #</th>
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Customer</th>
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Order #</th>
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Date Submitted</th>
                <th className="text-left py-4 px-6 text-muted font-medium text-sm">Status</th>
                <th className="text-right py-4 px-6 text-muted font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">No prescriptions found.</td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <tr key={rx.id} className="border-b border-subtle hover:bg-hover transition-colors">
                    <td className="py-4 px-6 text-main font-medium">#{rx.id}</td>
                    <td className="py-4 px-6">
                      <div className="text-main font-medium">{rx.customer_name}</div>
                      <div className="text-muted text-sm">{rx.customer_phone || rx.customer_email}</div>
                    </td>
                    <td className="py-4 px-6 text-main">#{rx.order_id}</td>
                    <td className="py-4 px-6 text-muted text-sm">{new Date(rx.created_at).toLocaleString()}</td>
                    <td className="py-4 px-6">{getStatusBadge(rx.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => openPrescriptionDetails(rx.id)}
                        className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Prescription Details Modal */}
      {isViewModalOpen && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-subtle-hover w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-subtle">
              <div>
                <h2 className="text-2xl font-bold text-main flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-[#10b981]" />
                  <span>Prescription #{selectedPrescription.id}</span>
                  {getStatusBadge(selectedPrescription.status)}
                </h2>
                <p className="text-muted text-sm mt-1">Submitted: {new Date(selectedPrescription.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-muted hover:text-main transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {actionError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{actionError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Left Column: Details */}
                <div className="space-y-6">
                  <div className="bg-base p-5 rounded-xl border border-subtle">
                    <h3 className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Customer Details</h3>
                    <div className="space-y-2">
                      <p className="text-main"><span className="text-muted mr-2">Name:</span> {selectedPrescription.customer_name}</p>
                      <p className="text-main"><span className="text-muted mr-2">Phone:</span> {selectedPrescription.customer_phone}</p>
                      <p className="text-main"><span className="text-muted mr-2">Email:</span> {selectedPrescription.customer_email}</p>
                    </div>
                  </div>
                  
                  <div className="bg-base p-5 rounded-xl border border-subtle">
                    <h3 className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Related Order #{selectedPrescription.order_id}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-main"><span className="text-muted mr-2">Order Status:</span> {selectedPrescription.order_status?.toUpperCase()}</p>
                      <p className="text-main"><span className="text-muted mr-2">Order Date:</span> {new Date(selectedPrescription.order_date).toLocaleString()}</p>
                    </div>

                    <h4 className="text-main font-medium mb-2">Prescribed Medicines Requested:</h4>
                    {selectedPrescription.ordered_drugs && selectedPrescription.ordered_drugs.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedPrescription.ordered_drugs.map((drug: any, idx: number) => (
                          <li key={idx} className="flex justify-between items-center bg-surface p-2 rounded border border-subtle">
                            <span className="text-main text-sm">{drug.drug_name} <span className="text-muted">({drug.generic_name})</span></span>
                            <span className="text-[#10b981] font-bold text-sm">Qty: {drug.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted text-sm">No prescription drugs found in this order.</p>
                    )}
                  </div>
                  
                  {selectedPrescription.review_notes && (
                    <div className="bg-base p-5 rounded-xl border border-subtle">
                      <h3 className="text-sm font-bold text-muted mb-2 uppercase tracking-wider">Review Notes</h3>
                      <p className="text-main text-sm whitespace-pre-line">{selectedPrescription.review_notes}</p>
                      {selectedPrescription.pharmacist_name && (
                         <p className="text-muted text-xs mt-2">- Reviewed by {selectedPrescription.pharmacist_name}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Document & Actions */}
                <div className="flex flex-col h-full space-y-6">
                  <div className="bg-base rounded-xl border border-subtle p-1 flex-1 min-h-[300px] flex flex-col">
                     <div className="p-3 border-b border-subtle flex justify-between items-center bg-base rounded-t-xl">
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Prescription Document</h3>
                        <a 
                          href={prescriptionApi.getPrescriptionFileUrl(selectedPrescription.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>View Original</span>
                        </a>
                     </div>
                     <div className="flex-1 bg-black/20 flex items-center justify-center p-2 rounded-b-xl overflow-hidden relative">
                         <img 
                            src={prescriptionApi.getPrescriptionFileUrl(selectedPrescription.id)} 
                            alt="Prescription Document" 
                            className="max-w-full max-h-[400px] object-contain rounded"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/232136/a09eb5?text=Preview+Not+Available';
                            }}
                         />
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-base rounded-xl border border-subtle p-6 flex flex-col space-y-4 shrink-0">
                    <h3 className="text-main font-bold text-lg mb-2">Review Actions</h3>
                    
                    {selectedPrescription.status === 'pending' ? (
                      <button 
                        onClick={() => handleStatusUpdate('under_review')}
                        disabled={actionLoading}
                        className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Review</span>
                      </button>
                    ) : selectedPrescription.status === 'under_review' ? (
                      isRejecting ? (
                        <div className="w-full space-y-3">
                          <textarea 
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Enter rejection reason (required)..."
                            className="w-full bg-surface border border-red-500/30 rounded-xl py-3 px-4 text-main focus:outline-none focus:border-red-500 min-h-[80px]"
                          />
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleStatusUpdate('rejected', true)}
                              disabled={actionLoading}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                              Confirm Rejection
                            </button>
                            <button 
                              onClick={() => setIsRejecting(false)}
                              disabled={actionLoading}
                              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <textarea 
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add optional notes for approval/rejection..."
                            className="w-full bg-surface border border-subtle-hover rounded-xl py-2 px-4 text-main focus:outline-none focus:border-[#10b981] min-h-[60px]"
                          />
                          <div className="flex space-x-4">
                            <button 
                              onClick={() => handleStatusUpdate('approved')}
                              disabled={actionLoading}
                              className="flex-1 flex items-center justify-center space-x-2 bg-[#10b981] hover:bg-[#059669] text-main py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-5 h-5" />
                              <span>Approve</span>
                            </button>
                            <button 
                              onClick={() => setIsRejecting(true)}
                              disabled={actionLoading}
                              className="flex-1 flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-5 h-5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-3 bg-hover rounded-xl border border-subtle">
                        <p className="text-muted">This prescription has already been {selectedPrescription.status}. No further actions available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
