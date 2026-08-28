import { formatCurrency } from '../../../utils/currency';
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, XCircle, User, Phone, Mail, ShoppingBag, FileText, AlertCircle, FileImage, Download } from 'lucide-react';

interface PrescriptionDetailsModalProps {
  prescriptionId: number;
  onClose: () => void;
}

export default function PrescriptionDetailsModal({ prescriptionId, onClose }: PrescriptionDetailsModalProps) {
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    fetchPrescriptionDetails();
    fetchPrescriptionFile();
  }, [prescriptionId]);

  const fetchPrescriptionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/admin/prescriptions/${prescriptionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch prescription details');
      const data = await res.json();
      setPrescription(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptionFile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/admin/prescriptions/${prescriptionId}/file`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load document');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch (err: any) {
      setFileError(err.message);
    } finally {
      setFileLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium flex items-center w-fit"><Clock className="w-4 h-4 mr-2"/> Pending Review</span>;
      case 'approved': return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium flex items-center w-fit"><CheckCircle2 className="w-4 h-4 mr-2"/> Approved</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium flex items-center w-fit"><XCircle className="w-4 h-4 mr-2"/> Rejected</span>;
      default: return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-sm font-medium flex items-center w-fit">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1a1829] border border-white/10 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-[#9b51e0] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1a1829] border border-white/10 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Prescription</h2>
            <p className="text-[#a09eb5]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1829] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#232136]">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h2 className="text-2xl font-bold text-white">Prescription #{prescription.id}</h2>
              {getStatusBadge(prescription.status)}
            </div>
            <p className="text-[#a09eb5] text-sm">
              Submitted on {new Date(prescription.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[#a09eb5] hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Info */}
            <div className="space-y-8">
              
              {/* Customer Info */}
              <div className="bg-[#232136] rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#9b51e0]" />
                  Customer Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#a09eb5]">Name</span>
                    <span className="text-white font-medium">{prescription.customer_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#a09eb5]">Email</span>
                    <div className="flex items-center text-white font-medium">
                      <Mail className="w-4 h-4 mr-2 text-[#a09eb5]" />
                      {prescription.customer_email}
                    </div>
                  </div>
                  {prescription.customer_phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#a09eb5]">Phone</span>
                      <div className="flex items-center text-white font-medium">
                        <Phone className="w-4 h-4 mr-2 text-[#a09eb5]" />
                        {prescription.customer_phone}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-[#232136] rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-[#9b51e0]" />
                  Related Order
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#a09eb5]">Order ID</span>
                    <span className="text-white font-medium">#{prescription.order_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#a09eb5]">Status</span>
                    <span className="text-white capitalize">{prescription.order_status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#a09eb5]">Total Amount</span>
                    <span className="text-green-400 font-bold">{formatCurrency(prescription.total_amount)}</span>
                  </div>
                  
                  {/* Prescription Drugs in this order */}
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <h4 className="text-sm font-bold text-[#a09eb5] mb-3">Prescription-Required Drugs in Order</h4>
                    {prescription.ordered_drugs && prescription.ordered_drugs.length > 0 ? (
                      <ul className="space-y-2">
                        {prescription.ordered_drugs.map((drug: any) => (
                          <li key={drug.order_item_id} className="flex justify-between items-center bg-[#110f22] p-3 rounded-lg border border-white/5">
                            <div>
                              <div className="text-white text-sm font-medium">{drug.drug_name}</div>
                              {drug.generic_name && <div className="text-[#a09eb5] text-xs">{drug.generic_name}</div>}
                            </div>
                            <div className="text-right">
                              <div className="text-white text-sm">Qty: {drug.quantity}</div>
                              <div className="text-[#a09eb5] text-xs">${drug.unit_price} each</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#a09eb5] italic">No prescription-required drugs found in this order.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Info */}
              <div className="bg-[#232136] rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-[#9b51e0]" />
                  Pharmacist Review
                </h3>
                {prescription.pharmacist_name ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#a09eb5]">Reviewed By</span>
                      <span className="text-white font-medium">{prescription.pharmacist_name}</span>
                    </div>
                    {prescription.updated_at && prescription.updated_at !== prescription.created_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#a09eb5]">Review Date</span>
                        <span className="text-white font-medium">{new Date(prescription.updated_at).toLocaleString()}</span>
                      </div>
                    )}
                    {prescription.status === 'rejected' && prescription.review_notes && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <span className="block text-red-400 text-sm font-bold mb-1">Rejection Reason</span>
                        <p className="text-white text-sm">{prescription.review_notes}</p>
                      </div>
                    )}
                    {prescription.status === 'approved' && prescription.review_notes && (
                      <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <span className="block text-green-400 text-sm font-bold mb-1">Approval Notes</span>
                        <p className="text-white text-sm">{prescription.review_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-[#110f22] rounded-xl border border-white/5 border-dashed">
                    <Clock className="w-8 h-8 text-[#a09eb5] mx-auto mb-2 opacity-50" />
                    <p className="text-[#a09eb5] text-sm">Awaiting Pharmacist Review</p>
                    <p className="text-xs text-[#a09eb5]/70 mt-1">Admin oversight only.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Document Viewer */}
            <div className="bg-[#232136] rounded-xl border border-white/5 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#110f22]/50">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FileImage className="w-5 h-5 mr-2 text-[#9b51e0]" />
                  Prescription Document
                </h3>
                {fileUrl && (
                  <a 
                    href={fileUrl} 
                    download={`Prescription_${prescription.id}`}
                    className="flex items-center px-3 py-1.5 bg-[#9b51e0]/10 text-[#9b51e0] hover:bg-[#9b51e0] hover:text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                )}
              </div>
              <div className="flex-1 p-6 flex flex-col justify-center items-center min-h-[500px] bg-[#110f22]">
                {fileLoading ? (
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#9b51e0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#a09eb5]">Loading secure document...</p>
                  </div>
                ) : fileError ? (
                  <div className="text-center max-w-md">
                    <FileImage className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-80" />
                    <h4 className="text-lg font-bold text-white mb-2">Document Unavailable</h4>
                    <p className="text-[#a09eb5] text-sm p-4 bg-red-500/10 border border-red-500/20 rounded-xl">{fileError}</p>
                  </div>
                ) : fileUrl ? (
                  <div className="w-full h-full flex justify-center items-center rounded-xl overflow-hidden border border-white/10 bg-black/20">
                    <img 
                      src={fileUrl} 
                      alt={`Prescription ${prescription.id}`} 
                      className="max-w-full max-h-[600px] object-contain shadow-2xl"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
